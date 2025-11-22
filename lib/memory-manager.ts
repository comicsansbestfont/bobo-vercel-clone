import type { UIMessage } from 'ai';

const RECENT_MESSAGE_COUNT = 4;
const SUMMARY_ENDPOINT = '/api/memory/compress';

type UIPart = {
  type?: string;
  text?: string;
  url?: string;
  result?: string;
};

type LeanMessage = {
  role: string;
  content: string;
};

type CompressionResult = {
  compressedMessages: UIMessage[];
  summaryText?: string;
  wasCompressed: boolean;
};

function serializeMessage(message: UIMessage): string {
  const parts = message.parts as UIPart[] | undefined;
  if (!parts) {
    return '';
  }

  return parts
    .map((part) => {
      if (typeof part?.text === 'string') return part.text;
      if (typeof part?.result === 'string') return part.result;
      if (typeof part?.url === 'string') return part.url;
      return '';
    })
    .filter(Boolean)
    .join('\n');
}

function toLeanMessages(messages: UIMessage[]): LeanMessage[] {
  return messages.map((message) => ({
    role: message.role,
    content: serializeMessage(message),
  }));
}

async function requestSummary(payload: LeanMessage[]): Promise<string> {
  const response = await fetch(SUMMARY_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messages: payload }),
  });

  if (!response.ok) {
    throw new Error('Failed to summarize conversation history');
  }

  const data = await response.json();
  return (data.summary as string | undefined)?.trim() ?? '';
}

export async function compressHistory(
  messages: UIMessage[]
): Promise<CompressionResult> {
  if (messages.length === 0) {
    return { compressedMessages: messages, wasCompressed: false };
  }

  const hasSystemPrompt = messages[0]?.role === 'system';
  const systemMessage = hasSystemPrompt ? messages[0] : null;
  const rest = hasSystemPrompt ? messages.slice(1) : [...messages];

  const recentSlice = rest.slice(
    Math.max(0, rest.length - RECENT_MESSAGE_COUNT)
  );
  const summarizableSlice = rest.slice(
    0,
    Math.max(0, rest.length - RECENT_MESSAGE_COUNT)
  );

  if (summarizableSlice.length === 0) {
    return { compressedMessages: messages, wasCompressed: false };
  }

  const leanMessages = toLeanMessages(
    [systemMessage, ...summarizableSlice].filter(
      Boolean
    ) as UIMessage[]
  );

  const summary = await requestSummary(leanMessages);

  if (!summary) {
    return { compressedMessages: messages, wasCompressed: false };
  }

  const summaryText = `Compressed conversation summary:\n${summary}`;
  const summaryMessage: UIMessage = {
    id: `summary-${Date.now()}`,
    role: 'system',
    parts: [
      {
        type: 'text',
        text: summaryText,
      },
    ],
  };

  const merged: UIMessage[] = [];
  if (systemMessage) {
    merged.push(systemMessage);
  }
  merged.push(summaryMessage);
  for (const message of recentSlice) {
    merged.push(message);
  }

  return {
    compressedMessages: merged,
    wasCompressed: true,
    summaryText: summary,
  };
}

export { RECENT_MESSAGE_COUNT };

