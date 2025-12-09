/**
 * Handler Factory
 *
 * Selects the appropriate handler based on model and settings.
 * M40-02: Centralized handler selection logic
 */

import type { ChatHandler } from '../types';
import { OpenAIHandler } from './openai-handler';
import { ClaudeHandler } from './claude-handler';
import { VercelHandler } from './vercel-handler';

// ============================================================================
// HANDLER INSTANCES
// ============================================================================

const openaiHandler = new OpenAIHandler();
const claudeHandler = new ClaudeHandler();
const vercelHandler = new VercelHandler();

// Handler priority order
const handlers: ChatHandler[] = [
  openaiHandler,  // OpenAI Gateway for openai/* models
  claudeHandler,  // Claude SDK for anthropic/* models (without web search)
  vercelHandler,  // Vercel AI SDK fallback for everything else
];

// ============================================================================
// FACTORY
// ============================================================================

/**
 * Get the appropriate handler for the given model and settings.
 *
 * Handler selection priority:
 * 1. OpenAI models (openai/*) → OpenAIHandler
 * 2. Claude models (anthropic/*) without webSearch → ClaudeHandler
 * 3. Everything else → VercelHandler (fallback)
 */
export function getHandler(model: string, webSearch: boolean): ChatHandler {
  for (const handler of handlers) {
    if (handler.canHandle(model, webSearch)) {
      return handler;
    }
  }

  // Should never reach here since VercelHandler always returns true
  return vercelHandler;
}
