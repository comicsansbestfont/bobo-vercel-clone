import { NextRequest, NextResponse } from 'next/server';
import { extractMemoriesFromChat } from '@/lib/memory/extractor';
import { getUserMemorySettings, ensureMemorySettings, getLastExtractionTime } from '@/lib/db/queries';

export async function POST(req: NextRequest) {
  try {
    const { chat_id } = await req.json();

    if (!chat_id) {
      return NextResponse.json({ error: 'Missing chat_id' }, { status: 400 });
    }

    // 1. Ensure memory settings exist (initialize if first time)
    await ensureMemorySettings();

    // 2. Check if auto-extraction enabled
    const settings = await getUserMemorySettings();
    if (!settings?.auto_extraction_enabled) {
      return NextResponse.json({ skipped: true, reason: 'disabled' });
    }

    // 3. Check debounce (last extraction > 5 min ago)
    const lastExtractionTime = await getLastExtractionTime(chat_id);
    if (lastExtractionTime) {
        const lastExtraction = new Date(lastExtractionTime).getTime();
        if (Date.now() - lastExtraction < 5 * 60 * 1000) {
            return NextResponse.json({ skipped: true, reason: 'debounce' });
        }
    }

    // 4. Extract memories
    const memories = await extractMemoriesFromChat(chat_id);

    // 5. Return result
    return NextResponse.json({
      success: true,
      extracted: memories.length,
      memories: memories.map(m => ({ id: m.id, content: m.content })),
    });
  } catch (error) {
    console.error('Extraction API error:', error);
    return NextResponse.json(
      { error: 'Extraction failed' },
      { status: 500 }
    );
  }
}
