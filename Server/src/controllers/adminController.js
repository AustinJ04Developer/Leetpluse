const User = require('../models/User');
const Group = require('../models/Group');
const LeetCodeStat = require('../models/LeetCodeStat');
const Challenge = require('../models/Challenge');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

const getGroupOverview = async (req, res) => {
  try {
    // Find groups where this user is admin, or if superadmin/devadmin get all
    let groupQuery = {};
    if (req.user.roleLevel < 3) {
      groupQuery = { $or: [{ adminId: req.user._id }, { _id: req.user.groupId }] };
    }

    let groups = await Group.find(groupQuery);

    // Auto-create Cohort Group for Admin if none exists yet
    if (req.user.roleLevel === 2 && groups.length === 0) {
      const newGroup = await Group.create({
        name: `${req.user.name}'s Cohort`,
        adminId: req.user._id,
        orgId: req.user.orgId,
        description: 'Assigned Cohort Accelerator Group'
      });
      req.user.groupId = newGroup._id;
      await req.user.save();
      groups = [newGroup];
    }

    const groupIds = groups.map(g => g._id);

    // Fetch all users in these cohort groups, plus the Admin themselves
    const users = await User.find({ 
      $or: [
        { groupId: { $in: groupIds } },
        { _id: req.user._id }
      ]
    })
      .select('-passwordHash')
      .populate('groupId', 'name');

    const userIds = users.map(u => u._id);
    const stats = await LeetCodeStat.find({ userId: { $in: userIds } });

    // Map stats into users array
    const usersWithStats = users.map(u => {
      const uStat = stats.find(s => s.userId.toString() === u._id.toString());
      const daysSinceActive = Math.floor((Date.now() - new Date(u.lastActive).getTime()) / (1000 * 60 * 60 * 24));
      const isInactive = daysSinceActive >= 3;

      return {
        ...u.toObject(),
        stats: uStat || null,
        daysSinceActive,
        isInactive
      };
    });

    res.json({
      success: true,
      groups,
      users: usersWithStats
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const flagInactiveUsers = async (req, res) => {
  try {
    const { userIds, customMessage } = req.body;
    
    if (!userIds || !Array.isArray(userIds)) {
      return res.status(400).json({ success: false, message: 'Invalid userIds array' });
    }

    const notifications = userIds.map(id => ({
      userId: id,
      title: 'Activity Reminder: Streak Risk',
      message: customMessage || 'You have not submitted a LeetCode problem in over 3 days! Log in and keep your streak alive.',
      type: 'inactive_alert'
    }));

    await Notification.insertMany(notifications);

    await AuditLog.create({
      actorId: req.user._id,
      actorEmail: req.user.email,
      action: 'ADMIN_FLAGGED_INACTIVE_USERS',
      metadata: { targetUserIds: userIds }
    });

    res.json({ success: true, message: `Successfully notified ${userIds.length} inactive user(s).` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createGroupChallenge = async (req, res) => {
  try {
    const { title, description, groupId, targetCount, difficulty, deadline, rewardXp } = req.body;

    const challenge = await Challenge.create({
      title,
      description,
      groupId,
      createdBy: req.user._id,
      targetCount,
      difficulty,
      deadline,
      rewardXp
    });

    // Notify users in the group
    const groupUsers = await User.find({ groupId });
    const notifications = groupUsers.map(u => ({
      userId: u._id,
      title: 'New Group Challenge Assigned!',
      message: `Admin created challenge: "${title}". Target: ${targetCount} problems by ${new Date(deadline).toLocaleDateString()}.`,
      type: 'challenge'
    }));
    await Notification.insertMany(notifications);

    res.status(201).json({ success: true, challenge });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getGroupChallenges = async (req, res) => {
  try {
    const { groupId } = req.params;
    const challenges = await Challenge.find({ groupId }).populate('createdBy', 'name email');
    res.json({ success: true, challenges });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const escapeCSV = (val) => {
  if (val === null || val === undefined) return '""';
  let str = String(val);
  if (/^[=+\-@]/.test(str)) {
    str = "'" + str;
  }
  str = str.replace(/"/g, '""');
  return `"${str}"`;
};

const exportGroupCsv = async (req, res) => {
  try {
    const { groupId } = req.query;
    let query = {};

    if (groupId) {
      query.groupId = groupId;
    } else if (req.user.roleLevel < 5) {
      // Non-superadmin users can only export their assigned cohort or institution users
      const targetGroupId = req.user.groupId || null;
      if (targetGroupId) {
        query.groupId = targetGroupId;
      } else {
        query.$or = [{ adminId: req.user._id }, { _id: req.user._id }];
      }
    }

    if (req.tenantFilter) {
      query = { ...query, ...req.tenantFilter };
    }

    const users = await User.find(query).select('name email leetcodeUsername role xp level lastActive registerNumber studentId');
    const userIds = users.map(u => u._id);
    const stats = await LeetCodeStat.find({ userId: { $in: userIds } }).lean();
    const statsMap = new Map(stats.map(st => [st.userId.toString(), st]));

    let csvContent = '\uFEFF';
    csvContent += 'Name,Email,Register Number,LeetCode Handle,Total Solved,Easy,Medium,Hard,Acceptance Rate (%),Streak,Contest Rating,Global Rank,XP,Level,Last Active\n';

    users.forEach(u => {
      const s = statsMap.get(u._id.toString());
      const name = escapeCSV(u.name || '');
      const email = escapeCSV(u.email || '');
      const reg = escapeCSV(u.registerNumber || 'N/A');
      const handle = escapeCSV(u.leetcodeUsername || 'Not Linked');
      const total = s?.totalSolved || 0;
      const easy = s?.easySolved || 0;
      const med = s?.mediumSolved || 0;
      const hard = s?.hardSolved || 0;
      const accRate = escapeCSV(s?.acceptanceRate != null ? `${s.acceptanceRate.toFixed(1)}%` : '0%');
      const streak = s?.currentStreak || 0;
      const rating = escapeCSV(s?.contestRating ? Math.round(s.contestRating) : 'N/A');
      const rank = escapeCSV(s?.globalRanking ? s.globalRanking : 'N/A');
      const xp = u.xp || 0;
      const level = u.level || 1;
      const lastActive = escapeCSV(u.lastActive ? new Date(u.lastActive).toISOString().split('T')[0] : 'N/A');

      csvContent += `${name},${email},${reg},${handle},${total},${easy},${med},${hard},${accRate},${streak},${rating},${rank},${xp},${level},${lastActive}\n`;
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=group_performance_report_${Date.now()}.csv`);
    return res.status(200).send(csvContent);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const addUserToBatch = async (req, res) => {
  try {
    const { name, email, password, leetcodeUsername } = req.body;
    const admin = req.user;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Student name and email are required.' });
    }

    const emailClean = email.trim().toLowerCase();

    // Auto-resolve or create Cohort Group if admin.groupId is null
    if (!admin.groupId) {
      let existingGroup = await Group.findOne({ adminId: admin._id });
      if (!existingGroup) {
        existingGroup = await Group.create({
          name: `${admin.name}'s Cohort`,
          adminId: admin._id,
          orgId: admin.orgId,
          description: 'Assigned Cohort Accelerator Group'
        });
      }
      admin.groupId = existingGroup._id;
      await admin.save();
    }

    const existingUser = await User.findOne({ email: emailClean });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password || 'Password123!', salt);

    const newUser = await User.create({
      name: name.trim(),
      email: emailClean,
      passwordHash,
      leetcodeUsername: leetcodeUsername ? leetcodeUsername.trim() : null,
      role: 'user',
      roleLevel: 1,
      orgId: admin.orgId,
      groupId: admin.groupId
    });

    await AuditLog.create({
      actorId: admin._id,
      actorEmail: admin.email,
      action: 'ADMIN_ADDED_USER_TO_BATCH',
      targetId: newUser._id.toString(),
      targetName: newUser.email
    });

    res.status(201).json({ success: true, message: `User ${name} added to batch successfully.`, user: newUser });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const searchRegisteredUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) {
      return res.json({ success: true, users: [] });
    }

    const regex = new RegExp(q.trim(), 'i');
    const users = await User.find({
      role: 'user',
      $or: [
        { name: regex },
        { email: regex },
        { leetcodeUsername: regex }
      ]
    })
      .select('-passwordHash')
      .populate('groupId', 'name')
      .limit(15);

    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const assignUserToCohort = async (req, res) => {
  try {
    const { userId, userIds } = req.body;
    const admin = req.user;

    const idsToAssign = userIds && Array.isArray(userIds) ? userIds : (userId ? [userId] : []);

    if (idsToAssign.length === 0) {
      return res.status(400).json({ success: false, message: 'Please select at least one target user to add.' });
    }

    // Auto-resolve or create Cohort Group if admin.groupId is null
    if (!admin.groupId) {
      let existingGroup = await Group.findOne({ adminId: admin._id });
      if (!existingGroup) {
        existingGroup = await Group.create({
          name: `${admin.name}'s Cohort`,
          adminId: admin._id,
          orgId: admin.orgId,
          description: 'Assigned Cohort Accelerator Group'
        });
      }
      admin.groupId = existingGroup._id;
      await admin.save();
    }

    await User.updateMany(
      { _id: { $in: idsToAssign } },
      { $set: { groupId: admin.groupId } }
    );

    await AuditLog.create({
      actorId: admin._id,
      actorEmail: admin.email,
      action: 'ADMIN_ASSIGNED_USERS_TO_COHORT',
      metadata: { userIds: idsToAssign, count: idsToAssign.length }
    });

    res.json({
      success: true,
      message: `Successfully added ${idsToAssign.length} student(s) to your cohort.`,
      assignedCount: idsToAssign.length
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { 
  getGroupOverview, 
  flagInactiveUsers, 
  createGroupChallenge, 
  getGroupChallenges, 
  exportGroupCsv, 
  addUserToBatch,
  searchRegisteredUsers,
  assignUserToCohort
};
