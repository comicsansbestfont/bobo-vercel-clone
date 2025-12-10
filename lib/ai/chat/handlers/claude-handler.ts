/**
 * Claude SDK Handler
 *
 * Handles chat requests for Claude models with native tool use support.
 * Includes timeout tracking, progressive saving, and agentic tool loop.
 * M40-02: Extracted from route.ts lines 1008-1465
 * M3.14: Added extended thinking support with thinking_delta handling
 */

import { waitUntil } from '@vercel/functions';
import type { UIMessage } from 'ai';
import type { MessageParam, ContentBlock, ToolUseBlock, TextBlock } from '@anthropic-ai/sdk/resources/messages';
import type { MessagePart } from '@/lib/db';
import {
  getClaudeClient,
  getClaudeModelId,
  supportsExtendedThinking,
  getDefaultThinkingBudget,
  validateThinkingBudget,
} from '@/lib/ai/claude-client';
import { convertToClaudeMessages } from '@/lib/ai/claude-message-converter';
import { advisoryTools, executeAdvisoryTool } from '@/lib/ai/claude-advisory-tools';
import { createContinuation, upsertPartialMessage } from '@/lib/db';
import { chatLogger } from '@/lib/logger';
import { persistChatMessages } from '../persistence/persistence-service';
import type { ChatHandler, ChatRequest, ChatContext, HandlerStreamResult, ThinkingBlock } from '../types';
import {
  FUNCTION_TIMEOUT_MS,
  SHUTDOWN_BUFFER_MS,
  PROGRESSIVE_SAVE_INTERVAL_MS,
  PROGRESSIVE_SAVE_THRESHOLD,
  MAX_TOOL_ITERATIONS,
} from '../types';

// ============================================================================
// TIMEOUT TRACKER
// ============================================================================

class TimeoutTracker {
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  getElapsedMs(): number {
    return Date.now() - this.startTime;
  }

  getRemainingMs(): number {
    return FUNCTION_TIMEOUT_MS - this.getElapsedMs();
  }

  shouldShutdown(): boolean {
    return this.getRemainingMs() < SHUTDOWN_BUFFER_MS;
  }
}

// ============================================================================
// HANDLER
// ============================================================================

export class ClaudeHandler implements ChatHandler {
  canHandle(model: string, webSearch: boolean): boolean {
    return (model?.startsWith('anthropic/') ?? false) && !webSearch;
  }

  async handle(
    request: ChatRequest,
    context: ChatContext,
    normalizedMessages: UIMessage[]
  ): Promise<Response> {
    const { model, thinkingEnabled: requestThinkingEnabled, thinkingBudget: requestThinkingBudget } = request;
    const { activeChatId, systemPrompt, projectContext, projectName, searchResults, projectChatResults, activeProjectId } = context;

    // M3.14: Determine thinking settings
    const modelSupportsThinking = supportsExtendedThinking(model);
    const thinkingEnabled = modelSupportsThinking && (requestThinkingEnabled !== false); // Default to enabled for supported models
    const thinkingBudget = thinkingEnabled
      ? validateThinkingBudget(model, requestThinkingBudget || getDefaultThinkingBudget(model))
      : 0;

    chatLogger.info('[Claude SDK] Using native Claude SDK for model:', model, {
      thinkingEnabled,
      thinkingBudget: thinkingEnabled ? thinkingBudget : 'N/A',
    });

    const client = getClaudeClient();
    const { messages: claudeMessages } = convertToClaudeMessages(normalizedMessages);

    // Setup timeout tracking and progressive saving
    const timeoutTracker = new TimeoutTracker();
    const assistantMessageId = crypto.randomUUID();
    let lastProgressiveSaveTime = Date.now();
    let lastProgressiveSaveLength = 0;
    let progressiveSaveInterval: ReturnType<typeof setInterval> | null = null;

    // Agentic loop state
    let currentMessages: MessageParam[] = claudeMessages;
    let allTextContent = '';
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let didTimeout = false;
    let continuationToken: string | null = null;

    // M3.14: Extended thinking state
    let allThinkingContent = '';
    let thinkingBlocks: ThinkingBlock[] = []; // For tool use preservation
    let reasoningStarted = false;

    // Create transform stream for SSE
    const transform = new TransformStream<Uint8Array, Uint8Array>();
    const writer = transform.writable.getWriter();
    const encoder = new TextEncoder();

    const writeSSE = (event: object) => {
      writer.write(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
    };

    // Progressive save helper
    const progressiveSave = async (status: 'streaming' | 'partial' | 'timeout' | 'error' = 'streaming') => {
      if (!activeChatId || allTextContent.length === 0) return;

      const contentDelta = allTextContent.length - lastProgressiveSaveLength;
      if (contentDelta < PROGRESSIVE_SAVE_THRESHOLD && status === 'streaming') return;

      try {
        await upsertPartialMessage(
          activeChatId,
          assistantMessageId,
          { parts: [{ type: 'text', text: allTextContent }] },
          status
        );
        lastProgressiveSaveLength = allTextContent.length;
        lastProgressiveSaveTime = Date.now();
        chatLogger.debug(`[Progressive Save] Saved ${allTextContent.length} chars (status: ${status})`);
      } catch (err) {
        chatLogger.error('[Progressive Save] Failed:', err);
      }
    };

    // Start streaming response
    const responsePromise = (async (): Promise<HandlerStreamResult> => {
      try {
        writeSSE({ type: 'start' });
        writeSSE({ type: 'start-step' });
        let textBlockStarted = false;

        // Set up progressive save interval
        progressiveSaveInterval = setInterval(async () => {
          const timeSinceLastSave = Date.now() - lastProgressiveSaveTime;
          if (timeSinceLastSave >= PROGRESSIVE_SAVE_INTERVAL_MS) {
            await progressiveSave('streaming');
          }
        }, PROGRESSIVE_SAVE_INTERVAL_MS);

        for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
          // Check timeout before iteration
          if (timeoutTracker.shouldShutdown()) {
            chatLogger.warn(`[Claude SDK] Approaching timeout at iteration ${iteration}, initiating graceful shutdown`);
            didTimeout = true;
            await progressiveSave('timeout');

            const continuation = await createContinuation(
              activeChatId!,
              allTextContent,
              [{ type: 'text', text: allTextContent }],
              { iteration, messages_snapshot: currentMessages }
            );

            if (continuation) {
              continuationToken = continuation.continuation_token;
              writeSSE({ type: 'timeout-warning', message: 'Response truncated due to timeout.', remaining: timeoutTracker.getRemainingMs() });
              writeSSE({ type: 'continuation-available', token: continuationToken, messageId: assistantMessageId });
            }
            break;
          }

          chatLogger.debug(`[Claude SDK] Iteration ${iteration + 1}/${MAX_TOOL_ITERATIONS} (elapsed: ${timeoutTracker.getElapsedMs()}ms)`);

          // Call Claude API
          // M3.14: Include thinking parameter when enabled
          const maxTokens = thinkingEnabled ? 16000 : 8192; // Higher max_tokens for thinking
          const stream = client.messages.stream({
            model: getClaudeModelId(model),
            max_tokens: maxTokens,
            system: systemPrompt,
            messages: currentMessages,
            tools: advisoryTools,
            // M3.14: Extended thinking configuration
            ...(thinkingEnabled && {
              thinking: {
                type: 'enabled' as const,
                budget_tokens: thinkingBudget,
              },
            }),
          });

          // Process stream
          let iterationText = '';
          let iterationThinking = ''; // M3.14: Per-iteration thinking content
          let currentThinkingSignature = ''; // M3.14: Signature for tool use continuation
          const toolUseBlocks: Array<{ id: string; name: string; input: Record<string, unknown> }> = [];
          let currentToolUse: { id: string; name: string; inputJson: string } | null = null;
          let stopReason: string | null = null;
          let shouldBreakStreaming = false;
          let thinkingBlockActive = false; // M3.14: Track if we're in a thinking block

          for await (const event of stream) {
            // Check timeout during streaming
            if (timeoutTracker.shouldShutdown() && !didTimeout) {
              chatLogger.warn('[Claude SDK] Timeout during streaming, breaking');
              didTimeout = true;
              shouldBreakStreaming = true;
              break;
            }

            switch (event.type) {
              case 'message_start':
                if (event.message?.usage) {
                  totalInputTokens += event.message.usage.input_tokens;
                }
                break;

              case 'content_block_start':
                if (event.content_block.type === 'text') {
                  if (!textBlockStarted) {
                    writeSSE({ type: 'text-start', id: '0' });
                    textBlockStarted = true;
                  }
                } else if (event.content_block.type === 'tool_use') {
                  const tb = event.content_block as ToolUseBlock;
                  currentToolUse = { id: tb.id, name: tb.name, inputJson: '' };
                  chatLogger.debug(`[Claude SDK] Tool call started: ${tb.name}`);
                } else if (event.content_block.type === 'thinking') {
                  // M3.14: Start thinking block
                  thinkingBlockActive = true;
                  if (!reasoningStarted) {
                    writeSSE({ type: 'reasoning-start', id: 't0' });
                    reasoningStarted = true;
                  }
                  chatLogger.debug('[Claude SDK] Thinking block started');
                }
                break;

              case 'content_block_delta':
                if (event.delta.type === 'text_delta') {
                  iterationText += event.delta.text;
                  writeSSE({ type: 'text-delta', id: '0', delta: event.delta.text });
                } else if (event.delta.type === 'input_json_delta' && currentToolUse) {
                  currentToolUse.inputJson += event.delta.partial_json;
                } else if (event.delta.type === 'thinking_delta') {
                  // M3.14: Stream thinking content
                  const thinkingText = (event.delta as { thinking?: string }).thinking || '';
                  iterationThinking += thinkingText;
                  writeSSE({ type: 'reasoning-delta', id: 't0', delta: thinkingText });
                } else if (event.delta.type === 'signature_delta') {
                  // M3.14: Capture signature for tool use continuation
                  currentThinkingSignature = (event.delta as { signature?: string }).signature || '';
                }
                break;

              case 'content_block_stop':
                if (currentToolUse) {
                  try {
                    const input = currentToolUse.inputJson ? JSON.parse(currentToolUse.inputJson) : {};
                    toolUseBlocks.push({ id: currentToolUse.id, name: currentToolUse.name, input });
                    chatLogger.debug(`[Claude SDK] Tool ready: ${currentToolUse.name}`, input);
                  } catch (e) {
                    chatLogger.error('Failed to parse tool input:', e);
                  }
                  currentToolUse = null;
                } else if (thinkingBlockActive) {
                  // M3.14: Thinking block complete - store for tool use preservation
                  thinkingBlockActive = false;
                  if (iterationThinking) {
                    thinkingBlocks.push({
                      type: 'thinking',
                      thinking: iterationThinking,
                      signature: currentThinkingSignature,
                    });
                    allThinkingContent += iterationThinking;
                    chatLogger.debug(`[Claude SDK] Thinking block complete: ${iterationThinking.length} chars`);
                  }
                }
                break;

              case 'message_delta':
                if (event.delta?.stop_reason) {
                  stopReason = event.delta.stop_reason;
                }
                if (event.usage?.output_tokens) {
                  totalOutputTokens += event.usage.output_tokens;
                }
                break;
            }
          }

          allTextContent += iterationText;

          // Handle timeout break
          if (shouldBreakStreaming || didTimeout) {
            await progressiveSave('timeout');
            if (!continuationToken) {
              const continuation = await createContinuation(
                activeChatId!,
                allTextContent,
                [{ type: 'text', text: allTextContent }],
                { iteration, messages_snapshot: currentMessages }
              );
              if (continuation) {
                continuationToken = continuation.continuation_token;
                writeSSE({ type: 'timeout-warning', message: 'Response truncated due to timeout.', remaining: timeoutTracker.getRemainingMs() });
                writeSSE({ type: 'continuation-available', token: continuationToken, messageId: assistantMessageId });
              }
            }
            break;
          }

          // If no tools were called, we're done
          if (toolUseBlocks.length === 0 || stopReason === 'end_turn') {
            chatLogger.info('[Claude SDK] No more tool calls, finishing');
            break;
          }

          // Execute tools and continue
          chatLogger.info(`[Claude SDK] Executing ${toolUseBlocks.length} tool(s)`);

          // Build assistant message with thinking + tool_use blocks
          // M3.14: CRITICAL - thinking blocks MUST be preserved for tool use continuation
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const assistantContent: any[] = [];

          // Include thinking blocks first (required by Anthropic API)
          if (thinkingEnabled && iterationThinking) {
            assistantContent.push({
              type: 'thinking',
              thinking: iterationThinking,
              signature: currentThinkingSignature,
            });
          }

          if (iterationText) {
            assistantContent.push({ type: 'text', text: iterationText } as TextBlock);
          }
          for (const tu of toolUseBlocks) {
            assistantContent.push({
              type: 'tool_use',
              id: tu.id,
              name: tu.name,
              input: tu.input,
            } as ToolUseBlock);
          }

          currentMessages.push({ role: 'assistant', content: assistantContent });

          // Check timeout before tool execution
          if (timeoutTracker.shouldShutdown()) {
            chatLogger.warn('[Claude SDK] Timeout before tool execution, skipping');
            didTimeout = true;
            break;
          }

          // Execute tools in parallel
          const toolResults = await Promise.all(
            toolUseBlocks.map(async (tu) => {
              chatLogger.debug(`[Claude SDK] Executing tool: ${tu.name}`);
              const result = await executeAdvisoryTool(tu.name, tu.input);
              const parsed = JSON.parse(result);
              chatLogger.debug(`[Claude SDK] Tool ${tu.name} result: ${parsed.success ? 'success' : 'error'}`);
              return { tool_use_id: tu.id, content: result };
            })
          );

          // Add tool results
          currentMessages.push({
            role: 'user',
            content: toolResults.map((r) => ({
              type: 'tool_result' as const,
              tool_use_id: r.tool_use_id,
              content: r.content,
            })),
          });
        }

        // Clean up interval
        if (progressiveSaveInterval) {
          clearInterval(progressiveSaveInterval);
          progressiveSaveInterval = null;
        }

        // End streaming
        // M3.14: End reasoning block if we started one
        if (reasoningStarted) {
          writeSSE({ type: 'reasoning-end', id: 't0' });
        }
        if (allTextContent) {
          writeSSE({ type: 'text-end', id: '0' });
        }
        writeSSE({ type: 'finish-step' });
        writeSSE({ type: 'finish', finishReason: didTimeout ? 'timeout' : 'stop', continuationToken: continuationToken || undefined });
        writer.write(encoder.encode('data: [DONE]\n\n'));

        return {
          text: allTextContent,
          inputTokens: totalInputTokens,
          outputTokens: totalOutputTokens,
          didTimeout,
          continuationToken,
          messageId: assistantMessageId,
          thinkingText: allThinkingContent || undefined, // M3.14: Include thinking content
        };
      } catch (error) {
        if (progressiveSaveInterval) {
          clearInterval(progressiveSaveInterval);
        }
        chatLogger.error('[Claude SDK] Stream error:', error);
        writeSSE({ type: 'error', error: error instanceof Error ? error.message : 'Unknown error' });
        if (allTextContent.length > 0 && activeChatId) {
          await progressiveSave('error');
        }
        throw error;
      } finally {
        writer.close();
      }
    })();

    // Handle persistence after streaming
    const persistencePromise = responsePromise
      .then(async ({ text, inputTokens, outputTokens, didTimeout: timedOut, messageId, thinkingText }) => {
        const lastUserMessage = normalizedMessages[normalizedMessages.length - 1];
        if (!lastUserMessage || lastUserMessage.role !== 'user') return;

        // If timeout occurred, partial message already saved
        if (timedOut) {
          chatLogger.info(`[Claude SDK] Response timed out. Partial message saved (${text.length} chars).`);
          const { updateChat } = await import('@/lib/db');
          await updateChat(activeChatId!, { last_message_at: new Date().toISOString() });
          return;
        }

        // M3.14: Build message parts including thinking blocks
        const assistantParts: MessagePart[] = [
          // Include thinking as reasoning part (viewable in conversation history)
          ...(thinkingText ? [{ type: 'reasoning' as const, text: thinkingText }] : []),
          // Main text content
          { type: 'text' as const, text },
        ];

        await persistChatMessages({
          chatId: activeChatId,
          userMessage: lastUserMessage,
          assistantText: text,
          assistantParts,
          projectContext,
          projectName,
          searchResults,
          projectChatResults,
          activeProjectId,
          tokenCount: inputTokens + outputTokens,
          messageId,
          useFinalizeMessage: true,
        });
      })
      .catch((err) => chatLogger.error('[Claude SDK] Response promise error:', err));

    // CRITICAL: Tell Vercel to wait for persistence
    waitUntil(persistencePromise);

    return new Response(transform.readable, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Chat-Id': activeChatId || '',
      },
    });
  }
}
