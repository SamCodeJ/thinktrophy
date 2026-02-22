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
    return res.status(401).json({ success: false, error: { code: 'TOKEN_EXPIRED', message: err.message } });
  }
}

function requireAdmin(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No token provided' } });
  }
  const token = header.slice(7);
  try {
    const decoded = verifyAccessToken(token);
    if (decoded.type !== 'admin') {
      return res.status(401).json({ success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } });
    }
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: { code: 'TOKEN_EXPIRED', message: err.message } });
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

module.exports = { requireUser, requireAdmin, requireSuperAdmin, requireActiveUser };
