-- ============================================================================
-- CLEANUP AND RESET - Run this BEFORE the initial schema if tables exist
-- ============================================================================
-- This script safely drops all existing tables and starts fresh
-- Only run this if you're okay losing any existing data!
-- ============================================================================

-- Drop all tables in reverse dependency order
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS chats CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop views if they exist
DROP VIEW IF EXISTS chats_with_projects CASCADE;
DROP VIEW IF EXISTS projects_with_stats CASCADE;

-- Drop functions if they exist
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_chat_last_message_at() CASCADE;
DROP FUNCTION IF EXISTS generate_chat_title() CASCADE;

-- Now you can run the main migration file (20250122000000_initial_schema.sql)
