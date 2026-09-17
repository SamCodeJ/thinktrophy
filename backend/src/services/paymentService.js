const { query, getClient } = require('../db/connection');
const { AppError } = require('../middleware/errorHandler');
const { v4: uuidv4 } = require('uuid');
const { sendActionEmail } = require('../utils/emailService');
const { formatNaira } = require('../utils/formatNaira');
const axios = require('axios');
const crypto = require('crypto');
// No need for a custom httpsAgent for Flutterwave, as it was working previously and causes EPROTO errors


async function initiateDeposit(userId, amount) {
  const depositAmount = roundMoney(amount);
  if (!Number.isFinite(depositAmount) || depositAmount < 1) {
    throw new AppError('Invalid deposit amount', 400, 'INVALID_AMOUNT');
  }
  if (!process.env.FLW_SECRET_KEY) {
    throw new AppError('Payment gateway is not configured', 500, 'GATEWAY_ERROR');
  }

  const userRes = await query(
    'SELECT username, email, first_name, last_name, phone_number FROM users WHERE id = $1',
    [userId]
  );
  const user = userRes.rows[0];
  if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');

  const reference = `TT-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`;
  const customerName = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username;

  const txInsert = await query(
    `INSERT INTO transactions (user_id, type, amount, status, reference, metadata)
     VALUES ($1, 'deposit', $2, 'pending', $3, $4)
     RETURNING id`,
    [userId, depositAmount, reference, JSON.stringify({ initiated_amount: depositAmount })]
  );

  let paymentLink;
  try {
    const flwRes = await axios.post(
      'https://api.flutterwave.com/v3/payments',
      {
        tx_ref: reference,
        amount: depositAmount,
        currency: 'NGN',
        redirect_url: 'https://flutterwave.com/rn-redirect',
        payment_options: 'card,ussd,banktransfer',
        customer: {
          email: user.email,
          name: customerName,
          phonenumber: user.phone_number || undefined,
        },
        customizations: {
          title: 'ThinkTrophy',
          description: `Wallet deposit ${formatNaira(depositAmount)}`,
        },
        meta: {
          user_id: userId,
          initiated_amount: depositAmount,
        },
      },
      {
        headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` },
      }
    );
    paymentLink = flwRes.data?.data?.link;
    if (!paymentLink) {
      throw new Error(flwRes.data?.message || 'No payment link returned');
    }
  } catch (err) {
    console.error('Flutterwave payment init error:', err.response?.data || err.message);
    await query(
      `UPDATE transactions SET status = 'failed', metadata = COALESCE(metadata, '{}'::jsonb) || $1::jsonb WHERE id = $2`,
      [JSON.stringify({ gateway_error: err.response?.data || err.message }), txInsert.rows[0].id]
    );
    throw new AppError('Failed to initialize payment. Please try again.', 502, 'GATEWAY_ERROR');
  }

  return {
    reference,
    amount: depositAmount,
    payment_link: paymentLink,
  };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isFlwSuccessful(status) {
  return String(status || '').toLowerCase() === 'successful';
}

function numericFlwId(value) {
  if (value == null || value === '') return null;
  const digits = String(value).trim();
  return /^\d+$/.test(digits) ? digits : null;
}

function ymd(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function flwKeyMode() {
  const key = process.env.FLW_SECRET_KEY || '';
  if (key.includes('_TEST') || key.includes('TEST-')) return 'TEST';
  if (key.startsWith('FLWSECK-')) return 'LIVE';
  return 'UNKNOWN';
}

async function fetchFlutterwaveTransaction({ txRef, flwId, createdAt }) {
  if (!process.env.FLW_SECRET_KEY) {
    throw new AppError('Payment gateway is not configured', 500, 'GATEWAY_ERROR');
  }

  const headers = { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` };
  const id = numericFlwId(flwId);
  let lastDetail = null;

  const verifyByNumericId = async (nid) => {
    const byId = await axios.get(
      `https://api.flutterwave.com/v3/transactions/${nid}/verify`,
      { headers }
    );
    if (byId.data.status === 'success' && byId.data.data) return byId.data.data;
    const err = new Error(byId.data?.message || 'Verify by id failed');
    err.payload = byId.data;
    throw err;
  };

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      if (id) return await verifyByNumericId(id);

      try {
        const byRef = await axios.get(
          'https://api.flutterwave.com/v3/transactions/verify_by_reference',
          { params: { tx_ref: txRef }, headers }
        );
        if (byRef.data.status === 'success' && byRef.data.data) return byRef.data.data;
        lastDetail = byRef.data;
      } catch (err) {
        lastDetail = err.response?.data || err.payload || err.message;
      }

      const created = createdAt ? new Date(createdAt) : new Date();
      const from = new Date(created.getTime() - 2 * 24 * 60 * 60 * 1000);
      const to = new Date(created.getTime() + 2 * 24 * 60 * 60 * 1000);
      const listed = await axios.get('https://api.flutterwave.com/v3/transactions', {
        headers,
        params: {
          from: ymd(from),
          to: ymd(to),
          tx_ref: txRef,
          currency: 'NGN',
        },
      });
      const rows = Array.isArray(listed.data.data) ? listed.data.data : [];
      const match = rows.find(r => String(r.tx_ref) === String(txRef));
      if (match?.id) return await verifyByNumericId(match.id);
      lastDetail = listed.data;
    } catch (err) {
      lastDetail = err.response?.data || err.payload || err.message;
    }

    console.error(
      `Flutterwave verify error (${flwKeyMode()}) tx_ref=${txRef}`,
      lastDetail
    );
    if (attempt < 2) await sleep(1500);
  }

  throw new AppError(
    `Flutterwave has no charge for reference ${txRef} using the ${flwKeyMode()} secret key. Confirm this exact tx_ref on the Flutterwave dashboard, or retry with the numeric Flutterwave transaction ID.`,
    400,
    'VERIFICATION_FAILED'
  );
}

function roundMoney(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

function parseTxMetadata(metadata) {
  if (!metadata) return {};
  if (typeof metadata === 'string') {
    try { return JSON.parse(metadata); } catch { return {}; }
  }
  return { ...metadata };
}

function notifyDepositSuccess(user, amount) {
  if (!user?.email) return;
  sendActionEmail(
    user.email,
    user.username,
    'Deposit Successful',
    `Your deposit of ₦${parseFloat(amount).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} has been successfully verified and added to your wallet.`
  ).catch(err => console.error('Failed to send deposit email:', err));
}

function depositResult({ amount, credited = 0, newBalance, reference }) {
  return {
    amount: roundMoney(amount),
    credited: roundMoney(credited),
    newBalance: roundMoney(newBalance),
    reference,
  };
}

// userId is optional (admin / webhook). Always re-checks Flutterwave before crediting.
// Credits the Flutterwave paid amount. If an earlier verify credited only the initiated
// amount, a later verify tops up the shortfall.
async function verifyDeposit(userId, txRef, { flwId } = {}) {
  const peekRes = userId
    ? await query(
        `SELECT id, user_id, type, status, amount, reference, created_at
         FROM transactions WHERE reference = $1 AND user_id = $2 AND type = 'deposit'`,
        [txRef, userId]
      )
    : await query(
        `SELECT id, user_id, type, status, amount, reference, created_at
         FROM transactions WHERE reference = $1 AND type = 'deposit'`,
        [txRef]
      );
  const peekTx = peekRes.rows[0];
  if (!peekTx) throw new AppError('Transaction not found', 404, 'NOT_FOUND');

  const flwData = await fetchFlutterwaveTransaction({
    txRef,
    flwId,
    createdAt: peekTx.created_at,
  });

  if (!isFlwSuccessful(flwData.status)) {
    throw new AppError('Transaction was not successful on Flutterwave', 400, 'TX_FAILED');
  }
  if (flwData.tx_ref && flwData.tx_ref !== txRef && !flwId) {
    throw new AppError('Payment reference mismatch', 400, 'REFERENCE_MISMATCH');
  }

  const paidAmount = roundMoney(flwData.amount);
  if (!Number.isFinite(paidAmount) || paidAmount <= 0) {
    throw new AppError('Invalid amount returned by Flutterwave', 400, 'AMOUNT_MISMATCH');
  }
  const currency = String(flwData.currency || '').toUpperCase();
  if (currency && currency !== 'NGN') {
    throw new AppError('Payment currency mismatch', 400, 'CURRENCY_MISMATCH');
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    const txRes = userId
      ? await client.query(
          `SELECT * FROM transactions WHERE reference = $1 AND user_id = $2 AND type = 'deposit' FOR UPDATE`,
          [txRef, userId]
        )
      : await client.query(
          `SELECT * FROM transactions WHERE reference = $1 AND type = 'deposit' FOR UPDATE`,
          [txRef]
        );
    const tx = txRes.rows[0];
    if (!tx) throw new AppError('Transaction not found', 404, 'NOT_FOUND');

    const ownerId = tx.user_id;
    if (tx.status === 'reversed' || tx.status === 'failed') {
      throw new AppError('Transaction cannot be credited in its current status', 400, 'INVALID_STATUS');
    }

    const recordedAmount = roundMoney(tx.amount);
    const meta = parseTxMetadata(tx.metadata);
    const initiatedAmount = roundMoney(meta.initiated_amount ?? recordedAmount);

    if (tx.status === 'verified' && paidAmount <= recordedAmount) {
      const walletRes = await client.query(
        'SELECT wallet_balance FROM users WHERE id = $1',
        [ownerId]
      );
      await client.query('COMMIT');
      return depositResult({
        amount: recordedAmount,
        credited: 0,
        newBalance: walletRes.rows[0].wallet_balance,
        reference: tx.reference,
      });
    }

    if (tx.status !== 'verified' && paidAmount < initiatedAmount) {
      throw new AppError('Amount paid is less than initiated amount', 400, 'AMOUNT_MISMATCH');
    }

    if (paidAmount !== initiatedAmount) {
      console.warn(
        `Deposit amount mismatch tx_ref=${txRef} initiated=${initiatedAmount} flutterwave=${paidAmount}`
      );
    }

    const creditAmount = tx.status === 'verified'
      ? roundMoney(paidAmount - recordedAmount)
      : paidAmount;

    const nextMeta = {
      ...meta,
      flw_id: flwData.id,
      flw_ref: flwData.flw_ref,
      initiated_amount: initiatedAmount,
      flw_amount: paidAmount,
      amount_mismatch: paidAmount !== initiatedAmount,
    };

    await client.query(
      `UPDATE transactions SET status = 'verified', amount = $1, metadata = $2 WHERE id = $3`,
      [paidAmount, JSON.stringify(nextMeta), tx.id]
    );

    await client.query(
      `UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2`,
      [creditAmount, ownerId]
    );

    const walletRes = await client.query(
      'SELECT username, email, wallet_balance FROM users WHERE id = $1',
      [ownerId]
    );

    await client.query('COMMIT');

    const zohoService = require('./zohoService');
    const zohoRef = tx.status === 'verified' ? `${tx.reference}-ADJ` : tx.reference;
    zohoService.syncDeposit(ownerId, creditAmount, zohoRef)
      .catch(err => console.error('Failed to sync deposit to Zoho Books:', err));

    notifyDepositSuccess(walletRes.rows[0], creditAmount);

    return depositResult({
      amount: paidAmount,
      credited: creditAmount,
      newBalance: walletRes.rows[0].wallet_balance,
      reference: tx.reference,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function requestWithdrawal(userId, amount, accountDetails) {
  if (!accountDetails?.bank_code || !accountDetails?.account_number) {
    throw new AppError('Bank account details are required', 400, 'INVALID_ACCOUNT');
  }

  const withdrawalFee = parseFloat(process.env.WITHDRAWAL_FEE || '50');
  if (amount <= withdrawalFee) {
    throw new AppError(`Minimum withdrawal must be greater than the ${formatNaira(withdrawalFee)} fee`, 400, 'AMOUNT_TOO_LOW');
  }

  const transferAmount = amount - withdrawalFee;
  const reference = `WD-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`;
  const client = await getClient();
  let user;

  try {
    await client.query('BEGIN');

    const walletRes = await client.query(
      'SELECT username, email, wallet_balance, email_verified FROM users WHERE id = $1 FOR UPDATE',
      [userId]
    );
    user = walletRes.rows[0];
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');
    if (!user.email_verified) {
      throw new AppError('Please verify your email before withdrawing', 403, 'EMAIL_NOT_VERIFIED');
    }

    const debit = await client.query(
      `UPDATE users SET wallet_balance = wallet_balance - $1
       WHERE id = $2 AND wallet_balance >= $1
       RETURNING wallet_balance`,
      [amount, userId]
    );
    if (!debit.rowCount) {
      throw new AppError('Insufficient balance', 400, 'INSUFFICIENT_BALANCE');
    }

    await client.query(
      `INSERT INTO transactions (user_id, type, amount, status, reference, metadata)
       VALUES ($1, 'withdrawal', $2, 'pending', $3, $4)`,
      [userId, amount, reference, JSON.stringify({
        ...accountDetails,
        fee: withdrawalFee,
        transfer_amount: transferAmount,
      })]
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  let flwTransferId = null;
  try {
    const flwRes = await axios.post(
      'https://api.flutterwave.com/v3/transfers',
      {
        account_bank: accountDetails.bank_code,
        account_number: accountDetails.account_number,
        amount: transferAmount,
        narration: 'ThinkTrophy Withdrawal',
        currency: 'NGN',
        reference,
        callback_url: `${process.env.APP_URL}/api/payment/webhook`,
        debit_currency: 'NGN',
      },
      {
        headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` },
      }
    );
    flwTransferId = flwRes.data?.data?.id || null;
  } catch (flwErr) {
    console.error('Flutterwave Transfer Error:', flwErr.response?.data || flwErr.message);
    await query(
      `UPDATE transactions SET status = 'failed', metadata = metadata || $1::jsonb WHERE reference = $2 AND type = 'withdrawal'`,
      [JSON.stringify({ gateway_error: flwErr.response?.data || flwErr.message }), reference]
    );
    await query(
      'UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2',
      [amount, userId]
    );
    throw new AppError('Failed to initiate transfer with payment gateway', 500, 'GATEWAY_ERROR');
  }

  if (flwTransferId) {
    await query(
      `UPDATE transactions
       SET metadata = COALESCE(metadata, '{}'::jsonb) || $1::jsonb
       WHERE reference = $2 AND type = 'withdrawal'`,
      [JSON.stringify({ flw_transfer_id: flwTransferId }), reference]
    );
  }

  const zohoService = require('./zohoService');
  zohoService.syncWithdrawalRequest(userId, amount, withdrawalFee, reference)
    .catch(err => console.error('Failed to sync withdrawal request to Zoho Books:', err));

  if (user && user.email) {
    sendActionEmail(
      user.email,
      user.username,
      'Withdrawal Request Received',
      `Your withdrawal request for ₦${parseFloat(amount).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} has been submitted successfully and is currently being processed.`
    ).catch(err => console.error('Failed to send withdrawal email:', err));
  }

  return { reference, amount, message: 'Withdrawal request submitted for processing' };
}

async function handleTransferCompleted(data) {
  const reference = data.reference;
  const status = String(data.status || '').toUpperCase();
  let logStatus = 'processed';
  let logError = null;
  let tx = null;

  const client = await getClient();
  try {
    await client.query('BEGIN');

    const txRes = await client.query(
      `SELECT * FROM transactions WHERE reference = $1 AND type = 'withdrawal' FOR UPDATE`,
      [reference]
    );
    tx = txRes.rows[0];

    if (tx && tx.status === 'pending') {
      if (status === 'SUCCESSFUL') {
        await client.query(`UPDATE transactions SET status = 'verified' WHERE id = $1`, [tx.id]);
      } else if (status === 'FAILED') {
        await client.query(`UPDATE transactions SET status = 'failed' WHERE id = $1`, [tx.id]);
        await client.query(
          `UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2`,
          [tx.amount, tx.user_id]
        );
      }
    } else {
      logStatus = 'ignored';
      logError = 'Transaction not found or not pending';
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  if (logStatus === 'processed' && tx) {
    const zohoService = require('./zohoService');
    const meta = typeof tx.metadata === 'string' ? JSON.parse(tx.metadata) : (tx.metadata || {});
    const transferAmount = meta.transfer_amount || tx.amount;
    const fee = meta.fee || 0;

    if (status === 'SUCCESSFUL') {
      zohoService.syncWithdrawalSuccess(tx.user_id, transferAmount, tx.reference)
        .catch(err => console.error('Failed to sync withdrawal success to Zoho Books:', err));
    } else if (status === 'FAILED') {
      zohoService.syncWithdrawalFailed(tx.user_id, tx.amount, fee, tx.reference)
        .catch(err => console.error('Failed to sync withdrawal failure to Zoho Books:', err));
    }
  }

  return { logStatus, logError };
}

async function logWebhook(event, payload, status, errorMessage) {
  await query(
    `INSERT INTO webhook_logs (provider, event_type, payload, status, error_message)
     VALUES ('flutterwave', $1, $2, $3, $4)`,
    [event || 'unknown', JSON.stringify(payload), status, errorMessage]
  );
}

function signaturesMatch(provided, expected) {
  if (!provided || !expected) return false;
  const a = Buffer.from(String(provided));
  const b = Buffer.from(String(expected));
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// Webhook handler
async function handleWebhook(payload, signature) {
  const secretHash = process.env.FLW_SECRET_HASH;
  if (!signaturesMatch(signature, secretHash)) {
    throw new AppError('Invalid webhook signature', 401, 'UNAUTHORIZED');
  }

  const { event, data } = payload;
  let logStatus = 'processed';
  let logError = null;

  try {
    if (event === 'charge.completed') {
      if (!isFlwSuccessful(data?.status)) {
        logStatus = 'ignored';
        logError = `Charge status ${data?.status || 'unknown'}`;
      } else if (!data?.tx_ref) {
        logStatus = 'ignored';
        logError = 'Missing tx_ref';
      } else {
        await verifyDeposit(null, data.tx_ref, { flwId: data.id });
      }
    } else if (event === 'transfer.completed') {
      const result = await handleTransferCompleted(data);
      logStatus = result.logStatus;
      logError = result.logError;
    } else {
      logStatus = 'ignored';
      logError = 'Unhandled event type';
    }

    await logWebhook(event, payload, logStatus, logError);
  } catch (err) {
    try {
      await logWebhook(event, payload, 'failed', err.message);
    } catch (logErr) {
      console.error('Failed to log webhook error:', logErr);
    }
    throw err;
  }
}

async function getBanks() {
  try {
    const flwRes = await axios.get('https://api.flutterwave.com/v3/banks/NG', {
      headers: {
        Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
      }
    });
    return flwRes.data.data;
  } catch (err) {
    console.error('Flutterwave Get Banks Error:', err.response?.data || err.message);
    throw new AppError('Failed to fetch banks', 500, 'GATEWAY_ERROR');
  }
}

async function resolveAccount(account_number, bank_code) {
  try {
    const flwRes = await axios.post('https://api.flutterwave.com/v3/accounts/resolve', {
      account_number,
      account_bank: bank_code,
    }, {
      headers: {
        Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
      }
    });
    return flwRes.data.data;
  } catch (err) {
    console.error('Flutterwave Resolve Account Error:', err.response?.data || err.message);
    throw new AppError('Failed to resolve account. Please check the account number and bank.', 400, 'INVALID_ACCOUNT');
  }
}

module.exports = { initiateDeposit, verifyDeposit, requestWithdrawal, handleWebhook, getBanks, resolveAccount };
