/**
 * Module Feature Flags
 *
 * Centralized configuration for enabling/disabling application modules.
 * Each module defines its enabled state and associated Claude tools.
 */

/**
 * Module configuration
 */
export type ModuleConfig = {
  /** Whether the module is enabled */
  enabled: boolean;
  /** Claude tools provided by this module */
  tools: string[];
  /** Optional description */
  description?: string;
};

/**
 * Application modules registry
 *
 * Controls which features are active and which tools are available during chat.
 */
export const MODULES = {
  /**
   * Advisory module (KNO-001)
   * File-based deal and client information retrieval
   */
  advisory: {
    enabled: true,
    tools: [
      'search_advisory',
      'read_advisory_file',
      'list_advisory_files',
      'grep_advisory',
      'glob_advisory',
    ],
    description: 'Advisory file search and retrieval',
  } as ModuleConfig,

  /**
   * Inspiration Library module (KNO-002)
   * Cross-project inspiration and pattern search
   */
  inspiration: {
    enabled: true,
    tools: ['search_inspiration', 'read_inspiration_file'],
    description: 'Search blog posts, videos, and LinkedIn archives',
  } as ModuleConfig,

  /**
   * Reference Library module (KNO-003)
   * Personal identity docs and internal playbooks
   */
  reference: {
    enabled: true,
    tools: ['search_reference', 'read_reference_file'],
    description: 'Search identity docs and internal playbooks',
  } as ModuleConfig,

  /**
   * Deal Workspace module (USE-002)
   * HubSpot-style CRM for managing deals
   * Status: Designed (disabled by default)
   */
  dealWorkspace: {
    enabled: false,
    tools: [
      'log_activity',
      'get_activities',
      'create_action_item',
      'get_action_items',
      'update_action_item',
      'get_deal_health',
      'get_deal_timeline',
      'add_contact',
      'get_contacts',
    ],
    description: '3-column CRM interface for deal management',
  } as ModuleConfig,

  /**
   * Content Studio module (USE-003)
   * Content creation and management workspace
   * Status: Planned (disabled)
   */
  contentStudio: {
    enabled: false,
    tools: [],
    description: 'Content creation and management workspace',
  } as ModuleConfig,

  /**
   * Cross-model query tools (INF-004)
   * Second-opinion queries to other AI models
   */
  crossModel: {
    enabled: true,
    tools: ['ask_chatgpt', 'ask_gemini'],
    description: 'Cross-model query tools for second opinions',
  } as ModuleConfig,
} as const;

/**
 * Get all enabled tool names across all modules
 */
export function getEnabledTools(): string[] {
  const enabledModules = Object.values(MODULES).filter((m) => m.enabled);
  return enabledModules.flatMap((m) => m.tools);
}

/**
 * Check if a specific module is enabled
 */
export function isModuleEnabled(moduleName: keyof typeof MODULES): boolean {
  return MODULES[moduleName]?.enabled ?? false;
}

/**
 * Get configuration for a specific module
 */
export function getModuleConfig(
  moduleName: keyof typeof MODULES
): ModuleConfig | null {
  return MODULES[moduleName] ?? null;
}

/**
 * Get all modules with their status
 */
export function getAllModules(): Array<{
  name: string;
  config: ModuleConfig;
}> {
  return Object.entries(MODULES).map(([name, config]) => ({
    name,
    config,
  }));
}
