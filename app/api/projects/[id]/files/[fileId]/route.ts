/**
 * Individual File API Routes
 *
 * DELETE /api/projects/[id]/files/[fileId] - Delete a file
 */

import { NextRequest } from 'next/server';
import { getFile, deleteFile, getProject } from '@/lib/db';

type RouteContext = {
  params: Promise<{ id: string; fileId: string }>;
};

/**
 * DELETE /api/projects/[id]/files/[fileId]
 * Deletes a file from a project
 */
export async function DELETE(
  req: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id: projectId, fileId } = await params;

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

    // Verify file exists and belongs to this project
    const file = await getFile(fileId);
    if (!file) {
      return new Response(
        JSON.stringify({
          error: 'Not found',
          message: 'File not found',
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (file.project_id !== projectId) {
      return new Response(
        JSON.stringify({
          error: 'Forbidden',
          message: 'File does not belong to this project',
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Delete the file
    const success = await deleteFile(fileId);

    if (!success) {
      return new Response(
        JSON.stringify({
          error: 'Failed to delete file',
          message: 'Could not delete file from database',
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
    console.error('Error deleting file:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to delete file',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
