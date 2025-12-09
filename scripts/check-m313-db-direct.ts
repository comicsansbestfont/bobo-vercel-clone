/**
 * Direct Database Check for M3.13 Schema
 * This script directly queries the database to verify schema requirements
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('=== M3.13 Database Schema Direct Check ===\n');

  // 1. Check memory_entries for new columns by selecting
  console.log('1. Checking memory_entries columns (memory_type, tags, thread_id)...');
  const { data: memEntry, error: memError } = await supabase
    .from('memory_entries')
    .select('id, memory_type, tags, thread_id')
    .limit(1)
    .maybeSingle();

  if (memError) {
    console.log('   ❌ Error:', memError.message);
  } else {
    const hasMemoryType = memEntry === null || 'memory_type' in memEntry;
    const hasTags = memEntry === null || 'tags' in memEntry;
    const hasThreadId = memEntry === null || 'thread_id' in memEntry;

    console.log(`   memory_type: ${hasMemoryType ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`   tags: ${hasTags ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`   thread_id: ${hasThreadId ? '✅ EXISTS' : '❌ MISSING'}`);

    if (memEntry) {
      console.log('   Sample values:');
      console.log(`     memory_type = ${memEntry.memory_type || 'null'}`);
      console.log(`     tags = ${JSON.stringify(memEntry.tags || [])}`);
      console.log(`     thread_id = ${memEntry.thread_id || 'null'}`);
    }
  }

  // 2. Check thought_threads table existence
  console.log('\n2. Checking thought_threads table...');
  const { data: threadData, error: threadError } = await supabase
    .from('thought_threads')
    .select('*')
    .limit(1);

  if (threadError) {
    console.log('   ❌ Table access error:', threadError.message);
    console.log('   Code:', threadError.code);

    // Check if it's an RLS issue vs table doesn't exist
    if (threadError.message.includes('permission denied')) {
      console.log('   ⚠️  Note: This may be an RLS policy issue, not missing table');
      console.log('   ℹ️  Attempting to create a test thread to verify table exists...');

      // Try to insert - if table exists but RLS blocks, we'll get FK or RLS error
      const { data: insertTest, error: insertError } = await supabase
        .from('thought_threads')
        .insert({ title: 'Test Thread' })
        .select()
        .maybeSingle();

      if (insertError) {
        if (insertError.message.includes('relation') && insertError.message.includes('does not exist')) {
          console.log('   ❌ FAIL: Table does not exist');
        } else if (insertError.message.includes('permission') || insertError.code === '42501') {
          console.log('   ✅ PASS: Table exists (RLS blocking anonymous access)');
        } else {
          console.log('   ⚠️  Insert error:', insertError.message);
        }
      } else if (insertTest) {
        console.log('   ✅ PASS: Table exists and is accessible');
        console.log('   Columns:', Object.keys(insertTest));
        // Clean up
        await supabase.from('thought_threads').delete().eq('id', insertTest.id);
      }
    } else if (threadError.message.includes('relation') && threadError.message.includes('does not exist')) {
      console.log('   ❌ FAIL: Table does not exist');
    }
  } else {
    console.log('   ✅ PASS: Table exists and accessible');
    if (threadData && threadData.length > 0) {
      console.log('   Sample columns:', Object.keys(threadData[0]));
    }
  }

  // 3. Test memory_type CHECK constraint
  console.log('\n3. Testing memory_type CHECK constraint...');
  const { error: checkError } = await supabase
    .from('memory_entries')
    .insert({
      category: 'other_instructions',
      content: 'constraint test',
      memory_type: 'invalid_type' as any,
    });

  if (checkError) {
    if (checkError.message.includes('check constraint') || checkError.message.includes('violates check')) {
      console.log('   ✅ PASS: CHECK constraint working');
    } else {
      console.log('   ⚠️  Error (may not be constraint):', checkError.message);
    }
  } else {
    console.log('   ❌ FAIL: Invalid value accepted (constraint missing)');
  }

  // 4. Test foreign key constraint (thread_id -> thought_threads.id)
  console.log('\n4. Testing foreign key constraint (thread_id)...');
  const { error: fkError } = await supabase
    .from('memory_entries')
    .insert({
      category: 'other_instructions',
      content: 'fk test',
      thread_id: '00000000-0000-0000-0000-000000000000',
    });

  if (fkError) {
    if (fkError.message.includes('foreign key') || fkError.message.includes('violates')) {
      console.log('   ✅ PASS: Foreign key constraint enforced');
    } else {
      console.log('   ⚠️  Error:', fkError.message);
    }
  } else {
    console.log('   ❌ FAIL: Invalid thread_id accepted (FK missing)');
  }

  // 5. Check if tags is an array type
  console.log('\n5. Verifying tags is TEXT[] array...');
  const { data: tagData, error: tagError } = await supabase
    .from('memory_entries')
    .select('tags')
    .not('tags', 'is', null)
    .limit(1)
    .maybeSingle();

  if (tagError) {
    console.log('   ⚠️  Error:', tagError.message);
  } else if (tagData) {
    const isArray = Array.isArray(tagData.tags);
    console.log(`   ${isArray ? '✅ PASS' : '❌ FAIL'}: tags is ${isArray ? 'an array' : 'not an array'}`);
    if (isArray && tagData.tags.length > 0) {
      console.log('   Sample tags:', tagData.tags);
    }
  } else {
    console.log('   ⚠️  No data with tags found (unable to verify)');
  }

  console.log('\n=== Summary ===');
  console.log('Run the comprehensive verification with:');
  console.log('  npx tsx scripts/verify-m313-schema.ts');
  console.log('  npx tsx scripts/verify-m313-rpc.ts');
}

checkSchema().catch(console.error);
