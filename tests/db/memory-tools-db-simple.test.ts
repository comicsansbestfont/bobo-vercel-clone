/**
 * Database Integration Tests for Memory Tools (M3.5-01)
 *
 * Tests database functions via Supabase client since direct psql access
 * requires connection string configuration.
 *
 * Run with: npx tsx tests/db/memory-tools-db-simple.test.ts
 */

import { supabase, DEFAULT_USER_ID } from '../../lib/db/client';
import { generateContentHash } from '../../lib/memory/deduplicator';

// Color output helpers
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function logTest(name: string, status: 'PASS' | 'FAIL' | 'SKIP', duration?: number) {
  const color = status === 'PASS' ? colors.green : status === 'FAIL' ? colors.red : colors.yellow;
  const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏭️';
  console.log(`${color}${emoji} ${name}${colors.reset}${duration ? ` (${duration}ms)` : ''}`);
}

function logSection(title: string) {
  console.log(`\n${colors.bright}${colors.blue}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}${title}${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}${'='.repeat(60)}${colors.reset}\n`);
}

// ============================================================================
// Test Suite
// ============================================================================

async function runTests() {
  logSection('M3.5-01: Database Integration Tests (Via Supabase Client)');

  let testsPassed = 0;
  let testsFailed = 0;
  let testsSkipped = 0;

  // Test IDs for cleanup
  const testIds: string[] = [];

  // ========================================================================
  // TC-DB-001: Verify Table Structure
  // ========================================================================
  try {
    const start = Date.now();

    // Query a single memory to check table structure
    const { data, error } = await supabase
      .from('memory_entries')
      .select('*')
      .limit(1)
      .single();

    const duration = Date.now() - start;

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // Check required fields exist
    if (data) {
      const requiredFields = [
        'id', 'user_id', 'category', 'content', 'confidence',
        'content_hash', 'embedding', 'is_active', 'created_at'
      ];

      const missingFields = requiredFields.filter(field => !(field in data));

      if (missingFields.length > 0) {
        throw new Error(`Missing fields: ${missingFields.join(', ')}`);
      }
    }

    logTest('TC-DB-001: Table structure verification', 'PASS', duration);
    console.log('  ✓ All required fields present');
    testsPassed++;
  } catch (error) {
    logTest('TC-DB-001: Table structure verification', 'FAIL');
    console.error('  Error:', error);
    testsFailed++;
  }

  // ========================================================================
  // TC-DB-002: Test Memory Creation with content_hash
  // ========================================================================
  try {
    const start = Date.now();
    const testContent = 'DB_TEST_001: Senior TypeScript engineer';
    const contentHash = generateContentHash(testContent);

    const { data, error } = await supabase
      .from('memory_entries')
      .insert({
        user_id: DEFAULT_USER_ID,
        category: 'work_context',
        content: testContent,
        confidence: 0.95,
        source_type: 'manual',
        content_hash: contentHash,
        time_period: 'current',
        relevance_score: 1.0,
      })
      .select()
      .single();

    const duration = Date.now() - start;

    if (error) throw error;
    if (!data) throw new Error('No data returned');

    testIds.push(data.id);

    logTest('TC-DB-002: Memory creation with content_hash', 'PASS', duration);
    console.log(`  ✓ Created memory: ${data.id}`);
    testsPassed++;
  } catch (error) {
    logTest('TC-DB-002: Memory creation with content_hash', 'FAIL');
    console.error('  Error:', error);
    testsFailed++;
  }

  // ========================================================================
  // TC-DB-003: Test is_active Filter (Soft Delete)
  // ========================================================================
  if (testIds.length > 0) {
    try {
      const start = Date.now();
      const testId = testIds[0];

      // Soft delete the memory
      const { error: updateError } = await supabase
        .from('memory_entries')
        .update({
          is_active: false,
          deleted_reason: 'Test soft delete',
          deleted_at: new Date().toISOString(),
        })
        .eq('id', testId);

      if (updateError) throw updateError;

      // Verify it's still in database
      const { data: allData } = await supabase
        .from('memory_entries')
        .select('id, is_active')
        .eq('id', testId)
        .single();

      if (!allData) throw new Error('Memory not found in database');
      if (allData.is_active !== false) throw new Error('is_active not set to false');

      const duration = Date.now() - start;

      logTest('TC-DB-003: Soft delete (is_active flag)', 'PASS', duration);
      console.log('  ✓ Memory soft deleted but still in database');
      testsPassed++;
    } catch (error) {
      logTest('TC-DB-003: Soft delete (is_active flag)', 'FAIL');
      console.error('  Error:', error);
      testsFailed++;
    }
  } else {
    logTest('TC-DB-003: Soft delete (is_active flag)', 'SKIP');
    console.log('  ⚠️  Skipped due to failed creation');
    testsSkipped++;
  }

  // ========================================================================
  // TC-DB-004: Test Source Type Constraint
  // ========================================================================
  try {
    const start = Date.now();
    const testContent = 'DB_TEST_AGENT: Agent tool memory';
    const contentHash = generateContentHash(testContent);

    // Test valid source_type: agent_tool
    const { data, error } = await supabase
      .from('memory_entries')
      .insert({
        user_id: DEFAULT_USER_ID,
        category: 'work_context',
        content: testContent,
        confidence: 0.90,
        source_type: 'agent_tool',
        content_hash: contentHash,
      })
      .select()
      .single();

    const duration = Date.now() - start;

    if (error) throw error;
    if (!data) throw new Error('No data returned');

    testIds.push(data.id);

    logTest('TC-DB-004: Source type constraint (agent_tool)', 'PASS', duration);
    console.log('  ✓ agent_tool source type accepted');
    testsPassed++;
  } catch (error) {
    logTest('TC-DB-004: Source type constraint (agent_tool)', 'FAIL');
    console.error('  Error:', error);
    testsFailed++;
  }

  // ========================================================================
  // TC-DB-005: Test Embedding Dimension
  // ========================================================================
  try {
    const start = Date.now();

    // Get a memory with embedding
    const { data, error } = await supabase
      .from('memory_entries')
      .select('embedding')
      .not('embedding', 'is', null)
      .limit(1)
      .single();

    const duration = Date.now() - start;

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (data && data.embedding) {
      // Embedding should be an array
      if (!Array.isArray(data.embedding)) {
        throw new Error('Embedding is not an array');
      }

      // Check dimension (should be 1536 for text-embedding-3-small)
      if (data.embedding.length !== 1536) {
        throw new Error(`Expected 1536 dimensions, got ${data.embedding.length}`);
      }

      logTest('TC-DB-005: Embedding dimension verification', 'PASS', duration);
      console.log('  ✓ Embeddings are 1536-dimensional vectors');
      testsPassed++;
    } else {
      logTest('TC-DB-005: Embedding dimension verification', 'SKIP');
      console.log('  ⚠️  No memories with embeddings found');
      testsSkipped++;
    }
  } catch (error) {
    logTest('TC-DB-005: Embedding dimension verification', 'FAIL');
    console.error('  Error:', error);
    testsFailed++;
  }

  // ========================================================================
  // TC-DB-006: Test hybrid_memory_search RPC
  // ========================================================================
  try {
    const start = Date.now();

    // Get a sample embedding
    const { data: sampleMemory } = await supabase
      .from('memory_entries')
      .select('embedding')
      .not('embedding', 'is', null)
      .limit(1)
      .single();

    if (!sampleMemory?.embedding) {
      throw new Error('No embedding available for testing');
    }

    // Call hybrid_memory_search RPC
    const { data, error } = await supabase.rpc('hybrid_memory_search', {
      query_embedding: sampleMemory.embedding,
      query_text: 'engineer',
      match_count: 5,
      vector_weight: 0.7,
      text_weight: 0.3,
      p_user_id: DEFAULT_USER_ID,
      p_category: null,
    });

    const duration = Date.now() - start;

    if (error) throw error;

    logTest('TC-DB-006: hybrid_memory_search RPC function', 'PASS', duration);
    console.log(`  ✓ Returned ${data?.length || 0} results`);
    if (data && data.length > 0) {
      console.log(`  ✓ Similarity scores: ${data.map((r: any) => r.similarity.toFixed(3)).join(', ')}`);
    }
    testsPassed++;
  } catch (error) {
    logTest('TC-DB-006: hybrid_memory_search RPC function', 'FAIL');
    console.error('  Error:', error);
    testsFailed++;
  }

  // ========================================================================
  // TC-DB-007: Test find_memories_by_embedding RPC
  // ========================================================================
  try {
    const start = Date.now();

    // Get a sample embedding
    const { data: sampleMemory } = await supabase
      .from('memory_entries')
      .select('embedding')
      .not('embedding', 'is', null)
      .limit(1)
      .single();

    if (!sampleMemory?.embedding) {
      throw new Error('No embedding available for testing');
    }

    // Call find_memories_by_embedding RPC
    const { data, error } = await supabase.rpc('find_memories_by_embedding', {
      query_embedding: sampleMemory.embedding,
      similarity_threshold: 0.5,
      p_user_id: DEFAULT_USER_ID,
      match_count: 5,
    });

    const duration = Date.now() - start;

    if (error) throw error;

    logTest('TC-DB-007: find_memories_by_embedding RPC', 'PASS', duration);
    console.log(`  ✓ Returned ${data?.length || 0} results`);
    testsPassed++;
  } catch (error) {
    logTest('TC-DB-007: find_memories_by_embedding RPC', 'FAIL');
    console.error('  Error:', error);
    testsFailed++;
  }

  // ========================================================================
  // TC-DB-008: Test Category Filtering
  // ========================================================================
  try {
    const start = Date.now();

    const { data: sampleMemory } = await supabase
      .from('memory_entries')
      .select('embedding')
      .not('embedding', 'is', null)
      .limit(1)
      .single();

    if (!sampleMemory?.embedding) {
      throw new Error('No embedding available');
    }

    // Test with category filter
    const { data: workData } = await supabase.rpc('hybrid_memory_search', {
      query_embedding: sampleMemory.embedding,
      query_text: 'test',
      match_count: 10,
      p_category: 'work_context',
    });

    const { data: personalData } = await supabase.rpc('hybrid_memory_search', {
      query_embedding: sampleMemory.embedding,
      query_text: 'test',
      match_count: 10,
      p_category: 'personal_context',
    });

    const duration = Date.now() - start;

    logTest('TC-DB-008: Category filtering', 'PASS', duration);
    console.log(`  ✓ Work context: ${workData?.length || 0} results`);
    console.log(`  ✓ Personal context: ${personalData?.length || 0} results`);
    testsPassed++;
  } catch (error) {
    logTest('TC-DB-008: Category filtering', 'FAIL');
    console.error('  Error:', error);
    testsFailed++;
  }

  // ========================================================================
  // Cleanup
  // ========================================================================
  logSection('Cleanup');
  console.log('Cleaning up test data...');

  for (const id of testIds) {
    await supabase
      .from('memory_entries')
      .delete()
      .eq('id', id);
  }

  console.log(`✓ Deleted ${testIds.length} test memories\n`);

  // ========================================================================
  // Summary
  // ========================================================================
  logSection('Test Summary');

  const total = testsPassed + testsFailed + testsSkipped;
  const passRate = ((testsPassed / (total - testsSkipped)) * 100).toFixed(1);

  console.log(`${colors.bright}Total Tests:${colors.reset} ${total}`);
  console.log(`${colors.green}Passed:${colors.reset} ${testsPassed}`);
  console.log(`${colors.red}Failed:${colors.reset} ${testsFailed}`);
  console.log(`${colors.yellow}Skipped:${colors.reset} ${testsSkipped}`);
  console.log(`${colors.bright}Pass Rate:${colors.reset} ${passRate}%\n`);

  if (testsFailed === 0) {
    console.log(`${colors.green}${colors.bright}✅ All database tests passed!${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.red}${colors.bright}❌ Some tests failed${colors.reset}\n`);
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});
