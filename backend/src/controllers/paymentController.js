const { initiateDeposit, verifyDeposit, requestWithdrawal, handleWebhook } = require('../services/paymentService');

async function deposit(req, res, next) {
  try {
    const { amount } = req.body;
    const data = await initiateDeposit(req.user.userId, amount);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
}

async function verifyPayment(req, res, next) {
  try {
    const { reference } = req.params; // In this case, frontend sends transaction_id as reference
    const data = await verifyDeposit(req.user.userId, reference);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

async function withdraw(req, res, next) {
  try {
    const { amount, account_details } = req.body;
    const data = await requestWithdrawal(req.user.userId, amount, account_details);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
}

async function webhook(req, res, next) {
  try {
    const signature = req.headers['verif-hash'];
    await handleWebhook(req.body, signature);
    res.status(200).send('OK');
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(400).send('Webhook Error');
  }
}

module.exports = { deposit, verifyPayment, withdraw, webhook };
