# Survey Service — Kafka Events Reference

This document describes all Kafka events produced by the Survey Service.
Consumer services can use this as the contract for what to expect on the topic.

---

## Configuration

| Property | Env Variable | Default |
|---|---|---|
| Topic | `KAFKA_TOPIC` | `survey-topic` |
| Brokers | `KAFKA_HOST` | `localhost:9092` |
| Enabled | `KAFKA_ENABLED` | `false` |
| Client ID | — | `survey-service` |

> **Note:** All events are silently skipped (no error thrown) when `KAFKA_ENABLED=false`.

---

## Message Envelope

Every message published to Kafka follows this top-level wrapper:

```json
{
  "eventType": "<EVENT_TYPE>",
  "timestamp": "2026-05-11T10:00:00.000Z",
  "<entityId>": "<uuid>",
  "data": { ... }
}
```

- `eventType` — one of the event types listed below
- `timestamp` — ISO 8601 string, UTC, set at time of publish
- `<entityId>` — also used as the **Kafka message key** for partition ordering

---

## Survey Events

Produced by: `src/modules/survey/services/survey.service.ts`

### `SURVEY_CREATED`

Fired when a new survey is successfully created (including all sections and fields).

**Kafka message key:** `surveyId`

```json
{
  "eventType": "SURVEY_CREATED",
  "timestamp": "2026-05-11T10:00:00.000Z",
  "surveyId": "uuid",
  "data": {
    "surveyId": "uuid",
    "tenantId": "uuid",
    "surveyTitle": "string",
    "surveyDescription": "string | null",
    "status": "draft",
    "surveyType": "string | null",
    "settings": {},
    "theme": {},
    "targetRoles": ["string"] ,
    "contextType": "none | learner | center | teacher | self",
    "createdBy": "uuid",
    "updatedBy": "uuid",
    "version": 0,
    "publishedAt": null,
    "closedAt": null,
    "createdAt": "ISO timestamp",
    "updatedAt": "ISO timestamp",
    "sections": [
      {
        "sectionId": "uuid",
        "surveyId": "uuid",
        "tenantId": "uuid",
        "sectionTitle": "string",
        "sectionDescription": "string | null",
        "displayOrder": 0,
        "isVisible": true,
        "conditionalLogic": null,
        "fields": [
          {
            "fieldId": "uuid",
            "sectionId": "uuid",
            "surveyId": "uuid",
            "tenantId": "uuid",
            "fieldName": "string",
            "fieldLabel": "string",
            "fieldType": "string",
            "isRequired": false,
            "displayOrder": 0,
            "placeholder": "string | null",
            "helpText": "string | null",
            "defaultValue": "any | null",
            "validations": {},
            "dataSource": null,
            "uploadConfig": null,
            "uiConfig": {},
            "conditionalLogic": null,
            "options": []
          }
        ]
      }
    ]
  }
}
```

---

### `SURVEY_UPDATED`

Fired when an existing survey's metadata is updated (title, description, settings, theme, etc.).
Not fired for section/field changes.

**Kafka message key:** `surveyId`

```json
{
  "eventType": "SURVEY_UPDATED",
  "timestamp": "2026-05-11T10:00:00.000Z",
  "surveyId": "uuid",
  "data": {
    // Same full survey object as SURVEY_CREATED, with updated values
  }
}
```

---

### `SURVEY_PUBLISHED`

Fired when a survey's status transitions from `draft` → `published`.

**Kafka message key:** `surveyId`

```json
{
  "eventType": "SURVEY_PUBLISHED",
  "timestamp": "2026-05-11T10:00:00.000Z",
  "surveyId": "uuid",
  "data": {
    // Same full survey object with status = "published" and publishedAt set
  }
}
```

---

### `SURVEY_CLOSED`

Fired when a survey's status transitions from `published` → `closed`.

**Kafka message key:** `surveyId`

```json
{
  "eventType": "SURVEY_CLOSED",
  "timestamp": "2026-05-11T10:00:00.000Z",
  "surveyId": "uuid",
  "data": {
    // Same full survey object with status = "closed" and closedAt set
  }
}
```

---

### `SURVEY_DELETED`

Fired when a survey is deleted. Note: only contains IDs, not the full survey object.

**Kafka message key:** `surveyId`

```json
{
  "eventType": "SURVEY_DELETED",
  "timestamp": "2026-05-11T10:00:00.000Z",
  "surveyId": "uuid",
  "data": {
    "surveyId": "uuid",
    "tenantId": "uuid"
  }
}
```

---

## Response Events

Produced by: `src/modules/response/services/response.service.ts`

### `RESPONSE_STARTED`

Fired when a user begins filling a survey (a new response record is created with status `in_progress`).

**Kafka message key:** `responseId`

```json
{
  "eventType": "RESPONSE_STARTED",
  "timestamp": "2026-05-11T10:00:00.000Z",
  "responseId": "uuid",
  "data": {
    "responseId": "uuid",
    "surveyId": "uuid",
    "tenantId": "uuid",
    "respondentId": "uuid",
    "contextType": "none | learner | center | teacher | self | null",
    "contextId": "uuid | null",
    "status": "in_progress"
  }
}
```

---

### `RESPONSE_UPDATED`

Fired when a user saves a draft / partially updates their in-progress response.

**Kafka message key:** `responseId`

```json
{
  "eventType": "RESPONSE_UPDATED",
  "timestamp": "2026-05-11T10:00:00.000Z",
  "responseId": "uuid",
  "data": {
    "responseId": "uuid",
    "surveyId": "uuid",
    "tenantId": "uuid",
    "contextType": "none | learner | center | teacher | self | null",
    "contextId": "uuid | null",
    "status": "in_progress",
    "responseData": {
      "<fieldId>": "<value>",
      "<fieldId_2>": ["option1", "option2"]
    }
  }
}
```

> `respondentId` is **not included** in this event — look up the existing row by `responseId` to get it.
> `responseData` here is **partial** — only fields answered so far. Always check `status` before using it for reporting.

---

### `RESPONSE_SUBMITTED`

Fired when a user submits their completed response. This is the richest response event.

**Kafka message key:** `responseId`

```json
{
  "eventType": "RESPONSE_SUBMITTED",
  "timestamp": "2026-05-11T10:00:00.000Z",
  "responseId": "uuid",
  "data": {
    "responseId": "uuid",
    "surveyId": "uuid",
    "tenantId": "uuid",
    "respondentId": "uuid",
    "contextType": "none | learner | center | teacher | self | null",
    "contextId": "uuid | null",
    "status": "submitted",
    "responseData": {
      "<fieldId>": "<value>",
      "<fieldId_2>": ["option1", "option2"]
    },
    "submittedAt": "ISO timestamp"
  }
}
```

#### `responseData` structure

`responseData` is a flat key-value map where keys are `fieldId` UUIDs:

| Field Type | Value Format |
|---|---|
| Text / Number / Date | `"string"` or `number` |
| Single-select / Radio | `"selectedOptionValue"` |
| Multi-select / Checkbox | `["option1", "option2"]` |
| File upload fields | **Not in `responseData`** — see `fileUploadIds` below |

File upload field IDs are stored separately in `fileUploadIds`:
```json
{
  "<fieldId>": ["fileId_1", "fileId_2"]
}
```
These `fileId` values correspond to records produced by `FILE_UPLOADED` events.

---

## File Events

Produced by: `src/modules/file-upload/services/file-upload.service.ts`

### `FILE_UPLOADED`

Fired when a file (image/video) is successfully uploaded and the DB record is created.

**Kafka message key:** `fileId`

```json
{
  "eventType": "FILE_UPLOADED",
  "timestamp": "2026-05-11T10:00:00.000Z",
  "fileId": "uuid",
  "data": {
    "fileId": "uuid",
    "surveyId": "uuid",
    "tenantId": "uuid",
    "fieldId": "uuid",
    "fileType": "image | video"
  }
}
```

---

### `FILE_DELETED`

Fired when a file is soft-deleted (the record is kept in DB with `status = deleted`).

**Kafka message key:** `fileId`

```json
{
  "eventType": "FILE_DELETED",
  "timestamp": "2026-05-11T10:00:00.000Z",
  "fileId": "uuid",
  "data": {
    "fileId": "uuid",
    "surveyId": "uuid",
    "tenantId": "uuid"
  }
}
```

---

## Event Summary Table

| Event Type | Trigger | Message Key | Source File |
|---|---|---|---|
| `SURVEY_CREATED` | New survey created | `surveyId` | `survey.service.ts` |
| `SURVEY_UPDATED` | Survey metadata updated | `surveyId` | `survey.service.ts` |
| `SURVEY_PUBLISHED` | Survey goes live | `surveyId` | `survey.service.ts` |
| `SURVEY_CLOSED` | Survey accepting closed | `surveyId` | `survey.service.ts` |
| `SURVEY_DELETED` | Survey deleted | `surveyId` | `survey.service.ts` |
| `RESPONSE_STARTED` | User begins a response | `responseId` | `response.service.ts` |
| `RESPONSE_UPDATED` | Draft response saved | `responseId` | `response.service.ts` |
| `RESPONSE_SUBMITTED` | Response submitted | `responseId` | `response.service.ts` |
| `FILE_UPLOADED` | File uploaded | `fileId` | `file-upload.service.ts` |
| `FILE_DELETED` | File soft-deleted | `fileId` | `file-upload.service.ts` |

---

## Consumer Notes

1. **Filter by `eventType`** — All 10 event types land on the same topic (`survey-topic`). Your consumer must switch on `eventType` to route to the correct handler.

2. **Multi-tenancy** — Every event carries a `tenantId`. Always scope any writes in your consumer by `tenantId`.

3. **`responseData` is sent in both `RESPONSE_UPDATED` and `RESPONSE_SUBMITTED`** — `RESPONSE_UPDATED` carries partial data (fields answered so far), `RESPONSE_SUBMITTED` carries the final complete data. Always check `status` before using `responseData` for reporting — only `submitted` responses are complete.

4. **File uploads are linked via `fileUploadIds`** — The `RESPONSE_SUBMITTED` event does not embed file content. Use the `fileId` values from `fileUploadIds` to cross-reference against `FILE_UPLOADED` events or call the Survey Service API to get presigned URLs.

5. **Idempotency** — Kafka delivery may result in duplicate messages. Use `responseId` / `surveyId` / `fileId` as idempotency keys in your consumer (upsert by ID rather than blindly inserting).

6. **Kafka is fire-and-forget from this service** — Kafka publish failures are logged but do not fail the HTTP request. Your consumer should not assume every action on the Survey Service will produce a Kafka event.
