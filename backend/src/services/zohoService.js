const axios = require('axios');

let tokenCache = {
  token: null,
  expiresAt: 0,
};

/**
 * Get a valid Zoho Books access token.
 * Refreshes it if it's expired or missing.
 */
async function getAccessToken() {
  const now = Date.now();
  if (tokenCache.token && tokenCache.expiresAt > now + 60000) {
    return tokenCache.token;
  }

  const apiDomain = process.env.ZOHO_API_DOMAIN || 'https://www.zohoapis.eu';
  const accountsUrl = apiDomain.replace('www.zohoapis', 'accounts.zoho') + '/oauth/v2/token';

  try {
    const response = await axios.post(accountsUrl, null, {
      params: {
        refresh_token: process.env.ZOHO_REFRESH_TOKEN,
        client_id: process.env.ZOHO_CLIENT_ID,
        client_secret: process.env.ZOHO_CLIENT_SECRET,
        grant_type: 'refresh_token',
      }
    });

    const data = response.data;
    if (data.access_token) {
      tokenCache.token = data.access_token;
      // expires_in is usually in seconds
      tokenCache.expiresAt = now + data.expires_in * 1000;
      return tokenCache.token;
    } else {
      throw new Error('No access token returned from Zoho: ' + JSON.stringify(data));
    }
  } catch (error) {
    console.error('Error refreshing Zoho token:', error.response?.data || error.message);
    throw new Error('Failed to obtain Zoho access token');
  }
}

/**
 * Creates a manual journal entry in Zoho Books.
 * @param {string} date - 'YYYY-MM-DD'
 * @param {string} referenceNumber - e.g., 'DEP-1234'
 * @param {string} notes - Description of the journal entry
 * @param {Array<{account_id: string, debit_or_credit: 'debit'|'credit', amount: number}>} lineItems
 */
async function createJournalEntry(date, referenceNumber, notes, lineItems) {
  try {
    const token = await getAccessToken();
    const apiUrl = `${process.env.ZOHO_API_DOMAIN}/books/v3/journals`;

    const payload = {
      journal_date: date,
      reference_number: referenceNumber,
      notes: notes,
      line_items: lineItems.map((item) => ({
        account_id: item.account_id,
        debit_or_credit: item.debit_or_credit,
        amount: item.amount,
      })),
    };

    const response = await axios.post(apiUrl, payload, {
      params: {
        organization_id: process.env.ZOHO_ORG_ID,
      },
      headers: {
        Authorization: `Zoho-oauthtoken ${token}`,
        'Content-Type': 'application/json',
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error creating Zoho journal entry:', error.response?.data || error.message);
    throw new Error('Failed to create journal entry in Zoho Books');
  }
}

// ─── Wrapper Functions for Events ──────────────────────────────────────────────

function getTodayDate() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function roundZohoAmount(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

async function syncDeposit(userId, amount, transactionId) {
  const bankClearing = process.env.ZOHO_ACCOUNT_BANK_CLEARING;
  const walletLiability = process.env.ZOHO_ACCOUNT_WALLET_LIABILITY;
  
  if (!bankClearing || !walletLiability) return; // Skip if accounts not configured

  const lineItems = [
    { account_id: bankClearing, debit_or_credit: 'debit', amount },
    { account_id: walletLiability, debit_or_credit: 'credit', amount },
  ];

    return createJournalEntry(
      getTodayDate(),
      `DEP-${transactionId}`,
      `User Deposit - User ${userId}`,
      lineItems
    ).then(res => {
      // Auto-publish the draft journal entry
      const journalId = res.journal?.journal_id;
      if (journalId) {
        return axios.post(
          `${process.env.ZOHO_API_DOMAIN}/books/v3/journals/${journalId}/status/published`,
          null,
          {
            params: { organization_id: process.env.ZOHO_ORG_ID },
            headers: { Authorization: `Zoho-oauthtoken ${tokenCache.token}` }
          }
        ).catch(e => console.error('Failed to publish deposit journal:', e.message));
      }
    });
}

async function syncStake(userId, amount, gameId) {
  const walletLiability = process.env.ZOHO_ACCOUNT_WALLET_LIABILITY;
  const entryFeeRevenue = process.env.ZOHO_ACCOUNT_ENTRY_FEE_REVENUE;

  if (!walletLiability || !entryFeeRevenue) return;

  const lineItems = [
    { account_id: walletLiability, debit_or_credit: 'debit', amount },
    { account_id: entryFeeRevenue, debit_or_credit: 'credit', amount },
  ];

    return createJournalEntry(
      getTodayDate(),
      `STK-${gameId}`,
      `Game Stake - User ${userId}`,
      lineItems
    ).then(res => {
      const journalId = res.journal?.journal_id;
      if (journalId) {
        return axios.post(`${process.env.ZOHO_API_DOMAIN}/books/v3/journals/${journalId}/status/published`, null, {
          params: { organization_id: process.env.ZOHO_ORG_ID },
          headers: { Authorization: `Zoho-oauthtoken ${tokenCache.token}` }        }).catch(e => console.error('Failed to publish stake journal:', e.message));
      }
    });
}

async function syncPayout(userId, amount, gameId, extras = {}) {
  const payoutsExpense = process.env.ZOHO_ACCOUNT_PAYOUTS_EXPENSE;
  const walletLiability = process.env.ZOHO_ACCOUNT_WALLET_LIABILITY;
  const taxAccount = process.env.ZOHO_ACCOUNT_TAX_PAYABLE || process.env.ZOHO_ACCOUNT_WIN_TAX_INCOME;

  if (!payoutsExpense || !walletLiability) return;

  const gross = roundZohoAmount(amount);
  const taxAmount = roundZohoAmount(extras.taxAmount || 0);
  const netAmount = extras.netAmount != null
    ? roundZohoAmount(extras.netAmount)
    : roundZohoAmount(gross - taxAmount);

  const lineItems = [
    { account_id: payoutsExpense, debit_or_credit: 'debit', amount: gross },
  ];

  if (taxAmount > 0 && taxAccount) {
    // Withhold tax from winnings: player wallet gets net, tax authority liability gets the 5%.
    lineItems.push({ account_id: walletLiability, debit_or_credit: 'credit', amount: netAmount });
    lineItems.push({ account_id: taxAccount, debit_or_credit: 'credit', amount: taxAmount });
  } else {
    lineItems.push({ account_id: walletLiability, debit_or_credit: 'credit', amount: gross });
  }

  const scoreLabel = extras.score != null ? `${extras.score}/10` : 'game';
  const winningsLabel = extras.taxableWinnings != null ? ` winnings ₦${roundZohoAmount(extras.taxableWinnings).toFixed(2)}` : '';
  const taxLabel = taxAmount > 0 ? `, tax ₦${taxAmount.toFixed(2)} withheld (stake not taxed), net ₦${netAmount.toFixed(2)}` : '';

  return createJournalEntry(
    getTodayDate(),
    `PAY-${gameId}`,
    `Game payout ${scoreLabel} - User ${userId} - gross ₦${gross.toFixed(2)}${winningsLabel}${taxLabel}`,
    lineItems
  ).then(res => {
    const journalId = res.journal?.journal_id;
    if (journalId) {
      return axios.post(`${process.env.ZOHO_API_DOMAIN}/books/v3/journals/${journalId}/status/published`, null, {
        params: { organization_id: process.env.ZOHO_ORG_ID },
        headers: { Authorization: `Zoho-oauthtoken ${tokenCache.token}` }        }).catch(e => console.error('Failed to publish payout journal:', e.message));
    }
  });
}

async function syncReferralBonus(userId, amount, referralId) {
  const referralExpense = process.env.ZOHO_ACCOUNT_REFERRAL_EXPENSE;
  const walletLiability = process.env.ZOHO_ACCOUNT_WALLET_LIABILITY;

  if (!referralExpense || !walletLiability) return;

  const lineItems = [
    { account_id: referralExpense, debit_or_credit: 'debit', amount },
    { account_id: walletLiability, debit_or_credit: 'credit', amount },
  ];

    return createJournalEntry(
      getTodayDate(),
      `REF-${referralId}`,
      `Referral Bonus - User ${userId}`,
      lineItems
    ).then(res => {
      const journalId = res.journal?.journal_id;
      if (journalId) {
        return axios.post(`${process.env.ZOHO_API_DOMAIN}/books/v3/journals/${journalId}/status/published`, null, {
          params: { organization_id: process.env.ZOHO_ORG_ID },
          headers: { Authorization: `Zoho-oauthtoken ${tokenCache.token}` }        }).catch(e => console.error('Failed to publish referral journal:', e.message));
      }
    });
}

async function syncWinTax(userId, amount, gameId, extras = {}) {
  const walletLiability = process.env.ZOHO_ACCOUNT_WALLET_LIABILITY;
  const taxAccount = process.env.ZOHO_ACCOUNT_TAX_PAYABLE || process.env.ZOHO_ACCOUNT_WIN_TAX_INCOME;

  if (!walletLiability || !taxAccount) return;

  const taxAmount = roundZohoAmount(amount);
  if (!(taxAmount > 0)) return;

  const lineItems = [
    { account_id: walletLiability, debit_or_credit: 'debit', amount: taxAmount },
    { account_id: taxAccount, debit_or_credit: 'credit', amount: taxAmount },
  ];

  const winningsNote = extras.taxableWinnings != null
    ? ` on ₦${roundZohoAmount(extras.taxableWinnings).toFixed(2)} winnings`
    : '';
  const scoreNote = extras.score != null ? ` (${extras.score}/10)` : '';

  return createJournalEntry(
    getTodayDate(),
    `TAX-${gameId}`,
    `Win tax withheld${scoreNote}${winningsNote} - User ${userId} (stake not taxed)`,
    lineItems
  ).then(res => {
    const journalId = res.journal?.journal_id;
    if (journalId) {
      return axios.post(`${process.env.ZOHO_API_DOMAIN}/books/v3/journals/${journalId}/status/published`, null, {
        params: { organization_id: process.env.ZOHO_ORG_ID },
        headers: { Authorization: `Zoho-oauthtoken ${tokenCache.token}` }        }).catch(e => console.error('Failed to publish tax journal:', e.message));
    }
  });
}

async function syncWithdrawalRequest(userId, totalAmount, feeAmount, transactionId) {
  const walletLiability = process.env.ZOHO_ACCOUNT_WALLET_LIABILITY;
  const pendingWithdrawals = process.env.ZOHO_ACCOUNT_PENDING_WITHDRAWALS;
  const serviceFees = process.env.ZOHO_ACCOUNT_PLATFORM_SERVICE_FEES;

  if (!walletLiability || !pendingWithdrawals) return;

  const transferAmount = totalAmount - feeAmount;
  
  const lineItems = [
    { account_id: walletLiability, debit_or_credit: 'debit', amount: totalAmount }
  ];

  if (transferAmount > 0) {
    lineItems.push({ account_id: pendingWithdrawals, debit_or_credit: 'credit', amount: transferAmount });
  }
  if (feeAmount > 0 && serviceFees) {
    lineItems.push({ account_id: serviceFees, debit_or_credit: 'credit', amount: feeAmount });
  }

  return createJournalEntry(
    getTodayDate(),
    `WREQ-${transactionId}`,
    `Withdrawal Request - User ${userId}`,
    lineItems
  ).then(res => {
    const journalId = res.journal?.journal_id;
    if (journalId) {
      return axios.post(`${process.env.ZOHO_API_DOMAIN}/books/v3/journals/${journalId}/status/published`, null, {
        params: { organization_id: process.env.ZOHO_ORG_ID },
        headers: { Authorization: `Zoho-oauthtoken ${tokenCache.token}` }      }).catch(e => console.error('Failed to publish wreq journal:', e.message));
    }
  });
}

async function syncWithdrawalSuccess(userId, transferAmount, transactionId) {
  const pendingWithdrawals = process.env.ZOHO_ACCOUNT_PENDING_WITHDRAWALS;
  const bankClearing = process.env.ZOHO_ACCOUNT_BANK_CLEARING;

  if (!pendingWithdrawals || !bankClearing) return;

  const lineItems = [
    { account_id: pendingWithdrawals, debit_or_credit: 'debit', amount: transferAmount },
    { account_id: bankClearing, debit_or_credit: 'credit', amount: transferAmount },
  ];

  return createJournalEntry(
    getTodayDate(),
    `WTH-${transactionId}`,
    `Withdrawal Processed - User ${userId}`,
    lineItems
  ).then(res => {
    const journalId = res.journal?.journal_id;
    if (journalId) {
      return axios.post(`${process.env.ZOHO_API_DOMAIN}/books/v3/journals/${journalId}/status/published`, null, {
        params: { organization_id: process.env.ZOHO_ORG_ID },
        headers: { Authorization: `Zoho-oauthtoken ${tokenCache.token}` }      }).catch(e => console.error('Failed to publish wth journal:', e.message));
    }
  });
}

async function syncWithdrawalFailed(userId, totalAmount, feeAmount, transactionId) {
  const walletLiability = process.env.ZOHO_ACCOUNT_WALLET_LIABILITY;
  const pendingWithdrawals = process.env.ZOHO_ACCOUNT_PENDING_WITHDRAWALS;
  const serviceFees = process.env.ZOHO_ACCOUNT_PLATFORM_SERVICE_FEES;

  if (!walletLiability || !pendingWithdrawals) return;

  const transferAmount = totalAmount - feeAmount;

  // Reverse the request
  const lineItems = [
    { account_id: walletLiability, debit_or_credit: 'credit', amount: totalAmount }
  ];

  if (transferAmount > 0) {
    lineItems.push({ account_id: pendingWithdrawals, debit_or_credit: 'debit', amount: transferAmount });
  }
  if (feeAmount > 0 && serviceFees) {
    lineItems.push({ account_id: serviceFees, debit_or_credit: 'debit', amount: feeAmount });
  }

  return createJournalEntry(
    getTodayDate(),
    `WFAIL-${transactionId}`,
    `Withdrawal Failed (Refund) - User ${userId}`,
    lineItems
  ).then(res => {
    const journalId = res.journal?.journal_id;
    if (journalId) {
      return axios.post(`${process.env.ZOHO_API_DOMAIN}/books/v3/journals/${journalId}/status/published`, null, {
        params: { organization_id: process.env.ZOHO_ORG_ID },
        headers: { Authorization: `Zoho-oauthtoken ${tokenCache.token}` }      }).catch(e => console.error('Failed to publish wfail journal:', e.message));
    }
  });
}

/**
 * Dispute grade correction: journal only the payout/tax/wallet deltas.
 * Positive grossDelta = additional prize expense; negative = reverse prior prize.
 */
async function syncPayoutCorrection(userId, {
  gameId,
  grossDelta = 0,
  taxDelta = 0,
  netDelta = 0,
  score,
  stake,
  taxableWinnings,
} = {}) {
  const payoutsExpense = process.env.ZOHO_ACCOUNT_PAYOUTS_EXPENSE;
  const walletLiability = process.env.ZOHO_ACCOUNT_WALLET_LIABILITY;
  const taxAccount = process.env.ZOHO_ACCOUNT_TAX_PAYABLE || process.env.ZOHO_ACCOUNT_WIN_TAX_INCOME;

  if (!payoutsExpense || !walletLiability) return;

  const gross = roundZohoAmount(grossDelta);
  const tax = roundZohoAmount(taxDelta);
  const net = roundZohoAmount(netDelta);
  if (gross === 0 && tax === 0 && net === 0) return;

  const lineItems = [];

  if (gross > 0) {
    lineItems.push({ account_id: payoutsExpense, debit_or_credit: 'debit', amount: gross });
  } else if (gross < 0) {
    lineItems.push({ account_id: payoutsExpense, debit_or_credit: 'credit', amount: Math.abs(gross) });
  }

  if (net > 0) {
    lineItems.push({ account_id: walletLiability, debit_or_credit: 'credit', amount: net });
  } else if (net < 0) {
    lineItems.push({ account_id: walletLiability, debit_or_credit: 'debit', amount: Math.abs(net) });
  }

  if (tax > 0 && taxAccount) {
    lineItems.push({ account_id: taxAccount, debit_or_credit: 'credit', amount: tax });
  } else if (tax < 0 && taxAccount) {
    lineItems.push({ account_id: taxAccount, debit_or_credit: 'debit', amount: Math.abs(tax) });
  }

  if (!lineItems.length) return;

  const scoreLabel = score != null ? `${score}/10` : 'corrected';
  const ref = `PAY-CORR-${gameId}-${Date.now()}`;
  const stakeNote = stake != null ? ` stake ₦${roundZohoAmount(stake).toFixed(2)}` : '';
  const winNote = taxableWinnings != null ? ` taxable ₦${roundZohoAmount(taxableWinnings).toFixed(2)}` : '';

  return createJournalEntry(
    getTodayDate(),
    ref,
    `Dispute payout correction ${scoreLabel} - User ${userId}${stakeNote}${winNote} - gross Δ ₦${gross.toFixed(2)}, tax Δ ₦${tax.toFixed(2)}, net Δ ₦${net.toFixed(2)}`,
    lineItems
  ).then(res => {
    const journalId = res.journal?.journal_id;
    if (journalId) {
      return axios.post(`${process.env.ZOHO_API_DOMAIN}/books/v3/journals/${journalId}/status/published`, null, {
        params: { organization_id: process.env.ZOHO_ORG_ID },
        headers: { Authorization: `Zoho-oauthtoken ${tokenCache.token}` },
      }).catch(e => console.error('Failed to publish payout correction journal:', e.message));
    }
  });
}

async function syncRefund(userId, amount, gameId) {
  const walletLiability = process.env.ZOHO_ACCOUNT_WALLET_LIABILITY;
  const refundsPayable = process.env.ZOHO_ACCOUNT_REFUNDS_PAYABLE;

  if (!walletLiability || !refundsPayable) return;

  const lineItems = [
    { account_id: refundsPayable, debit_or_credit: 'debit', amount },
    { account_id: walletLiability, debit_or_credit: 'credit', amount },
  ];

  return createJournalEntry(
    getTodayDate(),
    `RFND-${gameId}`,
    `Game Refund - User ${userId}`,
    lineItems
  ).then(res => {
    const journalId = res.journal?.journal_id;
    if (journalId) {
      return axios.post(`${process.env.ZOHO_API_DOMAIN}/books/v3/journals/${journalId}/status/published`, null, {
        params: { organization_id: process.env.ZOHO_ORG_ID },
        headers: { Authorization: `Zoho-oauthtoken ${tokenCache.token}` }      }).catch(e => console.error('Failed to publish refund journal:', e.message));
    }
  });
}

async function syncWalletBonus(userId, amount, adminId) {
  const walletLiability = process.env.ZOHO_ACCOUNT_WALLET_LIABILITY;
  const walletBonuses = process.env.ZOHO_ACCOUNT_WALLET_BONUSES;

  if (!walletLiability || !walletBonuses) return;

  const lineItems = [
    { account_id: walletBonuses, debit_or_credit: 'debit', amount },
    { account_id: walletLiability, debit_or_credit: 'credit', amount },
  ];

  return createJournalEntry(
    getTodayDate(),
    `BNS-${Date.now()}`,
    `Admin Wallet Bonus - User ${userId} by Admin ${adminId}`,
    lineItems
  ).then(res => {
    const journalId = res.journal?.journal_id;
    if (journalId) {
      return axios.post(`${process.env.ZOHO_API_DOMAIN}/books/v3/journals/${journalId}/status/published`, null, {
        params: { organization_id: process.env.ZOHO_ORG_ID },
        headers: { Authorization: `Zoho-oauthtoken ${tokenCache.token}` }      }).catch(e => console.error('Failed to publish bonus journal:', e.message));
    }
  });
}

module.exports = {
  getAccessToken,
  createJournalEntry,
  syncDeposit,
  syncStake,
  syncPayout,
  syncPayoutCorrection,
  syncReferralBonus,
  syncWinTax,
  syncWithdrawalRequest,
  syncWithdrawalSuccess,
  syncWithdrawalFailed,
  syncRefund,
  syncWalletBonus
};
