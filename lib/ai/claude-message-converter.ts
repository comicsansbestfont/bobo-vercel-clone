/**
 * M3.9: Claude Message Format Converter
 *
 * Converts between UIMessage format (used by frontend) and Claude API format.
 *
 * UIMessage format:
 * {
 *   id: string,
 *   role: 'user' | 'assistant' | 'system',
 *   parts: [{ type: 'text', text: '...' }, ...]
 * }
 *
 * Claude API format:
 * {
 *   role: 'user' | 'assistant',
 *   content: string | ContentBlockParam[]
 * }
 *
 * Note: System messages are passed separately to Claude's `system` parameter.
 */

import type { UIMessage } from 'ai';
import type {
  MessageParam,
  ContentBlockParam,
  ToolResultBlockParam,
} from '@anthropic-ai/sdk/resources/messages';

/**
 * Result of converting UIMessages to Claude format
 */
export type ClaudeConversionResult = {
  /** Combined system prompt from all system messages */
  systemPrompt: string;
  /** Messages in Claude API format */
  messages: MessageParam[];
};

/**
 * Extract text content from a UIMessage
 */
function extractTextFromParts(parts: UIMessage['parts']): string {
  if (!parts || !Array.isArray(parts)) return '';

  return parts
    .filter((p) => p.type === 'text')
    .map((p) => (p as { type: 'text'; text: string }).text || '')
    .join('\n')
    .trim();
}

/**
 * Convert UIMessage[] to Claude MessageParam[]
 *
 * - System messages are extracted and combined into systemPrompt
 * - User and assistant messages are converted to Claude format
 * - Consecutive messages of the same role are merged (Claude requirement)
 */
export function convertToClaudeMessages(
  messages: UIMessage[]
): ClaudeConversionResult {
  const systemParts: string[] = [];
  const claudeMessages: MessageParam[] = [];

  for (const msg of messages) {
    // Handle system messages
    if (msg.role === 'system') {
      const text = extractTextFromParts(msg.parts);
      if (text) {
        systemParts.push(text);
      }
      continue;
    }

    // Skip empty messages
    const content = extractTextFromParts(msg.parts);
    if (!content) continue;

    // Claude requires alternating user/assistant roles
    // If we have consecutive messages of the same role, merge them
    const lastMessage = claudeMessages[claudeMessages.length - 1];
    if (lastMessage && lastMessage.role === msg.role) {
      // Merge with previous message
      if (typeof lastMessage.content === 'string') {
        lastMessage.content = lastMessage.content + '\n\n' + content;
      }
    } else {
      // Add new message
      claudeMessages.push({
        role: msg.role as 'user' | 'assistant',
        content,
      });
    }
  }

  // Ensure conversation starts with user message (Claude requirement)
  if (claudeMessages.length > 0 && claudeMessages[0].role !== 'user') {
    claudeMessages.unshift({
      role: 'user',
      content: '[Conversation context]',
    });
  }

  return {
    systemPrompt: systemParts.join('\n\n'),
    messages: claudeMessages,
  };
}

/**
 * Build a tool_result message for continuing after tool use
 */
export function buildToolResultMessage(
  toolUseId: string,
  result: string,
  isError = false
): MessageParam {
  const toolResult: ToolResultBlockParam = {
    type: 'tool_result',
    tool_use_id: toolUseId,
    content: result,
    is_error: isError,
  };

  return {
    role: 'user',
    content: [toolResult],
  };
}

/**
 * Build an assistant message with tool use blocks (for conversation continuation)
 */
export function buildAssistantToolUseMessage(
  content: Array<{ type: 'text'; text: string } | { type: 'tool_use'; id: string; name: string; input: unknown }>
): MessageParam {
  return {
    role: 'assistant',
    content: content as ContentBlockParam[],
  };
}
