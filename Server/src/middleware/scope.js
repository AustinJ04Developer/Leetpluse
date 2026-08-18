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

const getLeaderboardFilter = (requester, requestedGroupId) => {
  // Always exclude Super Admin from participant rankings
  const userFilter = { 
    role: { $ne: 'superadmin' } 
  };

  if (requester.roleLevel === 1 || requester.roleLevel === 2) {
    // User & Admin are strictly locked to their own batch
    if (requester.groupId) {
      userFilter.groupId = requester.groupId;
    }
  } else if (requester.roleLevel >= 3) {
    // SuperAdmin & DevAdmin can filter batch-by-batch or view org-wide
    if (requestedGroupId && requestedGroupId !== 'all') {
      userFilter.groupId = requestedGroupId;
    }
    if (requester.orgId) {
      userFilter.orgId = requester.orgId;
    }
  }

  return userFilter;
};

module.exports = {
  getStatsVisibilityScope,
  getLeaderboardFilter
};
