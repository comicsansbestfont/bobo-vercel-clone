/**
 * Request Parser
 *
 * Handles parsing and validation of chat API requests.
 * M40-02: Extracted from route.ts lines 307-345, 672-703
 */

import type { UIMessage } from 'ai';
import type { ChatRequest } from './types';
import { chatLogger } from '@/lib/logger';

// ============================================================================
// REQUEST PARSING
// ============================================================================

/**
 * Parse the incoming chat request body
 */
export function parseRequest(body: Record<string, unknown>): ChatRequest {
  return {
    messages: (body.messages as ChatRequest['messages']) || [],
    model: body.model as string,
    webSearch: (body.webSearch as boolean) || false,
    chatId: body.chatId as string | undefined,
    projectId: body.projectId as string | undefined,
    agentMode: body.agentMode as boolean | undefined,
    // M3.14: Extended thinking parameters
    thinkingEnabled: body.thinkingEnabled as boolean | undefined,
    thinkingBudget: body.thinkingBudget as number | undefined,
    // File attachments for Claude vision/document support
    attachments: (body.attachments as ChatRequest['attachments']) || undefined,
  };
}

// ============================================================================
// REQUEST VALIDATION
// ============================================================================

/**
 * Validate the chat request
 * Returns error message if invalid, null if valid
 */
export function validateRequest(request: ChatRequest): string | null {
  // Validate model is provided
  if (!request.model) {
    return 'Model is required';
  }

  return null;
}

// ============================================================================
// MESSAGE NORMALIZATION
// ============================================================================

/**
 * Normalize message roles and ensure valid structure
 * - Converts invalid roles to 'user'
 * - Ensures parts array exists on all messages
 */
export function normalizeMessages(messages: UIMessage[]): UIMessage[] {
  const allowedRoles = new Set<UIMessage['role']>(['system', 'user', 'assistant']);

  return (messages || []).map((msg, idx) => {
    let normalized = msg;

    // Normalize unsupported roles to 'user'
    if (!allowedRoles.has(msg.role)) {
      chatLogger.warn('Normalizing unsupported role to "user":', { idx, role: msg.role });
      normalized = { ...msg, role: 'user' };
    }

    // Ensure parts array exists
    if (!normalized.parts || !Array.isArray(normalized.parts)) {
      chatLogger.debug('Message missing parts, adding empty array:', {
        id: normalized.id,
        role: normalized.role,
      });
      normalized = { ...normalized, parts: [] };
    }

    return normalized;
  });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Extract the user text from the last message
 */
export function extractUserText(messages: UIMessage[]): string {
  const lastUserMessage = messages[messages.length - 1];

  if (lastUserMessage && Array.isArray(lastUserMessage.parts)) {
    return lastUserMessage.parts
      .filter((p): p is { type: 'text'; text: string } => p.type === 'text' && 'text' in p)
      .map((p) => p.text)
      .join(' ');
  }

  return '';
}
