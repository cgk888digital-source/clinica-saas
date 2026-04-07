const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patient.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/authorization.middleware');
const validate = require('../middlewares/validate.middleware');
const { patientIdSchema } = require('../validators/patient.validator');

router.get('/', authMiddleware, authorize('patients:read'), patientController.getPatients);
router.get('/user/:userId', authMiddleware, authorize('patients:read'), patientController.getPatientByUserId);
router.delete('/:id', authMiddleware, authorize('patients:delete'), validate(patientIdSchema, 'params'), patientController.deletePatient);

module.exports = router;
