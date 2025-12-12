/**
 * POST /api/advisory/refresh/[projectId]
 *
 * Re-read master doc from file system and optionally regenerate the AI summary.
 *
 * Body: {
 *   regenerateSummary: boolean (default: false)
 * }
 *
 * M38: Advisory Project Integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { readMasterDoc } from '@/lib/advisory/file-reader';
import { generateSummary } from '@/lib/advisory/summarizer';
import { getProject, updateProject } from '@/lib/db/queries';
import type { EntityType } from '@/lib/db/types';
import { apiLogger } from '@/lib/logger';

interface RouteParams {
  params: Promise<{ projectId: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params;
    const body = await req.json().catch(() => ({}));
    const { regenerateSummary: shouldRegenerate = false } = body;

    // Get the project
    const project = await getProject(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if it's an advisory project
    if (!project.advisory_folder_path) {
      return NextResponse.json(
        { error: 'Not an advisory project - no advisory_folder_path set' },
        { status: 400 }
      );
    }

    // Read fresh content from file system
    const masterDoc = await readMasterDoc(project.advisory_folder_path);
    if (!masterDoc) {
      return NextResponse.json(
        { error: 'Master doc not found at path', path: project.advisory_folder_path },
        { status: 404 }
      );
    }

    let newSummary: string | null = null;

    // Regenerate summary if requested
    if (shouldRegenerate) {
      try {
        const entityType = project.entity_type as EntityType;
        newSummary = await generateSummary(masterDoc, entityType === 'client' ? 'client' : 'deal');

        // Update the project with new summary
        await updateProject(projectId, {
          custom_instructions: newSummary,
        });
      } catch (error) {
        apiLogger.error('Summary regeneration failed', error);
        return NextResponse.json(
          { error: 'Summary regeneration failed', details: error instanceof Error ? error.message : 'Unknown' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      projectId,
      folderPath: project.advisory_folder_path,
      frontmatter: masterDoc.frontmatter,
      sectionsCount: masterDoc.sections.length,
      lastUpdated: masterDoc.frontmatter.last_updated || null,
      summaryRegenerated: shouldRegenerate,
      newSummary: newSummary || undefined,
    });
  } catch (error) {
    apiLogger.error('Refresh failed', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Refresh failed' },
      { status: 500 }
    );
  }
}
