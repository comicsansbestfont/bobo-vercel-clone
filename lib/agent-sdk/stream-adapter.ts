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

      switch (msgType) {
        case 'assistant':
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

        case 'tool-result':
        case 'tool_result':
        case 'result': {
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
 */
function extractToolOutput(message: unknown): string {
  const msg = message as Record<string, unknown>;

  if (typeof msg.output === 'string') {
    return msg.output;
  }

  if (typeof msg.result === 'string') {
    return msg.result;
  }

  if (msg.output && typeof msg.output === 'object') {
    return JSON.stringify(msg.output, null, 2);
  }

  if (msg.result && typeof msg.result === 'object') {
    return JSON.stringify(msg.result, null, 2);
  }

  return '';
}
