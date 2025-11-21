import { streamText, UIMessage, convertToModelMessages } from 'ai';
import { openai } from '@ai-sdk/openai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const {
      messages,
      model,
      webSearch,
    }: { 
      messages: UIMessage[]; 
      model: string; 
      webSearch: boolean;
    } = await req.json();

    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ 
          error: 'OPENAI_API_KEY is not configured. Please add it to your .env.local file.' 
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Map model identifiers to OpenAI model IDs
    // Note: OpenAI doesn't have built-in web search, so webSearch toggle will be ignored
    const modelMap: Record<string, string> = {
      'openai/gpt-4o': 'gpt-4o',
      'deepseek/deepseek-r1': 'gpt-4o', // Fallback since Deepseek R1 isn't available via OpenAI
    };

    const openaiModel = modelMap[model] || model.replace('openai/', '') || 'gpt-4o';

    const result = streamText({
      model: openai.chat(openaiModel),
      messages: convertToModelMessages(messages),
      system:
        'You are a helpful assistant that can answer questions and help with tasks',
    });

    // send sources and reasoning back to the client
    // Note: OpenAI doesn't support sources/reasoning in the same way as gateway models
    return result.toUIMessageStreamResponse({
      sendSources: false, // OpenAI doesn't provide source URLs
      sendReasoning: false, // OpenAI doesn't provide reasoning tokens
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

