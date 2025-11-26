import { NextRequest, NextResponse } from 'next/server';
import { supabase, DEFAULT_USER_ID } from '@/lib/db/client';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('memory_settings')
      .select('*')
      .eq('user_id', DEFAULT_USER_ID)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows

    // Return default settings if none exist
    const defaultSettings = {
      user_id: DEFAULT_USER_ID,
      auto_extraction_enabled: true, // Default: ON for personal tool
      extraction_frequency: 'realtime',
      enabled_categories: [
        'work_context',
        'personal_context',
        'top_of_mind',
        'brief_history',
        'long_term_background',
        'other_instructions'
      ],
      token_budget: 500,
    };

    return NextResponse.json(data || defaultSettings);
  } catch (error) {
    console.error('GET /api/memory/settings error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const updates = await req.json();

    const { data, error } = await supabase
      .from('memory_settings')
      .upsert({
        user_id: DEFAULT_USER_ID,
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error('PATCH /api/memory/settings error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
