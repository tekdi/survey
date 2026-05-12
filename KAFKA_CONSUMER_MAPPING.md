# Kafka Consumer — Central DB Mapping

This document maps every column of both Central DB tables to the exact Kafka event
fields that populate them. Columns marked as `null for now` will be auto-populated
once the corresponding field is added to the Survey Service.

---

## Table 1 — SurveyList (Survey Master)

Populate from: **`SURVEY_CREATED`**, **`SURVEY_UPDATED`**, **`SURVEY_PUBLISHED`**, **`SURVEY_CLOSED`**, **`SURVEY_DELETED`**

| Central DB Column | Kafka Field | Value / Notes |
|---|---|---|
| `SurveyID` | `data.surveyId` | UUID — use as primary key |
| `SurveyName` | `data.surveyTitle` | string |
| `TenantID` | `data.tenantId` | UUID |
| `TargetRole` | `data.targetRoles` | Array e.g. `["teacher", "admin"]` — store as JSON array |
| `TargetGeo` | — | **Save `null`** — field not in Survey Service yet, will be added later |
| `Context` | `data.contextType` | Enum: `none \| learner \| center \| teacher \| self` |
| `ContextId` | — | **Save `null`** — survey-level contextId not in Survey Service yet, will be added later |
| `Type` | `data.surveyType` | Free-form string, can be null |
| `CreatedAt` | `data.createdAt` | ISO timestamp |
| `CreatedBy` | `data.createdBy` | UUID of the creating user |
| `SurveyRolloutStartDate` | — | **Save `null`** — not in Survey Service yet; will be added later |
| `SurveyRolloutEndDate` | — | **Save `null`** — not in Survey Service yet; will be added later |
| `IsActive` | `data.status` | Derive: `isActive = (status === 'published')` |
| `SurveyForm` | `data.sections[]` | Full nested JSON — sections + fields. See structure below. Store as JSONB. |

### SurveyForm JSON structure

Stored as a **transformed, report-friendly JSON** — technical rendering fields are stripped out.
Use `fieldId` to join against `SurveySummary` keys in `SurveyTracker`.

```json
[
  {
    "sectionId": "uuid",
    "sectionTitle": "string",
    "sectionDescription": "string | null",
    "order": 0,
    "fields": [
      {
        "fieldId": "uuid",
        "fieldName": "string",
        "label": "Human readable question label",
        "type": "text | textarea | number | email | phone | date | time | datetime | select | multi_select | radio | checkbox | rating | scale | image_upload | video_upload | file_upload | signature | location | matrix",
        "required": false,
        "helpText": "string | null",
        "placeholder": "string | null",
        "order": 0
      }
    ]
  }
]
```

> Stripped from raw source: `uiConfig`, `uploadConfig`, `dataSource`, `validations`, `conditionalLogic`, `defaultValue`, `isVisible`

### Event → Action mapping for SurveyList

| Kafka Event | Action |
|---|---|
| `SURVEY_CREATED` | **INSERT** — all available columns, `null` for deferred ones |
| `SURVEY_UPDATED` | **UPDATE** — SurveyName, SurveyForm, TargetRole, Context, Type |
| `SURVEY_PUBLISHED` | **UPDATE** — `IsActive = true` |
| `SURVEY_CLOSED` | **UPDATE** — `IsActive = false` |
| `SURVEY_DELETED` | **DELETE** (or soft-delete) by SurveyID |

---

## Table 2 — SurveyTracker

Populate from: **`RESPONSE_STARTED`**, **`RESPONSE_UPDATED`**, **`RESPONSE_SUBMITTED`**

| Central DB Column | Kafka Field | Value / Notes |
|---|---|---|
| `SurveyTrackingID` | `data.responseId` | Use `responseId` directly as the PK — avoids needing a separate generated ID |
| `SurveyID` | `data.surveyId` | UUID |
| `TenantID` | `data.tenantId` | UUID |
| `TargetRoleUserId` | `data.respondentId` | UUID — present in `RESPONSE_STARTED` and `RESPONSE_SUBMITTED`. Not in `RESPONSE_UPDATED` — keep from the existing row |
| `Context` | `data.contextType` | Enum: `none \| learner \| center \| teacher \| self \| null` — now included in all response events |
| `ContextId` | `data.contextId` | UUID or null — the specific learner/center this response is for — now included in all response events |
| `SurveySummary` | `data.responseData` | Present in both `RESPONSE_UPDATED` (partial) and `RESPONSE_SUBMITTED` (complete). Save `null` only if `responseData` is empty. Always check `status` before using for reports. |
| `SurveyResponseStatusIndividual` | `data.status` | `in_progress` → `submitted` |
| `CreatedAt` | `timestamp` (envelope) | Top-level `timestamp` from the `RESPONSE_STARTED` event |
| `UpdatedAt` | `timestamp` (envelope) | Top-level `timestamp` from `RESPONSE_UPDATED` / `RESPONSE_SUBMITTED` |

### SurveySummary (responseData) structure

```json
{
  "<fieldId_uuid>": "text answer",
  "<fieldId_uuid>": 42,
  "<fieldId_uuid>": "selected_option_value",
  "<fieldId_uuid>": ["option1", "option2"],
  "<fieldId_uuid>": "2026-05-11"
}
```

File upload fields are **not** in `responseData`. They are in a separate `fileUploadIds` map:
```json
{
  "<fieldId_uuid>": ["fileId_1", "fileId_2"]
}
```

### Event → Action mapping for SurveyTracker

| Kafka Event | Action |
|---|---|
| `RESPONSE_STARTED` | **INSERT** — SurveyTrackingID, SurveyID, TenantID, TargetRoleUserId, Context, ContextId, Status = `in_progress`, CreatedAt, SurveySummary = `null` |
| `RESPONSE_UPDATED` | **UPDATE** — Status, Context, ContextId, SurveySummary = partial responseData, UpdatedAt |
| `RESPONSE_SUBMITTED` | **UPDATE** — Status = `submitted`, SurveySummary = full responseData, UpdatedAt |

---

## Deferred Columns — Will Auto-Populate Later

These columns are `null` today. Once the Survey Service adds the corresponding fields,
the Kafka events will start carrying them and the consumer will populate them automatically
without any consumer-side code changes — as long as the INSERT/UPDATE logic does not skip null fields.

| Column | Table | Will come from |
|---|---|---|
| `SurveyRolloutStartDate` | SurveyList | New field in Survey entity — will come in `SURVEY_CREATED` / `SURVEY_UPDATED` events |
| `SurveyRolloutEndDate` | SurveyList | New field in Survey entity — will come in `SURVEY_CREATED` / `SURVEY_UPDATED` events |
| `TargetGeo` | SurveyList | New field in Survey entity — will come in `SURVEY_CREATED` / `SURVEY_UPDATED` events |
| `ContextId` | SurveyList | New field in Survey entity — will come in `SURVEY_CREATED` / `SURVEY_UPDATED` events |
