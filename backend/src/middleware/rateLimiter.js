const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const { initRedis, getRedisClient } = require('../utils/redis');

initRedis();

function createLimiter(name, options) {
  const redis = getRedisClient();
  const config = {
    standardHeaders: true,
    legacyHeaders: false,
    ...options,
  };
  if (redis) {
    config.store = new RedisStore({
      prefix: `tt:rl:${name}:`,
      sendCommand: (...args) => redis.call(...args),
    });
  }
  return rateLimit(config);
}

const authLimiter = createLimiter('auth', {
  windowMs: 15 * 60 * 1000,
  max: 12,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many attempts. Please try again after 15 minutes.' },
  },
});

const registerLimiter = createLimiter('register', {
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many registration attempts. Please try again later.' },
  },
});

const loginLimiter = createLimiter('login', {
  windowMs: 15 * 60 * 1000,
  max: 40,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many login attempts. Please try again later.' },
  },
});

const apiLimiter = createLimiter('api', {
  windowMs: 60 * 1000,
  max: 300,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many requests. Please slow down.' },
  },
});

const answerLimiter = createLimiter('answer', {
  windowMs: 60 * 1000,
  max: 15,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Answer submission rate limit exceeded.' },
  },
});

const moneyLimiter = createLimiter('money', {
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many payment attempts. Please try again later.' },
  },
});

const usernameCheckLimiter = createLimiter('username', {
  windowMs: 60 * 1000,
  max: 40,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many username checks. Please slow down.' },
  },
});

module.exports = { authLimiter, registerLimiter, loginLimiter, apiLimiter, answerLimiter, moneyLimiter, usernameCheckLimiter };
