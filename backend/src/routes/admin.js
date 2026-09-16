const router = require('express').Router();
const multer = require('multer');
const ctrl   = require('../controllers/adminController');
const { requireAdmin, requireModeratorOrAbove, requireSuperAdmin } = require('../middleware/auth');
const {
  validate, createQuestionSchema, updateQuestionSchema,
  createCategorySchema, testimonialBodySchema, settingsSchema,
  correctGameAnswerSchema,
} = require('../utils/validators');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.use(requireAdmin);

// Dashboard
router.get('/dashboard/stats',          ctrl.getDashboardStats);

// Statistics
router.get('/statistics',               ctrl.getStatistics);

// Questions
router.get('/questions',                ctrl.listQuestions);
router.post('/questions',               requireModeratorOrAbove, validate(createQuestionSchema), ctrl.createQuestion);
router.put('/questions/:id',            requireModeratorOrAbove, validate(updateQuestionSchema), ctrl.updateQuestion);
router.delete('/questions/:id',         requireModeratorOrAbove, ctrl.deleteQuestion);
router.post('/questions/bulk-delete',   requireModeratorOrAbove, ctrl.bulkDeleteQuestions);
router.post('/questions/bulk-upload',   requireModeratorOrAbove, upload.single('file'), ctrl.bulkUploadQuestions);

// Categories
router.get('/categories',               ctrl.listAdminCategories);
router.post('/categories',              requireModeratorOrAbove, validate(createCategorySchema), ctrl.createCategory);
router.put('/categories/:id',           requireModeratorOrAbove, ctrl.updateCategory);
router.delete('/categories/:id',        requireModeratorOrAbove, ctrl.deleteCategory);
router.post('/categories/bulk-delete',  requireModeratorOrAbove, ctrl.bulkDeleteCategories);

// Landing testimonials
router.get('/testimonials',             ctrl.listTestimonials);
router.post('/testimonials',            requireModeratorOrAbove, validate(testimonialBodySchema), ctrl.createTestimonial);
router.put('/testimonials/:id',         requireModeratorOrAbove, validate(testimonialBodySchema), ctrl.updateTestimonial);
router.delete('/testimonials/:id',      requireModeratorOrAbove, ctrl.deleteTestimonial);

// Transactions
router.get('/transactions',             ctrl.listTransactions);
router.post('/transactions/:reference/verify', requireModeratorOrAbove, ctrl.verifyPendingDeposit);

// Users
router.get('/users',                    ctrl.listUsers);
router.get('/users/:id',                ctrl.getUserDetail);
router.put('/users/:id/status',         requireModeratorOrAbove, ctrl.updateUserStatus);

// Game Sessions
router.get('/game-sessions',            ctrl.listGameSessions);
router.get('/game-sessions/:id',        ctrl.getGameSessionDetail);
router.post(
  '/game-sessions/:id/correct-answer',
  requireModeratorOrAbove,
  validate(correctGameAnswerSchema),
  ctrl.correctGameSessionAnswer
);

// Settings
router.get('/settings',                 ctrl.getSettings);
router.put('/settings',                 requireModeratorOrAbove, validate(settingsSchema), ctrl.updateSettings);

// Webhooks
router.get('/webhooks',                 requireModeratorOrAbove, ctrl.getWebhookLogs);

// Logs
router.get('/logs',                     ctrl.getAdminLogs);

// Admins
router.get('/admins',                   requireSuperAdmin, ctrl.listAdmins);
router.post('/admins',                  requireSuperAdmin, ctrl.createAdmin);
router.put('/admins/:id/role',          requireSuperAdmin, ctrl.updateAdminRole);

module.exports = router;
