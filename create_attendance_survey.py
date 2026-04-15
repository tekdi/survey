"""
Script to create an Attendance Status survey for SCP tenant targeting FL roles.
FLs fill this survey for each student in their batch.

Usage:
  1. Update BASE_URL, AUTH_TOKEN, and TENANT_ID below
  2. pip install requests
  3. python create_attendance_survey.py
"""

import requests
import json

# ── Configuration ──────────────────────────────────────────────
BASE_URL="https://dev-survey.prathamdigital.org/api/v1"
AUTH_TOKEN = "Bearer eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJPc3NtSUhXaW1NMDN2MUxsVnFvNHBqaS0ydEMwTGhLY0o5dmtwQTlJZV9zIn0.eyJleHAiOjE3NzYyNTU2MjgsImlhdCI6MTc3NjE2OTIyOCwianRpIjoiZTU1NDliYWYtYTFlMC00ZTM0LWEzMGYtNGRkZTBjMjMxY2E3IiwiaXNzIjoiaHR0cHM6Ly9kZXYtbG1wLnByYXRoYW1kaWdpdGFsLm9yZy9hdXRoL3JlYWxtcy9wcmF0aGFtIiwiYXVkIjoiYWNjb3VudCIsInN1YiI6IjI5OTFhMmYxLTFiMWQtNDE5NC05NjVkLTQwNjdkMGZmMzM2NiIsInR5cCI6IkJlYXJlciIsImF6cCI6InByYXRoYW0iLCJzZXNzaW9uX3N0YXRlIjoiMjllZmE2OTQtODM3MS00Y2JiLTlkMmYtZDM1NTg2MzNmMDc4IiwiYWNyIjoiMSIsImFsbG93ZWQtb3JpZ2lucyI6WyIvKiJdLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsib2ZmbGluZV9hY2Nlc3MiLCJ1bWFfYXV0aG9yaXphdGlvbiIsImRlZmF1bHQtcm9sZXMtcHJhdGhhbSJdfSwicmVzb3VyY2VfYWNjZXNzIjp7ImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfX0sInNjb3BlIjoiZW1haWwgcHJvZmlsZSBwcmF0aGFtLXJvbGUiLCJzaWQiOiIyOWVmYTY5NC04MzcxLTRjYmItOWQyZi1kMzU1ODYzM2YwNzgiLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsIm5hbWUiOiJSdXNoaSBUZXN0IiwicHJlZmVycmVkX3VzZXJuYW1lIjoicnVzaGlrZXNoLnNvbmF3YW5lKzIwQHRla2RpdGVjaG5vbG9naWVzLmNvbSIsInVzZXJfcm9sZXMiOiJMZWFkIiwiZ2l2ZW5fbmFtZSI6IlJ1c2hpIiwiZmFtaWx5X25hbWUiOiJUZXN0IiwiZW1haWwiOiJydXNoaWtlc2guc29uYXdhbmUrMjBAdGVrZGl0ZWNobm9sb2dpZXMuY29tIn0.GUPZjsAC5UOjatZRfHULtfMY9AJHQaLEYZkuY2p7HNNVBRD2VMPbKrPdJUJdB4hDRW4WLjsemb1cj5d53RyOEMD1lOtaQOZfd-fi4eNEJC5eYBrFSHh1joU_XG8Lropu6gyPRx8j1rX9MXklaAUlfSM0Y8cV4NqCCrO7nGQsYJpNxYv-Ep0B52824eZm11kHK2coHvZB6ty3ngbF8sCbhzlVEtFq4zQbaTDwGT8s0psPJAHD7dCPrdNnU3BJxt-o2XSg9sY0GYcJkYCr1lx5FlLDmMEYx_6vPbR6yTYiVkwWnldQf8v_sGyfcMWFySssNTzuNN_fhD-pZ9tFdTyS8w"
TENANT_ID = "ef99949b-7f3a-4a5f-806a-e67e683e38f3"                           # SCP tenant
# ───────────────────────────────────────────────────────────────

HEADERS = {
    "Content-Type": "application/json",
    "Authorization": AUTH_TOKEN,
    "tenantid": TENANT_ID,
}

SURVEY_PAYLOAD = {
    "survey_title": "Student Attendance Status",
    "survey_description": "FLs (Facilitators of Learning) fill this survey for each student in their batch to record attendance status.",
    "survey_type": "attendance",
    "target_roles": ["instructor"],
    "context_type": "learner",
    "settings": {
        "allowMultipleSubmissions": True,
        "isAnonymous": False
    },
    "theme": {
        "primaryColor": "#1976d2"
    },
    "sections": [
        {
            "section_title": "Attendance Details",
            "section_description": "Record the attendance status for the student",
            "display_order": 0,
            "is_visible": True,
            "fields": [
                {
                    "field_name": "student_name",
                    "field_label": "Student Name",
                    "field_type": "text",
                    "is_required": True,
                    "display_order": 0,
                    "placeholder": "Enter student's full name",
                    "validations": {
                        "minLength": 2,
                        "maxLength": 100
                    }
                },
                {
                    "field_name": "attendance_date",
                    "field_label": "Date",
                    "field_type": "date",
                    "is_required": True,
                    "display_order": 1,
                    "help_text": "Select the date for attendance"
                },
                {
                    "field_name": "attendance_status",
                    "field_label": "Attendance Status",
                    "field_type": "radio",
                    "is_required": True,
                    "display_order": 2,
                    "help_text": "Select the student's attendance status",
                    "data_source": {
                        "type": "static",
                        "options": [
                            {"value": "present", "label": "Present"},
                            {"value": "absent", "label": "Absent"},
                            {"value": "late", "label": "Late"},
                            {"value": "excused", "label": "Excused Absence"}
                        ]
                    }
                },
                {
                    "field_name": "remarks",
                    "field_label": "Remarks",
                    "field_type": "textarea",
                    "is_required": False,
                    "display_order": 3,
                    "placeholder": "Any additional notes (e.g., reason for absence)",
                    "validations": {
                        "maxLength": 500
                    }
                }
            ]
        }
    ]
}


def create_survey():
    print("Creating Attendance Status survey...")
    resp = requests.post(f"{BASE_URL}/surveys/create", headers=HEADERS, json=SURVEY_PAYLOAD)

    if resp.status_code in (200, 201):
        data = resp.json()
        survey_id = data.get("data", {}).get("surveyId") or data.get("result", {}).get("data", {}).get("surveyId")
        print(f"Survey created successfully!  surveyId: {survey_id}")
        print(json.dumps(data, indent=2))
        return survey_id
    else:
        print(f"Failed to create survey: {resp.status_code}")
        print(resp.text)
        return None


def publish_survey(survey_id: str):
    print(f"\nPublishing survey {survey_id}...")
    resp = requests.post(f"{BASE_URL}/surveys/{survey_id}/publish", headers=HEADERS)

    if resp.status_code in (200, 201):
        print("Survey published! FL users can now see and fill it.")
        print(json.dumps(resp.json(), indent=2))
    else:
        print(f"Failed to publish: {resp.status_code}")
        print(resp.text)


if __name__ == "__main__":
    survey_id = create_survey()
    if survey_id:
        answer = input("\nPublish this survey now? (y/n): ").strip().lower()
        if answer == "y":
            publish_survey(survey_id)
        else:
            print("Survey left in 'draft' status. Publish later via API.")
