const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');

// Platform-wide management (Only for SUPERADMIN)
// Middleware is applied in index.js for /api/admin
router.get('/organizations', adminController.getAllOrganizations);
router.put('/organizations/:id/status', adminController.updateOrganizationStatus);
router.get('/users', adminController.getAllUsers);
router.put('/users/:id/toggle-status', adminController.toggleUserStatus);
router.post('/super-admins', adminController.createSuperAdmin);

module.exports = router;
