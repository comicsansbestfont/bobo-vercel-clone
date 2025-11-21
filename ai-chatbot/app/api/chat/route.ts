import { streamText, UIMessage, convertToModelMessages } from 'ai';

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

    const result = streamText({
      model: webSearch ? 'perplexity/sonar' : model,
      messages: convertToModelMessages(messages),
      system:
        'You are a helpful assistant that can answer questions and help with tasks',
    });

    // send sources and reasoning back to the client
    return result.toUIMessageStreamResponse({
      sendSources: true,
      sendReasoning: true,
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

