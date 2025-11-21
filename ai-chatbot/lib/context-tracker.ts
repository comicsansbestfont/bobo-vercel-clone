import type { UIMessage } from 'ai';
import { encode, encodeChat } from 'gpt-tokenizer';

// Context window limits for different AI models (in tokens)
// Based on Vercel AI Gateway specifications
export const MODEL_CONTEXT_LIMITS: Record<string, number> = {
  // OpenAI models
  'openai/gpt-4o': 128_000,
  'openai/gpt-5-pro': 200_000,
  'openai/gpt-5-mini': 128_000,
  'openai/gpt-5.1-thinking': 200_000,
  'openai/gpt-5.1-instant': 128_000,
  'openai/gpt-5': 200_000,
  'openai/gpt-5-chat': 200_000,
  'openai/gpt-4o-mini': 128_000,
  
  // Anthropic models
  'anthropic/claude-sonnet-4.5': 200_000,
  'anthropic/claude-opus-4': 200_000,
  'anthropic/claude-3.5-sonnet': 200_000,
  'anthropic/claude-3-opus': 200_000,
  'anthropic/claude-haiku-4.5': 200_000,
  
  // Google models
  'google/gemini-3-pro-preview': 1_000_000,
  'google/gemini-2.5-flash': 1_000_000,
  'google/gemini-2.0-flash': 1_000_000,
  'google/gemini-2.5-pro': 2_000_000,
  
  // Deepseek models
  'deepseek/deepseek-r1': 128_000,
  'deepseek/deepseek-v3': 128_000,
  
  // Perplexity (for web search)
  'perplexity/sonar': 128_000,
  'perplexity/sonar-pro': 200_000,
};

const TOKEN_WARNING_THRESHOLD = 0.7;
const TOKEN_CRITICAL_THRESHOLD = 0.9;

type UsageState = 'safe' | 'warning' | 'critical';

type UIPart = {
  type?: string;
  text?: string;
  url?: string;
  result?: string;
};

/**
 * Lightweight fallback heuristic when tokenizer is unavailable.
 */
function heuristicTokenEstimate(text: string): number {
  return Math.ceil(text.length / 4);
}

function extractTextFromMessage(message: UIMessage): string {
  const parts = message.parts as UIPart[] | undefined;
  if (!parts || !Array.isArray(parts)) {
    return '';
  }

  return parts
    .map((part) => {
      if (part?.type === 'text' && typeof part.text === 'string') {
        return part.text;
      }
      if (part?.type === 'reasoning' && typeof part.text === 'string') {
        return `[Reasoning]\n${part.text}`;
      }
      if (part?.type === 'source-url' && typeof part.url === 'string') {
        return `[Source] ${part.url}`;
      }
      if (part?.type === 'tool-result' && typeof part.result === 'string') {
        return `[Tool Result]\n${part.result}`;
      }
      if (typeof part?.text === 'string') {
        return part.text;
      }
      return '';
    })
    .filter(Boolean)
    .join('\n')
    .trim();
}

function buildChatTranscript(
  messages: UIMessage[],
  currentInput: string
): { role: string; content: string }[] {
  const chat = messages
    .map((message) => ({
      role: message.role,
      content: extractTextFromMessage(message),
    }))
    .filter((entry) => entry.content.length > 0);

  if (currentInput?.trim()) {
    chat.push({ role: 'user', content: currentInput.trim() });
  }

  return chat;
}

export function countTokensWithFallback(
  messages: UIMessage[],
  currentInput: string
): number {
  const chatTranscript = buildChatTranscript(messages, currentInput);

  if (chatTranscript.length === 0) {
    return 0;
  }

  try {
    return encodeChat(chatTranscript as any).length;
  } catch (err) {
    console.warn('Tokenizer fallback triggered', err);
    const fallbackText = chatTranscript
      .map((segment) => `${segment.role}: ${segment.content}`)
      .join('\n');
    return heuristicTokenEstimate(fallbackText);
  }
}

export function getUsageState(
  tokensUsed: number,
  contextLimit: number
): UsageState {
  const ratio = tokensUsed / contextLimit;
  if (ratio >= TOKEN_CRITICAL_THRESHOLD) {
    return 'critical';
  }
  if (ratio >= TOKEN_WARNING_THRESHOLD) {
    return 'warning';
  }
  return 'safe';
}

/**
 * Gets context usage information for the current conversation
 */
export function getContextUsage(
  messages: UIMessage[],
  currentInput: string,
  modelId: string
): {
  tokensUsed: number;
  contextLimit: number;
  percentage: number;
  usageState: UsageState;
  segments: {
    system: number;
    history: number;
    draft: number;
  };
} {
  const tokensUsed = countTokensWithFallback(messages, currentInput);
  const contextLimit = MODEL_CONTEXT_LIMITS[modelId] || 128_000; // Default to 128k
  const percentage = Math.min(100, (tokensUsed / contextLimit) * 100);

  const systemTokens = messages
    .filter((message) => message.role === 'system')
    .reduce((sum, message) => sum + encode(extractTextFromMessage(message)).length, 0);

  const draftTokens = currentInput?.trim()
    ? encode(currentInput.trim()).length
    : 0;

  const historyTokens = Math.max(tokensUsed - systemTokens - draftTokens, 0);

  return {
    tokensUsed,
    contextLimit,
    percentage,
    usageState: getUsageState(tokensUsed, contextLimit),
    segments: {
      system: systemTokens,
      history: historyTokens,
      draft: draftTokens,
    },
  };
}

/**
 * Formats token count with thousands separators
 */
export function formatTokenCount(tokens: number): string {
  return tokens.toLocaleString();
}

