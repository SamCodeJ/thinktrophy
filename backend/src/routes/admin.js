const router = require('express').Router();
const multer = require('multer');
const ctrl   = require('../controllers/adminController');
const { requireAdmin } = require('../middleware/auth');
const { validate, createQuestionSchema, createCategorySchema, settingsSchema } = require('../utils/validators');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.use(requireAdmin);

// Dashboard
router.get('/dashboard/stats',          ctrl.getDashboardStats);

// Statistics
router.get('/statistics',               ctrl.getStatistics);

// Questions
router.get('/questions',                ctrl.listQuestions);
router.post('/questions',               validate(createQuestionSchema), ctrl.createQuestion);
router.put('/questions/:id',            ctrl.updateQuestion);
router.delete('/questions/:id',         ctrl.deleteQuestion);
router.post('/questions/bulk-upload',   upload.single('file'), ctrl.bulkUploadQuestions);

// Categories
router.get('/categories',               ctrl.listAdminCategories);
router.post('/categories',              validate(createCategorySchema), ctrl.createCategory);
router.put('/categories/:id',           ctrl.updateCategory);

// Transactions
router.get('/transactions',             ctrl.listTransactions);

// Users
router.get('/users',                    ctrl.listUsers);
router.get('/users/:id',                ctrl.getUserDetail);
router.put('/users/:id/status',         ctrl.updateUserStatus);

// Game Sessions
router.get('/game-sessions',            ctrl.listGameSessions);
router.get('/game-sessions/:id',        ctrl.getGameSessionDetail);

// Settings
router.get('/settings',                 ctrl.getSettings);
router.put('/settings',                 validate(settingsSchema), ctrl.updateSettings);

module.exports = router;
