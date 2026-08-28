const { query } = require('../db/connection');
const cache = require('../utils/cache');
const { v4: uuidv4 } = require('uuid');
const { AppError } = require('../middleware/errorHandler');

// Returns active categories (cached 5 min) — admin / unscoped
async function getActiveCategories() {
  const cached = cache.get('active_categories');
  if (cached) return cached;

  const result = await query(
    `SELECT c.*, COUNT(q.id) FILTER (WHERE q.is_active) AS question_count
     FROM categories c
     LEFT JOIN questions q ON q.category_id = c.id
     WHERE c.is_active = TRUE
     GROUP BY c.id
     ORDER BY c.name`
  );
  cache.set('active_categories', result.rows, 5 * 60 * 1000);
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
            COUNT(q.id) FILTER (WHERE q.is_active) AS question_count,
            COUNT(q.id) FILTER (WHERE q.is_active AND usq.question_id IS NOT NULL) AS seen_count
     FROM categories c
     LEFT JOIN questions q ON q.category_id = c.id AND q.is_active = TRUE
     LEFT JOIN user_seen_questions usq ON usq.question_id = q.id AND usq.user_id = $1
     WHERE c.is_active = TRUE
     GROUP BY c.id
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

// Pick `count` random unused questions for a category at given difficulties
async function pickQuestions(categoryId, difficulties, count, opts = {}) {
  const { userId, excludeIds = [] } = opts;
  if (count <= 0) return [];
  const result = await query(
    `SELECT id, question_text, option_a, option_b, option_c, option_d, correct_option, difficulty, category_id
     FROM questions
     WHERE category_id = $1
       AND difficulty = ANY($2::text[])
       AND is_active = TRUE
       AND NOT (id = ANY($4::uuid[]))
       AND (
         $5::uuid IS NULL
         OR id NOT IN (SELECT question_id FROM user_seen_questions WHERE user_id = $5)
       )
     ORDER BY RANDOM()
     LIMIT $3`,
    [categoryId, difficulties, count, excludeIds, userId || null]
  );
  return result.rows;
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
  const usedIds = [];

  // Spread 10 unseen questions across the selected categories (7 cats → 3 get 2, 4 get 1)
  const firstFiveIds = new Set();
  const firstFiveQuestions = [];

  for (let i = 0; i < categoryIds.length; i++) {
    const catId = categoryIds[i];
    const needed = counts[i] || 0;
    if (needed === 0) continue;
    const qs = await pickQuestions(catId, randomDiffs, needed, { userId, excludeIds: usedIds });
    firstFiveQuestions.push(...qs);
    qs.forEach(q => {
      firstFiveIds.add(q.id);
      usedIds.push(q.id);
    });
  }

  if (firstFiveQuestions.length < TOTAL_QUESTIONS) {
    const leftover = TOTAL_QUESTIONS - firstFiveQuestions.length;
    for (const catId of shuffle([...categoryIds])) {
      if (firstFiveQuestions.length >= TOTAL_QUESTIONS) break;
      const qs = await pickQuestions(catId, randomDiffs, leftover, { userId, excludeIds: usedIds });
      firstFiveQuestions.push(...qs);
      qs.forEach(q => {
        firstFiveIds.add(q.id);
        usedIds.push(q.id);
      });
    }
  }

  if (firstFiveQuestions.length < TOTAL_QUESTIONS) {
    throw new AppError(
      'Not enough unused questions in the selected categories. Please choose different categories.',
      422,
      'INSUFFICIENT_QUESTIONS'
    );
  }

  // Shuffle the 10 questions for Q1-10 in Track B (normal)
  const shuffled = shuffle([...firstFiveQuestions]);

  // For Track A (hard), first 5 are the same shuffled set; last 5 are hard-only
  // We pick 5 hard questions (1 per category) for Track A's Q6-10
  const hardQ = [];
  for (const catId of categoryIds) {
    const qs = await pickQuestions(catId, ['hard'], 1, { userId, excludeIds: usedIds });
    if (qs.length > 0) {
      hardQ.push(qs[0]);
      usedIds.push(qs[0].id);
    }
  }
  // If not enough hard questions, fall back to any unused difficulty
  if (hardQ.length < 5) {
    for (const catId of categoryIds) {
      if (hardQ.length >= 5) break;
      const exists = hardQ.some(q => q.category_id === catId);
      if (!exists) {
        const qs = await pickQuestions(catId, randomDiffs, 1, { userId, excludeIds: usedIds });
        if (qs.length > 0) {
          hardQ.push(qs[0]);
          usedIds.push(qs[0].id);
        }
      }
    }
  }
  const hardFive = hardQ.slice(0, 5);
  const shuffledHard = shuffle(hardFive);

  // For Track B's Q6-10, pick 5 more unused random questions
  const normalExtra = [];
  for (const catId of categoryIds) {
    if (normalExtra.length >= 5) break;
    const qs = await pickQuestions(catId, randomDiffs, 1, { userId, excludeIds: usedIds });
    if (qs.length > 0) {
      normalExtra.push(qs[0]);
      usedIds.push(qs[0].id);
    }
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
