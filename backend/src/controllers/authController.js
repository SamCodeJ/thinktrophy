const bcrypt = require('bcrypt');
const { query } = require('../db/connection');
const { signAccessToken, signRefreshToken, verifyRefreshToken, signAdminToken } = require('../utils/jwt');
const { AppError } = require('../middleware/errorHandler');

const SALT_ROUNDS = 12;

async function register(req, res, next) {
  try {
    const { username, email, password, phone_number } = req.body;
    const hash = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await query(
      `INSERT INTO users (username, email, password_hash, phone_number)
       VALUES ($1, $2, $3, $4) RETURNING id, username, email, created_at`,
      [username, email, hash, phone_number || null]
    );
    const user = result.rows[0];
    const accessToken  = signAccessToken({ type: 'user', userId: user.id, username: user.username });
    const refreshToken = signRefreshToken({ type: 'user', userId: user.id });

    const refreshHash = await bcrypt.hash(refreshToken, 8);
    await query('UPDATE users SET refresh_token_hash = $1 WHERE id = $2', [refreshHash, user.id]);

    res.status(201).json({
      success: true,
      data: { user: { id: user.id, username: user.username, email: user.email }, accessToken, refreshToken },
    });
  } catch (err) { next(err); }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await query(
      'SELECT id, username, email, password_hash, is_active FROM users WHERE email = $1',
      [email]
    );
    const user = result.rows[0];
    if (!user) throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    if (!user.is_active) throw new AppError('Account is disabled', 403, 'ACCOUNT_DISABLED');

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');

    const accessToken  = signAccessToken({ type: 'user', userId: user.id, username: user.username });
    const refreshToken = signRefreshToken({ type: 'user', userId: user.id });
    const refreshHash  = await bcrypt.hash(refreshToken, 8);
    await query('UPDATE users SET refresh_token_hash = $1 WHERE id = $2', [refreshHash, user.id]);

    res.json({
      success: true,
      data: { user: { id: user.id, username: user.username, email: user.email }, accessToken, refreshToken },
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

module.exports = { register, login, refreshToken, logout, adminLogin };
