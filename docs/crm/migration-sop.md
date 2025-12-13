# CRM Data Migration SOP

Standard Operating Procedure for migrating advisory documents, communications, meetings, and notes into the CRM database.

---

## Overview

This document describes the process for migrating data from markdown files in the `advisory/` folder structure into the CRM database tables. The migration follows a **file-first** approach where source files remain the system of record, and database entries reference them via `source_file_path`.

## Prerequisites

Before starting migration:

1. **Engagement exists** - Create company, contacts, and engagement records first
2. **User ID** - Have the authenticated user's UUID ready
3. **Folder structure** - Ensure deal folder follows expected structure

---

## Expected Folder Structure

Each deal should follow this structure:

```
advisory/deals/{DealName}/
├── master-doc.md              # Deal overview (for engagement description)
├── Communications/
│   ├── 2025-11-linkedin-thread.md
│   ├── 2025-11-whatsapp-thread.md
│   └── 2025-12-email-thread.md
├── Meetings/
│   ├── 2025-11-10-discovery-call.md
│   ├── 2025-11-10-discovery-call-transcript.txt
│   ├── 2025-12-02-pitch-practice-session.md
│   └── _raw/
│       └── 2025-12-02-pitch-practice-transcript.txt
├── Research/
│   └── competitor-analysis.md
├── Docs/
│   └── pitch-deck-notes.md
└── Valuation/
    └── valuation-model.md
```

---

## Migration Order

Always migrate in this order to maintain referential integrity:

1. **Company** → `companies` table
2. **Contacts** → `contacts` table (link to company)
3. **Engagement** → `engagements` table (link to company + primary contact)
4. **Communications** → `activity_threads` + `activity_messages` + `activity_participants`
5. **Meetings** → `activity_meetings` + `activity_attendees`
6. **Notes** → `activity_notes` + `activity_note_targets`
7. **Activities** → `activities` table (lightweight timeline entries)

---

## Step-by-Step Migration

### 1. Create Company

```sql
INSERT INTO companies (user_id, name, website, industry, source)
VALUES (
  'user-uuid',
  'MyTab',
  'https://mytabinfo.com',
  'Hospitality Tech',
  'LinkedIn inbound'
)
RETURNING id;
```

### 2. Create Contacts

```sql
INSERT INTO contacts (user_id, company_id, name, email, role, linkedin_url, is_primary)
VALUES
  ('user-uuid', 'company-uuid', 'Mikaela Greene', 'mikaela@mytabinfo.com',
   'Co-Founder | Technical Director', 'https://linkedin.com/in/mikaelagreene', true),
  ('user-uuid', 'company-uuid', 'Eliza Greene', 'eliza@mytabinfo.com',
   'Co-Founder', NULL, false)
RETURNING id;
```

### 3. Create Engagement

```sql
INSERT INTO engagements (
  user_id, company_id, primary_contact_id,
  engagement_type, stage, name, description,
  advisory_folder_path
)
VALUES (
  'user-uuid', 'company-uuid', 'mikaela-contact-uuid',
  'deal', 'Relationship Development', 'MyTab Advisory',
  'West Australian female-founded mobile ordering app for hospitality venues',
  'advisory/deals/MyTab'
)
RETURNING id;
```

---

## Communication Migration

### Identifying Communication Types

| Channel | File Pattern | Key Indicators |
|---------|--------------|----------------|
| LinkedIn | `*linkedin*.md` | "LinkedIn DMs", "@handle" mentions |
| Email | `*email*.md` | "Subject:", "From:", "To:" headers |
| WhatsApp | `*whatsapp*.md` | Timestamped messages, phone-style format |
| SMS | `*sms*.md` | Short messages, phone numbers |

### Migration Process

#### Step 1: Create Thread

```sql
INSERT INTO activity_threads (
  user_id, engagement_id, company_id,
  channel, subject, started_at, source_file_path
)
VALUES (
  'user-uuid', 'engagement-uuid', 'company-uuid',
  'linkedin',  -- or 'email', 'whatsapp', 'sms', 'slack'
  'LinkedIn Thread: Mikaela Greene (MyTab)',
  '2025-11-06 12:50:00+08',
  'advisory/deals/MyTab/Communications/2025-11-linkedin-thread.md'
)
RETURNING id;
```

#### Step 2: Create Participants

```sql
INSERT INTO activity_participants (thread_id, name, handle, role)
VALUES
  ('thread-uuid', 'Mikaela Greene', 'mikaela-greene', 'participant'),
  ('thread-uuid', 'Sachee Perera', 'sachee-perera', 'participant');
```

#### Step 3: Parse and Insert Messages

For each message in the thread:

```sql
INSERT INTO activity_messages (
  user_id, thread_id, sender_name, sender_is_me,
  direction, sent_at, body, source_file_path
)
VALUES (
  'user-uuid', 'thread-uuid', 'Mikaela Greene', false,
  'inbound', '2025-11-06 12:50:00+08',
  $msg$Hi Sachee,

I hope you are well. My name is Mikaela, and I am the Co-Founder of MyTab...
[FULL MESSAGE CONTENT]$msg$,
  'advisory/deals/MyTab/Communications/2025-11-linkedin-thread.md'
);
```

#### Step 4: Update Thread Metadata

```sql
UPDATE activity_threads
SET
  message_count = (SELECT COUNT(*) FROM activity_messages WHERE thread_id = 'thread-uuid'),
  last_message_at = (SELECT MAX(sent_at) FROM activity_messages WHERE thread_id = 'thread-uuid')
WHERE id = 'thread-uuid';
```

### Handling Special Characters

**CRITICAL**: Use PostgreSQL dollar quoting for message bodies containing apostrophes:

```sql
-- WRONG (will fail):
INSERT INTO activity_messages (body) VALUES ('We're excited...');

-- CORRECT (use dollar quoting):
INSERT INTO activity_messages (body) VALUES ($msg$We're excited...$msg$);
```

---

## Meeting Migration

### Identifying Meeting Components

Each meeting may have:
1. **Notes file** (`*.md`) - Structured notes with metadata
2. **Transcript file** (`*.txt`) - Full conversation transcript
3. Both files should be linked to the same `activity_meetings` record

### Meeting File Structure

Expected markdown structure:

```markdown
# 2025-12-02 - Pitch Practice Session

**Attendees:** Sachee Perera, Mikaela Greene
**Duration:** ~63 minutes
**Format:** Zoom video call with screen share
**Purpose:** Pitch deck review and practice

---

## Summary
[Brief overview]

## Key Discussion Points
[Detailed notes]

## Action Items
- [ ] Task 1 (Owner)
- [ ] Task 2 (Owner)

## Key Quotes
> "Quote 1" — Speaker

---

*Transcript available: `_raw/transcript.txt`*
```

### Migration Process

#### Step 1: Create Meeting Record

```sql
INSERT INTO activity_meetings (
  user_id, engagement_id, company_id,
  title, meeting_type, channel,
  started_at, duration_mins,
  purpose, summary, notes,
  key_points, action_items, key_quotes, metrics_discussed,
  transcript, transcript_source,
  outcome, source_file_path
)
VALUES (
  'user-uuid', 'engagement-uuid', 'company-uuid',
  'Pitch Practice Session - Dec 5 Purpose Ventures Prep',
  'video_call', 'zoom',
  '2025-12-02 10:00:00+08', 63,
  'Pitch deck review and practice before Dec 5 Purpose Ventures pitch',
  'Strong presentation delivery. Identified gaps: valuation mismatch, unit economics clarity.',
  $notes$# Full meeting notes here...
[ENTIRE MARKDOWN CONTENT]$notes$,
  '["Presentation style is clear and engaging", "Takeaway positioning is strong", ...]'::jsonb,
  '[{"assignee": "Mikaela", "task": "Answer unit economics questions"}, ...]'::jsonb,
  '[{"speaker": "Mikaela", "quote": "The drop-off is getting the meeting..."}, ...]'::jsonb,
  '[{"metric": "Active Venues", "value": "16", "notes": "Down from 21"}, ...]'::jsonb,
  $transcript$[FULL TRANSCRIPT CONTENT]$transcript$,
  'manual',
  'positive',
  'advisory/deals/MyTab/Meetings/2025-12-02-pitch-practice-session.md'
)
RETURNING id;
```

#### Step 2: Create Attendees

```sql
INSERT INTO activity_attendees (meeting_id, name, role, attended, is_primary_contact)
VALUES
  ('meeting-uuid', 'Sachee Perera', 'host', true, false),
  ('meeting-uuid', 'Mikaela Greene', 'attendee', true, true);
```

### Extracting Structured Data

When migrating meetings, extract:

| Field | Source | Format |
|-------|--------|--------|
| `key_points` | Bullet points under "Key Discussion" | JSON array of strings |
| `action_items` | Checkbox items `- [ ]` | JSON array: `{assignee, task, due}` |
| `key_quotes` | Blockquotes `> "..."` | JSON array: `{speaker, quote}` |
| `metrics_discussed` | Tables or inline metrics | JSON array: `{metric, value, notes}` |

---

## Notes Migration

### Note Types

| Type | Use Case |
|------|----------|
| `general` | Miscellaneous notes |
| `observation` | Behavioral/pattern observations |
| `decision` | Recorded decisions |
| `risk` | Risk flags |
| `opportunity` | Opportunities identified |
| `action_item` | Tasks to complete |
| `hypothesis` | Assumptions to validate |
| `quote` | Notable quotes |

### Migration Process

```sql
-- Create note
INSERT INTO activity_notes (user_id, title, body, note_type)
VALUES (
  'user-uuid',
  'Valuation expectations may be misaligned',
  'Asking for $1M at $6M post-money valuation. At $24K ARR, 10x multiple = $240K valuation.',
  'observation'
)
RETURNING id;

-- Link to engagement
INSERT INTO activity_note_targets (note_id, engagement_id)
VALUES ('note-uuid', 'engagement-uuid');
```

---

## Timeline Activities

After migrating full content, create lightweight timeline entries:

```sql
INSERT INTO activities (
  user_id, engagement_id, contact_id,
  activity_type, title, activity_date,
  channel, direction, outcome, summary,
  linked_thread_id, linked_meeting_id, linked_note_id
)
VALUES
  -- For a LinkedIn thread
  ('user-uuid', 'engagement-uuid', 'contact-uuid',
   'linkedin', 'LinkedIn: Initial outreach', '2025-11-06',
   'linkedin', 'inbound', 'positive', 'Mikaela reached out for mentorship',
   'thread-uuid', NULL, NULL),

  -- For a meeting
  ('user-uuid', 'engagement-uuid', 'contact-uuid',
   'meeting', 'Pitch Practice Session', '2025-12-02',
   'zoom', NULL, 'positive', 'Reviewed pitch deck, identified gaps',
   NULL, 'meeting-uuid', NULL);
```

---

## Verification Queries

### Check Migration Completeness

```sql
-- Count by type
SELECT
  (SELECT COUNT(*) FROM activity_threads WHERE engagement_id = 'eng-uuid') as threads,
  (SELECT COUNT(*) FROM activity_messages m JOIN activity_threads t ON m.thread_id = t.id WHERE t.engagement_id = 'eng-uuid') as messages,
  (SELECT COUNT(*) FROM activity_meetings WHERE engagement_id = 'eng-uuid') as meetings,
  (SELECT COUNT(*) FROM activity_notes n JOIN activity_note_targets nt ON n.id = nt.note_id WHERE nt.engagement_id = 'eng-uuid') as notes,
  (SELECT COUNT(*) FROM activities WHERE engagement_id = 'eng-uuid') as activities;
```

### Verify Full Content Stored

```sql
-- Check meetings have transcripts
SELECT id, title,
  CASE WHEN transcript IS NOT NULL THEN 'YES' ELSE 'NO' END as has_transcript,
  LENGTH(notes) as notes_length
FROM activity_meetings
WHERE engagement_id = 'eng-uuid';

-- Check messages have full body
SELECT id, sender_name, LENGTH(body) as body_length
FROM activity_messages m
JOIN activity_threads t ON m.thread_id = t.id
WHERE t.engagement_id = 'eng-uuid';
```

### Test Search

```sql
-- Full-text search
SELECT * FROM search_communications('valuation', 'eng-uuid', 10);

-- Unified timeline
SELECT * FROM get_unified_timeline('eng-uuid', 20, 0);

-- Stats
SELECT * FROM get_communication_stats('eng-uuid');
```

---

## Common Issues & Solutions

### Issue: SQL Syntax Error with Apostrophes

**Problem**: Messages containing `'` break SQL strings.

**Solution**: Use PostgreSQL dollar quoting:
```sql
$msg$Content with apostrophes like "we're" and "don't"$msg$
```

### Issue: Channel Constraint Violation

**Problem**: `'cal.com'` not in allowed channel values.

**Solution**: Use `NULL` for channel when activity type doesn't have a standard channel, or map to closest match:
- `cal.com` → `NULL` or `'other'`
- `Google Meet` → `'google_meet'`

### Issue: Transcript File in Separate Location

**Problem**: Meeting notes reference transcript in different file.

**Solution**:
1. Check for `_raw/` subfolder
2. Check for `*-transcript.txt` alongside `*.md` notes
3. Load both into same `activity_meetings` record

### Issue: Missing Timestamps

**Problem**: Source file doesn't have precise timestamps.

**Solution**: Use file metadata or infer from context:
- File naming convention: `2025-11-10-*.md` → `2025-11-10`
- Meeting duration in header → calculate `ended_at`

---

## Automation Opportunities

Future scripts could automate:

1. **Communication Parser** - Extract messages from markdown threads
2. **Meeting Parser** - Extract structured data (action items, quotes, metrics)
3. **Transcript Linker** - Auto-match `.md` notes with `.txt` transcripts
4. **Bulk Importer** - Process entire deal folder at once

---

## Checklist

Use this checklist when migrating a new deal:

- [ ] Company created with correct industry/source
- [ ] All contacts created and linked to company
- [ ] Primary contact marked with `is_primary = true`
- [ ] Engagement created with correct stage
- [ ] `advisory_folder_path` set on engagement
- [ ] All LinkedIn threads migrated with full messages
- [ ] All email threads migrated with full messages
- [ ] All WhatsApp threads migrated (if applicable)
- [ ] All meetings migrated with full notes
- [ ] Transcripts loaded into `transcript` column
- [ ] `key_points`, `action_items`, `key_quotes` extracted as JSONB
- [ ] Notes created for observations/decisions
- [ ] Notes linked via `activity_note_targets`
- [ ] Timeline activities created for all communications
- [ ] `source_file_path` set on all records
- [ ] Verification queries pass
- [ ] Search returns expected results
