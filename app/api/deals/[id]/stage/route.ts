/**
 * Deal Stage API - PATCH /api/deals/[id]/stage
 *
 * Updates the deal_stage in the master doc frontmatter.
 * This modifies the actual file on disk.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getProject } from '@/lib/db/queries';
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { apiLogger } from '@/lib/logger';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { stage } = body;

    if (!stage) {
      return NextResponse.json(
        { error: 'Stage is required' },
        { status: 400 }
      );
    }

    // Get project to find advisory folder path
    const project = await getProject(id);

    if (!project || !project.advisory_folder_path) {
      return NextResponse.json(
        { error: 'Deal not found or not an advisory project' },
        { status: 404 }
      );
    }

    // Find and update the master doc
    const folderPath = path.join(process.cwd(), project.advisory_folder_path);
    const files = await fs.readdir(folderPath);
    const masterDocFile = files.find(f => f.startsWith('master-doc-') && f.endsWith('.md'));

    if (!masterDocFile) {
      return NextResponse.json(
        { error: 'Master doc not found' },
        { status: 404 }
      );
    }

    const filepath = path.join(folderPath, masterDocFile);
    const fileContent = await fs.readFile(filepath, 'utf-8');
    const { data: frontmatter, content: markdownBody } = matter(fileContent);

    // Update the deal_stage in frontmatter
    frontmatter.deal_stage = stage;
    frontmatter.last_updated = new Date().toISOString().split('T')[0];

    // Reconstruct the file with updated frontmatter
    const newContent = matter.stringify(markdownBody, frontmatter);
    await fs.writeFile(filepath, newContent, 'utf-8');

    return NextResponse.json({ success: true, stage });
  } catch (error) {
    apiLogger.error('Error updating stage', error);
    return NextResponse.json(
      { error: 'Failed to update deal stage' },
      { status: 500 }
    );
  }
}
