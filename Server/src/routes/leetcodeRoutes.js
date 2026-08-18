const express = require('express');
const router = express.Router();
const { getStats, triggerSyncNow, getHeatmap, getLeaderboard, getBatchProgressMatrix } = require('../controllers/leetcodeController');
const { protect } = require('../middleware/auth');

router.get('/stats/:userId?', protect, getStats);
router.post('/sync-now', protect, triggerSyncNow);
router.get('/heatmap/:userId?', protect, getHeatmap);
router.get('/leaderboard', protect, getLeaderboard);
router.get('/progress-matrix', protect, getBatchProgressMatrix);


module.exports = router;
