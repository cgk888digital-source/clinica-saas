const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

// Platform-wide management (Only for SUPERADMIN)
// Note: In a SaaS, 'SUPERADMIN' can be the Platform Owner
router.use(authMiddleware);
router.use(roleMiddleware(['SUPERADMIN']));

router.get('/organizations', adminController.getAllOrganizations);
router.put('/organizations/:id/status', adminController.updateOrganizationStatus);
router.put('/users/:id/toggle-status', adminController.toggleUserStatus);

module.exports = router;
