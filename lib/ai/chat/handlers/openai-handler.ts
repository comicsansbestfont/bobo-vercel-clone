/**
 * OpenAI Gateway Handler
 *
 * Handles chat requests for OpenAI-compatible models via Vercel AI Gateway.
 * M40-02: Extracted from route.ts lines 705-1006
 */

import { waitUntil } from '@vercel/functions';
import { convertToModelMessages, type UIMessage } from 'ai';
import type { MessagePart } from '@/lib/db';
import { chatLogger } from '@/lib/logger';
import { persistChatMessages, getTokenCount } from '../persistence/persistence-service';
import type { ChatHandler, ChatRequest, ChatContext } from '../types';

// ============================================================================
// TYPES
// ============================================================================

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

// ============================================================================
// HANDLER
// ============================================================================

export class OpenAIHandler implements ChatHandler {
  canHandle(model: string, webSearch: boolean): boolean {
    return model?.startsWith('openai/') ?? false;
  }

  async handle(
    request: ChatRequest,
    context: ChatContext,
    normalizedMessages: UIMessage[]
  ): Promise<Response> {
    const { model } = request;
    const { activeChatId, systemPrompt, projectContext, projectName, searchResults, projectChatResults, activeProjectId } = context;

    // Build messages for OpenAI payload
    const messagesForPayload = normalizedMessages.map((msg) => {
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

    // Call OpenAI Gateway
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
        { status: upstream.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Set up streaming transform
    const transform = new TransformStream<Uint8Array, Uint8Array>();
    const writer = transform.writable.getWriter();
    const encoder = new TextEncoder();
    const reader = upstream.body?.getReader();

    const streamingDone = (() => {
      let resolve: () => void = () => {};
      const promise = new Promise<void>((r) => (resolve = r));
      return { promise, resolve };
    })();

    const assistantParts: MessagePart[] = [];
    let reasoningStarted = false;

    // Emit UIMessage stream start
    writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'start' })}\n\n`));
    writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'start-step' })}\n\n`));
    writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'text-start', id: '0' })}\n\n`));

    // Process stream
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
              writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'text-end', id: '0' })}\n\n`));
              writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'finish-step' })}\n\n`));
              writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'finish', finishReason: 'stop' })}\n\n`));
              break;
            }
            try {
              const chunk = JSON.parse(payloadStr) as ChatCompletionChunk;
              const delta = chunk.choices?.[0]?.delta?.content;

              if (typeof delta === 'string' && delta.length > 0) {
                // Concatenate text deltas into a single part
                const lastPart = assistantParts[assistantParts.length - 1];
                if (lastPart && lastPart.type === 'text') {
                  lastPart.text += delta;
                } else {
                  assistantParts.push({ type: 'text', text: delta });
                }
                writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'text-delta', id: '0', delta })}\n\n`));
              } else if (Array.isArray(delta)) {
                // Handle array content parts
                for (const d of delta) {
                  if (d?.type === 'text' && d.text) {
                    const lastPart = assistantParts[assistantParts.length - 1];
                    if (lastPart && lastPart.type === 'text') {
                      lastPart.text += d.text;
                    } else {
                      assistantParts.push({ type: 'text', text: d.text });
                    }
                    writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'text-delta', id: '0', delta: d.text })}\n\n`));
                  } else if (d?.type === 'reasoning' && d.text) {
                    const lastPart = assistantParts[assistantParts.length - 1];
                    if (lastPart && lastPart.type === 'reasoning') {
                      lastPart.text += d.text;
                    } else {
                      assistantParts.push({ type: 'reasoning', text: d.text });
                    }
                    if (!reasoningStarted) {
                      reasoningStarted = true;
                      writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'reasoning-start', id: 'r0' })}\n\n`));
                    }
                    writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'reasoning-delta', id: 'r0', delta: d.text })}\n\n`));
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

    // Persist after streaming completes
    const persistencePromise = streamingDone.promise.then(async () => {
      const lastUser = [...normalizedMessages].reverse().find((m) => m.role === 'user');
      if (!lastUser) return;

      const assistantText = assistantParts
        .filter((p) => p.type === 'text')
        .map((p) => p.text)
        .join(' ');

      await persistChatMessages({
        chatId: activeChatId,
        userMessage: lastUser,
        assistantText,
        assistantParts,
        projectContext,
        projectName,
        searchResults,
        projectChatResults,
        activeProjectId,
      });
    }).catch((err) => chatLogger.error('OpenAI persist error:', err));

    // CRITICAL: Tell Vercel to wait for persistence
    waitUntil(persistencePromise);

    return new Response(transform.readable, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Chat-Id': activeChatId || '',
      },
    });
  }
}
