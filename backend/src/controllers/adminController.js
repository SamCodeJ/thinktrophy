const { query } = require('../db/connection');
const { AppError } = require('../middleware/errorHandler');
const cache = require('../utils/cache');
const mammoth = require('mammoth');
const { logAdminAction } = require('../utils/logger');

// ─── Dashboard ──────────────────────────────────────────────────────────────
async function getDashboardStats(req, res, next) {
  try {
    const [revenue, users, gamesToday, activeSessions] = await Promise.all([
      query(`SELECT
               COALESCE(SUM(CASE WHEN type='stake'    THEN amount END), 0) AS total_staked,
               COALESCE(SUM(CASE WHEN type='payout'   THEN amount END), 0) AS total_payouts,
               COALESCE(SUM(CASE WHEN type='deposit'  THEN amount END), 0) AS total_deposited,
               COALESCE(SUM(CASE WHEN type='withdrawal' THEN amount END), 0) AS total_withdrawn
             FROM transactions WHERE status = 'verified'`),
      query(`SELECT COUNT(*) AS total_users,
                    COUNT(*) FILTER (WHERE is_active) AS active_users
             FROM users`),
      query(`SELECT COUNT(*) AS games_today
             FROM game_sessions
             WHERE created_at >= CURRENT_DATE`),
      query(`SELECT COUNT(*) AS active_sessions
             FROM game_sessions WHERE status = 'active'`),
    ]);

    const r = revenue.rows[0];
    const netProfit = parseFloat(r.total_staked) - parseFloat(r.total_payouts);

    // Last 30 days daily stats
    const daily = await query(`
      SELECT DATE(created_at) AS date,
             COALESCE(SUM(CASE WHEN type='stake'  THEN amount END),0) AS staked,
             COALESCE(SUM(CASE WHEN type='payout' THEN amount END),0) AS payouts
      FROM transactions
      WHERE status='verified' AND created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC`);

    // Games per category
    const perCategory = await query(`
      SELECT c.name, COUNT(gs.id) AS games_played
      FROM categories c
      LEFT JOIN game_sessions gs ON gs.selected_category_ids @> ARRAY[c.id]
        AND gs.status = 'completed'
      GROUP BY c.id, c.name ORDER BY games_played DESC`);

    // Recent transactions
    const recentTx = await query(`
      SELECT t.id, u.username, t.type, t.amount, t.status, t.reference, t.created_at
      FROM transactions t JOIN users u ON u.id = t.user_id
      ORDER BY t.created_at DESC LIMIT 10`);

    res.json({
      success: true,
      data: {
        kpis: {
          totalStaked:     parseFloat(r.total_staked),
          totalPayouts:    parseFloat(r.total_payouts),
          netProfit,
          totalUsers:      parseInt(users.rows[0].total_users),
          activeUsers:     parseInt(users.rows[0].active_users),
          gamesToday:      parseInt(gamesToday.rows[0].games_today),
          activeSessions:  parseInt(activeSessions.rows[0].active_sessions),
        },
        dailyStats:     daily.rows,
        gamesPerCategory: perCategory.rows,
        recentTransactions: recentTx.rows,
      },
    });
  } catch (err) { next(err); }
}

// ─── Statistics ─────────────────────────────────────────────────────────────
async function getStatistics(req, res, next) {
  try {
    const { period = '30d' } = req.query;
    const intervalMap = { '7d': '7 days', '30d': '30 days', '90d': '90 days' };
    const interval  = intervalMap[period];
    const dateFilter = interval ? `AND created_at >= NOW() - INTERVAL '${interval}'` : '';
    const dateWhere  = interval ? `WHERE created_at >= NOW() - INTERVAL '${interval}'` : '';

    const [financial, userStats, gameStats, questionStats, dailyRevenue, dailyUsers, perCategory, topUsers, topQuestions] =
      await Promise.all([
        query(`
          SELECT
            COALESCE(SUM(CASE WHEN type='stake'       AND status='verified' THEN amount END),0) AS total_staked,
            COALESCE(SUM(CASE WHEN type='payout'      AND status='verified' THEN amount END),0) AS total_payouts,
            COALESCE(SUM(CASE WHEN type='deposit'     AND status='verified' THEN amount END),0) AS total_deposits,
            COALESCE(SUM(CASE WHEN type='withdrawal'  AND status='verified' THEN amount END),0) AS total_withdrawals,
            COUNT(CASE WHEN type='stake'      THEN 1 END)::int AS stake_count,
            COUNT(CASE WHEN type='payout'     THEN 1 END)::int AS payout_count,
            COUNT(CASE WHEN type='deposit'    THEN 1 END)::int AS deposit_count,
            COUNT(CASE WHEN type='withdrawal' THEN 1 END)::int AS withdrawal_count,
            COUNT(CASE WHEN status='pending'  THEN 1 END)::int AS pending_count,
            COUNT(CASE WHEN status='failed'   THEN 1 END)::int AS failed_count
          FROM transactions
          WHERE 1=1 ${dateFilter.replace('AND created_at', 'AND created_at')}`),

        query(`
          SELECT
            COUNT(*)::int                                                            AS total_users,
            COUNT(*) FILTER (WHERE is_active)::int                                  AS active_users,
            COUNT(*) FILTER (WHERE NOT is_active)::int                              AS inactive_users,
            COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::int   AS new_last_7d,
            COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::int  AS new_last_30d,
            ROUND(AVG(total_games_played)::numeric, 1)                              AS avg_games_per_user,
            ROUND(AVG(wallet_balance)::numeric, 2)                                  AS avg_wallet_balance,
            COALESCE(SUM(wallet_balance),0)                                         AS total_wallet_balance
          FROM users`),

        query(`
          SELECT
            COUNT(*)::int                                                             AS total_sessions,
            COUNT(*) FILTER (WHERE status='completed')::int                          AS completed,
            COUNT(*) FILTER (WHERE status='expired')::int                            AS expired,
            COUNT(*) FILTER (WHERE status='active')::int                             AS active,
            COUNT(*) FILTER (WHERE status='pending_payment')::int                    AS pending_payment,
            COUNT(*) FILTER (WHERE status='invalidated')::int                        AS invalidated,
            ROUND(AVG(score) FILTER (WHERE status='completed')::numeric, 1)         AS avg_score,
            ROUND(AVG(stake_amount)::numeric, 2)                                     AS avg_stake,
            ROUND(AVG(payout_amount) FILTER (WHERE payout_amount > 0)::numeric, 2)  AS avg_payout,
            ROUND(AVG(EXTRACT(EPOCH FROM (completed_at - started_at)))
                  FILTER (WHERE status='completed')::numeric, 0)                    AS avg_duration_seconds
          FROM game_sessions
          ${dateWhere}`),

        query(`
          SELECT
            COUNT(*)::int                                                                     AS total_questions,
            COUNT(*) FILTER (WHERE is_active)::int                                           AS active_questions,
            COUNT(*) FILTER (WHERE difficulty='easy')::int                                   AS easy_count,
            COUNT(*) FILTER (WHERE difficulty='medium')::int                                 AS medium_count,
            COUNT(*) FILTER (WHERE difficulty='hard')::int                                   AS hard_count,
            COALESCE(SUM(times_served),0)::int                                               AS total_times_served,
            ROUND(
              AVG(CASE WHEN times_served > 0
                       THEN (times_answered_correctly::decimal / times_served) * 100 END)
            ::numeric, 1)                                                                    AS avg_accuracy
          FROM questions`),

        query(`
          SELECT DATE(created_at) AS date,
                 COALESCE(SUM(CASE WHEN type='stake'    AND status='verified' THEN amount END),0) AS staked,
                 COALESCE(SUM(CASE WHEN type='payout'   AND status='verified' THEN amount END),0) AS payouts,
                 COALESCE(SUM(CASE WHEN type='deposit'  AND status='verified' THEN amount END),0) AS deposits
          FROM transactions
          WHERE created_at >= NOW() - INTERVAL '${interval || '30 days'}'
          GROUP BY DATE(created_at)
          ORDER BY date ASC`),

        query(`
          SELECT DATE(created_at) AS date, COUNT(*)::int AS new_users
          FROM users
          WHERE created_at >= NOW() - INTERVAL '${interval || '30 days'}'
          GROUP BY DATE(created_at)
          ORDER BY date ASC`),

        query(`
          SELECT c.name,
                 COUNT(gs.id)::int                                              AS games_played,
                 ROUND(AVG(gs.score)::numeric, 1)                              AS avg_score,
                 COALESCE(SUM(gs.stake_amount), 0)                             AS total_staked
          FROM categories c
          LEFT JOIN game_sessions gs
            ON gs.selected_category_ids @> ARRAY[c.id]
           AND gs.status = 'completed'
           ${interval ? `AND gs.created_at >= NOW() - INTERVAL '${interval}'` : ''}
          GROUP BY c.id, c.name
          ORDER BY games_played DESC`),

        query(`
          SELECT username, total_games_played, total_won, total_staked, wallet_balance
          FROM users
          ORDER BY total_won DESC
          LIMIT 10`),

        query(`
          SELECT question_text,
                 times_served,
                 CASE WHEN times_served > 0
                      THEN ROUND((times_answered_correctly::decimal / times_served) * 100, 1)
                      ELSE 0 END AS accuracy_pct
          FROM questions
          WHERE is_active = TRUE AND times_served > 0
          ORDER BY times_served DESC
          LIMIT 10`),
      ]);

    const f = financial.rows[0];
    const netProfit = parseFloat(f.total_staked) - parseFloat(f.total_payouts);
    const profitMargin = parseFloat(f.total_staked) > 0
      ? Math.round((netProfit / parseFloat(f.total_staked)) * 100)
      : 0;

    const g = gameStats.rows[0];
    const completionRate = g.total_sessions > 0
      ? Math.round((g.completed / g.total_sessions) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        period,
        financial:       { ...f, netProfit, profitMargin },
        users:           userStats.rows[0],
        games:           { ...g, completionRate },
        questions:       questionStats.rows[0],
        dailyRevenue:    dailyRevenue.rows,
        dailyUsers:      dailyUsers.rows,
        gamesPerCategory: perCategory.rows,
        topUsers:        topUsers.rows,
        topQuestions:    topQuestions.rows,
      },
    });
  } catch (err) { next(err); }
}

// ─── Questions ──────────────────────────────────────────────────────────────
async function listQuestions(req, res, next) {
  try {
    const { category_id, difficulty, status, page = 1, limit = 50 } = req.query;
    const search = String(req.query.search || '').trim();
    const conditions = [];
    const params     = [];

    if (category_id) { params.push(category_id); conditions.push(`q.category_id = $${params.length}`); }
    if (difficulty)  { params.push(difficulty);   conditions.push(`q.difficulty = $${params.length}`); }
    if (status)      { params.push(status === 'active'); conditions.push(`q.is_active = $${params.length}`); }
    if (search) {
      params.push(`%${search}%`);
      const i = params.length;
      conditions.push(
        `(q.question_text ILIKE $${i}
          OR q.option_a ILIKE $${i}
          OR q.option_b ILIKE $${i}
          OR q.option_c ILIKE $${i}
          OR q.option_d ILIKE $${i}
          OR c.name ILIKE $${i})`
      );
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.push(parseInt(limit), offset);

    const result = await query(
      `SELECT q.*, c.name AS category_name,
              CASE WHEN q.times_served > 0
                   THEN ROUND((q.times_answered_correctly::decimal / q.times_served) * 100, 1)
                   ELSE 0 END AS accuracy_pct
       FROM questions q JOIN categories c ON c.id = q.category_id
       ${where}
       ORDER BY q.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    const countRes = await query(
      `SELECT COUNT(*) FROM questions q JOIN categories c ON c.id = q.category_id ${where}`,
      params.slice(0, -2)
    );
    res.json({ success: true, data: result.rows, total: parseInt(countRes.rows[0].count) });
  } catch (err) { next(err); }
}

async function createQuestion(req, res, next) {
  try {
    const { category_id, question_text, option_a, option_b, option_c, option_d, correct_option, difficulty } = req.body;
    const result = await query(
      `INSERT INTO questions (category_id, question_text, option_a, option_b, option_c, option_d, correct_option, difficulty, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [category_id, question_text, option_a, option_b, option_c, option_d, correct_option, difficulty, req.admin.adminId]
    );
    cache.del('active_categories');
    
    await logAdminAction({
      adminId: req.admin.adminId,
      action: 'CREATE_QUESTION',
      entity: 'question',
      entityId: result.rows[0].id,
      details: { question_text, difficulty },
      ipAddress: req.ip
    });

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
}

async function updateQuestion(req, res, next) {
  try {
    const { id } = req.params;
    const {
      category_id, question_text, option_a, option_b, option_c, option_d,
      correct_option, difficulty, is_active,
    } = req.body;

    const result = await query(
      `UPDATE questions SET
         category_id    = COALESCE($1, category_id),
         question_text  = COALESCE($2, question_text),
         option_a       = COALESCE($3, option_a),
         option_b       = COALESCE($4, option_b),
         option_c       = COALESCE($5, option_c),
         option_d       = COALESCE($6, option_d),
         correct_option = COALESCE($7, correct_option),
         difficulty     = COALESCE($8, difficulty),
         is_active      = COALESCE($9, is_active)
       WHERE id = $10 RETURNING *`,
      [
        category_id ?? null, question_text ?? null, option_a ?? null, option_b ?? null,
        option_c ?? null, option_d ?? null, correct_option ?? null, difficulty ?? null,
        typeof is_active === 'boolean' ? is_active : null, id,
      ]
    );
    if (!result.rows[0]) throw new AppError('Question not found', 404, 'NOT_FOUND');
    cache.del('active_categories');

    await logAdminAction({
      adminId: req.admin.adminId,
      action: 'UPDATE_QUESTION',
      entity: 'question',
      entityId: id,
      details: {
        category_id: category_id || undefined,
        difficulty: difficulty || undefined,
        is_active: typeof is_active === 'boolean' ? is_active : undefined,
      },
      ipAddress: req.ip
    });

    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
}

async function deleteQuestion(req, res, next) {
  try {
    const { id } = req.params;
    await query('DELETE FROM user_seen_questions WHERE question_id = $1', [id]);
    const result = await query('DELETE FROM questions WHERE id = $1 RETURNING id', [id]);
    if (!result.rows[0]) throw new AppError('Question not found', 404, 'NOT_FOUND');
    cache.del('active_categories');

    await logAdminAction({
      adminId: req.admin.adminId,
      action: 'DELETE_QUESTION',
      entity: 'question',
      entityId: id,
      ipAddress: req.ip
    });

    res.json({ success: true, data: { message: 'Question deleted' } });
  } catch (err) { next(err); }
}

function parseTemplateText(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  let categoryName = null;
  let difficulty = null;
  const questions = [];
  let current = null;

  for (const line of lines) {
    if (/^CATEGORY\s*:/i.test(line)) {
      categoryName = line.replace(/^CATEGORY\s*:\s*/i, '').trim();
    } else if (/^DIFFICULTY\s*:/i.test(line)) {
      difficulty = line.replace(/^DIFFICULTY\s*:\s*/i, '').trim().toLowerCase();
    } else if (/^QUESTION\s+\d+\.\s*.+/i.test(line)) {
      if (current) questions.push(current);
      const questionText = line.replace(/^QUESTION\s+\d+\.\s*/i, '').trim();
      current = { question_text: questionText, option_a: '', option_b: '', option_c: '', option_d: '', correct_option: null };
    } else if (/^A\)\s*/i.test(line) && current) {
      current.option_a = line.replace(/^A\)\s*/i, '').trim();
    } else if (/^B\)\s*/i.test(line) && current) {
      current.option_b = line.replace(/^B\)\s*/i, '').trim();
    } else if (/^C\)\s*/i.test(line) && current) {
      current.option_c = line.replace(/^C\)\s*/i, '').trim();
    } else if (/^D\)\s*/i.test(line) && current) {
      current.option_d = line.replace(/^D\)\s*/i, '').trim();
    } else if (/^Correct Answer\s*:/i.test(line) && current) {
      current.correct_option = line.replace(/^Correct Answer\s*:\s*/i, '').trim().toLowerCase();
    }
  }
  if (current) questions.push(current);

  return { categoryName, difficulty, questions };
}

async function bulkUploadQuestions(req, res, next) {
  try {
    if (!req.file) throw new AppError('No file uploaded', 400, 'NO_FILE');

    const filename = req.file.originalname.toLowerCase();
    const mimetype = req.file.mimetype;
    let rawText = '';

    const isDocx = filename.endsWith('.docx') ||
      mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    const isTxt = filename.endsWith('.txt') || mimetype === 'text/plain';

    if (isDocx) {
      const result = await mammoth.extractRawText({ buffer: req.file.buffer });
      rawText = result.value;
    } else if (isTxt) {
      rawText = req.file.buffer.toString('utf-8');
    } else {
      throw new AppError('Unsupported file type. Please upload a .docx or .txt file.', 400, 'INVALID_FILE_TYPE');
    }

    const { categoryName, difficulty, questions } = parseTemplateText(rawText);

    if (!categoryName) throw new AppError('CATEGORY header not found in the file.', 400, 'PARSE_ERROR');
    if (!difficulty)   throw new AppError('DIFFICULTY header not found in the file.', 400, 'PARSE_ERROR');
    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      throw new AppError(`Invalid difficulty "${difficulty}". Must be easy, medium, or hard.`, 400, 'INVALID_DIFFICULTY');
    }
    if (questions.length === 0) throw new AppError('No questions found in the file.', 400, 'PARSE_ERROR');

    const catResult = await query(
      'SELECT id FROM categories WHERE LOWER(name) = LOWER($1) AND is_active = TRUE',
      [categoryName]
    );
    if (!catResult.rows[0]) {
      throw new AppError(`Category "${categoryName}" not found. Please check the category name matches exactly.`, 400, 'CATEGORY_NOT_FOUND');
    }
    const categoryId = catResult.rows[0].id;

    const errors = [];
    const inserted = [];
    const validOptions = ['a', 'b', 'c', 'd'];

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const qNum = i + 1;

      if (!q.question_text)                    { errors.push(`Question ${qNum}: missing question text`); continue; }
      if (!q.option_a)                         { errors.push(`Question ${qNum}: missing option A`); continue; }
      if (!q.option_b)                         { errors.push(`Question ${qNum}: missing option B`); continue; }
      if (!q.option_c)                         { errors.push(`Question ${qNum}: missing option C`); continue; }
      if (!q.option_d)                         { errors.push(`Question ${qNum}: missing option D`); continue; }
      if (!validOptions.includes(q.correct_option)) {
        errors.push(`Question ${qNum}: invalid correct answer "${q.correct_option}" — must be a, b, c, or d`);
        continue;
      }

      try {
        const res2 = await query(
          `INSERT INTO questions (category_id, question_text, option_a, option_b, option_c, option_d, correct_option, difficulty, created_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
          [categoryId, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_option, difficulty, req.admin.adminId]
        );
        inserted.push(res2.rows[0].id);
      } catch (e) {
        errors.push(`Question ${qNum}: ${e.message}`);
      }
    }

    await logAdminAction({
      adminId: req.admin.adminId,
      action: 'BULK_UPLOAD_QUESTIONS',
      entity: 'question',
      details: { inserted: inserted.length, errors: errors.length, categoryId },
      ipAddress: req.ip
    });

    res.json({ success: true, data: { inserted: inserted.length, errors } });
  } catch (err) { next(err); }
}

// ─── Categories ─────────────────────────────────────────────────────────────
async function listAdminCategories(req, res, next) {
  try {
    const result = await query(
      `SELECT c.*, COUNT(q.id) FILTER (WHERE q.is_active) AS active_questions,
              COUNT(q.id) AS total_questions
       FROM categories c LEFT JOIN questions q ON q.category_id = c.id
       GROUP BY c.id ORDER BY c.name`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
}

async function createCategory(req, res, next) {
  try {
    const { name, description, icon_name } = req.body;
    const result = await query(
      `INSERT INTO categories (name, description, icon_name) VALUES ($1,$2,$3) RETURNING *`,
      [name, description || null, icon_name || 'help-circle']
    );
    cache.del('active_categories');

    await logAdminAction({
      adminId: req.admin.adminId,
      action: 'CREATE_CATEGORY',
      entity: 'category',
      entityId: result.rows[0].id,
      details: { name },
      ipAddress: req.ip
    });

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
}

async function updateCategory(req, res, next) {
  try {
    const { id } = req.params;
    const { name, description, icon_name, is_active } = req.body;
    const result = await query(
      `UPDATE categories SET
         name        = COALESCE($1, name),
         description = COALESCE($2, description),
         icon_name   = COALESCE($3, icon_name),
         is_active   = COALESCE($4, is_active)
       WHERE id = $5 RETURNING *`,
      [name, description, icon_name, is_active, id]
    );
    if (!result.rows[0]) throw new AppError('Category not found', 404, 'NOT_FOUND');
    cache.del('active_categories');

    await logAdminAction({
      adminId: req.admin.adminId,
      action: 'UPDATE_CATEGORY',
      entity: 'category',
      entityId: id,
      details: { name, is_active },
      ipAddress: req.ip
    });

    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
}

async function deleteCategory(req, res, next) {
  try {
    const { id } = req.params;
    await query(
      `DELETE FROM user_seen_questions
       WHERE question_id IN (SELECT id FROM questions WHERE category_id = $1)`,
      [id]
    );
    await query('DELETE FROM questions WHERE category_id = $1', [id]);
    const result = await query('DELETE FROM categories WHERE id = $1 RETURNING id', [id]);
    if (!result.rows[0]) throw new AppError('Category not found', 404, 'NOT_FOUND');
    cache.del('active_categories');

    await logAdminAction({
      adminId: req.admin.adminId,
      action: 'DELETE_CATEGORY',
      entity: 'category',
      entityId: id,
      ipAddress: req.ip
    });

    res.json({ success: true, data: { message: 'Category deleted' } });
  } catch (err) { next(err); }
}

async function bulkDeleteCategories(req, res, next) {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new AppError('No category IDs provided', 400, 'INVALID_INPUT');
    }
    await query(
      `DELETE FROM user_seen_questions
       WHERE question_id IN (SELECT id FROM questions WHERE category_id = ANY($1::uuid[]))`,
      [ids]
    );
    await query('DELETE FROM questions WHERE category_id = ANY($1::uuid[])', [ids]);
    const result = await query('DELETE FROM categories WHERE id = ANY($1::uuid[]) RETURNING id', [ids]);
    cache.del('active_categories');

    await logAdminAction({
      adminId: req.admin.adminId,
      action: 'BULK_DELETE_CATEGORIES',
      entity: 'category',
      details: { count: result.rowCount },
      ipAddress: req.ip
    });

    res.json({ success: true, data: { message: `${result.rowCount} categories deleted` } });
  } catch (err) { next(err); }
}

async function bulkDeleteQuestions(req, res, next) {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new AppError('No question IDs provided', 400, 'INVALID_INPUT');
    }
    await query('DELETE FROM user_seen_questions WHERE question_id = ANY($1::uuid[])', [ids]);
    const result = await query('DELETE FROM questions WHERE id = ANY($1::uuid[]) RETURNING id', [ids]);
    cache.del('active_categories');

    await logAdminAction({
      adminId: req.admin.adminId,
      action: 'BULK_DELETE_QUESTIONS',
      entity: 'question',
      details: { count: result.rowCount },
      ipAddress: req.ip
    });

    res.json({ success: true, data: { message: `${result.rowCount} questions deleted` } });
  } catch (err) { next(err); }
}

// ─── Transactions ────────────────────────────────────────────────────────────
async function listTransactions(req, res, next) {
  try {
    const { type, status, from, to, page = 1, limit = 50 } = req.query;
    const conditions = [];
    const params = [];

    if (type)   { params.push(type);   conditions.push(`t.type = $${params.length}`); }
    if (status) { params.push(status); conditions.push(`t.status = $${params.length}`); }
    if (from)   { params.push(from);   conditions.push(`t.created_at >= $${params.length}`); }
    if (to)     { params.push(to);     conditions.push(`t.created_at <= $${params.length}`); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.push(parseInt(limit), offset);

    const result = await query(
      `SELECT t.*, u.username, u.email
       FROM transactions t JOIN users u ON u.id = t.user_id
       ${where}
       ORDER BY t.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const summary = await query(
      `SELECT
         COALESCE(SUM(CASE WHEN type='deposit'    AND status='verified' THEN amount END),0) AS total_deposited,
         COALESCE(SUM(CASE WHEN type='stake'      AND status='verified' THEN amount END),0) AS total_staked,
         COALESCE(SUM(CASE WHEN type='payout'     AND status='verified' THEN amount END),0) AS total_paid_out,
         COALESCE(SUM(CASE WHEN type='withdrawal' AND status='verified' THEN amount END),0) AS total_withdrawn
       FROM transactions t ${where}`,
      params.slice(0, -2)
    );

    res.json({ success: true, data: result.rows, summary: summary.rows[0] });
  } catch (err) { next(err); }
}

// ─── Users ──────────────────────────────────────────────────────────────────
async function listUsers(req, res, next) {
  try {
    const { page = 1, limit = 50, search } = req.query;
    const conditions = [];
    const params = [];
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(u.username ILIKE $${params.length} OR u.email ILIKE $${params.length})`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.push(parseInt(limit), offset);

    const result = await query(
      `SELECT id, username, email, wallet_balance, total_games_played, total_won, total_staked, is_active, created_at
       FROM users u ${where}
       ORDER BY created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    const countRes = await query(`SELECT COUNT(*) FROM users u ${where}`, params.slice(0, -2));
    res.json({ success: true, data: result.rows, total: parseInt(countRes.rows[0].count) });
  } catch (err) { next(err); }
}

async function getUserDetail(req, res, next) {
  try {
    const { id } = req.params;
    const userRes = await query(
      'SELECT id, username, email, phone_number, wallet_balance, total_games_played, total_won, total_staked, is_active, created_at FROM users WHERE id = $1',
      [id]
    );
    if (!userRes.rows[0]) throw new AppError('User not found', 404, 'NOT_FOUND');

    const sessionsRes = await query(
      `SELECT id, stake_amount, score, payout_amount, status, started_at, completed_at
       FROM game_sessions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [id]
    );
    const txRes = await query(
      'SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20',
      [id]
    );

    res.json({
      success: true,
      data: { user: userRes.rows[0], sessions: sessionsRes.rows, transactions: txRes.rows },
    });
  } catch (err) { next(err); }
}

async function updateUserStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    if (typeof is_active !== 'boolean') throw new AppError('is_active must be boolean', 400, 'INVALID_INPUT');
    const result = await query(
      'UPDATE users SET is_active = $1 WHERE id = $2 RETURNING id, username, is_active',
      [is_active, id]
    );
    if (!result.rows[0]) throw new AppError('User not found', 404, 'NOT_FOUND');

    await logAdminAction({
      adminId: req.admin.adminId,
      action: 'UPDATE_USER_STATUS',
      entity: 'user',
      entityId: id,
      details: { username: result.rows[0].username, is_active },
      ipAddress: req.ip
    });

    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
}

// ─── Game Sessions ───────────────────────────────────────────────────────────
async function listGameSessions(req, res, next) {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const params = [];
    const conditions = [];
    if (status) { params.push(status); conditions.push(`gs.status = $${params.length}`); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.push(parseInt(limit), offset);

    const result = await query(
      `SELECT gs.id, u.username, gs.stake_amount, gs.score, gs.payout_amount, gs.status,
              gs.started_at, gs.completed_at,
              EXTRACT(EPOCH FROM (gs.completed_at - gs.started_at))::int AS duration_seconds
       FROM game_sessions gs JOIN users u ON u.id = gs.user_id
       ${where}
       ORDER BY gs.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
}

async function getGameSessionDetail(req, res, next) {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT gs.*, u.username, u.email
       FROM game_sessions gs JOIN users u ON u.id = gs.user_id
       WHERE gs.id = $1`,
      [id]
    );
    if (!result.rows[0]) throw new AppError('Session not found', 404, 'NOT_FOUND');
    const session = result.rows[0];
    const answers = Array.isArray(session.answers_submitted) ? session.answers_submitted : [];
    const questionIds = [...new Set(answers.map(a => a.question_id).filter(Boolean))];

    let questionsById = {};
    if (questionIds.length) {
      const qRes = await query(
        `SELECT id, question_text, option_a, option_b, option_c, option_d, correct_option, category_id
         FROM questions WHERE id = ANY($1::uuid[])`,
        [questionIds]
      );
      questionsById = Object.fromEntries(qRes.rows.map(q => [q.id, q]));
    }

    const gross = parseFloat(session.payout_amount) || 0;
    const tax = parseFloat(session.tax_amount) || 0;
    session.net_payout = Math.round((gross - tax) * 100) / 100;
    session.answer_review = answers.map((a, i) => {
      const q = questionsById[a.question_id] || {};
      return {
        index: i + 1,
        question_id: a.question_id,
        question_text: q.question_text || null,
        chosen_option: a.chosen_option,
        correct_option: q.correct_option || null,
        is_correct: Boolean(a.is_correct),
        submitted_at: a.submitted_at || null,
        corrected_at: a.corrected_at || null,
        previous_is_correct: a.previous_is_correct,
        options: q.question_text ? {
          a: q.option_a, b: q.option_b, c: q.option_c, d: q.option_d,
        } : null,
      };
    });

    res.json({ success: true, data: session });
  } catch (err) { next(err); }
}

async function correctGameSessionAnswer(req, res, next) {
  try {
    const { id } = req.params;
    const { question_id, is_correct } = req.body;
    const { correctSessionGrade } = require('../services/gameService');
    const result = await correctSessionGrade(id, question_id, is_correct);

    await logAdminAction({
      adminId: req.admin.adminId,
      action: 'CORRECT_GAME_ANSWER',
      entity: 'game_session',
      entityId: id,
      details: {
        question_id,
        is_correct,
        score_before: result.previous.score,
        score_after: result.corrected.score,
        wallet_credit_delta: result.walletCreditDelta,
        net_before: result.previous.netPayout,
        net_after: result.corrected.netPayout,
      },
      ipAddress: req.ip,
    });

    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

// ─── Testimonials (landing page) ─────────────────────────────────────────────
async function getPublicTestimonials(req, res, next) {
  try {
    const result = await query(
      `SELECT id, author_name, author_title, quote, rating, sort_order, created_at
       FROM testimonials
       WHERE is_active = TRUE
       ORDER BY sort_order ASC, created_at DESC`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
}

async function listTestimonials(req, res, next) {
  try {
    const result = await query(
      `SELECT id, author_name, author_title, quote, rating, sort_order, is_active, created_at, updated_at
       FROM testimonials
       ORDER BY sort_order ASC, created_at DESC`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
}

async function createTestimonial(req, res, next) {
  try {
    const { author_name, author_title, quote, rating, sort_order, is_active } = req.body;
    const result = await query(
      `INSERT INTO testimonials (author_name, author_title, quote, rating, sort_order, is_active)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [author_name, author_title ?? null, quote, rating ?? null, sort_order ?? 0, is_active ?? true]
    );

    await logAdminAction({
      adminId: req.admin.adminId,
      action: 'CREATE_TESTIMONIAL',
      entity: 'testimonial',
      entityId: result.rows[0].id,
      details: { author_name },
      ipAddress: req.ip
    });

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
}

async function updateTestimonial(req, res, next) {
  try {
    const { id } = req.params;
    const { author_name, author_title, quote, rating, sort_order, is_active } = req.body;
    const result = await query(
      `UPDATE testimonials SET
         author_name = $1,
         author_title = $2,
         quote = $3,
         rating = $4,
         sort_order = $5,
         is_active = $6,
         updated_at = NOW()
       WHERE id = $7 RETURNING *`,
      [author_name, author_title ?? null, quote, rating ?? null, sort_order ?? 0, is_active ?? true, id]
    );
    if (!result.rows[0]) throw new AppError('Testimonial not found', 404, 'NOT_FOUND');

    await logAdminAction({
      adminId: req.admin.adminId,
      action: 'UPDATE_TESTIMONIAL',
      entity: 'testimonial',
      entityId: id,
      details: { author_name },
      ipAddress: req.ip
    });

    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
}

async function deleteTestimonial(req, res, next) {
  try {
    const { id } = req.params;
    const result = await query(
      `UPDATE testimonials SET is_active = FALSE, updated_at = NOW() WHERE id = $1 RETURNING id`,
      [id]
    );
    if (!result.rows[0]) throw new AppError('Testimonial not found', 404, 'NOT_FOUND');

    await logAdminAction({
      adminId: req.admin.adminId,
      action: 'DELETE_TESTIMONIAL',
      entity: 'testimonial',
      entityId: id,
      ipAddress: req.ip
    });

    res.json({ success: true, data: { message: 'Testimonial hidden from landing page' } });
  } catch (err) { next(err); }
}

// ─── Settings ────────────────────────────────────────────────────────────────
const PUBLIC_SETTING_KEYS = [
  'kiosk_mode', 'kiosk_warning_count', 'platform_name', 'platform_tagline',
  'user_win_tax_percentage', 'payout_perfect', 'payout_nine',
];

async function getPublicSettings(req, res, next) {
  try {
    const placeholders = PUBLIC_SETTING_KEYS.map((_, i) => `$${i + 1}`).join(', ');
    const result = await query(
      `SELECT key, value FROM platform_settings WHERE key IN (${placeholders})`,
      PUBLIC_SETTING_KEYS
    );
    const settings = {};
    for (const row of result.rows) settings[row.key] = row.value;
    res.json({ success: true, data: settings });
  } catch (err) { next(err); }
}

async function getSettings(req, res, next) {
  try {
    const result = await query('SELECT key, value FROM platform_settings');
    const settings = {};
    for (const row of result.rows) settings[row.key] = row.value;
    res.json({ success: true, data: settings });
  } catch (err) { next(err); }
}

async function updateSettings(req, res, next) {
  try {
    const updates = req.body;
    for (const [key, value] of Object.entries(updates)) {
      await query(
        `INSERT INTO platform_settings (key, value, updated_at) VALUES ($1, $2, NOW())
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
        [key, String(value)]
      );
    }
    cache.del('active_categories');

    await logAdminAction({
      adminId: req.admin.adminId,
      action: 'UPDATE_SETTINGS',
      entity: 'settings',
      details: updates,
      ipAddress: req.ip
    });

    const result = await query('SELECT key, value FROM platform_settings');
    const settings = {};
    for (const row of result.rows) settings[row.key] = row.value;
    res.json({ success: true, data: settings });
  } catch (err) { next(err); }
}

// ─── Logs ──────────────────────────────────────────────────────────────────
async function getAdminLogs(req, res, next) {
  try {
    const { page = 1, limit = 50, action, entity } = req.query;
    const conditions = [];
    const params = [];

    if (action) { params.push(action); conditions.push(`l.action = $${params.length}`); }
    if (entity) { params.push(entity); conditions.push(`l.entity = $${params.length}`); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.push(parseInt(limit), offset);

    const result = await query(
      `SELECT l.*, a.name AS admin_name, a.email AS admin_email
       FROM admin_logs l LEFT JOIN admins a ON a.id = l.admin_id
       ${where}
       ORDER BY l.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const countRes = await query(`SELECT COUNT(*) FROM admin_logs l ${where}`, params.slice(0, -2));

    res.json({ success: true, data: result.rows, total: parseInt(countRes.rows[0].count) });
  } catch (err) { next(err); }
}

// ─── Admins ──────────────────────────────────────────────────────────────────
async function listAdmins(req, res, next) {
  try {
    const result = await query(
      'SELECT id, name, email, role, created_at FROM admins ORDER BY created_at DESC'
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
}

async function createAdmin(req, res, next) {
  try {
    const { name, email, password, role = 'viewer' } = req.body;
    if (!name || !email || !password) {
      throw new AppError('Name, email, and password are required', 400, 'MISSING_FIELDS');
    }
    const bcrypt = require('bcrypt');
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await query(
      'INSERT INTO admins (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name, email, passwordHash, role]
    );

    await logAdminAction({
      adminId: req.admin.adminId,
      action: 'CREATE_ADMIN',
      entity: 'admin',
      entityId: result.rows[0].id,
      details: { name, email, role },
      ipAddress: req.ip
    });

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
}

async function updateAdminRole(req, res, next) {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!['super_admin', 'moderator', 'viewer'].includes(role)) {
      throw new AppError('Invalid role', 400, 'INVALID_INPUT');
    }

    if (id === req.admin.adminId) {
      throw new AppError('You cannot change your own role', 400, 'INVALID_ACTION');
    }

    const result = await query(
      'UPDATE admins SET role = $1 WHERE id = $2 RETURNING id, name, email, role',
      [role, id]
    );

    if (!result.rows[0]) throw new AppError('Admin not found', 404, 'NOT_FOUND');

    await logAdminAction({
      adminId: req.admin.adminId,
      action: 'UPDATE_ADMIN_ROLE',
      entity: 'admin',
      entityId: id,
      details: { email: result.rows[0].email, newRole: role },
      ipAddress: req.ip
    });

    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
}

async function getWebhookLogs(req, res, next) {
  try {
    const result = await query(
      `SELECT id, provider, event_type, status, error_message, created_at, payload
       FROM webhook_logs
       ORDER BY created_at DESC
       LIMIT 100`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
}

module.exports = {
  getDashboardStats, getStatistics,
  listQuestions, createQuestion, updateQuestion, deleteQuestion, bulkUploadQuestions, bulkDeleteQuestions,
  listAdminCategories, createCategory, updateCategory, deleteCategory, bulkDeleteCategories,
  listTransactions, listUsers, getUserDetail, updateUserStatus,
  listGameSessions, getGameSessionDetail, correctGameSessionAnswer,
  getPublicTestimonials, listTestimonials, createTestimonial, updateTestimonial, deleteTestimonial,
  getSettings, updateSettings, getPublicSettings,
  getAdminLogs, listAdmins, createAdmin, updateAdminRole,
  getWebhookLogs,
};
