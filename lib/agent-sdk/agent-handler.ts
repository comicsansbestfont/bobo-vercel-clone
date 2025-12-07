/**
 * M4: Claude Agent SDK Handler
 *
 * DISABLED: The Claude Agent SDK requires a CLI executable that is not available
 * in serverless environments like Vercel. Agent mode is currently unavailable.
 *
 * This stub returns a user-friendly error message.
 */

import { UIMessage } from 'ai';

export interface AgentModeRequest {
  messages: UIMessage[];
  model: string;
  chatId?: string;
  projectId?: string;
}

/**
 * Handle agent mode requests - DISABLED
 *
 * Returns an error explaining that agent mode is not available on Vercel.
 */
export async function handleAgentMode(
  _request: AgentModeRequest
): Promise<Response> {
  return new Response(
    JSON.stringify({
      error: 'Agent Mode is not available in this deployment. The Claude Agent SDK requires a local CLI executable that cannot run in serverless environments like Vercel. Please use regular chat mode instead.'
    }),
    {
      status: 501, // Not Implemented
      headers: { 'Content-Type': 'application/json' }
    }
  );
}
