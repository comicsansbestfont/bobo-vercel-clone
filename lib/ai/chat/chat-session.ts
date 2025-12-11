/**
 * Chat Session Manager
 *
 * Manages chat session lifecycle - creation, validation, and updates.
 * M40-02: Extracted from route.ts lines 347-378, 152-165
 */

import {
  createChat,
  getChat,
  updateChat,
} from '@/lib/db';
import { chatLogger } from '@/lib/logger';

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

export interface EnsureChatSessionOptions {
  chatId?: string;
  model: string;
  webSearch: boolean;
  projectId?: string;
}

export interface EnsureChatSessionResult {
  success: boolean;
  chatId?: string;
  error?: string;
  isNew?: boolean;
}

/**
 * Ensure a chat session exists in the database.
 * Creates a new chat if the provided chatId doesn't exist or wasn't provided.
 */
export async function ensureChatSession(
  options: EnsureChatSessionOptions
): Promise<EnsureChatSessionResult> {
  const { chatId: providedChatId, model, webSearch, projectId } = options;

  let activeChatId = providedChatId;
  let chatExists = false;

  if (activeChatId) {
    // Check if the provided chatId exists in the database
    const existingChat = await getChat(activeChatId);
    chatExists = existingChat !== null;
  }

  // Create new chat if no chatId provided OR if provided chatId doesn't exist
  if (!activeChatId || !chatExists) {
    const newChat = await createChat({
      // Use client-provided chatId if available to prevent mismatch
      ...(providedChatId && { id: providedChatId }),
      title: 'New Chat',
      model: model,
      web_search_enabled: webSearch,
      project_id: projectId || null,
    });

    if (!newChat) {
      return {
        success: false,
        error: 'Unable to create chat session. Please refresh and try again.',
      };
    }

    activeChatId = newChat.id;
    chatLogger.debug('Created new chat session:', { chatId: activeChatId });

    return { success: true, chatId: activeChatId, isNew: true };
  }

  return { success: true, chatId: activeChatId, isNew: false };
}

// ============================================================================
// CHAT UPDATES
// ============================================================================

/**
 * Auto-generate chat title from first message.
 * Takes first 50 chars or first sentence.
 * Only updates if current title is still "New Chat".
 */
export async function updateChatTitleFromMessage(
  chatId: string,
  messageText: string
): Promise<void> {
  // Check if chat already has a real title
  const chat = await getChat(chatId);
  if (!chat || chat.title !== 'New Chat') {
    // Chat already has a custom title, don't overwrite
    return;
  }

  // Generate title: First 50 chars or first sentence
  const title = messageText
    .split(/[.!?]/)[0]
    .slice(0, 50)
    .trim();

  if (title && title !== 'New Chat') {
    await updateChat(chatId, { title });
    chatLogger.debug('Updated chat title:', { chatId, title });
  }
}

/**
 * Update the chat's last_message_at timestamp
 */
export async function updateChatTimestamp(chatId: string): Promise<void> {
  await updateChat(chatId, {
    last_message_at: new Date().toISOString(),
  });
}
