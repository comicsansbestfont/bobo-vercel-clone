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
  type MessagePart,
  type MessageContent,
} from '@/lib/db';
import { getModel } from '@/lib/ai/models';

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
    }: {
      messages: UIMessage[];
      model: string;
      webSearch: boolean;
      chatId?: string;
    } = await req.json();

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
        project_id: null,
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

    // Normalize roles to avoid invalid payloads to the gateway
    const allowedRoles = new Set<UIMessage['role']>(['system', 'user', 'assistant']);
    const normalizedMessages: UIMessage[] = (messages || []).map((msg, idx) => {
      if (!allowedRoles.has(msg.role)) {
        console.warn(
          '[api/chat] normalizing unsupported role to "user"',
          { idx, role: msg.role }
        );
        return { ...msg, role: 'user' };
      }
      return msg;
    });

    if (model?.startsWith('openai/gpt-5.1')) {
      console.log('[api/chat] openai gpt-5.1 request messages roles:', normalizedMessages.map((m) => m.role));
      if (normalizedMessages.length > 0) {
        console.log('[api/chat] openai gpt-5.1 first message:', normalizedMessages[0]);
      }
    }

    const isOpenAIModel = model?.startsWith('openai/');
    const isGpt51 = model?.startsWith('openai/gpt-5.1');
    const modelMessages = convertToModelMessages(normalizedMessages);

    if (isGpt51) {
      console.log('[api/chat] openai gpt-5.1 modelMessages (sdk):', JSON.stringify(modelMessages, null, 2));
    }

    if (isOpenAIModel) {
      // Direct gateway call with raw OpenAI-compatible payload to avoid SDK shaping issues.
      const payload = {
        model,
        messages: normalizedMessages.map((msg) => ({
          role: msg.role,
          content: (msg.parts || [])
            .map((p) => ('text' in p && p.text ? p.text : ''))
            .join(''),
        })),
        stream: true,
      };

      console.log('[api/chat] openai direct payload:', JSON.stringify(payload, null, 2));

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
        let resolve: () => void = () => {};
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
                  assistantParts.push({ type: 'text', text: delta });
                  writer.write(
                    encoder.encode(
                      `data: ${JSON.stringify({ type: 'text-delta', id: '0', delta })}\n\n`
                    )
                  );
                } else if (Array.isArray(delta)) {
                  // Handle array content parts
                  for (const d of delta) {
                    if (d?.type === 'text' && d.text) {
                      assistantParts.push({ type: 'text', text: d.text });
                      writer.write(
                        encoder.encode(
                          `data: ${JSON.stringify({ type: 'text-delta', id: '0', delta: d.text })}\n\n`
                        )
                      );
                    } else if (d?.type === 'reasoning' && d.text) {
                      assistantParts.push({ type: 'reasoning', text: d.text });
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
              await createMessage({
                chat_id: activeChatId!,
                role: 'user',
                content: { parts: userParts },
                token_count: getTokenCount(userParts),
              });
              const firstTextPart = userParts.find((p) => p.type === 'text');
              if (firstTextPart?.text) {
                await updateChatTitleFromMessage(activeChatId!, firstTextPart.text);
              }
            }

            // Save assistant message
            if (assistantParts.length > 0) {
              await createMessage({
                chat_id: activeChatId!,
                role: 'assistant',
                content: { parts: assistantParts },
                token_count: getTokenCount(assistantParts),
              });
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
      system:
        'You are a helpful assistant that can answer questions and help with tasks',

      // Save messages after streaming completes
      onFinish: async ({ text, usage }) => {
        try {
          // Get the last user message
          const lastUserMessage = messages[messages.length - 1];

          // Save user message if it exists and hasn't been saved yet
          if (lastUserMessage && lastUserMessage.role === 'user') {
            const userMessageParts = (lastUserMessage.parts || []) as MessagePart[];

            await createMessage({
              chat_id: activeChatId!,
              role: 'user',
              content: { parts: userMessageParts },
              token_count: getTokenCount(userMessageParts),
            });

            // Update chat title from first user message if still "New Chat"
            const firstTextPart = userMessageParts.find(p => p.type === 'text');
            if (firstTextPart?.text) {
              await updateChatTitleFromMessage(activeChatId!, firstTextPart.text);
            }
          }

          // Save assistant response
          const assistantParts: MessagePart[] = [{ type: 'text', text: text }];

          await createMessage({
            chat_id: activeChatId!,
            role: 'assistant',
            content: { parts: assistantParts },
            token_count: usage?.totalTokens || getTokenCount(assistantParts),
          });

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
      // Temporary debug: log SSE chunks to identify invalid roles/chunks from providers
      consumeSseStream: ({ stream }) => {
        const reader = stream.getReader();
        (async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              console.log('[api/chat] stream chunk', value);
            }
          } catch (err) {
            console.error('[api/chat] stream logging error', err);
          } finally {
            reader.releaseLock();
          }
        })();
      },
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
