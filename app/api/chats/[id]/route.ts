/**
 * Individual Chat API Routes
 *
 * GET    /api/chats/[id] - Get chat with all messages
 * PATCH  /api/chats/[id] - Update chat metadata
 * DELETE /api/chats/[id] - Delete chat and all messages
 */

import { apiLogger } from '@/lib/logger';
import { NextRequest } from 'next/server';
import {
  getChat,
  getMessages,
  updateChat,
  deleteChat,
  type ChatUpdate,
} from '@/lib/db';

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/chats/[id]
 * Returns a chat with all its messages
 */
export async function GET(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    // Fetch chat
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

    // Fetch all messages for this chat
    const messages = await getMessages(id);

    return Response.json({
      chat,
      messages,
    });
  } catch (error) {
    apiLogger.error('Error fetching chat:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch chat',
        message: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * PATCH /api/chats/[id]
 * Updates chat metadata
 *
 * Body: {
 *   title?: string,
 *   model?: string,
 *   webSearchEnabled?: boolean
 * }
 */
export async function PATCH(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const body = await req.json();

    // Verify chat exists
    const existingChat = await getChat(id);
    if (!existingChat) {
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

    // Validate at least one field is provided
    if (
      body.title === undefined &&
      body.model === undefined &&
      body.webSearchEnabled === undefined
    ) {
      return new Response(
        JSON.stringify({
          error: 'Validation error',
          message: 'At least one field must be provided to update',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate title if provided
    if (body.title !== undefined) {
      if (typeof body.title !== 'string' || body.title.trim().length === 0) {
        return new Response(
          JSON.stringify({
            error: 'Validation error',
            message: 'Title must be a non-empty string',
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Validate model if provided
    if (body.model !== undefined) {
      if (typeof body.model !== 'string' || body.model.trim().length === 0) {
        return new Response(
          JSON.stringify({
            error: 'Validation error',
            message: 'Model must be a non-empty string',
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Validate webSearchEnabled if provided
    if (body.webSearchEnabled !== undefined) {
      if (typeof body.webSearchEnabled !== 'boolean') {
        return new Response(
          JSON.stringify({
            error: 'Validation error',
            message: 'webSearchEnabled must be a boolean',
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Build update object
    const updates: ChatUpdate = {};
    if (body.title !== undefined) updates.title = body.title.trim();
    if (body.model !== undefined) updates.model = body.model.trim();
    if (body.webSearchEnabled !== undefined)
      updates.web_search_enabled = body.webSearchEnabled;

    // Update chat
    const updatedChat = await updateChat(id, updates);

    if (!updatedChat) {
      return new Response(
        JSON.stringify({
          error: 'Database error',
          message: 'Failed to update chat',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return Response.json({ chat: updatedChat });
  } catch (error) {
    apiLogger.error('Error updating chat:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to update chat',
        message: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * DELETE /api/chats/[id]
 * Deletes a chat and all its messages (cascades automatically)
 */
export async function DELETE(
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

    // Delete chat (messages cascade automatically)
    const success = await deleteChat(id);

    if (!success) {
      return new Response(
        JSON.stringify({
          error: 'Database error',
          message: 'Failed to delete chat',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Return 204 No Content on successful deletion
    return new Response(null, { status: 204 });
  } catch (error) {
    apiLogger.error('Error deleting chat:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to delete chat',
        message: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
