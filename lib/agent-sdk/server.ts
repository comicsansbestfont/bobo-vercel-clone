/**
 * M4: Claude Agent SDK Integration - Server-Only Exports
 *
 * This file contains exports that require Node.js runtime (fs, child_process, etc.)
 * and can ONLY be imported in server components or API routes.
 *
 * DO NOT import this file in client components or 'use client' files!
 */

// Agent handler
export { handleAgentMode, type AgentModeRequest } from './agent-handler';

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

// Safety hooks (requires fs module)
export {
  SAFETY_HOOKS,
  canUseTool,
  checkBashSafety,
  checkWriteSafety,
} from './safety-hooks';

// Stream adapter (requires @anthropic-ai/claude-agent-sdk)
export {
  streamAgentResponse,
  type UIStreamChunk,
} from './stream-adapter';

// M3.7: Advisory tools
export {
  advisoryTools,
  searchAdvisoryTool,
  ADVISORY_TOOL_NAMES,
  getAdvisoryTool,
} from './advisory-tools';
