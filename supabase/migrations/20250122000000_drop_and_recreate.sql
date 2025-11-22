-- ============================================================================
-- BOBO AI CHATBOT - DROP AND RECREATE SCHEMA
-- ============================================================================
-- IMPORTANT: This drops all existing tables and recreates from scratch
-- Only run this if you've read SCHEMA_AUDIT.md and approved the approach
--
-- Data Loss: 35 empty chats, 1 user record (will be recreated)
-- Data Preserved: NONE (but nothing valuable exists)
-- ============================================================================

-- ============================================================================
-- STEP 1: DROP ALL EXISTING TABLES
-- ============================================================================

-- Drop in reverse dependency order
DROP TABLE IF EXISTS embeddings CASCADE;
DROP TABLE IF EXISTS files CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS chats CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop any existing views
DROP VIEW IF EXISTS chats_with_projects CASCADE;
DROP VIEW IF EXISTS projects_with_stats CASCADE;

-- Drop any existing functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_chat_last_message_at() CASCADE;
DROP FUNCTION IF EXISTS generate_chat_title() CASCADE;

-- Verify all tables are gone
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE';

  RAISE NOTICE 'Remaining tables after drop: %', table_count;

  IF table_count > 0 THEN
    RAISE EXCEPTION 'Not all tables were dropped. Please check for remaining tables.';
  END IF;
END $$;

-- ============================================================================
-- STEP 2: NOW RUN THE MAIN SCHEMA FILE
-- ============================================================================
-- After this completes successfully, run:
-- supabase/migrations/20250122000000_initial_schema.sql
-- ============================================================================
