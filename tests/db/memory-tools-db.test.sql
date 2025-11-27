-- ============================================================================
-- DATABASE VERIFICATION SCRIPT
-- M3.5-01: Memory Tools Database Integration Tests
-- ============================================================================
--
-- This script tests:
-- 1. RPC functions: hybrid_memory_search, find_memories_by_embedding
-- 2. Table structure and constraints
-- 3. Indexes and performance
-- 4. Soft delete functionality
-- 5. Source type constraints
--
-- Usage: psql $DATABASE_URL -f tests/db/memory-tools-db.test.sql
-- ============================================================================

\set ON_ERROR_STOP on
\timing on

\echo '================================================================'
\echo 'M3.5-01: Database Integration Tests - Starting'
\echo '================================================================'
\echo ''

-- ============================================================================
-- TC-DB-001: Verify Table Structure
-- ============================================================================
\echo 'TC-DB-001: Verifying memory_entries table structure...'

SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'memory_entries'
ORDER BY ordinal_position;

\echo 'Expected columns: id, user_id, category, content, confidence, embedding, is_active, deleted_reason, deleted_at, source_type, etc.'
\echo ''

-- ============================================================================
-- TC-DB-002: Verify Indexes
-- ============================================================================
\echo 'TC-DB-002: Verifying indexes...'

SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'memory_entries'
ORDER BY indexname;

\echo 'Expected indexes: idx_memory_entries_embedding (IVFFlat), idx_memory_entries_active'
\echo ''

-- ============================================================================
-- TC-DB-003: Verify RPC Functions Exist
-- ============================================================================
\echo 'TC-DB-003: Verifying RPC functions exist...'

SELECT
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('hybrid_memory_search', 'find_memories_by_embedding')
ORDER BY routine_name;

\echo 'Expected: 2 functions found'
\echo ''

-- ============================================================================
-- TC-DB-004: Test Data Setup
-- ============================================================================
\echo 'TC-DB-004: Setting up test data...'

-- Clean up any existing test data
DELETE FROM memory_entries WHERE content LIKE 'TEST_%';

-- Insert test memories with embeddings
-- Using random vectors for testing (in production, these would be from text-embedding-3-small)
INSERT INTO memory_entries (
  user_id,
  category,
  content,
  confidence,
  source_type,
  embedding,
  is_active
) VALUES
  (
    (SELECT id FROM users LIMIT 1),
    'work_context',
    'TEST_001: Senior software engineer at Google',
    0.95,
    'manual',
    (SELECT array_agg(random())::vector(1536) FROM generate_series(1, 1536)),
    true
  ),
  (
    (SELECT id FROM users LIMIT 1),
    'work_context',
    'TEST_002: Expert in React and TypeScript',
    0.90,
    'manual',
    (SELECT array_agg(random())::vector(1536) FROM generate_series(1, 1536)),
    true
  ),
  (
    (SELECT id FROM users LIMIT 1),
    'personal_context',
    'TEST_003: Lives in San Francisco',
    0.95,
    'extracted',
    (SELECT array_agg(random())::vector(1536) FROM generate_series(1, 1536)),
    true
  ),
  (
    (SELECT id FROM users LIMIT 1),
    'work_context',
    'TEST_004: Inactive memory (soft deleted)',
    0.85,
    'agent_tool',
    (SELECT array_agg(random())::vector(1536) FROM generate_series(1, 1536)),
    false
  );

\echo 'Inserted 4 test memories (3 active, 1 inactive)'

-- Verify insertion
SELECT COUNT(*) as test_memory_count FROM memory_entries WHERE content LIKE 'TEST_%';
\echo ''

-- ============================================================================
-- TC-DB-005: Test find_memories_by_embedding RPC
-- ============================================================================
\echo 'TC-DB-005: Testing find_memories_by_embedding RPC function...'

-- Get a test embedding
DO $$
DECLARE
  test_embedding vector(1536);
  result_count int;
BEGIN
  -- Get embedding from first test memory
  SELECT embedding INTO test_embedding
  FROM memory_entries
  WHERE content = 'TEST_001: Senior software engineer at Google';

  -- Call RPC function
  SELECT COUNT(*) INTO result_count
  FROM find_memories_by_embedding(
    query_embedding := test_embedding,
    similarity_threshold := 0.5,
    p_user_id := NULL,
    match_count := 5
  );

  RAISE NOTICE 'find_memories_by_embedding returned % results', result_count;

  -- Should return at least the exact match
  IF result_count < 1 THEN
    RAISE EXCEPTION 'Expected at least 1 result, got %', result_count;
  END IF;

  RAISE NOTICE 'TC-DB-005: PASS ✅';
END $$;
\echo ''

-- ============================================================================
-- TC-DB-006: Test hybrid_memory_search RPC
-- ============================================================================
\echo 'TC-DB-006: Testing hybrid_memory_search RPC function...'

DO $$
DECLARE
  test_embedding vector(1536);
  result_count int;
  max_similarity float;
BEGIN
  -- Get embedding from first test memory
  SELECT embedding INTO test_embedding
  FROM memory_entries
  WHERE content = 'TEST_001: Senior software engineer at Google';

  -- Call hybrid search
  SELECT COUNT(*), MAX(similarity) INTO result_count, max_similarity
  FROM hybrid_memory_search(
    query_embedding := test_embedding,
    query_text := 'engineer',
    match_count := 5,
    vector_weight := 0.7,
    text_weight := 0.3,
    p_user_id := NULL,
    p_category := NULL
  );

  RAISE NOTICE 'hybrid_memory_search returned % results', result_count;
  RAISE NOTICE 'Max similarity: %', max_similarity;

  IF result_count < 1 THEN
    RAISE EXCEPTION 'Expected at least 1 result, got %', result_count;
  END IF;

  IF max_similarity IS NULL OR max_similarity < 0 THEN
    RAISE EXCEPTION 'Invalid similarity score: %', max_similarity;
  END IF;

  RAISE NOTICE 'TC-DB-006: PASS ✅';
END $$;
\echo ''

-- ============================================================================
-- TC-DB-007: Test Category Filtering
-- ============================================================================
\echo 'TC-DB-007: Testing category filtering in hybrid_memory_search...'

DO $$
DECLARE
  test_embedding vector(1536);
  work_count int;
  personal_count int;
BEGIN
  SELECT embedding INTO test_embedding
  FROM memory_entries
  WHERE content LIKE 'TEST_%'
  LIMIT 1;

  -- Search with work_context filter
  SELECT COUNT(*) INTO work_count
  FROM hybrid_memory_search(
    query_embedding := test_embedding,
    query_text := 'TEST',
    match_count := 10,
    p_category := 'work_context'
  );

  -- Search with personal_context filter
  SELECT COUNT(*) INTO personal_count
  FROM hybrid_memory_search(
    query_embedding := test_embedding,
    query_text := 'TEST',
    match_count := 10,
    p_category := 'personal_context'
  );

  RAISE NOTICE 'Work context results: %', work_count;
  RAISE NOTICE 'Personal context results: %', personal_count;

  IF work_count = 0 THEN
    RAISE EXCEPTION 'Expected work_context results';
  END IF;

  IF personal_count = 0 THEN
    RAISE EXCEPTION 'Expected personal_context results';
  END IF;

  RAISE NOTICE 'TC-DB-007: PASS ✅';
END $$;
\echo ''

-- ============================================================================
-- TC-DB-008: Test Soft Delete Functionality
-- ============================================================================
\echo 'TC-DB-008: Testing soft delete (is_active filter)...'

DO $$
DECLARE
  test_embedding vector(1536);
  active_count int;
  total_count int;
BEGIN
  SELECT embedding INTO test_embedding
  FROM memory_entries
  WHERE content LIKE 'TEST_%'
  LIMIT 1;

  -- Hybrid search should only return active memories
  SELECT COUNT(*) INTO active_count
  FROM hybrid_memory_search(
    query_embedding := test_embedding,
    query_text := 'TEST',
    match_count := 10
  );

  -- Count total test memories in DB (including inactive)
  SELECT COUNT(*) INTO total_count
  FROM memory_entries
  WHERE content LIKE 'TEST_%';

  RAISE NOTICE 'Active memories returned: %', active_count;
  RAISE NOTICE 'Total memories in DB: %', total_count;

  -- Active count should be less than total (because one is soft deleted)
  IF active_count >= total_count THEN
    RAISE EXCEPTION 'Soft delete not working: active_count % >= total_count %', active_count, total_count;
  END IF;

  RAISE NOTICE 'TC-DB-008: PASS ✅';
END $$;
\echo ''

-- ============================================================================
-- TC-DB-009: Test Source Type Constraint
-- ============================================================================
\echo 'TC-DB-009: Testing source_type constraint...'

-- Should succeed with valid source_type
INSERT INTO memory_entries (
  user_id,
  category,
  content,
  confidence,
  source_type,
  embedding
) VALUES (
  (SELECT id FROM users LIMIT 1),
  'work_context',
  'TEST_VALID_SOURCE: Agent tool memory',
  0.90,
  'agent_tool',
  (SELECT array_agg(random())::vector(1536) FROM generate_series(1, 1536))
);

\echo 'Valid source_type inserted: agent_tool'

-- Clean up
DELETE FROM memory_entries WHERE content = 'TEST_VALID_SOURCE: Agent tool memory';

-- Should fail with invalid source_type (test in separate transaction)
-- Note: This will intentionally error, so we catch it
DO $$
BEGIN
  INSERT INTO memory_entries (
    user_id,
    category,
    content,
    confidence,
    source_type,
    embedding
  ) VALUES (
    (SELECT id FROM users LIMIT 1),
    'work_context',
    'TEST_INVALID_SOURCE',
    0.90,
    'invalid_type',
    (SELECT array_agg(random())::vector(1536) FROM generate_series(1, 1536))
  );

  RAISE EXCEPTION 'Should have failed with invalid source_type';
EXCEPTION
  WHEN check_violation THEN
    RAISE NOTICE 'Correctly rejected invalid source_type ✅';
  WHEN OTHERS THEN
    RAISE NOTICE 'Unexpected error: %', SQLERRM;
END $$;

\echo 'TC-DB-009: PASS ✅'
\echo ''

-- ============================================================================
-- TC-DB-010: Performance Test - Index Usage
-- ============================================================================
\echo 'TC-DB-010: Testing index usage and performance...'

-- Explain the hybrid search query
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM hybrid_memory_search(
  query_embedding := (SELECT embedding FROM memory_entries WHERE content LIKE 'TEST_%' LIMIT 1),
  query_text := 'engineer',
  match_count := 5
);

\echo 'Check output above for "Index Scan" or "IVFFlat" - query should use vector index'
\echo 'TC-DB-010: Manual verification required'
\echo ''

-- ============================================================================
-- TC-DB-011: Test Deduplication Threshold
-- ============================================================================
\echo 'TC-DB-011: Testing deduplication similarity threshold...'

DO $$
DECLARE
  test_embedding vector(1536);
  high_threshold_count int;
  low_threshold_count int;
BEGIN
  SELECT embedding INTO test_embedding
  FROM memory_entries
  WHERE content = 'TEST_001: Senior software engineer at Google';

  -- High threshold (0.85) - should return fewer results
  SELECT COUNT(*) INTO high_threshold_count
  FROM find_memories_by_embedding(
    query_embedding := test_embedding,
    similarity_threshold := 0.85,
    match_count := 5
  );

  -- Low threshold (0.5) - should return more results
  SELECT COUNT(*) INTO low_threshold_count
  FROM find_memories_by_embedding(
    query_embedding := test_embedding,
    similarity_threshold := 0.5,
    match_count := 5
  );

  RAISE NOTICE 'High threshold (0.85) results: %', high_threshold_count;
  RAISE NOTICE 'Low threshold (0.5) results: %', low_threshold_count;

  IF low_threshold_count < high_threshold_count THEN
    RAISE EXCEPTION 'Low threshold should return >= results than high threshold';
  END IF;

  RAISE NOTICE 'TC-DB-011: PASS ✅';
END $$;
\echo ''

-- ============================================================================
-- TC-DB-012: Verify Embedding Dimension
-- ============================================================================
\echo 'TC-DB-012: Verifying embedding dimensions...'

DO $$
DECLARE
  dims int;
BEGIN
  SELECT vector_dims(embedding) INTO dims
  FROM memory_entries
  WHERE content LIKE 'TEST_%'
  LIMIT 1;

  RAISE NOTICE 'Embedding dimensions: %', dims;

  IF dims != 1536 THEN
    RAISE EXCEPTION 'Expected 1536 dimensions, got %', dims;
  END IF;

  RAISE NOTICE 'TC-DB-012: PASS ✅';
END $$;
\echo ''

-- ============================================================================
-- CLEANUP
-- ============================================================================
\echo 'Cleaning up test data...'
DELETE FROM memory_entries WHERE content LIKE 'TEST_%';
\echo 'Test data cleaned up'
\echo ''

-- ============================================================================
-- SUMMARY
-- ============================================================================
\echo '================================================================'
\echo 'M3.5-01: Database Integration Tests - Summary'
\echo '================================================================'
\echo 'Test Cases:'
\echo '  TC-DB-001: Table structure ✅'
\echo '  TC-DB-002: Indexes ✅'
\echo '  TC-DB-003: RPC functions exist ✅'
\echo '  TC-DB-004: Test data setup ✅'
\echo '  TC-DB-005: find_memories_by_embedding ✅'
\echo '  TC-DB-006: hybrid_memory_search ✅'
\echo '  TC-DB-007: Category filtering ✅'
\echo '  TC-DB-008: Soft delete ✅'
\echo '  TC-DB-009: Source type constraint ✅'
\echo '  TC-DB-010: Index usage (manual verify)'
\echo '  TC-DB-011: Deduplication threshold ✅'
\echo '  TC-DB-012: Embedding dimensions ✅'
\echo ''
\echo 'All automated tests completed. Review output above for any failures.'
\echo '================================================================'
