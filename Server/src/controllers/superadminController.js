const User = require('../models/User');
const Organization = require('../models/Organization');
const Group = require('../models/Group');
const LeetCodeStat = require('../models/LeetCodeStat');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const bcrypt = require('bcryptjs');

const getOrgAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const totalGroups = await Group.countDocuments();
    const stats = await LeetCodeStat.find();

    const totalSolvedOrg = stats.reduce((acc, curr) => acc + (curr.totalSolved || 0), 0);
    const totalEasyOrg = stats.reduce((acc, curr) => acc + (curr.easySolved || 0), 0);
    const totalMediumOrg = stats.reduce((acc, curr) => acc + (curr.mediumSolved || 0), 0);
    const totalHardOrg = stats.reduce((acc, curr) => acc + (curr.hardSolved || 0), 0);
    const avgStreak = Math.round((stats.reduce((acc, curr) => acc + (curr.currentStreak || 0), 0) / (stats.length || 1)) * 10) / 10;

    const org = await Organization.findOne();

    res.json({
      success: true,
      metrics: {
        totalUsers,
        totalAdmins,
        totalGroups,
        totalSolvedOrg,
        totalEasyOrg,
        totalMediumOrg,
        totalHardOrg,
        avgStreak
      },
      organization: org
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createAdminUser = async (req, res) => {
  try {
    const { name, email, password, groupName } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const org = await Organization.findOne();

    const newAdmin = await User.create({
      name,
      email,
      passwordHash,
      role: 'admin',
      roleLevel: 2,
      orgId: org ? org._id : null
    });

    if (org) {
      const cohortName = groupName && groupName.trim() ? groupName.trim() : `${name}'s Cohort`;
      const newGroup = await Group.create({
        name: cohortName,
        orgId: org._id,
        adminId: newAdmin._id
      });
      newAdmin.groupId = newGroup._id;
      await newAdmin.save();
    }

    await AuditLog.create({
      actorId: req.user._id,
      actorEmail: req.user.email,
      action: 'SUPERADMIN_CREATED_ADMIN',
      targetId: newAdmin._id.toString(),
      targetName: newAdmin.email
    });

    res.status(201).json({ success: true, admin: newAdmin });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const broadcastAnnouncement = async (req, res) => {
  try {
    const { title, message } = req.body;

    const allUsers = await User.find({ isActive: true }).select('_id');
    const notifications = allUsers.map(u => ({
      userId: u._id,
      title: `[Platform Announcement] ${title}`,
      message,
      type: 'system'
    }));

    await Notification.insertMany(notifications);

    await AuditLog.create({
      actorId: req.user._id,
      actorEmail: req.user.email,
      action: 'BROADCAST_ANNOUNCEMENT',
      metadata: { title }
    });

    res.json({ success: true, message: `Broadcast sent to ${allUsers.length} users.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateBranding = async (req, res) => {
  try {
    const { companyName, logoUrl, primaryColor, plan } = req.body;
    let org = await Organization.findOne();
    if (!org) {
      org = new Organization({ name: companyName || 'Default Org', slug: 'default-org' });
    }

    org.branding.companyName = companyName || org.branding.companyName;
    org.branding.logoUrl = logoUrl || org.branding.logoUrl;
    org.branding.primaryColor = primaryColor || org.branding.primaryColor;
    if (plan) org.plan = plan;

    await org.save();

    await AuditLog.create({
      actorId: req.user._id,
      actorEmail: req.user.email,
      action: 'SUPERADMIN_UPDATED_BRANDING',
      metadata: { companyName, primaryColor }
    });

    res.json({ success: true, organization: org });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getOrgAnalytics, createAdminUser, broadcastAnnouncement, updateBranding };
