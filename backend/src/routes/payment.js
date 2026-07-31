const router = require('express').Router();
const { deposit, verifyPayment, withdraw, webhook, getBanks, resolveAccount } = require('../controllers/paymentController');
const { validate, depositSchema, withdrawSchema, resolveAccountSchema } = require('../utils/validators');
const { requireActiveUser } = require('../middleware/auth');

// Webhook route must be public
router.post('/webhook', webhook);

router.use(requireActiveUser);

router.get('/banks',              getBanks);
router.post('/resolve-account',   validate(resolveAccountSchema), resolveAccount);
router.post('/deposit',           validate(depositSchema),  deposit);
router.post('/verify/:reference', verifyPayment);
router.post('/withdraw',          validate(withdrawSchema), withdraw);

module.exports = router;
