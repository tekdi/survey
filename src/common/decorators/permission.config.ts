/**
 * List of permissions in the survey service.
 * These are checked against the RBAC token's userData.privileges.
 */
export const PERMISSIONS = {
  // Survey
  SURVEY_CREATE: 'survey.create',
  SURVEY_READ: 'survey.read',
  SURVEY_UPDATE: 'survey.update',
  SURVEY_DELETE: 'survey.delete',
  SURVEY_PUBLISH: 'survey.publish',
  SURVEY_CLOSE: 'survey.close',

  // Response
  RESPONSE_CREATE: 'response.create',
  RESPONSE_READ: 'response.read',
  RESPONSE_UPDATE: 'response.update',
  RESPONSE_SUBMIT: 'response.submit',
  RESPONSE_STATS: 'response.stats',

  // File Upload
  FILE_UPLOAD: 'file.upload',
  FILE_READ: 'file.read',
  FILE_DELETE: 'file.delete',
};
