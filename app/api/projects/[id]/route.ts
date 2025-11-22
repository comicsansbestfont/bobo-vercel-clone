/**
 * Individual Project API Routes
 *
 * GET    /api/projects/[id] - Get a single project
 * PATCH  /api/projects/[id] - Update a project
 * DELETE /api/projects/[id] - Delete a project (soft delete)
 */

import { NextRequest } from 'next/server';
import {
  getProject,
  updateProject,
  deleteProject,
  type ProjectUpdate,
} from '@/lib/db';

type RouteContext = {
  params: { id: string };
};

/**
 * GET /api/projects/[id]
 * Returns a single project by ID
 */
export async function GET(
  req: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    const project = await getProject(id);

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

    return Response.json({ project });
  } catch (error) {
    console.error('Error fetching project:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch project',
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
 * PATCH /api/projects/[id]
 * Updates a project
 *
 * Body: { name?: string, description?: string }
 */
export async function PATCH(
  req: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;
    const body = await req.json();

    // Validate at least one field is provided
    if (!body.name && body.description === undefined) {
      return new Response(
        JSON.stringify({
          error: 'Validation error',
          message: 'At least one field (name or description) must be provided',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate name if provided
    if (body.name !== undefined) {
      if (typeof body.name !== 'string') {
        return new Response(
          JSON.stringify({
            error: 'Validation error',
            message: 'Project name must be a string',
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      if (body.name.trim().length === 0) {
        return new Response(
          JSON.stringify({
            error: 'Validation error',
            message: 'Project name cannot be empty',
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Build updates object
    const updates: ProjectUpdate = {};
    if (body.name !== undefined) {
      updates.name = body.name.trim();
    }
    if (body.description !== undefined) {
      updates.description = body.description ? body.description.trim() : null;
    }

    // Update project
    const project = await updateProject(id, updates);

    if (!project) {
      return new Response(
        JSON.stringify({
          error: 'Not found',
          message: 'Project not found or failed to update',
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return Response.json({ project });
  } catch (error) {
    console.error('Error updating project:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to update project',
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
 * DELETE /api/projects/[id]
 * Deletes a project (soft delete - sets project_id to NULL on associated chats)
 */
export async function DELETE(
  req: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    const success = await deleteProject(id);

    if (!success) {
      return new Response(
        JSON.stringify({
          error: 'Not found',
          message: 'Project not found or failed to delete',
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Return 204 No Content on successful deletion
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting project:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to delete project',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
