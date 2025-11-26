/**
 * Chats API Routes
 *
 * GET  /api/chats - List all chats (with optional project filter)
 * POST /api/chats - Create a new chat
 */

import { NextRequest } from 'next/server';
import {
  getChatsWithProjects,
  getChatsByProject,
  createChat,
  type ChatInsert,
} from '@/lib/db';
import { apiLogger } from '@/lib/logger';

/**
 * GET /api/chats
 * Returns all chats for the user with project information
 * Query params:
 *   ?projectId=xyz - Optional filter by project ID
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    let chats;
    if (projectId) {
      // Get chats for specific project
      chats = await getChatsByProject(projectId);
    } else {
      // Get all chats with project info
      chats = await getChatsWithProjects();
    }

    return Response.json({
      chats,
      count: chats.length,
    });
  } catch (error) {
    apiLogger.error('Error fetching chats:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch chats',
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
 * POST /api/chats
 * Creates a new chat
 *
 * Body: {
 *   title?: string,
 *   model: string,
 *   projectId?: string,
 *   webSearchEnabled?: boolean
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate required fields
    if (!body.model || typeof body.model !== 'string') {
      return new Response(
        JSON.stringify({
          error: 'Validation error',
          message: 'Model is required and must be a string',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate model is not empty
    if (body.model.trim().length === 0) {
      return new Response(
        JSON.stringify({
          error: 'Validation error',
          message: 'Model cannot be empty',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Create chat
    const chatData: Omit<ChatInsert, 'user_id'> = {
      title: body.title?.trim() || 'New Chat',
      model: body.model.trim(),
      project_id: body.projectId || null,
      web_search_enabled: body.webSearchEnabled || false,
    };

    const chat = await createChat(chatData);

    if (!chat) {
      return new Response(
        JSON.stringify({
          error: 'Database error',
          message: 'Unable to create chat session. Please try again.',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return Response.json(
      { chat },
      { status: 201 }
    );
  } catch (error) {
    apiLogger.error('Error creating chat:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to create chat',
        message: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
