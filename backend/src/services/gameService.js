const { query, getClient } = require('../db/connection');
const { buildSessionQuestions, formatQuestionForClient, getQuestionById, getCategoriesForUser, markQuestionsSeen } = require('./questionService');
const { signSessionToken, verifySessionToken } = require('../utils/jwt');
const { AppError } = require('../middleware/errorHandler');
const { sendActionEmail } = require('../utils/emailService');
const { formatNaira } = require('../utils/formatNaira');
const cache = require('../utils/cache');

async function getPlatformSettings() {
  const cached = await cache.get('platform_settings');
  if (cached) return cached;

  const result = await query('SELECT key, value FROM platform_settings');
  const s = {};
  for (const row of result.rows) s[row.key] = row.value;
  const settings = {
    minStake:      parseFloat(s.min_stake      || '500.00'),
    maxStake:      parseFloat(s.max_stake      || '5000.00'),
    payoutPerfect: parseFloat(s.payout_perfect || '2.0'),
    payoutNine:    parseFloat(s.payout_nine    || '0.5'),
    gameDuration:  parseInt(s.game_duration    || '60', 10),
    referralWinPercentage: parseFloat(s.referral_win_percentage || '0.10'),
    userWinTaxPercentage: parseFloat(s.user_win_tax_percentage || '0.05'),
  };
  await cache.set('platform_settings', settings, 30 * 1000);
  return settings;
}

// ─── Create a new game session ──────────────────────────────────────────────
async function createSession(userId, categoryIds, stakeAmount) {
  const settings = await getPlatformSettings();

  if (stakeAmount < settings.minStake)
    throw new AppError(`Minimum stake is ${formatNaira(settings.minStake)}`, 400, 'STAKE_TOO_LOW');
  if (stakeAmount > settings.maxStake)
    throw new AppError(`Maximum stake is ${formatNaira(settings.maxStake)}`, 400, 'STAKE_TOO_HIGH');

  const precheck = await query(
    'SELECT username, email, wallet_balance, email_verified FROM users WHERE id = $1',
    [userId]
  );
  if (!precheck.rows[0])
    throw new AppError('User not found', 404, 'NOT_FOUND');
  if (!precheck.rows[0].email_verified)
    throw new AppError('Please verify your email before playing', 403, 'EMAIL_NOT_VERIFIED');
  if (parseFloat(precheck.rows[0].wallet_balance) < stakeAmount)
    throw new AppError('Insufficient wallet balance', 400, 'INSUFFICIENT_BALANCE');

  const availability = await getCategoriesForUser(userId);
  const byId = new Map(availability.map(c => [c.id, c]));
  for (const id of categoryIds) {
    const cat = byId.get(id);
    if (!cat || cat.exhausted) {
      throw new AppError(
        cat
          ? `"${cat.name}" has no remaining questions. Please pick another category.`
          : 'Invalid category selected.',
        400,
        'CATEGORY_EXHAUSTED'
      );
    }
  }

  // Build questions outside the wallet lock so other players are not blocked.
  const { trackA, trackB, answerMaps } = await buildSessionQuestions(categoryIds, userId);

  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Lock the user row first so concurrent creates cannot double-debit.
    const wallet = await client.query(
      'SELECT username, email, wallet_balance, email_verified FROM users WHERE id = $1 FOR UPDATE',
      [userId]
    );
    if (!wallet.rows[0])
      throw new AppError('User not found', 404, 'NOT_FOUND');
    if (!wallet.rows[0].email_verified)
      throw new AppError('Please verify your email before playing', 403, 'EMAIL_NOT_VERIFIED');
    if (parseFloat(wallet.rows[0].wallet_balance) < stakeAmount)
      throw new AppError('Insufficient wallet balance', 400, 'INSUFFICIENT_BALANCE');

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

    // Deduct stake atomically
    const debit = await client.query(
      `UPDATE users
       SET wallet_balance = wallet_balance - $1, total_staked = total_staked + $1
       WHERE id = $2 AND wallet_balance >= $1
       RETURNING id`,
      [stakeAmount, userId]
    );
    if (!debit.rowCount)
      throw new AppError('Insufficient wallet balance', 400, 'INSUFFICIENT_BALANCE');

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
      gameDuration: settings.gameDuration,
    }, settings.gameDuration + 10);

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

    const zohoService = require('./zohoService');
    zohoService.syncStake(userId, stakeAmount, `SESSION-${sessionId}`)
      .catch(err => console.error('Failed to sync stake to Zoho Books:', err));

    // Return first question
    const firstQuestionId = trackB[0]; // default to track B; track isn't determined yet
    await markQuestionsSeen(userId, [firstQuestionId]);
    const firstQuestion = await getQuestionById(firstQuestionId);
    const firstMap = answerMaps.find(m => m.questionId === firstQuestionId);

    // Send email notification (non-blocking)
    const user = wallet.rows[0];
    if (user && user.email) {
      sendActionEmail(
        user.email,
        user.username,
        'Game Session Started',
        `You have successfully staked ₦${parseFloat(stakeAmount).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} for a new game session. Your game ID is ${sessionId.substring(0, 8).toUpperCase()}. Good luck!`
      ).catch(err => console.error('Failed to send staking email:', err));
    }

    return {
      sessionId,
      sessionToken,
      questionNumber: 1,
      totalQuestions: 10,
      question: formatQuestionForClient(firstQuestion, firstMap),
      gameDuration: settings.gameDuration,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      throw new AppError('You already have an active game session', 409, 'SESSION_ACTIVE');
    }
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

  // Server-side timing check — includes a 10s grace period
  const elapsed = Date.now() - tokenData.startedAt;
  const gameDuration = tokenData.gameDuration || 60;
  const gracePeriodMs = (gameDuration + 10) * 1000;
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
    await markQuestionsSeen(userId, [questionId]);

    const answerMaps = session.answer_option_maps;
    const answerMap  = answerMaps.find(m => m.questionId === questionId);
    if (!answerMap) throw new AppError('Answer map not found', 500, 'INTERNAL_ERROR');

    // Validate the submitted UUID belongs to this question
    const submittedKey = answerMap[`opt_${answerUuid}`];
    if (!submittedKey) throw new AppError('Invalid answer option', 400, 'INVALID_ANSWER');

    // Check correctness
    const question = await client.query(
      'SELECT id, correct_option FROM questions WHERE id = $1',
      [questionId]
    );
    const isCorrect = submittedKey === question.rows[0]?.correct_option;

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
      const stake = parseFloat(session.stake_amount);
      const taxableWinnings = computeTaxableWinnings(payout, stake);
      const taxAmount = computeWinTax(taxableWinnings, settings.userWinTaxPercentage);
      const netPayout = roundMoney(payout - taxAmount);

      await client.query(
        `UPDATE game_sessions
         SET current_question_index = $1, score = $2, status = 'completed',
             answers_submitted = $3, payout_amount = $4, tax_amount = $5, completed_at = NOW(),
             active_track = $6
         WHERE id = $7`,
        [newIdx, newScore, JSON.stringify(answersSubmitted), payout, taxAmount, newActiveTrack, sessionId]
      );

      let userEmail = null;
      let userName = null;
      
      if (payout > 0) {
        const profit = roundMoney(payout - stake);

        // Check if this is the user's first win before updating their total_won
        const preCheck = await client.query('SELECT total_won FROM users WHERE id = $1', [userId]);
        const isFirstWin = parseFloat(preCheck.rows[0].total_won) === 0;

        // Credit the NET payout (gross prize minus tax). Stake is not taxed.
        const uRes = await client.query(
          'UPDATE users SET wallet_balance = wallet_balance + $1, total_won = total_won + $2 WHERE id = $3 RETURNING username, email, referred_by',
          [netPayout, payout, userId]
        );
        userEmail = uRes.rows[0]?.email;
        userName = uRes.rows[0]?.username;
        const referredBy = uRes.rows[0]?.referred_by;
        
        // Log the gross payout transaction
        await client.query(
          `INSERT INTO transactions (user_id, type, amount, status, game_session_id)
           VALUES ($1, 'payout', $2, 'verified', $3)`,
          [userId, payout, sessionId]
        );
        
        const zohoService = require('./zohoService');
        zohoService.syncPayout(userId, payout, sessionId, {
          taxAmount,
          netAmount: netPayout,
          score: newScore,
          taxableWinnings,
          stake,
        })
          .catch(err => console.error('Failed to sync payout to Zoho Books:', err));

        // Log the tax deduction transaction if applicable
        if (taxAmount > 0) {
          await client.query(
            `INSERT INTO transactions (user_id, type, amount, status, game_session_id, metadata)
             VALUES ($1, 'tax_deduction', $2, 'verified', $3, $4)`,
            [userId, taxAmount, sessionId, JSON.stringify({
              tax_rate: settings.userWinTaxPercentage,
              taxable_winnings: taxableWinnings,
              profit_amount: profit,
            })]
          );
        }

        // Handle referral bonus (only on the referred user's first win)
        if (isFirstWin && referredBy && settings.referralWinPercentage > 0) {
          if (profit > 0) {
            const bonus = profit * settings.referralWinPercentage;
            await client.query(
              'UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2',
              [bonus, referredBy]
            );
            await client.query(
              `INSERT INTO transactions (user_id, type, amount, status, game_session_id, metadata)
               VALUES ($1, 'referral_bonus', $2, 'verified', $3, $4)`,
              [referredBy, bonus, sessionId, JSON.stringify({ referred_user_id: userId, profit_amount: profit })]
            );
            
            zohoService.syncReferralBonus(referredBy, bonus, sessionId)
              .catch(err => console.error('Failed to sync referral bonus to Zoho Books:', err));
          }
        }
      }

      await client.query(
        'UPDATE users SET total_games_played = total_games_played + 1 WHERE id = $1',
        [userId]
      );

      // Increment question stats
      const servedIds = answersSubmitted.map(a => a.question_id);
      const correctIds = answersSubmitted.filter(a => a.is_correct).map(a => a.question_id);
      if (servedIds.length) {
        await client.query(
          `UPDATE questions
           SET times_served = times_served + 1,
               times_answered_correctly = times_answered_correctly
                 + CASE WHEN id = ANY($2::uuid[]) THEN 1 ELSE 0 END
           WHERE id = ANY($1::uuid[])`,
          [servedIds, correctIds]
        );
      }

      await client.query('COMMIT');
      
      // Send winning email notification (non-blocking)
      if (payout > 0 && userEmail) {
        sendActionEmail(
          userEmail,
          userName,
          'You Won on ThinkTrophy!',
          `Congratulations! You scored ${newScore}/10 and won ₦${parseFloat(netPayout).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} after tax. The amount has been credited to your wallet.`
        ).catch(err => console.error('Failed to send winning email:', err));
      }

      return {
        gameComplete: true,
        score:        newScore,
        totalQuestions: 10,
        payout:       netPayout,
        grossPayout:  payout,
        taxAmount,
        taxableWinnings,
        stakeAmount:  stake,
        answersSubmitted,
        isCorrect,
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
    await markQuestionsSeen(userId, [nextQuestionId]);
    const nextQuestion    = await getQuestionById(nextQuestionId);
    const nextMap         = answerMaps.find(m => m.questionId === nextQuestionId);

    return {
      gameComplete:   false,
      isCorrect,
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

function roundMoney(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

function computePayout(score, stakeAmount, settings) {
  const stake = parseFloat(stakeAmount);
  if (score === 10) return roundMoney(stake * settings.payoutPerfect);
  if (score === 9)  return roundMoney(stake * settings.payoutNine);
  return 0;
}

// 10/10: tax the profit only (payout − stake). 9/10: tax the prize payout.
// The original stake is never included in the tax base when it is returned.
function computeTaxableWinnings(payout, stake) {
  if (!(payout > 0)) return 0;
  if (payout > stake) return roundMoney(payout - stake);
  return roundMoney(payout);
}

function computeWinTax(taxableWinnings, taxRate) {
  if (!(taxableWinnings > 0) || !(taxRate > 0)) return 0;
  return roundMoney(taxableWinnings * taxRate);
}

async function expireSession(sessionId) {
  const sess = await query(
    `SELECT user_id, current_question_index, active_track,
            question_ids_track_a, question_ids_track_b
     FROM game_sessions WHERE id = $1 AND status = 'active'`,
    [sessionId]
  );
  const session = sess.rows[0];
  if (session) {
    const track = session.active_track === 'a' ? session.question_ids_track_a : session.question_ids_track_b;
    const shownCount = Math.max((session.current_question_index || 0) + 1, 1);
    await markQuestionsSeen(session.user_id, (track || []).slice(0, shownCount));
  }
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

/**
 * Admin dispute correction: flip one answer's grade, recompute score/payout/tax,
 * and credit (or claw back) the wallet difference. Zoho is synced for any delta.
 */
async function correctSessionGrade(sessionId, questionId, isCorrect) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const sessRes = await client.query(
      `SELECT * FROM game_sessions WHERE id = $1 FOR UPDATE`,
      [sessionId]
    );
    const session = sessRes.rows[0];
    if (!session) throw new AppError('Session not found', 404, 'NOT_FOUND');
    if (session.status !== 'completed') {
      throw new AppError('Only completed sessions can be grade-corrected', 400, 'INVALID_STATUS');
    }

    const answers = Array.isArray(session.answers_submitted)
      ? [...session.answers_submitted]
      : [];
    const idx = answers.findIndex(a => a.question_id === questionId);
    if (idx < 0) throw new AppError('That question was not answered in this session', 404, 'NOT_FOUND');

    const prev = answers[idx];
    if (Boolean(prev.is_correct) === Boolean(isCorrect)) {
      throw new AppError('Answer grade is already set to that value', 400, 'NO_CHANGE');
    }

    const stake = parseFloat(session.stake_amount);
    const oldScore = parseInt(session.score, 10) || 0;
    const oldGross = parseFloat(session.payout_amount) || 0;
    const oldTax = parseFloat(session.tax_amount) || 0;
    const oldNet = roundMoney(oldGross - oldTax);

    answers[idx] = {
      ...prev,
      is_correct: Boolean(isCorrect),
      previous_is_correct: Boolean(prev.is_correct),
      corrected_at: new Date().toISOString(),
    };

    const newScore = answers.filter(a => a.is_correct).length;
    const settings = await getPlatformSettings();
    const newGross = computePayout(newScore, stake, settings);
    const taxableWinnings = computeTaxableWinnings(newGross, stake);
    const newTax = computeWinTax(taxableWinnings, settings.userWinTaxPercentage);
    const newNet = roundMoney(newGross - newTax);

    const deltaGross = roundMoney(newGross - oldGross);
    const deltaTax = roundMoney(newTax - oldTax);
    const deltaNet = roundMoney(newNet - oldNet);

    await client.query(
      `UPDATE game_sessions
       SET answers_submitted = $1, score = $2, payout_amount = $3, tax_amount = $4
       WHERE id = $5`,
      [JSON.stringify(answers), newScore, newGross, newTax, sessionId]
    );

    await client.query(
      `UPDATE questions
       SET times_answered_correctly = GREATEST(0, times_answered_correctly + $1)
       WHERE id = $2`,
      [isCorrect ? 1 : -1, questionId]
    );

    if (deltaNet !== 0 || deltaGross !== 0) {
      // Guard clawback against insufficient wallet balance
      if (deltaNet < 0) {
        const balRes = await client.query(
          'SELECT wallet_balance FROM users WHERE id = $1 FOR UPDATE',
          [session.user_id]
        );
        const balance = parseFloat(balRes.rows[0]?.wallet_balance || 0);
        if (balance + deltaNet < -0.001) {
          throw new AppError(
            `Cannot reverse ₦${Math.abs(deltaNet).toFixed(2)} — player wallet balance is only ₦${balance.toFixed(2)}`,
            400,
            'INSUFFICIENT_BALANCE'
          );
        }
      }

      await client.query(
        'UPDATE users SET wallet_balance = wallet_balance + $1, total_won = GREATEST(0, total_won + $2) WHERE id = $3',
        [deltaNet, deltaGross, session.user_id]
      );

      if (deltaGross !== 0) {
        await client.query(
          `INSERT INTO transactions (user_id, type, amount, status, game_session_id, metadata)
           VALUES ($1, 'payout', $2, 'verified', $3, $4)`,
          [
            session.user_id,
            Math.abs(deltaGross),
            sessionId,
            JSON.stringify({
              dispute_correction: true,
              wallet_effect: deltaGross >= 0 ? 'credit' : 'debit',
              score_before: oldScore,
              score_after: newScore,
              question_id: questionId,
              gross_delta: deltaGross,
              net_delta: deltaNet,
            }),
          ]
        );
      }

      if (deltaTax !== 0) {
        await client.query(
          `INSERT INTO transactions (user_id, type, amount, status, game_session_id, metadata)
           VALUES ($1, 'tax_deduction', $2, 'verified', $3, $4)`,
          [
            session.user_id,
            Math.abs(deltaTax),
            sessionId,
            JSON.stringify({
              dispute_correction: true,
              wallet_effect: deltaTax >= 0 ? 'debit' : 'credit',
              tax_rate: settings.userWinTaxPercentage,
              taxable_winnings: taxableWinnings,
              score_before: oldScore,
              score_after: newScore,
              tax_delta: deltaTax,
            }),
          ]
        );
      }
    }

    await client.query('COMMIT');

    if (deltaGross !== 0 || deltaTax !== 0) {
      const zohoService = require('./zohoService');
      zohoService.syncPayoutCorrection(session.user_id, {
        gameId: sessionId,
        grossDelta: deltaGross,
        taxDelta: deltaTax,
        netDelta: deltaNet,
        score: newScore,
        stake,
        taxableWinnings,
      }).catch(err => console.error('Failed to sync dispute correction to Zoho Books:', err));
    }

    return {
      sessionId,
      questionId,
      previous: {
        score: oldScore,
        is_correct: Boolean(prev.is_correct),
        grossPayout: oldGross,
        taxAmount: oldTax,
        netPayout: oldNet,
      },
      corrected: {
        score: newScore,
        is_correct: Boolean(isCorrect),
        grossPayout: newGross,
        taxAmount: newTax,
        netPayout: newNet,
      },
      walletCreditDelta: deltaNet,
      answers,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  createSession,
  submitAnswer,
  getSessionResult,
  expireSession,
  correctSessionGrade,
  getPlatformSettings,
  computePayout,
  computeTaxableWinnings,
  computeWinTax,
  roundMoney,
};
