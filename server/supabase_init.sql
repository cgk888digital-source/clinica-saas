-- MEDICUS - Supabase Initialization Script
-- Generated for clinica-saas-888

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUM Types
DO $$ BEGIN
    CREATE TYPE "enum_Users_accountType" AS ENUM('PATIENT', 'PROFESSIONAL', 'CLINIC', 'HOSPITAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "enum_Users_gender" AS ENUM('Male', 'Female', 'Other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "enum_Appointments_status" AS ENUM('scheduled', 'completed', 'cancelled', 'in-progress');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Core Tables
CREATE TABLE IF NOT EXISTS "Roles" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL UNIQUE,
    "description" VARCHAR(255),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Organizations" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) UNIQUE,
    "ownerId" UUID,
    "subscriptionStatus" VARCHAR(255) DEFAULT 'trial',
    "maxUsers" INTEGER DEFAULT 5,
    "maxPatients" INTEGER DEFAULT 100,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Users" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "username" VARCHAR(255) NOT NULL UNIQUE,
    "email" VARCHAR(255) NOT NULL UNIQUE,
    "password" VARCHAR(255) NOT NULL,
    "firstName" VARCHAR(255),
    "lastName" VARCHAR(255),
    "businessName" VARCHAR(255),
    "accountType" "enum_Users_accountType" DEFAULT 'PATIENT',
    "isActive" BOOLEAN DEFAULT true,
    "gender" "enum_Users_gender",
    "roleId" INTEGER REFERENCES "Roles"("id") ON DELETE SET NULL,
    "organizationId" UUID REFERENCES "Organizations"("id") ON DELETE SET NULL,
    "resetToken" VARCHAR(255),
    "resetExpires" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Departments" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL UNIQUE,
    "description" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Specialties" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL UNIQUE,
    "description" TEXT,
    "departmentId" INTEGER REFERENCES "Departments"("id") ON DELETE SET NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Doctors" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID REFERENCES "Users"("id") ON DELETE CASCADE,
    "specialtyId" INTEGER REFERENCES "Specialties"("id") ON DELETE SET NULL,
    "organizationId" UUID REFERENCES "Organizations"("id") ON DELETE SET NULL,
    "licenseNumber" VARCHAR(255),
    "bio" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Patients" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID REFERENCES "Users"("id") ON DELETE CASCADE,
    "organizationId" UUID REFERENCES "Organizations"("id") ON DELETE SET NULL,
    "documentId" VARCHAR(255),
    "phoneNumber" VARCHAR(255),
    "address" TEXT,
    "birthDate" DATE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Appointments" (
    "id" SERIAL PRIMARY KEY,
    "doctorId" UUID REFERENCES "Doctors"("id") ON DELETE SET NULL,
    "patientId" UUID REFERENCES "Patients"("id") ON DELETE CASCADE,
    "date" TIMESTAMP WITH TIME ZONE NOT NULL,
    "status" "enum_Appointments_status" DEFAULT 'scheduled',
    "reason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Drugs" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "genericName" VARCHAR(255),
  "presentation" VARCHAR(255),
  "concentration" VARCHAR(255),
  "description" TEXT,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Nurses" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID REFERENCES "Users"("id") ON DELETE CASCADE,
    "organizationId" UUID REFERENCES "Organizations"("id") ON DELETE SET NULL,
    "licenseNumber" VARCHAR(255),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Staff" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID REFERENCES "Users"("id") ON DELETE CASCADE,
    "organizationId" UUID REFERENCES "Organizations"("id") ON DELETE SET NULL,
    "position" VARCHAR(255),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "MedicalRecords" (
    "id" SERIAL PRIMARY KEY,
    "patientId" UUID REFERENCES "Patients"("id") ON DELETE CASCADE,
    "doctorId" UUID REFERENCES "Doctors"("id") ON DELETE SET NULL,
    "visitDate" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "symptoms" TEXT,
    "diagnosis" TEXT,
    "treatment" TEXT,
    "medicalLeaveDays" INTEGER DEFAULT 0,
    "medicalLeaveStartDate" DATE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Prescriptions" (
    "id" SERIAL PRIMARY KEY,
    "medicalRecordId" INTEGER REFERENCES "MedicalRecords"("id") ON DELETE CASCADE,
    "drugId" INTEGER REFERENCES "Drugs"("id") ON DELETE SET NULL,
    "dosage" VARCHAR(255),
    "frequency" VARCHAR(255),
    "duration" VARCHAR(255),
    "instructions" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "LabTests" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL UNIQUE,
    "description" TEXT,
    "price" DECIMAL(10, 2),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "LabCombos" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL UNIQUE,
    "description" TEXT,
    "price" DECIMAL(10, 2),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "LabComboTests" (
    "comboId" INTEGER REFERENCES "LabCombos"("id") ON DELETE CASCADE,
    "testId" INTEGER REFERENCES "LabTests"("id") ON DELETE CASCADE,
    PRIMARY KEY ("comboId", "testId"),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "LabResults" (
    "id" SERIAL PRIMARY KEY,
    "patientId" UUID REFERENCES "Patients"("id") ON DELETE CASCADE,
    "testId" INTEGER REFERENCES "LabTests"("id"),
    "result" TEXT,
    "notes" TEXT,
    "price" DECIMAL(10, 2),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Payments" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "patientId" UUID REFERENCES "Patients"("id") ON DELETE CASCADE,
    "organizationId" UUID REFERENCES "Organizations"("id"),
    "appointmentId" INTEGER REFERENCES "Appointments"("id") ON DELETE SET NULL,
    "amount" DECIMAL(10, 2) NOT NULL,
    "currency" VARCHAR(10) DEFAULT 'USD',
    "status" VARCHAR(50) DEFAULT 'pending',
    "paymentMethod" VARCHAR(50),
    "transactionId" VARCHAR(255),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "VideoConsultations" (
    "id" SERIAL PRIMARY KEY,
    "appointmentId" INTEGER REFERENCES "Appointments"("id") ON DELETE CASCADE,
    "doctorId" UUID REFERENCES "Users"("id"),
    "patientId" UUID REFERENCES "Users"("id"),
    "roomId" VARCHAR(255) UNIQUE NOT NULL,
    "status" VARCHAR(50) DEFAULT 'scheduled',
    "startTime" TIMESTAMP WITH TIME ZONE,
    "endTime" TIMESTAMP WITH TIME ZONE,
    "duration" INTEGER,
    "recordingUrl" VARCHAR(255),
    "notes" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "AuditLogs" (
    "id" SERIAL PRIMARY KEY,
    "userId" UUID,
    "action" VARCHAR(255),
    "entity" VARCHAR(255),
    "entityId" VARCHAR(255),
    "oldValue" JSONB,
    "newValue" JSONB,
    "ipAddress" VARCHAR(45),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Initial Seeds
INSERT INTO "Roles" (name, description) VALUES
('SUPERADMIN', 'Acceso total al sistema'),
('DOCTOR', 'Médicos con acceso a historial y consultas'),
('NURSE', 'Enfermería con acceso a signos vitales e indicaciones'),
('RECEPTIONIST', 'Gestión de citas y facturación'),
('ADMINISTRATIVE', 'Gestión administrativa y reportes'),
('PATIENT', 'Pacientes del sistema')
ON CONFLICT (name) DO NOTHING;
