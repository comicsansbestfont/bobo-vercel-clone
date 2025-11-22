-- ============================================================================
-- BOBO AI CHATBOT - MILESTONE 2 PHASE 1: CUSTOM INSTRUCTIONS & FILE STORAGE
-- ============================================================================
-- This migration adds:
-- 1. custom_instructions column to projects table
-- 2. files table for storing markdown files (not yet embedded for RAG)
-- ============================================================================

-- ============================================================================
-- UPDATE PROJECTS TABLE
-- ============================================================================
-- Add custom_instructions column for project-specific AI instructions
-- ============================================================================

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS custom_instructions TEXT;

COMMENT ON COLUMN projects.custom_instructions IS 'Custom AI instructions for this project. Injected into system prompt for all project chats.';

-- ============================================================================
-- CREATE FILES TABLE
-- ============================================================================
-- Stores uploaded markdown files for projects
-- In Phase 1: Files are stored but not yet processed for RAG
-- In Phase 2: Files will be chunked and embedded for semantic search
-- ============================================================================

CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- File metadata
  filename TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'markdown' CHECK (file_type IN ('markdown')),
  file_size INTEGER NOT NULL CHECK (file_size > 0 AND file_size <= 10485760), -- Max 10MB

  -- File content
  content_text TEXT NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT files_filename_not_empty CHECK (LENGTH(TRIM(filename)) > 0)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_files_project_id ON files(project_id);
CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);

-- ============================================================================
-- PERMISSIONS
-- ============================================================================
-- Grant access to anon role (single-user MVP)
-- ============================================================================

GRANT ALL ON files TO anon, authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE files IS 'Markdown files uploaded to projects. Phase 1: Storage only. Phase 2: Will add embeddings for RAG.';
COMMENT ON COLUMN files.content_text IS 'Full markdown content of the file';
COMMENT ON COLUMN files.file_size IS 'File size in bytes (max 10MB = 10485760 bytes)';
COMMENT ON COLUMN files.file_type IS 'Currently only supports "markdown". Will extend in future.';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  projects_has_custom_instructions BOOLEAN;
  files_table_exists BOOLEAN;
BEGIN
  -- Check custom_instructions column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'custom_instructions'
  ) INTO projects_has_custom_instructions;

  -- Check files table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'files'
  ) INTO files_table_exists;

  -- Raise notices
  RAISE NOTICE 'M2 Phase 1 Migration Verification:';
  RAISE NOTICE '  projects.custom_instructions: %', projects_has_custom_instructions;
  RAISE NOTICE '  files table exists: %', files_table_exists;

  IF NOT (projects_has_custom_instructions AND files_table_exists) THEN
    RAISE EXCEPTION 'M2 Phase 1 migration verification failed!';
  END IF;

  RAISE NOTICE 'M2 Phase 1 migration completed successfully!';
END $$;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
