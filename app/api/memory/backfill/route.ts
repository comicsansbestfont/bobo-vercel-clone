/**
 * Memory Embedding Backfill API Route
 *
 * Generates embeddings for memory entries that are missing them.
 * This runs within the Next.js server context where OIDC tokens are available.
 *
 * POST /api/memory/backfill
 */

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/client';
import { generateEmbedding } from '@/lib/ai/embedding';

interface MemoryEntry {
  id: string;
  content: string;
}

export async function POST() {
  console.log('Starting memory embedding backfill...');

  try {
    // Find all memory entries without embeddings
    const { data: memories, error } = await supabase
      .from('memory_entries')
      .select('id, content')
      .is('embedding', null)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching memory entries:', error);
      return NextResponse.json(
        { error: 'Failed to fetch memory entries', details: error.message },
        { status: 500 }
      );
    }

    if (!memories || memories.length === 0) {
      return NextResponse.json({
        message: 'No memory entries found with missing embeddings',
        processed: 0,
        success: 0,
        errors: 0,
      });
    }

    console.log(`Found ${memories.length} memory entries with missing embeddings.`);

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: updateError } = await (supabase.from('memory_entries') as any)
          .update({ embedding })
          .eq('id', memory.id);

        if (updateError) {
          console.error(`Error updating memory ${memory.id}:`, updateError);
          errors.push(`${memory.id}: ${updateError.message}`);
          errorCount++;
        } else {
          console.log(`Successfully updated memory ${memory.id}`);
          successCount++;
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (err) {
        console.error(`Error processing memory ${memory.id}:`, err);
        errors.push(`${memory.id}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        errorCount++;
      }
    }

    // Verify final state
    const { count: remainingNulls } = await supabase
      .from('memory_entries')
      .select('*', { count: 'exact', head: true })
      .is('embedding', null)
      .eq('is_active', true);

    return NextResponse.json({
      message: 'Backfill complete',
      processed: memories.length,
      success: successCount,
      errors: errorCount,
      remainingWithoutEmbeddings: remainingNulls || 0,
      errorDetails: errors.length > 0 ? errors.slice(0, 10) : undefined,
    });
  } catch (error) {
    console.error('Backfill failed:', error);
    return NextResponse.json(
      { error: 'Backfill failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
