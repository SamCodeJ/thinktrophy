const { getCategoriesForUser } = require('../services/questionService');
const { createSession, submitAnswer, getSessionResult } = require('../services/gameService');
const { query } = require('../db/connection');
const { AppError } = require('../middleware/errorHandler');

async function listCategories(req, res, next) {
  try {
    const categories = await getCategoriesForUser(req.user.userId);
    res.json({ success: true, data: categories });
  } catch (err) { next(err); }
}

async function createGameSession(req, res, next) {
  try {
    const { category_ids, stake_amount } = req.body;
    const data = await createSession(req.user.userId, category_ids, stake_amount);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
}

async function answerQuestion(req, res, next) {
  try {
    const { sessionId } = req.params;
    const { answer_uuid, session_token } = req.body;

    // Anti-cheat: reject if session_token missing
    if (!session_token) throw new AppError('Session token required', 400, 'MISSING_TOKEN');

    const data = await submitAnswer(req.user.userId, sessionId, answer_uuid, session_token);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

async function getResult(req, res, next) {
  try {
    const { sessionId } = req.params;
    const session = await getSessionResult(sessionId, req.user.userId);

    // Build question review — slice to the number of questions actually served.
    // Both track arrays contain 15 IDs (10 shared + 5 second-half), but only
    // current_question_index of them were ever shown to the player.
    const allQuestionIds = session.active_track === 'a'
      ? session.question_ids_track_a
      : session.question_ids_track_b;
    const answeredCount = Array.isArray(session.answers_submitted)
      ? session.answers_submitted.length
      : 0;
    const shownCount = Math.min(
      Math.max(Number(session.current_question_index) || 0, answeredCount),
      10
    );
    const questionIds = (allQuestionIds || []).slice(0, shownCount);
    // Session is already finished (getSessionResult rejects active games).
    // Always reveal the official answer so review/transcript can show misses.
    const answersMap = {};
    (session.answers_submitted || []).forEach(a => { answersMap[a.question_id] = a; });

    const questionReview = [];
    if (questionIds.length) {
      const qRes = await query(
        `SELECT id, question_text, option_a, option_b, option_c, option_d, correct_option, difficulty
         FROM questions WHERE id = ANY($1::uuid[])`,
        [questionIds]
      );
      const byId = new Map(qRes.rows.map(q => [q.id, q]));
      for (const qid of questionIds) {
        const q = byId.get(qid);
        const ans = answersMap[qid];
        if (q) {
          const options = { a: q.option_a, b: q.option_b, c: q.option_c, d: q.option_d };
          // CHAR(1) from Postgres can include padding; normalize before lookup.
          const correctOption = String(q.correct_option || '').trim().toLowerCase().slice(0, 1);
          questionReview.push({
            question_id:    q.id,
            question_text:  q.question_text,
            options,
            correct_option: correctOption || null,
            correct_text:   (correctOption && options[correctOption]) || null,
            chosen_option:  ans?.chosen_option || null,
            is_correct:     Boolean(ans?.is_correct),
            difficulty:     q.difficulty,
          });
        }
      }
    }

    res.json({
      success: true,
      data: {
        sessionId:    session.id,
        score:        session.score,
        totalQuestions: 10,
        payout:       Math.round(((parseFloat(session.payout_amount) || 0) - (parseFloat(session.tax_amount || 0) || 0)) * 100) / 100,
        grossPayout:  parseFloat(session.payout_amount),
        taxAmount:    parseFloat(session.tax_amount || 0),
        stakeAmount:  parseFloat(session.stake_amount),
        status:       session.status,
        startedAt:    session.started_at,
        completedAt:  session.completed_at,
        questionReview,
      },
    });
  } catch (err) { next(err); }
}

async function abandonSession(req, res, next) {
  try {
    const { sessionId } = req.params;
    const result = await query(
      `UPDATE game_sessions
       SET status = 'expired', completed_at = NOW()
       WHERE id = $1 AND user_id = $2 AND status = 'active'
       RETURNING id, stake_amount`,
      [sessionId, req.user.userId]
    );
    if (!result.rows[0])
      throw new AppError('No active session found', 404, 'NOT_FOUND');

    // Stake is forfeited — already deducted at session creation, no refund
    res.json({ success: true, data: { message: 'Session abandoned', sessionId } });
  } catch (err) { next(err); }
}

module.exports = { listCategories, createGameSession, answerQuestion, getResult, abandonSession };
