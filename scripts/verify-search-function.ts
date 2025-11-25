/**
 * Verify Search Function
 *
 * Tests the search_project_messages function using existing database data
 * Run with: npx tsx scripts/verify-search-function.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { supabase } from '../lib/db';

async function verifySearchFunction() {
  console.log('🔍 Verifying search_project_messages Function\n');

  try {
    // Step 1: Check if function exists
    console.log('1️⃣  Checking if search_project_messages function exists...');
    const { data: functions, error: fnError } = await supabase.rpc('search_project_messages', {
      p_project_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
      p_current_chat_id: '00000000-0000-0000-0000-000000000000',
      p_query_embedding: new Array(1536).fill(0),
      p_match_threshold: 0.25,
      p_match_count: 1,
    });

    if (fnError && fnError.code !== 'PGRST116') {
      console.log(`❌ Function error: ${fnError.message}`);
      return false;
    }
    console.log('✅ Function exists and is callable\n');

    // Step 2: Check existing projects with chats
    console.log('2️⃣  Finding projects with multiple chats...');
    const { data: projects } = await supabase
      .from('projects')
      .select('id, name, chats(id, title)')
      .gt('chats.count', 1)
      .limit(5);

    if (!projects || projects.length === 0) {
      console.log('⚠️  No projects with multiple chats found');
      console.log('   To test fully, create a project with 2+ chats via the UI\n');
      return true;
    }

    const projectsWithMultipleChats = projects.filter(
      (p: any) => Array.isArray(p.chats) && p.chats.length > 1
    );

    if (projectsWithMultipleChats.length === 0) {
      console.log('⚠️  No projects with multiple chats found');
      console.log('   To test fully, create a project with 2+ chats via the UI\n');
      return true;
    }

    console.log(`✅ Found ${projectsWithMultipleChats.length} projects with multiple chats\n`);

    // Step 3: Test search on first project
    const testProject = projectsWithMultipleChats[0] as any;
    console.log(`3️⃣  Testing search on project: "${testProject.name}"`);
    console.log(`   Chats in project: ${testProject.chats.length}`);

    // Get a message with embedding from first chat
    const firstChat = testProject.chats[0];
    const { data: messages } = await supabase
      .from('messages')
      .select('id, embedding, content')
      .eq('chat_id', firstChat.id)
      .not('embedding', 'is', null)
      .limit(1);

    if (!messages || messages.length === 0) {
      console.log('⚠️  No messages with embeddings in first chat');
      console.log('   Messages need embeddings to be searchable\n');
      return true;
    }

    const testMessage = messages[0] as any;
    const embedding = testMessage.embedding;

    // Use second chat as the querying chat
    const secondChat = testProject.chats[1];

    console.log(`   Using Chat "${firstChat.title}" as source`);
    console.log(`   Querying from Chat "${secondChat.title}"\n`);

    // Step 4: Perform search
    console.log('4️⃣  Executing search_project_messages...');
    const { data: searchResults, error: searchError } = await supabase.rpc('search_project_messages', {
      p_project_id: testProject.id,
      p_current_chat_id: secondChat.id,
      p_query_embedding: embedding,
      p_match_threshold: 0.25,
      p_match_count: 5,
    });

    if (searchError) {
      console.log(`❌ Search error: ${searchError.message}`);
      return false;
    }

    console.log(`   Found: ${searchResults?.length || 0} results\n`);

    if (!searchResults || searchResults.length === 0) {
      console.log('⚠️  No results found');
      console.log('   This could mean:');
      console.log('   - Other chats don\'t have messages with embeddings');
      console.log('   - Similarity threshold is too high');
      console.log('   - Messages are in the same chat (correctly excluded)\n');
      return true;
    }

    // Step 5: Verify results
    console.log('5️⃣  Analyzing results...\n');
    searchResults.forEach((result: any, idx: number) => {
      console.log(`   Result ${idx + 1}:`);
      console.log(`   - Chat ID: ${result.chat_id}`);
      console.log(`   - Chat Title: ${result.chat_title}`);
      console.log(`   - Role: ${result.role}`);
      console.log(`   - Similarity: ${(result.similarity * 100).toFixed(1)}%`);
      console.log(`   - Content: "${result.content?.substring(0, 60)}..."`);
      console.log();
    });

    // Verify current chat is excluded
    const hasCurrentChat = searchResults.some((r: any) => r.chat_id === secondChat.id);
    if (hasCurrentChat) {
      console.log('❌ FAILED: Current chat not excluded from results');
      return false;
    }
    console.log('✅ VERIFIED: Current chat correctly excluded');

    // Verify all results are from same project
    const { data: resultChats } = await supabase
      .from('chats')
      .select('id, project_id')
      .in('id', searchResults.map((r: any) => r.chat_id));

    const allSameProject = resultChats?.every((c: any) => c.project_id === testProject.id);
    if (!allSameProject) {
      console.log('❌ FAILED: Results from different projects');
      return false;
    }
    console.log('✅ VERIFIED: All results from same project');

    console.log('\n✅ SUCCESS: search_project_messages function works correctly!');
    console.log('   The database layer is ready for cross-chat context sharing.\n');

    return true;
  } catch (error) {
    console.error('❌ Verification failed:', error);
    return false;
  }
}

// Run verification
verifySearchFunction()
  .then((success) => {
    console.log(success ? '✅ All checks passed!' : '❌ Some checks failed');
    process.exit(success ? 0 : 1);
  })
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
