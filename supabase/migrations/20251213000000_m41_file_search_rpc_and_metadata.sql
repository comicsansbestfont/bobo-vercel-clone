-- M41: File metadata + hybrid file search RPC
-- Adds metadata columns for file categorization (used by advisory + inspiration libraries),
-- a generated full-text search vector, and a reusable hybrid search function.

-- Ensure required extensions exist
CREATE EXTENSION IF NOT EXISTS vector;

-- Add metadata columns for filtering/categorization
ALTER TABLE files
ADD COLUMN IF NOT EXISTS entity_type TEXT;

ALTER TABLE files
ADD COLUMN IF NOT EXISTS entity_name TEXT;

-- Generated FTS vector for BM25-style scoring
ALTER TABLE files
ADD COLUMN IF NOT EXISTS fts tsvector
GENERATED ALWAYS AS (
  to_tsvector('english', coalesce(filename, '') || ' ' || coalesce(content_text, ''))
) STORED;

-- Index for text search
CREATE INDEX IF NOT EXISTS files_fts_idx ON files USING gin(fts);

-- Ensure upsert conflict target exists for indexing scripts
CREATE UNIQUE INDEX IF NOT EXISTS files_project_filename_unique
ON files(project_id, filename);

-- Hybrid file search function (70% vector + 30% BM25 by default)
CREATE OR REPLACE FUNCTION search_advisory_files(
  query_embedding vector(1536),
  query_text text,
  p_project_id uuid DEFAULT NULL,
  entity_type_filter text DEFAULT NULL,
  entity_name_filter text DEFAULT NULL,
  match_count int DEFAULT 5,
  vector_weight float DEFAULT 0.7,
  text_weight float DEFAULT 0.3,
  min_similarity float DEFAULT 0.3
)
RETURNS TABLE (
  id uuid,
  filename text,
  content_text text,
  entity_type text,
  entity_name text,
  file_type text,
  vector_score float,
  text_score float,
  combined_score float
)
LANGUAGE plpgsql
AS $$
DECLARE
  max_text_rank float;
BEGIN
  -- Get max text rank for normalization
  SELECT MAX(ts_rank_cd(f.fts, plainto_tsquery('english', query_text)))
  INTO max_text_rank
  FROM files f
  WHERE (p_project_id IS NULL OR f.project_id = p_project_id)
    AND f.embedding IS NOT NULL;

  -- Handle case where no text matches
  IF max_text_rank IS NULL OR max_text_rank = 0 THEN
    max_text_rank := 1.0;
  END IF;

  RETURN QUERY
  SELECT
    f.id,
    f.filename,
    f.content_text,
    f.entity_type,
    f.entity_name,
    f.file_type,
    (1 - (f.embedding <=> query_embedding))::float AS vector_score,
    (ts_rank_cd(f.fts, plainto_tsquery('english', query_text)) / max_text_rank)::float AS text_score,
    (
      vector_weight * (1 - (f.embedding <=> query_embedding)) +
      text_weight * (ts_rank_cd(f.fts, plainto_tsquery('english', query_text)) / max_text_rank)
    )::float AS combined_score
  FROM files f
  WHERE f.embedding IS NOT NULL
    AND (p_project_id IS NULL OR f.project_id = p_project_id)
    AND (entity_type_filter IS NULL OR f.entity_type = entity_type_filter)
    AND (entity_name_filter IS NULL OR f.entity_name ILIKE '%' || entity_name_filter || '%')
    AND (1 - (f.embedding <=> query_embedding)) >= min_similarity
  ORDER BY combined_score DESC
  LIMIT match_count;
END;
$$;

-- Grant execute permission (single-user MVP)
GRANT EXECUTE ON FUNCTION search_advisory_files TO authenticated, anon;

COMMENT ON FUNCTION search_advisory_files IS
'Reusable hybrid search for files with optional project and metadata filters. Used by advisory and inspiration libraries.';

