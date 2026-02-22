const { query, getClient } = require('../db/connection');
const { AppError } = require('../middleware/errorHandler');
const { v4: uuidv4 } = require('uuid');

// Payment gateway stub — replace with real Stripe/Flutterwave integration
async function initiateDeposit(userId, amount) {
  const reference = `TT-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`;

  await query(
    `INSERT INTO transactions (user_id, type, amount, status, reference)
     VALUES ($1, 'deposit', $2, 'pending', $3)`,
    [userId, amount, reference]
  );

  // In a real integration, call payment gateway API here and return checkout URL
  return {
    reference,
    amount,
    // payment_url: 'https://pay.gateway.com/checkout/...',
    message: 'Payment initiated. Use reference to verify after payment.',
  };
}

async function verifyDeposit(userId, reference) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const txRes = await client.query(
      `SELECT * FROM transactions WHERE reference = $1 AND user_id = $2 AND type = 'deposit' FOR UPDATE`,
      [reference, userId]
    );
    const tx = txRes.rows[0];
    if (!tx) throw new AppError('Transaction not found', 404, 'NOT_FOUND');
    if (tx.status === 'verified') throw new AppError('Transaction already verified', 400, 'ALREADY_VERIFIED');
    if (tx.status === 'failed') throw new AppError('Transaction failed', 400, 'TX_FAILED');

    // In production: verify with payment gateway API using `reference`
    // For now, auto-verify (stub)
    await client.query(
      `UPDATE transactions SET status = 'verified' WHERE id = $1`,
      [tx.id]
    );

    await client.query(
      `UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2`,
      [tx.amount, userId]
    );

    const walletRes = await client.query(
      'SELECT wallet_balance FROM users WHERE id = $1',
      [userId]
    );

    await client.query('COMMIT');
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
    'SELECT wallet_balance FROM users WHERE id = $1',
    [userId]
  );
  const balance = parseFloat(walletRes.rows[0].wallet_balance);
  if (amount > balance) throw new AppError('Insufficient balance', 400, 'INSUFFICIENT_BALANCE');
  if (amount < 1) throw new AppError('Minimum withdrawal is $1.00', 400, 'AMOUNT_TOO_LOW');

  const client = await getClient();
  try {
    await client.query('BEGIN');

    await client.query(
      'UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id = $2',
      [amount, userId]
    );

    const reference = `WD-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`;
    await client.query(
      `INSERT INTO transactions (user_id, type, amount, status, reference, metadata)
       VALUES ($1, 'withdrawal', $2, 'pending', $3, $4)`,
      [userId, amount, reference, JSON.stringify(accountDetails)]
    );

    await client.query('COMMIT');
    return { reference, amount, message: 'Withdrawal request submitted for processing' };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { initiateDeposit, verifyDeposit, requestWithdrawal };
