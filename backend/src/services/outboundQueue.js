const { query, getClient } = require('../db/connection');

const RETRY_DELAYS_MS = [
  30 * 1000,
  2 * 60 * 1000,
  5 * 60 * 1000,
  15 * 60 * 1000,
  60 * 60 * 1000,
  4 * 60 * 60 * 1000,
  12 * 60 * 60 * 1000,
];

function retryDelayMs(attempts) {
  const idx = Math.max(0, Math.min(attempts - 1, RETRY_DELAYS_MS.length - 1));
  return RETRY_DELAYS_MS[idx];
}

async function enqueueOutbound({
  kind,
  jobName,
  payload,
  priority = 50,
  maxAttempts = 8,
  idempotencyKey = null,
}) {
  const result = await query(
    `INSERT INTO outbound_jobs
       (kind, job_name, payload, priority, max_attempts, idempotency_key)
     VALUES ($1, $2, $3::jsonb, $4, $5, $6)
     ON CONFLICT (kind, job_name, idempotency_key) WHERE idempotency_key IS NOT NULL
     DO NOTHING
     RETURNING id`,
    [kind, jobName, JSON.stringify(payload || {}), priority, maxAttempts, idempotencyKey]
  );
  return result.rows[0]?.id || null;
}

async function claimNext({ kind = null, maxPriority = null } = {}) {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `WITH next AS (
         SELECT id
         FROM outbound_jobs
         WHERE status = 'pending'
           AND available_at <= NOW()
           AND ($1::text IS NULL OR kind = $1)
           AND ($2::smallint IS NULL OR priority <= $2)
         ORDER BY priority ASC, available_at ASC
         LIMIT 1
         FOR UPDATE SKIP LOCKED
       )
       UPDATE outbound_jobs j
       SET status = 'processing', updated_at = NOW()
       FROM next
       WHERE j.id = next.id
       RETURNING j.*`,
      [kind, maxPriority]
    );
    await client.query('COMMIT');
    return result.rows[0] || null;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function claimById(id) {
  const result = await query(
    `UPDATE outbound_jobs
     SET status = 'processing', updated_at = NOW()
     WHERE id = $1 AND status = 'pending'
     RETURNING *`,
    [id]
  );
  return result.rows[0] || null;
}

async function markSent(id) {
  await query(
    `UPDATE outbound_jobs
     SET status = 'sent', processed_at = NOW(), last_error = NULL, updated_at = NOW()
     WHERE id = $1`,
    [id]
  );
}

async function markFailed(id, errorMessage, attempts) {
  await query(
    `UPDATE outbound_jobs
     SET status = 'failed', attempts = COALESCE($2, attempts), last_error = $3,
         processed_at = NOW(), updated_at = NOW()
     WHERE id = $1`,
    [id, attempts == null ? null : attempts, errorMessage]
  );
}

async function markRetryOrFailed(job, errorMessage) {
  const attempts = (job.attempts || 0) + 1;
  const maxAttempts = job.max_attempts || 8;
  if (attempts >= maxAttempts) {
    await query(
      `UPDATE outbound_jobs
       SET status = 'failed', attempts = $2, last_error = $3, processed_at = NOW(), updated_at = NOW()
       WHERE id = $1`,
      [job.id, attempts, errorMessage]
    );
    return { status: 'failed', attempts };
  }

  const delay = retryDelayMs(attempts);
  await query(
    `UPDATE outbound_jobs
     SET status = 'pending', attempts = $2, last_error = $3,
         available_at = NOW() + ($4 * INTERVAL '1 millisecond'), updated_at = NOW()
     WHERE id = $1`,
    [job.id, attempts, errorMessage, delay]
  );
  return { status: 'pending', attempts, delayMs: delay };
}

async function requeueJob(id) {
  const result = await query(
    `UPDATE outbound_jobs
     SET status = 'pending', attempts = 0, available_at = NOW(), updated_at = NOW()
     WHERE id = $1 AND status IN ('failed', 'pending')
     RETURNING id`,
    [id]
  );
  return result.rows[0] || null;
}

async function activeGameCount() {
  const result = await query(
    `SELECT COUNT(*)::int AS n FROM game_sessions WHERE status = 'active'`
  );
  return result.rows[0]?.n || 0;
}

async function listOutboundJobs({ kind, status, page = 1, limit = 50 } = {}) {
  const conditions = [];
  const params = [];
  if (kind) {
    params.push(kind);
    conditions.push(`kind = $${params.length}`);
  }
  if (status) {
    params.push(status);
    conditions.push(`status = $${params.length}`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  params.push(parseInt(limit, 10), offset);

  const result = await query(
    `SELECT id, kind, job_name, payload, status, priority, attempts, max_attempts,
            last_error, idempotency_key, available_at, processed_at, created_at
     FROM outbound_jobs
     ${where}
     ORDER BY created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  const countRes = await query(
    `SELECT COUNT(*) FROM outbound_jobs ${where}`,
    params.slice(0, -2)
  );
  const summary = await query(
    `SELECT
       COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
       COUNT(*) FILTER (WHERE status = 'processing')::int AS processing,
       COUNT(*) FILTER (WHERE status = 'failed')::int AS failed,
       COUNT(*) FILTER (WHERE status = 'sent')::int AS sent,
       COUNT(*) FILTER (WHERE kind = 'email' AND status IN ('pending', 'failed'))::int AS email_open,
       COUNT(*) FILTER (WHERE kind = 'zoho' AND status IN ('pending', 'failed'))::int AS zoho_open
     FROM outbound_jobs`
  );
  return {
    rows: result.rows,
    total: parseInt(countRes.rows[0].count, 10),
    summary: summary.rows[0],
  };
}

module.exports = {
  enqueueOutbound,
  claimNext,
  claimById,
  markSent,
  markFailed,
  markRetryOrFailed,
  requeueJob,
  activeGameCount,
  listOutboundJobs,
  retryDelayMs,
};
