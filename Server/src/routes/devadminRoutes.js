const express = require('express');
const router = express.Router();
const { getSystemHealth, getFeatureFlags, toggleFeatureFlag, getSystemLogs, runDbConsoleQuery, impersonateUser } = require('../controllers/devadminController');
const { protect } = require('../middleware/auth');
const { requireLevel } = require('../middleware/rbac');

router.get('/system-health', protect, requireLevel(4), getSystemHealth);
router.get('/feature-flags', protect, requireLevel(4), getFeatureFlags);
router.post('/feature-flags/toggle', protect, requireLevel(4), toggleFeatureFlag);
router.get('/logs', protect, requireLevel(4), getSystemLogs);
router.post('/db-console', protect, requireLevel(4), runDbConsoleQuery);
router.post('/impersonate', protect, requireLevel(3), impersonateUser);

module.exports = router;
