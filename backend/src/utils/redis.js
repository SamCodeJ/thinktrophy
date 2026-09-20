const Redis = require('ioredis');

let client = null;

function initRedis() {
  if (client) return client;

  const url = (process.env.REDIS_URL || '').trim();
  if (!url) {
    console.log('Redis: REDIS_URL not set — using in-memory cache and rate limits');
    return null;
  }

  client = new Redis(url, {
    maxRetriesPerRequest: 1,
    enableReadyCheck: true,
    enableOfflineQueue: false,
    connectTimeout: 5000,
    retryStrategy(times) {
      if (times > 15) {
        console.error('Redis: stopping reconnect attempts');
        return null;
      }
      return Math.min(times * 200, 2000);
    },
  });

  client.on('connect', () => console.log('Redis: connected'));
  client.on('ready', () => console.log('Redis: ready'));
  client.on('error', (err) => console.error('Redis error:', err.message));
  client.on('close', () => console.warn('Redis: connection closed'));

  return client;
}

function getRedisClient() {
  return client;
}

function getRedis() {
  if (client && client.status === 'ready') return client;
  return null;
}

function isRedisConfigured() {
  return Boolean((process.env.REDIS_URL || '').trim());
}

async function pingRedis() {
  if (!client) return 'disabled';
  try {
    await client.ping();
    return 'ok';
  } catch {
    return 'error';
  }
}

async function closeRedis() {
  if (!client) return;
  try {
    await client.quit();
  } catch {
    client.disconnect();
  }
  client = null;
}

module.exports = { initRedis, getRedis, getRedisClient, isRedisConfigured, pingRedis, closeRedis };
