const express = require('express');
const router = express.Router();
const { 
  getGroupOverview, 
  flagInactiveUsers, 
  createGroupChallenge, 
  getGroupChallenges, 
  exportGroupCsv, 
  addUserToBatch,
  searchRegisteredUsers,
  assignUserToCohort
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { requireLevel } = require('../middleware/rbac');

router.get('/group-overview', protect, requireLevel(2), getGroupOverview);
router.get('/overview', protect, requireLevel(2), getGroupOverview);
router.post('/flag-inactive', protect, requireLevel(2), flagInactiveUsers);
router.post('/challenges', protect, requireLevel(2), createGroupChallenge);
router.get('/challenges/:groupId', protect, requireLevel(2), getGroupChallenges);
router.get('/export-csv', protect, requireLevel(2), exportGroupCsv);
router.post('/add-user', protect, requireLevel(2), addUserToBatch);
router.get('/search-users', protect, requireLevel(2), searchRegisteredUsers);
router.post('/assign-user-group', protect, requireLevel(2), assignUserToCohort);

module.exports = router;
