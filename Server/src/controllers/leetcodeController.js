const LeetCodeStat = require('../models/LeetCodeStat');
const SubmissionLog = require('../models/SubmissionLog');
const User = require('../models/User');
const Group = require('../models/Group');
const { syncUserLeetCode } = require('../services/leetcodeService');
const { emitToUser } = require('../services/socketService');
const { getLeaderboardFilter } = require('../middleware/scope');


const isUserInRequesterScope = (targetUser, requester) => {
  if (!targetUser) return false;
  if (targetUser._id.toString() === requester._id.toString()) return true;
  
  const targetDept = targetUser.departmentId?._id || targetUser.departmentId;
  const reqDept = requester.departmentId?._id || requester.departmentId;
  const targetSec = targetUser.sectionId?._id || targetUser.sectionId;
  const reqSec = requester.sectionId?._id || requester.sectionId;

  if (reqDept && reqSec && targetDept && targetSec) {
    if (targetDept.toString() === reqDept.toString() && targetSec.toString() === reqSec.toString()) {
      return true;
    }
  }

  const targetBatch = targetUser.batchId?._id || targetUser.batchId;
  const reqBatch = requester.batchId?._id || requester.batchId;
  if (reqBatch && targetBatch && targetBatch.toString() === reqBatch.toString()) return true;

  const targetGroup = targetUser.groupId?._id || targetUser.groupId;
  const reqGroup = requester.groupId?._id || requester.groupId;
  if (reqGroup && targetGroup && targetGroup.toString() === reqGroup.toString()) return true;

  return false;
};

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
    } else if (requester.roleLevel === 2) { // Class Rep: Own class section stats only
      if (targetUserId.toString() !== requester._id.toString()) {
        const targetUser = await User.findById(targetUserId);
        if (!isUserInRequesterScope(targetUser, requester)) {
          return res.status(403).json({ 
            success: false, 
            message: 'Forbidden: Class Representatives can only view statistics for users in their assigned class section.' 
          });
        }
      }
    }

    const targetUserDoc = await User.findById(targetUserId);
    if (!targetUserDoc) {
      return res.status(404).json({ success: false, message: 'User not found' });
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
      if (!isUserInRequesterScope(targetUser, requester)) {
        return res.status(403).json({ success: false, message: 'Forbidden: Class Representatives can only sync users in their assigned class section.' });
      }
    }

    const userToSync = await User.findById(targetUserId);

    if (!userToSync || !userToSync.leetcodeUsername) {
      return res.status(400).json({ success: false, message: 'User does not have a linked LeetCode username.' });
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

    if (targetUserId.toString() !== requester._id.toString()) {
      if (requester.roleLevel <= 2) {
        const targetUser = await User.findById(targetUserId);
        if (!isUserInRequesterScope(targetUser, requester)) {
          return res.status(403).json({ 
            success: false, 
            message: 'Forbidden: Access restricted to members in your assigned class section.' 
          });
        }
      }
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
    const { groupId, scopeType = 'section' } = req.query;
    
    const userFilter = getLeaderboardFilter(requester, groupId, scopeType);
    userFilter.leetcodeUsername = { $ne: null, $exists: true };

    const eligibleUsers = await User.find(userFilter).select('_id');
    const eligibleUserIds = eligibleUsers.map(u => u._id);

    const leaderboard = await LeetCodeStat.find({ userId: { $in: eligibleUserIds } })
      .populate({
        path: 'userId',
        select: 'name email avatar role leetcodeUsername xp level departmentId batchId sectionId registerNumber',
        populate: [
          { path: 'departmentId', select: 'name code' },
          { path: 'batchId', select: 'name' },
          { path: 'sectionId', select: 'name' }
        ]
      })
      .sort({ totalSolved: -1, easySolved: -1, mediumSolved: -1, hardSolved: -1 });

    res.json({ 
      success: true, 
      leaderboard,
      scopedGroup: groupId || 'all'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getBatchProgressMatrix = async (req, res) => {
  try {
    const requester = req.user;
    const { groupId, scopeType = 'section' } = req.query;

    let userQuery = { role: { $in: ['student', 'student_rep', 'user', 'faculty', 'admin'] } };

    if (requester.role === 'student_rep' || requester.roleLevel === 2) {
      if (scopeType === 'batch' && (requester.groupId || requester.batchId)) {
        if (requester.groupId) userQuery.groupId = requester.groupId._id || requester.groupId;
        else if (requester.batchId) userQuery.batchId = requester.batchId._id || requester.batchId;
      } else {
        if (requester.departmentId) {
          userQuery.departmentId = requester.departmentId._id || requester.departmentId;
        }
        if (requester.sectionId) {
          userQuery.sectionId = requester.sectionId._id || requester.sectionId;
        } else if (!requester.departmentId && requester.batchId) {
          userQuery.batchId = requester.batchId._id || requester.batchId;
        }
      }
    } else if (requester.roleLevel < 5 && requester.institutionId) {
      userQuery.institutionId = requester.institutionId;
    }

    if (groupId && groupId !== 'all' && requester.roleLevel > 2) {
      userQuery.$or = [
        { batchId: groupId },
        { departmentId: groupId },
        { groupId: groupId }
      ];
    }

    const users = await User.find(userQuery)
      .select('name email avatar role leetcodeUsername xp level departmentId batchId sectionId groupId academicCohorts registerNumber')
      .populate('departmentId', 'name code')
      .populate('batchId', 'name')
      .populate('sectionId', 'name')
      .populate('groupId', 'name description')
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

