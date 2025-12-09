/**
 * Check if a chat exists in the database and retrieve its data
 * Usage: npx tsx scripts/check-chat.ts <chatId>
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const chatId = process.argv[2] || '27fbf84f-ad20-47b4-a16f-accfad31267c';

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log(`\nLooking for chat: ${chatId}\n`);

  // Check if chat exists
  const { data: chat, error: chatError } = await supabase
    .from('chats')
    .select('*')
    .eq('id', chatId)
    .single();

  if (chatError) {
    console.log('Chat lookup result:', chatError.message);

    // If not found, list recent chats to help user find the right one
    console.log('\n--- Recent chats in database ---');
    const { data: recentChats } = await supabase
      .from('chats')
      .select('id, title, created_at, updated_at')
      .order('updated_at', { ascending: false })
      .limit(10);

    if (recentChats && recentChats.length > 0) {
      recentChats.forEach((c, i) => {
        console.log(`${i + 1}. ${c.id} - "${c.title}" (updated: ${c.updated_at})`);
      });
    } else {
      console.log('No chats found in database');
    }
    return;
  }

  console.log('✅ Chat found:');
  console.log(JSON.stringify(chat, null, 2));

  // Get messages for this chat
  const { data: messages, error: msgError } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('sequence_number', { ascending: true });

  if (msgError) {
    console.log('\nMessages error:', msgError.message);
  } else {
    console.log(`\n✅ Found ${messages?.length || 0} messages:`);
    messages?.forEach((m, i) => {
      const content = typeof m.content === 'object'
        ? JSON.stringify(m.content).substring(0, 100) + '...'
        : String(m.content).substring(0, 100) + '...';
      console.log(`  ${i + 1}. [${m.role}] ${content}`);
    });
  }
}

main().catch(console.error);
