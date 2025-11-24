import { NextResponse } from 'next/server';
import { supabase, DEFAULT_USER_ID } from '@/lib/db/client';

export async function DELETE() {
  try {
    const { data, error } = await supabase
      .from('memory_entries')
      .delete()
      .eq('user_id', DEFAULT_USER_ID)
      .eq('source_type', 'extracted') // Only delete extracted, not manual
      .select();

    if (error) throw error;

    return NextResponse.json({
      deleted: data.length,
      message: `Deleted ${data.length} extracted memories`,
    });
  } catch (error) {
    console.error('DELETE /api/memory/clear-all error:', error);
    return NextResponse.json({ error: 'Failed to clear memories' }, { status: 500 });
  }
}
