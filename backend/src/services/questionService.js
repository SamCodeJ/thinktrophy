const { query } = require('../db/connection');
const cache = require('../utils/cache');
const { v4: uuidv4 } = require('uuid');
const { AppError } = require('../middleware/errorHandler');

// Returns active categories (cached 5 min) — admin / unscoped
async function getActiveCategories() {
  const cached = await cache.get('active_categories');
  if (cached) return cached;

  const result = await query(
    `SELECT c.*, COUNT(q.id) FILTER (WHERE q.is_active) AS question_count
     FROM categories c
     LEFT JOIN questions q ON q.category_id = c.id
     WHERE c.is_active = TRUE
     GROUP BY c.id
     ORDER BY c.name`
  );
  await cache.set('active_categories', result.rows, 5 * 60 * 1000);
  return result.rows;
}

function decorateCategory(row) {
  const questionCount = parseInt(row.question_count || 0, 10);
  const seenCount = parseInt(row.seen_count || 0, 10);
  const remainingCount = Math.max(0, questionCount - seenCount);
  return {
    ...row,
    question_count: questionCount,
    seen_count: seenCount,
    remaining_count: remainingCount,
    exhausted: questionCount === 0 || remainingCount === 0,
  };
}

async function getCategoriesForUser(userId) {
  const result = await query(
    `SELECT c.*,
            COALESCE(qc.question_count, 0) AS question_count,
            COALESCE(sc.seen_count, 0) AS seen_count
     FROM categories c
     LEFT JOIN (
       SELECT category_id, COUNT(*)::int AS question_count
       FROM questions
       WHERE is_active = TRUE
       GROUP BY category_id
     ) qc ON qc.category_id = c.id
     LEFT JOIN (
       SELECT q.category_id, COUNT(*)::int AS seen_count
       FROM user_seen_questions usq
       JOIN questions q ON q.id = usq.question_id AND q.is_active = TRUE
       WHERE usq.user_id = $1
       GROUP BY q.category_id
     ) sc ON sc.category_id = c.id
     WHERE c.is_active = TRUE
     ORDER BY c.name`,
    [userId]
  );
  return result.rows.map(decorateCategory);
}

async function markQuestionsSeen(userId, questionIds, exec = query) {
  const ids = [...new Set((questionIds || []).filter(Boolean))];
  if (!userId || !ids.length) return;
  await exec(
    `INSERT INTO user_seen_questions (user_id, question_id)
     SELECT $1, x FROM unnest($2::uuid[]) AS x
     ON CONFLICT DO NOTHING`,
    [userId, ids]
  );
}

async function loadQuestionPool(categoryIds, userId, perGroup = 20) {
  const seed = uuidv4();
  const result = await query(
    `SELECT id, question_text, option_a, option_b, option_c, option_d, correct_option, difficulty, category_id
     FROM (
       SELECT q.id, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d,
              q.correct_option, q.difficulty, q.category_id,
              ROW_NUMBER() OVER (
                PARTITION BY q.category_id, q.difficulty
                ORDER BY md5(q.id::text || $3)
              ) AS rn
       FROM questions q
       WHERE q.category_id = ANY($1::uuid[])
         AND q.is_active = TRUE
         AND ($2::uuid IS NULL OR NOT EXISTS (
           SELECT 1 FROM user_seen_questions usq
           WHERE usq.user_id = $2 AND usq.question_id = q.id
         ))
     ) ranked
     WHERE rn <= $4`,
    [categoryIds, userId || null, seed, perGroup]
  );
  return shuffle(result.rows);
}

function takeFromPool(pool, { categoryId, difficulties, count, used }) {
  if (count <= 0) return [];
  const picked = [];
  for (const q of pool) {
    if (picked.length >= count) break;
    if (used.has(q.id)) continue;
    if (categoryId && q.category_id !== categoryId) continue;
    if (difficulties && !difficulties.includes(q.difficulty)) continue;
    picked.push(q);
    used.add(q.id);
  }
  return picked;
}

const TOTAL_QUESTIONS = 10;

function questionCountsForCategories(categoryCount, total = TOTAL_QUESTIONS) {
  const counts = Array(categoryCount).fill(0);
  if (categoryCount <= 0) return counts;
  const base = Math.floor(total / categoryCount);
  let remainder = total % categoryCount;
  for (let i = 0; i < categoryCount; i++) counts[i] = base;
  const order = shuffle([...Array(categoryCount).keys()]);
  for (const i of order) {
    if (remainder <= 0) break;
    counts[i]++;
    remainder--;
  }
  return counts;
}

// Build the 10-question session split:
//   Track A (hard track) : Q1–5 random, Q6–10 hard
//   Track B (normal track): Q1–5 random, Q6–10 random (easy/medium/hard)
// Returns { trackA: [q,...], trackB: [q,...], answerMaps: [...] }
async function buildSessionQuestions(categoryIds, userId) {
  const randomDiffs = ['easy', 'medium', 'hard'];
  const counts = questionCountsForCategories(categoryIds.length);
  const pool = await loadQuestionPool(categoryIds, userId);
  const used = new Set();

  // Spread 10 unseen questions across the selected categories (7 cats → 3 get 2, 4 get 1)
  const firstFiveQuestions = [];

  for (let i = 0; i < categoryIds.length; i++) {
    const catId = categoryIds[i];
    const needed = counts[i] || 0;
    if (needed === 0) continue;
    const qs = takeFromPool(pool, { categoryId: catId, difficulties: randomDiffs, count: needed, used });
    firstFiveQuestions.push(...qs);
  }

  if (firstFiveQuestions.length < TOTAL_QUESTIONS) {
    const leftover = TOTAL_QUESTIONS - firstFiveQuestions.length;
    for (const catId of shuffle([...categoryIds])) {
      if (firstFiveQuestions.length >= TOTAL_QUESTIONS) break;
      const qs = takeFromPool(pool, { categoryId: catId, difficulties: randomDiffs, count: leftover, used });
      firstFiveQuestions.push(...qs);
    }
  }

  if (firstFiveQuestions.length < TOTAL_QUESTIONS) {
    throw new AppError(
      'Not enough unused questions in the selected categories. Please choose different categories.',
      422,
      'INSUFFICIENT_QUESTIONS'
    );
  }
  firstFiveQuestions.length = TOTAL_QUESTIONS;

  // Shuffle the 10 questions for Q1-10 in Track B (normal)
  const shuffled = shuffle([...firstFiveQuestions]);

  // For Track A (hard), first 5 are the same shuffled set; last 5 are hard-only
  // We pick 5 hard questions (1 per category) for Track A's Q6-10
  const hardQ = [];
  for (const catId of categoryIds) {
    const qs = takeFromPool(pool, { categoryId: catId, difficulties: ['hard'], count: 1, used });
    if (qs.length > 0) hardQ.push(qs[0]);
  }
  // If not enough hard questions, fall back to any unused difficulty
  if (hardQ.length < 5) {
    for (const catId of categoryIds) {
      if (hardQ.length >= 5) break;
      const exists = hardQ.some(q => q.category_id === catId);
      if (!exists) {
        const qs = takeFromPool(pool, { categoryId: catId, difficulties: randomDiffs, count: 1, used });
        if (qs.length > 0) hardQ.push(qs[0]);
      }
    }
  }
  const hardFive = hardQ.slice(0, 5);
  const shuffledHard = shuffle(hardFive);

  // For Track B's Q6-10, pick 5 more unused random questions
  const normalExtra = [];
  for (const catId of categoryIds) {
    if (normalExtra.length >= 5) break;
    const qs = takeFromPool(pool, { categoryId: catId, difficulties: randomDiffs, count: 1, used });
    if (qs.length > 0) normalExtra.push(qs[0]);
  }
  // Pad if needed
  while (normalExtra.length < 5) normalExtra.push(shuffled[normalExtra.length % 5]);

  const trackA = [...shuffled, ...shuffledHard];
  const trackB = [...shuffled, ...normalExtra.slice(0, 5)];

  // Build opaque UUID answer maps for ALL unique questions
  const allQuestions = [...new Map(
    [...trackA, ...trackB].map(q => [q.id, q])
  ).values()];

  const answerMaps = allQuestions.map(q => {
    const options = [
      { key: 'a', text: q.option_a },
      { key: 'b', text: q.option_b },
      { key: 'c', text: q.option_c },
      { key: 'd', text: q.option_d },
    ];
    const shuffledOpts = shuffle(options);
    const map = {
      questionId:  q.id,
      correctUuid: null,
    };
    shuffledOpts.forEach(opt => {
      const uuid = uuidv4();
      map[`uuid_${opt.key}`] = uuid; // original key → uuid (for lookup)
      map[`opt_${uuid}`] = opt.key;  // uuid → original key (for answer check)
      map[`text_${uuid}`] = opt.text;
      if (opt.key === q.correct_option) map.correctUuid = uuid;
    });
    // Also store the display order
    map.displayOrder = shuffledOpts.map(opt => ({
      uuid: map[`uuid_${opt.key}`],
      text: opt.text,
    }));
    return map;
  });

  return {
    trackA: trackA.map(q => q.id),
    trackB: trackB.map(q => q.id),
    answerMaps,
  };
}

function formatQuestionForClient(question, answerMap) {
  return {
    id:            question.id,
    question_text: question.question_text,
    options:       answerMap.displayOrder,
    difficulty:    question.difficulty,
    category_id:   question.category_id,
    category_name: question.category_name || null,
  };
}

async function getQuestionById(id) {
  const result = await query(
    `SELECT q.*, c.name AS category_name
     FROM questions q
     JOIN categories c ON c.id = q.category_id
     WHERE q.id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

module.exports = {
  getActiveCategories,
  getCategoriesForUser,
  markQuestionsSeen,
  buildSessionQuestions,
  formatQuestionForClient,
  getQuestionById,
};
