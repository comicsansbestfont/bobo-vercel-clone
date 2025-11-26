/**
 * Chat-Project Association API Route
 *
 * PATCH /api/chats/[id]/project - Move chat to/from a project
 */

import { apiLogger } from '@/lib/logger';
import { NextRequest } from 'next/server';
import {
  getChat,
  getProject,
  addChatToProject,
  removeChatFromProject,
} from '@/lib/db';

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * PATCH /api/chats/[id]/project
 * Moves a chat to a project or makes it standalone
 *
 * Body: {
 *   projectId: string | null
 * }
 *
 * - If projectId is a string: Moves chat to that project
 * - If projectId is null: Removes chat from project (makes it standalone)
 */
export async function PATCH(
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

    // Validate projectId field is present
    if (!('projectId' in body)) {
      return new Response(
        JSON.stringify({
          error: 'Validation error',
          message: 'projectId field is required (can be null)',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { projectId } = body;

    // If projectId is null, remove from project
    if (projectId === null) {
      const success = await removeChatFromProject(id);

      if (!success) {
        return new Response(
          JSON.stringify({
            error: 'Database error',
            message: 'Failed to remove chat from project',
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Get updated chat
      const updatedChat = await getChat(id);

      return Response.json({ chat: updatedChat });
    }

    // If projectId is a string, verify project exists
    if (typeof projectId !== 'string') {
      return new Response(
        JSON.stringify({
          error: 'Validation error',
          message: 'projectId must be a string or null',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

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

    // Add chat to project
    const success = await addChatToProject(id, projectId);

    if (!success) {
      return new Response(
        JSON.stringify({
          error: 'Database error',
          message: 'Failed to add chat to project',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get updated chat
    const updatedChat = await getChat(id);

    return Response.json({ chat: updatedChat });
  } catch (error) {
    apiLogger.error('Error updating chat project:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to update chat project',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
