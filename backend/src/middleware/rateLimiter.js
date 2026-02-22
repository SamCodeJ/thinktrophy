const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many attempts. Please try again after 15 minutes.' },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many requests. Please slow down.' },
  },
});

const answerLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15, // max 15 answer submissions per minute
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Answer submission rate limit exceeded.' },
  },
});

module.exports = { authLimiter, apiLimiter, answerLimiter };
