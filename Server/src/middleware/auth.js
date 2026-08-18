const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, token missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'leetcode_super_secret_jwt_key_2026_antigravity');
    const actualUser = await User.findById(decoded.id).select('-passwordHash');
    
    if (!actualUser) {
      return res.status(401).json({ success: false, message: 'User no longer exists' });
    }

    if (!actualUser.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }

    req.realUser = actualUser; // Store the original authenticated user

    // Handle impersonation header if present and caller has permission (DevAdmin level 4 or SuperAdmin level 3)
    const impersonateUserId = req.headers['x-impersonate-user-id'];
    if (impersonateUserId && actualUser.roleLevel >= 3) {
      const targetUser = await User.findById(impersonateUserId).select('-passwordHash');
      if (targetUser) {
        req.user = targetUser;
        req.isImpersonating = true;
        return next();
      }
    }

    req.user = actualUser;
    req.isImpersonating = false;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Not authorized, invalid token' });
  }
};

module.exports = { protect };
