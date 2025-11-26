/**
 * M4-7: Stream Adapter for Agent SDK
 *
 * Converts Agent SDK AsyncGenerator messages to UI-friendly stream chunks.
 */

import { query, type Options as AgentOptions } from '@anthropic-ai/claude-agent-sdk';
import { chatLogger } from '@/lib/logger';

/**
 * UI-friendly stream chunk types
 */
export interface UIStreamChunk {
  type: 'text' | 'tool-start' | 'tool-result' | 'error' | 'thinking';
  content?: string;
  toolName?: string;
  toolInput?: Record<string, unknown>;
  output?: string;
  duration?: number;
  success?: boolean;
}

/**
 * Stream agent responses and convert to UI chunks
 *
 * @param prompt - The user's prompt
 * @param options - Agent SDK options
 * @yields UIStreamChunk objects for the UI to render
 */
export async function* streamAgentResponse(
  prompt: string,
  options: Partial<AgentOptions>
): AsyncGenerator<UIStreamChunk> {
  try {
    chatLogger.debug('Starting agent query:', { prompt: prompt.slice(0, 100) });

    // Call the Agent SDK query function
    const agentQuery = query({
      prompt,
      options: options as AgentOptions,
    });

    // Track tool execution timing
    let toolStartTime: number | null = null;
    let currentToolName: string | null = null;

    // Iterate over the agent's response messages
    for await (const message of agentQuery) {
      // Handle different message types from the SDK
      // The exact message structure depends on SDK version
      const msgType = (message as Record<string, unknown>).type as string;

      // Debug: Log ALL incoming messages to understand structure
      chatLogger.debug('Agent SDK message received:', {
        type: msgType,
        keys: Object.keys(message as object),
        message: JSON.stringify(message).slice(0, 500),
      });

      switch (msgType) {
        case 'assistant': {
          // Agent SDK wraps content in message.message.content array
          const msg = message as Record<string, unknown>;
          const innerMessage = msg.message as Record<string, unknown> | undefined;

          if (innerMessage?.content) {
            const content = extractContent(innerMessage);
            if (content) {
              yield { type: 'text', content };
            }
          } else {
            // Fallback to direct extraction
            const content = extractContent(message);
            if (content) {
              yield { type: 'text', content };
            }
          }
          break;
        }

        case 'text': {
          // Text content from the assistant
          const content = extractContent(message);
          if (content) {
            yield { type: 'text', content };
          }
          break;
        }

        case 'partial-assistant':
        case 'text-delta': {
          // Streaming text delta
          const delta = extractDelta(message);
          if (delta) {
            yield { type: 'text', content: delta };
          }
          break;
        }

        case 'tool-use':
        case 'tool_use': {
          // Tool invocation started
          const toolName = (message as Record<string, unknown>).name as string ||
                          (message as Record<string, unknown>).tool_name as string;
          const toolInput = (message as Record<string, unknown>).input as Record<string, unknown> ||
                           (message as Record<string, unknown>).tool_input as Record<string, unknown>;

          toolStartTime = Date.now();
          currentToolName = toolName;

          yield {
            type: 'tool-start',
            toolName,
            toolInput,
          };
          break;
        }

        case 'result': {
          // Agent SDK final result message - NOT a tool result
          // This contains the complete agent response in the 'result' field
          const msg = message as Record<string, unknown>;

          // Check if this is actually a tool result (has tool_name) or final agent result
          if (msg.tool_name || currentToolName) {
            // This is a tool result
            const toolName = msg.tool_name as string || currentToolName || 'unknown';
            const output = extractToolOutput(message);
            const error = msg.error as string | undefined;
            const duration = toolStartTime ? Date.now() - toolStartTime : undefined;

            yield {
              type: 'tool-result',
              toolName,
              output,
              duration,
              success: !error,
            };

            toolStartTime = null;
            currentToolName = null;
          } else if (typeof msg.result === 'string' && msg.result) {
            // This is the final agent response - emit as text
            // Skip if we already emitted from 'assistant' message
            chatLogger.debug('Final agent result received:', { resultLength: msg.result.length });
            // The 'assistant' message should have already emitted the text,
            // so we skip emitting again to avoid duplication
          }
          break;
        }

        case 'tool-result':
        case 'tool_result': {
          // Tool execution completed
          const toolName = (message as Record<string, unknown>).tool_name as string ||
                          currentToolName ||
                          'unknown';
          const output = extractToolOutput(message);
          const error = (message as Record<string, unknown>).error as string | undefined;
          const duration = toolStartTime ? Date.now() - toolStartTime : undefined;

          yield {
            type: 'tool-result',
            toolName,
            output,
            duration,
            success: !error,
          };

          // Reset tracking
          toolStartTime = null;
          currentToolName = null;
          break;
        }

        case 'thinking':
        case 'reasoning': {
          // Thinking/reasoning content (for extended thinking models)
          const thinking = extractContent(message);
          if (thinking) {
            yield { type: 'thinking', content: thinking };
          }
          break;
        }

        case 'error': {
          // Error message
          const errorContent = (message as Record<string, unknown>).error as string ||
                              (message as Record<string, unknown>).message as string ||
                              'Unknown error';
          yield { type: 'error', content: errorContent };
          break;
        }

        default:
          // Log unknown message types for debugging
          chatLogger.debug('Unknown agent message type:', { msgType, message });
      }
    }
  } catch (error) {
    chatLogger.error('Agent stream error:', error);
    yield {
      type: 'error',
      content: error instanceof Error ? error.message : 'Agent stream error',
    };
  }
}

/**
 * Extract text content from various message formats
 */
function extractContent(message: unknown): string | null {
  const msg = message as Record<string, unknown>;

  // Try various content fields
  if (typeof msg.content === 'string') {
    return msg.content;
  }

  if (typeof msg.text === 'string') {
    return msg.text;
  }

  if (Array.isArray(msg.content)) {
    // Handle content blocks array
    return msg.content
      .map((block: unknown) => {
        const b = block as Record<string, unknown>;
        if (b.type === 'text' && typeof b.text === 'string') {
          return b.text;
        }
        return '';
      })
      .filter(Boolean)
      .join('');
  }

  return null;
}

/**
 * Extract delta content for streaming
 */
function extractDelta(message: unknown): string | null {
  const msg = message as Record<string, unknown>;

  if (typeof msg.delta === 'string') {
    return msg.delta;
  }

  if (msg.delta && typeof (msg.delta as Record<string, unknown>).text === 'string') {
    return (msg.delta as Record<string, unknown>).text as string;
  }

  return extractContent(message);
}

/**
 * Extract tool output from result message
 * Handles multiple field naming conventions from different SDK versions
 */
function extractToolOutput(message: unknown): string {
  const msg = message as Record<string, unknown>;

  // Debug: Log what we're trying to extract from
  chatLogger.debug('extractToolOutput - message fields:', {
    hasOutput: 'output' in msg,
    hasResult: 'result' in msg,
    hasContent: 'content' in msg,
    hasText: 'text' in msg,
    hasData: 'data' in msg,
    keys: Object.keys(msg),
  });

  // Try 'output' field (common)
  if (typeof msg.output === 'string' && msg.output) {
    return msg.output;
  }

  // Try 'result' field
  if (typeof msg.result === 'string' && msg.result) {
    return msg.result;
  }

  // Try 'content' field (Claude API format)
  if (typeof msg.content === 'string' && msg.content) {
    return msg.content;
  }

  // Try 'text' field
  if (typeof msg.text === 'string' && msg.text) {
    return msg.text;
  }

  // Try 'data' field
  if (typeof msg.data === 'string' && msg.data) {
    return msg.data;
  }

  // Handle object outputs
  if (msg.output && typeof msg.output === 'object') {
    return JSON.stringify(msg.output, null, 2);
  }

  if (msg.result && typeof msg.result === 'object') {
    return JSON.stringify(msg.result, null, 2);
  }

  if (msg.content && typeof msg.content === 'object') {
    // Handle content blocks array (Claude API format)
    if (Array.isArray(msg.content)) {
      return msg.content
        .map((block: unknown) => {
          const b = block as Record<string, unknown>;
          if (b.type === 'text' && typeof b.text === 'string') {
            return b.text;
          }
          if (b.type === 'tool_result' && typeof b.content === 'string') {
            return b.content;
          }
          return JSON.stringify(b);
        })
        .filter(Boolean)
        .join('\n');
    }
    return JSON.stringify(msg.content, null, 2);
  }

  if (msg.data && typeof msg.data === 'object') {
    return JSON.stringify(msg.data, null, 2);
  }

  // Last resort: stringify the entire message (excluding type)
  const { type, ...rest } = msg;
  if (Object.keys(rest).length > 0) {
    chatLogger.debug('extractToolOutput - using fallback stringify:', rest);
    return JSON.stringify(rest, null, 2);
  }

  return '';
}
