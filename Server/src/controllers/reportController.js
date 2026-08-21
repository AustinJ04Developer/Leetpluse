const User = require('../models/User');
const LeetCodeStat = require('../models/LeetCodeStat');

exports.exportStudentReportCSV = async (req, res) => {
  try {
    const { departmentId, batchId, sectionId } = req.query;
    const filter = { ...req.tenantFilter, role: { $in: ['student', 'user'] } };

    if (departmentId) filter.departmentId = departmentId;
    if (batchId) filter.batchId = batchId;
    if (sectionId) filter.sectionId = sectionId;

    const students = await User.find(filter)
      .populate('departmentId', 'code name')
      .populate('batchId', 'name')
      .populate('sectionId', 'name')
      .lean();

    const studentIds = students.map(s => s._id);
    const statsList = await LeetCodeStat.find({ userId: { $in: studentIds } }).lean();
    const statsMap = new Map(statsList.map(st => [st.userId.toString(), st]));

    // Generate CSV String
    let csv = 'Register Number,Student Name,Email,Department,Batch,Section,LeetCode Handle,Total Solved,Easy,Medium,Hard,Streak,Global Rank,Last Synced\n';

    students.forEach(s => {
      const st = statsMap.get(s._id.toString());
      const reg = s.registerNumber || 'N/A';
      const name = `"${s.name}"`;
      const email = s.email;
      const dept = s.departmentId?.code || 'N/A';
      const batch = s.batchId?.name || 'N/A';
      const sec = s.sectionId?.name || 'N/A';
      const handle = s.leetcodeUsername || 'Not Linked';
      const total = st?.totalSolved || 0;
      const easy = st?.easySolved || 0;
      const med = st?.mediumSolved || 0;
      const hard = st?.hardSolved || 0;
      const streak = st?.currentStreak || 0;
      const rank = st?.globalRanking || 'N/A';
      const lastSync = st?.lastSyncedAt ? new Date(st.lastSyncedAt).toISOString().split('T')[0] : 'N/A';

      csv += `${reg},${name},${email},${dept},${batch},${sec},${handle},${total},${easy},${med},${hard},${streak},${rank},${lastSync}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=student_performance_report_${Date.now()}.csv`);
    return res.status(200).send(csv);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
