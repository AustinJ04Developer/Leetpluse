/**
 * Scope helper functions to enforce role-based visibility rules.
 * 
 * Rules:
 * - User: Restricted to own statistics (WHERE user_id = self) and own batch leaderboard.
 * - Admin: Restricted to their entire batch (WHERE batch_id = self.batch_id). Admin is a participant in their batch.
 * - Super Admin: Entire organization (WHERE org_id = self.org_id), all batches, view-only (no LeetCode handle).
 * - DevAdmin: Full organization access, view all batches, acts as participant with own stats.
 */

const getStatsVisibilityScope = (requester, targetUserId) => {
  const reqUserId = requester._id.toString();

  if (requester.roleLevel === 1) {
    // User: Own stats only
    if (targetUserId && targetUserId.toString() !== reqUserId) {
      return { allowed: false, reason: 'Users are restricted to viewing their own statistics only.' };
    }
  } else if (requester.roleLevel === 2) {
    // Admin: Entire batch (including self)
    // Permission check against target user's batch happens in controller
  }

  // Super Admin (L3) & DevAdmin (L4) have org-wide access
  return { allowed: true };
};

const getLeaderboardFilter = (requester, requestedGroupId, scopeType = 'section') => {
  const userFilter = { 
    role: { $in: ['student', 'user', 'admin', 'faculty', 'student_rep'] } 
  };

  if (requester.roleLevel < 6 && requester.institutionId) {
    userFilter.institutionId = requester.institutionId;
  }

  // Student Representative (CR / Level 2): Restrict leaderboard to own section or cohort batch
  if (requester.role === 'student_rep' || requester.roleLevel === 2) {
    if (scopeType === 'batch' && (requester.groupId || requester.batchId)) {
      if (requester.groupId) userFilter.groupId = requester.groupId._id || requester.groupId;
      else if (requester.batchId) userFilter.batchId = requester.batchId._id || requester.batchId;
    } else {
      if (requester.departmentId) {
        userFilter.departmentId = requester.departmentId._id || requester.departmentId;
      }
      if (requester.sectionId) {
        userFilter.sectionId = requester.sectionId._id || requester.sectionId;
      } else if (!requester.departmentId && requester.batchId) {
        userFilter.batchId = requester.batchId._id || requester.batchId;
      }
    }
  } else if (requestedGroupId && requestedGroupId !== 'all') {
    userFilter.$or = [
      { batchId: requestedGroupId },
      { departmentId: requestedGroupId },
      { groupId: requestedGroupId }
    ];
  }

  return userFilter;
};


module.exports = {
  getStatsVisibilityScope,
  getLeaderboardFilter
};
