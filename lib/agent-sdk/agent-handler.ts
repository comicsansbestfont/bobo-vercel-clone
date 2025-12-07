/**
 * M4: Claude Agent SDK Handler
 *
 * This module handles agent mode requests, routing them through the Claude Agent SDK
 * with memory (M3) and project context (M2) integration.
 *
 * M4-02: Added feature parity with regular chat:
 * - M4-12: Embedding generation for agent messages
 * - M4-15: Update last_message_at on agent messages
 */

import { query, type Options as AgentOptions } from '@anthropic-ai/claude-agent-sdk';
import { UIMessage } from 'ai';
import { chatLogger } from '@/lib/logger';
import { buildMemoryContext } from './memory-integration';
import { buildProjectContext } from './project-integration';
import { buildGlobalSearchContext } from './global-search-integration';
import { searchKnowledge } from './knowledge-search';
import { FULL_AGENT_TOOL_CONFIG } from './tool-config';
import { SAFETY_HOOKS } from './safety-hooks';
import { streamAgentResponse, type UIStreamChunk } from './stream-adapter';
import { isClaudeModel, getToolEmoji } from './utils';
import {
  trackGlobalSources,
  citationsToMessageParts,
  insertInlineCitations,
  type Citation,
} from '@/lib/ai/source-tracker';
import type { SearchResult } from '@/lib/db/types';
import {
  createChat,
  createMessage,
  updateChat,
  getChat,
  type MessagePart,
} from '@/lib/db';
import { encode } from 'gpt-tokenizer';
import { embedAndSaveMessage } from '@/lib/ai/embedding';

/**
 * Helper function to count tokens for message parts
 */
function getTokenCount(parts: MessagePart[]): number {
  if (!parts || !Array.isArray(parts)) return 0;
  const text = parts
    .map((part) => {
      if (part.type === 'text' && part.text) return part.text;
      if (part.type === 'reasoning' && part.text) return `[Reasoning]\n${part.text}`;
      return '';
    })
    .filter(Boolean)
    .join('\n')
    .trim();

  try {
    return encode(text).length;
  } catch {
    // Fallback: estimate 1 token per 4 characters
    return Math.ceil(text.length / 4);
  }
}

/**
 * Trigger background memory extraction (M3.5-4)
 * Fire-and-forget async extraction that doesn't block chat responses
 */
function triggerMemoryExtraction(chatId: string) {
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const host = process.env.VERCEL_URL || 'localhost:3000';
  const url = `${protocol}://${host}/api/memory/extract-background`;

  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chatId }),
  }).catch(err => chatLogger.error('[Agent] Background extraction failed:', err));
}

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

    // Extract the last user message as the prompt FIRST (needed for global search)
    const lastUserMessage = messages[messages.length - 1];
    const userPrompt = extractTextFromMessage(lastUserMessage);

    if (!userPrompt) {
      return new Response(
        JSON.stringify({ error: 'No user message provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build context from memory and project
    const memoryContext = await buildMemoryContext();
    const projectContext = activeProjectId
      ? await buildProjectContext(activeProjectId)
      : '';

    // M4-13: Build global search context (Loop B)
    const { context: globalContext, sources: globalSearchSources } = await buildGlobalSearchContext(
      userPrompt,
      activeProjectId
    );

    // M3.8: Pre-flight knowledge search (advisory files + memory)
    const knowledgeResult = await searchKnowledge(userPrompt);
    chatLogger.debug('Knowledge search complete:', {
      intent: knowledgeResult.intent.category,
      advisory: knowledgeResult.sourceCounts.advisory,
      memory: knowledgeResult.sourceCounts.memory,
    });

    // Build system prompt with all contexts
    const systemPrompt = buildAgentSystemPrompt(
      memoryContext,
      projectContext,
      globalContext,
      knowledgeResult.context
    );

    // Save user message to database BEFORE streaming
    const userMessageParts: MessagePart[] = [{ type: 'text', text: userPrompt }];
    const savedUserMessage = await createMessage({
      chat_id: activeChatId,
      role: 'user',
      content: { parts: userMessageParts },
      token_count: getTokenCount(userMessageParts),
    });
    chatLogger.debug('Agent: User message saved to database');

    // M4-12: Generate embedding for user message (background, non-blocking)
    if (savedUserMessage?.id) {
      embedAndSaveMessage(savedUserMessage.id, userPrompt)
        .catch(err => chatLogger.error('User embedding failed:', err));
    }

    // Update chat title from first message if it's a new chat
    if (!providedChatId) {
      const title = userPrompt.split(/[.!?]/)[0].slice(0, 50).trim();
      if (title && title !== 'New Chat (Agent)') {
        await updateChat(activeChatId, { title });
      }
    }

    // Configure agent options
    const agentOptions: Partial<AgentOptions> = {
      model: mapModelToAgentModel(model),
      systemPrompt,
      ...FULL_AGENT_TOOL_CONFIG,
      hooks: SAFETY_HOOKS,
      permissionMode: 'default', // Require user confirmation for writes
    };

    // Create streaming response with message persistence
    // M4-14: Pass global search sources for citation tracking
    const stream = createAgentStream(userPrompt, agentOptions, activeChatId, globalSearchSources);

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

  // Map to SDK expected format (Claude 4.5 models)
  const modelMap: Record<string, string> = {
    // Claude 4.5 models
    'claude-sonnet-4-5-20250929': 'claude-sonnet-4-5-20250929',
    'claude-opus-4-5-20251101': 'claude-opus-4-5-20251101',
    'claude-haiku-4-5-20251001': 'claude-haiku-4-5-20251001',
    // Legacy mappings for backward compatibility
    'claude-opus-4-20250929': 'claude-opus-4-5-20251101',
    'claude-3-5-sonnet-20241022': 'claude-sonnet-4-5-20250929',
    'claude-3-opus-20240229': 'claude-opus-4-5-20251101',
  };

  return modelMap[modelName] || 'claude-sonnet-4-5-20250929';
}

/**
 * Build system prompt with memory, project context, global search, and knowledge context
 *
 * M4-13: Added globalContext parameter for Loop B integration
 * M3.8: Added knowledgeContext for pre-flight advisory/memory search
 */
function buildAgentSystemPrompt(
  memoryContext: string,
  projectContext: string,
  globalContext: string = '',
  knowledgeContext: string = ''
): string {
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

  // M4-13: Add global search context (Loop B)
  if (globalContext) {
    prompt += `\n\n${globalContext}`;
  }

  // M3.8: Add knowledge context (pre-flight advisory/memory search)
  if (knowledgeContext) {
    prompt += `\n\n${knowledgeContext}`;
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
 * Collects the response and saves it to the database after streaming completes
 *
 * M4-14: Added globalSearchSources parameter for citation tracking
 */
function createAgentStream(
  prompt: string,
  options: Partial<AgentOptions>,
  chatId: string,
  globalSearchSources: SearchResult[] = []
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      // Collect the full response for database persistence
      let fullTextResponse = '';
      let hasThinking = false;
      let thinkingContent = '';

      try {
        // Emit stream start
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'start' })}\n\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'start-step' })}\n\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text-start', id: '0' })}\n\n`));

        // Stream agent response and collect for persistence
        for await (const chunk of streamAgentResponse(prompt, options)) {
          const event = formatChunkAsSSE(chunk);
          if (event) {
            controller.enqueue(encoder.encode(event));
          }

          // Collect text content for database persistence
          if (chunk.type === 'text' && chunk.content) {
            fullTextResponse += chunk.content;
          } else if (chunk.type === 'thinking' && chunk.content) {
            hasThinking = true;
            thinkingContent += chunk.content;
          } else if (chunk.type === 'tool-start' && chunk.toolName) {
            fullTextResponse += `\n\n${getToolEmoji(chunk.toolName)} **${chunk.toolName}**\n`;
          } else if (chunk.type === 'tool-result') {
            const statusIcon = chunk.success ? '✅' : '❌';
            const durationStr = chunk.duration ? ` • ${chunk.duration}ms` : '';
            fullTextResponse += `${statusIcon} Completed${durationStr}\n`;
            if (chunk.output) {
              const outputStr = typeof chunk.output === 'string' ? chunk.output : JSON.stringify(chunk.output, null, 2);
              if (outputStr.length > 200) {
                fullTextResponse += `\`\`\`\n${outputStr.slice(0, 200)}...\n\`\`\`\n\n`;
              } else {
                fullTextResponse += `\`\`\`\n${outputStr}\n\`\`\`\n\n`;
              }
            }
          }
        }

        // Emit stream end
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text-end', id: '0' })}\n\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'finish-step' })}\n\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'finish', finishReason: 'stop' })}\n\n`));
        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));

        // Save assistant message to database AFTER streaming completes
        const assistantParts: MessagePart[] = [];

        // Add thinking/reasoning part if present
        if (hasThinking && thinkingContent) {
          assistantParts.push({ type: 'reasoning', text: thinkingContent });
        }

        // M4-14: Track global sources and create citations
        let finalTextResponse = fullTextResponse.trim();
        const allCitations: Citation[] = [];

        if (globalSearchSources.length > 0 && finalTextResponse) {
          try {
            // Create a simple project names map (we don't have project names in SearchResult)
            const projectNamesMap = new Map<string, string>();

            // Track global sources
            const globalCitations = await trackGlobalSources(
              globalSearchSources,
              projectNamesMap,
              1 // Start at index 1
            );
            allCitations.push(...globalCitations);

            // Insert inline citations if we have any
            if (allCitations.length > 0) {
              const citationResult = insertInlineCitations(finalTextResponse, allCitations);
              finalTextResponse = citationResult.text;
            }
          } catch (err) {
            chatLogger.error('Citation tracking failed:', err);
            // Continue without citations - graceful degradation
          }
        }

        // Add text response
        if (finalTextResponse) {
          assistantParts.push({ type: 'text', text: finalTextResponse });
        }

        // M4-14: Append source metadata as separate parts for UI rendering
        if (allCitations.length > 0) {
          const sourceParts = citationsToMessageParts(allCitations);
          assistantParts.push(...sourceParts);
          chatLogger.debug('Agent: Added citation parts to message', { count: sourceParts.length });
        }

        if (assistantParts.length > 0) {
          const savedAssistantMessage = await createMessage({
            chat_id: chatId,
            role: 'assistant',
            content: { parts: assistantParts },
            token_count: getTokenCount(assistantParts),
          });
          chatLogger.debug('Agent: Assistant message saved to database');

          // M4-15: Update last_message_at for chat
          await updateChat(chatId, { last_message_at: new Date().toISOString() });

          // M4-12: Generate embedding for assistant message (background, non-blocking)
          if (savedAssistantMessage?.id && finalTextResponse) {
            embedAndSaveMessage(savedAssistantMessage.id, finalTextResponse)
              .catch(err => chatLogger.error('Assistant embedding failed:', err));
          }

          // Trigger memory extraction after saving
          triggerMemoryExtraction(chatId);
        }

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
 *
 * IMPORTANT: The AI SDK's useChat hook only recognizes specific event types.
 * Tool events are converted to text-delta format to display as formatted text.
 */
function formatChunkAsSSE(chunk: UIStreamChunk): string | null {
  switch (chunk.type) {
    case 'text':
      if (chunk.content) {
        return formatSseEvent({ type: 'text-delta', id: '0', delta: chunk.content });
      }
      return null;

    case 'tool-start': {
      // Convert tool-start to formatted text with tool-specific emoji
      const toolEmoji = getToolEmoji(chunk.toolName || '');
      const toolStartText = `\n\n${toolEmoji} **${chunk.toolName}**\n`;
      const textEvent = formatSseEvent({ type: 'text-delta', id: '0', delta: toolStartText });
      const dataEvent = formatSseEvent({
        type: 'data-tool-step',
        transient: true,
        data: {
          id: chunk.toolCallId || chunk.toolName || `tool-${Date.now()}`,
          toolName: chunk.toolName,
          status: 'active',
          input: chunk.toolInput,
        },
      });
      return textEvent + dataEvent;
    }

    case 'tool-result': {
      // Convert tool-result to formatted text with collapsible long output
      const statusIcon = chunk.success ? '✅' : '❌';
      const durationStr = chunk.duration ? ` • ${chunk.duration}ms` : '';
      let resultText = `${statusIcon} Completed${durationStr}\n`;

      // Include output with collapsible details for long content
      if (chunk.output) {
        const outputStr = typeof chunk.output === 'string'
          ? chunk.output
          : JSON.stringify(chunk.output, null, 2);

        // Use collapsible <details> for long outputs (>200 chars)
        if (outputStr.length > 200) {
          resultText += `<details>\n<summary>View output (${outputStr.length} chars)</summary>\n\n\`\`\`\n${outputStr}\n\`\`\`\n</details>\n\n`;
        } else {
          resultText += `\`\`\`\n${outputStr}\n\`\`\`\n\n`;
        }
      } else {
        resultText += '\n';
      }

      const textEvent = formatSseEvent({ type: 'text-delta', id: '0', delta: resultText });
      const dataEvent = formatSseEvent({
        type: 'data-tool-step',
        transient: true,
        data: {
          id: chunk.toolCallId || chunk.toolName || `tool-${Date.now()}`,
          toolName: chunk.toolName,
          status: 'complete',
          success: chunk.success !== false,
          output: chunk.output,
          duration: chunk.duration,
        },
      });
      return textEvent + dataEvent;
    }

    case 'thinking':
      // Emit thinking content in parseable <thinking> blocks for Reasoning component
      if (chunk.content) {
        const thinkingBlock = `\n\n<thinking>\n${chunk.content}\n</thinking>\n\n`;
        return `data: ${JSON.stringify({ type: 'text-delta', id: '0', delta: thinkingBlock })}\n\n`;
      }
      return null;

    case 'error':
      // Convert error to text-delta as well (error type may not be recognized)
      const errorText = `\n\n❌ **Error:** ${chunk.content}\n\n`;
      return `data: ${JSON.stringify({ type: 'text-delta', id: '0', delta: errorText })}\n\n`;

    default:
      return null;
  }
}

/**
 * Format a single SSE event line
 */
function formatSseEvent(payload: unknown): string {
  return `data: ${JSON.stringify(payload)}\n\n`;
}
