const WeeklyProblem = require('../models/WeeklyProblem');
const User = require('../models/User');
const { getQuestionDetails } = require('../services/leetcodeService');

// Helper to fetch problem details from LeetCode URL for auto-filling Admin forms
const fetchProblemDetailsFromUrl = async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ success: false, message: 'URL is required' });
    }

    const match = url.match(/leetcode\.com\/problems\/([^/]+)/);
    const titleSlug = match ? match[1] : url.trim().toLowerCase().replace(/\s+/g, '-');

    const details = await getQuestionDetails(titleSlug);
    
    const formattedTitle = titleSlug
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    res.json({
      success: true,
      titleSlug,
      title: formattedTitle,
      difficulty: details.difficulty,
      category: details.topicTags && details.topicTags[0] ? details.topicTags[0] : 'General'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Helper to get ISO week number & year
const getISOWeekDetails = (d = new Date()) => {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  return { weekNumber: weekNo, year: date.getUTCFullYear() };
};

// Helper to get Monday and Sunday dates for a week number
const getWeekDateRange = (weekNo, year) => {
  const simple = new Date(Date.UTC(year, 0, 1 + (weekNo - 1) * 7));
  const dow = simple.getUTCDay();
  const ISOweekStart = simple;
  if (dow <= 4) {
    ISOweekStart.setUTCDate(simple.getUTCDate() - simple.getUTCDay() + 1);
  } else {
    ISOweekStart.setUTCDate(simple.getUTCDate() + 8 - simple.getUTCDay());
  }
  const ISOweekEnd = new Date(ISOweekStart);
  ISOweekEnd.setUTCDate(ISOweekStart.getUTCDate() + 6);
  return { startDate: ISOweekStart, endDate: ISOweekEnd };
};

// Get problems for a week (defaults to current week)
const getWeeklyProblems = async (req, res) => {
  try {
    const user = req.user;
    const currentWeek = getISOWeekDetails();
    
    const weekNumber = parseInt(req.query.weekNumber) || currentWeek.weekNumber;
    const year = parseInt(req.query.year) || currentWeek.year;

    // Filter problems assigned to everyone (assignedToGroup = null) or assigned specifically to user's cohort
    const filter = {
      weekNumber,
      year,
      $or: [
        { assignedToGroup: null },
        { assignedToGroup: { $exists: false } }
      ]
    };

    if (user.groupId) {
      filter.$or.push({ assignedToGroup: user.groupId });
    }

    const problems = await WeeklyProblem.find(filter)
      .populate('createdBy', 'name email role')
      .sort({ createdAt: 1 });

    const formatted = problems.map(prob => {
      const isCompleted = prob.completions.some(
        c => c.userId && c.userId.toString() === user._id.toString()
      );
      return {
        _id: prob._id,
        title: prob.title,
        problemUrl: prob.problemUrl,
        difficulty: prob.difficulty,
        category: prob.category,
        weekNumber: prob.weekNumber,
        year: prob.year,
        startDate: prob.startDate,
        endDate: prob.endDate,
        notes: prob.notes,
        assignedToGroup: prob.assignedToGroup,
        createdBy: prob.createdBy,
        isCompleted,
        completedCount: prob.completions.length,
        createdAt: prob.createdAt
      };
    });

    const range = getWeekDateRange(weekNumber, year);

    res.json({
      success: true,
      weekNumber,
      year,
      currentWeekNumber: currentWeek.weekNumber,
      currentYear: currentWeek.year,
      startDate: range.startDate,
      endDate: range.endDate,
      totalProblems: formatted.length,
      completedCount: formatted.filter(p => p.isCompleted).length,
      problems: formatted
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Create a new weekly problem (Admin level 2+)
const createWeeklyProblem = async (req, res) => {
  try {
    const user = req.user;
    if (user.roleLevel < 2) {
      return res.status(403).json({ success: false, message: 'Forbidden: Admins only' });
    }

    const { title, problemUrl, difficulty, category, weekNumber, year, notes, assignedToGroup } = req.body;

    if (!title || !problemUrl) {
      return res.status(400).json({ success: false, message: 'Title and LeetCode Problem URL are required.' });
    }

    const currentWeek = getISOWeekDetails();
    const targetWeek = parseInt(weekNumber) || currentWeek.weekNumber;
    const targetYear = parseInt(year) || currentWeek.year;
    const range = getWeekDateRange(targetWeek, targetYear);

    const problem = await WeeklyProblem.create({
      title,
      problemUrl,
      difficulty: difficulty || 'Easy',
      category: category || 'General',
      weekNumber: targetWeek,
      year: targetYear,
      startDate: range.startDate,
      endDate: range.endDate,
      notes: notes || '',
      assignedToGroup: assignedToGroup || null,
      createdBy: user._id
    });

    res.status(201).json({ success: true, problem });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update a weekly problem (Admin level 2+)
const updateWeeklyProblem = async (req, res) => {
  try {
    const user = req.user;
    if (user.roleLevel < 2) {
      return res.status(403).json({ success: false, message: 'Forbidden: Admins only' });
    }

    const problem = await WeeklyProblem.findById(req.params.id);
    if (!problem) {
      return res.status(404).json({ success: false, message: 'Weekly problem not found' });
    }

    const { title, problemUrl, difficulty, category, weekNumber, year, notes, assignedToGroup } = req.body;

    if (title) problem.title = title;
    if (problemUrl) problem.problemUrl = problemUrl;
    if (difficulty) problem.difficulty = difficulty;
    if (category) problem.category = category;
    if (notes !== undefined) problem.notes = notes;
    if (assignedToGroup !== undefined) problem.assignedToGroup = assignedToGroup || null;

    if (weekNumber || year) {
      problem.weekNumber = parseInt(weekNumber) || problem.weekNumber;
      problem.year = parseInt(year) || problem.year;
      const range = getWeekDateRange(problem.weekNumber, problem.year);
      problem.startDate = range.startDate;
      problem.endDate = range.endDate;
    }

    await problem.save();
    res.json({ success: true, problem });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete a weekly problem (Admin level 2+)
const deleteWeeklyProblem = async (req, res) => {
  try {
    const user = req.user;
    if (user.roleLevel < 2) {
      return res.status(403).json({ success: false, message: 'Forbidden: Admins only' });
    }

    const problem = await WeeklyProblem.findById(req.params.id);
    if (!problem) {
      return res.status(404).json({ success: false, message: 'Weekly problem not found' });
    }

    await WeeklyProblem.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Weekly problem deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Toggle completion status for current user
const toggleCompletion = async (req, res) => {
  try {
    const userId = req.user._id;
    const problem = await WeeklyProblem.findById(req.params.id);
    if (!problem) {
      return res.status(404).json({ success: false, message: 'Weekly problem not found' });
    }

    const index = problem.completions.findIndex(c => c.userId && c.userId.toString() === userId.toString());
    let isCompleted = false;

    if (index > -1) {
      problem.completions.splice(index, 1);
      isCompleted = false;
    } else {
      problem.completions.push({ userId, completedAt: new Date() });
      isCompleted = true;
    }

    await problem.save();
    res.json({
      success: true,
      isCompleted,
      completedCount: problem.completions.length,
      message: isCompleted ? 'Marked problem as completed!' : 'Marked problem as incomplete'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// List available weeks with assigned problems
const getAvailableWeeks = async (req, res) => {
  try {
    const weeks = await WeeklyProblem.aggregate([
      {
        $group: {
          _id: { weekNumber: '$weekNumber', year: '$year' },
          count: { $sum: 1 },
          startDate: { $first: '$startDate' },
          endDate: { $first: '$endDate' }
        }
      },
      { $sort: { '_id.year': -1, '_id.weekNumber': -1 } }
    ]);

    const currentWeek = getISOWeekDetails();

    const formatted = weeks.map(w => ({
      weekNumber: w._id.weekNumber,
      year: w._id.year,
      count: w.count,
      startDate: w.startDate,
      endDate: w.endDate,
      isCurrent: w._id.weekNumber === currentWeek.weekNumber && w._id.year === currentWeek.year
    }));

    // Ensure current week is in list even if 0 problems yet
    const currentInList = formatted.some(w => w.isCurrent);
    if (!currentInList) {
      const range = getWeekDateRange(currentWeek.weekNumber, currentWeek.year);
      formatted.unshift({
        weekNumber: currentWeek.weekNumber,
        year: currentWeek.year,
        count: 0,
        startDate: range.startDate,
        endDate: range.endDate,
        isCurrent: true
      });
    }

    res.json({ success: true, weeks: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getWeeklyProblems,
  createWeeklyProblem,
  updateWeeklyProblem,
  deleteWeeklyProblem,
  toggleCompletion,
  getAvailableWeeks,
  fetchProblemDetailsFromUrl
};
