-- =====================================================================
-- Deal Workspace Activities Migration
-- Module: USE-002 (Deal Workspace)
-- Status: Schema ready, implementation pending
-- =====================================================================
-- This migration creates the core tables for the Deal Workspace module:
-- 1. activities - Track all interactions (calls, emails, meetings, etc.)
-- 2. action_items - Track follow-up tasks from activities
-- 3. contacts - Store contact information
-- 4. project_contacts - Link contacts to projects (deals)
-- =====================================================================

-- =====================================================================
-- ACTIVITIES TABLE
-- =====================================================================

CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),

  -- Activity Classification
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'call', 'email', 'meeting', 'note', 'message', 'linkedin', 'task_completed'
  )),

  -- Core Activity Details
  title TEXT,
  activity_date TIMESTAMPTZ NOT NULL,
  duration_mins INTEGER,

  -- Communication Metadata
  channel TEXT CHECK (channel IN (
    'zoom', 'phone', 'email', 'whatsapp', 'linkedin', 'in_person', 'slack'
  )),
  direction TEXT CHECK (direction IN ('inbound', 'outbound')),

  -- Outcomes
  outcome TEXT CHECK (outcome IN (
    'positive', 'neutral', 'negative', 'no_answer', 'left_message'
  )),

  -- Participants & Content
  attendees JSONB DEFAULT '[]',
  summary TEXT,
  next_steps TEXT,

  -- File Sync
  linked_file TEXT,
  metadata JSONB DEFAULT '{}',
  synced_to_file BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_activities_project_id ON activities(project_id);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_activity_type ON activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_activities_activity_date ON activities(activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_activities_linked_file ON activities(linked_file) WHERE linked_file IS NOT NULL;

-- =====================================================================
-- ACTION ITEMS TABLE
-- =====================================================================

CREATE TABLE IF NOT EXISTS action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES activities(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id),

  -- Action Details
  title TEXT NOT NULL,
  description TEXT,

  -- Ownership
  owner TEXT,
  owner_type TEXT CHECK (owner_type IN ('me', 'them', 'shared')),

  -- Scheduling & Priority
  due_date DATE,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',

  -- Status Tracking
  status TEXT CHECK (status IN (
    'pending', 'in_progress', 'completed', 'blocked', 'cancelled'
  )) DEFAULT 'pending',
  completed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_action_items_project_id ON action_items(project_id);
CREATE INDEX IF NOT EXISTS idx_action_items_activity_id ON action_items(activity_id) WHERE activity_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_action_items_user_id ON action_items(user_id);
CREATE INDEX IF NOT EXISTS idx_action_items_status ON action_items(status);
CREATE INDEX IF NOT EXISTS idx_action_items_due_date ON action_items(due_date) WHERE due_date IS NOT NULL;

-- =====================================================================
-- CONTACTS TABLE
-- =====================================================================

CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),

  -- Contact Information
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  linkedin_url TEXT,

  -- Professional Details
  company TEXT,
  role TEXT,
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_company ON contacts(company) WHERE company IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_name ON contacts(name);

-- Unique constraint for email per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_contacts_user_email ON contacts(user_id, email) WHERE email IS NOT NULL;

-- =====================================================================
-- PROJECT_CONTACTS JUNCTION TABLE
-- =====================================================================

CREATE TABLE IF NOT EXISTS project_contacts (
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,

  -- Relationship Metadata
  relationship TEXT CHECK (relationship IN ('primary', 'secondary', 'stakeholder')),
  role_in_deal TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),

  PRIMARY KEY (project_id, contact_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_project_contacts_project_id ON project_contacts(project_id);
CREATE INDEX IF NOT EXISTS idx_project_contacts_contact_id ON project_contacts(contact_id);

-- =====================================================================
-- UPDATED_AT TRIGGER
-- =====================================================================

-- Reuse existing trigger function or create if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS update_activities_updated_at ON activities;
CREATE TRIGGER update_activities_updated_at
  BEFORE UPDATE ON activities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_action_items_updated_at ON action_items;
CREATE TRIGGER update_action_items_updated_at
  BEFORE UPDATE ON action_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_contacts_updated_at ON contacts;
CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_contacts ENABLE ROW LEVEL SECURITY;

-- Permissive policies for development (TODO: Tighten for production)
DROP POLICY IF EXISTS "Allow all for authenticated users" ON activities;
CREATE POLICY "Allow all for authenticated users" ON activities
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated users" ON action_items;
CREATE POLICY "Allow all for authenticated users" ON action_items
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated users" ON contacts;
CREATE POLICY "Allow all for authenticated users" ON contacts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated users" ON project_contacts;
CREATE POLICY "Allow all for authenticated users" ON project_contacts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =====================================================================
-- TABLE COMMENTS
-- =====================================================================

COMMENT ON TABLE activities IS 'Deal-related activities (calls, emails, meetings). Module: USE-002';
COMMENT ON TABLE action_items IS 'Follow-up tasks from activities. Module: USE-002';
COMMENT ON TABLE contacts IS 'Contact information for people involved in deals. Module: USE-002';
COMMENT ON TABLE project_contacts IS 'Junction table linking contacts to projects. Module: USE-002';
