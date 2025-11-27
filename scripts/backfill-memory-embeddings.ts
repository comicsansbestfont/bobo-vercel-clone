/**
 * Backfill Missing Memory Embeddings
 *
 * This script finds memory entries that are missing embeddings and generates them.
 * Run with: npx tsx scripts/backfill-memory-embeddings.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { supabase } from '../lib/db/client';
import { generateEmbedding } from '../lib/ai/embedding';

interface MemoryEntry {
  id: string;
  content: string;
}

async function backfillMemoryEmbeddings() {
  console.log('Starting memory embedding backfill...');

  // Find all memory entries without embeddings
  const { data: memories, error } = await supabase
    .from('memory_entries')
    .select('id, content')
    .is('embedding', null)
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching memory entries:', error);
    return;
  }

  if (!memories || memories.length === 0) {
    console.log('No memory entries found with missing embeddings.');
    return;
  }

  console.log(`Found ${memories.length} memory entries with missing embeddings.`);

  let successCount = 0;
  let errorCount = 0;

  for (const memory of memories as MemoryEntry[]) {
    try {
      if (!memory.content || memory.content.trim().length === 0) {
        console.log(`Skipping memory ${memory.id} - no content`);
        continue;
      }

      console.log(`Processing memory ${memory.id}...`);

      // Generate embedding
      const embedding = await generateEmbedding(memory.content);

      // Update memory with embedding
      const { error: updateError } = await supabase
        .from('memory_entries')
        .update({ embedding })
        .eq('id', memory.id);

      if (updateError) {
        console.error(`Error updating memory ${memory.id}:`, updateError);
        errorCount++;
      } else {
        console.log(`✅ Successfully updated memory ${memory.id}`);
        successCount++;
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (err) {
      console.error(`Error processing memory ${memory.id}:`, err);
      errorCount++;
    }
  }

  console.log('\n=== Backfill Complete ===');
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📊 Total processed: ${successCount + errorCount}`);

  // Verify final state
  const { data: remainingNulls } = await supabase
    .from('memory_entries')
    .select('id', { count: 'exact', head: true })
    .is('embedding', null)
    .eq('is_active', true);

  console.log(`\n🔍 Remaining entries without embeddings: ${remainingNulls?.length || 0}`);
}

// Run the backfill
backfillMemoryEmbeddings().catch(console.error);
