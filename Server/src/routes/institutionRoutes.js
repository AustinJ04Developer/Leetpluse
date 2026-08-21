const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { enforceTenantIsolation, requireRoleLevel } = require('../middleware/tenantScope');
const {
  getAllInstitutions,
  getInstitutionById,
  createInstitution,
  updateInstitution,
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getAcademicYears,
  createAcademicYear,
  updateAcademicYear,
  deleteAcademicYear,
  getBatches,
  createBatch,
  updateBatch,
  deleteBatch,
  getSections,
  createSection,
  updateSection,
  deleteSection
} = require('../controllers/institutionController');

router.use(protect);
router.use(enforceTenantIsolation);

// Institutions
router.get('/', getAllInstitutions);
router.get('/:id', getInstitutionById);
router.post('/', requireRoleLevel(6), createInstitution);
router.put('/:id', requireRoleLevel(5), updateInstitution);

// Departments
router.get('/departments/list', getDepartments);
router.post('/departments/create', requireRoleLevel(5), createDepartment);
router.put('/departments/:id', requireRoleLevel(5), updateDepartment);
router.delete('/departments/:id', requireRoleLevel(5), deleteDepartment);

// Academic Years
router.get('/academic-years/list', getAcademicYears);
router.post('/academic-years/create', requireRoleLevel(5), createAcademicYear);
router.put('/academic-years/:id', requireRoleLevel(5), updateAcademicYear);
router.delete('/academic-years/:id', requireRoleLevel(5), deleteAcademicYear);

// Batches
router.get('/batches/list', getBatches);
router.post('/batches/create', requireRoleLevel(4), createBatch);
router.put('/batches/:id', requireRoleLevel(4), updateBatch);
router.delete('/batches/:id', requireRoleLevel(4), deleteBatch);

// Sections
router.get('/sections/list', getSections);
router.post('/sections/create', requireRoleLevel(4), createSection);
router.put('/sections/:id', requireRoleLevel(4), updateSection);
router.delete('/sections/:id', requireRoleLevel(4), deleteSection);



module.exports = router;
