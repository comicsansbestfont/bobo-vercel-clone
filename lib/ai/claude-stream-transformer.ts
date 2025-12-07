/**
 * M3.9: Claude Stream Transformer
 *
 * Transforms Claude's SSE stream format to the UI format expected by useChat.
 *
 * Claude SSE events:
 * - message_start: { message: { id, model, ... } }
 * - content_block_start: { index, content_block: { type: 'text'|'tool_use', ... } }
 * - content_block_delta: { index, delta: { type: 'text_delta', text: '...' } }
 * - content_block_stop: { index }
 * - message_delta: { delta: { stop_reason }, usage: { output_tokens } }
 * - message_stop: {}
 *
 * UI SSE events (what useChat expects):
 * - { type: 'start' }
 * - { type: 'start-step' }
 * - { type: 'text-start', id: '0' }
 * - { type: 'text-delta', id: '0', delta: '...' }
 * - { type: 'text-end', id: '0' }
 * - { type: 'finish-step' }
 * - { type: 'finish', finishReason: 'stop'|'tool-calls' }
 * - [DONE]
 */

import type Anthropic from '@anthropic-ai/sdk';
import type { Stream } from '@anthropic-ai/sdk/streaming';
import type { RawMessageStreamEvent } from '@anthropic-ai/sdk/resources';
import type { ToolUseBlock } from '@anthropic-ai/sdk/resources/messages';
import { chatLogger } from '@/lib/logger';

/**
 * Tool invocation data extracted from stream
 */
export type StreamToolInvocation = {
  id: string;
  name: string;
  input: Record<string, unknown>;
};

/**
 * Result of processing a Claude stream
 */
export type StreamResult = {
  /** All text content from the response */
  text: string;
  /** Tool use blocks that need execution */
  toolInvocations: StreamToolInvocation[];
  /** Stop reason from Claude */
  stopReason: string | null;
  /** Usage info */
  usage: { inputTokens: number; outputTokens: number } | null;
};

/**
 * Transform Claude stream to UI-compatible SSE format
 *
 * This generator yields SSE-formatted strings that can be sent directly
 * to the frontend.
 */
export async function* transformClaudeStream(
  stream: Stream<RawMessageStreamEvent>
): AsyncGenerator<string, StreamResult> {
  // Track state
  let allText = '';
  const toolInvocations: StreamToolInvocation[] = [];
  let currentToolUse: Partial<StreamToolInvocation> | null = null;
  let currentToolInputJson = '';
  let stopReason: string | null = null;
  let usage: { inputTokens: number; outputTokens: number } | null = null;
  let textBlockStarted = false;

  // Emit start events
  yield `data: ${JSON.stringify({ type: 'start' })}\n\n`;
  yield `data: ${JSON.stringify({ type: 'start-step' })}\n\n`;

  try {
    for await (const event of stream) {
      switch (event.type) {
        case 'message_start':
          // Extract usage info
          if (event.message?.usage) {
            usage = {
              inputTokens: event.message.usage.input_tokens,
              outputTokens: 0,
            };
          }
          break;

        case 'content_block_start':
          if (event.content_block.type === 'text') {
            // Start text block
            if (!textBlockStarted) {
              yield `data: ${JSON.stringify({ type: 'text-start', id: '0' })}\n\n`;
              textBlockStarted = true;
            }
          } else if (event.content_block.type === 'tool_use') {
            // Start tool use block (track internally, don't emit to UI)
            const toolBlock = event.content_block as ToolUseBlock;
            currentToolUse = {
              id: toolBlock.id,
              name: toolBlock.name,
            };
            currentToolInputJson = '';
            // Note: tool-start is not a valid useChat event type, handled server-side
          }
          break;

        case 'content_block_delta':
          if (event.delta.type === 'text_delta') {
            // Text content
            const text = event.delta.text;
            allText += text;

            if (!textBlockStarted) {
              yield `data: ${JSON.stringify({ type: 'text-start', id: '0' })}\n\n`;
              textBlockStarted = true;
            }

            yield `data: ${JSON.stringify({
              type: 'text-delta',
              id: '0',
              delta: text,
            })}\n\n`;
          } else if (event.delta.type === 'input_json_delta') {
            // Tool input JSON (streamed in chunks)
            currentToolInputJson += event.delta.partial_json;
          }
          break;

        case 'content_block_stop':
          // If we were building a tool use, finalize it
          if (currentToolUse && currentToolUse.id && currentToolUse.name) {
            try {
              const parsedInput = currentToolInputJson
                ? JSON.parse(currentToolInputJson)
                : {};
              toolInvocations.push({
                id: currentToolUse.id,
                name: currentToolUse.name,
                input: parsedInput,
              });
              // Note: tool-ready is not a valid useChat event type, handled server-side
            } catch (e) {
              chatLogger.error('Failed to parse tool input:', e);
            }
            currentToolUse = null;
            currentToolInputJson = '';
          }
          break;

        case 'message_delta':
          // Extract stop reason and output tokens
          if (event.delta?.stop_reason) {
            stopReason = event.delta.stop_reason;
          }
          if (event.usage?.output_tokens && usage) {
            usage.outputTokens = event.usage.output_tokens;
          }
          break;

        case 'message_stop':
          // End of message
          break;
      }
    }
  } catch (error) {
    chatLogger.error('Stream error:', error);
    yield `data: ${JSON.stringify({
      type: 'error',
      error: error instanceof Error ? error.message : 'Stream error',
    })}\n\n`;
  }

  // End text block if started
  if (textBlockStarted) {
    yield `data: ${JSON.stringify({ type: 'text-end', id: '0' })}\n\n`;
  }

  // Emit finish events
  yield `data: ${JSON.stringify({ type: 'finish-step' })}\n\n`;
  yield `data: ${JSON.stringify({
    type: 'finish',
    finishReason: toolInvocations.length > 0 ? 'tool-calls' : 'stop',
  })}\n\n`;
  yield `data: [DONE]\n\n`;

  // Return collected data
  return {
    text: allText,
    toolInvocations,
    stopReason,
    usage,
  };
}

/**
 * Create a ReadableStream from Claude's stream for HTTP response
 *
 * This also returns a promise that resolves with the stream result
 * (text, tool invocations, etc.) once streaming is complete.
 */
export function createClaudeUIStream(
  stream: Stream<RawMessageStreamEvent>
): {
  readable: ReadableStream<Uint8Array>;
  resultPromise: Promise<StreamResult>;
} {
  const encoder = new TextEncoder();
  let resultResolve: (result: StreamResult) => void;
  const resultPromise = new Promise<StreamResult>((resolve) => {
    resultResolve = resolve;
  });

  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const generator = transformClaudeStream(stream);
        let result: IteratorResult<string, StreamResult>;

        while (!(result = await generator.next()).done) {
          controller.enqueue(encoder.encode(result.value));
        }

        // Generator returned with final result
        resultResolve(result.value);
      } catch (error) {
        chatLogger.error('Stream processing error:', error);
        controller.error(error);
        resultResolve({
          text: '',
          toolInvocations: [],
          stopReason: 'error',
          usage: null,
        });
      } finally {
        controller.close();
      }
    },
  });

  return { readable, resultPromise };
}

/**
 * Collect all content from a Claude stream without transforming
 * (for non-streaming tool loops)
 */
export async function collectClaudeStream(
  stream: Stream<RawMessageStreamEvent>
): Promise<StreamResult> {
  let allText = '';
  const toolInvocations: StreamToolInvocation[] = [];
  let currentToolUse: Partial<StreamToolInvocation> | null = null;
  let currentToolInputJson = '';
  let stopReason: string | null = null;
  let usage: { inputTokens: number; outputTokens: number } | null = null;

  for await (const event of stream) {
    switch (event.type) {
      case 'message_start':
        if (event.message?.usage) {
          usage = {
            inputTokens: event.message.usage.input_tokens,
            outputTokens: 0,
          };
        }
        break;

      case 'content_block_start':
        if (event.content_block.type === 'tool_use') {
          const toolBlock = event.content_block as ToolUseBlock;
          currentToolUse = {
            id: toolBlock.id,
            name: toolBlock.name,
          };
          currentToolInputJson = '';
        }
        break;

      case 'content_block_delta':
        if (event.delta.type === 'text_delta') {
          allText += event.delta.text;
        } else if (event.delta.type === 'input_json_delta') {
          currentToolInputJson += event.delta.partial_json;
        }
        break;

      case 'content_block_stop':
        if (currentToolUse && currentToolUse.id && currentToolUse.name) {
          try {
            toolInvocations.push({
              id: currentToolUse.id,
              name: currentToolUse.name,
              input: currentToolInputJson ? JSON.parse(currentToolInputJson) : {},
            });
          } catch (e) {
            chatLogger.error('Failed to parse tool input:', e);
          }
          currentToolUse = null;
          currentToolInputJson = '';
        }
        break;

      case 'message_delta':
        if (event.delta?.stop_reason) {
          stopReason = event.delta.stop_reason;
        }
        if (event.usage?.output_tokens && usage) {
          usage.outputTokens = event.usage.output_tokens;
        }
        break;
    }
  }

  return { text: allText, toolInvocations, stopReason, usage };
}
