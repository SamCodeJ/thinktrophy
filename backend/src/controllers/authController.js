const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { query } = require('../db/connection');
const { signAccessToken, signRefreshToken, verifyRefreshToken, signAdminToken } = require('../utils/jwt');
const { AppError } = require('../middleware/errorHandler');
const { sendVerificationEmail, sendPasswordResetEmail, sendActionEmail } = require('../utils/emailService');

const SALT_ROUNDS = 12;
const VERIFICATION_EXPIRY_HOURS = 24;

function generateVerificationToken() {
  const plain = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(plain).digest('hex');
  return { plain, hash };
}

async function register(req, res, next) {
  try {
    const { username, email, password, phone_number, first_name, last_name, dob } = req.body;
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const { plain, hash: tokenHash } = generateVerificationToken();
    const tokenExpires = new Date(Date.now() + VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000);

    const result = await query(
      `INSERT INTO users
         (username, email, password_hash, phone_number, first_name, last_name, dob, verification_token_hash, verification_token_expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, username, email, created_at`,
      [username, email, passwordHash, phone_number, first_name, last_name, dob, tokenHash, tokenExpires]
    );
    const user = result.rows[0];

    await sendVerificationEmail(user.email, user.username, plain);

    res.status(201).json({
      success: true,
      data: {
        message: 'Registration successful. Please check your email to verify your account.',
        email: user.email,
      },
    });
  } catch (err) {
    if (err.code === '23505') {
      const field = err.constraint?.includes('email') ? 'Email' : 'Username';
      return next(new AppError(`${field} is already taken`, 409, 'DUPLICATE_FIELD'));
    }
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await query(
      'SELECT id, username, email, password_hash, is_active, email_verified FROM users WHERE email = $1',
      [email]
    );
    const user = result.rows[0];
    if (!user) throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    if (!user.is_active) throw new AppError('Account is disabled', 403, 'ACCOUNT_DISABLED');

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');

    // if (!user.email_verified) {
    //   throw new AppError(
    //     'Email not verified. Please check your inbox and verify your email before logging in.',
    //     403,
    //     'EMAIL_NOT_VERIFIED'
    //   );
    // }

    const accessToken  = signAccessToken({ type: 'user', userId: user.id, username: user.username });
    const refreshToken = signRefreshToken({ type: 'user', userId: user.id });
    const refreshHash  = await bcrypt.hash(refreshToken, 8);
    await query('UPDATE users SET refresh_token_hash = $1 WHERE id = $2', [refreshHash, user.id]);

    res.json({
      success: true,
      data: { user: { id: user.id, username: user.username, email: user.email, email_verified: user.email_verified }, accessToken, refreshToken },
    });
  } catch (err) { next(err); }
}

async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    const result = await query('SELECT id, username FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (user) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const hash = await bcrypt.hash(code, 8);
      const expires = new Date(Date.now() + 15 * 60 * 1000);
      await query('UPDATE users SET password_reset_code_hash = $1, password_reset_expires_at = $2 WHERE id = $3', [hash, expires, user.id]);
      await sendPasswordResetEmail(email, user.username, code);
    }
    res.json({ success: true, data: { message: 'If that email exists, a reset code has been sent.' } });
  } catch (err) { next(err); }
}

async function resetPassword(req, res, next) {
  try {
    const { email, code, new_password } = req.body;
    const result = await query('SELECT id, username, password_reset_code_hash, password_reset_expires_at FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user || !user.password_reset_code_hash || new Date() > new Date(user.password_reset_expires_at)) {
      throw new AppError('Invalid or expired reset code', 400, 'INVALID_CODE');
    }
    const match = await bcrypt.compare(code, user.password_reset_code_hash);
    if (!match) throw new AppError('Invalid or expired reset code', 400, 'INVALID_CODE');

    const passwordHash = await bcrypt.hash(new_password, SALT_ROUNDS);
    await query('UPDATE users SET password_hash = $1, password_reset_code_hash = NULL, password_reset_expires_at = NULL WHERE id = $2', [passwordHash, user.id]);
    
    // Notify user of successful password reset
    sendActionEmail(
      email,
      user.username,
      'Password Reset Successfully',
      'Your ThinkTrophy password has been successfully reset. You can now log in using your new password.'
    ).catch(err => console.error('Failed to send password reset success email:', err));

    res.json({ success: true, data: { message: 'Password reset successfully. You can now log in.' } });
  } catch (err) { next(err); }
}

async function verifyEmail(req, res, next) {
  try {
    const { token } = req.query;
    if (!token) throw new AppError('Verification token is required', 400, 'MISSING_TOKEN');

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const result = await query(
      `SELECT id, username, email, email_verified, verification_token_expires_at
       FROM users
       WHERE verification_token_hash = $1`,
      [tokenHash]
    );
    const user = result.rows[0];

    if (!user) throw new AppError('Invalid or expired verification link', 400, 'INVALID_TOKEN');
    if (user.email_verified) {
      return res.json({ success: true, data: { message: 'Email is already verified. You can now log in.' } });
    }
    if (new Date() > new Date(user.verification_token_expires_at)) {
      throw new AppError('Verification link has expired. Please request a new one.', 400, 'TOKEN_EXPIRED');
    }

    await query(
      `UPDATE users
       SET email_verified = TRUE, verification_token_hash = NULL, verification_token_expires_at = NULL
       WHERE id = $1`,
      [user.id]
    );

    res.json({
      success: true,
      data: { message: 'Email verified successfully. You can now log in.' },
    });
  } catch (err) { next(err); }
}

async function resendVerification(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) throw new AppError('Email is required', 400, 'MISSING_FIELD');

    const result = await query(
      'SELECT id, username, email, email_verified FROM users WHERE email = $1',
      [email]
    );
    const user = result.rows[0];

    // Always respond the same way to avoid email enumeration
    if (!user || user.email_verified) {
      return res.json({
        success: true,
        data: { message: 'If that email exists and is unverified, a new verification link has been sent.' },
      });
    }

    const { plain, hash: tokenHash } = generateVerificationToken();
    const tokenExpires = new Date(Date.now() + VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000);

    await query(
      'UPDATE users SET verification_token_hash = $1, verification_token_expires_at = $2 WHERE id = $3',
      [tokenHash, tokenExpires, user.id]
    );

    await sendVerificationEmail(user.email, user.username, plain);

    res.json({
      success: true,
      data: { message: 'If that email exists and is unverified, a new verification link has been sent.' },
    });
  } catch (err) { next(err); }
}

async function refreshToken(req, res, next) {
  try {
    const { refreshToken: token } = req.body;
    if (!token) throw new AppError('Refresh token required', 400, 'MISSING_TOKEN');

    let decoded;
    try { decoded = verifyRefreshToken(token); }
    catch { throw new AppError('Invalid or expired refresh token', 401, 'TOKEN_INVALID'); }

    const result = await query('SELECT id, username, refresh_token_hash FROM users WHERE id = $1', [decoded.userId]);
    const user = result.rows[0];
    if (!user || !user.refresh_token_hash) throw new AppError('Session not found', 401, 'SESSION_NOT_FOUND');

    const match = await bcrypt.compare(token, user.refresh_token_hash);
    if (!match) throw new AppError('Invalid refresh token', 401, 'TOKEN_INVALID');

    const newAccessToken  = signAccessToken({ type: 'user', userId: user.id, username: user.username });
    const newRefreshToken = signRefreshToken({ type: 'user', userId: user.id });
    const newHash = await bcrypt.hash(newRefreshToken, 8);
    await query('UPDATE users SET refresh_token_hash = $1 WHERE id = $2', [newHash, user.id]);

    res.json({ success: true, data: { accessToken: newAccessToken, refreshToken: newRefreshToken } });
  } catch (err) { next(err); }
}

async function logout(req, res, next) {
  try {
    await query('UPDATE users SET refresh_token_hash = NULL WHERE id = $1', [req.user.userId]);
    res.json({ success: true, data: { message: 'Logged out successfully' } });
  } catch (err) { next(err); }
}

async function updatePassword(req, res, next) {
  try {
    const { old_password, new_password } = req.body;
    const result = await query('SELECT username, email, password_hash FROM users WHERE id = $1', [req.user.userId]);
    const user = result.rows[0];
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');
    const match = await bcrypt.compare(old_password, user.password_hash);
    if (!match) throw new AppError('Incorrect old password', 400, 'INVALID_CREDENTIALS');

    const passwordHash = await bcrypt.hash(new_password, SALT_ROUNDS);
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, req.user.userId]);
    
    // Notify user of successful password update
    if (user.email) {
      sendActionEmail(
        user.email,
        user.username,
        'Password Changed Successfully',
        'Your ThinkTrophy password was recently changed from your account settings. You can now use your new password to log in.'
      ).catch(err => console.error('Failed to send password changed email:', err));
    }

    res.json({ success: true, data: { message: 'Password updated successfully.' } });
  } catch (err) { next(err); }
}

async function adminLogin(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await query(
      'SELECT id, name, email, password_hash, role FROM admins WHERE email = $1',
      [email]
    );
    const admin = result.rows[0];
    if (!admin) throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');

    const match = await bcrypt.compare(password, admin.password_hash);
    if (!match) throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');

    const token = signAdminToken({ type: 'admin', adminId: admin.id, email: admin.email, role: admin.role });
    res.json({
      success: true,
      data: { admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role }, token },
    });
  } catch (err) { next(err); }
}

async function adminUpdatePassword(req, res, next) {
  try {
    const { old_password, new_password } = req.body;
    const result = await query('SELECT name, email, password_hash FROM admins WHERE id = $1', [req.admin.adminId]);
    const admin = result.rows[0];
    if (!admin) throw new AppError('Admin not found', 404, 'NOT_FOUND');
    const match = await bcrypt.compare(old_password, admin.password_hash);
    if (!match) throw new AppError('Incorrect old password', 400, 'INVALID_CREDENTIALS');

    const passwordHash = await bcrypt.hash(new_password, SALT_ROUNDS);
    await query('UPDATE admins SET password_hash = $1 WHERE id = $2', [passwordHash, req.admin.adminId]);
    
    if (admin.email) {
      sendActionEmail(
        admin.email,
        admin.name,
        'Admin Password Changed Successfully',
        'Your ThinkTrophy admin password was recently changed from your account settings. You can now use your new password to log in.'
      ).catch(err => console.error('Failed to send admin password changed email:', err));
    }

    res.json({ success: true, data: { message: 'Password updated successfully.' } });
  } catch (err) { next(err); }
}

async function adminForgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    const result = await query('SELECT id, name FROM admins WHERE email = $1', [email]);
    const admin = result.rows[0];
    if (admin) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const hash = await bcrypt.hash(code, 8);
      const expires = new Date(Date.now() + 15 * 60 * 1000);
      await query('UPDATE admins SET password_reset_code_hash = $1, password_reset_expires_at = $2 WHERE id = $3', [hash, expires, admin.id]);
      await sendPasswordResetEmail(email, admin.name, code);
    }
    res.json({ success: true, data: { message: 'If that email exists, a reset code has been sent.' } });
  } catch (err) { next(err); }
}

async function adminResetPassword(req, res, next) {
  try {
    const { email, code, new_password } = req.body;
    const result = await query('SELECT id, name, password_reset_code_hash, password_reset_expires_at FROM admins WHERE email = $1', [email]);
    const admin = result.rows[0];
    if (!admin || !admin.password_reset_code_hash || new Date() > new Date(admin.password_reset_expires_at)) {
      throw new AppError('Invalid or expired reset code', 400, 'INVALID_CODE');
    }
    const match = await bcrypt.compare(code, admin.password_reset_code_hash);
    if (!match) throw new AppError('Invalid or expired reset code', 400, 'INVALID_CODE');

    const passwordHash = await bcrypt.hash(new_password, SALT_ROUNDS);
    await query('UPDATE admins SET password_hash = $1, password_reset_code_hash = NULL, password_reset_expires_at = NULL WHERE id = $2', [passwordHash, admin.id]);
    
    sendActionEmail(
      email,
      admin.name,
      'Admin Password Reset Successfully',
      'Your ThinkTrophy admin password has been successfully reset. You can now log in using your new password.'
    ).catch(err => console.error('Failed to send admin password reset success email:', err));

    res.json({ success: true, data: { message: 'Password reset successfully. You can now log in.' } });
  } catch (err) { next(err); }
}

module.exports = { register, login, forgotPassword, resetPassword, updatePassword, verifyEmail, resendVerification, refreshToken, logout, adminLogin, adminForgotPassword, adminResetPassword, adminUpdatePassword };
