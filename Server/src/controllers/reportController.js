const User = require('../models/User');
const LeetCodeStat = require('../models/LeetCodeStat');

const escapeCSV = (val) => {
  if (val === null || val === undefined) return '""';
  let str = String(val);
  if (/^[=+\-@]/.test(str)) {
    str = "'" + str;
  }
  str = str.replace(/"/g, '""');
  return `"${str}"`;
};

exports.exportStudentReportCSV = async (req, res) => {
  try {
    const { departmentId, batchId, sectionId } = req.query;
    const filter = { ...req.tenantFilter, role: { $in: ['student', 'student_rep', 'user'] } };

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

    // Include UTF-8 BOM (\uFEFF) for Excel compatibility
    let csv = '\uFEFF';
    csv += 'Register Number,Student ID,Student Name,Email,Department,Batch,Section,Year Level,Semester,LeetCode Handle,Total Solved,Easy,Medium,Hard,Acceptance Rate (%),Streak,Contest Rating,Global Rank,Last Synced\n';

    students.forEach(s => {
      const st = statsMap.get(s._id.toString());
      const reg = escapeCSV(s.registerNumber || 'N/A');
      const studentId = escapeCSV(s.studentId || 'N/A');
      const name = escapeCSV(s.name || '');
      const email = escapeCSV(s.email || '');
      const dept = escapeCSV(s.departmentId?.code || 'N/A');
      const batch = escapeCSV(s.batchId?.name || 'N/A');
      const sec = escapeCSV(s.sectionId?.name || 'N/A');
      const year = escapeCSV(s.yearLevel ? `${s.yearLevel} Yr` : 'N/A');
      const sem = escapeCSV(s.semester ? `Sem ${s.semester}` : 'N/A');
      const handle = escapeCSV(s.leetcodeUsername || 'Not Linked');
      const total = st?.totalSolved || 0;
      const easy = st?.easySolved || 0;
      const med = st?.mediumSolved || 0;
      const hard = st?.hardSolved || 0;
      const accRate = st?.acceptanceRate != null ? `${st.acceptanceRate.toFixed(1)}%` : '0%';
      const streak = st?.currentStreak || 0;
      const rating = st?.contestRating ? Math.round(st.contestRating) : 'N/A';
      const rank = st?.globalRanking ? st.globalRanking : 'N/A';
      const lastSync = st?.lastSyncedAt ? new Date(st.lastSyncedAt).toISOString().split('T')[0] : 'N/A';

      csv += `${reg},${studentId},${name},${email},${dept},${batch},${sec},${year},${sem},${handle},${total},${easy},${med},${hard},${escapeCSV(accRate)},${streak},${escapeCSV(rating)},${escapeCSV(rank)},${escapeCSV(lastSync)}\n`;
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=student_performance_report_${Date.now()}.csv`);
    return res.status(200).send(csv);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

