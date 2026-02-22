const { initiateDeposit, verifyDeposit, requestWithdrawal } = require('../services/paymentService');

async function deposit(req, res, next) {
  try {
    const { amount } = req.body;
    const data = await initiateDeposit(req.user.userId, amount);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
}

async function verifyPayment(req, res, next) {
  try {
    const { reference } = req.params;
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

module.exports = { deposit, verifyPayment, withdraw };
