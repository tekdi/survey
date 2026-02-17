/**
 * Kafka topic and event type configuration for reporting service integration.
 * Matches shiksha-reports event-driven pattern.
 */
export const REPORT_KAFKA_CONFIG = {
  topic: process.env.KAFKA_SURVEY_TOPIC || 'survey-events',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  clientId: process.env.KAFKA_CLIENT_ID || 'survey-service',
  groupId: process.env.KAFKA_GROUP_ID || 'survey-service-group',
};

/**
 * Event types emitted by the survey service.
 * These are consumed by shiksha-reports to populate survey reporting tables.
 */
export enum SurveyEventType {
  // Survey lifecycle
  SURVEY_CREATED = 'SURVEY_CREATED',
  SURVEY_UPDATED = 'SURVEY_UPDATED',
  SURVEY_PUBLISHED = 'SURVEY_PUBLISHED',
  SURVEY_CLOSED = 'SURVEY_CLOSED',
  SURVEY_DELETED = 'SURVEY_DELETED',

  // Response lifecycle
  RESPONSE_STARTED = 'RESPONSE_STARTED',
  RESPONSE_UPDATED = 'RESPONSE_UPDATED',
  RESPONSE_SUBMITTED = 'RESPONSE_SUBMITTED',

  // File upload
  FILE_UPLOADED = 'FILE_UPLOADED',
  FILE_DELETED = 'FILE_DELETED',
}
