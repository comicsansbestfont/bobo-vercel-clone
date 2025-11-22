/**
 * AI Model Provider Configuration
 *
 * Configures the AI SDK to work with Vercel AI Gateway
 * which provides unified access to multiple LLM providers
 */

import { createOpenAI } from '@ai-sdk/openai';

// Create OpenAI provider configured with Vercel AI Gateway
// The gateway supports model format: "provider/model-name"
const gateway = createOpenAI({
  apiKey: process.env.AI_GATEWAY_API_KEY || '',
  baseURL: 'https://ai-gateway.vercel.sh/v1',
  name: 'vercel-ai-gateway',
});

/**
 * Get model instance from model identifier string
 * Format: "provider/model-name" (e.g., "anthropic/claude-sonnet-4", "openai/gpt-5")
 */
export function getModel(modelId: string) {
  // The Vercel AI Gateway accepts models in "provider/model-name" format directly
  return gateway(modelId);
}
