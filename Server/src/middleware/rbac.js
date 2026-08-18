/**
 * Middleware to enforce minimum role level.
 * Level 4: DevAdmin
 * Level 3: Super Admin
 * Level 2: Admin
 * Level 1: User
 */
const requireLevel = (minLevel) => {
  return (req, res, next) => {
    // If impersonating, role level checks apply to the real caller unless otherwise specified
    const activeLevel = req.user ? req.user.roleLevel : 0;
    
    if (activeLevel < minLevel) {
      return res.status(403).json({ 
        success: false, 
        message: `Forbidden: Minimum role level ${minLevel} required. Your level is ${activeLevel}.` 
      });
    }
    next();
  };
};

module.exports = { requireLevel };
