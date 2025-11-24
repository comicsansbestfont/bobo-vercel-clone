import { supabase } from '../lib/db/client';

async function checkMigration() {
  console.log('Checking if memory_entries table exists...');

  // Try to query the table
  const { data, error } = await supabase
    .from('memory_entries')
    .select('id')
    .limit(1);

  if (error) {
    if (error.message.includes('relation') || error.message.includes('does not exist')) {
      console.log('❌ memory_entries table does NOT exist');
      console.log('   Need to apply migration: 20251201000000_m3_phase2_memory_entries.sql');
      return false;
    }
    console.error('Error checking table:', error);
    return false;
  }

  console.log('✅ memory_entries table exists!');

  // Check memory_settings table
  const { data: settings, error: settingsError } = await supabase
    .from('memory_settings')
    .select('user_id')
    .limit(1);

  if (settingsError) {
    console.log('❌ memory_settings table does NOT exist');
    return false;
  }

  console.log('✅ memory_settings table exists!');

  // Check RPC functions
  const { data: rpcTest, error: rpcError } = await supabase.rpc('find_similar_memories', {
    p_user_id: 'test-id',
    p_category: 'work_context',
    p_content: 'test',
    p_threshold: 0.9
  });

  if (rpcError) {
    console.log('❌ find_similar_memories RPC function does NOT exist');
    return false;
  }

  console.log('✅ find_similar_memories RPC function exists!');
  console.log('\n✅ ALL MIGRATION CHECKS PASSED!');
  return true;
}

checkMigration()
  .then(success => process.exit(success ? 0 : 1))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
