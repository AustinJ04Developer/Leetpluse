const User = require('../models/User');
const LeetCodeStat = require('../models/LeetCodeStat');
const Institution = require('../models/Institution');
const { syncUserLeetCode } = require('../services/leetcodeService');

// Get all students with tenant isolation & multi-level filters
exports.getStudents = async (req, res) => {
  try {
    const { departmentId, batchId, sectionId, semester, search, page = 1, limit = 50 } = req.query;

    const filter = {
      ...req.tenantFilter,
      role: { $in: ['student', 'user'] }
    };

    if (departmentId) filter.departmentId = departmentId;
    if (batchId) filter.batchId = batchId;
    if (sectionId) filter.sectionId = sectionId;
    if (semester) filter.semester = Number(semester);

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { registerNumber: { $regex: search, $options: 'i' } },
        { leetcodeUsername: { $regex: search, $options: 'i' } }
      ];
    }

    const totalStudents = await User.countDocuments(filter);
    const students = await User.find(filter)
      .populate('institutionId', 'name code logoUrl primaryColor')
      .populate('departmentId', 'name code')
      .populate('batchId', 'name')
      .populate('sectionId', 'name')
      .select('-passwordHash')
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Fetch LeetCode stats for each student
    const studentIds = students.map(s => s._id);
    const statsList = await LeetCodeStat.find({ userId: { $in: studentIds } });
    const statsMap = new Map(statsList.map(st => [st.userId.toString(), st]));

    const enrichedStudents = students.map(s => {
      const st = statsMap.get(s._id.toString());
      return {
        ...s.toObject(),
        stats: st ? {
          totalSolved: st.totalSolved,
          easySolved: st.easySolved,
          mediumSolved: st.mediumSolved,
          hardSolved: st.hardSolved,
          currentStreak: st.currentStreak,
          contestRating: st.contestRating,
          globalRanking: st.globalRanking,
          lastSyncedAt: st.lastSyncedAt
        } : null
      };
    });

    res.json({
      success: true,
      count: totalStudents,
      page: Number(page),
      pages: Math.ceil(totalStudents / limit),
      data: enrichedStudents
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Calculate Hierarchical Rankings (Section, Batch, Department, Institution)
exports.getHierarchicalRankings = async (req, res) => {
  try {
    const { departmentId, batchId, sectionId } = req.query;
    const filter = { ...req.tenantFilter, role: { $in: ['student', 'user'] } };

    if (departmentId) filter.departmentId = departmentId;
    if (batchId) filter.batchId = batchId;
    if (sectionId) filter.sectionId = sectionId;

    const students = await User.find(filter)
      .populate('institutionId', 'name code logoUrl primaryColor')
      .populate('departmentId', 'code name')
      .populate('batchId', 'name')
      .populate('sectionId', 'name')
      .select('_id name email avatar leetcodeUsername institutionId departmentId batchId sectionId registerNumber')
      .lean();

    const studentIds = students.map(s => s._id);
    const statsList = await LeetCodeStat.find({ userId: { $in: studentIds } }).lean();
    const statsMap = new Map(statsList.map(st => [st.userId.toString(), st]));

    // Join student info with LeetCode solved counts
    const rankedList = students.map(s => {
      const st = statsMap.get(s._id.toString());
      const totalSolved = st?.totalSolved || 0;
      const contestRating = st?.contestRating || 1500;
      const weightedScore = (st?.easySolved || 0) * 1 + (st?.mediumSolved || 0) * 2 + (st?.hardSolved || 0) * 4;

      return {
        ...s,
        totalSolved,
        contestRating,
        weightedScore,
        currentStreak: st?.currentStreak || 0,
        lastSyncedAt: st?.lastSyncedAt || null
      };
    });

    // Sort by weighted score & total solved
    rankedList.sort((a, b) => b.weightedScore - a.weightedScore || b.totalSolved - a.totalSolved);

    // Compute ranks
    const finalRankings = rankedList.map((item, index) => ({
      rank: index + 1,
      ...item
    }));

    res.json({ success: true, count: finalRankings.length, data: finalRankings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// At-Risk Student Detection Endpoint
exports.getAtRiskStudents = async (req, res) => {
  try {
    const instId = req.user.institutionId;
    let thresholdDays = 7;
    if (instId) {
      const inst = await Institution.findById(instId);
      if (inst?.settings?.inactivityThresholdDays) {
        thresholdDays = inst.settings.inactivityThresholdDays;
      }
    }

    const cutoffDate = new Date(Date.now() - thresholdDays * 24 * 60 * 60 * 1000);

    const filter = {
      ...req.tenantFilter,
      role: { $in: ['student', 'user'] },
      isActive: true,
      $or: [
        { lastActive: { $lt: cutoffDate } },
        { lastSyncAt: { $lt: cutoffDate } },
        { leetcodeUsername: { $in: [null, ''] } }
      ]
    };

    const atRiskStudents = await User.find(filter)
      .populate('institutionId', 'name code logoUrl primaryColor')
      .populate('departmentId', 'name code')
      .populate('batchId', 'name')
      .populate('sectionId', 'name')
      .select('-passwordHash')
      .lean();

    const studentIds = atRiskStudents.map(s => s._id);
    const statsList = await LeetCodeStat.find({ userId: { $in: studentIds } }).lean();
    const statsMap = new Map(statsList.map(st => [st.userId.toString(), st]));

    const enrichedAtRisk = atRiskStudents.map(s => {
      const st = statsMap.get(s._id.toString());
      let riskReason = 'Inactive on Platform';
      if (!s.leetcodeUsername) riskReason = 'No LeetCode Handle Linked';
      else if (!st || st.totalSolved === 0) riskReason = 'Zero Solved Problems';
      else if (st.currentStreak === 0) riskReason = 'Streak Broken / Inactive';

      return {
        ...s,
        riskReason,
        stats: st || null
      };
    });

    res.json({ success: true, thresholdDays, count: enrichedAtRisk.length, data: enrichedAtRisk });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Sync single student LeetCode account manually
exports.syncStudentStats = async (req, res) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    if (req.user.roleLevel < 5 && student.institutionId?.toString() !== req.user.institutionId?.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const result = await syncUserLeetCode(student);
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    res.json({ success: true, message: `Successfully synchronized ${student.name}'s LeetCode statistics`, data: result.stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update Student Information & Role Upgrades
exports.updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, registerNumber, studentId, departmentId, batchId, sectionId, leetcodeUsername, role, academicBatch, yearLevel } = req.body;

    const student = await User.findById(id);
    if (!student) return res.status(404).json({ success: false, message: 'User not found' });

    if (req.user.roleLevel < 5 && student.institutionId?.toString() !== req.user.institutionId?.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden: Cannot manage user from another institution' });
    }

    if (name) student.name = name;
    if (email) student.email = email.toLowerCase().trim();
    if (registerNumber !== undefined) student.registerNumber = registerNumber;
    if (studentId !== undefined) student.studentId = studentId;
    if (departmentId !== undefined) student.departmentId = departmentId || null;
    if (batchId !== undefined) student.batchId = batchId || null;
    if (sectionId !== undefined) student.sectionId = sectionId || null;
    if (academicBatch !== undefined) student.academicBatch = academicBatch || '';
    if (req.body.academicStatus !== undefined) student.academicStatus = req.body.academicStatus;
    if (req.body.academicCohorts !== undefined) {
      if (Array.isArray(req.body.academicCohorts)) {
        student.academicCohorts = req.body.academicCohorts.map(c => String(c).trim()).filter(Boolean);
      }
    } else if (req.body.cohortCustom !== undefined) {
      student.academicCohorts = String(req.body.cohortCustom).split(',').map(c => c.trim()).filter(Boolean);
    }
    
    if (req.body.semester !== undefined) {
      const semNum = Math.min(Math.max(Number(req.body.semester) || 1, 1), 8);
      student.semester = semNum;
      student.yearLevel = Math.ceil(semNum / 2);
    } else if (yearLevel !== undefined) {
      const yrNum = Math.min(Math.max(Number(yearLevel) || 1, 1), 4);
      student.yearLevel = yrNum;
      const minSem = (yrNum * 2) - 1;
      const maxSem = yrNum * 2;
      if (student.semester < minSem || student.semester > maxSem) {
        student.semester = minSem;
      }
    }

    if (leetcodeUsername !== undefined) student.leetcodeUsername = leetcodeUsername ? leetcodeUsername.trim() : null;

    // --- ROLE UPGRADE LOGIC ---
    if (role && req.user.roleLevel >= 3) {
      if (req.user.roleLevel >= 5) {
        // Institution Admin & SuperAdmin can upgrade to HOD, Faculty, Student Rep, or Student
        const roleLevels = { student: 1, student_rep: 2, faculty: 3, hod: 4, institution_admin: 5 };
        if (roleLevels[role]) {
          student.role = role;
          student.roleLevel = roleLevels[role];
        }
      } else if (req.user.roleLevel === 4) {
        // HOD can ONLY assign Faculty, Student Rep, or Student
        const allowedForHod = { student: 1, student_rep: 2, faculty: 3 };
        if (allowedForHod[role]) {
          student.role = role;
          student.roleLevel = allowedForHod[role];
        } else {
          return res.status(403).json({ success: false, message: 'Forbidden: HOD can only upgrade users to Faculty, Student Rep, or Student.' });
        }
      } else if (req.user.roleLevel === 3) {
        // Faculty can ONLY assign Student Rep or Student
        const allowedForFaculty = { student: 1, student_rep: 2 };
        if (allowedForFaculty[role]) {
          student.role = role;
          student.roleLevel = allowedForFaculty[role];
        } else {
          return res.status(403).json({ success: false, message: 'Forbidden: Faculty can only upgrade users to Student Rep or Student.' });
        }
      }
    }

    await student.save();

    // If assigned HOD or Faculty role, link to Department or Section
    if (student.role === 'hod' && student.departmentId) {
      const Department = require('../models/Department');
      await Department.findByIdAndUpdate(student.departmentId, { hodId: student._id });
    } else if (student.role === 'faculty' && student.sectionId) {
      const Section = require('../models/Section');
      await Section.findByIdAndUpdate(student.sectionId, { facultyId: student._id });
    }

    const updatedStudent = await User.findById(id)
      .populate('institutionId', 'name code logoUrl primaryColor')
      .populate('departmentId', 'name code')
      .populate('batchId', 'name')
      .populate('sectionId', 'name')
      .select('-passwordHash');

    res.json({ success: true, message: 'User details and role updated successfully', data: updatedStudent });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};


// Delete Student Account
exports.deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await User.findById(id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    if (req.user.roleLevel < 5 && student.institutionId?.toString() !== req.user.institutionId?.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    await User.findByIdAndDelete(id);
    await LeetCodeStat.deleteMany({ userId: id });

    res.json({ success: true, message: 'Student account deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

