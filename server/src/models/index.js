const User = require('./User');
const Role = require('./Role');
const Department = require('./Department');
const Specialty = require('./Specialty');
const Doctor = require('./Doctor');
const Patient = require('./Patient');
const Nurse = require('./Nurse');
const Staff = require('./Staff');
const Appointment = require('./Appointment');
const MedicalRecord = require('./MedicalRecord');
const LabResult = require('./LabResult');
const Payment = require('./Payment');
const sequelize = require('../config/db.config');
const VideoConsultation = require('./VideoConsultation');
const Organization = require('./Organization');
const AuditLog = require('./auditLog');
const Drug = require('./Drug');
const Prescription = require('./Prescription');
const LabTest = require('./LabTest');
const LabCombo = require('./LabCombo');

// User - Role
Role.hasMany(User, { foreignKey: 'roleId' });
User.belongsTo(Role, { foreignKey: 'roleId' });

// Department - Specialty
Department.hasMany(Specialty, { foreignKey: 'departmentId' });
Specialty.belongsTo(Department, { foreignKey: 'departmentId' });

// Doctor - Specialty
Specialty.hasMany(Doctor, { foreignKey: 'specialtyId' });
Doctor.belongsTo(Specialty, { foreignKey: 'specialtyId' });

// User - Profile Associations
User.hasOne(Doctor, { foreignKey: 'userId', onDelete: 'CASCADE' });
Doctor.belongsTo(User, { foreignKey: 'userId' });

// Doctor belongs to Organization
Organization.hasMany(Doctor, { foreignKey: 'organizationId' });
Doctor.belongsTo(Organization, { foreignKey: 'organizationId' });

User.hasOne(Nurse, { foreignKey: 'userId', onDelete: 'CASCADE' });
Nurse.belongsTo(User, { foreignKey: 'userId' });

// Nurse belongs to Organization
Organization.hasMany(Nurse, { foreignKey: 'organizationId' });
Nurse.belongsTo(Organization, { foreignKey: 'organizationId' });

User.hasOne(Staff, { foreignKey: 'userId', onDelete: 'CASCADE' });
Staff.belongsTo(User, { foreignKey: 'userId' });

// Staff belongs to Organization
Organization.hasMany(Staff, { foreignKey: 'organizationId' });
Staff.belongsTo(Organization, { foreignKey: 'organizationId' });

User.hasOne(Patient, { foreignKey: 'userId', onDelete: 'CASCADE' });
Patient.belongsTo(User, { foreignKey: 'userId' });

// Patient belongs to Organization (multi-tenant)
Organization.hasMany(Patient, { foreignKey: 'organizationId' });
Patient.belongsTo(Organization, { foreignKey: 'organizationId' });

// Clinical Associations
Patient.hasMany(MedicalRecord, { foreignKey: 'patientId' });
MedicalRecord.belongsTo(Patient, { foreignKey: 'patientId' });

Doctor.hasMany(MedicalRecord, { foreignKey: 'doctorId' });
MedicalRecord.belongsTo(Doctor, { foreignKey: 'doctorId' });

Patient.hasMany(LabResult, { foreignKey: 'patientId' });
LabResult.belongsTo(Patient, { foreignKey: 'patientId' });

MedicalRecord.hasMany(Prescription, { foreignKey: 'medicalRecordId', as: 'prescriptions' });
Prescription.belongsTo(MedicalRecord, { foreignKey: 'medicalRecordId' });

Drug.hasMany(Prescription, { foreignKey: 'drugId' });
Prescription.belongsTo(Drug, { foreignKey: 'drugId', as: 'drug' });

// Payment Associations
Patient.hasMany(Payment, { foreignKey: 'patientId' });
Payment.belongsTo(Patient, { foreignKey: 'patientId' });

Organization.hasMany(Payment, { foreignKey: 'organizationId' });
Payment.belongsTo(Organization, { foreignKey: 'organizationId' });

Appointment.hasOne(Payment, { foreignKey: 'appointmentId' });
Payment.belongsTo(Appointment, { foreignKey: 'appointmentId' });

// Appointment links
Doctor.hasMany(Appointment, { foreignKey: 'doctorId' });
Appointment.belongsTo(Doctor, { foreignKey: 'doctorId' });

Patient.hasMany(Appointment, { foreignKey: 'patientId' });
Appointment.belongsTo(Patient, { foreignKey: 'patientId' });

// VideoConsultation Associations
User.hasMany(VideoConsultation, { as: 'doctorConsultations', foreignKey: 'doctorId' });
User.hasMany(VideoConsultation, { as: 'patientConsultations', foreignKey: 'patientId' });

VideoConsultation.belongsTo(User, { as: 'doctor', foreignKey: 'doctorId' });
VideoConsultation.belongsTo(User, { as: 'patient', foreignKey: 'patientId' });
VideoConsultation.belongsTo(Appointment, { foreignKey: 'appointmentId' });

Appointment.hasOne(VideoConsultation, { foreignKey: 'appointmentId' });

// Organization Associations
User.belongsTo(Organization, { foreignKey: 'organizationId' });
Organization.hasMany(User, { foreignKey: 'organizationId' });
Organization.belongsTo(User, { as: 'owner', foreignKey: 'ownerId' });

// Laboratory Catalog Associations
LabCombo.belongsToMany(LabTest, { 
  through: 'LabComboTests', 
  foreignKey: 'comboId',
  otherKey: 'testId',
  as: 'tests'
});
LabTest.belongsToMany(LabCombo, { 
  through: 'LabComboTests', 
  foreignKey: 'testId',
  otherKey: 'comboId',
  as: 'combos'
});

// Global Aisolation Hook (SaaS Multi-tenant)
const context = require('../utils/context');
const logger = require('../utils/logger');
const AuditTrail = require('../utils/auditTrail');

/**
 * Automatically inject organizationId filter into all queries
 * Excludes SUPERADMIN or explicit unscoped queries
 */
sequelize.addHook('beforeFind', (options) => {
  const orgId = context.getOrgId();
  const role = context.getRole();

  // Skip if no orgId in context or user is Super Admin
  if (!orgId || role === 'SUPERADMIN' || role === 'SUPER_ADMIN') {
    return;
  }

  // Ensure 'where' exists
  options.where = options.where || {};

  // If the model has an 'organizationId' attribute, inject it
  const modelName = options.model?.name;
  if (options.model?.rawAttributes?.organizationId) {
    // Merge filters
    if (typeof options.where.organizationId === 'undefined') {
       options.where.organizationId = orgId;
       logger.debug({ model: modelName, orgId }, 'Global Scope: Injected organizationId');
    }
  }
});

/**
 * 🔒 AUTOMATED AUDIT TRAIL HOOKS (ISO 27001 Compliance)
 * Captures all critical changes without manual controller intervention.
 */
const modelsToAudit = ['User', 'Patient', 'Doctor', 'Appointment', 'MedicalRecord', 'Payment', 'Organization', 'Nurse', 'Staff', 'Prescription'];

modelsToAudit.forEach(modelName => {
  const model = sequelize.models[modelName];
  if (!model) return;

  // AFTER CREATE
  model.addHook('afterCreate', async (instance, options) => {
    await AuditTrail.log(modelName, 'CREATE', {
      entityId: instance.id,
      newValues: instance.toJSON()
    });
  });

  // AFTER UPDATE
  model.addHook('afterUpdate', async (instance, options) => {
    const oldValues = instance._previousDataValues;
    const newValues = instance.get();
    const changes = AuditTrail.getChanges(oldValues, newValues);

    // Only log if there are actual changes
    if (Object.keys(changes).length > 0) {
      await AuditTrail.log(modelName, 'UPDATE', {
        entityId: instance.id,
        oldValues,
        newValues,
        details: { changes }
      });
    }
  });

  // AFTER DESTROY
  model.addHook('afterDestroy', async (instance, options) => {
    await AuditTrail.log(modelName, 'DELETE', {
      entityId: instance.id,
      oldValues: instance.toJSON()
    });
  });
});


module.exports = {
  User,
  Role,
  Department,
  Specialty,
  Doctor,
  Patient,
  Nurse,
  Staff,
  Appointment,
  MedicalRecord,
  LabResult,
  Payment,
  VideoConsultation,
  Organization,
  AuditLog,
  Drug,
  Prescription,
  LabTest,
  LabCombo,
  sequelize
};
