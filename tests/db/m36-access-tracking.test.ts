// tests/db/m36-access-tracking.test.ts
//
// M3.6-01 Access Tracking Verification Tests
// Run with: NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... npx tsx tests/db/m36-access-tracking.test.ts

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in environment');
  console.error('   Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
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

async function runTests() {
  console.log('\n🧪 M3.6-01 Access Tracking Verification Tests\n');
  console.log('='.repeat(60) + '\n');

  // ============================================================
  // TEST 1: Columns exist
  // ============================================================
  await test('last_accessed column exists', async () => {
    const { data, error } = await supabase
      .from('memory_entries')
      .select('last_accessed')
      .limit(1);

    if (error && error.message.includes('last_accessed')) {
      throw new Error('Column last_accessed does not exist');
    }
  });

  await test('access_count column exists', async () => {
    const { data, error } = await supabase
      .from('memory_entries')
      .select('access_count')
      .limit(1);

    if (error && error.message.includes('access_count')) {
      throw new Error('Column access_count does not exist');
    }
  });

  // ============================================================
  // TEST 2: Backfill completed (no null values)
  // ============================================================
  await test('No null last_accessed values', async () => {
    const { data, error, count } = await supabase
      .from('memory_entries')
      .select('id', { count: 'exact' })
      .is('last_accessed', null);

    if (error) throw error;
    if (count && count > 0) {
      throw new Error(`Found ${count} rows with null last_accessed`);
    }
  });

  await test('No null access_count values', async () => {
    const { data, error, count } = await supabase
      .from('memory_entries')
      .select('id', { count: 'exact' })
      .is('access_count', null);

    if (error) throw error;
    if (count && count > 0) {
      throw new Error(`Found ${count} rows with null access_count`);
    }
  });

  await test('No negative access_count values', async () => {
    const { data, error, count } = await supabase
      .from('memory_entries')
      .select('id', { count: 'exact' })
      .lt('access_count', 0);

    if (error) throw error;
    if (count && count > 0) {
      throw new Error(`Found ${count} rows with negative access_count`);
    }
  });

  // ============================================================
  // TEST 3: RPC function works
  // ============================================================
  await test('RPC function exists and is callable', async () => {
    // Call with empty array - should succeed without error
    const { error } = await supabase.rpc('update_memory_access', {
      p_memory_ids: [],
    });

    if (error) {
      throw new Error(`RPC call failed: ${error.message}`);
    }
  });

  await test('RPC function increments access_count', async () => {
    // Get a memory to test with
    const { data: memories, error: fetchError } = await supabase
      .from('memory_entries')
      .select('id, access_count, last_accessed, last_mentioned')
      .eq('is_active', true)
      .limit(1);

    if (fetchError) throw fetchError;
    if (!memories || memories.length === 0) {
      console.log('  ⚠️  No active memories to test RPC - skipping');
      return;
    }

    const memory = memories[0];
    const originalCount = memory.access_count || 0;
    const originalAccessed = memory.last_accessed;
    const originalMentioned = memory.last_mentioned;

    // Call RPC
    const { error: rpcError } = await supabase.rpc('update_memory_access', {
      p_memory_ids: [memory.id],
    });

    if (rpcError) throw new Error(`RPC failed: ${rpcError.message}`);

    // Small delay to ensure timestamps differ
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify the update
    const { data: updated, error: verifyError } = await supabase
      .from('memory_entries')
      .select('access_count, last_accessed, last_mentioned')
      .eq('id', memory.id)
      .single();

    if (verifyError) throw verifyError;

    // Check access_count incremented
    if (updated.access_count !== originalCount + 1) {
      throw new Error(
        `access_count not incremented: was ${originalCount}, now ${updated.access_count}`
      );
    }

    // Check timestamps updated (should be newer than original)
    const newAccessed = new Date(updated.last_accessed);
    const oldAccessed = originalAccessed ? new Date(originalAccessed) : new Date(0);
    if (newAccessed <= oldAccessed) {
      throw new Error('last_accessed was not updated');
    }

    // Check last_mentioned also updated (dead code fix verification)
    const newMentioned = new Date(updated.last_mentioned);
    const oldMentioned = originalMentioned ? new Date(originalMentioned) : new Date(0);
    if (newMentioned <= oldMentioned) {
      throw new Error('last_mentioned was not updated (dead code fix not working)');
    }

    console.log(`  └─ access_count: ${originalCount} → ${updated.access_count}`);
    console.log(`  └─ last_accessed: updated ✓`);
    console.log(`  └─ last_mentioned: updated ✓ (dead code fix working)`);
  });

  await test('RPC handles invalid UUIDs gracefully', async () => {
    // Call with non-existent UUID - should not throw
    const { error } = await supabase.rpc('update_memory_access', {
      p_memory_ids: ['00000000-0000-0000-0000-000000000000'],
    });

    // The RPC should succeed (just not update any rows)
    if (error) {
      throw new Error(`RPC should handle invalid UUIDs: ${error.message}`);
    }
  });

  // ============================================================
  // TEST 4: Sample data verification
  // ============================================================
  await test('Sample memories have reasonable access_count values', async () => {
    const { data, error } = await supabase
      .from('memory_entries')
      .select('id, access_count, source_message_count')
      .limit(5);

    if (error) throw error;
    if (!data || data.length === 0) {
      console.log('  ⚠️  No memories found - skipping');
      return;
    }

    // Verify backfill logic: access_count should be source_message_count - 1 (min 0)
    // Note: Some may have been incremented by previous test runs
    for (const m of data) {
      const expected = Math.max((m.source_message_count || 1) - 1, 0);
      if (m.access_count < expected) {
        throw new Error(
          `Memory ${m.id}: access_count (${m.access_count}) < expected (${expected})`
        );
      }
    }
    console.log(`  └─ Verified ${data.length} memories have valid access_count`);
  });

  // ============================================================
  // SUMMARY
  // ============================================================
  console.log('\n' + '='.repeat(60));
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  console.log(`\n📊 Results: ${passed}/${total} tests passed\n`);

  if (passed === total) {
    console.log('✅ All tests passed! M3.6-01 migration verified.\n');
    console.log('Quality Gates Status:');
    console.log('  ✅ GATE 1: Migration Applied - columns visible, backfill complete');
    console.log('  ✅ GATE 2: Function Works - RPC callable, increments correctly');
    console.log('  ✅ GATE 3: No Regression - (verify npm run build separately)\n');
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
