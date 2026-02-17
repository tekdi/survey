-- ============================================
-- MIGRATION 001: Initial Schema
-- Survey Service - Full Database Setup
-- ============================================

BEGIN;

-- ============================================
-- EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TENANTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS tenants (
    tenant_id VARCHAR(50) PRIMARY KEY,
    tenant_name VARCHAR(255) NOT NULL,
    domain VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TENANT STORAGE QUOTA
-- ============================================
CREATE TABLE IF NOT EXISTS tenant_storage_quota (
    tenant_id VARCHAR(50) PRIMARY KEY REFERENCES tenants(tenant_id),
    max_storage_bytes BIGINT DEFAULT 10737418240,       -- 10 GB
    current_storage_bytes BIGINT DEFAULT 0,
    max_file_size_bytes BIGINT DEFAULT 104857600,       -- 100 MB
    allowed_image_types VARCHAR(50)[] DEFAULT ARRAY['jpg','jpeg','png','gif','webp'],
    allowed_video_types VARCHAR(50)[] DEFAULT ARRAY['mp4','mov','webm','avi'],
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SURVEY MASTER
-- ============================================
CREATE TABLE IF NOT EXISTS survey_master (
    survey_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(50) NOT NULL REFERENCES tenants(tenant_id),
    survey_title VARCHAR(255) NOT NULL,
    survey_description TEXT,
    status VARCHAR(20) DEFAULT 'draft'
        CHECK (status IN ('draft', 'published', 'closed', 'archived')),
    survey_type VARCHAR(50),
    settings JSONB DEFAULT '{}',
    theme JSONB DEFAULT '{}',
    created_by UUID NOT NULL,
    version INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ
);

CREATE INDEX idx_survey_tenant ON survey_master(tenant_id);
CREATE INDEX idx_survey_status ON survey_master(status);
CREATE INDEX idx_survey_created_by ON survey_master(created_by);

-- RLS
ALTER TABLE survey_master ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_survey ON survey_master
    USING (tenant_id = current_setting('app.current_tenant_id', TRUE));

-- ============================================
-- SURVEY SECTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS survey_sections (
    section_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_id UUID NOT NULL REFERENCES survey_master(survey_id) ON DELETE CASCADE,
    tenant_id VARCHAR(50) NOT NULL REFERENCES tenants(tenant_id),
    section_title VARCHAR(255) NOT NULL,
    section_description TEXT,
    display_order INTEGER DEFAULT 0,
    is_visible BOOLEAN DEFAULT TRUE,
    conditional_logic JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_section_survey ON survey_sections(survey_id);
CREATE INDEX idx_section_order ON survey_sections(survey_id, display_order);

ALTER TABLE survey_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_sections ON survey_sections
    USING (tenant_id = current_setting('app.current_tenant_id', TRUE));

-- ============================================
-- SURVEY FIELDS (QUESTIONS)
-- ============================================
CREATE TABLE IF NOT EXISTS survey_fields (
    field_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID NOT NULL REFERENCES survey_sections(section_id) ON DELETE CASCADE,
    survey_id UUID NOT NULL REFERENCES survey_master(survey_id) ON DELETE CASCADE,
    tenant_id VARCHAR(50) NOT NULL REFERENCES tenants(tenant_id),
    field_name VARCHAR(100) NOT NULL,
    field_label VARCHAR(255) NOT NULL,
    field_type VARCHAR(30) NOT NULL
        CHECK (field_type IN (
            'text', 'textarea', 'number', 'email', 'phone',
            'date', 'time', 'datetime',
            'select', 'multi_select', 'radio', 'checkbox',
            'rating', 'scale',
            'image_upload', 'video_upload', 'file_upload',
            'signature', 'location', 'matrix'
        )),
    is_required BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    placeholder TEXT,
    help_text TEXT,
    default_value JSONB,
    validations JSONB DEFAULT '{}',
    data_source JSONB,
    upload_config JSONB,
    ui_config JSONB DEFAULT '{}',
    conditional_logic JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_field_section ON survey_fields(section_id);
CREATE INDEX idx_field_survey ON survey_fields(survey_id);
CREATE INDEX idx_field_order ON survey_fields(section_id, display_order);

ALTER TABLE survey_fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_fields ON survey_fields
    USING (tenant_id = current_setting('app.current_tenant_id', TRUE));

-- ============================================
-- SURVEY RESPONSES
-- ============================================
CREATE TABLE IF NOT EXISTS survey_response (
    response_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(50) NOT NULL REFERENCES tenants(tenant_id),
    survey_id UUID NOT NULL REFERENCES survey_master(survey_id),
    respondent_id UUID,
    status VARCHAR(20) DEFAULT 'in_progress'
        CHECK (status IN ('in_progress', 'submitted', 'reviewed')),
    response_data JSONB DEFAULT '{}',
    response_metadata JSONB DEFAULT '{}',
    file_upload_ids JSONB DEFAULT '{}',
    submission_version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_at TIMESTAMPTZ
);

CREATE INDEX idx_response_tenant ON survey_response(tenant_id);
CREATE INDEX idx_response_survey ON survey_response(survey_id);
CREATE INDEX idx_response_respondent ON survey_response(respondent_id);
CREATE INDEX idx_response_status ON survey_response(status);
CREATE INDEX idx_response_files ON survey_response USING GIN(file_upload_ids);

ALTER TABLE survey_response ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_response ON survey_response
    USING (tenant_id = current_setting('app.current_tenant_id', TRUE));

-- ============================================
-- FILE UPLOADS
-- ============================================
CREATE TABLE IF NOT EXISTS survey_file_uploads (
    file_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(50) NOT NULL REFERENCES tenants(tenant_id),
    survey_id UUID NOT NULL REFERENCES survey_master(survey_id),
    response_id UUID REFERENCES survey_response(response_id),
    field_id VARCHAR(100) NOT NULL,

    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_type VARCHAR(20) NOT NULL
        CHECK (file_type IN ('image', 'video')),

    -- Image metadata
    image_width INTEGER,
    image_height INTEGER,
    image_thumbnail_path TEXT,

    -- Video metadata
    video_duration INTEGER,
    video_thumbnail_path TEXT,
    video_codec VARCHAR(50),

    -- Processing
    status VARCHAR(20) DEFAULT 'uploading'
        CHECK (status IN ('uploading', 'processing', 'completed', 'failed', 'deleted')),
    processing_error TEXT,

    -- Security
    virus_scan_status VARCHAR(20) DEFAULT 'pending'
        CHECK (virus_scan_status IN ('pending', 'clean', 'infected', 'skipped')),
    virus_scan_at TIMESTAMPTZ,

    -- Access
    access_url TEXT,
    access_url_expires_at TIMESTAMPTZ,

    -- Audit
    uploaded_by UUID NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_file_tenant ON survey_file_uploads(tenant_id);
CREATE INDEX idx_file_survey ON survey_file_uploads(survey_id);
CREATE INDEX idx_file_response ON survey_file_uploads(response_id);
CREATE INDEX idx_file_field ON survey_file_uploads(field_id);
CREATE INDEX idx_file_status ON survey_file_uploads(status) WHERE status != 'deleted';
CREATE INDEX idx_file_uploaded_by ON survey_file_uploads(uploaded_by);
CREATE INDEX idx_file_deleted ON survey_file_uploads(deleted_at) WHERE deleted_at IS NOT NULL;

ALTER TABLE survey_file_uploads ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_files ON survey_file_uploads
    USING (tenant_id = current_setting('app.current_tenant_id', TRUE));

-- ============================================
-- STORAGE QUOTA TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_tenant_storage()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'completed' THEN
        UPDATE tenant_storage_quota
        SET current_storage_bytes = current_storage_bytes + NEW.file_size,
            updated_at = NOW()
        WHERE tenant_id = NEW.tenant_id;
    ELSIF TG_OP = 'UPDATE' AND NEW.status = 'completed' AND OLD.status != 'completed' THEN
        UPDATE tenant_storage_quota
        SET current_storage_bytes = current_storage_bytes + NEW.file_size,
            updated_at = NOW()
        WHERE tenant_id = NEW.tenant_id;
    ELSIF TG_OP = 'UPDATE' AND NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
        UPDATE tenant_storage_quota
        SET current_storage_bytes = GREATEST(0, current_storage_bytes - OLD.file_size),
            updated_at = NOW()
        WHERE tenant_id = OLD.tenant_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE tenant_storage_quota
        SET current_storage_bytes = GREATEST(0, current_storage_bytes - OLD.file_size),
            updated_at = NOW()
        WHERE tenant_id = OLD.tenant_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_storage
AFTER INSERT OR UPDATE OR DELETE ON survey_file_uploads
FOR EACH ROW
EXECUTE FUNCTION update_tenant_storage();

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_tenants BEFORE UPDATE ON tenants
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_surveys BEFORE UPDATE ON survey_master
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_sections BEFORE UPDATE ON survey_sections
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_fields BEFORE UPDATE ON survey_fields
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_responses BEFORE UPDATE ON survey_response
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_files BEFORE UPDATE ON survey_file_uploads
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMIT;
