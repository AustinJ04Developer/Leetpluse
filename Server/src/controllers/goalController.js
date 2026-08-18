const Goal = require('../models/Goal');

const getGoals = async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, goals });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createGoal = async (req, res) => {
  try {
    const { title, targetSolved, period, endDate } = req.body;
    const goal = await Goal.create({
      userId: req.user._id,
      title,
      targetSolved,
      period: period || 'weekly',
      endDate: endDate || new Date(Date.now() + 7 * 86400000)
    });
    res.status(201).json({ success: true, goal });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateGoalProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentSolved } = req.body;

    const goal = await Goal.findOne({ _id: id, userId: req.user._id });
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });

    goal.currentSolved = currentSolved;
    if (goal.currentSolved >= goal.targetSolved) {
      goal.completed = true;
    }
    await goal.save();

    res.json({ success: true, goal });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getGoals, createGoal, updateGoalProgress };
