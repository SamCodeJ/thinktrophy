const { Pool } = require('pg');
require('dotenv').config();

function sslConfig() {
  if (process.env.DB_SSL === 'false') return false;
  const url = process.env.DATABASE_URL || '';
  const production = process.env.NODE_ENV === 'production';
  const urlWantsSsl = /sslmode=(require|verify-ca|verify-full)/i.test(url);
  if (!production && !urlWantsSsl && process.env.DB_SSL !== 'true') return false;
  return { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' };
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: parseInt(process.env.DB_POOL_MAX || '10', 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  statement_timeout: 15000,
  ssl: sslConfig(),
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

const query = (text, params) => pool.query(text, params);

const getClient = () => pool.connect();

module.exports = { pool, query, getClient };
