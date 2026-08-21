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
      batchId,
      sectionId,
      academicYearId,
      registerNumber,
      studentId,
      semester,
      phone
    } = req.body;
    
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    
    if (leetcodeUsername !== undefined) {
      user.leetcodeUsername = leetcodeUsername ? leetcodeUsername.trim() : null;
    }

    if (bio !== undefined) user.bio = bio;
    if (avatar !== undefined) user.avatar = avatar;
    if (mfaEnabled !== undefined) user.mfaEnabled = mfaEnabled;

    if (departmentId !== undefined) user.departmentId = departmentId || null;
    if (batchId !== undefined) user.batchId = batchId || null;
    if (sectionId !== undefined) user.sectionId = sectionId || null;
    if (academicYearId !== undefined) user.academicYearId = academicYearId || null;
    if (registerNumber !== undefined) user.registerNumber = registerNumber;
    if (studentId !== undefined) user.studentId = studentId;
    if (semester !== undefined) user.semester = Number(semester) || 1;
    if (phone !== undefined) user.phone = phone;

    await user.save();

    const populatedUser = await User.findById(user._id)
      .populate('departmentId', 'name code')
      .populate('batchId', 'name')
      .populate('sectionId', 'name')
      .populate('academicYearId', 'yearLabel');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: populatedUser._id,
        name: populatedUser.name,
        email: populatedUser.email,
        role: populatedUser.role,
        roleLevel: populatedUser.roleLevel,
        departmentId: populatedUser.departmentId,
        batchId: populatedUser.batchId,
        sectionId: populatedUser.sectionId,
        academicYearId: populatedUser.academicYearId,
        registerNumber: populatedUser.registerNumber,
        studentId: populatedUser.studentId,
        semester: populatedUser.semester,
        phone: populatedUser.phone,
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

    const users = await User.find(query).select('-passwordHash').populate('groupId', 'name');
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
      .select('name email avatar role leetcodeUsername xp level groupId')
      .populate('groupId', 'name');

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

