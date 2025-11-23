/**
 * Project Files API Routes
 *
 * GET  /api/projects/[id]/files - List all files in a project
 * POST /api/projects/[id]/files - Upload a new file to a project
 */

import { NextRequest } from 'next/server';
import {
  getFilesByProject,
  createFile,
  getProject,
  type FileInsert,
} from '@/lib/db';
import { embedAndSaveFile } from '@/lib/ai/embedding';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/projects/[id]/files
 * Returns all files for a project
 */
export async function GET(
  req: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    // Verify project exists
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

    const files = await getFilesByProject(id);

    return Response.json({ files });
  } catch (error) {
    console.error('Error fetching files:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch files',
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
 * POST /api/projects/[id]/files
 * Upload a new markdown file to a project
 *
 * Body: { filename: string, content: string }
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

    // Validate filename
    if (!body.filename || typeof body.filename !== 'string') {
      return new Response(
        JSON.stringify({
          error: 'Validation error',
          message: 'Filename is required and must be a string',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const filename = body.filename.trim();
    if (filename.length === 0) {
      return new Response(
        JSON.stringify({
          error: 'Validation error',
          message: 'Filename cannot be empty',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate file is markdown
    if (!filename.toLowerCase().endsWith('.md')) {
      return new Response(
        JSON.stringify({
          error: 'Validation error',
          message: 'Only markdown files (.md) are supported',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate content
    if (!body.content || typeof body.content !== 'string') {
      return new Response(
        JSON.stringify({
          error: 'Validation error',
          message: 'Content is required and must be a string',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const content = body.content;
    const fileSize = new Blob([content]).size;

    // Validate file size (max 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
    if (fileSize > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({
          error: 'Validation error',
          message: `File size (${(fileSize / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (10MB)`,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Create file
    const fileInsert: Omit<FileInsert, 'user_id'> = {
      project_id: projectId,
      filename: filename,
      file_type: 'markdown',
      file_size: fileSize,
      content_text: content,
    };

    const file = await createFile(fileInsert);

    if (!file) {
      return new Response(
        JSON.stringify({
          error: 'Failed to create file',
          message: 'Could not save file to database',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate embedding in background (fire and forget)
    embedAndSaveFile(file.id, content).catch(err =>
      console.error('[api/files] background embedding failed', err)
    );

    return Response.json({ file }, { status: 201 });
  } catch (error) {
    console.error('Error uploading file:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to upload file',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
