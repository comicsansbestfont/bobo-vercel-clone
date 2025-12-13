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
 *
 * M3.17: Added support for image and document (PDF) attachments.
 * Claude vision format: { type: 'image', source: { type: 'base64', media_type, data } }
 * Claude document format: { type: 'document', source: { type: 'base64', media_type, data } }
 */

import type { UIMessage } from 'ai';
import type {
  MessageParam,
  ContentBlockParam,
  ToolResultBlockParam,
  ImageBlockParam,
  DocumentBlockParam,
} from '@anthropic-ai/sdk/resources/messages';
import type { ChatAttachment } from './chat/types';

/**
 * Result of converting UIMessages to Claude format
 */
export type ClaudeConversionResult = {
  /** Combined system prompt from all system messages */
  systemPrompt: string;
  /** Messages in Claude API format */
  messages: MessageParam[];
};

// ============================================================================
// M3.17: ATTACHMENT CONVERSION HELPERS
// ============================================================================

/** Supported image MIME types for Claude vision */
const SUPPORTED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]);

/** Supported document MIME types */
const SUPPORTED_DOCUMENT_TYPES = new Set([
  'application/pdf',
]);

/**
 * Parse a data URL into its components
 * Data URL format: data:[<mediatype>][;base64],<data>
 */
function parseDataUrl(dataUrl: string): { mediaType: string; data: string } | null {
  if (!dataUrl.startsWith('data:')) {
    return null;
  }

  const commaIndex = dataUrl.indexOf(',');
  if (commaIndex === -1) {
    return null;
  }

  const header = dataUrl.slice(5, commaIndex); // Remove 'data:' prefix
  const data = dataUrl.slice(commaIndex + 1);

  // Parse header: mediatype[;base64]
  const parts = header.split(';');
  const mediaType = parts[0] || 'application/octet-stream';
  const isBase64 = parts.includes('base64');

  // We only support base64-encoded data for Claude
  if (!isBase64) {
    return null;
  }

  return { mediaType, data };
}

/**
 * Convert a ChatAttachment to Claude's image or document content block
 */
export function convertAttachmentToClaudeBlock(
  attachment: ChatAttachment
): ImageBlockParam | DocumentBlockParam | null {
  const parsed = parseDataUrl(attachment.url);
  if (!parsed) {
    console.warn('[claude-message-converter] Invalid data URL for attachment:', attachment.filename);
    return null;
  }

  const { mediaType, data } = parsed;
  const effectiveMediaType = attachment.mediaType || mediaType;

  // Check if it's an image
  if (SUPPORTED_IMAGE_TYPES.has(effectiveMediaType)) {
    return {
      type: 'image',
      source: {
        type: 'base64',
        media_type: effectiveMediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
        data,
      },
    } as ImageBlockParam;
  }

  // Check if it's a document (PDF)
  if (SUPPORTED_DOCUMENT_TYPES.has(effectiveMediaType)) {
    return {
      type: 'document',
      source: {
        type: 'base64',
        media_type: effectiveMediaType as 'application/pdf',
        data,
      },
    } as DocumentBlockParam;
  }

  console.warn('[claude-message-converter] Unsupported attachment type:', effectiveMediaType, attachment.filename);
  return null;
}

/**
 * Convert an array of attachments to Claude content blocks
 */
export function convertAttachmentsToClaudeBlocks(
  attachments: ChatAttachment[] | undefined
): (ImageBlockParam | DocumentBlockParam)[] {
  if (!attachments || attachments.length === 0) {
    return [];
  }

  const blocks: (ImageBlockParam | DocumentBlockParam)[] = [];

  for (const attachment of attachments) {
    const block = convertAttachmentToClaudeBlock(attachment);
    if (block) {
      blocks.push(block);
    }
  }

  return blocks;
}

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
 * - Attachments are prepended to the last user message (images/docs before text)
 */
export function convertToClaudeMessages(
  messages: UIMessage[],
  attachments?: ChatAttachment[]
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

  // M3.17: Add attachments to the last user message
  // Per Claude best practices: images/documents should come BEFORE text
  if (attachments && attachments.length > 0) {
    const attachmentBlocks = convertAttachmentsToClaudeBlocks(attachments);

    if (attachmentBlocks.length > 0) {
      const lastUserMessageIndex = claudeMessages.findLastIndex(m => m.role === 'user');

      if (lastUserMessageIndex !== -1) {
        const lastUserMessage = claudeMessages[lastUserMessageIndex];
        const existingContent = lastUserMessage.content;

        // Convert to content block array with attachments first, then text
        // This follows Claude's recommendation: images before text
        const contentBlocks: ContentBlockParam[] = [
          // Add attachment blocks first
          ...attachmentBlocks,
          // Then add existing text content
          ...(typeof existingContent === 'string'
            ? [{ type: 'text' as const, text: existingContent }]
            : Array.isArray(existingContent)
              ? existingContent
              : []),
        ];

        claudeMessages[lastUserMessageIndex] = {
          role: 'user',
          content: contentBlocks,
        };
      }
    }
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
