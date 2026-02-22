const { query } = require('../db/connection');
const cache = require('../utils/cache');
const { v4: uuidv4 } = require('uuid');

// Returns active categories (cached 5 min)
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

// Pick `count` random questions for a category at given difficulties
async function pickQuestions(categoryId, difficulties, count) {
  const result = await query(
    `SELECT id, question_text, option_a, option_b, option_c, option_d, correct_option, difficulty
     FROM questions
     WHERE category_id = $1
       AND difficulty = ANY($2::text[])
       AND is_active = TRUE
     ORDER BY RANDOM()
     LIMIT $3`,
    [categoryId, difficulties, count]
  );
  return result.rows;
}

// Build the 10-question session split:
//   Track A (hard track) : Q1–5 random, Q6–10 hard
//   Track B (normal track): Q1–5 random, Q6–10 random (easy/medium/hard)
// Returns { trackA: [q,...], trackB: [q,...], answerMaps: [...] }
async function buildSessionQuestions(categoryIds) {
  const randomDiffs = ['easy', 'medium', 'hard'];

  // 2 questions per category across 5 categories = 10 questions for Q1-5
  // We need to be clever: pick 2 random questions per category (shared between tracks for Q1-5)
  const firstFiveIds = new Set();
  const firstFiveQuestions = [];

  for (const catId of categoryIds) {
    const qs = await pickQuestions(catId, randomDiffs, 2);
    if (qs.length < 2) {
      throw Object.assign(new Error(`Not enough active questions in category ${catId}`), { statusCode: 422, code: 'INSUFFICIENT_QUESTIONS' });
    }
    firstFiveQuestions.push(...qs);
    qs.forEach(q => firstFiveIds.add(q.id));
  }

  // Shuffle the 10 questions for Q1-10 in Track B (normal)
  const shuffled = shuffle([...firstFiveQuestions]);

  // For Track A (hard), first 5 are the same shuffled set; last 5 are hard-only
  // We pick 5 hard questions (1 per category) for Track A's Q6-10
  const hardQ = [];
  for (const catId of categoryIds) {
    const qs = await pickQuestions(catId, ['hard'], 1);
    if (qs.length > 0) hardQ.push(qs[0]);
  }
  // If not enough hard questions, fall back to any difficulty
  if (hardQ.length < 5) {
    for (const catId of categoryIds) {
      if (hardQ.length >= 5) break;
      const exists = hardQ.some(q => q.category_id === catId);
      if (!exists) {
        const qs = await pickQuestions(catId, randomDiffs, 1);
        if (qs.length > 0) hardQ.push(qs[0]);
      }
    }
  }
  const hardFive = hardQ.slice(0, 5);
  const shuffledHard = shuffle(hardFive);

  // For Track B's Q6-10, pick 5 more random questions (different from first 5)
  const normalExtra = [];
  for (const catId of categoryIds) {
    if (normalExtra.length >= 5) break;
    const qs = await pickQuestions(catId, randomDiffs, 1);
    const unique = qs.filter(q => !firstFiveIds.has(q.id));
    if (unique.length > 0) normalExtra.push(unique[0]);
    else if (qs.length > 0) normalExtra.push(qs[0]); // fallback, allow reuse
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
  buildSessionQuestions,
  formatQuestionForClient,
  getQuestionById,
};
