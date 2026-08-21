const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { enforceTenantIsolation, requireRoleLevel } = require('../middleware/tenantScope');
const { getFacultyOverview, assignGoalToScope } = require('../controllers/facultyController');

router.use(protect);
router.use(enforceTenantIsolation);

router.get('/overview', requireRoleLevel(2), getFacultyOverview);
router.post('/goals/assign', requireRoleLevel(2), assignGoalToScope);

module.exports = router;
