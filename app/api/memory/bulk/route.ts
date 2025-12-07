/**
 * M3.6-02: Bulk Memory Seeding API
 *
 * POST /api/memory/bulk
 *
 * Efficiently creates multiple memories in a single request with:
 * - Sequential processing to respect embedding API rate limits
 * - Deduplication via semantic similarity (0.85 threshold default)
 * - Backdating support for historical context seeding
 * - Category-based importance defaults
 */

import { apiLogger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createMemory } from '@/lib/db/queries';
import { generateContentHash } from '@/lib/memory/deduplicator';
import { generateEmbedding } from '@/lib/ai/embedding';
import { supabase, DEFAULT_USER_ID } from '@/lib/db/client';
import { z } from 'zod';

// ============================================================================
// Request Schema
// ============================================================================

const MEMORY_CATEGORIES = [
  'work_context',
  'personal_context',
  'top_of_mind',
  'brief_history',
  'long_term_background',
  'other_instructions',
] as const;

const memoryItemSchema = z.object({
  category: z.enum(MEMORY_CATEGORIES),
  content: z.string().min(10).max(500),
  confidence: z.number().min(0.5).max(1.0).default(0.8),
  importance: z.number().min(0).max(1).optional(),
  source_type: z.enum(['manual', 'agent_tool', 'extracted']).default('manual'),
  // Backdating support
  created_at: z.string().datetime().optional(),
  last_accessed: z.string().datetime().optional(),
});

const bulkCreateSchema = z.object({
  memories: z.array(memoryItemSchema).min(1).max(100),
  // Options
  skip_duplicates: z.boolean().default(true),
  similarity_threshold: z.number().min(0.7).max(0.95).default(0.85),
});

type BulkMemoryInput = z.infer<typeof memoryItemSchema>;

// ============================================================================
// Response Types
// ============================================================================

interface BulkCreateResponse {
  success: boolean;
  summary: {
    total: number;
    created: number;
    skipped: number;
    errors: number;
  };
  created: Array<{ id: string; content: string }>;
  skipped: Array<{ content: string; reason: string; existing_id?: string }>;
  errors: Array<{ content: string; error: string }>;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get default importance based on category
 */
function getDefaultImportance(category: string): number {
  switch (category) {
    case 'top_of_mind':
      return 0.9;
    case 'other_instructions':
      return 0.85;
    case 'long_term_background':
      return 0.75;
    case 'brief_history':
      return 0.7;
    default:
      return 0.5;
  }
}

/**
 * Check for similar existing memory using embedding
 */
async function findSimilarMemory(
  embedding: number[],
  threshold: number
): Promise<{ id: string; content: string; similarity: number } | null> {
  const { data, error } = await supabase.rpc('find_memories_by_embedding', {
    query_embedding: embedding,
    similarity_threshold: threshold,
    p_user_id: DEFAULT_USER_ID,
    match_count: 1,
  });

  if (error) {
    apiLogger.error('find_memories_by_embedding error:', error);
    return null;
  }

  if (data && data.length > 0) {
    return {
      id: data[0].id,
      content: data[0].content,
      similarity: data[0].similarity,
    };
  }

  return null;
}

/**
 * Sleep utility for rate limiting
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ============================================================================
// API Handler
// ============================================================================

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await req.json();

    // Validate request
    const validated = bulkCreateSchema.parse(body);
    const { memories, skip_duplicates, similarity_threshold } = validated;

    apiLogger.info(`[bulk] Starting bulk creation of ${memories.length} memories`, {
      skip_duplicates,
      similarity_threshold,
    });

    // Results tracking
    const results: BulkCreateResponse = {
      success: true,
      summary: {
        total: memories.length,
        created: 0,
        skipped: 0,
        errors: 0,
      },
      created: [],
      skipped: [],
      errors: [],
    };

    // Process each memory sequentially (to respect rate limits)
    for (let i = 0; i < memories.length; i++) {
      const memoryInput = memories[i];
      const contentPreview = memoryInput.content.substring(0, 50) + (memoryInput.content.length > 50 ? '...' : '');

      try {
        // Generate embedding
        const embedding = await generateEmbedding(memoryInput.content);

        // Check for duplicates if enabled
        if (skip_duplicates) {
          const similar = await findSimilarMemory(embedding, similarity_threshold);
          if (similar) {
            results.skipped.push({
              content: contentPreview,
              reason: `Similar memory exists (${(similar.similarity * 100).toFixed(1)}% match)`,
              existing_id: similar.id,
            });
            results.summary.skipped++;
            apiLogger.debug(`[bulk] Skipped duplicate: "${contentPreview}"`);

            // Rate limiting delay
            if (i < memories.length - 1) await sleep(50);
            continue;
          }
        }

        // Calculate importance (use provided or default based on category)
        const importance = memoryInput.importance ?? getDefaultImportance(memoryInput.category);

        // Create the memory
        const memory = await createMemory({
          category: memoryInput.category,
          content: memoryInput.content,
          confidence: memoryInput.confidence,
          source_type: memoryInput.source_type,
          subcategory: null,
          summary: null,
          source_chat_ids: [],
          source_project_ids: [],
          source_message_count: 1,
          time_period: 'current',
          relevance_score: 1.0,
          content_hash: generateContentHash(memoryInput.content),
          embedding,
          // M3.6-02: New fields
          importance,
          // Backdating support
          ...(memoryInput.created_at && { created_at: memoryInput.created_at }),
          ...(memoryInput.last_accessed && { last_accessed: memoryInput.last_accessed }),
        });

        if (memory) {
          results.created.push({
            id: memory.id,
            content: contentPreview,
          });
          results.summary.created++;
          apiLogger.debug(`[bulk] Created: "${contentPreview}" (${memory.id})`);
        } else {
          throw new Error('createMemory returned null');
        }

        // Rate limiting delay between embeddings (50ms)
        if (i < memories.length - 1) await sleep(50);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push({
          content: contentPreview,
          error: errorMessage,
        });
        results.summary.errors++;
        apiLogger.error(`[bulk] Error processing memory: "${contentPreview}"`, error);

        // Continue processing remaining memories
        if (i < memories.length - 1) await sleep(50);
      }
    }

    // Set success flag based on errors
    results.success = results.summary.errors === 0;

    const duration = Date.now() - startTime;
    apiLogger.info(`[bulk] Completed in ${duration}ms`, results.summary);

    return NextResponse.json(results, {
      status: results.success ? 201 : 207 // 207 Multi-Status if partial success
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    apiLogger.error('[bulk] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
