const router = require('express').Router();
const { register, login, refreshToken, logout, adminLogin } = require('../controllers/authController');
const { validate, registerSchema, loginSchema, adminLoginSchema } = require('../utils/validators');
const { authLimiter } = require('../middleware/rateLimiter');
const { requireUser } = require('../middleware/auth');

router.post('/register',     authLimiter, validate(registerSchema),    register);
router.post('/login',        authLimiter, validate(loginSchema),       login);
router.post('/refresh',      refreshToken);
router.post('/logout',       requireUser, logout);
router.post('/admin/login',  authLimiter, validate(adminLoginSchema),  adminLogin);

module.exports = router;
