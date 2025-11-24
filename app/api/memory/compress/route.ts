import { generateText } from 'ai';
import { chatLogger } from '@/lib/logger';

const SUMMARIZER_MODEL = 'google/gemini-2.5-flash-lite';

type Payload = {
  messages: Array<{
    role: string;
    content: string;
  }>;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Payload;

    if (!body.messages || body.messages.length === 0) {
      return Response.json({ summary: '' });
    }

    const conversation = body.messages
      .map(
        (message) =>
          `${message.role.toUpperCase()}:\n${message.content?.trim() ?? ''}`
      )
      .join('\n\n');

    const { text } = await generateText({
      model: SUMMARIZER_MODEL,
      prompt: `You are a senior technical writer. Summarize the following conversation so that all important decisions, constraints, and open questions remain.\n\n${conversation}\n\nSummary:`,
      temperature: 0.2,
    });

    return Response.json({ summary: text.trim() });
  } catch (error) {
    chatLogger.error('Compression summary error:', error);
    return new Response(
      JSON.stringify({ error: 'Unable to compress conversation history.' }),
      { status: 500 }
    );
  }
}

