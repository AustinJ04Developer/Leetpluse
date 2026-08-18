const express = require('express');
const router = express.Router();
const { updateProfile, getAllUsers, updateUserRole, bulkImportUsers } = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { requireLevel } = require('../middleware/rbac');

router.put('/profile', protect, updateProfile);
router.get('/', protect, requireLevel(2), getAllUsers);
router.put('/:userId/role', protect, requireLevel(3), updateUserRole);
router.post('/bulk-import', protect, requireLevel(2), bulkImportUsers);

module.exports = router;
