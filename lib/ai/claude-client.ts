/**
 * M3.9: Claude SDK Client
 *
 * Singleton client for Anthropic Claude API.
 * Used for all chat interactions with native tool_use support.
 */

import Anthropic from '@anthropic-ai/sdk';

// Singleton client instance
let client: Anthropic | null = null;

/**
 * Check if a valid Anthropic API key is available
 */
export function hasValidAnthropicKey(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

/**
 * Get the Claude client instance (creates one if not exists)
 *
 * @throws Error if ANTHROPIC_API_KEY is not set
 */
export function getClaudeClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new Error(
        'ANTHROPIC_API_KEY is required for Claude SDK. Get one at console.anthropic.com'
      );
    }

    client = new Anthropic({ apiKey });
  }

  return client;
}

/**
 * Convert model ID from gateway format to Claude format
 *
 * Examples:
 * - 'anthropic/claude-opus-4-5-20251101' → 'claude-opus-4-5-20251101'
 * - 'claude-sonnet-4-5-20250929' → 'claude-sonnet-4-5-20250929'
 */
export function getClaudeModelId(model: string): string {
  // Strip 'anthropic/' prefix if present
  if (model.startsWith('anthropic/')) {
    return model.replace('anthropic/', '');
  }
  return model;
}

/**
 * Model context limits for Claude models
 */
export const CLAUDE_CONTEXT_LIMITS: Record<string, number> = {
  'claude-opus-4-5-20251101': 200000,
  'claude-sonnet-4-5-20250929': 200000,
  'claude-haiku-4-5-20251001': 200000,
  // Fallback
  default: 200000,
};

/**
 * Get context limit for a model
 */
export function getClaudeContextLimit(model: string): number {
  const modelId = getClaudeModelId(model);
  return CLAUDE_CONTEXT_LIMITS[modelId] || CLAUDE_CONTEXT_LIMITS.default;
}

// ============================================================================
// M3.14: EXTENDED THINKING CONFIGURATION
// ============================================================================

/**
 * Thinking budget configuration per model.
 * Based on Anthropic's extended thinking documentation.
 *
 * - min: Minimum budget (1024 tokens required by API)
 * - default: Recommended starting budget for balanced performance
 * - max: Maximum budget before diminishing returns / timeout risk
 */
export const MODEL_THINKING_BUDGETS: Record<string, { min: number; default: number; max: number }> = {
  'claude-opus-4-5-20251101': { min: 1024, default: 16000, max: 100000 },
  'claude-opus-4-1-20250805': { min: 1024, default: 16000, max: 100000 },
  'claude-opus-4-20250514': { min: 1024, default: 16000, max: 100000 },
  'claude-sonnet-4-5-20250929': { min: 1024, default: 10000, max: 32000 },
  'claude-sonnet-4-20250514': { min: 1024, default: 10000, max: 32000 },
  'claude-haiku-4-5-20251001': { min: 1024, default: 4000, max: 16000 },
  // Fallback for unknown models
  default: { min: 1024, default: 10000, max: 32000 },
};

/**
 * UI preset mappings for thinking budget
 */
export const THINKING_PRESETS = {
  quick: 4000,    // Fast responses, light reasoning
  standard: 10000, // Balanced (default)
  deep: 16000,    // Complex problems, thorough analysis
} as const;

export type ThinkingPreset = keyof typeof THINKING_PRESETS;

/**
 * Models that support extended thinking
 */
const THINKING_SUPPORTED_MODELS = [
  'claude-opus-4-5',
  'claude-opus-4-1',
  'claude-opus-4',
  'claude-sonnet-4-5',
  'claude-sonnet-4',
  'claude-sonnet-3-7',
  'claude-haiku-4-5',
];

/**
 * Check if a model supports extended thinking
 */
export function supportsExtendedThinking(model: string): boolean {
  const modelId = getClaudeModelId(model);
  return THINKING_SUPPORTED_MODELS.some(m => modelId.includes(m));
}

/**
 * Get the default thinking budget for a model
 */
export function getDefaultThinkingBudget(model: string): number {
  const modelId = getClaudeModelId(model);
  const config = MODEL_THINKING_BUDGETS[modelId] || MODEL_THINKING_BUDGETS.default;
  return config.default;
}

/**
 * Get thinking budget limits for a model
 */
export function getThinkingBudgetLimits(model: string): { min: number; max: number } {
  const modelId = getClaudeModelId(model);
  const config = MODEL_THINKING_BUDGETS[modelId] || MODEL_THINKING_BUDGETS.default;
  return { min: config.min, max: config.max };
}

/**
 * Validate and clamp a thinking budget to model limits
 */
export function validateThinkingBudget(model: string, budget: number): number {
  const { min, max } = getThinkingBudgetLimits(model);
  return Math.max(min, Math.min(max, budget));
}
