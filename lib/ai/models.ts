/**
 * AI Model Provider Configuration
 *
 * Configures the AI SDK to work with Vercel AI Gateway
 * which provides unified access to multiple LLM providers
 */

import { createOpenAI } from '@ai-sdk/openai';

// Create OpenAI provider configured with Vercel AI Gateway.
// IMPORTANT: The AI SDK OpenAI provider defaults to the new Responses API,
// but Vercel AI Gateway expects the OpenAI-compatible /chat/completions
// endpoint. Calling `.chat()` ensures requests go to /chat/completions
// instead of /responses, avoiding 405 responses from the gateway.
const openaiGateway = createOpenAI({
  apiKey: process.env.AI_GATEWAY_API_KEY || '',
  baseURL: 'https://ai-gateway.vercel.sh/v1',
  name: 'vercel-ai-gateway',
});

/**
 * Get a model instance from a model identifier string.
 * Accepts any provider/model value (e.g., "openai/gpt-4o", "anthropic/claude-3.5-sonnet",
 * "google/gemini-2.5-flash", "perplexity/sonar"). If no provider is given, we default
 * to "openai".
 */
export function getModel(modelId: string) {
  const normalizedModelId = modelId.includes('/')
    ? modelId
    : `openai/${modelId}`;

  // Always use the chat-completions API via the gateway to avoid /responses 405s.
  // The gateway routes provider/model IDs to the correct upstream.
  return openaiGateway.chat(normalizedModelId);
}
