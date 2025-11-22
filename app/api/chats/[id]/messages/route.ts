/**
 * Chat Messages API Routes
 *
 * GET  /api/chats/[id]/messages - List all messages in a chat
 * POST /api/chats/[id]/messages - Create a new message
 */

import { NextRequest } from 'next/server';
import {
  getChat,
  getMessages,
  createMessage,
  updateChat,
  type MessageInsert,
  type MessageContent,
} from '@/lib/db';

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/chats/[id]/messages
 * Returns all messages for a chat (ordered by sequence_number)
 */
export async function GET(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    // Verify chat exists
    const chat = await getChat(id);
    if (!chat) {
      return new Response(
        JSON.stringify({
          error: 'Not found',
          message: 'Chat not found',
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get all messages
    const messages = await getMessages(id);

    return Response.json({
      messages,
      count: messages.length,
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch messages',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * POST /api/chats/[id]/messages
 * Creates a new message in a chat
 *
 * Body: {
 *   role: 'user' | 'assistant' | 'system',
 *   content: MessageContent,
 *   tokenCount?: number
 * }
 */
export async function POST(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const body = await req.json();

    // Verify chat exists
    const chat = await getChat(id);
    if (!chat) {
      return new Response(
        JSON.stringify({
          error: 'Not found',
          message: 'Chat not found',
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate required fields
    if (!body.role || !['user', 'assistant', 'system'].includes(body.role)) {
      return new Response(
        JSON.stringify({
          error: 'Validation error',
          message: 'Role is required and must be one of: user, assistant, system',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (!body.content || typeof body.content !== 'object') {
      return new Response(
        JSON.stringify({
          error: 'Validation error',
          message: 'Content is required and must be an object',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (!Array.isArray(body.content.parts) || body.content.parts.length === 0) {
      return new Response(
        JSON.stringify({
          error: 'Validation error',
          message: 'Content must have a non-empty parts array',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate each part
    for (const part of body.content.parts) {
      if (!part.type || typeof part.type !== 'string') {
        return new Response(
          JSON.stringify({
            error: 'Validation error',
            message: 'Each part must have a type field',
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      const validTypes = ['text', 'reasoning', 'source-url', 'tool-result'];
      if (!validTypes.includes(part.type)) {
        return new Response(
          JSON.stringify({
            error: 'Validation error',
            message: `Part type must be one of: ${validTypes.join(', ')}`,
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Create message (sequence_number is auto-generated)
    const messageData: Omit<MessageInsert, 'sequence_number'> = {
      chat_id: id,
      role: body.role,
      content: body.content as MessageContent,
      token_count: body.tokenCount || 0,
    };

    const message = await createMessage(messageData);

    if (!message) {
      return new Response(
        JSON.stringify({
          error: 'Database error',
          message: 'Failed to create message',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Update chat's last_message_at
    await updateChat(id, {
      last_message_at: new Date().toISOString(),
    });

    return Response.json(
      { message },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating message:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to create message',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
