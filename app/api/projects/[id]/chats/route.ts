/**
 * Project Chats API Routes
 *
 * GET  /api/projects/[id]/chats - Get all chats in a project
 * POST /api/projects/[id]/chats - Create a new chat in a project
 */

import { NextRequest } from 'next/server';
import {
  getChatsByProject,
  createChat,
  getProject,
  type ChatInsert,
} from '@/lib/db';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/projects/[id]/chats
 * Returns all chats belonging to a specific project
 */
export async function GET(
  req: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id: projectId } = await params;

    // Verify project exists
    const project = await getProject(projectId);
    if (!project) {
      return new Response(
        JSON.stringify({
          error: 'Not found',
          message: 'Project not found',
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get all chats in this project
    const chats = await getChatsByProject(projectId);

    return Response.json({
      chats,
      count: chats.length,
      project: {
        id: project.id,
        name: project.name,
      },
    });
  } catch (error) {
    console.error('Error fetching project chats:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch project chats',
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
 * POST /api/projects/[id]/chats
 * Creates a new chat within a project
 *
 * Body: {
 *   title?: string,
 *   model?: string,
 *   web_search_enabled?: boolean
 * }
 */
export async function POST(
  req: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id: projectId } = await params;
    const body = await req.json();

    // Verify project exists
    const project = await getProject(projectId);
    if (!project) {
      return new Response(
        JSON.stringify({
          error: 'Not found',
          message: 'Project not found',
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate model if provided
    if (body.model !== undefined && typeof body.model !== 'string') {
      return new Response(
        JSON.stringify({
          error: 'Validation error',
          message: 'Model must be a string',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate title if provided
    if (body.title !== undefined && typeof body.title !== 'string') {
      return new Response(
        JSON.stringify({
          error: 'Validation error',
          message: 'Title must be a string',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate web_search_enabled if provided
    if (body.web_search_enabled !== undefined && typeof body.web_search_enabled !== 'boolean') {
      return new Response(
        JSON.stringify({
          error: 'Validation error',
          message: 'web_search_enabled must be a boolean',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Create chat data
    const chatData: Omit<ChatInsert, 'user_id'> = {
      project_id: projectId,
      title: body.title?.trim() || 'New Chat',
      model: body.model || 'openai/gpt-4o',
      web_search_enabled: body.web_search_enabled ?? false,
    };

    const chat = await createChat(chatData);

    if (!chat) {
      return new Response(
        JSON.stringify({
          error: 'Database error',
          message: 'Failed to create chat',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return Response.json(
      {
        chat,
        project: {
          id: project.id,
          name: project.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating chat in project:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to create chat',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
