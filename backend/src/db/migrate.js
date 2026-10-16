require('dotenv').config();
const { pool } = require('./connection');

const SQL = `
-- Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────────
--  ADMINS
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admins (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT         NOT NULL,
  role          VARCHAR(20)  NOT NULL DEFAULT 'viewer'
                CHECK (role IN ('super_admin','moderator','viewer')),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Update existing admins table if needed
ALTER TABLE admins DROP CONSTRAINT IF EXISTS admins_role_check;
ALTER TABLE admins ADD CONSTRAINT admins_role_check CHECK (role IN ('super_admin','moderator','viewer'));

-- ─────────────────────────────────────────────────
--  PLATFORM SETTINGS
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS platform_settings (
  key        VARCHAR(100) PRIMARY KEY,
  value      TEXT         NOT NULL,
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────
--  USERS
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                 UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  username           VARCHAR(50)  NOT NULL UNIQUE,
  email              VARCHAR(255) NOT NULL UNIQUE,
  password_hash      TEXT         NOT NULL,
  first_name         VARCHAR(100) NOT NULL,
  last_name          VARCHAR(100) NOT NULL,
  phone_number       VARCHAR(20)  NOT NULL,
  dob                DATE         NOT NULL,
  wallet_balance     NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  total_games_played INTEGER       NOT NULL DEFAULT 0,
  total_won          NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  total_staked       NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  is_active                      BOOLEAN       NOT NULL DEFAULT TRUE,
  email_verified                 BOOLEAN       NOT NULL DEFAULT FALSE,
  verification_token_hash        TEXT,
  verification_token_expires_at  TIMESTAMPTZ,
  refresh_token_hash             TEXT,
  created_at                     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Add email verification columns to existing databases
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified                BOOLEAN     NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token_hash       TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token_expires_at TIMESTAMPTZ;

ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_locked_until TIMESTAMPTZ;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS password_reset_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS password_reset_locked_until TIMESTAMPTZ;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 0;

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_wallet_balance_non_negative;
ALTER TABLE users ADD CONSTRAINT users_wallet_balance_non_negative CHECK (wallet_balance >= 0);

-- Add referral system columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add new user profile columns to existing databases
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS dob DATE;
ALTER TABLE users ALTER COLUMN phone_number SET NOT NULL;

-- ─────────────────────────────────────────────────
--  CATEGORIES
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon_name   VARCHAR(50)  NOT NULL DEFAULT 'help-circle',
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────
--  QUESTIONS
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS questions (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id             UUID        NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  question_text           TEXT        NOT NULL,
  option_a                TEXT        NOT NULL,
  option_b                TEXT        NOT NULL,
  option_c                TEXT        NOT NULL,
  option_d                TEXT        NOT NULL,
  correct_option          CHAR(1)     NOT NULL CHECK (correct_option IN ('a','b','c','d')),
  difficulty              VARCHAR(10) NOT NULL CHECK (difficulty IN ('easy','medium','hard')),
  is_active               BOOLEAN     NOT NULL DEFAULT TRUE,
  times_served            INTEGER     NOT NULL DEFAULT 0,
  times_answered_correctly INTEGER    NOT NULL DEFAULT 0,
  created_by              UUID        REFERENCES admins(id) ON DELETE SET NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_questions_category   ON questions(category_id);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_active     ON questions(is_active);
CREATE INDEX IF NOT EXISTS idx_questions_cat_diff   ON questions(category_id, difficulty, is_active);

-- ─────────────────────────────────────────────────
--  GAME SESSIONS
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS game_sessions (
  id                       UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token            TEXT         NOT NULL,
  stake_amount             NUMERIC(12,2) NOT NULL,
  selected_category_ids    UUID[]       NOT NULL,
  question_ids_track_a     UUID[]       NOT NULL,  -- questions 1-5 + hard track for 6-10
  question_ids_track_b     UUID[]       NOT NULL,  -- questions 1-5 + normal track for 6-10
  active_track             CHAR(1),               -- 'a' (hard) or 'b' (normal), set after Q5
  current_question_index   INTEGER      NOT NULL DEFAULT 0,
  status                   VARCHAR(20)  NOT NULL DEFAULT 'pending_payment'
                           CHECK (status IN ('pending_payment','active','completed','expired','invalidated')),
  score                    INTEGER      DEFAULT 0,
  payout_amount            NUMERIC(12,2) DEFAULT 0.00,
  answer_option_maps       JSONB,       -- [{questionId, uuidA, uuidB, uuidC, uuidD, correctUuid}]
  answers_submitted        JSONB        NOT NULL DEFAULT '[]',
  started_at               TIMESTAMPTZ,
  completed_at             TIMESTAMPTZ,
  created_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user   ON game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON game_sessions(status);

-- Keep only the newest active session per user, then enforce uniqueness
UPDATE game_sessions SET status = 'expired', completed_at = COALESCE(completed_at, NOW())
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY started_at DESC NULLS LAST, created_at DESC) AS rn
    FROM game_sessions
    WHERE status = 'active'
  ) ranked
  WHERE rn > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_session_per_user
  ON game_sessions (user_id) WHERE status = 'active';

-- ─────────────────────────────────────────────────
--  ADMIN LOGS
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id    UUID        REFERENCES admins(id) ON DELETE SET NULL,
  action      VARCHAR(50) NOT NULL,
  entity      VARCHAR(50) NOT NULL,
  entity_id   UUID,
  details     JSONB,
  ip_address  VARCHAR(45),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_logs_date ON admin_logs(created_at);

-- ─────────────────────────────────────────────────
--  TRANSACTIONS
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type            VARCHAR(20)  NOT NULL CHECK (type IN ('deposit','stake','payout','withdrawal','referral_bonus','tax_deduction')),
  amount          NUMERIC(12,2) NOT NULL,
  status          VARCHAR(20)  NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','verified','failed','reversed')),
  reference       VARCHAR(255),
  game_session_id UUID         REFERENCES game_sessions(id) ON DELETE SET NULL,
  metadata        JSONB,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Update existing transactions table if needed
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_type_check CHECK (type IN ('deposit','stake','payout','withdrawal','referral_bonus','tax_deduction'));

ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(12,2) DEFAULT 0.00;

CREATE TABLE IF NOT EXISTS user_seen_questions (
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  seen_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, question_id)
);
CREATE INDEX IF NOT EXISTS idx_user_seen_questions_user ON user_seen_questions(user_id);

INSERT INTO user_seen_questions (user_id, question_id)
SELECT DISTINCT gs.user_id, q.id
FROM game_sessions gs
CROSS JOIN LATERAL jsonb_array_elements(COALESCE(gs.answers_submitted, '[]'::jsonb)) ans
JOIN questions q ON q.id = (ans->>'question_id')::uuid
JOIN users u ON u.id = gs.user_id
WHERE ans->>'question_id' IS NOT NULL
ON CONFLICT DO NOTHING;

-- Also mark questions that were shown (including expired games with no answer yet)
INSERT INTO user_seen_questions (user_id, question_id)
SELECT DISTINCT gs.user_id, q.id
FROM game_sessions gs
CROSS JOIN LATERAL unnest(
  CASE WHEN gs.active_track = 'a' THEN gs.question_ids_track_a ELSE gs.question_ids_track_b END
) WITH ORDINALITY AS t(qid, ord)
JOIN questions q ON q.id = qid
JOIN users u ON u.id = gs.user_id
WHERE qid IS NOT NULL
  AND ord <= LEAST(GREATEST(COALESCE(gs.current_question_index, 0) + 1, 1), 10)
ON CONFLICT DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_transactions_user   ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type   ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_date   ON transactions(created_at);

-- ─────────────────────────────────────────────────
--  LANDING PAGE TESTIMONIALS (managed in admin)
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS testimonials (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name   VARCHAR(120) NOT NULL,
  author_title  VARCHAR(200),
  quote         TEXT         NOT NULL,
  rating        SMALLINT     CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  sort_order    INTEGER      NOT NULL DEFAULT 0,
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_testimonials_active_sort ON testimonials (is_active, sort_order);
-- ─────────────────────────────────────────────────
--  WEBHOOK LOGS
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS webhook_logs (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  provider      VARCHAR(50)  NOT NULL DEFAULT 'flutterwave',
  event_type    VARCHAR(100) NOT NULL,
  payload       JSONB        NOT NULL,
  status        VARCHAR(20)  NOT NULL DEFAULT 'processed' CHECK (status IN ('processed', 'failed', 'ignored')),
  error_message TEXT,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_provider ON webhook_logs(provider);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type ON webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_date ON webhook_logs(created_at);

INSERT INTO platform_settings (key, value)
VALUES ('min_withdrawal', '500.00'), ('max_withdrawal', '20000.00')
ON CONFLICT (key) DO NOTHING;

UPDATE platform_settings
SET value = '500.00', updated_at = NOW()
WHERE key = 'min_withdrawal' AND value IN ('5000.00', '5000');

CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_username_lower ON users (LOWER(username));
CREATE INDEX IF NOT EXISTS idx_users_verification_token_hash ON users(verification_token_hash);
CREATE INDEX IF NOT EXISTS idx_user_seen_questions_question ON user_seen_questions(question_id);
`;

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('⏳ Running migrations...');
    await client.query(SQL);
    console.log('✅ Migration complete.');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
