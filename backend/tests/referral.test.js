/**
 * Referral bonus integration test.
 *
 * Runs against a throwaway database (thinktrophy_referral_test) created next to the dev
 * database and dropped at the end, so no real data is touched. Email and Zoho Books are
 * stubbed so nothing is sent and no external API is called.
 *
 * Run: npm test
 */
process.env.NODE_ENV = 'development';
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { Client } = require('pg');

const SCRATCH_DB = 'thinktrophy_referral_test';
const devUrl = new URL(process.env.DATABASE_URL);
const adminUrl = new URL(devUrl); adminUrl.pathname = '/postgres';
const scratchUrl = new URL(devUrl); scratchUrl.pathname = `/${SCRATCH_DB}`;

// Must be set before any app module is required.
process.env.DATABASE_URL = scratchUrl.toString();
process.env.REDIS_URL = '';

// ── Stubs: no emails, no Zoho calls ────────────────────────────────────────
const calls = [];
function stub(modulePath) {
  const resolved = require.resolve(modulePath);
  const proxy = new Proxy({}, {
    get(_t, prop) {
      if (typeof prop === 'symbol' || prop === 'then') return undefined;
      return (...args) => { calls.push({ fn: String(prop), args }); return Promise.resolve(true); };
    },
  });
  require.cache[resolved] = { id: resolved, filename: resolved, loaded: true, exports: proxy };
}
stub('../src/utils/emailService');
stub('../src/services/zohoService');

let pool, query, authController, gameService, cache;

const CATEGORY_COUNT = 7;
let categoryIds = [];
let seq = 0;

async function createScratchDb() {
  const admin = new Client({ connectionString: adminUrl.toString() });
  await admin.connect();
  try {
    await admin.query(`DROP DATABASE IF EXISTS ${SCRATCH_DB} WITH (FORCE)`);
    await admin.query(`CREATE DATABASE ${SCRATCH_DB}`);
  } finally {
    await admin.end();
  }
  execFileSync(process.execPath, [path.join(__dirname, '..', 'src', 'db', 'migrate.js')], {
    env: { ...process.env },
    stdio: 'pipe',
  });
}

async function dropScratchDb() {
  const admin = new Client({ connectionString: adminUrl.toString() });
  await admin.connect();
  try { await admin.query(`DROP DATABASE IF EXISTS ${SCRATCH_DB} WITH (FORCE)`); }
  finally { await admin.end(); }
}

async function seedQuestions() {
  for (let c = 0; c < CATEGORY_COUNT; c++) {
    const cat = await query('INSERT INTO categories (name) VALUES ($1) RETURNING id', [`Cat ${c}`]);
    categoryIds.push(cat.rows[0].id);
    for (let q = 0; q < 30; q++) {
      await query(
        `INSERT INTO questions (category_id, question_text, option_a, option_b, option_c, option_d, correct_option, difficulty)
         VALUES ($1, $2, 'right', 'wrong1', 'wrong2', 'wrong3', 'a', $3)`,
        [cat.rows[0].id, `Question ${c}-${q}?`, ['easy', 'medium', 'hard'][q % 3]]
      );
    }
  }
}

async function setSetting(key, value) {
  await query(
    `INSERT INTO platform_settings (key, value) VALUES ($1, $2)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [key, String(value)]
  );
  await cache.del('platform_settings');
}

async function register({ referral_code } = {}) {
  seq += 1;
  const req = {
    body: {
      username: `user${seq}`,
      email: `user${seq}@example.test`,
      password: 'Passw0rd!',
      phone_number: `0800000${String(seq).padStart(4, '0')}`,
      first_name: 'Test',
      last_name: `User${seq}`,
      dob: '1990-01-01',
      referral_code,
    },
  };
  let status; let body;
  const res = { status(c) { status = c; return this; }, json(b) { body = b; } };
  await authController.register(req, res, (err) => { throw err; });
  assert.equal(status, 201);
  const u = await query(
    'SELECT id, referral_code, referred_by FROM users WHERE email = $1',
    [req.body.email]
  );
  await query('UPDATE users SET email_verified = TRUE, wallet_balance = 5000 WHERE id = $1', [u.rows[0].id]);
  return u.rows[0];
}

async function wallet(userId) {
  const r = await query('SELECT wallet_balance, total_won FROM users WHERE id = $1', [userId]);
  return { balance: Number(r.rows[0].wallet_balance), totalWon: Number(r.rows[0].total_won) };
}

async function bonusRows(referrerId) {
  const r = await query(
    `SELECT amount, game_session_id, metadata FROM transactions
     WHERE user_id = $1 AND type = 'referral_bonus' ORDER BY created_at`,
    [referrerId]
  );
  return r.rows.map(x => ({ ...x, amount: Number(x.amount) }));
}

/** Play one full game; `wrongAt` is a set of 0-based question indexes to answer wrongly. */
async function playGame(userId, stake, wrongAt = []) {
  const started = await gameService.createSession(userId, categoryIds, stake);
  let result;
  for (let i = 0; i < 10; i++) {
    const row = (await query('SELECT * FROM game_sessions WHERE id = $1', [started.sessionId])).rows[0];
    const track = row.active_track || 'b';
    const questionId = (track === 'a' ? row.question_ids_track_a : row.question_ids_track_b)[i];
    const map = row.answer_option_maps.find(m => m.questionId === questionId);
    const letter = wrongAt.includes(i) ? 'b' : 'a';
    result = await gameService.submitAnswer(userId, started.sessionId, map[`uuid_${letter}`], started.sessionToken);
  }
  assert.equal(result.gameComplete, true);
  // Let fire-and-forget Zoho stubs register.
  await new Promise(r => setImmediate(r));
  return { sessionId: started.sessionId, ...result };
}

test.before(async () => {
  await createScratchDb();
  ({ pool, query } = require('../src/db/connection'));
  cache = require('../src/utils/cache');
  authController = require('../src/controllers/authController');
  gameService = require('../src/services/gameService');
  await seedQuestions();
  await setSetting('referral_win_percentage', '0.10');
  await setSetting('user_win_tax_percentage', '0.05');
  await setSetting('payout_perfect', '2.0');
  await setSetting('payout_nine', '0.5');
  await setSetting('min_stake', '500');
  await setSetting('max_stake', '5000');
});

test.after(async () => {
  if (pool) await pool.end();
  await dropScratchDb();
});

test('registration links the referrer (case-insensitive) and ignores bad codes', async () => {
  const referrer = await register();
  assert.match(referrer.referral_code, /^[A-F0-9]{8}$/);
  assert.equal(referrer.referred_by, null);

  const viaCode = await register({ referral_code: referrer.referral_code });
  assert.equal(viaCode.referred_by, referrer.id);

  const viaLower = await register({ referral_code: referrer.referral_code.toLowerCase() });
  assert.equal(viaLower.referred_by, referrer.id);

  const bad = await register({ referral_code: 'ZZZZZZZZ' });
  assert.equal(bad.referred_by, null);
});

test('10/10 first win: referrer gets 10% of profit (₦500 stake -> ₦50), once only', async () => {
  const referrer = await register();
  const referee = await register({ referral_code: referrer.referral_code });
  calls.length = 0;

  const before = await wallet(referee.id);
  const game = await playGame(referee.id, 500);

  assert.equal(game.score, 10);
  assert.equal(game.grossPayout, 1000);
  assert.equal(game.taxAmount, 25);   // 5% of the ₦500 profit
  assert.equal(game.payout, 975);

  const after = await wallet(referee.id);
  assert.equal(after.balance, before.balance - 500 + 975);

  const refWallet = await wallet(referrer.id);
  assert.equal(refWallet.balance, 5050);

  const rows = await bonusRows(referrer.id);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].amount, 50);
  assert.equal(rows[0].game_session_id, game.sessionId);
  assert.equal(rows[0].metadata.referred_user_id, referee.id);

  const zoho = calls.filter(c => c.fn === 'syncReferralBonus');
  assert.equal(zoho.length, 1);
  assert.deepEqual(zoho[0].args.slice(0, 3), [referrer.id, 50, game.sessionId]);

  // Second win by the same referee: no further bonus.
  calls.length = 0;
  await playGame(referee.id, 500);
  assert.equal((await bonusRows(referrer.id)).length, 1);
  assert.equal((await wallet(referrer.id)).balance, 5050);
  assert.equal(calls.filter(c => c.fn === 'syncReferralBonus').length, 0);
});

test('9/10 first win: bonus is 10% of the amount returned (₦250 -> ₦25)', async () => {
  const referrer = await register();
  const referee = await register({ referral_code: referrer.referral_code });

  const game = await playGame(referee.id, 500, [9]);
  assert.equal(game.score, 9);
  assert.equal(game.grossPayout, 250);
  assert.equal(game.taxAmount, 12.5);
  assert.equal(game.payout, 237.5);

  const rows = await bonusRows(referrer.id);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].amount, 25);
  assert.equal((await wallet(referrer.id)).balance, 5025);
});

test('a loss pays nothing; the bonus is paid on the first actual win', async () => {
  const referrer = await register();
  const referee = await register({ referral_code: referrer.referral_code });

  const loss = await playGame(referee.id, 500, [0, 1, 2]);
  assert.equal(loss.grossPayout, 0);
  assert.equal((await bonusRows(referrer.id)).length, 0);
  assert.equal((await wallet(referrer.id)).balance, 5000);

  await playGame(referee.id, 500);
  const rows = await bonusRows(referrer.id);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].amount, 50);
});

test('users without a referrer never trigger a bonus', async () => {
  const solo = await register();
  const before = await query(`SELECT COUNT(*)::int AS n FROM transactions WHERE type = 'referral_bonus'`);
  await playGame(solo.id, 500);
  const after = await query(`SELECT COUNT(*)::int AS n FROM transactions WHERE type = 'referral_bonus'`);
  assert.equal(after.rows[0].n, before.rows[0].n);
});

test('the admin percentage setting is respected (20% -> ₦100)', async () => {
  await setSetting('referral_win_percentage', '0.20');
  try {
    const referrer = await register();
    const referee = await register({ referral_code: referrer.referral_code });
    await playGame(referee.id, 500);
    const rows = await bonusRows(referrer.id);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].amount, 100);
  } finally {
    await setSetting('referral_win_percentage', '0.10');
  }
});

test('correcting a graded answer adjusts the referral bonus', async () => {
  const referrer = await register();
  const referee = await register({ referral_code: referrer.referral_code });

  // 9/10 -> bonus 25, then admin marks the wrong answer correct -> 10/10 -> bonus 50.
  const game = await playGame(referee.id, 500, [9]);
  assert.equal((await bonusRows(referrer.id))[0].amount, 25);

  const row = (await query('SELECT * FROM game_sessions WHERE id = $1', [game.sessionId])).rows[0];
  const wrongQuestion = row.answers_submitted.find(a => !a.is_correct).question_id;
  await gameService.correctSessionGrade(game.sessionId, wrongQuestion, true);

  const total = (await bonusRows(referrer.id)).reduce((s, r) => s + r.amount, 0);
  assert.equal(total, 50);
  assert.equal((await wallet(referrer.id)).balance, 5050);
});
