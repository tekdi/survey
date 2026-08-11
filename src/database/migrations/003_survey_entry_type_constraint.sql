-- ============================================
-- MIGRATION 003: Survey Entry Type Constraint
-- Survey Service - Multi-Entry Survey Support
-- ============================================
-- "surveyType" is repurposed from a freeform category label (previously
-- unused by any query/filter in the codebase) into a strict single/multi
-- entry-type flag. Only 1-2 surveys exist in the live DB today; their
-- surveyType value must be set to 'single' or 'multi' manually BEFORE this
-- migration runs, or this ALTER TABLE will fail validation. No automated
-- backfill is included by design.

BEGIN;

ALTER TABLE "SurveyMaster"
    ADD CONSTRAINT chk_survey_type
    CHECK ("surveyType" IS NULL OR "surveyType" IN ('single', 'multi'));

COMMIT;
