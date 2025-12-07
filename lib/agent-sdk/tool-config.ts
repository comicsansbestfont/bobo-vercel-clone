/**
 * M4-5: Tool Configuration for Agent SDK
 * M3.5-6: Added Memory Tools Configuration
 *
 * Defines which tools are available and their descriptions.
 *
 * NOTE: Agent SDK is disabled in Vercel deployments. These configs are
 * retained for local development compatibility.
 */

// Stub type to replace SDK import
type AgentOptions = {
  allowedTools?: string[];
};

/**
 * Default tool configuration - read-only tools auto-approved
 */
export const DEFAULT_TOOL_CONFIG: Partial<AgentOptions> = {
  allowedTools: ['Read', 'Glob', 'Grep', 'WebSearch', 'WebFetch', 'search_memory', 'search_advisory'],
};

/**
 * Full agent tool configuration - all tools enabled
 * Write operations still require user confirmation via permission mode
 * Memory tools from M3.5 are included
 */
export const FULL_AGENT_TOOL_CONFIG: Partial<AgentOptions> = {
  allowedTools: [
    // M4 file system tools
    'Read',
    'Write',
    'Edit',
    'Bash',
    'Glob',
    'Grep',
    'WebSearch',
    'WebFetch',
    // M3.5 memory tools
    'search_memory',
    'remember_fact',
    'update_memory',
    'forget_memory',
    // M3.7 advisory tools
    'search_advisory',
  ],
};

/**
 * Read-only tool configuration - for restricted agent mode
 */
export const READONLY_TOOL_CONFIG: Partial<AgentOptions> = {
  allowedTools: ['Read', 'Glob', 'Grep', 'search_memory', 'search_advisory'],
};

// Tool descriptions, icons, and confirmation logic are in ./utils.ts
// to allow use in client components without importing Node.js dependencies
export {
  TOOL_DESCRIPTIONS,
  TOOL_ICONS,
  CONFIRMATION_REQUIRED_TOOLS,
  AUTO_APPROVED_TOOLS,
  requiresConfirmation,
} from './utils';
