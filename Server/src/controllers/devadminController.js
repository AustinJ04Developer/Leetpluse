const FeatureFlag = require('../models/FeatureFlag');
const SystemLog = require('../models/SystemLog');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const LeetCodeStat = require('../models/LeetCodeStat');
const mongoose = require('mongoose');

const getSystemHealth = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const totalLogs = await SystemLog.countDocuments();
    const errorLogs = await SystemLog.countDocuments({ level: 'ERROR' });

    const uptimeSeconds = process.uptime();
    const memoryUsage = process.memoryUsage();

    res.json({
      success: true,
      health: {
        status: 'ONLINE',
        uptimeSeconds: Math.floor(uptimeSeconds),
        dbState: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
        memoryUsageMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        totalUsers,
        activeUsers,
        totalLogs,
        errorLogs,
        lastCheck: new Date()
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getFeatureFlags = async (req, res) => {
  try {
    const flags = await FeatureFlag.find();
    res.json({ success: true, flags });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const toggleFeatureFlag = async (req, res) => {
  try {
    const { key, enabled } = req.body;
    const flag = await FeatureFlag.findOneAndUpdate(
      { key },
      { enabled, updatedBy: req.user.email },
      { new: true, upsert: true }
    );

    await AuditLog.create({
      actorId: req.user._id,
      actorEmail: req.user.email,
      action: 'FEATURE_FLAG_TOGGLED',
      metadata: { key, enabled }
    });

    res.json({ success: true, flag });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getSystemLogs = async (req, res) => {
  try {
    const { level } = req.query;
    const query = level && level !== 'ALL' ? { level } : {};
    const logs = await SystemLog.find(query).sort({ timestamp: -1 }).limit(100);
    const auditLogs = await AuditLog.find().sort({ timestamp: -1 }).limit(50);
    res.json({ success: true, logs, auditLogs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const runDbConsoleQuery = async (req, res) => {
  try {
    const { collection } = req.body;
    let data;

    if (collection === 'users') {
      data = await User.find().select('-passwordHash').limit(20);
    } else if (collection === 'leetcodeStats') {
      data = await LeetCodeStat.find().limit(20);
    } else if (collection === 'auditLogs') {
      data = await AuditLog.find().sort({ timestamp: -1 }).limit(20);
    } else if (collection === 'systemLogs') {
      data = await SystemLog.find().sort({ timestamp: -1 }).limit(20);
    } else if (collection === 'featureFlags') {
      data = await FeatureFlag.find();
    } else {
      return res.status(400).json({ success: false, message: 'Invalid collection specified' });
    }

    res.json({ success: true, collection, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const impersonateUser = async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const targetUser = await User.findById(targetUserId).select('-passwordHash');

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Target user not found' });
    }

    await AuditLog.create({
      actorId: req.user._id,
      actorEmail: req.user.email,
      action: 'USER_IMPERSONATION_STARTED',
      targetId: targetUser._id.toString(),
      targetName: targetUser.email
    });

    res.json({
      success: true,
      message: `Now impersonating ${targetUser.name} (${targetUser.email})`,
      impersonatedUser: {
        id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        roleLevel: targetUser.roleLevel,
        leetcodeUsername: targetUser.leetcodeUsername,
        avatar: targetUser.avatar
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getSystemHealth, getFeatureFlags, toggleFeatureFlag, getSystemLogs, runDbConsoleQuery, impersonateUser };
