-- M38-01: Add advisory project fields to projects table
-- This migration adds entity_type and advisory_folder_path columns
-- to support project-per-deal functionality with file-reference mode.

-- Add entity_type column to projects table
-- Defaults to 'personal' so existing projects are unaffected
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS entity_type TEXT DEFAULT 'personal'
CHECK (entity_type IN ('deal', 'client', 'personal'));

-- Add advisory_folder_path for file-reference mode
-- NULL for regular projects, contains path like 'advisory/deals/MyTab' for advisory projects
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS advisory_folder_path TEXT;

-- Index for filtering by entity_type
CREATE INDEX IF NOT EXISTS idx_projects_entity_type ON projects(entity_type);

-- Comments for documentation
COMMENT ON COLUMN projects.entity_type IS 'Type of project: deal (advisory deal), client (advisory client), or personal (default)';
COMMENT ON COLUMN projects.advisory_folder_path IS 'Path to advisory folder for file-reference mode (e.g., advisory/deals/MyTab). NULL for non-advisory projects.';
