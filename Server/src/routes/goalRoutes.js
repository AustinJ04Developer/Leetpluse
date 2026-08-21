const express = require('express');
const router = express.Router();
const { getGoals, createGoal, updateGoalProgress, deleteGoal } = require('../controllers/goalController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getGoals);
router.post('/', protect, createGoal);
router.put('/:id/progress', protect, updateGoalProgress);
router.delete('/:id', protect, deleteGoal);

module.exports = router;
