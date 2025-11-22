-- ============================================================================
-- BOBO AI CHATBOT - INITIAL SCHEMA
-- Milestone 1: Project & Chat Management Foundation
-- ============================================================================
-- This migration creates the core tables for:
-- - Users (single-user MVP, but structured for future multi-user)
-- - Projects (workspaces for organizing chats)
-- - Chats (individual conversations, can belong to projects or be standalone)
-- - Messages (individual AI/user messages within chats)
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS TABLE
-- ============================================================================
-- Stores user information. For single-user MVP, will have one hardcoded user.
-- Structured to support multi-user in the future.
-- ============================================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX idx_users_email ON users(email);

-- ============================================================================
-- PROJECTS TABLE
-- ============================================================================
-- Projects are workspaces that contain multiple related chats.
-- Each project can have custom instructions and knowledge base files (Milestone 2).
-- ============================================================================

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  -- For Milestone 2: system_instructions TEXT (custom AI instructions per project)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure name is not empty
  CONSTRAINT projects_name_not_empty CHECK (LENGTH(TRIM(name)) > 0)
);

-- Indexes for efficient queries
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_updated_at ON projects(updated_at DESC);

-- ============================================================================
-- CHATS TABLE
-- ============================================================================
-- Individual conversations. Can be:
-- - Standalone (project_id IS NULL) - "loose" chats not in any project
-- - Associated with a project (project_id IS NOT NULL)
-- ============================================================================

CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,

  -- Chat metadata
  title TEXT NOT NULL DEFAULT 'New Chat',
  model TEXT NOT NULL DEFAULT 'openai/gpt-4o',

  -- Settings
  web_search_enabled BOOLEAN NOT NULL DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Last message time (for sorting by activity)
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX idx_chats_user_id ON chats(user_id);
CREATE INDEX idx_chats_project_id ON chats(project_id);
CREATE INDEX idx_chats_last_message_at ON chats(last_message_at DESC);
CREATE INDEX idx_chats_updated_at ON chats(updated_at DESC);
CREATE INDEX idx_chats_user_project ON chats(user_id, project_id);

-- ============================================================================
-- MESSAGES TABLE
-- ============================================================================
-- Individual messages within a chat. Can be from 'user', 'assistant', or 'system'.
-- Stores the full message content including reasoning, sources, etc.
-- ============================================================================

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,

  -- Message metadata
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),

  -- Message content stored as JSONB for flexibility
  -- Structure: { parts: [{ type: 'text'|'reasoning'|'source-url'|'tool-result', text?: string, url?: string, result?: string }] }
  content JSONB NOT NULL DEFAULT '{"parts": []}'::JSONB,

  -- Token tracking
  token_count INTEGER DEFAULT 0,

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- For ordering messages within a chat
  sequence_number INTEGER NOT NULL
);

-- Indexes for efficient queries
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_chat_sequence ON messages(chat_id, sequence_number);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Unique constraint: one sequence number per chat
CREATE UNIQUE INDEX idx_messages_unique_sequence ON messages(chat_id, sequence_number);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update chat's last_message_at when new message is added
CREATE OR REPLACE FUNCTION update_chat_last_message_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chats
  SET last_message_at = NEW.created_at,
      updated_at = NOW()
  WHERE id = NEW.chat_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-generate chat title from first user message
CREATE OR REPLACE FUNCTION generate_chat_title()
RETURNS TRIGGER AS $$
DECLARE
  chat_title TEXT;
  first_message_text TEXT;
BEGIN
  -- Only process if this is the first user message
  IF NEW.role = 'user' AND NEW.sequence_number = 1 THEN
    -- Extract text from content JSONB
    first_message_text := NEW.content->'parts'->0->>'text';

    -- Generate title (first 50 chars of message)
    IF first_message_text IS NOT NULL THEN
      chat_title := LEFT(first_message_text, 50);
      IF LENGTH(first_message_text) > 50 THEN
        chat_title := chat_title || '...';
      END IF;

      -- Update chat title
      UPDATE chats
      SET title = chat_title,
          updated_at = NOW()
      WHERE id = NEW.chat_id AND title = 'New Chat';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Update updated_at on projects
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Update updated_at on chats
CREATE TRIGGER update_chats_updated_at
  BEFORE UPDATE ON chats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Update chat's last_message_at when message is added
CREATE TRIGGER update_chat_last_message_at_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_last_message_at();

-- Trigger: Auto-generate chat title from first message
CREATE TRIGGER generate_chat_title_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION generate_chat_title();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- Enable RLS for all tables. For single-user MVP, policies are permissive.
-- When moving to multi-user, these policies will enforce user isolation.
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users: Can read their own record
CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  USING (true); -- Permissive for MVP, will restrict to auth.uid() = id in multi-user

-- Projects: Users can manage their own projects
CREATE POLICY "Users can manage own projects"
  ON projects FOR ALL
  USING (true); -- Permissive for MVP

-- Chats: Users can manage their own chats
CREATE POLICY "Users can manage own chats"
  ON chats FOR ALL
  USING (true); -- Permissive for MVP

-- Messages: Users can manage messages in their chats
CREATE POLICY "Users can manage messages in own chats"
  ON messages FOR ALL
  USING (true); -- Permissive for MVP

-- ============================================================================
-- PERMISSIONS (Single-User MVP)
-- ============================================================================
-- For single-user MVP, disable RLS and grant full access to anon role.
-- This simplifies the app since we don't need auth.
-- When moving to multi-user, remove these grants and enable RLS properly.
-- ============================================================================

-- Disable RLS for single-user MVP
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE chats DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- Grant full access to anon and authenticated roles
GRANT ALL ON users TO anon, authenticated;
GRANT ALL ON projects TO anon, authenticated;
GRANT ALL ON chats TO anon, authenticated;
GRANT ALL ON messages TO anon, authenticated;

-- Grant sequence permissions (for ID generation)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- ============================================================================
-- SEED DATA (Single-User MVP)
-- ============================================================================
-- Create a default user for single-user MVP
-- ============================================================================

INSERT INTO users (id, email, name, created_at)
VALUES (
  'f47ac10b-58cc-4372-a567-0e02b2c3d479', -- Fixed UUID for consistency
  'user@bobo.ai',
  'Bobo User',
  NOW()
);

-- ============================================================================
-- HELPER VIEWS
-- ============================================================================
-- Views to make common queries easier
-- ============================================================================

-- View: Chats with project info
CREATE VIEW chats_with_projects AS
SELECT
  c.id,
  c.user_id,
  c.project_id,
  c.title,
  c.model,
  c.web_search_enabled,
  c.created_at,
  c.updated_at,
  c.last_message_at,
  p.name AS project_name,
  (SELECT COUNT(*) FROM messages WHERE chat_id = c.id) AS message_count
FROM chats c
LEFT JOIN projects p ON c.project_id = p.id;

-- View: Projects with chat counts
CREATE VIEW projects_with_stats AS
SELECT
  p.id,
  p.user_id,
  p.name,
  p.description,
  p.created_at,
  p.updated_at,
  COUNT(c.id) AS chat_count,
  MAX(c.last_message_at) AS last_activity_at
FROM projects p
LEFT JOIN chats c ON c.project_id = p.id
GROUP BY p.id;

-- ============================================================================
-- COMMENTS
-- ============================================================================
-- Document the schema for future reference
-- ============================================================================

COMMENT ON TABLE users IS 'User accounts. Single user for MVP, multi-user ready.';
COMMENT ON TABLE projects IS 'Projects contain related chats and will have knowledge bases in Milestone 2.';
COMMENT ON TABLE chats IS 'Individual conversations. Can be standalone or belong to a project.';
COMMENT ON TABLE messages IS 'Individual messages within chats. Content stored as JSONB for flexibility.';

COMMENT ON COLUMN chats.project_id IS 'NULL = standalone chat, UUID = chat belongs to project';
COMMENT ON COLUMN messages.content IS 'JSONB structure matches Vercel AI SDK UIMessage format';
COMMENT ON COLUMN messages.sequence_number IS 'For ordering messages. Starts at 1 for each chat.';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
