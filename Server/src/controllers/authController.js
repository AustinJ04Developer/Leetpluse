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
    const { name, email, password, leetcodeUsername } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email is already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Get default org if exists
    const defaultOrg = await Organization.findOne();

    const newUser = await User.create({
      name,
      email,
      passwordHash,
      role: 'user',
      roleLevel: 1,
      orgId: defaultOrg ? defaultOrg._id : null,
      leetcodeUsername: leetcodeUsername || null
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
        leetcodeUsername: newUser.leetcodeUsername,
        avatar: newUser.avatar
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
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
        orgId: user.orgId,
        groupId: user.groupId,
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
    const user = req.user; // Set by auth middleware (handles impersonation)
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
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        roleLevel: user.roleLevel,
        orgId: user.orgId,
        groupId: user.groupId,
        leetcodeUsername: user.leetcodeUsername,
        avatar: user.avatar,
        bio: user.bio,
        mfaEnabled: user.mfaEnabled,
        xp: user.xp,
        level: user.level,
        lastSyncAt: user.lastSyncAt,
        syncStatus: user.syncStatus
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

    const user = await User.findOne({ email });
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

module.exports = { register, login, getMe, getSessions, revokeSession, forgotPassword, resetPassword };
