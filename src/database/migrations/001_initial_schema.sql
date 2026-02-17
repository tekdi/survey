-- ============================================
-- MIGRATION 001: Initial Schema
-- Survey Service - Full Database Setup
-- Column naming: camelCase (matches user-microservice convention)
-- NOTE: Tenant details managed by user-microservice.
--       tenantId is stored as a simple UUID column here.
-- ============================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- SURVEY MASTER
-- ============================================
CREATE TABLE IF NOT EXISTS "SurveyMaster" (
    "surveyId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL,
    "surveyTitle" VARCHAR(255) NOT NULL,
    "surveyDescription" TEXT,
    "status" VARCHAR(20) DEFAULT 'draft'
        CHECK ("status" IN ('draft', 'published', 'closed', 'archived')),
    "surveyType" VARCHAR(50),
    "settings" JSONB DEFAULT '{}',
    "theme" JSONB DEFAULT '{}',
    "createdBy" UUID NOT NULL,
    "updatedBy" UUID,
    "version" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
    "publishedAt" TIMESTAMPTZ,
    "closedAt" TIMESTAMPTZ
);

CREATE INDEX idx_survey_tenant ON "SurveyMaster"("tenantId");
CREATE INDEX idx_survey_status ON "SurveyMaster"("status");
CREATE INDEX idx_survey_created_by ON "SurveyMaster"("createdBy");

-- ============================================
-- SURVEY SECTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS "SurveySections" (
    "sectionId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "surveyId" UUID NOT NULL REFERENCES "SurveyMaster"("surveyId") ON DELETE CASCADE,
    "tenantId" UUID NOT NULL,
    "sectionTitle" VARCHAR(255) NOT NULL,
    "sectionDescription" TEXT,
    "displayOrder" INTEGER DEFAULT 0,
    "isVisible" BOOLEAN DEFAULT TRUE,
    "conditionalLogic" JSONB,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_section_survey ON "SurveySections"("surveyId");
CREATE INDEX idx_section_order ON "SurveySections"("surveyId", "displayOrder");

-- ============================================
-- SURVEY FIELDS (QUESTIONS)
-- ============================================
CREATE TABLE IF NOT EXISTS "SurveyFields" (
    "fieldId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "sectionId" UUID NOT NULL REFERENCES "SurveySections"("sectionId") ON DELETE CASCADE,
    "surveyId" UUID NOT NULL REFERENCES "SurveyMaster"("surveyId") ON DELETE CASCADE,
    "tenantId" UUID NOT NULL,
    "fieldName" VARCHAR(100) NOT NULL,
    "fieldLabel" VARCHAR(255) NOT NULL,
    "fieldType" VARCHAR(30) NOT NULL,
    "isRequired" BOOLEAN DEFAULT FALSE,
    "displayOrder" INTEGER DEFAULT 0,
    "placeholder" TEXT,
    "helpText" TEXT,
    "defaultValue" JSONB,
    "validations" JSONB DEFAULT '{}',
    "dataSource" JSONB,
    "uploadConfig" JSONB,
    "uiConfig" JSONB DEFAULT '{}',
    "conditionalLogic" JSONB,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_field_section ON "SurveyFields"("sectionId");
CREATE INDEX idx_field_survey ON "SurveyFields"("surveyId");
CREATE INDEX idx_field_order ON "SurveyFields"("sectionId", "displayOrder");

-- ============================================
-- SURVEY RESPONSES
-- ============================================
CREATE TABLE IF NOT EXISTS "SurveyResponses" (
    "responseId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL,
    "surveyId" UUID NOT NULL REFERENCES "SurveyMaster"("surveyId"),
    "respondentId" UUID,
    "status" VARCHAR(20) DEFAULT 'in_progress'
        CHECK ("status" IN ('in_progress', 'submitted', 'reviewed')),
    "responseData" JSONB DEFAULT '{}',
    "responseMetadata" JSONB DEFAULT '{}',
    "fileUploadIds" JSONB DEFAULT '{}',
    "submissionVersion" INTEGER DEFAULT 1,
    "createdBy" UUID,
    "updatedBy" UUID,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
    "submittedAt" TIMESTAMPTZ
);

CREATE INDEX idx_response_tenant ON "SurveyResponses"("tenantId");
CREATE INDEX idx_response_survey ON "SurveyResponses"("surveyId");
CREATE INDEX idx_response_respondent ON "SurveyResponses"("respondentId");
CREATE INDEX idx_response_status ON "SurveyResponses"("status");
CREATE INDEX idx_response_files ON "SurveyResponses" USING GIN("fileUploadIds");

-- ============================================
-- FILE UPLOADS
-- ============================================
CREATE TABLE IF NOT EXISTS "SurveyFileUploads" (
    "fileId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL,
    "surveyId" UUID NOT NULL REFERENCES "SurveyMaster"("surveyId"),
    "responseId" UUID REFERENCES "SurveyResponses"("responseId"),
    "fieldId" VARCHAR(100) NOT NULL,
    "originalFilename" VARCHAR(255) NOT NULL,
    "storedFilename" VARCHAR(255) NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" BIGINT NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "fileType" VARCHAR(20) NOT NULL CHECK ("fileType" IN ('image', 'video')),
    "imageWidth" INTEGER,
    "imageHeight" INTEGER,
    "imageThumbnailPath" TEXT,
    "videoDuration" INTEGER,
    "videoThumbnailPath" TEXT,
    "videoCodec" VARCHAR(50),
    "status" VARCHAR(20) DEFAULT 'uploading'
        CHECK ("status" IN ('uploading', 'processing', 'completed', 'failed', 'deleted')),
    "processingError" TEXT,
    "virusScanStatus" VARCHAR(20) DEFAULT 'pending'
        CHECK ("virusScanStatus" IN ('pending', 'clean', 'infected', 'skipped')),
    "virusScanAt" TIMESTAMPTZ,
    "accessUrl" TEXT,
    "accessUrlExpiresAt" TIMESTAMPTZ,
    "uploadedBy" UUID NOT NULL,
    "createdBy" UUID,
    "updatedBy" UUID,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
    "deletedAt" TIMESTAMPTZ
);

CREATE INDEX idx_file_tenant ON "SurveyFileUploads"("tenantId");
CREATE INDEX idx_file_survey ON "SurveyFileUploads"("surveyId");
CREATE INDEX idx_file_response ON "SurveyFileUploads"("responseId");
CREATE INDEX idx_file_field ON "SurveyFileUploads"("fieldId");
CREATE INDEX idx_file_status ON "SurveyFileUploads"("status") WHERE "status" != 'deleted';
CREATE INDEX idx_file_uploaded_by ON "SurveyFileUploads"("uploadedBy");

-- ============================================
-- REPORTING TABLES (mirrored for shiksha-reports)
-- These tables are populated via Kafka events from this service.
-- They can be in the same DB or a separate reporting DB.
-- ============================================
CREATE TABLE IF NOT EXISTS "SurveyTracker" (
    "surveyId" UUID PRIMARY KEY,
    "tenantId" UUID NOT NULL,
    "surveyTitle" VARCHAR(255),
    "status" VARCHAR(20),
    "surveyType" VARCHAR(50),
    "totalResponses" INTEGER DEFAULT 0,
    "submittedResponses" INTEGER DEFAULT 0,
    "createdBy" UUID,
    "createdAt" TIMESTAMPTZ,
    "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
    "publishedAt" TIMESTAMPTZ,
    "closedAt" TIMESTAMPTZ
);

CREATE INDEX idx_survey_tracker_tenant ON "SurveyTracker"("tenantId");

CREATE TABLE IF NOT EXISTS "SurveyResponseTracker" (
    "responseId" UUID PRIMARY KEY,
    "surveyId" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "respondentId" UUID,
    "status" VARCHAR(20),
    "submittedAt" TIMESTAMPTZ,
    "timeSpentSeconds" INTEGER,
    "fileCount" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMPTZ,
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_response_tracker_survey ON "SurveyResponseTracker"("surveyId");
CREATE INDEX idx_response_tracker_tenant ON "SurveyResponseTracker"("tenantId");

COMMIT;
