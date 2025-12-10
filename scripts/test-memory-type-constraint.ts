import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConstraint() {
  console.log('Testing memory_type CHECK constraint...\n');

  // Test 1: Try invalid value
  console.log('1. Attempting to insert invalid memory_type...');
  const { error: invalidError } = await supabase
    .from('memory_entries')
    .insert({
      category: 'other_instructions',
      content: 'test content',
      content_hash: 'test_hash_' + Date.now(),
      memory_type: 'invalid_type' as any,
    });

  if (invalidError) {
    if (invalidError.message.toLowerCase().includes('check') ||
        invalidError.message.toLowerCase().includes('constraint') ||
        invalidError.message.includes('memory_type')) {
      console.log('   ✅ PASS: Invalid value rejected');
      console.log('   Error:', invalidError.message);
    } else {
      console.log('   ⚠️  Rejected but different error:', invalidError.message);
    }
  } else {
    console.log('   ❌ FAIL: Invalid value accepted!');
  }

  // Test 2: Try valid values
  console.log('\n2. Testing valid memory_type values...');
  const validTypes = ['fact', 'question', 'decision', 'insight'];

  for (const type of validTypes) {
    const { data, error } = await supabase
      .from('memory_entries')
      .insert({
        category: 'other_instructions',
        content: `test ${type}`,
        content_hash: `test_${type}_` + Date.now(),
        memory_type: type,
      })
      .select('id, memory_type')
      .single();

    if (error) {
      console.log(`   ❌ ${type}: Rejected - ${error.message}`);
    } else {
      const shortId = data.id.substring(0, 8);
      console.log(`   ✅ ${type}: Accepted (id=${shortId}...)`);
      // Clean up
      await supabase.from('memory_entries').delete().eq('id', data.id);
    }
  }
}

testConstraint().catch(console.error);
