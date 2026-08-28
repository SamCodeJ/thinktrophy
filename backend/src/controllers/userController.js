const crypto = require('crypto');
const { query } = require('../db/connection');
const { AppError } = require('../middleware/errorHandler');

async function getProfile(req, res, next) {
  try {
    const result = await query(
      `SELECT id, username, email, phone_number, wallet_balance,
              total_games_played, total_won, total_staked, email_verified, created_at, referral_code
       FROM users WHERE id = $1`,
      [req.user.userId]
    );
    let user = result.rows[0];
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');

    // Auto-generate a referral code for legacy users who don't have one yet
    if (!user.referral_code) {
      const newReferralCode = crypto.randomBytes(4).toString('hex').toUpperCase();
      await query('UPDATE users SET referral_code = $1 WHERE id = $2', [newReferralCode, user.id]);
      user.referral_code = newReferralCode;
    }

    // Lifetime game stats (history API is capped at 20 rows — do not derive these client-side)
    const statsRes = await query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'completed')::int AS games_completed,
         COUNT(*) FILTER (
           WHERE status = 'completed' AND COALESCE(payout_amount, 0) > 0
         )::int AS games_won,
         COALESCE(MAX(score) FILTER (WHERE status = 'completed'), 0)::int AS best_score
       FROM game_sessions
       WHERE user_id = $1`,
      [req.user.userId]
    );
    const stats = statsRes.rows[0] || {};
    const gamesCompleted = stats.games_completed || 0;
    const gamesWon = stats.games_won || 0;
    const totalGames = user.total_games_played || 0;
    // Denominator matches the "Total Games" counter shown on profile
    const winDenom = totalGames > 0 ? totalGames : gamesCompleted;

    user.games_won = gamesWon;
    user.best_score = stats.best_score || 0;
    user.win_rate = winDenom > 0 ? Math.round((gamesWon / winDenom) * 100) : 0;

    res.json({ success: true, data: user });
  } catch (err) { next(err); }
}

async function getWallet(req, res, next) {
  try {
    const balanceRes = await query(
      'SELECT wallet_balance FROM users WHERE id = $1',
      [req.user.userId]
    );
    const txRes = await query(
      `SELECT id, type, amount, status, reference, game_session_id, metadata, created_at
       FROM transactions WHERE user_id = $1
       ORDER BY created_at DESC LIMIT 50`,
      [req.user.userId]
    );
    res.json({
      success: true,
      data: {
        balance:      parseFloat(balanceRes.rows[0].wallet_balance),
        transactions: txRes.rows,
      },
    });
  } catch (err) { next(err); }
}

async function getGameHistory(req, res, next) {
  try {
    const result = await query(
      `SELECT gs.id, gs.stake_amount, gs.score, gs.payout_amount, gs.status,
              gs.started_at, gs.completed_at, gs.selected_category_ids,
              EXTRACT(EPOCH FROM (gs.completed_at - gs.started_at))::int AS duration_seconds
       FROM game_sessions gs
       WHERE gs.user_id = $1
       ORDER BY gs.created_at DESC
       LIMIT 20`,
      [req.user.userId]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
}

async function getLeaderboard(req, res, next) {
  try {
    const { period = 'weekly' } = req.query;
    const dateFilter = period === 'weekly'
      ? `AND gs.completed_at >= NOW() - INTERVAL '7 days'`
      : '';

    const result = await query(
      `SELECT u.id, u.username,
              SUM(gs.payout_amount) AS total_won,
              COUNT(gs.id) AS games_played,
              MAX(gs.score) AS best_score
       FROM users u
       JOIN game_sessions gs ON gs.user_id = u.id
       WHERE gs.status = 'completed' ${dateFilter}
       GROUP BY u.id, u.username
       ORDER BY total_won DESC
       LIMIT 50`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
}

module.exports = { getProfile, getWallet, getGameHistory, getLeaderboard };
