const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getWeeklyProblems,
  createWeeklyProblem,
  updateWeeklyProblem,
  deleteWeeklyProblem,
  toggleCompletion,
  getAvailableWeeks
} = require('../controllers/weeklyProblemController');

router.get('/', protect, getWeeklyProblems);
router.get('/weeks', protect, getAvailableWeeks);
router.post('/', protect, createWeeklyProblem);
router.put('/:id', protect, updateWeeklyProblem);
router.delete('/:id', protect, deleteWeeklyProblem);
router.post('/:id/toggle-complete', protect, toggleCompletion);

module.exports = router;
