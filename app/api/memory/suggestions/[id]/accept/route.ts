import { apiLogger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { supabase, DEFAULT_USER_ID } from '@/lib/db/client';
import { generateContentHash } from '@/lib/memory/deduplicator';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    // 1. Get suggestion
    const { data: suggestion, error: fetchError } = await supabase
      .from('memory_suggestions')
      .select('*')
      .eq('id', id)
      .eq('user_id', DEFAULT_USER_ID)
      .single();

    if (fetchError || !suggestion) {
      return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 });
    }

    // 2. Create memory from suggestion
    const { data: memory, error: createError } = await supabase
      .from('memory_entries')
      .insert({
        user_id: DEFAULT_USER_ID,
        category: suggestion.category,
        subcategory: suggestion.subcategory,
        content: suggestion.content,
        summary: suggestion.summary,
        confidence: suggestion.confidence,
        source_type: 'suggested',
        source_chat_ids: suggestion.source_chat_id ? [suggestion.source_chat_id] : [],
        source_project_ids: [],
        source_message_count: 1,
        time_period: suggestion.time_period,
        relevance_score: 1.0,
        content_hash: generateContentHash(suggestion.content),
      })
      .select()
      .single();

    if (createError) throw createError;

    // 3. Delete suggestion
    await supabase
      .from('memory_suggestions')
      .delete()
      .eq('id', id);

    return NextResponse.json(memory);
  } catch (error) {
    apiLogger.error('POST /api/memory/suggestions/[id]/accept error:', error);
    return NextResponse.json({ error: 'Failed to accept suggestion' }, { status: 500 });
  }
}
