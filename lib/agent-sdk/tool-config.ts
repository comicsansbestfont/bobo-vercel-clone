/**
 * M4-5: Tool Configuration for Agent SDK
 *
 * Defines which tools are available and their descriptions.
 */

import type { Options as AgentOptions } from '@anthropic-ai/claude-agent-sdk';

/**
 * Default tool configuration - read-only tools auto-approved
 */
export const DEFAULT_TOOL_CONFIG: Partial<AgentOptions> = {
  allowedTools: ['Read', 'Glob', 'Grep', 'WebSearch', 'WebFetch'],
};

/**
 * Full agent tool configuration - all tools enabled
 * Write operations still require user confirmation via permission mode
 */
export const FULL_AGENT_TOOL_CONFIG: Partial<AgentOptions> = {
  allowedTools: [
    'Read',
    'Write',
    'Edit',
    'Bash',
    'Glob',
    'Grep',
    'WebSearch',
    'WebFetch',
  ],
};

/**
 * Read-only tool configuration - for restricted agent mode
 */
export const READONLY_TOOL_CONFIG: Partial<AgentOptions> = {
  allowedTools: ['Read', 'Glob', 'Grep'],
};

// Tool descriptions, icons, and confirmation logic are in ./utils.ts
// to allow use in client components without importing Node.js dependencies
export {
  TOOL_DESCRIPTIONS,
  TOOL_ICONS,
  CONFIRMATION_REQUIRED_TOOLS,
  requiresConfirmation,
} from './utils';
