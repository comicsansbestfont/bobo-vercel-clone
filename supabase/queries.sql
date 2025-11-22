-- ============================================================================
-- USEFUL QUERIES FOR DEVELOPMENT & TESTING
-- ============================================================================
-- Copy and run these in the Supabase SQL Editor for testing
-- ============================================================================

-- ============================================================================
-- INSPECTION QUERIES
-- ============================================================================

-- View all tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Count records in each table
SELECT
  'users' AS table_name, COUNT(*) AS count FROM users
UNION ALL
SELECT 'projects', COUNT(*) FROM projects
UNION ALL
SELECT 'chats', COUNT(*) FROM chats
UNION ALL
SELECT 'messages', COUNT(*) FROM messages;

-- ============================================================================
-- USER QUERIES
-- ============================================================================

-- Get default user
SELECT * FROM users WHERE email = 'user@bobo.ai';

-- ============================================================================
-- PROJECT QUERIES
-- ============================================================================

-- Get all projects with stats
SELECT * FROM projects_with_stats
ORDER BY last_activity_at DESC NULLS LAST;

-- Get specific project
SELECT * FROM projects WHERE id = 'project-id-here';

-- Get project with all its chats
SELECT
  p.id AS project_id,
  p.name AS project_name,
  c.id AS chat_id,
  c.title AS chat_title,
  c.last_message_at
FROM projects p
LEFT JOIN chats c ON c.project_id = p.id
WHERE p.id = 'project-id-here'
ORDER BY c.last_message_at DESC;

-- ============================================================================
-- CHAT QUERIES
-- ============================================================================

-- Get all chats (with project info)
SELECT * FROM chats_with_projects
ORDER BY last_message_at DESC;

-- Get standalone chats (not in any project)
SELECT * FROM chats
WHERE project_id IS NULL
ORDER BY last_message_at DESC;

-- Get chats in a specific project
SELECT * FROM chats
WHERE project_id = 'project-id-here'
ORDER BY last_message_at DESC;

-- Get recent chats (last 10)
SELECT
  c.id,
  c.title,
  c.model,
  c.last_message_at,
  p.name AS project_name,
  (SELECT COUNT(*) FROM messages WHERE chat_id = c.id) AS message_count
FROM chats c
LEFT JOIN projects p ON c.project_id = p.id
ORDER BY c.last_message_at DESC
LIMIT 10;

-- ============================================================================
-- MESSAGE QUERIES
-- ============================================================================

-- Get all messages for a chat
SELECT
  id,
  role,
  content,
  token_count,
  created_at,
  sequence_number
FROM messages
WHERE chat_id = 'chat-id-here'
ORDER BY sequence_number;

-- Get message count per chat
SELECT
  c.title,
  COUNT(m.id) AS message_count,
  SUM(m.token_count) AS total_tokens
FROM chats c
LEFT JOIN messages m ON m.chat_id = c.id
GROUP BY c.id, c.title
ORDER BY message_count DESC;

-- Get latest message in each chat
SELECT DISTINCT ON (chat_id)
  chat_id,
  role,
  content->>'parts' AS content_preview,
  created_at
FROM messages
ORDER BY chat_id, sequence_number DESC;

-- ============================================================================
-- ANALYTICS QUERIES
-- ============================================================================

-- Overall stats
SELECT
  (SELECT COUNT(*) FROM projects) AS total_projects,
  (SELECT COUNT(*) FROM chats) AS total_chats,
  (SELECT COUNT(*) FROM messages) AS total_messages,
  (SELECT SUM(token_count) FROM messages) AS total_tokens;

-- Most active projects (by message count)
SELECT
  p.name,
  COUNT(m.id) AS message_count,
  COUNT(DISTINCT c.id) AS chat_count
FROM projects p
LEFT JOIN chats c ON c.project_id = p.id
LEFT JOIN messages m ON m.chat_id = c.id
GROUP BY p.id, p.name
ORDER BY message_count DESC;

-- Model usage statistics
SELECT
  model,
  COUNT(*) AS chat_count,
  AVG((SELECT COUNT(*) FROM messages WHERE chat_id = c.id)) AS avg_messages_per_chat
FROM chats c
GROUP BY model
ORDER BY chat_count DESC;

-- Daily message volume (last 7 days)
SELECT
  DATE(created_at) AS date,
  COUNT(*) AS message_count,
  SUM(token_count) AS total_tokens
FROM messages
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- ============================================================================
-- TESTING QUERIES (Insert Sample Data)
-- ============================================================================

-- Create a test project
INSERT INTO projects (user_id, name, description)
VALUES (
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'Test Project',
  'A project for testing'
)
RETURNING *;

-- Create a test chat (standalone)
INSERT INTO chats (user_id, title, model)
VALUES (
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'Test Chat',
  'openai/gpt-4o'
)
RETURNING *;

-- Create a test chat (in project)
INSERT INTO chats (user_id, project_id, title, model)
VALUES (
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'project-id-here', -- Replace with actual project ID
  'Test Chat in Project',
  'openai/gpt-4o'
)
RETURNING *;

-- Add test messages
WITH chat AS (
  SELECT id FROM chats WHERE title = 'Test Chat' LIMIT 1
)
INSERT INTO messages (chat_id, role, content, sequence_number)
SELECT
  chat.id,
  'user',
  '{"parts": [{"type": "text", "text": "Hello, this is a test message!"}]}'::JSONB,
  1
FROM chat
RETURNING *;

-- ============================================================================
-- CLEANUP QUERIES (Use with caution!)
-- ============================================================================

-- Delete all messages in a chat
-- DELETE FROM messages WHERE chat_id = 'chat-id-here';

-- Delete a specific chat (cascades to messages)
-- DELETE FROM chats WHERE id = 'chat-id-here';

-- Delete a project (sets project_id to NULL on chats)
-- DELETE FROM projects WHERE id = 'project-id-here';

-- Clear all data (keep schema and default user)
-- TRUNCATE messages, chats, projects RESTART IDENTITY CASCADE;

-- Reset everything (including default user)
-- TRUNCATE users RESTART IDENTITY CASCADE;
-- Then re-run the seed data from the migration

-- ============================================================================
-- MAINTENANCE QUERIES
-- ============================================================================

-- Check for orphaned messages (shouldn't happen with FK constraints)
SELECT m.*
FROM messages m
LEFT JOIN chats c ON c.id = m.chat_id
WHERE c.id IS NULL;

-- Check for chats with no messages
SELECT c.*
FROM chats c
LEFT JOIN messages m ON m.chat_id = c.id
WHERE m.id IS NULL;

-- Update chat token counts (if out of sync)
UPDATE chats c
SET updated_at = NOW()
WHERE c.id IN (
  SELECT chat_id
  FROM messages
  GROUP BY chat_id
);

-- Recompute sequence numbers for a chat (if corrupted)
WITH ordered_messages AS (
  SELECT
    id,
    ROW_NUMBER() OVER (PARTITION BY chat_id ORDER BY created_at) AS new_seq
  FROM messages
  WHERE chat_id = 'chat-id-here'
)
UPDATE messages m
SET sequence_number = om.new_seq
FROM ordered_messages om
WHERE m.id = om.id;

-- ============================================================================
-- PERFORMANCE QUERIES
-- ============================================================================

-- Check index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan AS times_used,
  idx_tup_read AS tuples_read,
  idx_tup_fetch AS tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY times_used DESC;

-- Check table sizes
SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ============================================================================
-- EXPORT QUERIES
-- ============================================================================

-- Export chat as JSON (useful for backup or sharing)
SELECT
  json_build_object(
    'chat', row_to_json(c),
    'messages', (
      SELECT json_agg(row_to_json(m) ORDER BY m.sequence_number)
      FROM messages m
      WHERE m.chat_id = c.id
    )
  ) AS chat_export
FROM chats c
WHERE c.id = 'chat-id-here';

-- Export project with all chats and messages
SELECT
  json_build_object(
    'project', row_to_json(p),
    'chats', (
      SELECT json_agg(
        json_build_object(
          'chat', row_to_json(c),
          'messages', (
            SELECT json_agg(row_to_json(m) ORDER BY m.sequence_number)
            FROM messages m
            WHERE m.chat_id = c.id
          )
        )
        ORDER BY c.last_message_at DESC
      )
      FROM chats c
      WHERE c.project_id = p.id
    )
  ) AS project_export
FROM projects p
WHERE p.id = 'project-id-here';
