-- Migration: 20251210000002_m313_thought_threads.sql
-- Create thought_threads table for M3.13-01 Thinking Partner Foundation

-- Step 1: Create thought_threads table
CREATE TABLE IF NOT EXISTS thought_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create index on user_id for efficient queries
CREATE INDEX IF NOT EXISTS idx_thought_threads_user ON thought_threads(user_id);

-- Step 3: Add foreign key constraint from memory_entries to thought_threads
-- Note: thread_id column was already added in 20251210000001_add_memory_type_tag_filters.sql
ALTER TABLE memory_entries
DROP CONSTRAINT IF EXISTS fk_memory_thread;

ALTER TABLE memory_entries
ADD CONSTRAINT fk_memory_thread
FOREIGN KEY (thread_id) REFERENCES thought_threads(id) ON DELETE SET NULL;

-- Step 4: Enable RLS on thought_threads
ALTER TABLE thought_threads ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies for thought_threads
CREATE POLICY "Users can view own threads"
  ON thought_threads FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own threads"
  ON thought_threads FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own threads"
  ON thought_threads FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own threads"
  ON thought_threads FOR DELETE
  USING (user_id = auth.uid());

COMMENT ON TABLE thought_threads IS 'Thought threads for grouping related memories (M3.13-01 Thinking Partner Foundation)';
