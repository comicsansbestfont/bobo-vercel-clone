/**
 * Persistence Service
 *
 * Unified message persistence logic for all chat handlers.
 * M40-02: Consolidates ~300 lines of duplicated code from route.ts
 *
 * Previously duplicated in:
 * - OpenAI path: lines 876-993
 * - Claude path: lines 1343-1450
 * - Vercel SDK path: lines 1476-1582
 */

import { encode } from 'gpt-tokenizer';
import {
  createMessage,
  updateChat,
  finalizeMessage,
  type MessagePart,
} from '@/lib/db';
import { embedAndSaveMessage } from '@/lib/ai/embedding';
import { chatLogger } from '@/lib/logger';
import { buildCitations, applyCitations } from './source-citation';
import { updateChatTitleFromMessage } from '../chat-session';
import type { PersistenceContext } from '../types';

// ============================================================================
// TOKEN COUNTING
// ============================================================================

/**
 * Count tokens for message parts.
 * Uses gpt-tokenizer with fallback to character estimation.
 */
export function getTokenCount(parts: MessagePart[]): number {
  if (!parts || !Array.isArray(parts)) return 0;

  const text = parts
    .map((part) => {
      if (part.type === 'text' && part.text) return part.text;
      if (part.type === 'reasoning' && part.text) return `[Reasoning]\n${part.text}`;
      if (part.type === 'source-url' && part.url) return `[Source] ${part.url}`;
      if (part.type === 'tool-result' && part.result) return `[Tool Result]\n${part.result}`;
      return '';
    })
    .filter(Boolean)
    .join('\n')
    .trim();

  try {
    return encode(text).length;
  } catch {
    // Fallback: estimate 1 token per 4 characters
    return Math.ceil(text.length / 4);
  }
}

// ============================================================================
// BACKGROUND OPERATIONS
// ============================================================================

/**
 * Compress conversation if it exceeds threshold.
 * Runs asynchronously to avoid blocking.
 */
async function compressConversationIfNeeded(chatId: string): Promise<void> {
  const COMPRESSION_THRESHOLD = 20;

  try {
    const { getMessages, deleteMessage, createMessage: createMsg } = await import('@/lib/db');
    const { compressHistory, RECENT_MESSAGE_COUNT } = await import('@/lib/memory-manager');

    const allMessages = await getMessages(chatId);

    if (allMessages.length <= COMPRESSION_THRESHOLD) {
      return;
    }

    chatLogger.debug(`Compressing conversation for chat ${chatId} (${allMessages.length} messages)`);

    // Convert to UIMessage format for compression
    // Note: Type cast required due to MessagePart vs UIMessagePart differences
    const uiMessages = allMessages.map((msg) => ({
      id: msg.id,
      role: msg.role as 'user' | 'assistant' | 'system',
      parts: (msg.content as { parts?: MessagePart[] })?.parts || [],
    })) as unknown as import('ai').UIMessage[];

    const result = await compressHistory(uiMessages);

    if (!result.wasCompressed) {
      chatLogger.debug('Compression skipped - not enough messages to compress');
      return;
    }

    // Delete old messages
    const messagesToDelete = allMessages.slice(0, allMessages.length - RECENT_MESSAGE_COUNT);
    for (const msg of messagesToDelete) {
      await deleteMessage(msg.id);
    }

    // Insert summary message
    const summaryMessage = result.compressedMessages.find((m) => m.id.startsWith('summary-'));
    if (summaryMessage) {
      const summaryParts = summaryMessage.parts as MessagePart[];
      await createMsg({
        chat_id: chatId,
        role: 'system',
        content: { parts: summaryParts },
        token_count: getTokenCount(summaryParts),
        sequence_number: 0,
      });
    }

    chatLogger.info(`Compressed ${messagesToDelete.length} messages for chat ${chatId}`);
  } catch (error) {
    chatLogger.error('Background compression failed:', error);
  }
}

/**
 * Trigger background memory extraction.
 * Fire-and-forget async operation.
 */
function triggerMemoryExtraction(chatId: string): void {
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const host = process.env.VERCEL_URL || 'localhost:3000';
  const url = `${protocol}://${host}/api/memory/extract-background`;

  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chatId }),
  }).catch((err) => chatLogger.error('[Chat] Background extraction failed:', err));
}

// ============================================================================
// MAIN PERSISTENCE FUNCTION
// ============================================================================

/**
 * Persist chat messages (user and assistant) with all associated operations.
 *
 * This unified function replaces the duplicated persistence logic from
 * all three model handlers.
 */
export async function persistChatMessages(
  context: PersistenceContext
): Promise<void> {
  const {
    chatId,
    userMessage,
    assistantText,
    assistantParts: initialParts,
    projectContext,
    projectName,
    searchResults,
    projectChatResults,
    activeProjectId,
    tokenCount,
    messageId,
    useFinalizeMessage,
  } = context;

  try {
    // =========================================================================
    // 1. Save user message
    // =========================================================================
    if (userMessage && userMessage.role === 'user') {
      const userMessageParts = (userMessage.parts || []) as MessagePart[];

      const userMsg = await createMessage({
        chat_id: chatId,
        role: 'user',
        content: { parts: userMessageParts },
        token_count: getTokenCount(userMessageParts),
      });

      // Generate embedding for user message (background)
      if (userMsg) {
        const userText = userMessageParts
          .filter((p): p is MessagePart & { text: string } => p.type === 'text' && 'text' in p)
          .map((p) => p.text)
          .join(' ');

        if (userText) {
          embedAndSaveMessage(userMsg.id, userText).catch((err) =>
            chatLogger.error('Failed to embed user message:', err)
          );
        }
      }

      // Update chat title from first user message
      const firstTextPart = userMessageParts.find((p) => p.type === 'text') as
        | (MessagePart & { text: string })
        | undefined;
      if (firstTextPart?.text) {
        await updateChatTitleFromMessage(chatId, firstTextPart.text);
      }
    }

    // =========================================================================
    // 2. Track sources and insert inline citations
    // =========================================================================
    let assistantParts = [...initialParts];

    if (assistantText && assistantParts.length > 0) {
      const citationResult = await buildCitations({
        assistantText,
        projectContext,
        projectName,
        projectChatResults,
        searchResults,
        activeProjectId,
      });

      if (citationResult.citations.length > 0) {
        assistantParts = applyCitations(assistantParts, citationResult);
      }
    }

    // =========================================================================
    // 3. Save assistant message
    // =========================================================================
    if (assistantParts.length > 0) {
      const assistantTokenCount = tokenCount || getTokenCount(assistantParts);

      let assistantMsg;

      if (useFinalizeMessage && messageId) {
        // Use finalizeMessage for progressive saves (Claude SDK)
        assistantMsg = await finalizeMessage(messageId, { parts: assistantParts }, assistantTokenCount);

        if (!assistantMsg) {
          // Fallback: If finalizeMessage fails (no partial message exists), create new
          chatLogger.warn('finalizeMessage returned null, falling back to createMessage');
          assistantMsg = await createMessage({
            chat_id: chatId,
            role: 'assistant',
            content: { parts: assistantParts },
            token_count: assistantTokenCount,
          });
        }
      } else {
        // Standard createMessage for OpenAI and Vercel SDK paths
        assistantMsg = await createMessage({
          chat_id: chatId,
          role: 'assistant',
          content: { parts: assistantParts },
          token_count: assistantTokenCount,
        });
      }

      // Generate embedding for assistant message (background)
      if (assistantMsg) {
        embedAndSaveMessage(assistantMsg.id, assistantText).catch((err) =>
          chatLogger.error('Failed to embed assistant message:', err)
        );
      }
    }

    // =========================================================================
    // 4. Update chat metadata
    // =========================================================================
    await updateChat(chatId, {
      last_message_at: new Date().toISOString(),
    });

    // =========================================================================
    // 5. Trigger background operations (fire-and-forget)
    // =========================================================================
    compressConversationIfNeeded(chatId).catch((err) =>
      chatLogger.error('Background compression error:', err)
    );

    triggerMemoryExtraction(chatId);

    chatLogger.info(`[Persistence] Messages persisted for chat ${chatId}`);
  } catch (error) {
    chatLogger.error('[Persistence] Failed to persist messages:', error);
    throw error; // Re-throw so caller knows persistence failed
  }
}
