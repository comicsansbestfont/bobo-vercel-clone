/**
 * Direct check for thread_id column in memory_entries
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkThreadId() {
  console.log('=== Checking thread_id column in memory_entries ===\n');

  // Try to select thread_id specifically
  const { data, error } = await supabase
    .from('memory_entries')
    .select('id, thread_id')
    .limit(5);

  if (error) {
    console.log('❌ Error selecting thread_id:', error.message);
    console.log('   Code:', error.code);

    if (error.message.includes('column') && error.message.includes('does not exist')) {
      console.log('\n⚠️  CRITICAL: thread_id column does NOT exist in memory_entries table!');
      return false;
    }
  } else {
    console.log('✅ thread_id column EXISTS in memory_entries');
    console.log(`   Retrieved ${data?.length || 0} rows`);

    if (data && data.length > 0) {
      console.log('\n   Sample data:');
      data.forEach((row, i) => {
        console.log(`   ${i + 1}. id=${row.id.substring(0, 8)}..., thread_id=${row.thread_id || 'null'}`);
      });
    }
    return true;
  }
}

checkThreadId()
  .then((exists) => {
    process.exit(exists ? 0 : 1);
  })
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
