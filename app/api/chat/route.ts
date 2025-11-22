import { streamText, UIMessage, convertToModelMessages } from 'ai';
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

    const result = streamText({
      model: getModel(webSearch ? 'perplexity/sonar' : model),
      messages: convertToModelMessages(messages),
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

