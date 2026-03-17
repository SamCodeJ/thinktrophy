const { query, getClient } = require('../db/connection');
const { buildSessionQuestions, formatQuestionForClient, getQuestionById } = require('./questionService');
const { signSessionToken, verifySessionToken } = require('../utils/jwt');
const { AppError } = require('../middleware/errorHandler');

async function getPlatformSettings() {
  const result = await query('SELECT key, value FROM platform_settings');
  const s = {};
  for (const row of result.rows) s[row.key] = row.value;
  return {
    minStake:      parseFloat(s.min_stake      || '500.00'),
    maxStake:      parseFloat(s.max_stake      || '5000.00'),
    payoutPerfect: parseFloat(s.payout_perfect || '2.0'),
    payoutNine:    parseFloat(s.payout_nine    || '1.5'),
  };
}

// ─── Create a new game session ──────────────────────────────────────────────
async function createSession(userId, categoryIds, stakeAmount) {
  const settings = await getPlatformSettings();

  if (stakeAmount < settings.minStake)
    throw new AppError(`Minimum stake is ₦${settings.minStake.toLocaleString()}`, 400, 'STAKE_TOO_LOW');
  if (stakeAmount > settings.maxStake)
    throw new AppError(`Maximum stake is ₦${settings.maxStake.toLocaleString()}`, 400, 'STAKE_TOO_HIGH');

  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Auto-expire any stale active sessions older than 2 minutes before checking
    await client.query(
      `UPDATE game_sessions
       SET status = 'expired', completed_at = NOW()
       WHERE user_id = $1
         AND status = 'active'
         AND started_at < NOW() - INTERVAL '2 minutes'`,
      [userId]
    );

    // Check for a genuinely active (recent) session
    const existing = await client.query(
      `SELECT id FROM game_sessions WHERE user_id = $1 AND status = 'active' LIMIT 1`,
      [userId]
    );
    if (existing.rows.length > 0)
      throw new AppError('You already have an active game session', 409, 'SESSION_ACTIVE');

    // Check wallet balance
    const wallet = await client.query(
      'SELECT wallet_balance FROM users WHERE id = $1 FOR UPDATE',
      [userId]
    );
    if (!wallet.rows[0])
      throw new AppError('User not found', 404, 'NOT_FOUND');
    if (parseFloat(wallet.rows[0].wallet_balance) < stakeAmount)
      throw new AppError('Insufficient wallet balance', 400, 'INSUFFICIENT_BALANCE');

    // Build questions
    const { trackA, trackB, answerMaps } = await buildSessionQuestions(categoryIds);

    // Deduct stake
    await client.query(
      'UPDATE users SET wallet_balance = wallet_balance - $1, total_staked = total_staked + $1 WHERE id = $2',
      [stakeAmount, userId]
    );

    // Create session row
    const now = new Date();
    const sessionRes = await client.query(
      `INSERT INTO game_sessions
         (user_id, session_token, stake_amount, selected_category_ids,
          question_ids_track_a, question_ids_track_b, status, started_at, answer_option_maps)
       VALUES ($1, $2, $3, $4, $5, $6, 'active', $7, $8)
       RETURNING id`,
      [
        userId,
        'pending', // placeholder, updated below
        stakeAmount,
        categoryIds,
        trackA,
        trackB,
        now,
        JSON.stringify(answerMaps),
      ]
    );
    const sessionId = sessionRes.rows[0].id;

    // Sign session token
    const sessionToken = signSessionToken({
      type:      'session',
      sessionId,
      userId,
      startedAt: now.getTime(),
    });

    await client.query(
      'UPDATE game_sessions SET session_token = $1 WHERE id = $2',
      [sessionToken, sessionId]
    );

    // Record stake transaction
    await client.query(
      `INSERT INTO transactions (user_id, type, amount, status, game_session_id)
       VALUES ($1, 'stake', $2, 'verified', $3)`,
      [userId, stakeAmount, sessionId]
    );

    await client.query('COMMIT');

    // Return first question
    const firstQuestionId = trackB[0]; // default to track B; track isn't determined yet
    const firstQuestion = await getQuestionById(firstQuestionId);
    const firstMap = answerMaps.find(m => m.questionId === firstQuestionId);

    return {
      sessionId,
      sessionToken,
      questionNumber: 1,
      totalQuestions: 10,
      question: formatQuestionForClient(firstQuestion, firstMap),
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ─── Submit an answer ───────────────────────────────────────────────────────
async function submitAnswer(userId, sessionId, answerUuid, submittedSessionToken) {
  // Validate session token
  let tokenData;
  try {
    tokenData = verifySessionToken(submittedSessionToken);
  } catch (err) {
    throw new AppError('Session token expired or invalid. Game over.', 400, 'SESSION_EXPIRED');
  }

  if (tokenData.sessionId !== sessionId || tokenData.userId !== userId) {
    throw new AppError('Session token mismatch', 403, 'FORBIDDEN');
  }

  // Server-side timing check — must match GAME_SESSION_EXPIRY_SECONDS in .env
  const elapsed = Date.now() - tokenData.startedAt;
  const gracePeriodMs = parseInt(process.env.GAME_SESSION_EXPIRY_SECONDS || '110', 10) * 1000;
  if (elapsed > gracePeriodMs) {
    await expireSession(sessionId);
    throw new AppError('Game time expired', 400, 'TIME_EXPIRED');
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    const sessRes = await client.query(
      `SELECT * FROM game_sessions WHERE id = $1 AND user_id = $2 FOR UPDATE`,
      [sessionId, userId]
    );
    const session = sessRes.rows[0];
    if (!session) throw new AppError('Session not found', 404, 'NOT_FOUND');
    if (session.status !== 'active') throw new AppError('Session is not active', 400, 'SESSION_NOT_ACTIVE');

    const idx = session.current_question_index;
    if (idx >= 10) throw new AppError('All questions already answered', 400, 'SESSION_COMPLETE');

    // Determine which track to use
    const track = determineTrack(session, idx);
    const questionIds = track === 'a' ? session.question_ids_track_a : session.question_ids_track_b;
    const questionId = questionIds[idx];

    const answerMaps = session.answer_option_maps;
    const answerMap  = answerMaps.find(m => m.questionId === questionId);
    if (!answerMap) throw new AppError('Answer map not found', 500, 'INTERNAL_ERROR');

    // Validate the submitted UUID belongs to this question
    const submittedKey = answerMap[`opt_${answerUuid}`];
    if (!submittedKey) throw new AppError('Invalid answer option', 400, 'INVALID_ANSWER');

    // Check correctness
    const question = await getQuestionById(questionId);
    const isCorrect = submittedKey === question.correct_option;

    // Record answer
    const answersSubmitted = session.answers_submitted || [];
    answersSubmitted.push({
      question_id:   questionId,
      chosen_option: submittedKey,
      answer_uuid:   answerUuid,
      is_correct:    isCorrect,
      submitted_at:  new Date().toISOString(),
    });

    const newScore = (session.score || 0) + (isCorrect ? 1 : 0);
    const newIdx   = idx + 1;

    // If answering Q5 (index 4), determine which track to lock in
    let newActiveTrack = session.active_track;
    if (idx === 4) {
      const firstFiveCorrect = answersSubmitted.filter(a => a.is_correct).length;
      newActiveTrack = firstFiveCorrect === 5 ? 'a' : 'b';
    }

    let updates;
    if (newIdx >= 10) {
      // Game complete
      const settings = await getPlatformSettings();
      const payout = computePayout(newScore, session.stake_amount, settings);

      await client.query(
        `UPDATE game_sessions
         SET current_question_index = $1, score = $2, status = 'completed',
             answers_submitted = $3, payout_amount = $4, completed_at = NOW(),
             active_track = $5
         WHERE id = $6`,
        [newIdx, newScore, JSON.stringify(answersSubmitted), payout, newActiveTrack, sessionId]
      );

      // Credit payout
      if (payout > 0) {
        await client.query(
          'UPDATE users SET wallet_balance = wallet_balance + $1, total_won = total_won + $1 WHERE id = $2',
          [payout, userId]
        );
        await client.query(
          `INSERT INTO transactions (user_id, type, amount, status, game_session_id)
           VALUES ($1, 'payout', $2, 'verified', $3)`,
          [userId, payout, sessionId]
        );
      }

      await client.query(
        'UPDATE users SET total_games_played = total_games_played + 1 WHERE id = $1',
        [userId]
      );

      // Increment question stats
      for (const ans of answersSubmitted) {
        await client.query(
          `UPDATE questions
           SET times_served = times_served + 1,
               times_answered_correctly = times_answered_correctly + $1
           WHERE id = $2`,
          [ans.is_correct ? 1 : 0, ans.question_id]
        );
      }

      await client.query('COMMIT');
      return {
        gameComplete: true,
        score:        newScore,
        totalQuestions: 10,
        payout,
        stakeAmount:  parseFloat(session.stake_amount),
        answersSubmitted,
        isCorrect,
        correctOption: question.correct_option,
        correctText:   question[`option_${question.correct_option}`],
      };
    }

    // More questions remain
    await client.query(
      `UPDATE game_sessions
       SET current_question_index = $1, score = $2, answers_submitted = $3, active_track = $4
       WHERE id = $5`,
      [newIdx, newScore, JSON.stringify(answersSubmitted), newActiveTrack, sessionId]
    );

    await client.query('COMMIT');

    // Return next question
    const nextTrack       = determineTrack({ ...session, active_track: newActiveTrack, current_question_index: newIdx }, newIdx);
    const nextQuestionIds = nextTrack === 'a' ? session.question_ids_track_a : session.question_ids_track_b;
    const nextQuestionId  = nextQuestionIds[newIdx];
    const nextQuestion    = await getQuestionById(nextQuestionId);
    const nextMap         = answerMaps.find(m => m.questionId === nextQuestionId);

    return {
      gameComplete:   false,
      isCorrect,
      correctOption:  question.correct_option,
      correctText:    question[`option_${question.correct_option}`],
      score:          newScore,
      questionNumber: newIdx + 1,
      totalQuestions: 10,
      question:       formatQuestionForClient(nextQuestion, nextMap),
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

function determineTrack(session, idx) {
  if (session.active_track) return session.active_track;
  return 'b'; // default before Q5 is answered
}

function computePayout(score, stakeAmount, settings) {
  const stake = parseFloat(stakeAmount);
  if (score === 10) return stake * settings.payoutPerfect;
  if (score === 9)  return stake * settings.payoutNine;
  return 0;
}

async function expireSession(sessionId) {
  await query(
    `UPDATE game_sessions SET status = 'expired', completed_at = NOW() WHERE id = $1 AND status = 'active'`,
    [sessionId]
  );
}

async function getSessionResult(sessionId, userId) {
  const result = await query(
    `SELECT gs.*, u.username
     FROM game_sessions gs
     JOIN users u ON u.id = gs.user_id
     WHERE gs.id = $1 AND gs.user_id = $2`,
    [sessionId, userId]
  );
  if (!result.rows[0]) throw new AppError('Session not found', 404, 'NOT_FOUND');
  const session = result.rows[0];
  if (session.status === 'active') throw new AppError('Game session is still in progress', 400, 'SESSION_ACTIVE');
  return session;
}

module.exports = {
  createSession,
  submitAnswer,
  getSessionResult,
  expireSession,
};
