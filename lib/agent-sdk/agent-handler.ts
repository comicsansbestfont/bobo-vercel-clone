/**
 * M4: Claude Agent SDK Handler
 *
 * This module handles agent mode requests, routing them through the Claude Agent SDK
 * with memory (M3) and project context (M2) integration.
 */

import { query, type Options as AgentOptions } from '@anthropic-ai/claude-agent-sdk';
import { UIMessage } from 'ai';
import { chatLogger } from '@/lib/logger';
import { buildMemoryContext } from './memory-integration';
import { buildProjectContext } from './project-integration';
import { FULL_AGENT_TOOL_CONFIG } from './tool-config';
import { SAFETY_HOOKS } from './safety-hooks';
import { streamAgentResponse, type UIStreamChunk } from './stream-adapter';
import { isClaudeModel } from './utils';
import {
  createChat,
  createMessage,
  updateChat,
  getChat,
  type MessagePart,
} from '@/lib/db';

export interface AgentModeRequest {
  messages: UIMessage[];
  model: string;
  chatId?: string;
  projectId?: string;
}

/**
 * Handle agent mode requests through the Claude Agent SDK
 */
export async function handleAgentMode(
  request: AgentModeRequest
): Promise<Response> {
  const { messages, model, chatId: providedChatId, projectId } = request;

  chatLogger.debug('Agent Mode Request:', {
    model,
    chatId: providedChatId,
    projectId,
    msgCount: messages?.length
  });

  // Validate that we have an Anthropic API key
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({
        error: 'ANTHROPIC_API_KEY is not configured. Agent Mode requires a direct Anthropic API key.'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  // Validate model is Claude
  if (!isClaudeModel(model)) {
    return new Response(
      JSON.stringify({
        error: 'Agent Mode is only available for Claude models. Please select a Claude model.'
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    // Create or get chat
    let activeChatId = providedChatId;
    if (!activeChatId) {
      const newChat = await createChat({
        title: 'New Chat (Agent)',
        model: model,
        web_search_enabled: false,
        project_id: projectId || null,
      });

      if (!newChat) {
        return new Response(
          JSON.stringify({ error: 'Unable to create chat session.' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }

      activeChatId = newChat.id;
    }

    // Get active project ID
    let activeProjectId = projectId;
    const chat = await getChat(activeChatId);
    if (chat?.project_id) {
      activeProjectId = chat.project_id;
    }

    // Build context from memory and project
    const memoryContext = await buildMemoryContext();
    const projectContext = activeProjectId
      ? await buildProjectContext(activeProjectId)
      : '';

    // Build system prompt
    const systemPrompt = buildAgentSystemPrompt(memoryContext, projectContext);

    // Extract the last user message as the prompt
    const lastUserMessage = messages[messages.length - 1];
    const userPrompt = extractTextFromMessage(lastUserMessage);

    if (!userPrompt) {
      return new Response(
        JSON.stringify({ error: 'No user message provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Configure agent options
    const agentOptions: Partial<AgentOptions> = {
      model: mapModelToAgentModel(model),
      systemPrompt,
      ...FULL_AGENT_TOOL_CONFIG,
      hooks: SAFETY_HOOKS,
      permissionMode: 'default', // Require user confirmation for writes
    };

    // Create streaming response
    const stream = createAgentStream(userPrompt, agentOptions, activeChatId);

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Chat-Id': activeChatId,
        'X-Agent-Mode': 'true',
      },
    });

  } catch (error) {
    chatLogger.error('Agent Mode error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Agent Mode error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// isClaudeModel is imported from ./utils to allow use in client components

/**
 * Map gateway model ID to Agent SDK model format
 */
function mapModelToAgentModel(model: string): string {
  // Remove provider prefix if present
  const modelName = model.replace(/^anthropic\//, '');

  // Map to SDK expected format
  const modelMap: Record<string, string> = {
    'claude-sonnet-4-5-20250929': 'claude-sonnet-4-5-20250929',
    'claude-opus-4-20250929': 'claude-opus-4-20250929',
    'claude-3-5-sonnet-20241022': 'claude-sonnet-4-5-20250929',
    'claude-3-opus-20240229': 'claude-opus-4-20250929',
  };

  return modelMap[modelName] || 'claude-sonnet-4-5-20250929';
}

/**
 * Build system prompt with memory and project context
 */
function buildAgentSystemPrompt(memoryContext: string, projectContext: string): string {
  let prompt = `You are Bobo, a helpful AI assistant with agent capabilities.

You can read files, search codebases, edit code, and execute commands to help the user.

IMPORTANT GUIDELINES:
- Be helpful and concise
- When making changes, explain what you're doing
- Ask for confirmation before making significant changes
- Respect the user's project structure and coding style`;

  if (memoryContext) {
    prompt += `\n\n${memoryContext}`;
  }

  if (projectContext) {
    prompt += `\n\n${projectContext}`;
  }

  return prompt;
}

/**
 * Extract text content from a UIMessage
 */
function extractTextFromMessage(message: UIMessage | undefined): string {
  if (!message) return '';

  if (!message.parts || !Array.isArray(message.parts)) {
    return '';
  }

  return message.parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text' && typeof p.text === 'string')
    .map(p => p.text)
    .join('\n');
}

/**
 * Create a streaming response from the Agent SDK
 */
function createAgentStream(
  prompt: string,
  options: Partial<AgentOptions>,
  chatId: string
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        // Emit stream start
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'start' })}\n\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'start-step' })}\n\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text-start', id: '0' })}\n\n`));

        // Stream agent response
        for await (const chunk of streamAgentResponse(prompt, options)) {
          const event = formatChunkAsSSE(chunk);
          if (event) {
            controller.enqueue(encoder.encode(event));
          }
        }

        // Emit stream end
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text-end', id: '0' })}\n\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'finish-step' })}\n\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'finish', finishReason: 'stop' })}\n\n`));
        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));

        controller.close();
      } catch (error) {
        chatLogger.error('Agent stream error:', error);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            error: error instanceof Error ? error.message : 'Stream error'
          })}\n\n`)
        );
        controller.close();
      }
    },
  });
}

/**
 * Format a stream chunk as an SSE event
 */
function formatChunkAsSSE(chunk: UIStreamChunk): string | null {
  switch (chunk.type) {
    case 'text':
      if (chunk.content) {
        return `data: ${JSON.stringify({ type: 'text-delta', id: '0', delta: chunk.content })}\n\n`;
      }
      return null;

    case 'tool-start':
      return `data: ${JSON.stringify({
        type: 'tool-start',
        toolName: chunk.toolName,
        toolInput: chunk.toolInput
      })}\n\n`;

    case 'tool-result':
      return `data: ${JSON.stringify({
        type: 'tool-result',
        toolName: chunk.toolName,
        output: chunk.output,
        duration: chunk.duration,
        success: chunk.success
      })}\n\n`;

    case 'error':
      return `data: ${JSON.stringify({
        type: 'error',
        error: chunk.content
      })}\n\n`;

    default:
      return null;
  }
}
