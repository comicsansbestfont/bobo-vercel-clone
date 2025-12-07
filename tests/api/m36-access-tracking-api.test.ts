// tests/api/m36-access-tracking-api.test.ts
//
// M3.6-02 Access Tracking Integration Tests
// Run with: NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... npx tsx tests/api/m36-access-tracking-api.test.ts

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    results.push({ name, passed: true });
    console.log(`✅ ${name}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    results.push({ name, passed: false, error: message });
    console.log(`❌ ${name}: ${message}`);
  }
}

// Simulates what searchMemoryTool does
async function simulateSearch(query: string): Promise<string[]> {
  // Generate a simple embedding (in real code this uses generateEmbedding)
  // For testing, we just query directly
  const { data, error } = await supabase
    .from('memory_entries')
    .select('id, content, category')
    .eq('is_active', true)
    .textSearch('content', query.split(' ').join(' | '))
    .limit(3);

  if (error || !data) return [];
  return data.map(m => m.id);
}

async function runTests() {
  console.log('\n🧪 M3.6-02 Access Tracking Integration Tests\n');
  console.log('='.repeat(60) + '\n');

  // ============================================================
  // TEST 1: updateMemoryAccess wrapper works
  // ============================================================
  await test('updateMemoryAccess RPC wrapper works', async () => {
    // Get a test memory
    const { data: memories } = await supabase
      .from('memory_entries')
      .select('id, access_count')
      .eq('is_active', true)
      .limit(1);

    if (!memories || memories.length === 0) {
      console.log('  ⚠️  No memories to test - skipping');
      return;
    }

    const memory = memories[0];
    const originalCount = memory.access_count;

    // Call RPC directly (simulating what wrapper does)
    const { error } = await supabase.rpc('update_memory_access', {
      p_memory_ids: [memory.id],
    });

    if (error) throw new Error(`RPC failed: ${error.message}`);

    // Verify increment
    const { data: updated } = await supabase
      .from('memory_entries')
      .select('access_count')
      .eq('id', memory.id)
      .single();

    if (updated?.access_count !== originalCount + 1) {
      throw new Error(`Expected ${originalCount + 1}, got ${updated?.access_count}`);
    }

    console.log(`  └─ access_count: ${originalCount} → ${updated.access_count}`);
  });

  // ============================================================
  // TEST 2: Empty array handling
  // ============================================================
  await test('Empty array does not cause errors', async () => {
    const { error } = await supabase.rpc('update_memory_access', {
      p_memory_ids: [],
    });

    if (error) throw new Error(`Empty array failed: ${error.message}`);
  });

  // ============================================================
  // TEST 3: Multiple IDs in single call
  // ============================================================
  await test('Batch update works for multiple memories', async () => {
    const { data: memories } = await supabase
      .from('memory_entries')
      .select('id, access_count')
      .eq('is_active', true)
      .limit(3);

    if (!memories || memories.length < 2) {
      console.log('  ⚠️  Not enough memories - skipping');
      return;
    }

    const ids = memories.map(m => m.id);
    const originalCounts = Object.fromEntries(
      memories.map(m => [m.id, m.access_count])
    );

    // Batch update
    const { error } = await supabase.rpc('update_memory_access', {
      p_memory_ids: ids,
    });

    if (error) throw new Error(`Batch update failed: ${error.message}`);

    // Verify all incremented
    const { data: updated } = await supabase
      .from('memory_entries')
      .select('id, access_count')
      .in('id', ids);

    for (const m of updated || []) {
      const expected = originalCounts[m.id] + 1;
      if (m.access_count !== expected) {
        throw new Error(`Memory ${m.id}: expected ${expected}, got ${m.access_count}`);
      }
    }

    console.log(`  └─ Updated ${ids.length} memories in single call`);
  });

  // ============================================================
  // TEST 4: Invalid UUIDs don't throw
  // ============================================================
  await test('Invalid UUIDs handled gracefully', async () => {
    const { error } = await supabase.rpc('update_memory_access', {
      p_memory_ids: ['00000000-0000-0000-0000-000000000000'],
    });

    // Should not error - just no rows affected
    if (error) throw new Error(`Should handle invalid UUID: ${error.message}`);
  });

  // ============================================================
  // TEST 5: Inactive memories not updated
  // ============================================================
  await test('Inactive memories are not updated', async () => {
    // Find an inactive memory
    const { data: inactive } = await supabase
      .from('memory_entries')
      .select('id, access_count')
      .eq('is_active', false)
      .limit(1);

    if (!inactive || inactive.length === 0) {
      console.log('  ⚠️  No inactive memories - skipping');
      return;
    }

    const memory = inactive[0];
    const originalCount = memory.access_count;

    // Try to update
    await supabase.rpc('update_memory_access', {
      p_memory_ids: [memory.id],
    });

    // Verify NOT incremented
    const { data: check } = await supabase
      .from('memory_entries')
      .select('access_count')
      .eq('id', memory.id)
      .single();

    if (check?.access_count !== originalCount) {
      throw new Error(`Inactive memory was updated! ${originalCount} → ${check?.access_count}`);
    }

    console.log('  └─ Inactive memory correctly skipped');
  });

  // ============================================================
  // TEST 6: Timestamps updated
  // ============================================================
  await test('last_accessed and last_mentioned both updated', async () => {
    const { data: memories } = await supabase
      .from('memory_entries')
      .select('id, last_accessed, last_mentioned')
      .eq('is_active', true)
      .limit(1);

    if (!memories || memories.length === 0) {
      console.log('  ⚠️  No memories - skipping');
      return;
    }

    const memory = memories[0];
    const beforeAccessed = memory.last_accessed;
    const beforeMentioned = memory.last_mentioned;

    // Wait a moment to ensure timestamp difference
    await new Promise(r => setTimeout(r, 100));

    // Update
    await supabase.rpc('update_memory_access', {
      p_memory_ids: [memory.id],
    });

    // Check timestamps
    const { data: updated } = await supabase
      .from('memory_entries')
      .select('last_accessed, last_mentioned')
      .eq('id', memory.id)
      .single();

    const afterAccessed = new Date(updated!.last_accessed!);
    const afterMentioned = new Date(updated!.last_mentioned!);
    const before = beforeAccessed ? new Date(beforeAccessed) : new Date(0);

    if (afterAccessed <= before) {
      throw new Error('last_accessed not updated');
    }

    if (afterMentioned <= before) {
      throw new Error('last_mentioned not updated (dead code fix)');
    }

    console.log('  └─ Both timestamps updated correctly');
  });

  // ============================================================
  // SUMMARY
  // ============================================================
  console.log('\n' + '='.repeat(60));
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  console.log(`\n📊 Results: ${passed}/${total} tests passed\n`);

  if (passed === total) {
    console.log('✅ All tests passed! M3.6-02 integration verified.\n');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed. Review the errors above.\n');
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
