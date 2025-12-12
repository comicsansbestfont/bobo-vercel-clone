/**
 * POST /api/advisory/import
 *
 * Import a single advisory folder as a project.
 *
 * Body: {
 *   folderPath: "advisory/deals/MyTab",
 *   generateSummary: boolean (default: true)
 * }
 *
 * M38: Advisory Project Integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { readMasterDoc } from '@/lib/advisory/file-reader';
import { generateSummary } from '@/lib/advisory/summarizer';
import { createProject } from '@/lib/db/queries';
import { supabase } from '@/lib/db/client';
import type { EntityType } from '@/lib/db/types';
import { apiLogger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { folderPath, generateSummary: shouldGenerateSummary = true } = body;

    if (!folderPath || typeof folderPath !== 'string') {
      return NextResponse.json({ error: 'folderPath is required' }, { status: 400 });
    }

    // Check if already imported
    const { data: existing } = await supabase
      .from('projects')
      .select('id, name')
      .eq('advisory_folder_path', folderPath)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Already imported', existingProject: existing },
        { status: 409 }
      );
    }

    // Read master doc
    const masterDoc = await readMasterDoc(folderPath);
    if (!masterDoc) {
      return NextResponse.json({ error: 'Master doc not found in folder' }, { status: 404 });
    }

    // Determine entity type from path
    const entityType: EntityType = folderPath.includes('/clients/') ? 'client' : 'deal';

    // Generate summary if requested
    let customInstructions = '';
    if (shouldGenerateSummary) {
      try {
        customInstructions = await generateSummary(masterDoc, entityType);
      } catch (error) {
        apiLogger.warn('Summary generation failed, continuing without summary', error);
      }
    }

    // Create project
    const project = await createProject({
      name: masterDoc.frontmatter.company || 'Unknown',
      description: `${entityType === 'deal' ? 'Deal' : 'Client'}: ${masterDoc.frontmatter.company || 'Unknown'}`,
      custom_instructions: customInstructions || null,
      entity_type: entityType,
      advisory_folder_path: folderPath,
    });

    return NextResponse.json({
      success: true,
      project,
      frontmatter: masterDoc.frontmatter,
      sectionsCount: masterDoc.sections.length,
    });
  } catch (error) {
    apiLogger.error('Import failed', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Import failed' },
      { status: 500 }
    );
  }
}
