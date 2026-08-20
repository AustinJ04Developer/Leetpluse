const LeetCodeStat = require('../models/LeetCodeStat');
const SubmissionLog = require('../models/SubmissionLog');
const User = require('../models/User');
const Group = require('../models/Group');
const { syncUserLeetCode } = require('../services/leetcodeService');
const { emitToUser } = require('../services/socketService');
const { getLeaderboardFilter } = require('../middleware/scope');


const getStats = async (req, res) => {
  try {
    const requester = req.user;
    let targetUserId = req.params.userId || requester._id.toString();

    // Server-side RBAC & Visibility Scope Enforcement
    if (requester.roleLevel === 1) { // User: Own stats only
      if (targetUserId.toString() !== requester._id.toString()) {
        return res.status(403).json({ 
          success: false, 
          message: 'Forbidden: Users are restricted to viewing their own statistics only.' 
        });
      }
    } else if (requester.roleLevel === 2) { // Admin: Own batch stats only (including self)
      if (targetUserId.toString() !== requester._id.toString()) {
        const targetUser = await User.findById(targetUserId);
        if (!targetUser || !targetUser.groupId || targetUser.groupId.toString() !== requester.groupId?.toString()) {
          return res.status(403).json({ 
            success: false, 
            message: 'Forbidden: Admins can only view statistics for users in their assigned batch.' 
          });
        }
      }
    }

    const targetUserDoc = await User.findById(targetUserId);
    if (!targetUserDoc) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (targetUserDoc.role === 'superadmin') {
      return res.status(400).json({
        success: false,
        message: 'Super Admin is a management role without a personal LeetCode account.'
      });
    }

    let stats = await LeetCodeStat.findOne({ userId: targetUserId });
    
    if (!stats && targetUserDoc.leetcodeUsername) {
      const syncRes = await syncUserLeetCode(targetUserDoc);
      stats = syncRes.stats;
    }

    res.json({ success: true, stats: stats || null });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const triggerSyncNow = async (req, res) => {
  try {
    const requester = req.user;
    let targetUserId = req.body.userId || requester._id.toString();

    if (requester.roleLevel === 1 && targetUserId.toString() !== requester._id.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden: Cannot trigger sync for other users' });
    } else if (requester.roleLevel === 2 && targetUserId.toString() !== requester._id.toString()) {
      const targetUser = await User.findById(targetUserId);
      if (!targetUser || !targetUser.groupId || targetUser.groupId.toString() !== requester.groupId?.toString()) {
        return res.status(403).json({ success: false, message: 'Forbidden: Admins can only sync users in their assigned batch.' });
      }
    }

    const userToSync = await User.findById(targetUserId);

    if (!userToSync || !userToSync.leetcodeUsername || userToSync.role === 'superadmin') {
      return res.status(400).json({ success: false, message: 'User does not have a linked LeetCode username or is a Super Admin management role.' });
    }

    const result = await syncUserLeetCode(userToSync);

    if (result.success) {
      emitToUser(userToSync._id.toString(), 'leetcode:updated', {
        userId: userToSync._id,
        stats: result.stats,
        lastSyncedAt: new Date()
      });
      return res.json({ success: true, message: 'Sync complete', stats: result.stats });
    } else {
      return res.status(400).json({ success: false, message: result.message || 'Sync failed' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getHeatmap = async (req, res) => {
  try {
    const requester = req.user;
    let targetUserId = req.params.userId || requester._id.toString();

    // Server-side Scope Enforcement: allow viewing heatmaps for cohort members
    if (targetUserId.toString() !== requester._id.toString()) {
      if (requester.roleLevel <= 2) {
        const targetUser = await User.findById(targetUserId);
        if (!targetUser || !targetUser.groupId || !requester.groupId || targetUser.groupId.toString() !== requester.groupId.toString()) {
          return res.status(403).json({ 
            success: false, 
            message: 'Forbidden: Access restricted to members in your assigned cohort.' 
          });
        }
      }
    }


    const targetUserDoc = await User.findById(targetUserId);
    if (targetUserDoc && targetUserDoc.role === 'superadmin') {
      return res.json({ success: true, logs: [], message: 'Super Admin has no activity heatmap.' });
    }

    const logs = await SubmissionLog.find({ userId: targetUserId }).sort({ date: 1 });
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getLeaderboard = async (req, res) => {
  try {
    const requester = req.user;
    const { groupId } = req.query; // Used for SuperAdmin & DevAdmin batch selection
    
    const userFilter = getLeaderboardFilter(requester, groupId);
    userFilter.leetcodeUsername = { $ne: null, $exists: true };

    const eligibleUsers = await User.find(userFilter).select('_id');
    const eligibleUserIds = eligibleUsers.map(u => u._id);

    const leaderboard = await LeetCodeStat.find({ userId: { $in: eligibleUserIds } })
      .populate('userId', 'name email avatar role leetcodeUsername xp level groupId')
      .sort({ totalSolved: -1, easySolved: -1, mediumSolved: -1, hardSolved: -1 });

    res.json({ 
      success: true, 
      leaderboard,
      scopedGroup: (requester.roleLevel <= 2) ? requester.groupId : (groupId || 'all')
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getBatchProgressMatrix = async (req, res) => {
  try {
    const requester = req.user;
    const { groupId } = req.query;

    let userQuery = { role: { $ne: 'superadmin' } };

    if (groupId && groupId !== 'all') {
      userQuery.groupId = groupId;
    } else if (requester.orgId) {
      userQuery.orgId = requester.orgId;
    }

    const users = await User.find(userQuery)
      .select('name email avatar role leetcodeUsername xp level groupId')
      .populate('groupId', 'name')
      .sort({ name: 1 });

    const userIds = users.map(u => u._id);

    const [statsList, allLogs] = await Promise.all([
      LeetCodeStat.find({ userId: { $in: userIds } }),
      SubmissionLog.find({ userId: { $in: userIds } }).sort({ date: 1 })
    ]);

    const statsMap = {};
    statsList.forEach(s => {
      statsMap[s.userId.toString()] = s;
    });

    const logsMap = {};
    allLogs.forEach(l => {
      const uId = l.userId.toString();
      if (!logsMap[uId]) logsMap[uId] = [];
      logsMap[uId].push(l);
    });

    const membersProgress = users.map(u => {
      const uId = u._id.toString();
      return {
        user: u,
        stats: statsMap[uId] || null,
        logs: logsMap[uId] || []
      };
    });

    res.json({
      success: true,
      totalMembers: membersProgress.length,
      membersProgress
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getStats, triggerSyncNow, getHeatmap, getLeaderboard, getBatchProgressMatrix };

