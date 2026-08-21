const User = require('../models/User');
const Section = require('../models/Section');
const Goal = require('../models/Goal');
const LeetCodeStat = require('../models/LeetCodeStat');

exports.getFacultyOverview = async (req, res) => {
  try {
    const facultyId = req.user._id;

    // Find sections assigned to this faculty member
    const sections = await Section.find({
      institutionId: req.user.institutionId,
      facultyId
    }).populate('batchId', 'name');

    const sectionIds = sections.map(s => s._id);

    // Get students in these assigned sections
    const students = await User.find({
      institutionId: req.user.institutionId,
      sectionId: { $in: sectionIds },
      role: { $in: ['student', 'user'] }
    }).populate('sectionId', 'name').populate('batchId', 'name').select('-passwordHash').lean();

    const studentIds = students.map(s => s._id);
    const statsList = await LeetCodeStat.find({ userId: { $in: studentIds } }).lean();
    const statsMap = new Map(statsList.map(st => [st.userId.toString(), st]));

    // Calculate metrics
    let totalSolvedCount = 0;
    let activeStudentsCount = 0;
    let atRiskCount = 0;

    const enrichedStudents = students.map(s => {
      const st = statsMap.get(s._id.toString());
      if (st) {
        totalSolvedCount += st.totalSolved || 0;
        if (st.currentStreak > 0 || st.totalSolved > 0) activeStudentsCount++;
      }
      const isAtRisk = !s.leetcodeUsername || !st || st.totalSolved === 0 || st.currentStreak === 0;
      if (isAtRisk) atRiskCount++;

      return {
        ...s,
        isAtRisk,
        stats: st || null
      };
    });

    const averageSolved = students.length > 0 ? Math.round(totalSolvedCount / students.length) : 0;

    res.json({
      success: true,
      data: {
        sections,
        totalStudents: students.length,
        activeStudents: activeStudentsCount,
        atRiskStudents: atRiskCount,
        averageSolved,
        students: enrichedStudents
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.assignGoalToScope = async (req, res) => {
  try {
    const { title, targetSolved, period, endDate, targetType, sectionId, batchId, departmentId, studentId } = req.body;

    const goalData = {
      title,
      targetSolved: Number(targetSolved),
      period: period || 'weekly',
      endDate: new Date(endDate),
      targetType: targetType || 'section',
      institutionId: req.user.institutionId,
      createdBy: req.user._id
    };

    if (targetType === 'student' && studentId) goalData.userId = studentId;
    if (targetType === 'section' && sectionId) goalData.sectionId = sectionId;
    if (targetType === 'batch' && batchId) goalData.batchId = batchId;
    if (targetType === 'department' && departmentId) goalData.departmentId = departmentId;

    const goal = await Goal.create(goalData);
    res.status(201).json({ success: true, message: 'Goal assigned successfully', data: goal });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
