/**
 * M3.5-4: Async Memory Extraction Endpoint
 *
 * Background extraction endpoint that doesn't block chat responses.
 * This endpoint accepts a chat ID and extracts memories asynchronously.
 */

import { NextRequest } from 'next/server';
import { extractMemoriesFromChat } from '@/lib/memory/extractor';
import { memoryLogger } from '@/lib/logger';

export const runtime = 'edge';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { chatId } = await req.json();

    if (!chatId) {
      return Response.json(
        { success: false, error: 'Missing required field: chatId' },
        { status: 400 }
      );
    }

    memoryLogger.info(`[AsyncExtract] Starting extraction for chat ${chatId}`);

    const memories = await extractMemoriesFromChat(chatId);
    const extractedCount = memories.length;

    memoryLogger.info(`[AsyncExtract] Extracted ${extractedCount} memories for chat ${chatId}`);

    return Response.json({
      success: true,
      extractedCount,
      chatId
    });
  } catch (error) {
    memoryLogger.error('[AsyncExtract] Extraction failed:', error);

    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
