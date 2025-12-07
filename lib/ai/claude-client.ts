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
 * Get the Claude client instance (creates one if not exists)
 */
export function getClaudeClient(): Anthropic {
  if (!client) {
    // Try ANTHROPIC_API_KEY first, fall back to AI_GATEWAY_API_KEY
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.AI_GATEWAY_API_KEY;

    if (!apiKey) {
      throw new Error(
        'ANTHROPIC_API_KEY or AI_GATEWAY_API_KEY is required for Claude SDK'
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
