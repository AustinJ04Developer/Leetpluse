const User = require('../models/User');
const LeetCodeStat = require('../models/LeetCodeStat');
const AuditLog = require('../models/AuditLog');
const bcrypt = require('bcryptjs');

const updateProfile = async (req, res) => {
  try {
    const { 
      name, 
      leetcodeUsername, 
      bio, 
      avatar, 
      mfaEnabled,
      departmentId,
      departmentCustom,
      batchId,
      batchCustom,
      sectionId,
      sectionCustom,
      academicYearId,
      academicYearCustom,
      registerNumber,
      studentId,
      semester,
      yearLevel,
      academicBatch,
      academicStatus,
      academicCohorts,
      cohortCustom,
      phone,
      designation,
      specialization,
      officeLocation,
      githubUrl,
      linkedinUrl,
      website,
      institutionId
    } = req.body;
    
    const user = await User.findById(req.user._id);

    if (name) user.name = name.trim();
    
    if (leetcodeUsername !== undefined) {
      user.leetcodeUsername = leetcodeUsername ? leetcodeUsername.trim() : null;
    }

    if (bio !== undefined) user.bio = bio;
    if (avatar !== undefined) user.avatar = avatar;
    if (mfaEnabled !== undefined) user.mfaEnabled = mfaEnabled;

    if (institutionId !== undefined) user.institutionId = institutionId || user.institutionId;
    const targetInstId = user.institutionId;

    const Department = require('../models/Department');
    const AcademicYear = require('../models/AcademicYear');
    const Batch = require('../models/Batch');
    const Section = require('../models/Section');

    if (departmentCustom && departmentCustom.trim() !== '') {
      const cleanName = departmentCustom.trim();
      let dept = await Department.findOne({
        institutionId: targetInstId,
        name: { $regex: new RegExp(`^${cleanName.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}$`, 'i') }
      });
      if (!dept && targetInstId) {
        let code = cleanName.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 6) || 'DEPT';
        const codeExists = await Department.findOne({ institutionId: targetInstId, code });
        if (codeExists) {
          code = `${code}_${Date.now().toString().slice(-4)}`;
        }
        dept = await Department.create({ institutionId: targetInstId, name: cleanName, code });
      }
      if (dept) user.departmentId = dept._id;
    } else if (departmentId !== undefined) {
      user.departmentId = departmentId || null;
    }

    if (academicYearCustom && academicYearCustom.trim() !== '') {
      const cleanYear = academicYearCustom.trim();
      let year = await AcademicYear.findOne({
        institutionId: targetInstId,
        yearLabel: { $regex: new RegExp(`^${cleanYear.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}$`, 'i') }
      });
      if (!year && targetInstId) {
        year = await AcademicYear.create({ institutionId: targetInstId, yearLabel: cleanYear, displayName: cleanYear });
      }
      if (year) user.academicYearId = year._id;
    } else if (academicYearId !== undefined) {
      user.academicYearId = academicYearId || null;
    }

    if (batchCustom && batchCustom.trim() !== '') {
      const cleanBatch = batchCustom.trim();
      let batch = await Batch.findOne({
        institutionId: targetInstId,
        name: { $regex: new RegExp(`^${cleanBatch.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}$`, 'i') }
      });
      if (!batch && targetInstId) {
        batch = await Batch.create({
          institutionId: targetInstId,
          departmentId: user.departmentId || null,
          academicYearId: user.academicYearId || null,
          name: cleanBatch,
          cohortRange: cleanBatch
        });
      }
      if (batch) {
        user.batchId = batch._id;
        user.academicBatch = cleanBatch;
      }
    } else if (batchId !== undefined) {
      user.batchId = batchId || null;
    }

    if (sectionCustom && sectionCustom.trim() !== '') {
      const cleanSec = sectionCustom.trim();
      let sec = await Section.findOne({
        institutionId: targetInstId,
        name: { $regex: new RegExp(`^${cleanSec.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}$`, 'i') }
      });
      if (!sec && targetInstId) {
        sec = await Section.create({ institutionId: targetInstId, batchId: user.batchId || null, name: cleanSec });
      }
      if (sec) user.sectionId = sec._id;
    } else if (sectionId !== undefined) {
      user.sectionId = sectionId || null;
    }

    if (registerNumber !== undefined) user.registerNumber = registerNumber;
    if (studentId !== undefined) user.studentId = studentId;

    if (semester !== undefined) {
      const semNum = Math.min(Math.max(Number(semester) || 1, 1), 8);
      user.semester = semNum;
      user.yearLevel = Math.ceil(semNum / 2);
    } else if (yearLevel !== undefined) {
      const yrNum = Math.min(Math.max(Number(yearLevel) || 1, 1), 4);
      user.yearLevel = yrNum;
      const minSem = (yrNum * 2) - 1;
      const maxSem = yrNum * 2;
      if (user.semester < minSem || user.semester > maxSem) {
        user.semester = minSem;
      }
    }

    if (academicStatus !== undefined) user.academicStatus = academicStatus;
    if (academicBatch !== undefined) user.academicBatch = academicBatch;

    if (academicCohorts !== undefined) {
      if (Array.isArray(academicCohorts)) {
        user.academicCohorts = academicCohorts.map(c => String(c).trim()).filter(Boolean);
      }
    } else if (cohortCustom !== undefined) {
      user.academicCohorts = String(cohortCustom).split(',').map(c => c.trim()).filter(Boolean);
    }

    if (phone !== undefined) user.phone = phone;

    if (designation !== undefined) user.designation = designation;
    if (specialization !== undefined) user.specialization = specialization;
    if (officeLocation !== undefined) user.officeLocation = officeLocation;
    if (githubUrl !== undefined) user.githubUrl = githubUrl;
    if (linkedinUrl !== undefined) user.linkedinUrl = linkedinUrl;
    if (website !== undefined) user.website = website;

    await user.save();

    const populatedUser = await User.findById(user._id)
      .populate('institutionId', 'name code logoUrl primaryColor')
      .populate('departmentId', 'name code')
      .populate('batchId', 'name')
      .populate('sectionId', 'name')
      .populate('academicYearId', 'yearLabel displayName');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: populatedUser._id,
        name: populatedUser.name,
        email: populatedUser.email,
        role: populatedUser.role,
        roleLevel: populatedUser.roleLevel,
        institutionId: populatedUser.institutionId,
        departmentId: populatedUser.departmentId,
        batchId: populatedUser.batchId,
        sectionId: populatedUser.sectionId,
        academicYearId: populatedUser.academicYearId,
        registerNumber: populatedUser.registerNumber,
        studentId: populatedUser.studentId,
        semester: populatedUser.semester,
        yearLevel: populatedUser.yearLevel,
        academicBatch: populatedUser.academicBatch,
        academicStatus: populatedUser.academicStatus || 'Pursuing',
        academicCohorts: populatedUser.academicCohorts || [],
        phone: populatedUser.phone,
        designation: populatedUser.designation,
        specialization: populatedUser.specialization,
        officeLocation: populatedUser.officeLocation,
        githubUrl: populatedUser.githubUrl,
        linkedinUrl: populatedUser.linkedinUrl,
        website: populatedUser.website,
        leetcodeUsername: populatedUser.leetcodeUsername,
        avatar: populatedUser.avatar,
        bio: populatedUser.bio,
        mfaEnabled: populatedUser.mfaEnabled,
        xp: populatedUser.xp,
        level: populatedUser.level
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


const getAllUsers = async (req, res) => {
  try {
    const requester = req.user;
    let query = {};

    // Admin (L2) can only list users in their assigned batch
    if (requester.roleLevel === 2) {
      query = { groupId: requester.groupId };
    }

    const users = await User.find(query)
      .select('-passwordHash')
      .populate('institutionId', 'name code logoUrl primaryColor')
      .populate('departmentId', 'name code')
      .populate('batchId', 'name')
      .populate('sectionId', 'name');

    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getAccessibleUsers = async (req, res) => {
  try {
    const requester = req.user;
    let query = { role: { $ne: 'superadmin' } }; // Exclude SuperAdmin management role

    if (requester.roleLevel === 1) { // Regular User: cohort peers
      if (requester.groupId) {
        query.groupId = requester.groupId;
      } else {
        query._id = requester._id;
      }
    } else if (requester.roleLevel === 2) { // Admin: assigned batch
      if (requester.groupId) {
        query.groupId = requester.groupId;
      }
    } else if (requester.roleLevel >= 3 && req.query.groupId && req.query.groupId !== 'all') {
      query.groupId = req.query.groupId;
    }

    const users = await User.find(query)
      .select('name email avatar role leetcodeUsername xp level institutionId departmentId batchId sectionId')
      .populate('institutionId', 'name code logoUrl primaryColor')
      .populate('departmentId', 'name code')
      .populate('batchId', 'name')
      .populate('sectionId', 'name');

    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    const roleLevels = { 
      superadmin: 6, 
      institution_admin: 5, 
      hod: 4, 
      faculty: 3, 
      student_rep: 2, 
      student: 1, 
      devadmin: 6, 
      admin: 2, 
      user: 1 
    };

    if (!roleLevels[role]) {
      return res.status(400).json({ success: false, message: 'Invalid role specified' });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const updateData = { role, roleLevel: roleLevels[role] };
    if (req.body.groupId) {
      updateData.groupId = req.body.groupId;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select('-passwordHash');

    await AuditLog.create({
      actorId: req.user._id,
      actorEmail: req.user.email,
      action: 'USER_ROLE_UPDATED',
      targetId: userId,
      metadata: { newRole: role }
    });

    res.json({ success: true, user: updatedUser });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


const bulkImportUsers = async (req, res) => {
  try {
    const { users } = req.body;
    if (!users || !Array.isArray(users)) {
      return res.status(400).json({ success: false, message: 'Invalid users array' });
    }

    const createdUsers = [];
    const salt = await bcrypt.genSalt(10);
    const defaultPassHash = await bcrypt.hash('Password123!', salt);

    for (const u of users) {
      if (!u.email) continue;
      const exists = await User.findOne({ email: u.email });
      if (exists) continue;

      const newUser = await User.create({
        name: u.name || u.email.split('@')[0],
        email: u.email,
        passwordHash: defaultPassHash,
        leetcodeUsername: u.leetcodeUsername || '',
        role: 'user',
        roleLevel: 1,
        orgId: req.user.orgId,
        groupId: req.user.groupId
      });
      createdUsers.push(newUser);
    }

    res.status(201).json({ success: true, message: `Successfully imported ${createdUsers.length} users.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { updateProfile, getAllUsers, getAccessibleUsers, updateUserRole, bulkImportUsers };

