import { apiLogger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { supabase, DEFAULT_USER_ID } from '@/lib/db/client';
import { updateMemorySchema } from '@/lib/schemas/memory';
import { ZodError } from 'zod';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Memory ID required' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const validated = updateMemorySchema.parse(body);

    const { data, error } = await supabase
      .from('memory_entries')
      .update(validated)
      .eq('id', id)
      .eq('user_id', DEFAULT_USER_ID)
      .select()
      .single();

    if (error) {
      // Check if it's a not found error
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Memory not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Memory not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
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

    apiLogger.error('PATCH /api/memory/entries/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Memory ID required' },
        { status: 400 }
      );
    }

    // First check if the memory exists
    const { data: existing } = await supabase
      .from('memory_entries')
      .select('id')
      .eq('id', id)
      .eq('user_id', DEFAULT_USER_ID)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: 'Memory not found' },
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from('memory_entries')
      .delete()
      .eq('id', id)
      .eq('user_id', DEFAULT_USER_ID);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    apiLogger.error('DELETE /api/memory/entries/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
