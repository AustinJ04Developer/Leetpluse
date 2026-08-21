const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { enforceTenantIsolation, requireRoleLevel } = require('../middleware/tenantScope');
const { exportStudentReportCSV } = require('../controllers/reportController');

router.use(protect);
router.use(enforceTenantIsolation);

router.get('/students/csv', requireRoleLevel(2), exportStudentReportCSV);

module.exports = router;
