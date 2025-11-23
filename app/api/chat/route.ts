import { streamText, UIMessage, convertToModelMessages } from 'ai';
type ChatCompletionChoiceDelta =
  | string
  | Array<{ type?: string; text?: string }>
  | undefined;
type ChatCompletionChunk = {
  choices?: Array<{
    delta?: {
      content?: ChatCompletionChoiceDelta;
    };
  }>;
};
import { encode } from 'gpt-tokenizer';
import {
  createChat,
  createMessage,
  updateChat,
  getChat,
  getProject,
  type MessagePart,
  type MessageContent,
  type SearchResult,
} from '@/lib/db';
import { getModel } from '@/lib/ai/models';
import { getProjectContext, prepareSystemPrompt, type ProjectContext } from '@/lib/ai/context-manager';
import { hybridSearch } from '@/lib/db';
import { generateEmbedding, embedAndSaveMessage } from '@/lib/ai/embedding';
import {
  trackProjectSources,
  trackGlobalSources,
  insertInlineCitations,
  citationsToMessageParts,
  type Citation,
} from '@/lib/ai/source-tracker';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// Disable the SDK warning about non-OpenAI reasoning
if (typeof globalThis !== 'undefined') {
  (globalThis as any).AI_SDK_LOG_WARNINGS = false;
}

/**
 * Helper function to count tokens for message parts
 */
function getTokenCount(parts: MessagePart[]): number {
  if (!parts || !Array.isArray(parts)) return 0;
  const text = parts
    .map((part) => {
      if (part.type === 'text' && part.text) return part.text;
      if (part.type === 'reasoning' && part.text) return `[Reasoning]\n${part.text}`;
      if (part.type === 'source-url' && part.url) return `[Source] ${part.url}`;
      if (part.type === 'tool-result' && part.result) return `[Tool Result]\n${part.result}`;
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
 * Helper function to auto-generate chat title from first message
 */
async function updateChatTitleFromMessage(
  chatId: string,
  messageText: string
): Promise<void> {
  // Generate title: First 50 chars or first sentence
  const title = messageText
    .split(/[.!?]/)[0]
    .slice(0, 50)
    .trim();

  if (title && title !== 'New Chat') {
    await updateChat(chatId, { title });
  }
}

export async function POST(req: Request) {
  try {
    const {
      messages,
      model,
      webSearch,
      chatId: providedChatId,
      projectId,
    }: {
      messages: UIMessage[];
      model: string;
      webSearch: boolean;
      chatId?: string;
      projectId?: string;
    } = await req.json();
    console.log('[DEBUG] Chat Request:', { model, chatId: providedChatId, projectId, msgCount: messages?.length });

    // Check if API key is configured
    if (!process.env.AI_GATEWAY_API_KEY) {
      return new Response(
        JSON.stringify({
          error: 'AI_GATEWAY_API_KEY is not configured. Please add it to your .env.local file.'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // If no chatId provided, create new chat
    let activeChatId = providedChatId;
    if (!activeChatId) {
      const newChat = await createChat({
        title: 'New Chat',
        model: model,
        web_search_enabled: webSearch,
        project_id: projectId || null,
      });

      if (!newChat) {
        return new Response(
          JSON.stringify({ error: 'Failed to create chat' }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      activeChatId = newChat.id;
    }

    // Fetch custom instructions from project if chat belongs to one
    let customInstructions = '';
    let activeProjectId = projectId;

    const chat = await getChat(activeChatId);
    if (chat && chat.project_id) {
      activeProjectId = chat.project_id;
      const project = await getProject(chat.project_id);
      if (project && project.custom_instructions) {
        customInstructions = project.custom_instructions;
      }
    }

    // Prepare System Prompt with Context Caching (Loop A)
    let systemPrompt = customInstructions
      ? `${customInstructions}\n\nYou are a helpful assistant that can answer questions and help with tasks`
      : 'You are a helpful assistant that can answer questions and help with tasks';

    // Store context for source tracking later
    let projectContext: ProjectContext | null = null;
    let projectName = '';

    if (activeProjectId) {
      try {
        projectContext = await getProjectContext(activeProjectId);
        const prepared = prepareSystemPrompt(systemPrompt, projectContext, model);
        systemPrompt = prepared.system;

        // Get project name for citations
        const project = await getProject(activeProjectId);
        projectName = project?.name || 'Current Project';
      } catch (err) {
        console.error('[api/chat] failed to load project context', err);
      }
    }

    // Hybrid Search (Loop B)
    // Search for relevant global context from other projects
    let globalContext = '';
    let searchResults: SearchResult[] = [];
    try {
      const lastUserMessage = messages[messages.length - 1];
      console.log('[DEBUG] Last User Message:', lastUserMessage);

      let userText = '';
      if (lastUserMessage) {
        if (typeof (lastUserMessage as any).content === 'string') {
          userText = (lastUserMessage as any).content;
        } else if (Array.isArray(lastUserMessage.parts)) {
          userText = lastUserMessage.parts
            .filter(p => p.type === 'text')
            .map(p => p.text)
            .join(' ');
        }
      }

      if (userText) {
        const queryEmbedding = await generateEmbedding(userText);
        searchResults = await hybridSearch(
          queryEmbedding,
          0.82, // High threshold for "Wisdom"
          5,    // Top 5 results
          activeProjectId || '00000000-0000-0000-0000-000000000000' // Empty UUID if no project
        );

        if (searchResults.length > 0) {
          const globalSnippets = searchResults
            .filter((r: SearchResult) => r.source_type === 'global')
            .map((r: SearchResult) => `- ${r.content}`)
            .join('\n');

          if (globalSnippets) {
            globalContext = `
### RELEVANT MEMORY & ASSOCIATIONS (Inspiration)
The following information is from your PAST WORK in other projects.
<global_context>
${globalSnippets}
</global_context>
INSTRUCTION: These are for INSPIRATION and PATTERN MATCHING only.
- If the user asks for a strategy, look here for what worked before.
- If the user is writing content, look here for connecting ideas.
- WARNING: Do NOT use names, specific IDs, or confidential data points from this section unless explicitly asked to cross-reference.
`;
            // Append to system prompt
            systemPrompt += `\n\n${globalContext}`;
          }
        }
      }
    } catch (err) {
      console.error('[api/chat] hybrid search failed', err);
    }

    // Normalize roles to avoid invalid payloads to the gateway
    const allowedRoles = new Set<UIMessage['role']>(['system', 'user', 'assistant']);
    const normalizedMessages: UIMessage[] = (messages || []).map((msg, idx) => {
      if (!allowedRoles.has(msg.role)) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(
            '[api/chat] normalizing unsupported role to "user"',
            { idx, role: msg.role }
          );
        }
        return { ...msg, role: 'user' };
      }
      return msg;
    });

    const isOpenAIModel = model?.startsWith('openai/');
    const modelMessages = convertToModelMessages(normalizedMessages);

    if (isOpenAIModel) {
      // Direct gateway call with raw OpenAI-compatible payload to avoid SDK shaping issues.
      const messagesForPayload = normalizedMessages.map((msg) => {
        console.log('[DEBUG] Mapping msg:', msg);
        const content = typeof (msg as any).content === 'string'
          ? (msg as any).content
          : (msg.parts || [])
            .map((p) => ('text' in p && p.text ? p.text : ''))
            .join('');

        return {
          role: msg.role,
          content,
        };
      });

      // Prepend system message
      messagesForPayload.unshift({
        role: 'system',
        content: systemPrompt,
      });

      const payload = {
        model,
        messages: messagesForPayload,
        stream: true,
      };

      if (!process.env.AI_GATEWAY_API_KEY) {
        return new Response(
          JSON.stringify({
            error: 'AI_GATEWAY_API_KEY is not configured. Please add it to your .env.local file.',
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      const upstream = await fetch('https://ai-gateway.vercel.sh/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.AI_GATEWAY_API_KEY}`,
        },
        body: JSON.stringify(payload),
      });

      if (!upstream.ok) {
        const text = await upstream.text();
        console.error('[api/chat] openai upstream error', upstream.status, text);
        return new Response(
          JSON.stringify({ error: 'Upstream error', status: upstream.status, body: text }),
          {
            status: upstream.status,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      const transform = new TransformStream<Uint8Array, Uint8Array>();
      const writer = transform.writable.getWriter();
      const encoder = new TextEncoder();
      const reader = upstream.body?.getReader();
      const streamingDone = (() => {
        let resolve: () => void = () => { };
        const promise = new Promise<void>((r) => (resolve = r));
        return { promise, resolve };
      })();
      let assistantParts: MessagePart[] = [];
      let reasoningStarted = false;

      // Emit UIMessage stream start
      writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'start' })}\n\n`));
      writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'start-step' })}\n\n`));
      writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'text-start', id: '0' })}\n\n`));

      (async () => {
        try {
          let buffer = '';
          while (reader) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += new TextDecoder().decode(value);

            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (!line.startsWith('data:')) continue;
              const payloadStr = line.replace(/^data:\s*/, '');
              if (payloadStr === '[DONE]') {
                // Finish sequence
                writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'text-end', id: '0' })}\n\n`));
                writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'finish-step' })}\n\n`));
                writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'finish', finishReason: 'stop' })}\n\n`));
                break;
              }
              try {
                const chunk = JSON.parse(payloadStr) as ChatCompletionChunk;
                const delta = chunk.choices?.[0]?.delta?.content;
                if (typeof delta === 'string' && delta.length > 0) {
                  // Concatenate text deltas into a single part instead of creating multiple parts
                  const lastPart = assistantParts[assistantParts.length - 1];
                  if (lastPart && lastPart.type === 'text') {
                    lastPart.text += delta;
                  } else {
                    assistantParts.push({ type: 'text', text: delta });
                  }
                  writer.write(
                    encoder.encode(
                      `data: ${JSON.stringify({ type: 'text-delta', id: '0', delta })}\n\n`
                    )
                  );
                } else if (Array.isArray(delta)) {
                  // Handle array content parts
                  for (const d of delta) {
                    if (d?.type === 'text' && d.text) {
                      // Concatenate text deltas into a single part
                      const lastPart = assistantParts[assistantParts.length - 1];
                      if (lastPart && lastPart.type === 'text') {
                        lastPart.text += d.text;
                      } else {
                        assistantParts.push({ type: 'text', text: d.text });
                      }
                      writer.write(
                        encoder.encode(
                          `data: ${JSON.stringify({ type: 'text-delta', id: '0', delta: d.text })}\n\n`
                        )
                      );
                    } else if (d?.type === 'reasoning' && d.text) {
                      // Concatenate reasoning deltas into a single part
                      const lastPart = assistantParts[assistantParts.length - 1];
                      if (lastPart && lastPart.type === 'reasoning') {
                        lastPart.text += d.text;
                      } else {
                        assistantParts.push({ type: 'reasoning', text: d.text });
                      }
                      if (!reasoningStarted) {
                        reasoningStarted = true;
                        writer.write(
                          encoder.encode(
                            `data: ${JSON.stringify({ type: 'reasoning-start', id: 'r0' })}\n\n`
                          )
                        );
                      }
                      writer.write(
                        encoder.encode(
                          `data: ${JSON.stringify({ type: 'reasoning-delta', id: 'r0', delta: d.text })}\n\n`
                        )
                      );
                    }
                  }
                }
              } catch (err) {
                console.error('[api/chat] failed to parse upstream chunk', err);
              }
            }
          }
        } finally {
          if (reasoningStarted) {
            writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'reasoning-end', id: 'r0' })}\n\n`));
          }
          writer.write(encoder.encode(`data: [DONE]\n\n`));
          writer.close();
          streamingDone.resolve();
        }
      })();

      // Persist after streaming completes (fire and forget)
      streamingDone.promise
        .then(async () => {
          try {
            // Save last user message from this request
            const lastUser = [...normalizedMessages].reverse().find((m) => m.role === 'user');
            if (lastUser) {
              const userParts = (lastUser.parts || []) as MessagePart[];
              const userMsg = await createMessage({
                chat_id: activeChatId!,
                role: 'user',
                content: { parts: userParts },
                token_count: getTokenCount(userParts),
              });

              // Generate embedding for user message (background)
              if (userMsg) {
                const userText = userParts.filter(p => p.type === 'text').map(p => p.text).join(' ');
                if (userText) {
                  embedAndSaveMessage(userMsg.id, userText).catch(console.error);
                }
              }
              const firstTextPart = userParts.find((p) => p.type === 'text');
              if (firstTextPart?.text) {
                await updateChatTitleFromMessage(activeChatId!, firstTextPart.text);
              }
            }

            // Save assistant message with source tracking
            if (assistantParts.length > 0) {
              // Extract text from assistant parts for source tracking
              const assistantText = assistantParts
                .filter(p => p.type === 'text')
                .map(p => p.text)
                .join(' ');

              // Track sources and insert inline citations
              let finalText = assistantText;
              const allCitations: Citation[] = [];

              // Track project sources (Loop A)
              if (projectContext && projectContext.files.length > 0) {
                const projectCitations = trackProjectSources(assistantText, projectContext, projectName);
                allCitations.push(...projectCitations);
              }

              // Track global sources (Loop B)
              if (searchResults.length > 0) {
                const projectNamesMap = new Map<string, string>(); // TODO: Query project names from DB
                const globalCitations = trackGlobalSources(
                  searchResults,
                  projectNamesMap,
                  allCitations.length + 1
                );
                allCitations.push(...globalCitations);
              }

              // Insert inline citations if any sources were found
              if (allCitations.length > 0) {
                const citationResult = insertInlineCitations(assistantText, allCitations);
                finalText = citationResult.text;

                // Replace text parts with citation-enhanced text
                const textPartIndex = assistantParts.findIndex(p => p.type === 'text');
                if (textPartIndex >= 0) {
                  assistantParts[textPartIndex].text = finalText;
                }

                // Append source metadata as separate parts
                const sourceParts = citationsToMessageParts(allCitations);
                assistantParts.push(...sourceParts);
              }

              const assistantMsg = await createMessage({
                chat_id: activeChatId!,
                role: 'assistant',
                content: { parts: assistantParts },
                token_count: getTokenCount(assistantParts),
              });

              // Generate embedding for assistant message (background)
              if (assistantMsg) {
                const finalAssistantText = assistantParts.filter(p => p.type === 'text').map(p => p.text).join(' ');
                if (finalAssistantText) {
                  embedAndSaveMessage(assistantMsg.id, finalAssistantText).catch(console.error);
                }
              }
            }

            // Update chat last_message_at
            await updateChat(activeChatId!, {
              last_message_at: new Date().toISOString(),
            });
          } catch (err) {
            console.error('[api/chat] failed to persist openai messages', err);
          }
        })
        .catch((err) => console.error('[api/chat] persist promise error', err));

      return new Response(transform.readable, {
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
          'X-Chat-Id': activeChatId || '',
        },
      });
    }

    const result = streamText({
      model: getModel(webSearch ? 'perplexity/sonar' : model),
      messages: modelMessages,
      system: systemPrompt,

      // Save messages after streaming completes
      onFinish: async ({ text, usage }) => {
        try {
          // Get the last user message
          const lastUserMessage = messages[messages.length - 1];

          // Save user message if it exists and hasn't been saved yet
          if (lastUserMessage && lastUserMessage.role === 'user') {
            const userMessageParts = (lastUserMessage.parts || []) as MessagePart[];

            const userMsg = await createMessage({
              chat_id: activeChatId!,
              role: 'user',
              content: { parts: userMessageParts },
              token_count: getTokenCount(userMessageParts),
            });

            // Generate embedding for user message (background)
            if (userMsg) {
              const userText = userMessageParts.filter(p => p.type === 'text').map(p => p.text).join(' ');
              if (userText) {
                embedAndSaveMessage(userMsg.id, userText).catch(console.error);
              }
            }

            // Update chat title from first user message if still "New Chat"
            const firstTextPart = userMessageParts.find(p => p.type === 'text');
            if (firstTextPart?.text) {
              await updateChatTitleFromMessage(activeChatId!, firstTextPart.text);
            }
          }

          // Track sources and insert inline citations
          let finalText = text;
          const allCitations: Citation[] = [];

          // Track project sources (Loop A)
          if (projectContext && projectContext.files.length > 0) {
            const projectCitations = trackProjectSources(text, projectContext, projectName);
            allCitations.push(...projectCitations);
          }

          // Track global sources (Loop B)
          if (searchResults.length > 0) {
            const projectNamesMap = new Map<string, string>(); // TODO: Query project names from DB
            const globalCitations = trackGlobalSources(
              searchResults,
              projectNamesMap,
              allCitations.length + 1 // Start numbering after project citations
            );
            allCitations.push(...globalCitations);
          }

          // Insert inline citations if any sources were found
          if (allCitations.length > 0) {
            const citationResult = insertInlineCitations(text, allCitations);
            finalText = citationResult.text;
          }

          // Build assistant message parts
          const assistantParts: MessagePart[] = [{ type: 'text', text: finalText }];

          // Append source metadata as separate parts
          if (allCitations.length > 0) {
            const sourceParts = citationsToMessageParts(allCitations);
            assistantParts.push(...sourceParts);
          }

          const assistantMsg = await createMessage({
            chat_id: activeChatId!,
            role: 'assistant',
            content: { parts: assistantParts },
            token_count: usage?.totalTokens || getTokenCount(assistantParts),
          });

          // Generate embedding for assistant message (background)
          if (assistantMsg) {
            embedAndSaveMessage(assistantMsg.id, text).catch(console.error);
          }

          // Update chat's last_message_at
          await updateChat(activeChatId!, {
            last_message_at: new Date().toISOString(),
          });
        } catch (error) {
          console.error('Failed to save messages:', error);
          // Don't fail the request - streaming already succeeded
        }
      },
    });

    // Return UIMessage stream response for proper useChat compatibility
    // This formats the response in the structure expected by the AI SDK's useChat hook
    return result.toUIMessageStreamResponse({
      headers: {
        // Return chatId so frontend knows which chat was created/used
        'X-Chat-Id': activeChatId,
      },
      // Return reasoning and sources parts so the UI can render them (aligns with Elements example)
      sendReasoning: true,
      sendSources: true,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'An error occurred'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
