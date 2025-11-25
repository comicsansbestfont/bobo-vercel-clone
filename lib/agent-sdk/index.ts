/**
 * M4: Claude Agent SDK Integration
 *
 * Main exports for the agent SDK module.
 */

// Agent handler
export { handleAgentMode, type AgentModeRequest } from './agent-handler';

// Shared utilities (safe for client and server)
export { isClaudeModel, requiresConfirmation } from './utils';

// Memory integration (M3)
export { buildMemoryContext, formatCategoryName } from './memory-integration';

// Project integration (M2)
export { buildProjectContext, getProjectFileSummary } from './project-integration';

// Tool configuration (server-side only - uses Agent SDK types)
export {
  DEFAULT_TOOL_CONFIG,
  FULL_AGENT_TOOL_CONFIG,
  READONLY_TOOL_CONFIG,
} from './tool-config';

// Re-export tool UI helpers from utils (client-safe)
export {
  TOOL_DESCRIPTIONS,
  TOOL_ICONS,
  CONFIRMATION_REQUIRED_TOOLS,
} from './utils';

// Safety hooks
export {
  SAFETY_HOOKS,
  canUseTool,
  checkBashSafety,
  checkWriteSafety,
} from './safety-hooks';

// Stream adapter
export {
  streamAgentResponse,
  type UIStreamChunk,
} from './stream-adapter';
