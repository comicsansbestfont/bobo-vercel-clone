-- ============================================================================
-- BOBO AI CHATBOT - SCHEMA UPDATE FOR MILESTONE 1
-- ============================================================================
-- This migration updates the existing schema to match Milestone 1 requirements
-- Adds missing columns for context tracking and message ordering
-- ============================================================================

-- ============================================================================
-- UPDATE CHATS TABLE
-- ============================================================================
-- Add columns for web search and activity tracking
-- ============================================================================

-- Add web_search_enabled column (default false)
ALTER TABLE chats
ADD COLUMN IF NOT EXISTS web_search_enabled BOOLEAN NOT NULL DEFAULT FALSE;

-- Add last_message_at for sorting by activity (default to created_at)
ALTER TABLE chats
ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Initialize last_message_at to created_at for existing chats
UPDATE chats
SET last_message_at = created_at
WHERE last_message_at IS NULL OR last_message_at = '1970-01-01'::timestamptz;

-- Create index for sorting by activity
CREATE INDEX IF NOT EXISTS idx_chats_last_message_at ON chats(last_message_at DESC);

-- ============================================================================
-- UPDATE MESSAGES TABLE
-- ============================================================================
-- Change content structure to match Vercel AI SDK format
-- Add sequence_number and token_count
-- ============================================================================

-- Add sequence_number for message ordering
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS sequence_number INTEGER;

-- Add token_count for context tracking
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS token_count INTEGER DEFAULT 0;

-- For existing messages, set sequence_number based on created_at order
WITH numbered_messages AS (
  SELECT
    id,
    ROW_NUMBER() OVER (PARTITION BY chat_id ORDER BY created_at) AS seq_num
  FROM messages
)
UPDATE messages m
SET sequence_number = nm.seq_num
FROM numbered_messages nm
WHERE m.id = nm.id AND m.sequence_number IS NULL;

-- Make sequence_number NOT NULL after populating
ALTER TABLE messages
ALTER COLUMN sequence_number SET NOT NULL;

-- Create unique index on chat_id + sequence_number
CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_unique_sequence
ON messages(chat_id, sequence_number);

-- ============================================================================
-- MIGRATE CONTENT STRUCTURE
-- ============================================================================
-- Convert TEXT content to JSONB format matching Vercel AI SDK
-- Merge existing metadata into content
-- ============================================================================

-- Add new content_jsonb column temporarily
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS content_jsonb JSONB;

-- Migrate existing TEXT content to JSONB format
-- Structure: { parts: [{ type: 'text', text: <content> }] }
UPDATE messages
SET content_jsonb = jsonb_build_object(
  'parts', jsonb_build_array(
    CASE
      WHEN metadata IS NOT NULL AND metadata != '{}'::jsonb THEN
        metadata || jsonb_build_object('type', 'text', 'text', content)
      ELSE
        jsonb_build_object('type', 'text', 'text', content)
    END
  )
)
WHERE content_jsonb IS NULL;

-- Drop old columns and rename new one
-- Step 1: Drop metadata (merged into content_jsonb)
ALTER TABLE messages DROP COLUMN IF EXISTS metadata;

-- Step 2: Rename content to content_old
ALTER TABLE messages RENAME COLUMN content TO content_old;

-- Step 3: Rename content_jsonb to content
ALTER TABLE messages RENAME COLUMN content_jsonb TO content;

-- Step 4: Drop content_old
ALTER TABLE messages DROP COLUMN IF EXISTS content_old;

-- Make content NOT NULL with default
ALTER TABLE messages
ALTER COLUMN content SET NOT NULL,
ALTER COLUMN content SET DEFAULT '{"parts": []}'::JSONB;

-- ============================================================================
-- UPDATE TRIGGERS AND FUNCTIONS
-- ============================================================================

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

-- Trigger: Update chat's last_message_at when message is added
DROP TRIGGER IF EXISTS update_chat_last_message_at_trigger ON messages;
CREATE TRIGGER update_chat_last_message_at_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_last_message_at();

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

-- Trigger: Auto-generate chat title from first message
DROP TRIGGER IF EXISTS generate_chat_title_trigger ON messages;
CREATE TRIGGER generate_chat_title_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION generate_chat_title();

-- ============================================================================
-- UPDATE VIEWS
-- ============================================================================

-- Drop and recreate views with new columns
DROP VIEW IF EXISTS chats_with_projects CASCADE;
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

DROP VIEW IF EXISTS projects_with_stats CASCADE;
CREATE VIEW projects_with_stats AS
SELECT
  p.id,
  p.user_id,
  p.name,
  p.description,
  p.custom_instructions,
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

COMMENT ON COLUMN chats.web_search_enabled IS 'Whether web search is enabled for this chat (uses Perplexity)';
COMMENT ON COLUMN chats.last_message_at IS 'Timestamp of last message in chat for activity sorting';
COMMENT ON COLUMN messages.content IS 'JSONB structure matching Vercel AI SDK UIMessage format: { parts: [{ type, text, url, result }] }';
COMMENT ON COLUMN messages.sequence_number IS 'For ordering messages within a chat. Starts at 1 for each chat.';
COMMENT ON COLUMN messages.token_count IS 'Approximate token count for this message (for context tracking)';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify migration success
DO $$
DECLARE
  chats_has_web_search BOOLEAN;
  chats_has_last_message BOOLEAN;
  messages_has_sequence BOOLEAN;
  messages_has_tokens BOOLEAN;
  messages_content_is_jsonb BOOLEAN;
BEGIN
  -- Check columns exist
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chats' AND column_name = 'web_search_enabled'
  ) INTO chats_has_web_search;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chats' AND column_name = 'last_message_at'
  ) INTO chats_has_last_message;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'sequence_number'
  ) INTO messages_has_sequence;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'token_count'
  ) INTO messages_has_tokens;

  SELECT data_type = 'jsonb' FROM information_schema.columns
  WHERE table_name = 'messages' AND column_name = 'content'
  INTO messages_content_is_jsonb;

  -- Raise notices
  RAISE NOTICE 'Migration verification:';
  RAISE NOTICE '  chats.web_search_enabled: %', chats_has_web_search;
  RAISE NOTICE '  chats.last_message_at: %', chats_has_last_message;
  RAISE NOTICE '  messages.sequence_number: %', messages_has_sequence;
  RAISE NOTICE '  messages.token_count: %', messages_has_tokens;
  RAISE NOTICE '  messages.content is JSONB: %', messages_content_is_jsonb;

  IF NOT (chats_has_web_search AND chats_has_last_message AND
          messages_has_sequence AND messages_has_tokens AND messages_content_is_jsonb) THEN
    RAISE EXCEPTION 'Migration verification failed! Check column additions.';
  END IF;

  RAISE NOTICE 'Migration completed successfully!';
END $$;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
