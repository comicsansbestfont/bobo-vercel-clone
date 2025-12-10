/**
 * Direct check for thought_threads table
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkThoughtThreads() {
  console.log('=== Checking thought_threads table ===\n');

  // Try to select from thought_threads
  const { data, error } = await supabase
    .from('thought_threads')
    .select('*')
    .limit(5);

  if (error) {
    console.log('❌ Error accessing thought_threads:', error.message);
    console.log('   Code:', error.code);

    if (error.message.includes('relation') && error.message.includes('does not exist')) {
      console.log('\n⚠️  CRITICAL: thought_threads table does NOT exist!');
      return false;
    } else if (error.code === '42501') {
      console.log('\n⚠️  Permission denied (RLS blocking access)');
      console.log('   This suggests table EXISTS but RLS policies are blocking');

      // Try to insert to verify table exists
      const { error: insertError } = await supabase
        .from('thought_threads')
        .insert({ title: 'Test Thread', user_id: '00000000-0000-0000-0000-000000000000' })
        .select();

      if (insertError) {
        if (insertError.message.includes('relation') && insertError.message.includes('does not exist')) {
          console.log('   ❌ FAIL: Table does not exist');
          return false;
        } else {
          console.log('   ✅ PASS: Table exists (got different error)');
          console.log('   Error:', insertError.message);
          return true;
        }
      }
    }
  } else {
    console.log('✅ thought_threads table EXISTS and is accessible');
    console.log(`   Retrieved ${data?.length || 0} rows`);

    if (data && data.length > 0) {
      console.log('\n   Sample data:');
      console.log('   Columns:', Object.keys(data[0]));
      data.forEach((row, i) => {
        console.log(`   ${i + 1}. id=${row.id?.substring(0, 8)}..., title="${row.title}"`);
      });
    } else {
      console.log('\n   Table is empty (no rows)');
      console.log('   Attempting to check structure by creating test row...');

      const { data: inserted, error: insertError } = await supabase
        .from('thought_threads')
        .insert({ title: 'Structure Test', user_id: '00000000-0000-0000-0000-000000000000' })
        .select()
        .single();

      if (insertError) {
        console.log('   ⚠️  Insert error:', insertError.message);
      } else if (inserted) {
        console.log('   ✅ Table structure:');
        console.log('   Columns:', Object.keys(inserted).join(', '));

        // Verify required columns
        const required = ['id', 'user_id', 'title', 'description', 'created_at', 'updated_at'];
        const missing = required.filter(col => !(col in inserted));

        if (missing.length === 0) {
          console.log('   ✅ All required columns present');
        } else {
          console.log('   ❌ Missing columns:', missing.join(', '));
        }

        // Clean up
        await supabase.from('thought_threads').delete().eq('id', inserted.id);
      }
    }
    return true;
  }
}

checkThoughtThreads()
  .then((exists) => {
    process.exit(exists ? 0 : 1);
  })
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
