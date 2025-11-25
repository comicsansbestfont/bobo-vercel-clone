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
  getMessages,
  deleteMessage,
  getUserProfile,
  supabase,
  type MessagePart,
  type MessageContent,
  type SearchResult,
  type Message,
  type ProjectMessageSearchResult,
  getUserMemories,
  searchProjectMessages,
} from '@/lib/db';
import { getModel } from '@/lib/ai/models';
import { getProjectContext, prepareSystemPrompt, type ProjectContext } from '@/lib/ai/context-manager';
import { hybridSearch } from '@/lib/db';
import { generateEmbedding, embedAndSaveMessage } from '@/lib/ai/embedding';
import { chatLogger } from '@/lib/logger';
import {
  trackProjectSources,
  trackGlobalSources,
  trackProjectConversations,
  insertInlineCitations,
  citationsToMessageParts,
  type Citation,
} from '@/lib/ai/source-tracker';
import { compressHistory, RECENT_MESSAGE_COUNT } from '@/lib/memory-manager';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// Disable the SDK warning about non-OpenAI reasoning
if (typeof globalThis !== 'undefined') {
  const globalWithWarnings = globalThis as { AI_SDK_LOG_WARNINGS?: boolean };
  globalWithWarnings.AI_SDK_LOG_WARNINGS = false;
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

/**
 * Helper function to query project names for search results
 */
type FileWithProject = { id: string; projects?: { name?: string | null } | null };
type MessageWithProject = {
  id: string;
  chats?: { projects?: { name?: string | null } | null } | null;
};

async function getProjectNamesForSearchResults(searchResults: SearchResult[]): Promise<Map<string, string>> {
  const projectNamesMap = new Map<string, string>();

  if (searchResults.length === 0) return projectNamesMap;

  // Extract unique file and message IDs
  const fileIds: string[] = [];
  const messageIds: string[] = [];

  // First pass: check which table each ID belongs to
  for (const result of searchResults) {
    const { data: fileData } = await supabase
      .from('files')
      .select('id')
      .eq('id', result.id)
      .single();

    if (fileData) {
      fileIds.push(result.id);
    } else {
      messageIds.push(result.id);
    }
  }

  // Get project IDs from files
  if (fileIds.length > 0) {
    const { data: files } = await supabase
      .from('files')
      .select('id, project_id, projects(name)')
      .in('id', fileIds);

    (files as FileWithProject[] | null)?.forEach((file) => {
      if (file.projects?.name) {
        projectNamesMap.set(file.id, file.projects.name);
      }
    });
  }

  // Get project IDs from messages via chats
  if (messageIds.length > 0) {
    const { data: messages } = await supabase
      .from('messages')
      .select('id, chats(project_id, projects(name))')
      .in('id', messageIds);

    (messages as MessageWithProject[] | null)?.forEach((message) => {
      if (message.chats?.projects?.name) {
        projectNamesMap.set(message.id, message.chats.projects.name);
      }
    });
  }

  return projectNamesMap;
}

/**
 * Background compression helper
 * Compresses conversation history if it exceeds the threshold
 * Runs asynchronously to avoid blocking the response
 */
async function compressConversationIfNeeded(chatId: string): Promise<void> {
  const COMPRESSION_THRESHOLD = 20; // Compress when more than 20 messages

  try {
    // Get all messages for this chat
    const allMessages = await getMessages(chatId);

    if (allMessages.length <= COMPRESSION_THRESHOLD) {
      return; // No compression needed yet
    }

    chatLogger.debug(`Compressing conversation for chat ${chatId} (${allMessages.length} messages)`);

    // Convert DB messages to UIMessage format
    const uiMessages = allMessages.map((msg: Message) => ({
      id: msg.id,
      role: msg.role as UIMessage['role'],
      parts: (msg.content as MessageContent)?.parts || [],
    })) as UIMessage[];

    // Call compression function
    const result = await compressHistory(uiMessages);

    if (!result.wasCompressed) {
      chatLogger.debug('Compression skipped - not enough messages to compress');
      return;
    }

    // Delete old messages (keep recent RECENT_MESSAGE_COUNT)
    const messagesToDelete = allMessages.slice(0, allMessages.length - RECENT_MESSAGE_COUNT);

    for (const msg of messagesToDelete) {
      await deleteMessage(msg.id);
    }

    // Insert summary message at the beginning
    const summaryMessage = result.compressedMessages.find(m => m.id.startsWith('summary-'));
    if (summaryMessage) {
      const summaryParts = summaryMessage.parts as MessagePart[];
      await createMessage({
        chat_id: chatId,
        role: 'system',
        content: { parts: summaryParts },
        token_count: getTokenCount(summaryParts),
        sequence_number: 0, // Insert at beginning
      });
    }

    chatLogger.info(`Compressed ${messagesToDelete.length} messages for chat ${chatId}`);
  } catch (error) {
    chatLogger.error('Background compression failed:', error);
    // Don't throw - this is a background operation
  }
}

/**
 * Trigger background memory extraction (M3)
 */
function triggerMemoryExtraction(chatId: string) {
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const host = process.env.VERCEL_URL || 'localhost:3000';
  const url = `${protocol}://${host}/api/memory/extract`;

  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId }),
  }).catch(err => chatLogger.error('Failed to queue extraction:', err));
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
    chatLogger.debug('Chat Request:', { model, chatId: providedChatId, projectId, msgCount: messages?.length });

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
          JSON.stringify({ error: 'Unable to create chat session. Please refresh and try again.' }),
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

    // Fetch user profile (M3)
    let userProfileContext = '';
    try {
      const profile = await getUserProfile();
      if (profile) {
        const parts = [];
        if (profile.bio) parts.push(`BIO:\n${profile.bio}`);
        if (profile.background) parts.push(`BACKGROUND & EXPERTISE:\n${profile.background}`);
        if (profile.preferences) parts.push(`PREFERENCES:\n${profile.preferences}`);
        if (profile.technical_context) parts.push(`TECHNICAL CONTEXT:\n${profile.technical_context}`);

        if (parts.length > 0) {
          userProfileContext = `\n\n### ABOUT THE USER\n${parts.join('\n\n')}`;
        }
      }
    } catch (err) {
      chatLogger.error('Failed to load user profile:', err);
    }

    // Fetch automatic memories (M3-02)
    let userMemoryContext = '';
    try {
      const memories = await getUserMemories({ relevance_threshold: 0.2, limit: 50 });

      if (memories.length > 0) {
        const sections: Record<string, string[]> = {
          work_context: [],
          personal_context: [],
          top_of_mind: [],
          brief_history: [],
          long_term_background: [],
          other_instructions: [],
        };

        // Group by category
        for (const memory of memories) {
          sections[memory.category].push(`- ${memory.content}`);
        }

        const parts: string[] = [];
        if (sections.work_context.length > 0) {
          parts.push(`WORK CONTEXT:\n${sections.work_context.slice(0, 5).join('\n')}`);
        }
        if (sections.personal_context.length > 0) {
          parts.push(`PERSONAL CONTEXT:\n${sections.personal_context.slice(0, 5).join('\n')}`);
        }
        if (sections.top_of_mind.length > 0) {
          parts.push(`TOP OF MIND:\n${sections.top_of_mind.slice(0, 5).join('\n')}`);
        }
        if (sections.brief_history.length > 0) {
          parts.push(`BRIEF HISTORY:\n${sections.brief_history.slice(0, 5).join('\n')}`);
        }
        if (sections.long_term_background.length > 0) {
          parts.push(`BACKGROUND:\n${sections.long_term_background.slice(0, 5).join('\n')}`);
        }
        if (sections.other_instructions.length > 0) {
          parts.push(`PREFERENCES:\n${sections.other_instructions.slice(0, 5).join('\n')}`);
        }

        if (parts.length > 0) {
          userMemoryContext = `\n\n### USER MEMORY (Automatic)\n${parts.join('\n\n')}`;
        }
      }
    } catch (err) {
      chatLogger.error('Failed to fetch user memories:', err);
    }

    // Prepare System Prompt with Context Caching (Loop A)
    let systemPrompt = customInstructions
      ? `${customInstructions}\n\nYou are a helpful assistant that can answer questions and help with tasks`
      : 'You are a helpful assistant that can answer questions and help with tasks';

    // Inject User Profile and Memories (M3)
    systemPrompt += userProfileContext + userMemoryContext;

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
        chatLogger.error('Failed to load project context:', err);
      }
    }

    // Generate query embedding once for all searches
    let queryEmbedding: number[] | null = null;
    const lastUserMessage = messages[messages.length - 1];
    let userText = '';
    if (lastUserMessage && Array.isArray(lastUserMessage.parts)) {
      userText = lastUserMessage.parts
        .filter(p => p.type === 'text')
        .map(p => p.text)
        .join(' ');
    }

    if (userText) {
      try {
        queryEmbedding = await generateEmbedding(userText);
      } catch (err) {
        chatLogger.error('Failed to generate query embedding:', err);
      }
    }

    // Intra-Project Chat Context (NEW)
    // Search for relevant messages from sibling chats within the same project
    let projectChatContext = '';
    let projectChatResults: ProjectMessageSearchResult[] = [];
    if (queryEmbedding && activeProjectId) {
      try {
        projectChatResults = await searchProjectMessages(
          activeProjectId,
          activeChatId || null,
          queryEmbedding,
          0.25, // Lower threshold for better recall
          5     // Top 5 results
        );

        if (projectChatResults.length > 0) {
          const snippets = projectChatResults
            .map(r => `[${r.chat_title}]: ${r.content}`)
            .join('\n');

          projectChatContext = `
### RELATED CONVERSATIONS IN THIS PROJECT
The following are relevant excerpts from your OTHER conversations in this project.
<project_conversations>
${snippets}
</project_conversations>
INSTRUCTION: Use these to maintain continuity across conversations in this project.
`;
          systemPrompt += projectChatContext;
        }
      } catch (err) {
        chatLogger.error('Intra-project search failed:', err);
      }
    }

    // Hybrid Search (Loop B)
    // Search for relevant global context from other projects
    let globalContext = '';
    let searchResults: SearchResult[] = [];
    if (queryEmbedding) {
      try {
        searchResults = await hybridSearch(
          queryEmbedding,
          0.25, // Lower threshold for better recall (was 0.6)
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
      } catch (err) {
        chatLogger.error('Hybrid search failed:', err);
      }
    }

    // Normalize roles to avoid invalid payloads to the gateway
    const allowedRoles = new Set<UIMessage['role']>(['system', 'user', 'assistant']);
    const normalizedMessages: UIMessage[] = (messages || []).map((msg, idx) => {
      if (!allowedRoles.has(msg.role)) {
        chatLogger.warn('Normalizing unsupported role to "user":', { idx, role: msg.role });
        return { ...msg, role: 'user' };
      }
      return msg;
    });

    const isOpenAIModel = model?.startsWith('openai/');
    const modelMessages = convertToModelMessages(normalizedMessages);

    if (isOpenAIModel) {
      // Direct gateway call with raw OpenAI-compatible payload to avoid SDK shaping issues.
      const messagesForPayload = normalizedMessages.map((msg) => {
        chatLogger.debug('Mapping message:', msg);
        const content = (msg.parts || [])
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
        chatLogger.error('OpenAI upstream error:', { status: upstream.status, body: text });
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
      const assistantParts: MessagePart[] = [];
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
                chatLogger.error('Failed to parse upstream chunk:', err);
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
                  embedAndSaveMessage(userMsg.id, userText).catch((err) => chatLogger.error('Failed to embed user message:', err));
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

              // Track project conversation sources (Intra-Project)
              if (projectChatResults.length > 0 && activeProjectId) {
                const conversationCitations = trackProjectConversations(
                  projectChatResults,
                  activeProjectId,
                  projectName,
                  allCitations.length + 1
                );
                allCitations.push(...conversationCitations);
              }

              // Track global sources (Loop B)
              if (searchResults.length > 0) {
                const projectNamesMap = await getProjectNamesForSearchResults(searchResults);
                const globalCitations = await trackGlobalSources(
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
                  embedAndSaveMessage(assistantMsg.id, finalAssistantText).catch((err) => chatLogger.error('Failed to embed assistant message:', err));
                }
              }
            }

            // Update chat last_message_at
            await updateChat(activeChatId!, {
              last_message_at: new Date().toISOString(),
            });

            // Background compression (fire-and-forget)
            compressConversationIfNeeded(activeChatId!).catch((err) =>
              chatLogger.error('Background compression error:', err)
            );

            // Trigger memory extraction (M3)
            triggerMemoryExtraction(activeChatId!);
          } catch (err) {
            chatLogger.error('Failed to persist OpenAI messages:', err);
          }
        })
        .catch((err) => chatLogger.error('Persist promise error:', err));

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
                embedAndSaveMessage(userMsg.id, userText).catch((err) => chatLogger.error('Failed to embed user message:', err));
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

          // Track project conversation sources (Intra-Project)
          if (projectChatResults.length > 0 && activeProjectId) {
            const conversationCitations = trackProjectConversations(
              projectChatResults,
              activeProjectId,
              projectName,
              allCitations.length + 1
            );
            allCitations.push(...conversationCitations);
          }

          // Track global sources (Loop B)
          if (searchResults.length > 0) {
            const projectNamesMap = await getProjectNamesForSearchResults(searchResults);
            const globalCitations = await trackGlobalSources(
              searchResults,
              projectNamesMap,
              allCitations.length + 1 // Start numbering after project/conversation citations
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
            embedAndSaveMessage(assistantMsg.id, text).catch((err) => chatLogger.error('Failed to embed assistant message:', err));
          }

          // Update chat's last_message_at
          await updateChat(activeChatId!, {
            last_message_at: new Date().toISOString(),
          });

          // Background compression (fire-and-forget)
          compressConversationIfNeeded(activeChatId!).catch((err) =>
            chatLogger.error('Background compression error:', err)
          );

          // Trigger memory extraction (M3)
          triggerMemoryExtraction(activeChatId!);
        } catch (error) {
          chatLogger.error('Failed to save messages:', error);
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
    chatLogger.error('Chat API error:', error);
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
