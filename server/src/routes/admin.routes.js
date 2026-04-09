const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');
const contextMiddleware = require('../middlewares/context.middleware');

// Platform-wide management (Only for SUPERADMIN)
// Note: In a SaaS, 'SUPERADMIN' can be the Platform Owner
router.use(authMiddleware);
router.use(contextMiddleware);
router.use(roleMiddleware(['SUPERADMIN']));

router.get('/organizations', adminController.getAllOrganizations);
router.get('/users', adminController.getAllUsers);
router.put('/organizations/:id/status', adminController.updateOrganizationStatus);
router.put('/users/:id/toggle-status', adminController.toggleUserStatus);
router.post('/super-admins', adminController.createSuperAdmin);

module.exports = router;
