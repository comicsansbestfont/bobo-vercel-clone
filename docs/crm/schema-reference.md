# CRM Schema Reference

Complete column-level documentation for all CRM tables.

---

## Core Entities

### `companies`
Organizations/companies. CRM core entity.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NOT NULL | `gen_random_uuid()` | Primary key |
| `user_id` | uuid | NOT NULL | - | Owner (FK: auth.users) |
| `name` | text | NOT NULL | - | Company name |
| `website` | text | YES | - | Company website URL |
| `industry` | text | YES | - | Industry sector |
| `employee_count` | text | YES | - | Size range (e.g., "10-50") |
| `lifecycle_stage` | text | YES | `'prospect'` | CHECK: lead, prospect, customer, former_customer |
| `source` | text | YES | - | How they found us |
| `source_detail` | text | YES | - | Additional source info |
| `address` | jsonb | YES | `'{}'` | JSONB address object |
| `notes` | text | YES | - | Internal notes |
| `search_vector` | tsvector | YES | Generated | Full-text search index |
| `created_at` | timestamptz | YES | `now()` | Creation timestamp |
| `updated_at` | timestamptz | YES | `now()` | Last update |
| `deleted_at` | timestamptz | YES | - | Soft delete timestamp |

**RLS**: Enabled
**Foreign Keys**: Referenced by contacts, engagements, activities, activity_meetings, activity_threads, activity_note_targets

---

### `contacts`
People/contacts at companies. CRM core entity.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NOT NULL | `gen_random_uuid()` | Primary key |
| `user_id` | uuid | NOT NULL | - | Owner (FK: auth.users) |
| `company_id` | uuid | YES | - | FK: companies.id |
| `name` | text | YES | - | Full name (display) |
| `name_structured` | jsonb | YES | `'{"lastName": "", "firstName": ""}'` | JSONB: {firstName, lastName} |
| `email` | text | YES | - | Primary email |
| `emails` | jsonb | YES | `'{"primaryEmail": null, "additionalEmails": []}'` | All emails |
| `phone` | text | YES | - | Primary phone |
| `phones` | jsonb | YES | `'{"additionalPhones": [], "primaryPhoneNumber": null}'` | All phones |
| `linkedin_url` | text | YES | - | LinkedIn profile URL |
| `role` | text | YES | - | Job title/role |
| `company_name_legacy` | text | YES | - | Legacy company name field |
| `is_primary` | boolean | YES | `false` | Primary contact flag |
| `search_vector` | tsvector | YES | Generated | Full-text search index |
| `created_at` | timestamptz | YES | `now()` | Creation timestamp |
| `updated_at` | timestamptz | YES | `now()` | Last update |
| `deleted_at` | timestamptz | YES | - | Soft delete timestamp |

**RLS**: Enabled

---

### `engagements`
Unified CRM entity: leads, deals, clients. Module: CRM-001

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NOT NULL | `gen_random_uuid()` | Primary key |
| `user_id` | uuid | NOT NULL | - | Owner (FK: auth.users) |
| `company_id` | uuid | NOT NULL | - | FK: companies.id |
| `primary_contact_id` | uuid | YES | - | FK: contacts.id |
| `project_id` | uuid | YES | - | FK: projects.id |
| `engagement_type` | text | NOT NULL | - | CHECK: lead, deal, client |
| `stage` | text | NOT NULL | - | Current stage |
| `stage_changed_at` | timestamptz | YES | `now()` | Last stage change |
| `deal_value` | jsonb | YES | - | Deal value with currency |
| `close_date` | date | YES | - | Expected close date |
| `probability` | integer | YES | - | CHECK: 0-100 |
| `lost_reason` | text | YES | - | Why deal was lost |
| `contract_start` | date | YES | - | Client contract start |
| `contract_end` | date | YES | - | Client contract end |
| `mrr` | jsonb | YES | - | Monthly recurring revenue |
| `health_score` | text | YES | - | CHECK: green, yellow, red |
| `name` | text | YES | - | Engagement name |
| `description` | text | YES | - | Description |
| `tags` | text[] | YES | `'{}'` | Tag array |
| `advisory_folder_path` | text | YES | - | Link to advisory folder |
| `converted_from_id` | uuid | YES | - | FK: engagements.id (self-ref) |
| `converted_at` | timestamptz | YES | - | Conversion timestamp |
| `search_vector` | tsvector | YES | Generated | Full-text search index |
| `created_at` | timestamptz | YES | `now()` | Creation timestamp |
| `updated_at` | timestamptz | YES | `now()` | Last update |
| `deleted_at` | timestamptz | YES | - | Soft delete timestamp |

**RLS**: Enabled

---

### `stage_history`
Audit trail for engagement stage/type changes.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NOT NULL | `gen_random_uuid()` | Primary key |
| `engagement_id` | uuid | NOT NULL | - | FK: engagements.id |
| `user_id` | uuid | NOT NULL | - | Who made the change (FK: auth.users) |
| `from_stage` | text | YES | - | Previous stage |
| `to_stage` | text | NOT NULL | - | New stage |
| `from_type` | text | YES | - | Previous engagement type |
| `to_type` | text | YES | - | New engagement type |
| `reason` | text | YES | - | Reason for change |
| `notes` | text | YES | - | Additional notes |
| `changed_at` | timestamptz | YES | `now()` | Change timestamp |

**RLS**: Enabled

---

## Activity & Timeline

### `activities`
Lightweight timeline feed. For full content, follow linked_* foreign keys to content tables.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NOT NULL | `gen_random_uuid()` | Primary key |
| `user_id` | uuid | NOT NULL | - | Owner (FK: auth.users) |
| `engagement_id` | uuid | YES | - | FK: engagements.id |
| `company_id` | uuid | YES | - | FK: companies.id |
| `contact_id` | uuid | YES | - | FK: contacts.id |
| `project_id` | uuid | YES | - | FK: projects.id |
| `activity_type` | text | NOT NULL | - | CHECK: call, email, meeting, note, message, linkedin, task_completed, stage_change |
| `title` | text | YES | - | Activity title |
| `activity_date` | timestamptz | NOT NULL | `now()` | When activity occurred |
| `duration_mins` | integer | YES | - | Duration in minutes |
| `channel` | text | YES | - | CHECK: zoom, phone, email, whatsapp, linkedin, in_person, slack, teams, google_meet |
| `direction` | text | YES | - | CHECK: inbound, outbound |
| `outcome` | text | YES | - | CHECK: positive, neutral, negative, no_answer, left_message, scheduled_follow_up |
| `summary` | text | YES | - | Brief summary |
| `body` | text | YES | - | Full body text |
| `next_steps` | text | YES | - | Next steps |
| `attendees` | jsonb | YES | `'[]'` | Attendee list |
| `linked_file` | text | YES | - | Link to source file |
| `metadata` | jsonb | YES | `'{}'` | Additional metadata |
| `synced_to_file` | boolean | YES | `false` | Sync status |
| `search_vector` | tsvector | YES | Generated | Full-text search index |
| `created_at` | timestamptz | YES | `now()` | Creation timestamp |
| `updated_at` | timestamptz | YES | `now()` | Last update |
| `deleted_at` | timestamptz | YES | - | Soft delete timestamp |
| `linked_thread_id` | uuid | YES | - | FK: activity_threads.id |
| `linked_message_id` | uuid | YES | - | FK: activity_messages.id |
| `linked_meeting_id` | uuid | YES | - | FK: activity_meetings.id |
| `linked_note_id` | uuid | YES | - | FK: activity_notes.id |

**RLS**: Enabled

---

## Communications

### `activity_threads`
Groups related messages (LinkedIn, WhatsApp, email conversations).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NOT NULL | `gen_random_uuid()` | Primary key |
| `user_id` | uuid | NOT NULL | - | Owner (FK: auth.users) |
| `engagement_id` | uuid | YES | - | FK: engagements.id |
| `company_id` | uuid | YES | - | FK: companies.id |
| `channel` | text | NOT NULL | - | CHECK: linkedin, whatsapp, email, sms, slack, other |
| `subject` | text | YES | - | Thread subject/topic |
| `external_thread_id` | text | YES | - | External system ID |
| `status` | text | YES | `'active'` | CHECK: active, archived, snoozed |
| `started_at` | timestamptz | NOT NULL | `now()` | Thread start time |
| `last_message_at` | timestamptz | YES | - | Last message timestamp |
| `message_count` | integer | YES | `0` | Number of messages |
| `unread_count` | integer | YES | `0` | Unread messages |
| `last_read_at` | timestamptz | YES | - | Last read timestamp |
| `source_file_path` | text | YES | - | Source markdown file |
| `search_vector` | tsvector | YES | Generated | Full-text search index |
| `created_at` | timestamptz | YES | `now()` | Creation timestamp |
| `updated_at` | timestamptz | YES | `now()` | Last update |
| `deleted_at` | timestamptz | YES | - | Soft delete timestamp |

**RLS**: Enabled

---

### `activity_messages`
Individual messages with full content.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NOT NULL | `gen_random_uuid()` | Primary key |
| `user_id` | uuid | NOT NULL | - | Owner (FK: auth.users) |
| `thread_id` | uuid | NOT NULL | - | FK: activity_threads.id |
| `sender_contact_id` | uuid | YES | - | FK: contacts.id |
| `sender_name` | text | YES | - | Sender display name |
| `sender_handle` | text | YES | - | Sender handle (@username, email) |
| `sender_is_me` | boolean | YES | `false` | Is this my message |
| `direction` | text | NOT NULL | - | CHECK: inbound, outbound |
| `sent_at` | timestamptz | NOT NULL | - | Message timestamp |
| `subject` | text | YES | - | Message subject (email) |
| `body` | text | NOT NULL | - | **FULL MESSAGE CONTENT** |
| `body_html` | text | YES | - | HTML version of body |
| `in_reply_to` | text | YES | - | Reply reference |
| `message_id_header` | text | YES | - | Email Message-ID header |
| `attachments` | jsonb | YES | `'[]'` | Attachment metadata |
| `has_attachments` | boolean | YES | `false` | Has attachments flag |
| `metadata` | jsonb | YES | `'{}'` | Additional metadata |
| `external_id` | text | YES | - | External system ID |
| `search_vector` | tsvector | YES | Generated | Full-text search index |
| `created_at` | timestamptz | YES | `now()` | Creation timestamp |
| `updated_at` | timestamptz | YES | `now()` | Last update |
| `deleted_at` | timestamptz | YES | - | Soft delete timestamp |

**RLS**: Enabled

---

### `activity_participants`
Who's involved in each message thread.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NOT NULL | `gen_random_uuid()` | Primary key |
| `thread_id` | uuid | NOT NULL | - | FK: activity_threads.id |
| `contact_id` | uuid | YES | - | FK: contacts.id |
| `name` | text | YES | - | Participant name |
| `handle` | text | NOT NULL | - | Handle/email |
| `role` | text | NOT NULL | - | CHECK: from, to, cc, bcc, participant |
| `is_primary_recipient` | boolean | YES | `false` | Primary recipient flag |
| `created_at` | timestamptz | YES | `now()` | Creation timestamp |

**RLS**: Enabled
**Unique Constraint**: (thread_id, handle, role)

---

## Meetings

### `activity_meetings`
Full meeting notes, transcripts, and structured data.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NOT NULL | `gen_random_uuid()` | Primary key |
| `user_id` | uuid | NOT NULL | - | Owner (FK: auth.users) |
| `engagement_id` | uuid | YES | - | FK: engagements.id |
| `company_id` | uuid | YES | - | FK: companies.id |
| `title` | text | NOT NULL | - | Meeting title |
| `meeting_type` | text | NOT NULL | - | CHECK: video_call, phone_call, in_person, hybrid |
| `channel` | text | YES | - | CHECK: zoom, google_meet, teams, phone, whatsapp, in_person, other |
| `scheduled_at` | timestamptz | YES | - | Scheduled time |
| `started_at` | timestamptz | YES | - | Actual start time |
| `ended_at` | timestamptz | YES | - | End time |
| `duration_mins` | integer | YES | - | Duration in minutes |
| `timezone` | text | YES | `'UTC'` | Meeting timezone |
| `location` | text | YES | - | Physical location |
| `meeting_url` | text | YES | - | Video call URL |
| `purpose` | text | YES | - | Meeting purpose |
| `agenda` | text | YES | - | Pre-meeting agenda |
| `summary` | text | YES | - | Brief summary |
| `notes` | text | YES | - | **FULL MEETING NOTES (Markdown)** |
| `key_points` | jsonb | YES | `'[]'` | Array of key points |
| `action_items` | jsonb | YES | `'[]'` | Array of action items |
| `key_quotes` | jsonb | YES | `'[]'` | Notable quotes |
| `metrics_discussed` | jsonb | YES | `'[]'` | Metrics/numbers discussed |
| `recording_url` | text | YES | - | Recording URL |
| `transcript` | text | YES | - | **FULL TRANSCRIPT** |
| `transcript_source` | text | YES | - | CHECK: manual, otter, fireflies, zoom, other |
| `outcome` | text | YES | - | CHECK: positive, neutral, negative, cancelled, no_show, rescheduled |
| `next_meeting_date` | timestamptz | YES | - | Next meeting scheduled |
| `follow_up_notes` | text | YES | - | Follow-up notes |
| `source_file_path` | text | YES | - | Source markdown file |
| `search_vector` | tsvector | YES | Generated | Full-text search index |
| `created_at` | timestamptz | YES | `now()` | Creation timestamp |
| `updated_at` | timestamptz | YES | `now()` | Last update |
| `deleted_at` | timestamptz | YES | - | Soft delete timestamp |

**RLS**: Enabled

---

### `activity_attendees`
Who attended each meeting.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NOT NULL | `gen_random_uuid()` | Primary key |
| `meeting_id` | uuid | NOT NULL | - | FK: activity_meetings.id |
| `contact_id` | uuid | YES | - | FK: contacts.id |
| `name` | text | NOT NULL | - | Attendee name |
| `email` | text | YES | - | Attendee email |
| `role` | text | NOT NULL | - | CHECK: host, organizer, required, optional, attendee |
| `response_status` | text | YES | - | CHECK: accepted, declined, tentative, pending, no_response |
| `attended` | boolean | YES | - | Actually attended |
| `is_primary_contact` | boolean | YES | `false` | Primary contact flag |
| `notes` | text | YES | - | Notes about attendee |
| `created_at` | timestamptz | YES | `now()` | Creation timestamp |

**RLS**: Enabled

---

## Notes

### `activity_notes`
Internal notes/observations.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NOT NULL | `gen_random_uuid()` | Primary key |
| `user_id` | uuid | NOT NULL | - | Owner (FK: auth.users) |
| `title` | text | YES | - | Note title |
| `body` | text | NOT NULL | - | **FULL NOTE CONTENT** |
| `note_type` | text | NOT NULL | `'general'` | CHECK: general, observation, decision, risk, opportunity, action_item, hypothesis, quote |
| `visibility` | text | YES | `'private'` | CHECK: private, team, shared |
| `is_pinned` | boolean | YES | `false` | Pinned flag |
| `source_meeting_id` | uuid | YES | - | FK: activity_meetings.id (if from meeting) |
| `source_thread_id` | uuid | YES | - | FK: activity_threads.id (if from thread) |
| `source_file_path` | text | YES | - | Source file path |
| `search_vector` | tsvector | YES | Generated | Full-text search index |
| `created_at` | timestamptz | YES | `now()` | Creation timestamp |
| `updated_at` | timestamptz | YES | `now()` | Last update |
| `deleted_at` | timestamptz | YES | - | Soft delete timestamp |

**RLS**: Enabled

---

### `activity_note_targets`
Junction table for polymorphic note linking.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NOT NULL | `gen_random_uuid()` | Primary key |
| `note_id` | uuid | NOT NULL | - | FK: activity_notes.id |
| `engagement_id` | uuid | YES | - | FK: engagements.id |
| `company_id` | uuid | YES | - | FK: companies.id |
| `contact_id` | uuid | YES | - | FK: contacts.id |
| `meeting_id` | uuid | YES | - | FK: activity_meetings.id |
| `thread_id` | uuid | YES | - | FK: activity_threads.id |
| `created_at` | timestamptz | YES | `now()` | Creation timestamp |

**RLS**: Enabled
**Constraint**: At least one target must be set (`note_target_required`)

---

## RPC Functions

### `get_unified_timeline`

Returns unified feed across all activity types.

```sql
get_unified_timeline(
  p_engagement_id UUID,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
) RETURNS TABLE (
  event_id UUID,
  event_type TEXT,
  event_subtype TEXT,
  event_date TIMESTAMPTZ,
  title TEXT,
  summary TEXT,
  activity_id UUID,
  thread_id UUID,
  message_id UUID,
  meeting_id UUID,
  note_id UUID,
  contact_id UUID,
  contact_name TEXT
)
```

**Sources**: activities, activity_messages (via threads), activity_meetings, activity_notes (via note_targets)

---

### `search_communications`

Full-text search across all communications.

```sql
search_communications(
  p_query TEXT,
  p_engagement_id UUID DEFAULT NULL,
  p_limit INT DEFAULT 20
) RETURNS TABLE (
  result_type TEXT,
  result_id UUID,
  title TEXT,
  snippet TEXT,
  event_date TIMESTAMPTZ,
  rank REAL
)
```

**Searches**: activities, activity_messages, activity_meetings, activity_notes

---

### `get_communication_stats`

Communication statistics per engagement.

```sql
get_communication_stats(
  p_engagement_id UUID
) RETURNS TABLE (
  total_messages BIGINT,
  total_meetings BIGINT,
  total_notes BIGINT,
  total_activities BIGINT,
  messages_by_channel JSONB,
  meetings_by_type JSONB,
  last_communication_date TIMESTAMPTZ,
  days_since_last_contact INT
)
```

---

## JSONB Column Schemas

### `address` (companies)
```json
{
  "street": "123 Main St",
  "city": "Perth",
  "state": "WA",
  "country": "Australia",
  "postalCode": "6000"
}
```

### `deal_value` / `mrr` (engagements)
```json
{
  "amount": 50000,
  "currency": "AUD"
}
```

### `key_points` (activity_meetings)
```json
["Point 1", "Point 2", "Point 3"]
```

### `action_items` (activity_meetings)
```json
[
  {"assignee": "Mikaela", "task": "Send updated deck", "due": "2025-12-10"},
  {"assignee": "Sachee", "task": "Connect to VCs", "due": null}
]
```

### `key_quotes` (activity_meetings)
```json
[
  {"speaker": "Mikaela", "quote": "The drop-off is getting the meeting..."},
  {"speaker": "Sachee", "quote": "Save the cheerleader, save the world"}
]
```

### `metrics_discussed` (activity_meetings)
```json
[
  {"metric": "Active Venues", "value": "16", "notes": "Down from 21"},
  {"metric": "Current MRR", "value": "~$2,000", "notes": "Artificially depressed"}
]
```

### `attachments` (activity_messages)
```json
[
  {"name": "pitch-deck.pdf", "size": 2048000, "type": "application/pdf"}
]
```
