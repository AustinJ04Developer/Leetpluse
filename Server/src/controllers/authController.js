const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');
const AuditLog = require('../models/AuditLog');
const Organization = require('../models/Organization');

const JWT_SECRET = process.env.JWT_SECRET || 'leetcode_super_secret_jwt_key_2026_antigravity';

const generateTokens = (user) => {
  const token = jwt.sign(
    { id: user._id, role: user.role, level: user.roleLevel },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  return { token };
};

const register = async (req, res) => {
  try {
    const { name, email, password, leetcodeUsername, institutionId, departmentId, batchId, sectionId, registerNumber, studentId } = req.body;

    const normalizedEmail = email ? email.toLowerCase().trim() : '';

    let existingUser = await User.findOne({ email: normalizedEmail });
    if (!existingUser && normalizedEmail) {
      existingUser = await User.findOne({ email: { $regex: new RegExp(`^${normalizedEmail.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}$`, 'i') } });
    }

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email is already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const Institution = require('../models/Institution');
    let targetInstId = institutionId;
    if (!targetInstId) {
      const defaultInst = await Institution.findOne();
      if (defaultInst) targetInstId = defaultInst._id;
    }

    const newUser = await User.create({
      name: name ? name.trim() : '',
      email: normalizedEmail,
      passwordHash,
      role: 'student',
      roleLevel: 1,
      institutionId: targetInstId || null,
      departmentId: departmentId || null,
      batchId: batchId || null,
      sectionId: sectionId || null,
      registerNumber: registerNumber || '',
      studentId: studentId || '',
      leetcodeUsername: leetcodeUsername ? leetcodeUsername.trim() : null
    });

    const { token } = generateTokens(newUser);

    await Session.create({
      userId: newUser._id,
      token,
      device: req.headers['user-agent'] || 'Browser'
    });

    await AuditLog.create({
      actorId: newUser._id,
      actorEmail: newUser.email,
      action: 'USER_REGISTERED'
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        roleLevel: newUser.roleLevel,
        institutionId: newUser.institutionId,
        departmentId: newUser.departmentId,
        batchId: newUser.batchId,
        sectionId: newUser.sectionId,
        leetcodeUsername: newUser.leetcodeUsername,
        avatar: newUser.avatar
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const registerInstitution = async (req, res) => {
  try {
    const { institutionName, code, adminName, adminEmail, password, website, city, phone } = req.body;

    if (!institutionName || !adminEmail || !password) {
      return res.status(400).json({ success: false, message: 'Institution Name, Admin Email, and Password are required.' });
    }

    const normalizedEmail = adminEmail.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Admin email is already registered.' });
    }

    const Institution = require('../models/Institution');
    const slug = institutionName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const instCode = code ? code.toUpperCase().trim() : institutionName.substring(0, 4).toUpperCase();

    const institution = await Institution.create({
      name: institutionName.trim(),
      slug,
      code: instCode,
      contactEmail: normalizedEmail,
      website: website || '',
      city: city || ''
    });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const adminUser = await User.create({
      name: adminName ? adminName.trim() : 'Institution Administrator',
      email: normalizedEmail,
      passwordHash,
      role: 'institution_admin',
      roleLevel: 5,
      institutionId: institution._id,
      phone: phone || ''
    });

    const { token } = generateTokens(adminUser);

    await Session.create({
      userId: adminUser._id,
      token,
      device: req.headers['user-agent'] || 'Browser'
    });

    await AuditLog.create({
      actorId: adminUser._id,
      actorEmail: adminUser.email,
      action: 'INSTITUTION_REGISTERED',
      metadata: { institutionId: institution._id }
    });

    res.status(201).json({
      success: true,
      message: 'Institution and Administrator account registered successfully',
      token,
      user: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        roleLevel: adminUser.roleLevel,
        institutionId: institution
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const registerStaff = async (req, res) => {
  try {
    const { name, email, password, targetRole, institutionId, departmentId, sectionId, staffPasscode } = req.body;

    if (!name || !email || !password || !targetRole || !institutionId || !staffPasscode) {
      return res.status(400).json({ success: false, message: 'Name, Email, Password, Target Role, Institution, and Staff Security Passcode are required.' });
    }

    const Institution = require('../models/Institution');
    const Department = require('../models/Department');
    const Section = require('../models/Section');

    const institution = await Institution.findById(institutionId);
    if (!institution) {
      return res.status(404).json({ success: false, message: 'Institution not found.' });
    }

    // Verify Staff Security Passcode
    const validPasscode = institution.staffPasscode || 'STAFF2026';
    if (staffPasscode.trim() !== validPasscode.trim()) {
      return res.status(400).json({ success: false, message: 'Invalid Institutional Staff Security Passcode. Contact your Institution Admin.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email address is already registered.' });
    }

    const roleMap = { hod: 4, faculty: 3 };
    const roleLevel = roleMap[targetRole] || 3;
    const finalRole = targetRole === 'hod' ? 'hod' : 'faculty';

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const staffUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: finalRole,
      roleLevel,
      institutionId: institution._id,
      departmentId: departmentId || null,
      sectionId: sectionId || null
    });

    // If registering as HOD, link to Department
    if (finalRole === 'hod' && departmentId) {
      await Department.findByIdAndUpdate(departmentId, { hodId: staffUser._id });
    }

    // If registering as Faculty, link to Section
    if (finalRole === 'faculty' && sectionId) {
      await Section.findByIdAndUpdate(sectionId, { facultyId: staffUser._id });
    }

    const { token } = generateTokens(staffUser);

    await Session.create({
      userId: staffUser._id,
      token,
      device: req.headers['user-agent'] || 'Browser'
    });

    await AuditLog.create({
      actorId: staffUser._id,
      actorEmail: staffUser.email,
      action: 'STAFF_REGISTERED',
      metadata: { role: finalRole, departmentId }
    });

    res.status(201).json({
      success: true,
      message: `${finalRole.toUpperCase()} account registered successfully`,
      token,
      user: {
        id: staffUser._id,
        name: staffUser.name,
        email: staffUser.email,
        role: staffUser.role,
        roleLevel: staffUser.roleLevel,
        institutionId: staffUser.institutionId,
        departmentId: staffUser.departmentId,
        sectionId: staffUser.sectionId
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};



const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email ? email.toLowerCase().trim() : '';

    let user = await User.findOne({ email: normalizedEmail })
      .populate('institutionId', 'name code logoUrl primaryColor')
      .populate('departmentId', 'name code')
      .populate('batchId', 'name')
      .populate('sectionId', 'name');

    if (!user && normalizedEmail) {
      user = await User.findOne({ email: { $regex: new RegExp(`^${normalizedEmail.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}$`, 'i') } })
        .populate('institutionId', 'name code logoUrl primaryColor')
        .populate('departmentId', 'name code')
        .populate('batchId', 'name')
        .populate('sectionId', 'name');
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }

    user.lastActive = new Date();
    await user.save();

    const { token } = generateTokens(user);

    await Session.create({
      userId: user._id,
      token,
      device: req.headers['user-agent'] || 'Browser'
    });

    await AuditLog.create({
      actorId: user._id,
      actorEmail: user.email,
      action: 'USER_LOGIN'
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        roleLevel: user.roleLevel,
        institutionId: user.institutionId,
        departmentId: user.departmentId,
        batchId: user.batchId,
        sectionId: user.sectionId,
        studentId: user.studentId,
        registerNumber: user.registerNumber,
        leetcodeUsername: user.leetcodeUsername,
        avatar: user.avatar,
        mfaEnabled: user.mfaEnabled,
        xp: user.xp,
        level: user.level
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getMe = async (req, res) => {
  try {
    const user = req.user; // Set by auth middleware
    const populatedUser = await User.findById(user._id)
      .populate('institutionId', 'name code logoUrl primaryColor')
      .populate('departmentId', 'name code')
      .populate('batchId', 'name')
      .populate('sectionId', 'name');

    res.json({
      success: true,
      isImpersonating: req.isImpersonating || false,
      realUser: req.realUser ? {
        id: req.realUser._id,
        name: req.realUser.name,
        email: req.realUser.email,
        role: req.realUser.role,
        roleLevel: req.realUser.roleLevel
      } : null,
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
        studentId: populatedUser.studentId,
        registerNumber: populatedUser.registerNumber,
        leetcodeUsername: populatedUser.leetcodeUsername,
        avatar: populatedUser.avatar,
        bio: populatedUser.bio,
        mfaEnabled: populatedUser.mfaEnabled,
        xp: populatedUser.xp,
        level: populatedUser.level,
        lastSyncAt: populatedUser.lastSyncAt,
        syncStatus: populatedUser.syncStatus
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getSessions = async (req, res) => {
  try {
    const Session = require('../models/Session');
    const sessions = await Session.find({ userId: req.user._id, isRevoked: false }).sort({ updatedAt: -1 });
    res.json({ success: true, sessions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const revokeSession = async (req, res) => {
  try {
    const Session = require('../models/Session');
    await Session.findByIdAndUpdate(req.params.id, { isRevoked: true });
    res.json({ success: true, message: 'Session revoked successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const crypto = require('crypto');

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    let user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      user = await User.findOne({ email: { $regex: new RegExp(`^${normalizedEmail.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}$`, 'i') } });
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email address' });
    }

    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes
    await user.save();

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

    await AuditLog.create({
      actorId: user._id,
      actorEmail: user.email,
      action: 'USER_PASSWORD_RESET_REQUESTED'
    });

    res.json({
      success: true,
      message: 'Password reset link generated successfully.',
      resetToken,
      resetUrl
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired password reset token' });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;
    await user.save();

    await AuditLog.create({
      actorId: user._id,
      actorEmail: user.email,
      action: 'USER_PASSWORD_RESET_SUCCESS'
    });

    res.json({ success: true, message: 'Password reset successfully. You can now sign in.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { register, registerInstitution, registerStaff, login, getMe, getSessions, revokeSession, forgotPassword, resetPassword };
