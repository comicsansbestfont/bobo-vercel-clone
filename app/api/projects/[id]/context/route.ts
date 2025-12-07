/**
 * Project Context API Route
 *
 * GET /api/projects/[id]/context - Get advisory project context (master doc)
 *
 * Returns the master doc content, frontmatter, and key sections for display in the UI.
 * Only works for advisory projects (those with advisory_folder_path).
 */

import { apiLogger } from '@/lib/logger';
import { NextRequest } from 'next/server';
import { getProject } from '@/lib/db';
import { readMasterDoc, extractKeySections, type AdvisoryFile } from '@/lib/advisory/file-reader';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export type ProjectContextResponse = {
  isAdvisory: boolean;
  context: {
    filename: string;
    frontmatter: AdvisoryFile['frontmatter'];
    sections: AdvisoryFile['sections'];
    keySections: string;
    rawContent: string;
  } | null;
  customInstructions: string | null;
};

/**
 * GET /api/projects/[id]/context
 * Returns the project context including master doc for advisory projects
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

    // Check if this is an advisory project
    const isAdvisory = Boolean(project.advisory_folder_path);

    if (!isAdvisory) {
      // For non-advisory projects, return just custom instructions
      const response: ProjectContextResponse = {
        isAdvisory: false,
        context: null,
        customInstructions: project.custom_instructions,
      };
      return Response.json(response);
    }

    // Read the master doc from the file system
    const masterDoc = await readMasterDoc(project.advisory_folder_path!);

    if (!masterDoc) {
      apiLogger.warn(`Master doc not found for advisory project ${id} at ${project.advisory_folder_path}`);
      const response: ProjectContextResponse = {
        isAdvisory: true,
        context: null,
        customInstructions: project.custom_instructions,
      };
      return Response.json(response);
    }

    // Extract key sections for summary display
    const keySections = extractKeySections(masterDoc);

    const response: ProjectContextResponse = {
      isAdvisory: true,
      context: {
        filename: masterDoc.filename,
        frontmatter: masterDoc.frontmatter,
        sections: masterDoc.sections,
        keySections,
        rawContent: masterDoc.content,
      },
      customInstructions: project.custom_instructions,
    };

    return Response.json(response);
  } catch (error) {
    apiLogger.error('Error fetching project context:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch project context',
        message: error instanceof Error ? error.message : 'An unexpected error occurred.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
