/**
 * Middleware for strict Multi-Tenant Isolation and Dynamic Scope Enforcement.
 */

const enforceTenantIsolation = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  // Level 6 SuperAdmin has global multi-tenant access across all institutions
  if (req.user.roleLevel >= 6) {
    req.tenantFilter = {};
    return next();
  }

  // Ensure user has an assigned institution
  if (!req.user.institutionId) {
    return res.status(403).json({ 
      success: false, 
      message: 'Access Denied: User is not assigned to any institution.' 
    });
  }

  // Mandatory institution filter applied to all database operations
  req.tenantFilter = { institutionId: req.user.institutionId };

  // For Student Representatives (CR / Level 2), restrict access strictly to their own class / section (or batch)
  if (req.user.role === 'student_rep' || req.user.roleLevel === 2) {
    if (req.user.sectionId) {
      req.tenantFilter.sectionId = req.user.sectionId;
    } else if (req.user.batchId) {
      req.tenantFilter.batchId = req.user.batchId;
    } else if (req.user.departmentId) {
      req.tenantFilter.departmentId = req.user.departmentId;
    }
  }

  next();
};

const requireRoleLevel = (minLevel) => {
  return (req, res, next) => {
    const userLevel = req.user ? (req.user.roleLevel || 1) : 0;
    if (userLevel < minLevel) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Permission Level ${minLevel} required. Your level is ${userLevel}.`
      });
    }
    next();
  };
};

module.exports = {
  enforceTenantIsolation,
  requireRoleLevel
};
