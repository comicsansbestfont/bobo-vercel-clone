import { apiLogger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_USER_ID } from '@/lib/db/client';
import { createMemory, getUserMemories } from '@/lib/db/queries';
import { generateContentHash } from '@/lib/memory/deduplicator';
import { createMemorySchema } from '@/lib/schemas/memory';
import { generateEmbedding } from '@/lib/ai/embedding';
import { ZodError } from 'zod';

export async function GET() {
  try {
    const memories = await getUserMemories({ relevance_threshold: 0 }); // Get all
    return NextResponse.json(memories);
  } catch (error) {
    apiLogger.error('GET /api/memory/entries error:', error);
    return NextResponse.json({ error: 'Failed to fetch memories' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input with Zod
    const validated = createMemorySchema.parse(body);

    // Generate embedding for semantic search
    const embedding = await generateEmbedding(validated.content);

    const memory = await createMemory({
      ...validated,
      user_id: DEFAULT_USER_ID,
      content_hash: generateContentHash(validated.content),
      embedding,
    });

    if (!memory) {
      return NextResponse.json(
        { error: 'Failed to create memory' },
        { status: 500 }
      );
    }

    return NextResponse.json(memory, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          }))
        },
        { status: 400 }
      );
    }

    apiLogger.error('POST /api/memory/entries error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
