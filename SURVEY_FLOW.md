# Complete Flow: Consent Form Survey

## Phase 1: Admin Creates the Survey

### API Call
**`POST /survey`** — handled by `SurveyController.create()` → `SurveyService.create()`

### Request Body
```json
{
  "survey_title": "Student Consent Form",
  "survey_description": "Teachers collect consent from parents for each student",
  "survey_type": "consent_form",
  "target_roles": ["teacher", "team_leader"],
  "context_type": "learner",
  "settings": {
    "allowMultipleSubmissions": true,
    "isAnonymous": false
  },
  "theme": {
    "primaryColor": "#1976d2"
  },
  "sections": [
    {
      "section_title": "Consent Details",
      "section_description": "Please fill consent info for each student",
      "display_order": 0,
      "is_visible": true,
      "fields": [
        {
          "field_name": "student_name",
          "field_label": "Student Name",
          "field_type": "text",
          "is_required": true,
          "display_order": 0,
          "placeholder": "Enter student's full name",
          "validations": {
            "minLength": 2,
            "maxLength": 100
          }
        },
        {
          "field_name": "consent_taken",
          "field_label": "Consent Taken",
          "field_type": "radio",
          "is_required": true,
          "display_order": 1,
          "help_text": "Has the parent given consent?",
          "data_source": {
            "type": "static",
            "options": [
              { "value": "yes", "label": "Yes" },
              { "value": "no", "label": "No" }
            ]
          }
        },
        {
          "field_name": "consent_upload",
          "field_label": "Upload Consent Document",
          "field_type": "image_upload",
          "is_required": false,
          "display_order": 2,
          "help_text": "Upload signed consent form (photo/scan)",
          "upload_config": {
            "maxFileSize": 5242880,
            "allowedTypes": ["image/jpeg", "image/png", "application/pdf"]
          }
        }
      ]
    }
  ]
}
```

### What Happens in the Database (Transaction)

**Step 1:** Insert into `SurveyMaster`

```
┌─────────────────────────────────────────────────────────────┐
│ SurveyMaster                                                │
├──────────────┬──────────────────────────────────────────────┤
│ surveyId     │ "aaa-111-bbb" (auto-generated UUID)         │
│ tenantId     │ "tenant-xyz" (from auth token/header)       │
│ surveyTitle  │ "Student Consent Form"                      │
│ status       │ "draft"                                      │
│ surveyType   │ "consent_form"                               │
│ targetRoles  │ ["teacher", "team_leader"]                   │
│ contextType  │ "learner"                                    │
│ settings     │ { allowMultipleSubmissions: true, ... }      │
│ createdBy    │ "admin-user-id"                              │
│ version      │ 0                                            │
└──────────────┴──────────────────────────────────────────────┘
```

**Step 2:** Insert into `SurveySections`

```
┌─────────────────────────────────────────────────────────────┐
│ SurveySections                                              │
├──────────────┬──────────────────────────────────────────────┤
│ sectionId    │ "sec-111" (auto UUID)                       │
│ surveyId     │ "aaa-111-bbb" (FK → SurveyMaster)          │
│ tenantId     │ "tenant-xyz"                                │
│ sectionTitle │ "Consent Details"                            │
│ displayOrder │ 0                                            │
└──────────────┴──────────────────────────────────────────────┘
```

**Step 3:** Insert 3 rows into `SurveyFields`

```
┌──────────────────────────────────────────────────────────────────────────┐
│ SurveyFields (3 rows)                                                    │
├───────────┬──────────────────┬─────────────┬────────────┬───────────────┤
│ fieldId   │ fieldName        │ fieldType   │ isRequired │ dataSource    │
├───────────┼──────────────────┼─────────────┼────────────┼───────────────┤
│ "fld-001" │ "student_name"   │ "text"      │ true       │ null          │
│ "fld-002" │ "consent_taken"  │ "radio"     │ true       │ {static opts} │
│ "fld-003" │ "consent_upload" │ "image_upload"│ false    │ null          │
└───────────┴──────────────────┴─────────────┴────────────┴───────────────┘
```

**Step 4:** Kafka event `SURVEY_CREATED` published → shiksha-reports consumes it.

### API Response
```json
{
  "id": "api.survey.create",
  "params": { "status": "successful" },
  "result": {
    "data": {
      "surveyId": "aaa-111-bbb",
      "surveyTitle": "Student Consent Form",
      "status": "draft",
      "sections": [
        {
          "sectionId": "sec-111",
          "sectionTitle": "Consent Details",
          "fields": [
            { "fieldId": "fld-001", "fieldName": "student_name", "fieldType": "text" },
            { "fieldId": "fld-002", "fieldName": "consent_taken", "fieldType": "radio", "options": ["..."] },
            { "fieldId": "fld-003", "fieldName": "consent_upload", "fieldType": "image_upload" }
          ]
        }
      ]
    }
  }
}
```

---

## Phase 2: Admin Publishes the Survey

### API Call
**`PATCH /survey/:surveyId/publish`** → `SurveyService.publish()`

### What Happens
- Validates: must be in `draft` status, must have at least 1 section with 1 field
- Updates `SurveyMaster.status` → `"published"`, sets `publishedAt`
- Kafka event `SURVEY_PUBLISHED`

```
SurveyMaster:  status = "published",  publishedAt = "2026-03-05T10:00:00Z"
```

---

## Phase 3: Frontend — Teacher Gets the Survey List & Opens a Survey

### Step 3a: Get List of Available Surveys

**`POST /surveys/list`** → `SurveyService.findAll()`

The frontend **first** calls the list API to show available surveys. It does NOT know any `surveyId` upfront.

**Request:**
```json
{
  "page": 1,
  "limit": 20,
  "sortBy": "createdAt",
  "sortOrder": "DESC"
}
```
**Headers:** `tenantid: tenant-xyz` + `Authorization: Bearer <token>` + `rbac_token: <rbac_jwt>`

**What Happens (Role-Based Filtering):**
- Backend extracts user roles from `rbac_token` header (e.g. `["teacher"]`)
- If user is **admin** → `WHERE tenantId = 'tenant-xyz'` (sees ALL surveys)
- If user is **teacher** → `WHERE tenantId = 'tenant-xyz' AND (targetRoles IS NULL OR targetRoles ?| ARRAY['teacher'])`
- If user has **no roles** → only sees surveys with `targetRoles IS NULL`
- Returns a paginated list (no sections/fields — just survey metadata)

**Response:**
```json
{
  "id": "api.survey.list",
  "params": { "status": "successful" },
  "result": {
    "data": {
      "data": [
        {
          "surveyId": "aaa-111-bbb",
          "surveyTitle": "Student Consent Form",
          "status": "published",
          "surveyType": "consent_form",
          "createdAt": "2026-03-05T09:00:00Z",
          "publishedAt": "2026-03-05T10:00:00Z"
        },
        {
          "surveyId": "ccc-222-ddd",
          "surveyTitle": "Teacher Feedback Form",
          "status": "published",
          "surveyType": "feedback",
          "createdAt": "2026-03-01T08:00:00Z",
          "publishedAt": "2026-03-02T10:00:00Z"
        }
      ],
      "total": 2,
      "page": 1,
      "limit": 20
    }
  }
}
```

**Frontend renders a Survey List page:**
```
┌──────────────────────────────────────────────────┐
│  Available Surveys                                │
├──────────────────────────────────────────────────┤
│                                                  │
│  📋 Student Consent Form                         │
│     Status: Published  |  Created: 5 Mar 2026    │
│     [Open →]                                     │
│                                                  │
│  📋 Teacher Feedback Form                        │
│     Status: Published  |  Created: 1 Mar 2026    │
│     [Open →]                                     │
│                                                  │
└──────────────────────────────────────────────────┘
```

**When teacher clicks "Open →"** the frontend now has the `surveyId` (`aaa-111-bbb`) and navigates to the form page.

### Step 3b: Fetch Full Survey Form by ID

**`GET /surveys/read/:surveyId`** → `SurveyService.findOne()` → `getSurveyWithRelations()`

### What Happens Internally

```
1. Query SurveyMaster + JOIN SurveySections + JOIN SurveyFields
   (ordered by displayOrder)

2. For each field that has a "dataSource":
   → DataSourceService.fetchFieldOptions() is called
   → For "consent_taken" field (type: static) → returns options directly
   → For API-type fields → calls external API, caches in Redis

3. Returns the full survey structure with options populated
```

### Frontend Renders the Form

The frontend reads the response and dynamically builds the form:

```
┌──────────────────────────────────────────────┐
│ Student Consent Form                          │
│ "Teachers collect consent from parents..."    │
├──────────────────────────────────────────────┤
│                                              │
│ Section: Consent Details                      │
│                                              │
│ Student Name *          [_______________]     │
│                                              │
│ Consent Taken *         ◉ Yes  ○ No          │
│                                              │
│ Upload Consent Document [📎 Choose File]     │
│                                              │
│              [Save Draft]  [Submit]           │
└──────────────────────────────────────────────┘
```

The frontend logic:
```
fieldType → Component mapping:
  "text"         → <input type="text">
  "radio"        → <RadioGroup> (uses field.options from dataSource)
  "image_upload" → <FileUpload> (uses field.uploadConfig for validation)
```

---

## Phase 4: Teacher Starts Filling (for Student 1)

### Step 4a: Create Response (with contextId)

**`POST /response`** → `ResponseService.create()`

Since `contextType: "learner"`, the teacher **must** provide the `contextId` (the learner's ID):

```json
{
  "surveyId": "aaa-111-bbb",
  "contextId": "learner-uuid-rahul",
  "responseData": {},
  "responseMetadata": { "studentName": "Rahul Kumar" }
}
```

> ⚠️ If `contextId` is missing and the survey has `contextType` = learner/center/teacher, the API returns **400 Bad Request**.

### Database: `SurveyResponses`

```
┌──────────────┬──────────────────────────────────────────────┐
│ responseId   │ "resp-001" (auto UUID)                       │
│ surveyId     │ "aaa-111-bbb"                                │
│ tenantId     │ "tenant-xyz"                                 │
│ respondentId │ "teacher-user-id"                            │
│ contextType  │ "learner" (copied from survey)               │
│ contextId    │ "learner-uuid-rahul"                         │
│ status       │ "in_progress"                                │
│ responseData │ {}                                            │
│ fileUploadIds│ {}                                            │
└──────────────┴──────────────────────────────────────────────┘
```

### Step 4b: Upload Consent Document (if any)

**`POST /file-upload`** (multipart form) → `FileUploadService.uploadFile()`

```
Headers: Content-Type: multipart/form-data
Body: {
  tenantId: "tenant-xyz",
  surveyId: "aaa-111-bbb",
  responseId: "resp-001",
  fieldId: "fld-003",
  file: <consent_photo.jpg>
}
```

### Database: `SurveyFileUploads`

```
┌──────────────────┬──────────────────────────────────────────┐
│ fileId           │ "file-001"                                │
│ surveyId         │ "aaa-111-bbb"                             │
│ responseId       │ "resp-001"                                │
│ fieldId          │ "fld-003"                                 │
│ originalFilename │ "consent_photo.jpg"                       │
│ filePath         │ "tenant-xyz/aaa-111-bbb/resp-001/fld-003/..."│
│ fileSize         │ 245000                                    │
│ mimeType         │ "image/jpeg"                              │
│ fileType         │ "image"                                   │
│ status           │ "completed"                               │
│ uploadedBy       │ "teacher-user-id"                         │
└──────────────────┴──────────────────────────────────────────┘
```

### Step 4c: Save/Update the Response Data

**`PATCH /response/:responseId`** → `ResponseService.update()`

```json
{
  "responseData": {
    "fld-001": "Rahul Kumar",
    "fld-002": "yes"
  },
  "fileUploadIds": {
    "fld-003": ["file-001"]
  }
}
```

### Database: `SurveyResponses` Updated

```
responseData:   { "fld-001": "Rahul Kumar", "fld-002": "yes" }
fileUploadIds:  { "fld-003": ["file-001"] }
status:         "in_progress"
```

### Step 4d: Submit the Response

**`POST /response/:responseId/submit`** → `ResponseService.submit()`

```json
{
  "responseData": {
    "fld-001": "Rahul Kumar",
    "fld-002": "yes"
  },
  "fileUploadIds": {
    "fld-003": ["file-001"]
  }
}
```

### What Happens:
1. Validates all **required fields** are filled (`student_name` ✓, `consent_taken` ✓)
2. Sets `status = "submitted"`, `submittedAt = now()`
3. Calculates `timeSpentSeconds`
4. Publishes Kafka event `RESPONSE_SUBMITTED`

### Teacher repeats Steps 4a–4d for each student (because `allowMultipleSubmissions: true`)

```
resp-001 → Rahul Kumar   (submitted ✓)
resp-002 → Priya Sharma  (submitted ✓)
resp-003 → Amit Patel    (submitted ✓)
... for all students in class
```

---

## Phase 5: Team Leader / Admin Views Responses

### List all responses for a survey
**`GET /response/survey/:surveyId?page=1&limit=20`** → `ResponseService.findAllBySurvey()`

### Get response stats
**`GET /response/survey/:surveyId/stats`** → `ResponseService.getStats()`

Returns:
```json
{
  "totalResponses": 35,
  "submittedResponses": 30,
  "inProgressResponses": 5
}
```

### View a specific response
**`GET /response/:responseId`** → `ResponseService.findOne()`

### Get uploaded file
**`GET /file-upload/:surveyId/:fileId/url`** → `FileUploadService.getFileAccessUrl()`

Returns a presigned S3 URL to view/download the consent document.

---

## Complete Table Usage Summary

| Table | When Used |
|-------|-----------|
| SurveyMaster | Phase 1 (CREATE), Phase 2 (PUBLISH), Phase 3 (FETCH form structure) |
| SurveySections | Phase 1 (CREATE sections), Phase 3 (FETCH sections with survey) |
| SurveyFields | Phase 1 (CREATE fields/questions), Phase 3 (FETCH fields to render form), Phase 4d (validate required fields on submit) |
| SurveyResponses | Phase 4a (CREATE response), Phase 4c (UPDATE with answers), Phase 4d (SUBMIT), Phase 5 (LIST/READ responses) |
| SurveyFileUploads | Phase 4b (UPLOAD file), Phase 5 (GET file URL for viewing) |

---

## Survey Context (contextType)

`SurveyMaster.contextType` defines **what entity** the survey is filled against:

| contextType | Meaning | Example | contextId in response |
|-------------|---------|---------|----------------------|
| `learner` | Fill per student/learner | Consent Form, Student Assessment | learner's user ID |
| `center` | Fill per school/center | Infrastructure Audit | center's ID |
| `teacher` | Fill per teacher | Teacher Performance Review | teacher's user ID |
| `self` | Fill for yourself | Self Assessment, Feedback | not required |
| `none` | General survey | General Feedback | not required |

**How it works:**
1. Admin sets `context_type` when creating the survey
2. When teacher creates a response, they **must pass `contextId`** (for learner/center/teacher types)
3. Backend validates: if `contextType` requires it and `contextId` is missing → 400 error
4. `contextType` is also stored on the response (denormalized) for easy querying
5. Duplicate check respects context: with `allowMultipleSubmissions: false`, one submission per `contextId` per user

---

## Role-Based Survey Visibility (targetRoles)

`SurveyMaster.targetRoles` (JSONB array) controls who can see the survey in the list API:

| targetRoles value | Who sees it |
|-------------------|-------------|
| `null` | All roles (no restriction) |
| `["teacher"]` | Teachers + Admins |
| `["teacher", "team_leader"]` | Teachers, Team Leaders + Admins |
| `["admin_only"]` | Only users with "admin_only" role + Admins |

**Admins always bypass** the `targetRoles` filter — they see every survey in the tenant.

This is set during survey creation via `target_roles` in the request body, and can be updated later via `PUT /surveys/update/:surveyId`.

---

## Tenant-wise Segregation

**Every single query** filters by `tenantId`:
- `WHERE tenantId = 'tenant-xyz'` is applied on ALL reads
- `tenantId` is set on ALL inserts
- This comes from the auth token/header via the `@GetTenantId()` decorator

```
Tenant A (School District 1):  sees only their surveys + responses
Tenant B (School District 2):  sees only their surveys + responses
```

Both can have a "Student Consent Form" survey — completely isolated.

---

## API Sequence Cheat Sheet

```
ADMIN/CREATOR:
  1. POST   /survey                          → Create survey (draft)
  2. PATCH  /survey/:id/publish              → Publish (teachers can now fill)

TEACHER (filling):
  3. POST   /surveys/list                    → Get list of available surveys (gets surveyId)
  4. GET    /surveys/read/:id                → Fetch full form structure (using surveyId from list)
  5. POST   /response                        → Start a response
  6. POST   /file-upload                     → Upload consent doc (if needed)
  7. PATCH  /response/:id                    → Save progress / attach file IDs
  8. POST   /response/:id/submit             → Submit final response
  (Repeat 5-8 for each student)

TEAM LEADER (viewing):
  9. POST   /surveys/list                    → Get list of surveys (same list API)
 10. GET    /response/survey/:id             → List all responses for a survey
 11. GET    /response/survey/:id/stats       → Get summary stats
 12. GET    /response/:id                    → View specific response
 13. GET    /file-upload/:surveyId/:fileId/url → View uploaded consent doc

LIFECYCLE:
 14. PATCH  /survey/:id/close                → Close survey (no more responses)
```
