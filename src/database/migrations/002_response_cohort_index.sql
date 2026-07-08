-- ============================================
-- MIGRATION 002: Response Cohort Index
-- Survey Service - Teacher Survey Completion Dashboard (PS-6833)
-- ============================================
-- SurveyResponses.responseMetadata (JSONB) gains an optional "cohortId" key,
-- set when a teacher fills a response on behalf of a learner in a batch.
-- No column is added -- cohortId only applies to batch-context responses,
-- not every survey response. This expression index keeps lookups on that
-- key as cheap as a real column without widening the schema for all rows.

BEGIN;

CREATE INDEX IF NOT EXISTS idx_response_survey_cohort
    ON "SurveyResponses" ("surveyId", (("responseMetadata" ->> 'cohortId')));

COMMIT;
