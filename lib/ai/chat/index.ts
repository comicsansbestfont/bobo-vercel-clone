/**
 * Chat Service Module
 *
 * Barrel exports for the chat service.
 * M40-02: Refactored from monolithic route.ts
 */

// Types
export * from './types';

// Request handling
export { parseRequest, validateRequest, normalizeMessages, extractUserText } from './request-parser';

// Session management
export { ensureChatSession, updateChatTitleFromMessage } from './chat-session';

// Context building
export { buildChatContext } from './context-builder';

// Search coordination
export { performSearches, getProjectNamesForSearchResults } from './search-coordinator';

// Handlers
export { getHandler } from './handlers';

// Persistence
export { persistChatMessages } from './persistence';
