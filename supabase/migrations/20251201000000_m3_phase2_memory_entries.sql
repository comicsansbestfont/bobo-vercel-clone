-- Migration: 20251201000000_m3_phase2_memory_entries.sql
CREATE TABLE memory_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Memory content
  category TEXT NOT NULL
    CHECK (category IN (
      'work_context',
      'personal_context',
      'top_of_mind',
      'brief_history',
      'long_term_background',
      'other_instructions'
    )),
  subcategory TEXT,  -- For brief_history: recent_months, earlier, long_term
  content TEXT NOT NULL,
  summary TEXT,

  -- Confidence and provenance
  confidence FLOAT NOT NULL DEFAULT 0.8 CHECK (confidence >= 0.5 AND confidence <= 1.0),
  source_type TEXT DEFAULT 'extracted' CHECK (source_type IN ('manual', 'extracted', 'suggested')),
  source_chat_ids UUID[] DEFAULT ARRAY[]::UUID[],
  source_project_ids UUID[] DEFAULT ARRAY[]::UUID[],
  source_message_count INT DEFAULT 1,

  -- Temporal awareness
  time_period TEXT DEFAULT 'current' CHECK (time_period IN ('current', 'recent', 'past', 'long_ago')),
  relevance_score FLOAT DEFAULT 1.0,

  -- Timestamps
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_mentioned TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Deduplication
  content_hash TEXT NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_memory_entries_user_id ON memory_entries(user_id);
CREATE INDEX idx_memory_entries_category ON memory_entries(user_id, category);
CREATE INDEX idx_memory_entries_content_hash ON memory_entries(content_hash);
CREATE INDEX idx_memory_entries_relevance ON memory_entries(user_id, relevance_score DESC);

-- Enable pg_trgm for fuzzy matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_memory_entries_content_trgm ON memory_entries USING gin(content gin_trgm_ops);

-- Row Level Security
ALTER TABLE memory_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own memories"
  ON memory_entries FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own memories"
  ON memory_entries FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own memories"
  ON memory_entries FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own memories"
  ON memory_entries FOR DELETE
  USING (user_id = auth.uid());

-- Consolidation log table
CREATE TABLE memory_consolidation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  duplicates_merged INT DEFAULT 0,
  memories_archived INT DEFAULT 0,
  memories_updated INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Memory settings table
CREATE TABLE memory_settings (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  auto_extraction_enabled BOOLEAN DEFAULT false,
  extraction_frequency TEXT DEFAULT 'realtime'
    CHECK (extraction_frequency IN ('realtime', 'daily', 'weekly', 'manual')),
  enabled_categories TEXT[] DEFAULT ARRAY[
    'work_context', 'personal_context', 'top_of_mind',
    'brief_history', 'long_term_background', 'other_instructions'
  ],
  token_budget INT DEFAULT 500,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RPC function for fuzzy matching
CREATE OR REPLACE FUNCTION find_similar_memories(
  p_user_id UUID,
  p_category TEXT,
  p_content TEXT,
  p_threshold FLOAT DEFAULT 0.9
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  similarity_score FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.content,
    similarity(m.content, p_content) as similarity_score
  FROM memory_entries m
  WHERE m.user_id = p_user_id
    AND m.category = p_category
    AND similarity(m.content, p_content) > p_threshold
  ORDER BY similarity_score DESC;
END;
$$ LANGUAGE plpgsql;

-- RPC function to find all duplicate pairs for a user
CREATE OR REPLACE FUNCTION find_duplicate_pairs(
  p_user_id UUID,
  p_threshold FLOAT DEFAULT 0.9
)
RETURNS TABLE (
  id1 UUID,
  id2 UUID,
  similarity_score FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m1.id as id1,
    m2.id as id2,
    similarity(m1.content, m2.content) as similarity_score
  FROM memory_entries m1
  JOIN memory_entries m2 ON m1.id < m2.id
  WHERE m1.user_id = p_user_id
    AND m2.user_id = p_user_id
    AND m1.category = m2.category
    AND similarity(m1.content, m2.content) > p_threshold;
END;
$$ LANGUAGE plpgsql;
