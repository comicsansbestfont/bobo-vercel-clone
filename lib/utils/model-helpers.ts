/**
 * Model Utilities
 *
 * Shared utilities for model detection and tool display.
 * These are client-safe and do not import Node.js dependencies.
 */

/**
 * Check if the model is a Claude model
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
  'Write',
  'Edit',
  'Bash',
  'update_memory',
  'forget_memory',
];

/**
 * Tools that auto-approve (low risk, read-only)
 */
export const AUTO_APPROVED_TOOLS = [
  'Read',
  'Glob',
  'Grep',
  'WebSearch',
  'WebFetch',
  'search_memory',
  'remember_fact',
  'search_advisory',
  'record_question',
  'record_decision',
  'record_insight',
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
  search_memory: 'Search user memories',
  remember_fact: 'Store a new memory',
  update_memory: 'Update existing memory (requires confirmation)',
  forget_memory: 'Delete memory (requires confirmation)',
  search_advisory: 'Search advisory files (deals, clients, meetings)',
  record_question: 'Record a question for reflection',
  record_decision: 'Record a decision with rationale',
  record_insight: 'Record an insight with evidence',
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
  search_memory: 'brain',
  remember_fact: 'brain',
  update_memory: 'brain',
  forget_memory: 'brain',
  search_advisory: 'briefcase',
  record_question: 'help-circle',
  record_decision: 'check-square',
  record_insight: 'lightbulb',
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
  search_memory: '🧠',
  remember_fact: '🧠',
  update_memory: '🧠',
  forget_memory: '🧠',
  search_advisory: '📂',
  record_question: '❓',
  record_decision: '✅',
  record_insight: '💡',
};

/**
 * Get emoji for a tool name (for streamed text display)
 */
export function getToolEmoji(toolName: string): string {
  return TOOL_EMOJIS[toolName] || '🔧';
}
