const { getRedis, initRedis } = require('./redis');

initRedis();

const PREFIX = 'tt:cache:';
const memory = new Map();

function ns(key) {
  return PREFIX + key;
}

function memoryGet(key) {
  const entry = memory.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memory.delete(key);
    return null;
  }
  return entry.value;
}

function memorySet(key, value, ttlMs) {
  memory.set(key, { value, expiresAt: Date.now() + ttlMs });
}

async function get(key) {
  const redis = getRedis();
  if (redis) {
    try {
      const raw = await redis.get(ns(key));
      if (raw == null) return null;
      return JSON.parse(raw);
    } catch (err) {
      console.error('Redis cache get failed:', err.message);
    }
  }
  return memoryGet(key);
}

async function set(key, value, ttlMs = 5 * 60 * 1000) {
  const redis = getRedis();
  if (redis) {
    try {
      await redis.set(ns(key), JSON.stringify(value), 'PX', ttlMs);
      memory.delete(key);
      return;
    } catch (err) {
      console.error('Redis cache set failed:', err.message);
    }
  }
  memorySet(key, value, ttlMs);
}

async function del(key) {
  memory.delete(key);
  const redis = getRedis();
  if (redis) {
    try {
      await redis.del(ns(key));
    } catch (err) {
      console.error('Redis cache del failed:', err.message);
    }
  }
}

async function flush() {
  memory.clear();
  const redis = getRedis();
  if (redis) {
    try {
      const keys = await redis.keys(PREFIX + '*');
      if (keys.length) await redis.del(...keys);
    } catch (err) {
      console.error('Redis cache flush failed:', err.message);
    }
  }
}

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of memory.entries()) {
    if (now > entry.expiresAt) memory.delete(key);
  }
}, 60 * 1000).unref();

module.exports = { set, get, del, flush };
