/**
 * M4: Claude Agent SDK Integration
 *
 * Main exports for the agent SDK module.
 *
 * NOTE: This file ONLY exports client-safe utilities.
 * Server-only exports (Agent SDK, safety hooks) are in ./server.ts
 */

// Shared utilities (safe for client and server)
export { isClaudeModel, requiresConfirmation } from './utils';

// Re-export tool UI helpers from utils (client-safe)
export {
  TOOL_DESCRIPTIONS,
  TOOL_ICONS,
  CONFIRMATION_REQUIRED_TOOLS,
  AUTO_APPROVED_TOOLS,
  getToolEmoji,
  TOOL_EMOJIS,
} from './utils';
