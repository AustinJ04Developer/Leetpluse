const express = require('express');
const router = express.Router();
const { getOrgAnalytics, createAdminUser, broadcastAnnouncement, updateBranding } = require('../controllers/superadminController');
const { protect } = require('../middleware/auth');
const { requireLevel } = require('../middleware/rbac');

router.get('/org-analytics', protect, requireLevel(3), getOrgAnalytics);
router.post('/create-admin', protect, requireLevel(3), createAdminUser);
router.post('/announcements', protect, requireLevel(3), broadcastAnnouncement);
router.put('/branding', protect, requireLevel(3), updateBranding);

module.exports = router;
