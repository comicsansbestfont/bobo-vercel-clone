/**
 * Chat API Route
 *
 * Thin orchestrator that delegates to specialized modules.
 * M40-02: Refactored from 1608 lines to ~150 lines
 *
 * Architecture:
 * - Request parsing & validation → request-parser.ts
 * - Session management → chat-session.ts
 * - Context building → context-builder.ts
 * - Search coordination → search-coordinator.ts
 * - Model handlers → handlers/
 * - Message persistence → persistence/
 */

import type { UIMessage } from 'ai';
import { chatLogger } from '@/lib/logger';

// Import from modular chat system
import {
  parseRequest,
  validateRequest,
  normalizeMessages,
  extractUserText,
  ensureChatSession,
  buildChatContext,
  getHandler,
} from '@/lib/ai/chat';

// Chat API requires Node.js runtime for Claude SDK
export const runtime = 'nodejs';

// Allow streaming responses up to 300 seconds (Vercel Pro limit)
// Extended thinking models like Claude can take 60+ seconds just for reasoning
export const maxDuration = 300;

// Disable the SDK warning about non-OpenAI reasoning
if (typeof globalThis !== 'undefined') {
  const globalWithWarnings = globalThis as { AI_SDK_LOG_WARNINGS?: boolean };
  globalWithWarnings.AI_SDK_LOG_WARNINGS = false;
}

/**
 * POST /api/chat
 *
 * Main chat endpoint that handles all AI model interactions.
 *
 * Handler selection priority:
 * 1. OpenAI models (openai/*) → OpenAIHandler
 * 2. Claude models (anthropic/*) without webSearch → ClaudeHandler
 * 3. Everything else → VercelHandler (fallback)
 */
export async function POST(req: Request) {
  try {
    // =========================================================================
    // 1. Parse & Validate Request
    // =========================================================================
    const rawBody = await req.json();
    const request = parseRequest(rawBody);

    const validationError = validateRequest(request);
    if (validationError) {
      return new Response(
        JSON.stringify({ error: validationError }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if API key is configured
    if (!process.env.AI_GATEWAY_API_KEY) {
      return new Response(
        JSON.stringify({
          error: 'AI_GATEWAY_API_KEY is not configured. Please add it to your .env.local file.',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    chatLogger.debug('Chat Request:', {
      model: request.model,
      chatId: request.chatId,
      projectId: request.projectId,
      msgCount: request.messages?.length,
    });

    // =========================================================================
    // 2. Ensure Chat Session
    // =========================================================================
    const sessionResult = await ensureChatSession({
      chatId: request.chatId,
      projectId: request.projectId,
      model: request.model,
      webSearch: request.webSearch,
    });

    if (!sessionResult.success) {
      return new Response(
        JSON.stringify({ error: sessionResult.error }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const activeChatId = sessionResult.chatId!;

    // =========================================================================
    // 3. Normalize Messages
    // =========================================================================
    const normalizedMessages = normalizeMessages(request.messages);

    if (normalizedMessages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No messages provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Extract user text for embeddings and content detection
    const userText = extractUserText(normalizedMessages);

    // =========================================================================
    // 4. Build Context (Parallelized)
    // =========================================================================
    const context = await buildChatContext({
      chatId: activeChatId,
      projectId: request.projectId,
      userText,
      model: request.model,
    });

    // =========================================================================
    // 5. Get Handler & Execute
    // =========================================================================
    const handler = getHandler(request.model, request.webSearch);

    chatLogger.info('[Chat] Routing to handler:', {
      handler: handler.constructor.name,
      model: request.model,
      webSearch: request.webSearch,
    });

    return handler.handle(request, context, normalizedMessages);
  } catch (error) {
    chatLogger.error('Chat API error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'An error occurred',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
