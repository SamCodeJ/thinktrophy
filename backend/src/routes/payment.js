const router = require('express').Router();
const { deposit, verifyPayment, withdraw, webhook } = require('../controllers/paymentController');
const { validate, depositSchema, withdrawSchema } = require('../utils/validators');
const { requireActiveUser } = require('../middleware/auth');

// Webhook route must be public
router.post('/webhook', webhook);

router.use(requireActiveUser);

router.post('/deposit',           validate(depositSchema),  deposit);
router.post('/verify/:reference', verifyPayment);
router.post('/withdraw',          validate(withdrawSchema), withdraw);

module.exports = router;
