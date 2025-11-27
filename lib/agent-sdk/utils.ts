/**
 * Agent SDK Utilities
 *
 * Shared utilities that can be used in both client and server components.
 * These do NOT import from the Claude Agent SDK to avoid Node.js dependencies.
 */

/**
 * Check if the model is a Claude model (supports Agent Mode)
 */
export function isClaudeModel(model: string | undefined | null): boolean {
  if (!model) return false;
  const lowerModel = model.toLowerCase();
  return (
    lowerModel.includes('claude') ||
    lowerModel.includes('anthropic') ||
    lowerModel.startsWith('anthropic/')
  );
}

/**
 * Tools that require user confirmation before execution
 */
export const CONFIRMATION_REQUIRED_TOOLS = [
  // M4 file system tools
  'Write',
  'Edit',
  'Bash',
  // M3.5 memory tools - destructive operations
  'update_memory',  // Modifies existing data
  'forget_memory',  // Destructive operation
];

/**
 * Tools that auto-approve (low risk)
 */
export const AUTO_APPROVED_TOOLS = [
  // M4 read-only tools
  'Read',
  'Glob',
  'Grep',
  'WebSearch',
  'WebFetch',
  // M3.5 memory tools - safe operations
  'search_memory',   // Read-only
  'remember_fact',   // Additive only, easily undone
];

/**
 * Check if a tool requires user confirmation
 */
export function requiresConfirmation(toolName: string): boolean {
  return CONFIRMATION_REQUIRED_TOOLS.includes(toolName);
}

/**
 * Tool descriptions for UI display
 */
export const TOOL_DESCRIPTIONS: Record<string, string> = {
  Read: 'Read file contents from the project',
  Write: 'Create new files (requires confirmation)',
  Edit: 'Modify existing files (requires confirmation)',
  Bash: 'Execute shell commands (requires confirmation)',
  Glob: 'Search for files by pattern',
  Grep: 'Search file contents with regex',
  WebSearch: 'Search the web for information',
  WebFetch: 'Fetch content from URLs',
  // M3.5 memory tools
  search_memory: 'Search user memories',
  remember_fact: 'Store a new memory',
  update_memory: 'Update existing memory (requires confirmation)',
  forget_memory: 'Delete memory (requires confirmation)',
};

/**
 * Tool icons for UI display (using Lucide icon names)
 */
export const TOOL_ICONS: Record<string, string> = {
  Read: 'file-text',
  Write: 'file-plus',
  Edit: 'file-edit',
  Bash: 'terminal',
  Glob: 'folder-search',
  Grep: 'search',
  WebSearch: 'globe',
  WebFetch: 'download',
  // M3.5 memory tools
  search_memory: 'brain',
  remember_fact: 'brain',
  update_memory: 'brain',
  forget_memory: 'brain',
};

/**
 * Tool emojis for text-based display in streamed content
 */
export const TOOL_EMOJIS: Record<string, string> = {
  Read: '📖',
  Write: '✍️',
  Edit: '📝',
  Bash: '💻',
  Glob: '🔍',
  Grep: '🔎',
  WebSearch: '🌐',
  WebFetch: '📥',
  // M3.5 memory tools
  search_memory: '🧠',
  remember_fact: '🧠',
  update_memory: '🧠',
  forget_memory: '🧠',
};

/**
 * Get emoji for a tool name (for streamed text display)
 */
export function getToolEmoji(toolName: string): string {
  return TOOL_EMOJIS[toolName] || '🔧';
}
