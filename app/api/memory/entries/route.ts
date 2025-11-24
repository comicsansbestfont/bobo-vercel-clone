import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_USER_ID } from '@/lib/db/client';
import { createMemory, getUserMemories } from '@/lib/db/queries';

export async function GET() {
  try {
    const memories = await getUserMemories({ relevance_threshold: 0 }); // Get all
    return NextResponse.json(memories);
  } catch (error) {
    console.error('GET /api/memory/entries error:', error);
    return NextResponse.json({ error: 'Failed to fetch memories' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const memory = await createMemory({
      ...data,
      user_id: DEFAULT_USER_ID,
    });
    return NextResponse.json(memory);
  } catch (error) {
    console.error('POST /api/memory/entries error:', error);
    return NextResponse.json({ error: 'Failed to create memory' }, { status: 500 });
  }
}
