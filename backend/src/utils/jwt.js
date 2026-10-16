const jwt = require('jsonwebtoken');
require('dotenv').config();

// For development without RSA keys, fall back to HS256 with a symmetric secret.
// In production, set JWT_PRIVATE_KEY and JWT_PUBLIC_KEY (base64-encoded RSA-2048 PEM).

const isDev = process.env.NODE_ENV !== 'production';

function hasRsaKeys() {
  return Boolean(
    process.env.JWT_PRIVATE_KEY &&
    process.env.JWT_PRIVATE_KEY !== 'REPLACE_WITH_BASE64_ENCODED_RSA_PRIVATE_KEY' &&
    process.env.JWT_PUBLIC_KEY &&
    process.env.JWT_PUBLIC_KEY !== 'REPLACE_WITH_BASE64_ENCODED_RSA_PUBLIC_KEY'
  );
}

function getAccessHsSecret() {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (secret && secret !== 'REPLACE_WITH_LONG_RANDOM_STRING_64_CHARS') return secret;
  if (!isDev) throw new Error('JWT_ACCESS_SECRET is not configured');
  return 'dev-access-secret-change-me';
}

function getPrivateKey() {
  if (hasRsaKeys()) {
    return Buffer.from(process.env.JWT_PRIVATE_KEY, 'base64').toString('utf8');
  }
  if (isDev) return getAccessHsSecret();
  throw new Error('JWT_PRIVATE_KEY is not configured');
}

function getPublicKey() {
  if (hasRsaKeys()) {
    return Buffer.from(process.env.JWT_PUBLIC_KEY, 'base64').toString('utf8');
  }
  if (isDev) return getAccessHsSecret();
  throw new Error('JWT_PUBLIC_KEY is not configured');
}

function getAlgorithm() {
  return hasRsaKeys() ? 'RS256' : 'HS256';
}

function getRefreshSecret() {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret || secret === 'REPLACE_WITH_LONG_RANDOM_STRING_64_CHARS') {
    if (!isDev) throw new Error('JWT_REFRESH_SECRET is not configured');
    return 'dev-refresh-secret';
  }
  return secret;
}

// ─── Access token (15min) ───────────────────────────────────────────────────
function signAccessToken(payload) {
  const algo = getAlgorithm();
  const key  = getPrivateKey();
  return jwt.sign(payload, key, {
    algorithm: algo,
    expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
    issuer: 'thinktrophy',
  });
}

function verifyAccessToken(token) {
  const algo = getAlgorithm();
  const key  = getPublicKey();
  return jwt.verify(token, key, { algorithms: [algo], issuer: 'thinktrophy' });
}

// ─── Refresh token (7d) ─────────────────────────────────────────────────────
function signRefreshToken(payload) {
  return jwt.sign(payload, getRefreshSecret(), {
    algorithm: 'HS256',
    expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d',
    issuer: 'thinktrophy',
  });
}

function verifyRefreshToken(token) {
  const decoded = jwt.verify(token, getRefreshSecret(), {
    algorithms: ['HS256'],
    issuer: 'thinktrophy',
  });
  if (decoded.type !== 'refresh') {
    throw new Error('Invalid refresh token type');
  }
  return decoded;
}

// ─── Game session token ──────────────
function signSessionToken(payload, expirySeconds) {
  const algo    = getAlgorithm();
  const key     = getPrivateKey();
  const expiry  = expirySeconds || parseInt(process.env.GAME_SESSION_EXPIRY_SECONDS || '110', 10);
  return jwt.sign(payload, key, {
    algorithm: algo,
    expiresIn: expiry,
    issuer: 'thinktrophy',
  });
}

function verifySessionToken(token) {
  const algo = getAlgorithm();
  const key  = getPublicKey();
  return jwt.verify(token, key, { algorithms: [algo], issuer: 'thinktrophy' });
}

// ─── Admin access token (1h) ────────────────────────────────────────────────
function signAdminToken(payload) {
  const algo = getAlgorithm();
  const key  = getPrivateKey();
  return jwt.sign(payload, key, { algorithm: algo, expiresIn: '1h', issuer: 'thinktrophy' });
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  signSessionToken,
  verifySessionToken,
  signAdminToken,
};
