import { apiLogger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { supabase, DEFAULT_USER_ID } from '@/lib/db/client';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { error } = await supabase
      .from('memory_suggestions')
      .delete()
      .eq('id', id)
      .eq('user_id', DEFAULT_USER_ID);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    apiLogger.error('DELETE /api/memory/suggestions/[id] error:', error);
    return NextResponse.json({ error: 'Failed to dismiss suggestion' }, { status: 500 });
  }
}
