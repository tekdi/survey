export const RESPONSE_MESSAGES = {
  // Survey
  SURVEY_CREATE_SUCCESS: 'Survey created successfully',
  SURVEY_READ_SUCCESS: 'Survey fetched successfully',
  SURVEY_LIST_SUCCESS: 'Surveys fetched successfully',
  SURVEY_UPDATE_SUCCESS: 'Survey updated successfully',
  SURVEY_DELETE_SUCCESS: 'Survey deleted successfully',
  SURVEY_PUBLISH_SUCCESS: 'Survey published successfully',
  SURVEY_CLOSE_SUCCESS: 'Survey closed successfully',
  SURVEY_DUPLICATE_SUCCESS: 'Survey duplicated successfully',
  SURVEY_NOT_FOUND: 'Survey not found',
  SURVEY_CANNOT_UPDATE: 'Cannot update a closed or archived survey',
  SURVEY_CANNOT_PUBLISH: 'Only draft surveys can be published',
  SURVEY_CANNOT_CLOSE: 'Only published surveys can be closed',
  SURVEY_CANNOT_DELETE: 'Cannot delete a published survey. Close it first.',
  SURVEY_NEEDS_SECTION: 'Survey must have at least one section to publish',
  SURVEY_NEEDS_FIELD: 'Survey must have at least one field to publish',

  // Response
  RESPONSE_CREATE_SUCCESS: 'Response started successfully',
  RESPONSE_READ_SUCCESS: 'Response fetched successfully',
  RESPONSE_LIST_SUCCESS: 'Responses fetched successfully',
  RESPONSE_UPDATE_SUCCESS: 'Response updated successfully',
  RESPONSE_SUBMIT_SUCCESS: 'Response submitted successfully',
  RESPONSE_STATS_SUCCESS: 'Response statistics fetched successfully',
  RESPONSE_NOT_FOUND: 'Response not found',
  RESPONSE_ALREADY_SUBMITTED: 'Response already submitted',
  RESPONSE_NOT_ACCEPTING: 'Survey is not accepting responses',
  RESPONSE_DUPLICATE_SUBMISSION: 'You have already submitted a response to this survey',
  RESPONSE_CANNOT_UPDATE: 'Cannot update a submitted response',
  RESPONSE_VALIDATION_FAILED: 'Validation failed',

  // File Upload
  FILE_UPLOAD_SUCCESS: 'File uploaded successfully',
  FILE_READ_SUCCESS: 'File details fetched successfully',
  FILE_URL_SUCCESS: 'File URL generated successfully',
  FILE_DELETE_SUCCESS: 'File deleted successfully',
  FILE_NOT_FOUND: 'File not found',
  FILE_REQUIRED: 'File is required',
  FILE_QUOTA_EXCEEDED: 'Storage quota exceeded',

  // Common
  TENANTID_REQUIRED: 'tenantid header is required',
  TENANTID_INVALID: 'tenantid must be a valid UUID format',
  UNAUTHORIZED: 'Unauthorized access',
  INTERNAL_ERROR: 'Internal server error',
};
