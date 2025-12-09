/**
 * Vercel AI SDK Handler
 *
 * Fallback handler for non-OpenAI/non-Claude models and web search.
 * M40-02: Extracted from route.ts lines 1467-1595
 */

import { streamText, convertToModelMessages, type UIMessage } from 'ai';
import type { MessagePart } from '@/lib/db';
import { getModel } from '@/lib/ai/models';
import { chatLogger } from '@/lib/logger';
import { persistChatMessages, getTokenCount } from '../persistence/persistence-service';
import type { ChatHandler, ChatRequest, ChatContext } from '../types';

// ============================================================================
// HANDLER
// ============================================================================

export class VercelHandler implements ChatHandler {
  /**
   * This is the fallback handler - it handles everything that
   * OpenAI and Claude handlers don't.
   */
  canHandle(_model: string, _webSearch: boolean): boolean {
    return true;
  }

  async handle(
    request: ChatRequest,
    context: ChatContext,
    normalizedMessages: UIMessage[]
  ): Promise<Response> {
    const { model, webSearch } = request;
    const { activeChatId, systemPrompt, projectContext, projectName, searchResults, projectChatResults, activeProjectId } = context;

    chatLogger.info('[Vercel SDK] Using Vercel AI SDK for model:', webSearch ? 'perplexity/sonar (web search)' : model);

    // Convert messages for SDK
    const modelMessages = convertToModelMessages(normalizedMessages);

    // Use Perplexity for web search, otherwise the specified model
    const result = streamText({
      model: getModel(webSearch ? 'perplexity/sonar' : model),
      messages: modelMessages,
      system: systemPrompt,

      // Save messages after streaming completes
      onFinish: async ({ text, usage }) => {
        try {
          const lastUserMessage = normalizedMessages[normalizedMessages.length - 1];
          if (!lastUserMessage || lastUserMessage.role !== 'user') return;

          await persistChatMessages({
            chatId: activeChatId,
            userMessage: lastUserMessage,
            assistantText: text,
            assistantParts: [{ type: 'text', text }],
            projectContext,
            projectName,
            searchResults,
            projectChatResults,
            activeProjectId,
            tokenCount: usage?.totalTokens,
          });
        } catch (error) {
          chatLogger.error('Failed to save messages:', error);
          // Don't fail the request - streaming already succeeded
        }
      },
    });

    // Return UIMessage stream response
    return result.toUIMessageStreamResponse({
      headers: {
        'X-Chat-Id': activeChatId,
      },
      sendReasoning: true,
      sendSources: true,
    });
  }
}
