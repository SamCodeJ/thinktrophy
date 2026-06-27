const router = require('express').Router();
const {
  register,
  login,
  forgotPassword,
  resetPassword,
  updatePassword,
  verifyEmail,
  resendVerification,
  refreshToken,
  logout,
  adminLogin,
  adminForgotPassword,
  adminResetPassword,
  adminUpdatePassword,
} = require('../controllers/authController');
const { validate, registerSchema, loginSchema, adminLoginSchema, forgotPasswordSchema, resetPasswordSchema, updatePasswordSchema } = require('../utils/validators');
const { authLimiter } = require('../middleware/rateLimiter');
const { requireUser, requireAdmin } = require('../middleware/auth');

router.post('/register',             authLimiter, validate(registerSchema),   register);
router.post('/login',                authLimiter, validate(loginSchema),      login);
router.post('/forgot-password',      authLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password',       authLimiter, validate(resetPasswordSchema),  resetPassword);
router.post('/update-password',      requireUser, validate(updatePasswordSchema), updatePassword);
router.get('/verify-email',          verifyEmail);
router.post('/resend-verification',  authLimiter, resendVerification);
router.post('/refresh',              refreshToken);
router.post('/logout',               requireUser, logout);

router.post('/admin/login',          authLimiter, validate(adminLoginSchema), adminLogin);
router.post('/admin/forgot-password',authLimiter, validate(forgotPasswordSchema), adminForgotPassword);
router.post('/admin/reset-password', authLimiter, validate(resetPasswordSchema),  adminResetPassword);
router.post('/admin/update-password',requireAdmin, validate(updatePasswordSchema), adminUpdatePassword);

module.exports = router;
