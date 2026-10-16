const router = require('express').Router();
const { deposit, verifyPayment, withdraw, webhook, getBanks, resolveAccount } = require('../controllers/paymentController');
const { validate, depositSchema, withdrawSchema, resolveAccountSchema } = require('../utils/validators');
const { requireActiveUser, requireVerifiedEmail } = require('../middleware/auth');
const { moneyLimiter, webhookLimiter } = require('../middleware/rateLimiter');

// Webhook route must be public
router.post('/webhook', webhookLimiter, webhook);

router.use(requireActiveUser);

router.get('/banks',              getBanks);
router.post('/resolve-account',   validate(resolveAccountSchema), resolveAccount);
router.post('/deposit',           requireVerifiedEmail, moneyLimiter, validate(depositSchema),  deposit);
router.post('/verify/:reference', requireVerifiedEmail, verifyPayment);
router.post('/withdraw',          requireVerifiedEmail, moneyLimiter, validate(withdrawSchema), withdraw);

module.exports = router;
