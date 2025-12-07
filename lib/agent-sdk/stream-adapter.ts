/**
 * M4: Agent Response Stream Adapter
 *
 * DISABLED: The Claude Agent SDK is not available in serverless environments.
 * This is a stub module that exports types but no functionality.
 */

/**
 * UI-friendly stream chunk types
 */
export interface UIStreamChunk {
  type: 'text' | 'tool-start' | 'tool-result' | 'error' | 'thinking';
  content?: string;
  toolName?: string;
  toolInput?: Record<string, unknown>;
  toolCallId?: string;
  output?: string;
  duration?: number;
  success?: boolean;
}

/**
 * Stream agent response - DISABLED
 *
 * This function is not available in serverless environments.
 */
export async function* streamAgentResponse(
  _prompt: string,
  _options: Record<string, unknown>
): AsyncGenerator<UIStreamChunk> {
  yield {
    type: 'error',
    content: 'Agent Mode is not available in this deployment.',
  };
}
