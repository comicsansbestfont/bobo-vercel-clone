import { apiLogger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { supabase, DEFAULT_USER_ID } from '@/lib/db/client';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('memory_suggestions')
      .select('*')
      .eq('user_id', DEFAULT_USER_ID)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    apiLogger.error('GET /api/memory/suggestions error:', error);
    return NextResponse.json({ error: 'Failed to fetch suggestions' }, { status: 500 });
  }
}
