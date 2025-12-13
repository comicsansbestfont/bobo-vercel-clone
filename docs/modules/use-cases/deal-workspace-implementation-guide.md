# Deal Workspace Implementation Guide

**For: Claude Code & ChatGPT Codex**
**Reference Architecture: Twenty CRM (adapted for Next.js 16 + Supabase)**
**Status: Ready for Implementation**
**Created: December 13, 2025**

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Decisions](#2-architecture-decisions)
3. [Database Schema (Supabase Migrations)](#3-database-schema-supabase-migrations)
4. [API Routes Specification](#4-api-routes-specification)
5. [Frontend Component Architecture](#5-frontend-component-architecture)
6. [Implementation Phases](#6-implementation-phases)
7. [AI Coding Prompts](#7-ai-coding-prompts)

---

## 1. Executive Summary

### What to Adopt from Twenty CRM

| Pattern | Twenty Approach | Bobo Adaptation |
|---------|-----------------|-----------------|
| **Database Schema** | Custom Twenty-ORM decorators | Supabase migrations with RLS |
| **Composite Types** | JSONB for Currency, Address, etc. | Same - JSONB columns |
| **Polymorphic Relations** | Junction tables (NoteTarget) | Timeline activities with nullable FKs |
| **Full-Text Search** | tsvector + GIN index | Same - native PostgreSQL |
| **Soft Deletes** | `deleted_at` column everywhere | Same pattern |
| **Timeline** | TimelineActivity entity | `activities` table |
| **Kanban** | RecordBoard components | Adapt with shadcn/ui + dnd-kit |
| **State Management** | Recoil | Zustand (simpler, smaller) |

### What NOT to Port

- Twenty's NestJS backend (too tightly coupled)
- Twenty's GraphQL code generation (unnecessary complexity)
- Twenty's multi-tenancy (schema-per-workspace) - use RLS instead
- Twenty's custom ORM decorators - use Supabase client directly

### Tech Stack for Bobo Deal Workspace

```
Frontend:    Next.js 16 + React 19 + shadcn/ui + Tailwind v4 + Zustand
Backend:     Next.js API Routes + Supabase (PostgreSQL + RLS)
Drag/Drop:   @dnd-kit/core + @dnd-kit/sortable
Search:      pgvector + tsvector (already in use)
AI:          Claude SDK (existing) with deal context tools
```

---

## 2. Architecture Decisions

### 2.1 Database Architecture

**Supabase RLS vs Schema-per-Tenant:**
Twenty uses schema-per-workspace for multi-tenancy. For Bobo (single-user advisory tool), we use:
- Single schema with `user_id` on all tables
- RLS policies for data isolation
- No workspace abstraction needed

**Composite JSONB Types:**
Adopt Twenty's pattern for flexible fields:

```typescript
// Types for JSONB columns
interface CurrencyField {
  amountMicros: number;  // Store as micros to avoid floating point issues
  currencyCode: string;  // ISO 4217: 'USD', 'AUD', etc.
}

interface NameField {
  firstName: string;
  lastName: string;
}

interface EmailsField {
  primaryEmail: string;
  additionalEmails: string[];
}

interface PhonesField {
  primaryPhoneNumber: string;
  countryCode: string;
  callingCode: string;
  additionalPhones: { number: string; label: string }[];
}

interface AddressField {
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface LinksField {
  primaryUrl: string;
  additionalLinks: { url: string; label: string }[];
}
```

### 2.2 API Architecture

**Pattern: Next.js API Routes with Supabase**

```
/api/deals                    GET (list), POST (create)
/api/deals/[id]               GET, PATCH, DELETE
/api/deals/[id]/stage         PATCH (update stage only)
/api/deals/[id]/activities    GET (timeline), POST (log activity)
/api/activities/[id]          GET, PATCH, DELETE
/api/contacts                 GET, POST
/api/contacts/[id]            GET, PATCH, DELETE
/api/tasks                    GET, POST
/api/tasks/[id]               GET, PATCH, DELETE
/api/tasks/[id]/complete      POST (mark complete)
```

### 2.3 Frontend Architecture

**Component Hierarchy (Inspired by Twenty):**

```
DealWorkspace/
├── DealWorkspaceLayout.tsx      # 3-column responsive layout
├── panels/
│   ├── LeftPanel/
│   │   ├── DealCard.tsx         # Stage selector, ARR, close date
│   │   ├── AboutCard.tsx        # Founder, website, source
│   │   ├── AssessmentCard.tsx   # Strengths, weaknesses, flags
│   │   ├── ContactsCard.tsx     # Associated people
│   │   └── FilesCard.tsx        # Deal documents browser
│   ├── MiddlePanel/
│   │   ├── QuickActionsBar.tsx  # Activity logging buttons
│   │   ├── ActivityTimeline.tsx # Chronological feed
│   │   ├── ActivityCard.tsx     # Individual activity display
│   │   └── StageHistory.tsx     # Pipeline progression
│   └── RightPanel/
│       ├── AIChat.tsx           # Claude conversation
│       ├── ArtifactPane.tsx     # Generated documents
│       └── SuggestedActions.tsx # AI recommendations
├── modals/
│   ├── LogActivityModal.tsx     # Unified activity form
│   ├── CreateTaskModal.tsx      # Task creation
│   └── ContactModal.tsx         # Add/edit contact
└── hooks/
    ├── useDeal.ts               # Deal data fetching
    ├── useActivities.ts         # Activity CRUD
    ├── useDealMutations.ts      # Optimistic updates
    └── useDealStore.ts          # Zustand store
```

---

## 3. Database Schema (Supabase Migrations)

### Migration 001: Core CRM Tables

```sql
-- Migration: 001_create_crm_tables.sql
-- Description: Core CRM tables for deal workspace

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For fuzzy text search

-- Contacts table (persons in Twenty terminology)
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Name (JSONB composite)
  name JSONB NOT NULL DEFAULT '{"firstName": "", "lastName": ""}',

  -- Communication
  emails JSONB DEFAULT '{"primaryEmail": null, "additionalEmails": []}',
  phones JSONB DEFAULT '{"primaryPhoneNumber": null, "countryCode": null, "callingCode": null, "additionalPhones": []}',

  -- Professional
  job_title TEXT,
  company_name TEXT,
  linkedin_url TEXT,

  -- Full-text search
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name->>'firstName', '')), 'A') ||
    setweight(to_tsvector('english', coalesce(name->>'lastName', '')), 'A') ||
    setweight(to_tsvector('english', coalesce(company_name, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(job_title, '')), 'C')
  ) STORED,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ  -- Soft delete
);

-- Activities table (unified timeline)
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,  -- Deal reference

  -- Activity classification
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'call', 'email', 'meeting', 'note', 'task_completed',
    'linkedin_message', 'whatsapp', 'stage_change'
  )),

  -- Core fields
  title TEXT,
  activity_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_mins INTEGER,

  -- Communication-specific
  channel TEXT CHECK (channel IN (
    'zoom', 'phone', 'email', 'whatsapp', 'linkedin',
    'in_person', 'slack', 'teams', 'google_meet'
  )),
  direction TEXT CHECK (direction IN ('inbound', 'outbound')),
  outcome TEXT CHECK (outcome IN (
    'positive', 'neutral', 'negative',
    'no_answer', 'left_message', 'scheduled_follow_up'
  )),

  -- Content
  summary TEXT,
  body TEXT,  -- Full content for emails/notes
  next_steps TEXT,

  -- Associations (polymorphic via nullable FKs - Twenty pattern)
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,

  -- Attendees for meetings (JSONB array)
  attendees JSONB DEFAULT '[]',
  -- Format: [{"contactId": "uuid", "name": "string", "email": "string"}]

  -- File reference (for linking to master docs)
  linked_file_path TEXT,

  -- Metadata (extensible)
  metadata JSONB DEFAULT '{}',

  -- Full-text search
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(summary, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(body, '')), 'C')
  ) STORED,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Tasks table (action items)
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,

  -- Task details
  title TEXT NOT NULL,
  description TEXT,

  -- Scheduling
  due_date TIMESTAMPTZ,
  reminder_date TIMESTAMPTZ,

  -- Classification
  task_type TEXT DEFAULT 'to_do' CHECK (task_type IN (
    'call', 'email', 'meeting', 'to_do', 'linkedin', 'follow_up'
  )),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),

  -- Associations
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  activity_id UUID REFERENCES activities(id) ON DELETE SET NULL,  -- Created from activity

  -- Completion tracking
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Deal-Contact junction (many-to-many)
CREATE TABLE deal_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,

  -- Role in deal
  role TEXT,  -- 'founder', 'decision_maker', 'champion', 'blocker', 'influencer'
  is_primary BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(project_id, contact_id)
);

-- Stage history tracking
CREATE TABLE stage_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),

  -- Stage transition
  from_stage TEXT,
  to_stage TEXT NOT NULL,

  -- Context
  reason TEXT,  -- Why stage changed
  notes TEXT,

  -- Timestamps
  changed_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_contacts_user ON contacts(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_contacts_search ON contacts USING GIN(search_vector);

CREATE INDEX idx_activities_user ON activities(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_activities_project ON activities(project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_activities_date ON activities(activity_date DESC);
CREATE INDEX idx_activities_type ON activities(activity_type);
CREATE INDEX idx_activities_search ON activities USING GIN(search_vector);

CREATE INDEX idx_tasks_user ON tasks(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_project ON tasks(project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_due ON tasks(due_date) WHERE status = 'pending';
CREATE INDEX idx_tasks_status ON tasks(status) WHERE deleted_at IS NULL;

CREATE INDEX idx_deal_contacts_project ON deal_contacts(project_id);
CREATE INDEX idx_deal_contacts_contact ON deal_contacts(contact_id);

CREATE INDEX idx_stage_history_project ON stage_history(project_id);

-- RLS Policies
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE stage_history ENABLE ROW LEVEL SECURITY;

-- Contacts policies
CREATE POLICY "Users can view own contacts"
  ON contacts FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can insert own contacts"
  ON contacts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contacts"
  ON contacts FOR UPDATE
  USING (auth.uid() = user_id);

-- Activities policies
CREATE POLICY "Users can view own activities"
  ON activities FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can insert own activities"
  ON activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own activities"
  ON activities FOR UPDATE
  USING (auth.uid() = user_id);

-- Tasks policies
CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can insert own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id);

-- Deal contacts policies
CREATE POLICY "Users can manage deal contacts for own projects"
  ON deal_contacts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = deal_contacts.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Stage history policies
CREATE POLICY "Users can view own stage history"
  ON stage_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stage history"
  ON stage_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Update trigger for timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER activities_updated_at
  BEFORE UPDATE ON activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### Migration 002: Projects Table Extensions

```sql
-- Migration: 002_extend_projects_for_deals.sql
-- Description: Add deal-specific columns to projects table

-- Add deal-specific columns to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deal_value JSONB;
-- Format: {"amountMicros": 45000000000, "currencyCode": "USD"}

ALTER TABLE projects ADD COLUMN IF NOT EXISTS close_date DATE;

ALTER TABLE projects ADD COLUMN IF NOT EXISTS deal_stage TEXT DEFAULT 'New Opportunity'
  CHECK (deal_stage IN (
    'New Opportunity',
    'Triage & Qualification',
    'Deep Dive & Diagnosis',
    'Relationship Development',
    'Proposal Presented',
    'Contract Sent',
    'Finalising Terms',
    'Closed Won',
    'Closed Lost'
  ));

ALTER TABLE projects ADD COLUMN IF NOT EXISTS deal_probability INTEGER DEFAULT 0
  CHECK (deal_probability >= 0 AND deal_probability <= 100);

ALTER TABLE projects ADD COLUMN IF NOT EXISTS lost_reason TEXT;

-- Stage probability mapping function
CREATE OR REPLACE FUNCTION get_stage_probability(stage TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN CASE stage
    WHEN 'New Opportunity' THEN 10
    WHEN 'Triage & Qualification' THEN 20
    WHEN 'Deep Dive & Diagnosis' THEN 40
    WHEN 'Relationship Development' THEN 50
    WHEN 'Proposal Presented' THEN 60
    WHEN 'Contract Sent' THEN 75
    WHEN 'Finalising Terms' THEN 90
    WHEN 'Closed Won' THEN 100
    WHEN 'Closed Lost' THEN 0
    ELSE 0
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to auto-update probability on stage change
CREATE OR REPLACE FUNCTION update_deal_probability()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deal_stage IS DISTINCT FROM OLD.deal_stage THEN
    NEW.deal_probability = get_stage_probability(NEW.deal_stage);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_deal_probability
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_deal_probability();
```

### Migration 003: RPC Functions for Complex Queries

```sql
-- Migration: 003_crm_rpc_functions.sql
-- Description: Server-side functions for complex CRM queries

-- Get deal timeline with all activities
CREATE OR REPLACE FUNCTION get_deal_timeline(
  p_project_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  activity_type TEXT,
  title TEXT,
  activity_date TIMESTAMPTZ,
  duration_mins INTEGER,
  channel TEXT,
  direction TEXT,
  outcome TEXT,
  summary TEXT,
  contact_name JSONB,
  attendees JSONB,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.activity_type,
    a.title,
    a.activity_date,
    a.duration_mins,
    a.channel,
    a.direction,
    a.outcome,
    a.summary,
    c.name as contact_name,
    a.attendees,
    a.created_at
  FROM activities a
  LEFT JOIN contacts c ON a.contact_id = c.id
  WHERE a.project_id = p_project_id
    AND a.deleted_at IS NULL
  ORDER BY a.activity_date DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get deal summary stats
CREATE OR REPLACE FUNCTION get_deal_stats(p_project_id UUID)
RETURNS TABLE (
  total_activities INTEGER,
  total_calls INTEGER,
  total_meetings INTEGER,
  total_emails INTEGER,
  days_in_stage INTEGER,
  days_since_last_activity INTEGER,
  open_tasks INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH activity_counts AS (
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE activity_type = 'call') as calls,
      COUNT(*) FILTER (WHERE activity_type = 'meeting') as meetings,
      COUNT(*) FILTER (WHERE activity_type = 'email') as emails,
      MAX(activity_date) as last_activity
    FROM activities
    WHERE project_id = p_project_id AND deleted_at IS NULL
  ),
  stage_info AS (
    SELECT
      EXTRACT(DAY FROM now() - changed_at)::INTEGER as days
    FROM stage_history
    WHERE project_id = p_project_id
    ORDER BY changed_at DESC
    LIMIT 1
  ),
  task_counts AS (
    SELECT COUNT(*) as open_tasks
    FROM tasks
    WHERE project_id = p_project_id
      AND status = 'pending'
      AND deleted_at IS NULL
  )
  SELECT
    ac.total::INTEGER,
    ac.calls::INTEGER,
    ac.meetings::INTEGER,
    ac.emails::INTEGER,
    COALESCE(si.days, 0),
    EXTRACT(DAY FROM now() - ac.last_activity)::INTEGER,
    tc.open_tasks::INTEGER
  FROM activity_counts ac
  CROSS JOIN task_counts tc
  LEFT JOIN stage_info si ON true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Search activities with full-text
CREATE OR REPLACE FUNCTION search_deal_activities(
  p_project_id UUID,
  p_query TEXT,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  activity_type TEXT,
  title TEXT,
  summary TEXT,
  activity_date TIMESTAMPTZ,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.activity_type,
    a.title,
    a.summary,
    a.activity_date,
    ts_rank(a.search_vector, websearch_to_tsquery('english', p_query)) as rank
  FROM activities a
  WHERE a.project_id = p_project_id
    AND a.deleted_at IS NULL
    AND a.search_vector @@ websearch_to_tsquery('english', p_query)
  ORDER BY rank DESC, a.activity_date DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get upcoming tasks for a deal
CREATE OR REPLACE FUNCTION get_deal_tasks(
  p_project_id UUID,
  p_status TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  due_date TIMESTAMPTZ,
  task_type TEXT,
  priority TEXT,
  status TEXT,
  contact_name JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.title,
    t.description,
    t.due_date,
    t.task_type,
    t.priority,
    t.status,
    c.name as contact_name
  FROM tasks t
  LEFT JOIN contacts c ON t.contact_id = c.id
  WHERE t.project_id = p_project_id
    AND t.deleted_at IS NULL
    AND (p_status IS NULL OR t.status = p_status)
  ORDER BY
    CASE t.priority
      WHEN 'urgent' THEN 1
      WHEN 'high' THEN 2
      WHEN 'medium' THEN 3
      WHEN 'low' THEN 4
    END,
    t.due_date ASC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 4. API Routes Specification

### 4.1 Activities API

**File: `app/api/activities/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schema
const createActivitySchema = z.object({
  project_id: z.string().uuid(),
  activity_type: z.enum(['call', 'email', 'meeting', 'note', 'task_completed', 'linkedin_message', 'whatsapp', 'stage_change']),
  title: z.string().optional(),
  activity_date: z.string().datetime().optional(),
  duration_mins: z.number().int().positive().optional(),
  channel: z.enum(['zoom', 'phone', 'email', 'whatsapp', 'linkedin', 'in_person', 'slack', 'teams', 'google_meet']).optional(),
  direction: z.enum(['inbound', 'outbound']).optional(),
  outcome: z.enum(['positive', 'neutral', 'negative', 'no_answer', 'left_message', 'scheduled_follow_up']).optional(),
  summary: z.string().optional(),
  body: z.string().optional(),
  next_steps: z.string().optional(),
  contact_id: z.string().uuid().optional(),
  attendees: z.array(z.object({
    contactId: z.string().uuid().optional(),
    name: z.string(),
    email: z.string().email().optional()
  })).optional(),
  linked_file_path: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const projectId = searchParams.get('project_id');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  if (!projectId) {
    return NextResponse.json({ error: 'project_id required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .rpc('get_deal_timeline', {
      p_project_id: projectId,
      p_limit: limit,
      p_offset: offset
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ activities: data });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json();

  const validation = createActivitySchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error.errors }, { status: 400 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('activities')
    .insert({
      ...validation.data,
      user_id: user.id,
      activity_date: validation.data.activity_date || new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ activity: data }, { status: 201 });
}
```

**File: `app/api/activities/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('activities')
    .select(`
      *,
      contact:contacts(id, name, emails, job_title)
    `)
    .eq('id', params.id)
    .is('deleted_at', null)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json({ activity: data });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const body = await request.json();

  const { data, error } = await supabase
    .from('activities')
    .update(body)
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ activity: data });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();

  // Soft delete
  const { error } = await supabase
    .from('activities')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
```

### 4.2 Tasks API

**File: `app/api/tasks/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const createTaskSchema = z.object({
  project_id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  due_date: z.string().datetime().optional(),
  task_type: z.enum(['call', 'email', 'meeting', 'to_do', 'linkedin', 'follow_up']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  contact_id: z.string().uuid().optional(),
  activity_id: z.string().uuid().optional(),
});

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const projectId = searchParams.get('project_id');
  const status = searchParams.get('status');

  const { data, error } = await supabase
    .rpc('get_deal_tasks', {
      p_project_id: projectId,
      p_status: status
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tasks: data });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json();

  const validation = createTaskSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error.errors }, { status: 400 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      ...validation.data,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ task: data }, { status: 201 });
}
```

**File: `app/api/tasks/[id]/complete/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('tasks')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      completed_by: user.id,
    })
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Also create a task_completed activity
  await supabase.from('activities').insert({
    user_id: user.id,
    project_id: data.project_id,
    activity_type: 'task_completed',
    title: `Completed: ${data.title}`,
    activity_date: new Date().toISOString(),
  });

  return NextResponse.json({ task: data });
}
```

### 4.3 Contacts API

**File: `app/api/contacts/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const createContactSchema = z.object({
  name: z.object({
    firstName: z.string().min(1),
    lastName: z.string().optional(),
  }),
  emails: z.object({
    primaryEmail: z.string().email().optional(),
    additionalEmails: z.array(z.string().email()).optional(),
  }).optional(),
  phones: z.object({
    primaryPhoneNumber: z.string().optional(),
    countryCode: z.string().optional(),
    callingCode: z.string().optional(),
    additionalPhones: z.array(z.object({
      number: z.string(),
      label: z.string(),
    })).optional(),
  }).optional(),
  job_title: z.string().optional(),
  company_name: z.string().optional(),
  linkedin_url: z.string().url().optional(),
});

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const query = searchParams.get('q');
  const limit = parseInt(searchParams.get('limit') || '50');

  let dbQuery = supabase
    .from('contacts')
    .select('*')
    .is('deleted_at', null)
    .limit(limit);

  if (query) {
    dbQuery = dbQuery.textSearch('search_vector', query);
  }

  const { data, error } = await dbQuery;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ contacts: data });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json();

  const validation = createContactSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error.errors }, { status: 400 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('contacts')
    .insert({
      ...validation.data,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ contact: data }, { status: 201 });
}
```

---

## 5. Frontend Component Architecture

### 5.1 Zustand Store for Deal State

**File: `lib/stores/deal-store.ts`**

```typescript
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface Activity {
  id: string;
  activity_type: string;
  title: string | null;
  activity_date: string;
  duration_mins: number | null;
  channel: string | null;
  direction: string | null;
  outcome: string | null;
  summary: string | null;
  contact_name: { firstName: string; lastName: string } | null;
  attendees: Array<{ contactId?: string; name: string; email?: string }>;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  task_type: string;
  priority: string;
  status: string;
  contact_name: { firstName: string; lastName: string } | null;
}

interface DealState {
  // Current deal
  dealId: string | null;
  dealData: Record<string, unknown> | null;

  // Activities
  activities: Activity[];
  activitiesLoading: boolean;

  // Tasks
  tasks: Task[];
  tasksLoading: boolean;

  // UI state
  activePanel: 'chat' | 'artifact' | 'suggestions';
  activityModalOpen: boolean;
  activityModalType: string | null;

  // Actions
  setDeal: (id: string, data: Record<string, unknown>) => void;
  setActivities: (activities: Activity[]) => void;
  addActivity: (activity: Activity) => void;
  updateActivity: (id: string, updates: Partial<Activity>) => void;
  removeActivity: (id: string) => void;
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  completeTask: (id: string) => void;
  openActivityModal: (type: string) => void;
  closeActivityModal: () => void;
  setActivePanel: (panel: 'chat' | 'artifact' | 'suggestions') => void;
}

export const useDealStore = create<DealState>()(
  immer((set) => ({
    dealId: null,
    dealData: null,
    activities: [],
    activitiesLoading: false,
    tasks: [],
    tasksLoading: false,
    activePanel: 'chat',
    activityModalOpen: false,
    activityModalType: null,

    setDeal: (id, data) => set((state) => {
      state.dealId = id;
      state.dealData = data;
    }),

    setActivities: (activities) => set((state) => {
      state.activities = activities;
    }),

    addActivity: (activity) => set((state) => {
      // Optimistic: insert at correct position by date
      const insertIdx = state.activities.findIndex(
        a => new Date(a.activity_date) < new Date(activity.activity_date)
      );
      if (insertIdx === -1) {
        state.activities.push(activity);
      } else {
        state.activities.splice(insertIdx, 0, activity);
      }
    }),

    updateActivity: (id, updates) => set((state) => {
      const idx = state.activities.findIndex(a => a.id === id);
      if (idx !== -1) {
        state.activities[idx] = { ...state.activities[idx], ...updates };
      }
    }),

    removeActivity: (id) => set((state) => {
      state.activities = state.activities.filter(a => a.id !== id);
    }),

    setTasks: (tasks) => set((state) => {
      state.tasks = tasks;
    }),

    addTask: (task) => set((state) => {
      state.tasks.unshift(task);
    }),

    completeTask: (id) => set((state) => {
      const idx = state.tasks.findIndex(t => t.id === id);
      if (idx !== -1) {
        state.tasks[idx].status = 'completed';
      }
    }),

    openActivityModal: (type) => set((state) => {
      state.activityModalOpen = true;
      state.activityModalType = type;
    }),

    closeActivityModal: () => set((state) => {
      state.activityModalOpen = false;
      state.activityModalType = null;
    }),

    setActivePanel: (panel) => set((state) => {
      state.activePanel = panel;
    }),
  }))
);
```

### 5.2 Deal Workspace Layout

**File: `components/deal-workspace/DealWorkspaceLayout.tsx`**

```tsx
'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface DealWorkspaceLayoutProps {
  leftPanel: ReactNode;
  middlePanel: ReactNode;
  rightPanel: ReactNode;
  rightPanelCollapsed?: boolean;
}

export function DealWorkspaceLayout({
  leftPanel,
  middlePanel,
  rightPanel,
  rightPanelCollapsed = false,
}: DealWorkspaceLayoutProps) {
  return (
    <div className="h-screen flex flex-col">
      {/* Header would go here */}

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Fixed 280px */}
        <aside className="w-[280px] flex-shrink-0 border-r overflow-y-auto">
          {leftPanel}
        </aside>

        {/* Middle Panel - Flexible */}
        <main className="flex-1 min-w-[400px] overflow-y-auto">
          {middlePanel}
        </main>

        {/* Right Panel - 400px, collapsible */}
        <aside
          className={cn(
            "flex-shrink-0 border-l overflow-y-auto transition-all duration-300",
            rightPanelCollapsed ? "w-0" : "w-[400px]"
          )}
        >
          {!rightPanelCollapsed && rightPanel}
        </aside>
      </div>
    </div>
  );
}
```

### 5.3 Quick Actions Bar

**File: `components/deal-workspace/QuickActionsBar.tsx`**

```tsx
'use client';

import { Phone, Mail, Calendar, FileText, CheckSquare, FileSpreadsheet, ArrowUpRight, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDealStore } from '@/lib/stores/deal-store';

const quickActions = [
  { id: 'call', icon: Phone, label: 'Log Call' },
  { id: 'email', icon: Mail, label: 'Log Email' },
  { id: 'meeting', icon: Calendar, label: 'Log Meeting' },
  { id: 'note', icon: FileText, label: 'Add Note' },
  { id: 'task', icon: CheckSquare, label: 'Add Task' },
];

const secondaryActions = [
  { id: 'brief', icon: FileSpreadsheet, label: 'Prep Brief' },
  { id: 'stage', icon: ArrowUpRight, label: 'Move Stage' },
];

export function QuickActionsBar() {
  const openActivityModal = useDealStore((s) => s.openActivityModal);

  return (
    <div className="p-4 border-b space-y-3">
      {/* Primary Actions */}
      <div className="flex gap-2">
        {quickActions.map((action) => (
          <Button
            key={action.id}
            variant="outline"
            size="sm"
            onClick={() => openActivityModal(action.id)}
            className="flex items-center gap-2"
          >
            <action.icon className="h-4 w-4" />
            {action.label}
          </Button>
        ))}
      </div>

      {/* Secondary Actions + Search */}
      <div className="flex items-center gap-2">
        {secondaryActions.map((action) => (
          <Button
            key={action.id}
            variant="ghost"
            size="sm"
            onClick={() => openActivityModal(action.id)}
            className="flex items-center gap-2"
          >
            <action.icon className="h-4 w-4" />
            {action.label}
          </Button>
        ))}

        <div className="flex-1 ml-4">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search activities..."
              className="pl-8 h-8"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 5.4 Activity Card Component

**File: `components/deal-workspace/ActivityCard.tsx`**

```tsx
'use client';

import { Phone, Mail, Calendar, FileText, CheckCircle2, MessageSquare, Linkedin } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow, format } from 'date-fns';

const activityIcons: Record<string, typeof Phone> = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  note: FileText,
  task_completed: CheckCircle2,
  linkedin_message: Linkedin,
  whatsapp: MessageSquare,
};

const outcomeColors: Record<string, string> = {
  positive: 'bg-green-100 text-green-800',
  neutral: 'bg-gray-100 text-gray-800',
  negative: 'bg-red-100 text-red-800',
  no_answer: 'bg-yellow-100 text-yellow-800',
  left_message: 'bg-blue-100 text-blue-800',
};

interface ActivityCardProps {
  activity: {
    id: string;
    activity_type: string;
    title: string | null;
    activity_date: string;
    duration_mins: number | null;
    channel: string | null;
    direction: string | null;
    outcome: string | null;
    summary: string | null;
    contact_name: { firstName: string; lastName: string } | null;
    attendees: Array<{ name: string }>;
  };
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ActivityCard({ activity, onEdit, onDelete }: ActivityCardProps) {
  const Icon = activityIcons[activity.activity_type] || FileText;
  const contactName = activity.contact_name
    ? `${activity.contact_name.firstName} ${activity.contact_name.lastName || ''}`.trim()
    : null;

  return (
    <Card className="hover:bg-accent/50 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h4 className="font-medium">
                {activity.title || `${activity.activity_type} ${contactName ? `with ${contactName}` : ''}`}
              </h4>
              <p className="text-sm text-muted-foreground">
                {format(new Date(activity.activity_date), 'MMM d, yyyy · h:mm a')}
              </p>
            </div>
          </div>
          {activity.outcome && (
            <Badge className={outcomeColors[activity.outcome]}>
              {activity.outcome}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {/* Metadata row */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {activity.duration_mins && (
            <span>{activity.duration_mins} min</span>
          )}
          {activity.channel && (
            <span className="capitalize">{activity.channel}</span>
          )}
          {activity.direction && (
            <Badge variant="outline" className="capitalize">
              {activity.direction}
            </Badge>
          )}
          {activity.attendees.length > 0 && (
            <span>{activity.attendees.length} attendee(s)</span>
          )}
        </div>

        {/* Summary */}
        {activity.summary && (
          <p className="text-sm line-clamp-3">{activity.summary}</p>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onEdit}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="text-xs text-muted-foreground hover:text-destructive"
          >
            Delete
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
```

### 5.5 Activity Timeline

**File: `components/deal-workspace/ActivityTimeline.tsx`**

```tsx
'use client';

import { useEffect } from 'react';
import { useDealStore } from '@/lib/stores/deal-store';
import { ActivityCard } from './ActivityCard';
import { Skeleton } from '@/components/ui/skeleton';
import { isToday, isYesterday, isThisWeek, format } from 'date-fns';

function groupActivitiesByDate(activities: Array<{ activity_date: string; [key: string]: unknown }>) {
  const groups: Record<string, typeof activities> = {};

  activities.forEach((activity) => {
    const date = new Date(activity.activity_date);
    let key: string;

    if (isToday(date)) {
      key = 'Today';
    } else if (isYesterday(date)) {
      key = 'Yesterday';
    } else if (isThisWeek(date)) {
      key = 'This Week';
    } else {
      key = format(date, 'MMMM yyyy');
    }

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(activity);
  });

  return groups;
}

interface ActivityTimelineProps {
  dealId: string;
}

export function ActivityTimeline({ dealId }: ActivityTimelineProps) {
  const { activities, activitiesLoading, setActivities, removeActivity } = useDealStore();

  useEffect(() => {
    async function fetchActivities() {
      const res = await fetch(`/api/activities?project_id=${dealId}`);
      const data = await res.json();
      setActivities(data.activities || []);
    }
    fetchActivities();
  }, [dealId, setActivities]);

  const handleDelete = async (id: string) => {
    // Optimistic update
    removeActivity(id);

    await fetch(`/api/activities/${id}`, { method: 'DELETE' });
  };

  if (activitiesLoading) {
    return (
      <div className="space-y-4 p-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  const groupedActivities = groupActivitiesByDate(activities);

  return (
    <div className="p-4 space-y-6">
      {Object.entries(groupedActivities).map(([group, items]) => (
        <div key={group}>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            {group}
          </h3>
          <div className="space-y-3">
            {items.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity as any}
                onDelete={() => handleDelete(activity.id as string)}
              />
            ))}
          </div>
        </div>
      ))}

      {activities.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No activities yet</p>
          <p className="text-sm">Log your first call, email, or meeting</p>
        </div>
      )}
    </div>
  );
}
```

---

## 6. Implementation Phases

### Phase 1: Database Foundation (Day 1-2)

**Tasks:**
1. Apply migration 001 (core CRM tables)
2. Apply migration 002 (projects extensions)
3. Apply migration 003 (RPC functions)
4. Verify RLS policies work correctly
5. Seed test data

**Verification:**
```sql
-- Test contact creation
INSERT INTO contacts (user_id, name, emails)
VALUES (auth.uid(), '{"firstName": "Mikaela", "lastName": "Greene"}', '{"primaryEmail": "mikaela@mytab.app"}');

-- Test activity creation
INSERT INTO activities (user_id, project_id, activity_type, title, activity_date)
VALUES (auth.uid(), 'deal-uuid', 'call', 'Pitch deck review', now());

-- Test timeline RPC
SELECT * FROM get_deal_timeline('deal-uuid', 20, 0);
```

### Phase 2: API Routes (Day 2-3)

**Tasks:**
1. Create `/api/activities` routes (GET, POST)
2. Create `/api/activities/[id]` routes (GET, PATCH, DELETE)
3. Create `/api/tasks` routes
4. Create `/api/tasks/[id]/complete` route
5. Create `/api/contacts` routes
6. Add Zod validation to all routes

**Test with curl:**
```bash
# Create activity
curl -X POST http://localhost:3000/api/activities \
  -H "Content-Type: application/json" \
  -d '{"project_id": "uuid", "activity_type": "call", "title": "Test call"}'

# Get timeline
curl "http://localhost:3000/api/activities?project_id=uuid"
```

### Phase 3: Frontend Foundation (Day 3-5)

**Tasks:**
1. Create Zustand store (`lib/stores/deal-store.ts`)
2. Create DealWorkspaceLayout component
3. Create QuickActionsBar component
4. Create ActivityCard component
5. Create ActivityTimeline component
6. Wire up data fetching

### Phase 4: Activity Logging Modal (Day 5-6)

**Tasks:**
1. Create LogActivityModal with react-hook-form
2. Implement smart defaults (today, now, recent channel)
3. Add contact autocomplete
4. Add attendees multi-select
5. Implement optimistic UI updates
6. Add AI summarize button (calls Claude tool)

### Phase 5: Left Panel Components (Day 6-7)

**Tasks:**
1. Create DealCard (stage selector, ARR, close date)
2. Create AboutCard (founder, website, source)
3. Create AssessmentCard (strengths, weaknesses, flags)
4. Create ContactsCard with add/link functionality
5. Create FilesCard (folder browser)
6. Implement inline editing for properties

### Phase 6: Right Panel + AI Integration (Day 7-9)

**Tasks:**
1. Create AIChat component (integrate existing chat)
2. Create ArtifactPane for generated documents
3. Create SuggestedActions component
4. Add deal context to Claude tools
5. Create "Prep Brief" quick action
6. Add deal health scoring display

### Phase 7: Kanban + Navigation (Day 9-10)

**Tasks:**
1. Enhance existing DealsKanban with new data
2. Add drill-down from card to workspace
3. Create deal workspace route (`/deals/[id]`)
4. Add back navigation
5. Implement stage change from workspace

---

## 7. AI Coding Prompts

### Prompt 1: Database Migration

```
Create Supabase migrations for the Bobo deal workspace CRM functionality.

Context:
- This is a single-user advisory CRM (no multi-tenancy)
- Use RLS for data isolation
- Follow Twenty CRM patterns: JSONB composites, soft deletes, tsvector search
- The `projects` table already exists and represents deals

Required tables:
1. contacts - Name (JSONB), emails (JSONB), phones (JSONB), company, job title
2. activities - Timeline events (calls, emails, meetings, notes)
3. tasks - Action items with due dates and priorities
4. deal_contacts - Junction table for deal-contact relationships
5. stage_history - Track deal stage changes

Include:
- Proper indexes for performance
- RLS policies
- update_at triggers
- RPC functions for complex queries (get_deal_timeline, get_deal_stats)

Reference the schema in docs/modules/use-cases/deal-workspace-implementation-guide.md
```

### Prompt 2: Activity API Routes

```
Create Next.js 16 API routes for activity management in the deal workspace.

Files to create:
- app/api/activities/route.ts (GET list, POST create)
- app/api/activities/[id]/route.ts (GET, PATCH, DELETE)

Requirements:
- Use Supabase client from @/lib/supabase/server
- Validate input with Zod schemas
- Support filters: project_id (required), limit, offset
- Implement soft deletes (set deleted_at instead of DELETE)
- Use RPC function get_deal_timeline for listing
- Include contact data in responses

Activity types: call, email, meeting, note, task_completed, linkedin_message, whatsapp, stage_change
Channels: zoom, phone, email, whatsapp, linkedin, in_person, slack, teams, google_meet
Outcomes: positive, neutral, negative, no_answer, left_message, scheduled_follow_up

Reference: docs/modules/use-cases/deal-workspace-implementation-guide.md section 4
```

### Prompt 3: Zustand Store

```
Create a Zustand store for deal workspace state management.

File: lib/stores/deal-store.ts

State to manage:
- dealId, dealData - current deal
- activities[] - timeline items with optimistic updates
- tasks[] - action items
- activePanel - 'chat' | 'artifact' | 'suggestions'
- activityModalOpen, activityModalType - modal state

Actions needed:
- setDeal(id, data)
- setActivities(activities)
- addActivity(activity) - insert at correct position by date
- updateActivity(id, updates)
- removeActivity(id)
- setTasks(tasks)
- addTask(task)
- completeTask(id)
- openActivityModal(type)
- closeActivityModal()
- setActivePanel(panel)

Use immer middleware for immutable updates.
Reference: docs/modules/use-cases/deal-workspace-implementation-guide.md section 5.1
```

### Prompt 4: Activity Timeline Component

```
Create the ActivityTimeline component for the deal workspace.

File: components/deal-workspace/ActivityTimeline.tsx

Requirements:
- Fetch activities using the deal store
- Group activities by date (Today, Yesterday, This Week, Month Year)
- Render ActivityCard for each item
- Show loading skeleton during fetch
- Handle empty state with helpful message
- Support optimistic delete

Use:
- useDealStore from @/lib/stores/deal-store
- ActivityCard from ./ActivityCard
- date-fns for date grouping (isToday, isYesterday, isThisWeek, format)
- Skeleton from @/components/ui/skeleton

Reference: docs/modules/use-cases/deal-workspace-implementation-guide.md section 5.5
```

### Prompt 5: Log Activity Modal

```
Create a modal for logging activities (calls, emails, meetings, notes).

File: components/deal-workspace/LogActivityModal.tsx

Features:
- Unified form that adapts based on activity type
- Pre-select type based on which quick action was clicked
- Smart defaults: today's date, current time, recent channel from history
- Contact autocomplete from contacts API
- Attendees multi-select for meetings
- Duration picker (15, 30, 45, 60, 90 min options)
- Outcome selector (positive, neutral, negative, etc.)
- Summary textarea with "AI Summarize" button
- Action items checklist with assignee

Form fields vary by type:
- Call: date, time, duration, channel, direction, outcome, contact, summary
- Email: date, direction, contact, subject, body
- Meeting: date, time, duration, channel, attendees, summary, action items
- Note: date, content

Use:
- react-hook-form with zod resolver
- Dialog from @/components/ui/dialog
- Select, Input, Textarea from shadcn/ui
- useDealStore for modal state and optimistic updates
- POST to /api/activities on submit

Reference: docs/modules/use-cases/deal-workspace.md Activity Logging Workflow section
```

### Prompt 6: Deal Workspace Page

```
Create the deal workspace page with 3-column layout.

File: app/deals/[id]/page.tsx

Layout:
- Left panel (280px): DealCard, AboutCard, AssessmentCard, ContactsCard, FilesCard
- Middle panel (flex): QuickActionsBar, ActivityTimeline, StageHistory
- Right panel (400px, collapsible): AIChat, ArtifactPane, SuggestedActions

Data fetching:
- Fetch deal data from /api/deals/[id]
- Fetch activities via ActivityTimeline component
- Fetch tasks via TasksList component
- Pass deal context to AI chat

Header:
- Back to Pipeline link
- Deal name
- Settings and external link buttons

Use:
- DealWorkspaceLayout from @/components/deal-workspace
- All panel components from @/components/deal-workspace/panels
- Existing AI chat components adapted for deal context

Reference: docs/modules/use-cases/deal-workspace.md Deal Workspace Layout section
```

---

## Appendix: File Structure

```
app/
├── deals/
│   └── [id]/
│       └── page.tsx              # Deal workspace page
├── api/
│   ├── activities/
│   │   ├── route.ts              # GET, POST
│   │   └── [id]/
│   │       └── route.ts          # GET, PATCH, DELETE
│   ├── tasks/
│   │   ├── route.ts
│   │   └── [id]/
│   │       ├── route.ts
│   │       └── complete/
│   │           └── route.ts
│   └── contacts/
│       ├── route.ts
│       └── [id]/
│           └── route.ts

components/
└── deal-workspace/
    ├── DealWorkspaceLayout.tsx
    ├── QuickActionsBar.tsx
    ├── ActivityCard.tsx
    ├── ActivityTimeline.tsx
    ├── LogActivityModal.tsx
    ├── TasksList.tsx
    ├── StageHistory.tsx
    └── panels/
        ├── LeftPanel/
        │   ├── DealCard.tsx
        │   ├── AboutCard.tsx
        │   ├── AssessmentCard.tsx
        │   ├── ContactsCard.tsx
        │   └── FilesCard.tsx
        ├── MiddlePanel/
        │   └── index.tsx
        └── RightPanel/
            ├── AIChat.tsx
            ├── ArtifactPane.tsx
            └── SuggestedActions.tsx

lib/
├── stores/
│   └── deal-store.ts             # Zustand store
└── types/
    └── crm.ts                    # TypeScript types

supabase/
└── migrations/
    ├── 001_create_crm_tables.sql
    ├── 002_extend_projects_for_deals.sql
    └── 003_crm_rpc_functions.sql
```

---

*This guide provides everything needed for Claude Code or ChatGPT Codex to implement the deal workspace. Start with Phase 1 (database) and progress sequentially.*
