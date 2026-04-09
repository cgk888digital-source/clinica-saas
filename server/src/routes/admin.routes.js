const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');
const contextMiddleware = require('../middlewares/context.middleware');

// All admin routes require authentication and context
router.use(authMiddleware);
router.use(contextMiddleware);

// PLATFORM_ADMIN can view and manage orgs/users, but NOT create superadmins
router.get('/organizations', roleMiddleware(['SUPERADMIN', 'PLATFORM_ADMIN']), adminController.getAllOrganizations);
router.get('/users', roleMiddleware(['SUPERADMIN', 'PLATFORM_ADMIN']), adminController.getAllUsers);
router.put('/organizations/:id/status', roleMiddleware(['SUPERADMIN', 'PLATFORM_ADMIN']), adminController.updateOrganizationStatus);
router.put('/users/:id/toggle-status', roleMiddleware(['SUPERADMIN', 'PLATFORM_ADMIN']), adminController.toggleUserStatus);

// Only SUPERADMIN can create platform admins — email whitelist enforced in controller
router.post('/super-admins', roleMiddleware(['SUPERADMIN']), adminController.createSuperAdmin);
router.post('/platform-admins', roleMiddleware(['SUPERADMIN']), adminController.createPlatformAdmin);

module.exports = router;
