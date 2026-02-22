const router = require('express').Router();
const { listCategories, createGameSession, answerQuestion, getResult, abandonSession } = require('../controllers/gameController');
const { getGameHistory } = require('../controllers/userController');
const { validate, createSessionSchema, submitAnswerSchema } = require('../utils/validators');
const { requireActiveUser } = require('../middleware/auth');
const { answerLimiter } = require('../middleware/rateLimiter');

router.use(requireActiveUser);

router.get('/categories',                   listCategories);
router.post('/session/create',              validate(createSessionSchema), createGameSession);
router.post('/session/:sessionId/answer',   answerLimiter, validate(submitAnswerSchema), answerQuestion);
router.get('/session/:sessionId/result',    getResult);
router.post('/session/:sessionId/abandon',   abandonSession);
router.get('/history',                      getGameHistory);

module.exports = router;
