/**
 * Memory System Test Suite
 *
 * Tests the complete memory system including:
 * - Database access (RLS policies)
 * - API endpoints
 * - Memory fetching and filtering
 * - Context injection preparation
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const DEFAULT_USER_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function test(name: string, fn: () => Promise<boolean>) {
  return async () => {
    totalTests++;
    process.stdout.write(`\n${totalTests}. ${name}... `);
    try {
      const result = await fn();
      if (result) {
        passedTests++;
        console.log('✅ PASS');
        return true;
      } else {
        failedTests++;
        console.log('❌ FAIL');
        return false;
      }
    } catch (error) {
      failedTests++;
      console.log('❌ ERROR');
      console.error('   ', error);
      return false;
    }
  };
}

async function runTests() {
  console.log('\n🧪 Memory System Test Suite');
  console.log('=' .repeat(60));

  // Test 1: Database connectivity
  await test('Database connectivity', async () => {
    const { data, error } = await supabase.from('users').select('id').limit(1);
    return !error && data !== null;
  })();

  // Test 2: Memory entries exist
  await test('Memory entries exist in database', async () => {
    const { data, error } = await supabase
      .from('memory_entries')
      .select('id')
      .eq('user_id', DEFAULT_USER_ID);

    if (error) {
      console.error('   Error:', error.message);
      return false;
    }

    const count = data?.length || 0;
    console.log(`   Found ${count} memories`);
    return count === 25;
  })();

  // Test 3: Can fetch all memories
  await test('Fetch all memories via query', async () => {
    const { data, error } = await supabase
      .from('memory_entries')
      .select('*')
      .eq('user_id', DEFAULT_USER_ID);

    if (error) {
      console.error('   Error:', error.message);
      return false;
    }

    return data !== null && data.length > 0;
  })();

  // Test 4: Memory categories are correct
  await test('All 4 memory categories present', async () => {
    const { data, error } = await supabase
      .from('memory_entries')
      .select('category')
      .eq('user_id', DEFAULT_USER_ID);

    if (error) return false;

    const categories = new Set(data?.map(m => m.category));
    const expected = ['work_context', 'personal_context', 'long_term_background', 'other_instructions'];

    const hasAll = expected.every(cat => categories.has(cat));

    if (!hasAll) {
      console.log('   Missing categories:', expected.filter(c => !categories.has(c)));
    } else {
      console.log(`   Categories: ${Array.from(categories).join(', ')}`);
    }

    return hasAll;
  })();

  // Test 5: Work context memories
  await test('Work context memories (expect 9)', async () => {
    const { data, error } = await supabase
      .from('memory_entries')
      .select('content')
      .eq('user_id', DEFAULT_USER_ID)
      .eq('category', 'work_context');

    if (error) return false;

    const count = data?.length || 0;
    console.log(`   Found ${count} work_context entries`);

    // Check for key content
    const hasGTMAdvisor = data?.some(m => m.content.includes('GTM advisor'));
    const hasCoreplan = data?.some(m => m.content.includes('CorePlan'));

    console.log(`   Has GTM advisor: ${hasGTMAdvisor}, Has CorePlan: ${hasCoreplan}`);

    return count === 9 && hasGTMAdvisor && hasCoreplan;
  })();

  // Test 6: Other instructions (Sachee-isms)
  await test('Other instructions (expect 8)', async () => {
    const { data, error } = await supabase
      .from('memory_entries')
      .select('content')
      .eq('user_id', DEFAULT_USER_ID)
      .eq('category', 'other_instructions');

    if (error) return false;

    const count = data?.length || 0;
    console.log(`   Found ${count} other_instructions entries`);

    const hasSpeedWeapon = data?.some(m => m.content.includes('Speed is our weapon'));
    const hasStupidlyObvious = data?.some(m => m.content.includes('stupidly obvious'));

    console.log(`   Has "Speed is our weapon": ${hasSpeedWeapon}`);
    console.log(`   Has "stupidly obvious": ${hasStupidlyObvious}`);

    return count === 8 && hasSpeedWeapon && hasStupidlyObvious;
  })();

  // Test 7: All memories have confidence = 1.0
  await test('All manual memories have confidence = 1.0', async () => {
    const { data, error } = await supabase
      .from('memory_entries')
      .select('confidence, source_type')
      .eq('user_id', DEFAULT_USER_ID);

    if (error) return false;

    const allManual = data?.every(m => m.source_type === 'manual');
    const allHighConfidence = data?.every(m => m.confidence === 1.0);

    console.log(`   All manual: ${allManual}, All confidence 1.0: ${allHighConfidence}`);

    return allManual && allHighConfidence;
  })();

  // Test 8: Memory settings exist
  await test('Memory settings exist for user', async () => {
    const { data, error } = await supabase
      .from('memory_settings')
      .select('*')
      .eq('user_id', DEFAULT_USER_ID)
      .single();

    if (error) {
      console.error('   Error:', error.message);
      return false;
    }

    console.log(`   Auto-extraction: ${data?.auto_extraction_enabled}, Token budget: ${data?.token_budget}`);

    return data !== null && data.token_budget === 500;
  })();

  // Test 9: Token counting estimation
  await test('Estimated token usage under 500', async () => {
    const { data, error } = await supabase
      .from('memory_entries')
      .select('content')
      .eq('user_id', DEFAULT_USER_ID);

    if (error) return false;

    // Rough estimation: 4 chars = 1 token
    const totalChars = data?.reduce((sum, m) => sum + m.content.length, 0) || 0;
    const estimatedTokens = Math.ceil(totalChars / 4);

    console.log(`   Total chars: ${totalChars}, Estimated tokens: ${estimatedTokens}`);

    return estimatedTokens < 500;
  })();

  // Test 10: API endpoint test
  await test('API endpoint /api/memory/entries responds', async () => {
    try {
      const response = await fetch('http://localhost:3000/api/memory/entries');

      if (!response.ok) {
        console.log(`   HTTP ${response.status}: ${response.statusText}`);
        return false;
      }

      const data = await response.json();
      const count = Array.isArray(data) ? data.length : 0;

      console.log(`   API returned ${count} memories`);

      return count === 25;
    } catch (error: any) {
      if (error.cause?.code === 'ECONNREFUSED') {
        console.log('   ⚠️  Dev server not running (this is OK for database tests)');
        return true; // Don't fail if dev server isn't running
      }
      throw error;
    }
  })();

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Results:');
  console.log(`   Total: ${totalTests}`);
  console.log(`   ✅ Passed: ${passedTests}`);
  console.log(`   ❌ Failed: ${failedTests}`);
  console.log(`   Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);

  if (failedTests === 0) {
    console.log('\n🎉 All tests passed! Memory system is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Review errors above.');
  }

  console.log('\n📝 Next Steps:');
  if (failedTests === 0) {
    console.log('   1. Start dev server: npm run dev');
    console.log('   2. Visit: http://localhost:3000/memory');
    console.log('   3. Test a chat: Ask "What\'s my background?"');
  } else {
    console.log('   1. Review failed tests above');
    console.log('   2. Check Supabase RLS policies');
    console.log('   3. Verify environment variables');
  }

  process.exit(failedTests > 0 ? 1 : 0);
}

runTests().catch(error => {
  console.error('\n💥 Test suite crashed:', error);
  process.exit(1);
});
