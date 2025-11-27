-- Migration: 20251128000000_m35_memory_tools.sql
-- M3.5: Add embedding column and hybrid search for memory agent tools

-- Add embedding column to memory_entries for semantic search
ALTER TABLE memory_entries
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS idx_memory_entries_embedding
ON memory_entries USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Add is_active column for soft delete support
ALTER TABLE memory_entries
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add deleted_reason for audit trail
ALTER TABLE memory_entries
ADD COLUMN IF NOT EXISTS deleted_reason TEXT;

-- Add deleted_at timestamp
ALTER TABLE memory_entries
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Index for active memories
CREATE INDEX IF NOT EXISTS idx_memory_entries_active
ON memory_entries(user_id, is_active) WHERE is_active = true;

-- Hybrid memory search function for agent tools
-- Combines vector similarity (70%) with BM25 text search (30%)
CREATE OR REPLACE FUNCTION hybrid_memory_search(
  query_embedding vector(1536),
  query_text text,
  match_count int DEFAULT 5,
  vector_weight float DEFAULT 0.7,
  text_weight float DEFAULT 0.3,
  p_user_id uuid DEFAULT NULL,
  p_category text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  category text,
  content text,
  confidence float,
  last_updated timestamptz,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.category,
    m.content,
    m.confidence::float,
    m.last_updated,
    (
      vector_weight * (1 - (m.embedding <=> query_embedding)) +
      text_weight * COALESCE(ts_rank(to_tsvector('english', m.content), plainto_tsquery('english', query_text)), 0)
    )::float as similarity
  FROM memory_entries m
  WHERE m.is_active = true
    AND (p_user_id IS NULL OR m.user_id = p_user_id)
    AND (p_category IS NULL OR m.category = p_category)
    AND m.embedding IS NOT NULL
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- Find memories by semantic similarity for deduplication
-- Uses vector search with a threshold for finding potential duplicates
CREATE OR REPLACE FUNCTION find_memories_by_embedding(
  query_embedding vector(1536),
  similarity_threshold float DEFAULT 0.85,
  p_user_id uuid DEFAULT NULL,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  category text,
  content text,
  confidence float,
  source_type text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.category,
    m.content,
    m.confidence::float,
    m.source_type,
    (1 - (m.embedding <=> query_embedding))::float as similarity
  FROM memory_entries m
  WHERE m.is_active = true
    AND (p_user_id IS NULL OR m.user_id = p_user_id)
    AND m.embedding IS NOT NULL
    AND (1 - (m.embedding <=> query_embedding)) > similarity_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- Update source_type check constraint to include 'agent_tool'
ALTER TABLE memory_entries
DROP CONSTRAINT IF EXISTS memory_entries_source_type_check;

ALTER TABLE memory_entries
ADD CONSTRAINT memory_entries_source_type_check
CHECK (source_type IN ('manual', 'extracted', 'suggested', 'agent_tool'));

COMMENT ON COLUMN memory_entries.embedding IS 'Vector embedding for semantic search (1536 dimensions, text-embedding-3-small)';
COMMENT ON COLUMN memory_entries.is_active IS 'Soft delete flag - false means memory has been deleted';
COMMENT ON COLUMN memory_entries.deleted_reason IS 'Reason for deletion (for audit trail)';
COMMENT ON COLUMN memory_entries.deleted_at IS 'Timestamp when memory was soft deleted';
COMMENT ON FUNCTION hybrid_memory_search IS 'Hybrid search combining vector similarity (70%) and BM25 text search (30%) for memory agent tools';
COMMENT ON FUNCTION find_memories_by_embedding IS 'Find semantically similar memories for deduplication in agent tools';
