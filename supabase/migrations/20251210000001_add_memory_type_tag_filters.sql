-- Migration: 20251210000001_add_memory_type_tag_filters.sql
-- Add memory_type and tags columns (if not exist) and update enhanced_memory_search RPC function

-- Step 1: Add memory_type column with validation (M3.13-01)
ALTER TABLE memory_entries
ADD COLUMN IF NOT EXISTS memory_type TEXT DEFAULT 'fact'
CHECK (memory_type IN ('fact', 'question', 'decision', 'insight'));

-- Step 2: Add tags array column with GIN index for fast lookups (M3.13-01)
ALTER TABLE memory_entries
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[];

CREATE INDEX IF NOT EXISTS idx_memory_tags ON memory_entries USING gin(tags);

-- Step 3: Add other columns needed by enhanced_memory_search (M3.6-01)
ALTER TABLE memory_entries
ADD COLUMN IF NOT EXISTS last_accessed TIMESTAMPTZ;

ALTER TABLE memory_entries
ADD COLUMN IF NOT EXISTS access_count INT DEFAULT 0;

ALTER TABLE memory_entries
ADD COLUMN IF NOT EXISTS importance FLOAT DEFAULT 0.5
CHECK (importance >= 0 AND importance <= 1);

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_memory_entries_last_accessed
ON memory_entries(user_id, last_accessed DESC)
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_memory_entries_access_count
ON memory_entries(user_id, access_count DESC)
WHERE is_active = true;

-- Step 5: Update enhanced_memory_search to support all filters including memory_type and tags
CREATE OR REPLACE FUNCTION enhanced_memory_search(
  query_embedding vector(1536),
  query_text text,
  match_count int DEFAULT 5,
  vector_weight float DEFAULT 0.45,
  text_weight float DEFAULT 0.15,
  recency_weight float DEFAULT 0.20,
  frequency_weight float DEFAULT 0.10,
  importance_weight float DEFAULT 0.10,
  recency_half_life_days float DEFAULT 30.0,
  min_vector_similarity float DEFAULT 0.3,
  p_user_id uuid DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_memory_type text DEFAULT NULL,
  p_tags text[] DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  category text,
  content text,
  confidence float,
  source_type text,
  last_accessed timestamptz,
  access_count int,
  importance float,
  combined_score float,
  vector_score float,
  text_score float,
  recency_score float,
  frequency_score float
)
LANGUAGE plpgsql
AS $$
DECLARE
  log_normalizer float := LN(100.0);
BEGIN
  RETURN QUERY
  WITH scored_memories AS (
    SELECT
      m.id,
      m.category,
      m.content,
      m.confidence::float,
      m.source_type,
      m.last_accessed,
      m.access_count,
      COALESCE(m.importance, 0.5)::float as importance,
      (1 - (m.embedding <=> query_embedding))::float as vector_score,
      COALESCE(ts_rank_cd(to_tsvector('english', m.content), plainto_tsquery('english', query_text), 32), 0)::float as text_score,
      EXP(-0.693 * EXTRACT(EPOCH FROM NOW() - COALESCE(m.last_accessed, m.created_at)) / (recency_half_life_days * 86400))::float as recency_score,
      (LN(1.0 + COALESCE(m.access_count, 0)) / log_normalizer)::float as frequency_score
    FROM memory_entries m
    WHERE m.is_active = true
      AND (p_user_id IS NULL OR m.user_id = p_user_id)
      AND (p_category IS NULL OR m.category = p_category)
      AND (p_memory_type IS NULL OR m.memory_type = p_memory_type)
      AND (p_tags IS NULL OR m.tags && p_tags)
      AND m.embedding IS NOT NULL
  )
  SELECT
    sm.id,
    sm.category,
    sm.content,
    sm.confidence,
    sm.source_type,
    sm.last_accessed,
    sm.access_count,
    sm.importance,
    (vector_weight * sm.vector_score + text_weight * LEAST(sm.text_score, 1.0) + recency_weight * sm.recency_score + frequency_weight * sm.frequency_score + importance_weight * sm.importance)::float as combined_score,
    sm.vector_score,
    sm.text_score,
    sm.recency_score,
    sm.frequency_score
  FROM scored_memories sm
  WHERE sm.vector_score > min_vector_similarity
  ORDER BY combined_score DESC
  LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION enhanced_memory_search IS 'Enhanced memory search with 5-component temporal weighting (45% vector, 15% text, 20% recency, 10% frequency, 10% importance). Supports optional filtering by user_id, category, memory_type, and tags.';

-- Step 6: Create update_memory_access function for tracking memory usage (M3.6-01)
CREATE OR REPLACE FUNCTION update_memory_access(p_memory_ids UUID[])
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE memory_entries
  SET
    last_accessed = NOW(),
    last_mentioned = NOW(),
    access_count = access_count + 1
  WHERE id = ANY(p_memory_ids) AND is_active = true;
END;
$$;

COMMENT ON FUNCTION update_memory_access IS 'Updates access tracking metrics (last_accessed, last_mentioned, access_count) for specified memory IDs. Called after memory retrieval for Hebbian reinforcement.';
