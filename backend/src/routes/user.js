const router = require('express').Router();
const { getProfile, getWallet, getGameHistory, getLeaderboard } = require('../controllers/userController');
const { requireActiveUser } = require('../middleware/auth');

router.use(requireActiveUser);

router.get('/profile',     getProfile);
router.get('/wallet',      getWallet);
router.get('/history',     getGameHistory);
router.get('/leaderboard', getLeaderboard);

module.exports = router;
