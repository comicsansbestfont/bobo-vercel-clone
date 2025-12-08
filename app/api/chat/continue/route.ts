/**
 * Chat Continuation API Route
 *
 * POST /api/chat/continue
 * Resumes an interrupted Claude response using a continuation token.
 *
 * This endpoint handles timeout recovery by:
 * 1. Validating the continuation token
 * 2. Retrieving saved state (accumulated text, iteration state)
 * 3. Resuming Claude streaming from where it left off
 * 4. Applying same progressive saving and timeout detection
 */

import { NextRequest } from 'next/server';
import { chatLogger } from '@/lib/logger';
import {
  getContinuation,
  markContinuationUsed,
  upsertPartialMessage,
  finalizeMessage,
  createContinuation,
  updateChat,
  getChat,
  type MessageContent,
  type MessagePart,
} from '@/lib/db';
import { getClaudeClient, getClaudeModelId } from '@/lib/ai/claude-client';
import { advisoryTools } from '@/lib/ai/claude-advisory-tools';
import type { MessageParam } from '@anthropic-ai/sdk/resources/messages';
import { generateMessageId } from '@/lib/utils';

// Match the constants from main chat route
const FUNCTION_TIMEOUT_MS = 60000;
const SHUTDOWN_BUFFER_MS = 8000;
const PROGRESSIVE_SAVE_INTERVAL_MS = 5000;
const PROGRESSIVE_SAVE_THRESHOLD = 200;

export const maxDuration = 60;

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { continuationToken, model } = body;

    if (!continuationToken) {
      return new Response(
        JSON.stringify({ error: 'Missing continuation token' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Retrieve continuation from database
    const continuation = await getContinuation(continuationToken);

    if (!continuation) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired continuation token' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if already used
    if (continuation.used_at) {
      return new Response(
        JSON.stringify({ error: 'Continuation token already used' }),
        { status: 410, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if expired
    if (new Date(continuation.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Continuation token expired' }),
        { status: 410, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify chat exists
    const chat = await getChat(continuation.chat_id);
    if (!chat) {
      return new Response(
        JSON.stringify({ error: 'Chat not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Mark continuation as used
    await markContinuationUsed(continuationToken);

    chatLogger.info(`[Continuation] Resuming response for chat ${continuation.chat_id}, token: ${continuationToken.substring(0, 8)}...`);

    // Initialize timeout tracking
    const timeoutTracker = new TimeoutTracker();
    const assistantMessageId = continuation.message_id || generateMessageId();
    let lastProgressiveSaveTime = Date.now();
    let lastProgressiveSaveLength = continuation.accumulated_text.length;
    let progressiveSaveInterval: ReturnType<typeof setInterval> | null = null;
    let didTimeout = false;
    let newContinuationToken: string | null = null;

    // Start with accumulated content from previous run
    let allTextContent = continuation.accumulated_text;
    let currentIteration = continuation.iteration_state?.iteration || 0;
    const savedMessages = (continuation.iteration_state?.messages_snapshot || []) as MessageParam[];

    // Get Claude client
    const client = getClaudeClient();

    // Create transform stream for SSE response
    const transform = new TransformStream<Uint8Array, Uint8Array>();
    const writer = transform.writable.getWriter();
    const encoder = new TextEncoder();

    // Helper to write SSE event
    const writeSSE = (event: object) => {
      writer.write(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
    };

    // Progressive save helper
    const progressiveSave = async (status: 'streaming' | 'partial' | 'timeout' | 'error' = 'streaming') => {
      if (allTextContent.length === 0) return;

      const contentDelta = allTextContent.length - lastProgressiveSaveLength;
      if (contentDelta < PROGRESSIVE_SAVE_THRESHOLD && status === 'streaming') return;

      try {
        await upsertPartialMessage(
          continuation.chat_id,
          assistantMessageId,
          { parts: [{ type: 'text', text: allTextContent }] },
          status
        );
        lastProgressiveSaveLength = allTextContent.length;
        lastProgressiveSaveTime = Date.now();
        chatLogger.debug(`[Continuation] Progressive save: ${allTextContent.length} chars (status: ${status})`);
      } catch (err) {
        chatLogger.error('[Continuation] Progressive save failed:', err);
      }
    };

    // Start streaming response
    const responsePromise = (async () => {
      try {
        writeSSE({ type: 'start' });
        writeSSE({ type: 'continuation-resume', previousLength: continuation.accumulated_text.length });

        // First, send accumulated text as initial content
        if (continuation.accumulated_text.length > 0) {
          writeSSE({ type: 'text-delta', textDelta: '[Resuming from previous response...]\n\n' });
        }

        // Set up progressive save interval
        progressiveSaveInterval = setInterval(async () => {
          const timeSinceLastSave = Date.now() - lastProgressiveSaveTime;
          if (timeSinceLastSave >= PROGRESSIVE_SAVE_INTERVAL_MS) {
            await progressiveSave('streaming');
          }
        }, PROGRESSIVE_SAVE_INTERVAL_MS);

        // Build continuation prompt
        const continuationMessages: MessageParam[] = [
          ...savedMessages,
          {
            role: 'assistant' as const,
            content: continuation.accumulated_text,
          },
          {
            role: 'user' as const,
            content: 'Please continue your response from where you left off. Do not repeat what you already said.',
          },
        ];

        // Continue iterating (reduced iterations for continuation)
        const MAX_CONTINUATION_ITERATIONS = 2;
        let totalInputTokens = 0;
        let totalOutputTokens = 0;

        for (let iteration = 0; iteration < MAX_CONTINUATION_ITERATIONS; iteration++) {
          // Check timeout before starting iteration
          if (timeoutTracker.shouldShutdown()) {
            chatLogger.warn(`[Continuation] Approaching timeout at iteration ${iteration}, initiating graceful shutdown`);
            didTimeout = true;

            await progressiveSave('timeout');

            // Create new continuation token for further resumption
            const newContinuation = await createContinuation(
              continuation.chat_id,
              allTextContent,
              [{ type: 'text', text: allTextContent }],
              {
                iteration: currentIteration + iteration,
                messages_snapshot: continuationMessages,
              },
              assistantMessageId
            );

            if (newContinuation) {
              newContinuationToken = newContinuation.continuation_token;
              writeSSE({
                type: 'timeout-warning',
                message: 'Response truncated due to timeout. Click "Continue" to resume.',
                remaining: timeoutTracker.getRemainingMs()
              });
              writeSSE({
                type: 'continuation-available',
                token: newContinuationToken,
                messageId: assistantMessageId
              });
            }

            break;
          }

          chatLogger.debug(`[Continuation] Iteration ${iteration + 1}/${MAX_CONTINUATION_ITERATIONS} (elapsed: ${timeoutTracker.getElapsedMs()}ms)`);

          // Call Claude API with streaming
          const stream = client.messages.stream({
            model: getClaudeModelId(model || chat.model || 'anthropic/claude-sonnet-4-20250514'),
            max_tokens: 8192,
            messages: continuationMessages,
            tools: advisoryTools,
          });

          let iterationText = '';
          let stopReason: string | null = null;

          for await (const event of stream) {
            // Check timeout during streaming
            if (timeoutTracker.shouldShutdown() && !didTimeout) {
              chatLogger.warn('[Continuation] Timeout during streaming, breaking');
              didTimeout = true;
              break;
            }

            switch (event.type) {
              case 'message_start':
                if (event.message?.usage) {
                  totalInputTokens += event.message.usage.input_tokens || 0;
                }
                break;

              case 'content_block_delta':
                if (event.delta?.type === 'text_delta' && event.delta.text) {
                  const text = event.delta.text;
                  iterationText += text;
                  allTextContent += text;
                  writeSSE({ type: 'text-delta', textDelta: text });
                }
                break;

              case 'message_delta':
                if (event.usage) {
                  totalOutputTokens += event.usage.output_tokens || 0;
                }
                if (event.delta?.stop_reason) {
                  stopReason = event.delta.stop_reason;
                }
                break;
            }
          }

          // If timed out during streaming, handle continuation
          if (didTimeout) {
            await progressiveSave('timeout');

            const newContinuation = await createContinuation(
              continuation.chat_id,
              allTextContent,
              [{ type: 'text', text: allTextContent }],
              {
                iteration: currentIteration + iteration,
                messages_snapshot: continuationMessages,
              },
              assistantMessageId
            );

            if (newContinuation) {
              newContinuationToken = newContinuation.continuation_token;
              writeSSE({
                type: 'timeout-warning',
                message: 'Response truncated due to timeout. Click "Continue" to resume.',
                remaining: timeoutTracker.getRemainingMs()
              });
              writeSSE({
                type: 'continuation-available',
                token: newContinuationToken,
                messageId: assistantMessageId
              });
            }

            break;
          }

          // If stop reason is end_turn or stop, we're done
          if (stopReason === 'end_turn' || stopReason === 'stop') {
            break;
          }

          // Update messages for next iteration if needed
          continuationMessages.push({
            role: 'assistant' as const,
            content: iterationText,
          });
        }

        // Clean up interval
        if (progressiveSaveInterval) {
          clearInterval(progressiveSaveInterval);
          progressiveSaveInterval = null;
        }

        // Final save
        if (!didTimeout) {
          await progressiveSave('partial');
        }

        writeSSE({
          type: 'finish',
          finishReason: didTimeout ? 'timeout' : 'stop',
          continuationToken: newContinuationToken || undefined
        });
        writer.write(encoder.encode('data: [DONE]\n\n'));

        return {
          text: allTextContent,
          inputTokens: totalInputTokens,
          outputTokens: totalOutputTokens,
          didTimeout,
          continuationToken: newContinuationToken,
          messageId: assistantMessageId,
        };
      } catch (error) {
        if (progressiveSaveInterval) {
          clearInterval(progressiveSaveInterval);
        }

        chatLogger.error('[Continuation] Stream error:', error);
        writeSSE({ type: 'error', error: error instanceof Error ? error.message : 'Unknown error' });

        if (allTextContent.length > 0) {
          await progressiveSave('error');
        }

        throw error;
      } finally {
        writer.close();
      }
    })();

    // Handle persistence after streaming completes
    responsePromise
      .then(async ({ text, inputTokens, outputTokens, didTimeout: timedOut, messageId }) => {
        try {
          if (timedOut) {
            chatLogger.info(`[Continuation] Response timed out again. Partial message saved (${text.length} chars).`);
            await updateChat(continuation.chat_id, { last_message_at: new Date().toISOString() });
            return;
          }

          // Finalize the message
          const assistantParts: MessagePart[] = [{ type: 'text', text }];
          const assistantMsg = await finalizeMessage(
            messageId,
            { parts: assistantParts },
            inputTokens + outputTokens
          );

          if (assistantMsg) {
            chatLogger.info(`[Continuation] Response complete. Message finalized (${text.length} chars)`);
          }

          await updateChat(continuation.chat_id, { last_message_at: new Date().toISOString() });
        } catch (error) {
          chatLogger.error('[Continuation] Failed to persist:', error);
        }
      })
      .catch((err) => chatLogger.error('[Continuation] Response promise error:', err));

    // Return streaming response immediately
    return new Response(transform.readable, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Chat-Id': continuation.chat_id,
      },
    });
  } catch (error) {
    chatLogger.error('[Continuation] Request error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to continue response',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
