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
  role          VARCHAR(20)  NOT NULL DEFAULT 'moderator'
                CHECK (role IN ('super_admin','moderator')),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

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
  phone_number       VARCHAR(20),
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

-- ─────────────────────────────────────────────────
--  TRANSACTIONS
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type            VARCHAR(20)  NOT NULL CHECK (type IN ('deposit','stake','payout','withdrawal')),
  amount          NUMERIC(12,2) NOT NULL,
  status          VARCHAR(20)  NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','verified','failed','reversed')),
  reference       VARCHAR(255),
  game_session_id UUID         REFERENCES game_sessions(id) ON DELETE SET NULL,
  metadata        JSONB,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user   ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type   ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_date   ON transactions(created_at);
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
