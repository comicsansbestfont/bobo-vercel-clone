-- Migration: 20251208000000_memory_suggestions.sql
-- Create memory_suggestions table for pending memory suggestions

CREATE TABLE IF NOT EXISTS memory_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN (
    'work_context',
    'personal_context',
    'top_of_mind',
    'brief_history',
    'long_term_background',
    'other_instructions'
  )),
  subcategory TEXT,
  content TEXT NOT NULL,
  summary TEXT,
  confidence FLOAT NOT NULL DEFAULT 0.8 CHECK (confidence >= 0.5 AND confidence <= 1.0),
  source_chat_id UUID REFERENCES chats(id),
  source_chat_name TEXT,
  time_period TEXT DEFAULT 'current' CHECK (time_period IN ('current', 'recent', 'past', 'long_ago')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_memory_suggestions_user_id ON memory_suggestions(user_id, status);
CREATE INDEX idx_memory_suggestions_created_at ON memory_suggestions(created_at DESC);

-- Row Level Security
ALTER TABLE memory_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own suggestions"
  ON memory_suggestions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own suggestions"
  ON memory_suggestions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own suggestions"
  ON memory_suggestions FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own suggestions"
  ON memory_suggestions FOR DELETE
  USING (user_id = auth.uid());
