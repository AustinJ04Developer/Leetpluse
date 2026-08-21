const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { enforceTenantIsolation, requireRoleLevel } = require('../middleware/tenantScope');
const {
  getStudents,
  getHierarchicalRankings,
  getAtRiskStudents,
  syncStudentStats,
  updateStudent,
  deleteStudent
} = require('../controllers/studentController');

router.use(protect);
router.use(enforceTenantIsolation);

router.get('/', getStudents);
router.get('/rankings', getHierarchicalRankings);
router.get('/at-risk', requireRoleLevel(2), getAtRiskStudents);
router.post('/:id/sync', requireRoleLevel(2), syncStudentStats);
router.put('/:id', requireRoleLevel(3), updateStudent);
router.delete('/:id', requireRoleLevel(3), deleteStudent);


module.exports = router;
