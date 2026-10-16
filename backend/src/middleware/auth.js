const { verifyAccessToken, signAdminToken } = require('../utils/jwt');
const { query } = require('../db/connection');

function requireUser(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No token provided' } });
  }
  const token = header.slice(7);
  try {
    const decoded = verifyAccessToken(token);
    if (decoded.type !== 'user') {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid token type' } });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: { code: 'TOKEN_EXPIRED', message: 'Invalid or expired token' } });
  }
}

async function requireAdmin(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No token provided' } });
  }
  const token = header.slice(7);
  try {
    const decoded = verifyAccessToken(token);
    if (decoded.type !== 'admin' || !decoded.adminId) {
      return res.status(401).json({ success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } });
    }
    const result = await query(
      'SELECT id, name, email, role, token_version FROM admins WHERE id = $1',
      [decoded.adminId]
    );
    const admin = result.rows[0];
    if (!admin) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Admin account not found' } });
    }
    const dbVersion = Number(admin.token_version ?? 0);
    const tokenVersion = Number(decoded.tokenVersion ?? 0);
    if (dbVersion !== tokenVersion) {
      return res.status(401).json({ success: false, error: { code: 'TOKEN_EXPIRED', message: 'Invalid or expired token' } });
    }
    req.admin = { type: 'admin', adminId: admin.id, email: admin.email, role: admin.role, name: admin.name };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: { code: 'TOKEN_EXPIRED', message: 'Invalid or expired token' } });
  }
}

function requireSuperAdmin(req, res, next) {
  requireAdmin(req, res, () => {
    if (req.admin.role !== 'super_admin') {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Super admin access required' } });
    }
    next();
  });
}

function requireModeratorOrAbove(req, res, next) {
  requireAdmin(req, res, () => {
    if (req.admin.role === 'viewer') {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You do not have permission to perform this action. Viewer access only.' } });
    }
    next();
  });
}

async function requireActiveUser(req, res, next) {
  requireUser(req, res, async () => {
    try {
      const result = await query('SELECT is_active FROM users WHERE id = $1', [req.user.userId]);
      if (!result.rows[0] || !result.rows[0].is_active) {
        return res.status(403).json({ success: false, error: { code: 'ACCOUNT_DISABLED', message: 'Your account has been disabled' } });
      }
      next();
    } catch (err) {
      next(err);
    }
  });
}

async function requireVerifiedEmail(req, res, next) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No token provided' } });
    }
    const result = await query('SELECT email_verified FROM users WHERE id = $1', [req.user.userId]);
    if (!result.rows[0]?.email_verified) {
      return res.status(403).json({
        success: false,
        error: { code: 'EMAIL_NOT_VERIFIED', message: 'Please verify your email before using wallet features' },
      });
    }
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { requireUser, requireAdmin, requireSuperAdmin, requireModeratorOrAbove, requireActiveUser, requireVerifiedEmail };
