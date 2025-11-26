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
export const CONFIRMATION_REQUIRED_TOOLS = ['Write', 'Edit', 'Bash'];

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
};

/**
 * Get emoji for a tool name (for streamed text display)
 */
export function getToolEmoji(toolName: string): string {
  return TOOL_EMOJIS[toolName] || '🔧';
}
