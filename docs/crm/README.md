# CRM Data Architecture

This document describes the CRM data infrastructure built following Twenty CRM patterns for managing advisory deals, clients, and communications.

## Architecture Overview

The CRM uses a **hybrid model** inspired by [Twenty CRM](https://github.com/twentyhq/twenty):

1. **Lightweight Timeline Feed** (`activities` table) - Quick activity feed display
2. **Separate Content Tables** (`activity_*` namespace) - Full content storage for messages, meetings, notes
3. **Polymorphic Linking** - Junction tables for flexible entity relationships

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CRM ARCHITECTURE                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────┐     ┌──────────────┐     ┌────────────────┐            │
│  │  companies  │────▶│  engagements │────▶│   activities   │            │
│  └─────────────┘     └──────────────┘     │  (timeline)    │            │
│         │                   │              └───────┬────────┘            │
│         │                   │                      │                     │
│         ▼                   │              ┌───────┴────────┐            │
│  ┌─────────────┐           │              ▼                ▼            │
│  │  contacts   │           │      ┌────────────────┐ ┌─────────────────┐│
│  └─────────────┘           │      │activity_threads│ │activity_meetings││
│                            │      └───────┬────────┘ └─────────────────┘│
│                            │              │                              │
│                            │              ▼                              │
│                            │      ┌─────────────────┐ ┌──────────────┐  │
│                            │      │activity_messages│ │activity_notes│  │
│                            │      └─────────────────┘ └──────────────┘  │
│                            │                                             │
│                            └─────────────────────────────────────────────│
└─────────────────────────────────────────────────────────────────────────┘
```

## Naming Convention

All CRM content tables use the `activity_*` prefix to clearly distinguish them from the AI chat `messages` table:

| Old Name | New Name | Purpose |
|----------|----------|---------|
| `message_threads` | `activity_threads` | Message thread containers |
| `thread_messages` | `activity_messages` | Individual messages |
| `message_participants` | `activity_participants` | Thread participants |
| `meetings` | `activity_meetings` | Full meeting records |
| `meeting_attendees` | `activity_attendees` | Meeting participants |
| `notes` | `activity_notes` | Internal notes |
| `note_targets` | `activity_note_targets` | Polymorphic note links |

## Table Categories

### Core Entities (CRM Foundation)
| Table | Purpose | Rows |
|-------|---------|------|
| `companies` | Organizations/companies | 1 |
| `contacts` | People at companies | 2 |
| `engagements` | Leads, deals, clients (unified) | 1 |
| `stage_history` | Audit trail for stage changes | 5 |

### Activity & Timeline
| Table | Purpose | Rows |
|-------|---------|------|
| `activities` | Lightweight timeline feed | 17 |

### Communications (Full Content)
| Table | Purpose | Rows |
|-------|---------|------|
| `activity_threads` | Groups related messages (LinkedIn, WhatsApp, email) | 2 |
| `activity_messages` | Individual messages with full content | 16 |
| `activity_participants` | Who's in each thread | 4 |

### Meetings (Full Content)
| Table | Purpose | Rows |
|-------|---------|------|
| `activity_meetings` | Full meeting notes, transcripts, structured data | 2 |
| `activity_attendees` | Who attended meetings | 4 |

### Notes & Linking
| Table | Purpose | Rows |
|-------|---------|------|
| `activity_notes` | Internal notes/observations | 3 |
| `activity_note_targets` | Junction table for polymorphic linking | 3 |

## Key Design Patterns

### 1. Hybrid Content Model
- **activities**: Lightweight feed with summaries (for quick display)
- **Full content tables**: Complete message bodies, meeting notes, transcripts
- **Linked FKs**: `activities.linked_thread_id`, `linked_meeting_id`, `linked_note_id`

### 2. Message Threading
```
activity_threads (container)
    └── activity_messages (individual messages)
    └── activity_participants (who's involved)
```

Supports: LinkedIn, WhatsApp, Email, SMS, Slack

### 3. Polymorphic Notes
Notes can link to multiple entity types via `activity_note_targets`:
- Engagement
- Company
- Contact
- Meeting
- Thread

### 4. Full-Text Search
All content tables have `search_vector` (tsvector) columns with weighted fields:
- Weight A: titles, names
- Weight B: summaries, subjects
- Weight C: full body content

### 5. Soft Deletes
All tables use `deleted_at` timestamp pattern for soft deletion.

## RPC Functions

### `get_unified_timeline(engagement_id, limit, offset)`
Returns unified feed across all activity types:
- Activities
- Messages (from `activity_messages`)
- Meetings (from `activity_meetings`)
- Notes (from `activity_notes`)

### `search_communications(query, engagement_id, limit)`
Full-text search across all communications with relevance ranking.

### `get_communication_stats(engagement_id)`
Returns communication statistics:
- Total messages, meetings, notes
- Messages by channel
- Meetings by type
- Days since last contact

## File Structure

```
docs/crm/
├── README.md                 # This file
├── schema-reference.md       # Detailed column reference
└── migration-sop.md          # Standard operating procedure for data migration
```

## Related Files

- **Migrations**: Stored in Supabase (check `list_migrations`)
- **Advisory Files**: `advisory/deals/*/` - Source markdown files
- **RPC Functions**: Defined via Supabase migrations

## Quick Start

### Query all activities for an engagement
```sql
SELECT * FROM get_unified_timeline(
  'engagement-uuid',
  50,  -- limit
  0    -- offset
);
```

### Search communications
```sql
SELECT * FROM search_communications(
  'valuation',  -- search query
  'engagement-uuid',
  20  -- limit
);
```

### Get communication stats
```sql
SELECT * FROM get_communication_stats('engagement-uuid');
```

---

For detailed column definitions, see [schema-reference.md](./schema-reference.md).
For migration procedures, see [migration-sop.md](./migration-sop.md).
