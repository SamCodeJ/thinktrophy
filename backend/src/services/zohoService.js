const axios = require('axios');
const { settlementLegs } = require('./accounting');

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

function accountsReady(pairs) {
  const missing = pairs.filter(([, id]) => !id).map(([name]) => name);
  if (!missing.length) return true;
  console.error(`Zoho journal skipped; set ${missing.join(', ')}`);
  return false;
}

function pushLine(lines, accountId, debitOrCredit, amount) {
  const value = roundZohoAmount(amount);
  if (value > 0 && accountId) {
    lines.push({ account_id: accountId, debit_or_credit: debitOrCredit, amount: value });
  }
}

function linesBalance(lines) {
  let debit = 0;
  let credit = 0;
  for (const line of lines) {
    if (line.debit_or_credit === 'debit') debit += line.amount;
    else credit += line.amount;
  }
  return Math.abs(roundZohoAmount(debit - credit)) < 0.001;
}

async function publishJournal(date, referenceNumber, notes, lineItems) {
  if (!lineItems.length || !linesBalance(lineItems)) {
    console.error(`Zoho journal ${referenceNumber} was not posted because it is empty or unbalanced`);
    return;
  }
  const res = await createJournalEntry(date, referenceNumber, notes, lineItems);
  const journalId = res.journal?.journal_id;
  if (!journalId) return res;
  await axios.post(
    `${process.env.ZOHO_API_DOMAIN}/books/v3/journals/${journalId}/status/published`,
    null,
    {
      params: { organization_id: process.env.ZOHO_ORG_ID },
      headers: { Authorization: `Zoho-oauthtoken ${tokenCache.token}` },
    }
  ).catch(e => console.error(`Failed to publish journal ${referenceNumber}:`, e.message));
  return res;
}

async function syncDeposit(userId, amount, transactionId, extras = {}) {
  const bankClearing = process.env.ZOHO_ACCOUNT_BANK_CLEARING;
  const walletLiability = process.env.ZOHO_ACCOUNT_WALLET_LIABILITY;
  const depositFees = process.env.ZOHO_ACCOUNT_DEPOSIT_FEES;

  if (!accountsReady([
    ['ZOHO_ACCOUNT_BANK_CLEARING', bankClearing],
    ['ZOHO_ACCOUNT_WALLET_LIABILITY', walletLiability],
  ])) return;

  const gross = roundZohoAmount(amount);
  if (!(gross > 0)) return;
  const fee = roundZohoAmount(extras.feeAmount || 0);
  const lineItems = [];

  if (fee > 0 && fee < gross && depositFees) {
    pushLine(lineItems, bankClearing, 'debit', gross - fee);
    pushLine(lineItems, depositFees, 'debit', fee);
    pushLine(lineItems, walletLiability, 'credit', gross);
  } else {
    if (fee > 0 && !depositFees) {
      console.error('ZOHO_ACCOUNT_DEPOSIT_FEES is not set; posting the deposit without the collection fee');
    }
    pushLine(lineItems, bankClearing, 'debit', gross);
    pushLine(lineItems, walletLiability, 'credit', gross);
  }

  const feeNote = fee > 0 && depositFees ? `, Flutterwave fee ₦${fee.toFixed(2)}` : '';
  return publishJournal(
    getTodayDate(),
    `DEP-${transactionId}`,
    `User Deposit - User ${userId} - gross ₦${gross.toFixed(2)}${feeNote}`,
    lineItems
  );
}

async function syncStake(userId, amount, gameId) {
  const walletLiability = process.env.ZOHO_ACCOUNT_WALLET_LIABILITY;
  const stakesHeld = process.env.ZOHO_ACCOUNT_STAKES_HELD;

  if (!accountsReady([
    ['ZOHO_ACCOUNT_WALLET_LIABILITY', walletLiability],
    ['ZOHO_ACCOUNT_STAKES_HELD', stakesHeld],
  ])) return;

  const stake = roundZohoAmount(amount);
  if (!(stake > 0)) return;

  return publishJournal(
    getTodayDate(),
    gameId,
    `Game stake held - User ${userId}`,
    [
      { account_id: walletLiability, debit_or_credit: 'debit', amount: stake },
      { account_id: stakesHeld, debit_or_credit: 'credit', amount: stake },
    ]
  );
}

async function syncGameSettlement(userId, {
  gameId,
  stake,
  grossPayout = 0,
  taxAmount = 0,
  netAmount = 0,
  score,
  reason,
} = {}) {
  const legs = settlementLegs({ stake, grossPayout, taxAmount, netAmount });
  if (!(legs.stakeAmount > 0)) return;
  if (!legs.balanced) {
    console.error('Zoho game settlement is unbalanced', { userId, gameId, ...legs });
    return;
  }

  const stakesHeld = process.env.ZOHO_ACCOUNT_STAKES_HELD;
  const winnings = process.env.ZOHO_ACCOUNT_PAYOUTS_EXPENSE;
  const revenue = process.env.ZOHO_ACCOUNT_FORFEITED_STAKES;
  const walletLiability = process.env.ZOHO_ACCOUNT_WALLET_LIABILITY;
  const taxAccount = process.env.ZOHO_ACCOUNT_TAX_PAYABLE || process.env.ZOHO_ACCOUNT_WIN_TAX_INCOME;

  const needed = [
    ['ZOHO_ACCOUNT_STAKES_HELD', stakesHeld],
    ['ZOHO_ACCOUNT_WALLET_LIABILITY', walletLiability],
  ];
  if (legs.winningsExpense > 0) needed.push(['ZOHO_ACCOUNT_PAYOUTS_EXPENSE', winnings]);
  if (legs.forfeitedRevenue > 0) needed.push(['ZOHO_ACCOUNT_FORFEITED_STAKES', revenue]);
  if (legs.tax > 0) needed.push(['ZOHO_ACCOUNT_TAX_PAYABLE', taxAccount]);
  if (!accountsReady(needed)) return;

  const lineItems = [];
  pushLine(lineItems, stakesHeld, 'debit', legs.stakeAmount);
  pushLine(lineItems, winnings, 'debit', legs.winningsExpense);
  pushLine(lineItems, walletLiability, 'credit', legs.net);
  pushLine(lineItems, taxAccount, 'credit', legs.tax);
  pushLine(lineItems, revenue, 'credit', legs.forfeitedRevenue);

  const label = reason === 'forfeit'
    ? `Stake forfeited - User ${userId}`
    : `Game settled ${score}/10 - User ${userId}`;

  return publishJournal(
    getTodayDate(),
    `PAY-${gameId}`,
    `${label} - stake ₦${legs.stakeAmount.toFixed(2)}, gross ₦${legs.gross.toFixed(2)}, tax ₦${legs.tax.toFixed(2)}, net ₦${legs.net.toFixed(2)}`,
    lineItems
  );
}

async function syncPayout(userId, amount, gameId, extras = {}) {
  return syncGameSettlement(userId, {
    gameId,
    stake: extras.stake,
    grossPayout: amount,
    taxAmount: extras.taxAmount,
    netAmount: extras.netAmount != null ? extras.netAmount : roundZohoAmount(amount) - roundZohoAmount(extras.taxAmount || 0),
    score: extras.score,
  });
}

async function syncReferralBonus(userId, amount, referralId, extras = {}) {
  const referralExpense = process.env.ZOHO_ACCOUNT_REFERRAL_EXPENSE;
  const walletLiability = process.env.ZOHO_ACCOUNT_WALLET_LIABILITY;

  if (!accountsReady([
    ['ZOHO_ACCOUNT_REFERRAL_EXPENSE', referralExpense],
    ['ZOHO_ACCOUNT_WALLET_LIABILITY', walletLiability],
  ])) return;

  const bonus = roundZohoAmount(amount);
  if (!(bonus > 0)) return;

  const reversal = Boolean(extras.reversal);
  const lineItems = reversal
    ? [
        { account_id: walletLiability, debit_or_credit: 'debit', amount: bonus },
        { account_id: referralExpense, debit_or_credit: 'credit', amount: bonus },
      ]
    : [
        { account_id: referralExpense, debit_or_credit: 'debit', amount: bonus },
        { account_id: walletLiability, debit_or_credit: 'credit', amount: bonus },
      ];

  return publishJournal(
    getTodayDate(),
    `${reversal ? 'REF-REV' : 'REF'}-${referralId}`,
    `${reversal ? 'Referral bonus reversed' : 'Referral bonus'} - User ${userId}`,
    lineItems
  );
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
function pushDelta(lines, accountId, amount, debitWhenPositive) {
  const value = roundZohoAmount(amount);
  if (!accountId || value === 0) return;
  if (value > 0) pushLine(lines, accountId, debitWhenPositive ? 'debit' : 'credit', value);
  else pushLine(lines, accountId, debitWhenPositive ? 'credit' : 'debit', Math.abs(value));
}

async function syncPayoutCorrection(userId, {
  gameId,
  winningsDelta = 0,
  revenueDelta = 0,
  taxDelta = 0,
  netDelta = 0,
  score,
  stake,
  taxableWinnings,
} = {}) {
  const payoutsExpense = process.env.ZOHO_ACCOUNT_PAYOUTS_EXPENSE;
  const forfeited = process.env.ZOHO_ACCOUNT_FORFEITED_STAKES;
  const walletLiability = process.env.ZOHO_ACCOUNT_WALLET_LIABILITY;
  const taxAccount = process.env.ZOHO_ACCOUNT_TAX_PAYABLE || process.env.ZOHO_ACCOUNT_WIN_TAX_INCOME;

  const winnings = roundZohoAmount(winningsDelta);
  const revenue = roundZohoAmount(revenueDelta);
  const tax = roundZohoAmount(taxDelta);
  const net = roundZohoAmount(netDelta);
  if (winnings === 0 && revenue === 0 && tax === 0 && net === 0) return;

  if (!accountsReady([['ZOHO_ACCOUNT_WALLET_LIABILITY', walletLiability]])) return;
  if (winnings !== 0 && !payoutsExpense) {
    console.error('Zoho payout correction skipped; set ZOHO_ACCOUNT_PAYOUTS_EXPENSE');
    return;
  }
  if (revenue !== 0 && !forfeited) {
    console.error('Zoho payout correction skipped; set ZOHO_ACCOUNT_FORFEITED_STAKES');
    return;
  }
  if (tax !== 0 && !taxAccount) {
    console.error('Zoho payout correction skipped; set ZOHO_ACCOUNT_TAX_PAYABLE');
    return;
  }

  const lineItems = [];
  pushDelta(lineItems, payoutsExpense, winnings, true);
  pushDelta(lineItems, forfeited, revenue, false);
  pushDelta(lineItems, walletLiability, net, false);
  pushDelta(lineItems, taxAccount, tax, false);
  if (!linesBalance(lineItems)) {
    console.error('Zoho payout correction is unbalanced', { userId, gameId, winnings, revenue, tax, net });
    return;
  }

  const scoreLabel = score != null ? `${score}/10` : 'corrected';
  const ref = `PAY-CORR-${gameId}-${Date.now()}`;
  const stakeNote = stake != null ? ` stake ₦${roundZohoAmount(stake).toFixed(2)}` : '';
  const winNote = taxableWinnings != null ? ` taxable ₦${roundZohoAmount(taxableWinnings).toFixed(2)}` : '';

  return publishJournal(
    getTodayDate(),
    ref,
    `Dispute payout correction ${scoreLabel} - User ${userId}${stakeNote}${winNote} - winnings Δ ₦${winnings.toFixed(2)}, revenue Δ ₦${revenue.toFixed(2)}, tax Δ ₦${tax.toFixed(2)}, net Δ ₦${net.toFixed(2)}`,
    lineItems
  );
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
  syncGameSettlement,
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
