/**
 * Backfill Missing Embeddings
 *
 * This script finds messages that are missing embeddings and generates them.
 * Run with: npx tsx scripts/backfill-embeddings.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { supabase } from '../lib/db/client';
import { generateEmbedding } from '../lib/ai/embedding';

interface MessageWithContent {
  id: string;
  content: {
    parts?: Array<{ type: string; text?: string }>;
  };
}

async function backfillEmbeddings() {
  console.log('Starting embedding backfill...');

  // Find all messages without embeddings
  const { data: messages, error } = await supabase
    .from('messages')
    .select('id, content')
    .is('embedding', null);

  if (error) {
    console.error('Error fetching messages:', error);
    return;
  }

  if (!messages || messages.length === 0) {
    console.log('No messages found with missing embeddings.');
    return;
  }

  console.log(`Found ${messages.length} messages with missing embeddings.`);

  let successCount = 0;
  let errorCount = 0;

  for (const message of messages as MessageWithContent[]) {
    try {
      // Extract text content from message parts
      const parts = message.content?.parts || [];
      const textContent = parts
        .filter((part) => part.type === 'text' && part.text)
        .map((part) => part.text)
        .join(' ')
        .trim();

      if (!textContent) {
        console.log(`Skipping message ${message.id} - no text content`);
        continue;
      }

      console.log(`Processing message ${message.id}...`);

      // Generate embedding
      const embedding = await generateEmbedding(textContent);

      // Update message with embedding
      const { error: updateError } = await supabase
        .from('messages')
        .update({ embedding })
        .eq('id', message.id);

      if (updateError) {
        console.error(`Error updating message ${message.id}:`, updateError);
        errorCount++;
      } else {
        console.log(`Successfully updated message ${message.id}`);
        successCount++;
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (err) {
      console.error(`Error processing message ${message.id}:`, err);
      errorCount++;
    }
  }

  console.log('\nBackfill complete!');
  console.log(`Success: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
}

// Run the backfill
backfillEmbeddings().catch(console.error);
