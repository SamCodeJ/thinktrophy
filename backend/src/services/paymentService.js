const { query, getClient } = require('../db/connection');
const { AppError } = require('../middleware/errorHandler');
const { v4: uuidv4 } = require('uuid');
const { sendActionEmail } = require('../utils/emailService');
const { formatNaira } = require('../utils/formatNaira');
const axios = require('axios');
// No need for a custom httpsAgent for Flutterwave, as it was working previously and causes EPROTO errors


async function initiateDeposit(userId, amount) {
  const reference = `TT-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`;

  await query(
    `INSERT INTO transactions (user_id, type, amount, status, reference)
     VALUES ($1, 'deposit', $2, 'pending', $3)`,
    [userId, amount, reference]
  );

  return {
    reference,
    amount,
    message: 'Payment initiated. Use reference to verify after payment.',
  };
}

async function verifyDeposit(userId, txRef) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const txRes = await client.query(
      `SELECT * FROM transactions WHERE reference = $1 AND user_id = $2 AND type = 'deposit' FOR UPDATE`,
      [txRef, userId]
    );
    const tx = txRes.rows[0];
    if (!tx) throw new AppError('Transaction not found', 404, 'NOT_FOUND');
    if (tx.status === 'verified') {
      const walletRes = await client.query(
        'SELECT wallet_balance FROM users WHERE id = $1',
        [userId]
      );
      await client.query('COMMIT');
      return {
        amount:     parseFloat(tx.amount),
        newBalance: parseFloat(walletRes.rows[0].wallet_balance),
        reference:  tx.reference,
      };
    }

    if (!process.env.FLW_SECRET_KEY) {
      throw new AppError('Payment gateway is not configured', 500, 'GATEWAY_ERROR');
    }

    // Verify with Flutterwave using our tx_ref (more reliable than redirect transaction_id)
    const flwRes = await axios.get(
      'https://api.flutterwave.com/v3/transactions/verify_by_reference',
      {
        params: { tx_ref: txRef },
        headers: {
          Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
        }
      }
    );

    if (flwRes.data.status !== 'success') {
      throw new AppError('Unable to verify transaction with Flutterwave', 400, 'VERIFICATION_FAILED');
    }

    const flwData = flwRes.data.data;

    if (flwData.status !== 'successful') {
      throw new AppError('Transaction was not successful on Flutterwave', 400, 'TX_FAILED');
    }

    const paidAmount = parseFloat(flwData.amount);
    const expectedAmount = parseFloat(tx.amount);
    if (paidAmount < expectedAmount) {
      throw new AppError('Amount paid is less than initiated amount', 400, 'AMOUNT_MISMATCH');
    }

    await client.query(
      `UPDATE transactions SET status = 'verified', metadata = $1 WHERE id = $2`,
      [JSON.stringify({ flw_id: flwData.id, flw_ref: flwData.flw_ref }), tx.id]
    );

    await client.query(
      `UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2`,
      [tx.amount, userId]
    );

    const walletRes = await client.query(
      'SELECT username, email, wallet_balance FROM users WHERE id = $1',
      [userId]
    );

    await client.query('COMMIT');
    
    // Sync to Zoho Books asynchronously
    const zohoService = require('./zohoService');
    zohoService.syncDeposit(userId, tx.amount, tx.reference)
      .catch(err => console.error('Failed to sync deposit to Zoho Books:', err));
    
    // Send email notification (non-blocking)
    const user = walletRes.rows[0];
    if (user && user.email) {
      sendActionEmail(
        user.email,
        user.username,
        'Deposit Successful',
        `Your deposit of ₦${parseFloat(tx.amount).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} has been successfully verified and added to your wallet.`
      ).catch(err => console.error('Failed to send deposit email:', err));
    }

    return {
      amount:         parseFloat(tx.amount),
      newBalance:     parseFloat(walletRes.rows[0].wallet_balance),
      reference:      tx.reference,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function requestWithdrawal(userId, amount, accountDetails) {
  const walletRes = await query(
    'SELECT username, email, wallet_balance FROM users WHERE id = $1',
    [userId]
  );
  const user = walletRes.rows[0];
  const balance = parseFloat(user.wallet_balance);
  const withdrawalFee = parseFloat(process.env.WITHDRAWAL_FEE || '50');
  
  if (amount > balance) throw new AppError('Insufficient balance', 400, 'INSUFFICIENT_BALANCE');
  if (amount <= withdrawalFee) throw new AppError(`Minimum withdrawal must be greater than the ${formatNaira(withdrawalFee)} fee`, 400, 'AMOUNT_TOO_LOW');

  const transferAmount = amount - withdrawalFee;

  const client = await getClient();
  try {
    await client.query('BEGIN');

    await client.query(
      'UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id = $2',
      [amount, userId]
    );

    const reference = `WD-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`;
    
    // Initiate Flutterwave Transfer
    let flwTransferId = null;
    try {
      const flwRes = await axios.post(
        'https://api.flutterwave.com/v3/transfers',
        {
          account_bank: accountDetails.bank_code || '044', // Default to Access Bank for testing if not provided
          account_number: accountDetails.account_number,
          amount: transferAmount,
          narration: 'ThinkTrophy Withdrawal',
          currency: 'NGN',
          reference: reference,
          callback_url: `${process.env.APP_URL}/api/payment/webhook`,
          debit_currency: 'NGN'
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
          }
        }
      );
      flwTransferId = flwRes.data.data.id;
    } catch (flwErr) {
      console.error('Flutterwave Transfer Error:', flwErr.response?.data || flwErr.message);
      throw new AppError('Failed to initiate transfer with payment gateway', 500, 'GATEWAY_ERROR');
    }

    await client.query(
      `INSERT INTO transactions (user_id, type, amount, status, reference, metadata)
       VALUES ($1, 'withdrawal', $2, 'pending', $3, $4)`,
      [userId, amount, reference, JSON.stringify({ ...accountDetails, flw_transfer_id: flwTransferId, fee: withdrawalFee, transfer_amount: transferAmount })]
    );

    await client.query('COMMIT');
    
    // Sync Withdrawal Request to Zoho Books
    const zohoService = require('./zohoService');
    zohoService.syncWithdrawalRequest(userId, amount, withdrawalFee, reference)
      .catch(err => console.error('Failed to sync withdrawal request to Zoho Books:', err));
    
    // Send email notification (non-blocking)
    if (user && user.email) {
      sendActionEmail(
        user.email,
        user.username,
        'Withdrawal Request Received',
        `Your withdrawal request for ₦${parseFloat(amount).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} has been submitted successfully and is currently being processed.`
      ).catch(err => console.error('Failed to send withdrawal email:', err));
    }

    return { reference, amount, message: 'Withdrawal request submitted for processing' };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Webhook handler
async function handleWebhook(payload, signature) {
  const secretHash = process.env.FLW_SECRET_HASH;
  if (!signature || signature !== secretHash) {
    throw new AppError('Invalid webhook signature', 401, 'UNAUTHORIZED');
  }

  const { event, data } = payload;
  let logStatus = 'processed';
  let logError = null;
  
  const client = await getClient();
  try {
    await client.query('BEGIN');

    if (event === 'transfer.completed') {
      const reference = data.reference;
      const status = data.status; // 'SUCCESSFUL' or 'FAILED'
      
      const txRes = await client.query(
        `SELECT * FROM transactions WHERE reference = $1 AND type = 'withdrawal' FOR UPDATE`,
        [reference]
      );
      const tx = txRes.rows[0];
      
      if (tx && tx.status === 'pending') {
        if (status === 'SUCCESSFUL') {
          await client.query(`UPDATE transactions SET status = 'verified' WHERE id = $1`, [tx.id]);
        } else if (status === 'FAILED') {
          await client.query(`UPDATE transactions SET status = 'failed' WHERE id = $1`, [tx.id]);
          // Refund user
          await client.query(`UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2`, [tx.amount, tx.user_id]);
        }
      } else {
        logStatus = 'ignored';
        logError = 'Transaction not found or not pending';
      }
    } else {
      logStatus = 'ignored';
      logError = 'Unhandled event type';
    }

    // Log the webhook
    await client.query(
      `INSERT INTO webhook_logs (provider, event_type, payload, status, error_message)
       VALUES ('flutterwave', $1, $2, $3, $4)`,
      [event || 'unknown', JSON.stringify(payload), logStatus, logError]
    );

    await client.query('COMMIT');
    
    // Sync with Zoho Books
    if (logStatus === 'processed' && event === 'transfer.completed') {
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
  } catch (err) {
    await client.query('ROLLBACK');
    
    // Attempt to log the failure
    try {
      await query(
        `INSERT INTO webhook_logs (provider, event_type, payload, status, error_message)
         VALUES ('flutterwave', $1, $2, 'failed', $3)`,
        [event || 'unknown', JSON.stringify(payload), err.message]
      );
    } catch (logErr) {
      console.error('Failed to log webhook error:', logErr);
    }
    
    throw err;
  } finally {
    client.release();
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
