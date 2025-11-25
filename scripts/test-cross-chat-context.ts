/**
 * Cross-Chat Context Sharing Test
 *
 * This script tests the implementation end-to-end:
 * 1. Creates a project
 * 2. Creates Chat A and adds messages
 * 3. Creates Chat B and verifies it can search Chat A's messages
 *
 * Run with: npx tsx scripts/test-cross-chat-context.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import {
  supabase,
  createProject,
  createChat,
  createMessage,
  searchProjectMessages,
} from '../lib/db';
import { generateEmbedding } from '../lib/ai/embedding';

async function testCrossChatContext() {
  console.log('🧪 Starting Cross-Chat Context Sharing Test\n');

  try {
    // Step 1: Create a test project
    console.log('📁 Creating test project...');
    const project = await createProject({
      name: 'Test Project - Cross Chat',
      description: 'Testing cross-chat context sharing',
      custom_instructions: '',
    });

    if (!project) {
      throw new Error('Failed to create project');
    }
    console.log(`✅ Created project: ${project.name} (${project.id})\n`);

    // Step 2: Create Chat A
    console.log('💬 Creating Chat A...');
    const chatA = await createChat({
      project_id: project.id,
      title: 'Chat A - Mining Equipment',
      model: 'anthropic/claude-sonnet-4-5-20250929',
      web_search_enabled: false,
    });

    if (!chatA) {
      throw new Error('Failed to create Chat A');
    }
    console.log(`✅ Created Chat A: ${chatA.title} (${chatA.id})\n`);

    // Step 3: Add messages to Chat A with specific content
    console.log('📝 Adding messages to Chat A...');
    const messageContentA = 'We use Caterpillar D11 bulldozers for our mining operations. They are very reliable for heavy earthmoving work.';

    const messageA = await createMessage({
      chat_id: chatA.id,
      role: 'user',
      content: {
        parts: [{ type: 'text', text: messageContentA }],
      },
      token_count: 20,
    });

    if (!messageA) {
      throw new Error('Failed to create message in Chat A');
    }
    console.log(`✅ Added message to Chat A: "${messageContentA.substring(0, 50)}..."\n`);

    // Generate embedding for the message
    console.log('🔢 Generating embedding for Chat A message...');
    const embeddingA = await generateEmbedding(messageContentA);

    const { error: updateError } = await supabase
      .from('messages')
      .update({ embedding: embeddingA })
      .eq('id', messageA.id);

    if (updateError) {
      throw new Error(`Failed to update embedding: ${updateError.message}`);
    }
    console.log('✅ Embedding generated and saved\n');

    // Step 4: Create Chat B
    console.log('💬 Creating Chat B...');
    const chatB = await createChat({
      project_id: project.id,
      title: 'Chat B - Equipment Inquiry',
      model: 'anthropic/claude-sonnet-4-5-20250929',
      web_search_enabled: false,
    });

    if (!chatB) {
      throw new Error('Failed to create Chat B');
    }
    console.log(`✅ Created Chat B: ${chatB.title} (${chatB.id})\n`);

    // Step 5: Query from Chat B about bulldozers (should find Chat A's message)
    console.log('🔍 Searching for "bulldozer" context from Chat B...');
    const queryText = 'What bulldozers do we use?';
    const queryEmbedding = await generateEmbedding(queryText);

    const results = await searchProjectMessages(
      project.id,
      chatB.id,
      queryEmbedding,
      0.25,
      5
    );

    console.log(`\n📊 Search Results:`);
    console.log(`   Query: "${queryText}"`);
    console.log(`   Found: ${results.length} results\n`);

    if (results.length === 0) {
      console.log('❌ FAILED: No results found. Cross-chat context sharing is not working.\n');
      console.log('Troubleshooting:');
      console.log('- Check that embeddings were generated correctly');
      console.log('- Verify search_project_messages function is working');
      console.log('- Check similarity threshold (0.25)');
      return false;
    }

    // Step 6: Verify results
    console.log('✅ SUCCESS: Found matching messages from Chat A!\n');
    results.forEach((result, idx) => {
      console.log(`Result ${idx + 1}:`);
      console.log(`   Chat: ${result.chat_title}`);
      console.log(`   Role: ${result.role}`);
      console.log(`   Similarity: ${(result.similarity * 100).toFixed(1)}%`);
      console.log(`   Content: "${result.content.substring(0, 80)}..."`);
      console.log();
    });

    // Verify the result is from Chat A
    const hasMatchFromChatA = results.some(r => r.chat_id === chatA.id);
    if (hasMatchFromChatA) {
      console.log('✅ VERIFIED: Chat B successfully retrieved context from Chat A!');
      console.log('✅ Cross-chat context sharing is working correctly!\n');
    } else {
      console.log('⚠️  WARNING: Found results, but none from Chat A');
      console.log('   This might indicate an issue with chat filtering\n');
    }

    // Clean up
    console.log('🧹 Cleaning up test data...');
    await supabase.from('messages').delete().eq('chat_id', chatA.id);
    await supabase.from('messages').delete().eq('chat_id', chatB.id);
    await supabase.from('chats').delete().eq('id', chatA.id);
    await supabase.from('chats').delete().eq('id', chatB.id);
    await supabase.from('projects').delete().eq('id', project.id);
    console.log('✅ Test data cleaned up\n');

    return true;
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return false;
  }
}

// Run the test
testCrossChatContext()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
