/**
 * Database Connection Test
 *
 * Run this to verify database connection and query functions work.
 * Usage: npx tsx lib/db/test-connection.ts
 */

// IMPORTANT: Load environment variables BEFORE any other imports
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { createChat, createProject, DEFAULT_USER_ID, getChats, getDefaultUser, getProjects } from './index';

async function testConnection() {
  console.log('🔍 Testing Supabase connection...\n');

  // Test 1: Get default user
  console.log('1️⃣  Fetching default user...');
  const user = await getDefaultUser();
  if (user) {
    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      name: user.name,
    });
  } else {
    console.log('❌ User not found');
    return;
  }

  // Test 2: Get all projects (should be empty)
  console.log('\n2️⃣  Fetching projects...');
  const projects = await getProjects();
  console.log(`✅ Found ${projects.length} projects`);

  // Test 3: Create a test project
  console.log('\n3️⃣  Creating test project...');
  const testProject = await createProject({
    name: 'Test Project',
    description: 'Created by database test script',
    custom_instructions: null,
  });
  if (testProject) {
    console.log('✅ Project created:', {
      id: testProject.id,
      name: testProject.name,
    });
  } else {
    console.log('❌ Failed to create project');
    return;
  }

  // Test 4: Get all chats (should be empty)
  console.log('\n4️⃣  Fetching chats...');
  const chats = await getChats();
  console.log(`✅ Found ${chats.length} chats`);

  // Test 5: Create a test chat
  console.log('\n5️⃣  Creating test chat...');
  const testChat = await createChat({
    title: 'Test Chat',
    model: 'openai/gpt-4o',
    project_id: testProject.id,
    web_search_enabled: false,
  });
  if (testChat) {
    console.log('✅ Chat created:', {
      id: testChat.id,
      title: testChat.title,
      project_id: testChat.project_id,
    });
  } else {
    console.log('❌ Failed to create chat');
    return;
  }

  console.log('\n✨ All tests passed! Database connection working.\n');
  console.log('📊 Summary:');
  console.log(`   User ID: ${DEFAULT_USER_ID}`);
  console.log(`   Projects: ${projects.length} → ${projects.length + 1} (created 1)`);
  console.log(`   Chats: ${chats.length} → ${chats.length + 1} (created 1)`);
  console.log('\n💡 You can now delete the test data from Supabase dashboard if needed.');
}

testConnection().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
