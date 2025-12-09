/**
 * POST /api/advisory/bulk-import
 *
 * Import all unimported advisory folders as projects.
 *
 * Body: {
 *   generateSummaries: boolean (default: true),
 *   folders?: string[] (optional - specific folders to import, otherwise imports all available)
 * }
 *
 * M38: Advisory Project Integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { listAdvisoryFolders, readMasterDoc, getAdvisoryFolderPath } from '@/lib/advisory/file-reader';
import { generateSummary } from '@/lib/advisory/summarizer';
import { createProject } from '@/lib/db/queries';
import { supabase } from '@/lib/db/client';
import type { EntityType } from '@/lib/db/types';

interface ImportResult {
  name: string;
  id: string;
  folderPath: string;
  entityType: EntityType;
}

interface ImportError {
  folderPath: string;
  error: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { generateSummaries = true, folders: specificFolders } = body;

    // Get available folders
    const allFolders = await listAdvisoryFolders();

    // Get already imported paths
    const { data: existingProjects } = await supabase
      .from('projects')
      .select('advisory_folder_path')
      .not('advisory_folder_path', 'is', null);

    const importedPaths = new Set(
      (existingProjects as Array<{ advisory_folder_path: string | null }> | null)
        ?.map(p => p.advisory_folder_path)
        .filter((path): path is string => path !== null) || []
    );

    // Build list of folders to import
    const toImport: Array<{ path: string; entityType: EntityType }> = [];

    if (specificFolders && Array.isArray(specificFolders)) {
      // Import specific folders
      for (const path of specificFolders) {
        if (!importedPaths.has(path)) {
          const entityType: EntityType = path.includes('/clients/') ? 'client' : 'deal';
          toImport.push({ path, entityType });
        }
      }
    } else {
      // Import all available
      for (const dealFolder of allFolders.deals) {
        const path = getAdvisoryFolderPath(dealFolder, 'deal');
        if (!importedPaths.has(path)) {
          toImport.push({ path, entityType: 'deal' });
        }
      }
      for (const clientFolder of allFolders.clients) {
        const path = getAdvisoryFolderPath(clientFolder, 'client');
        if (!importedPaths.has(path)) {
          toImport.push({ path, entityType: 'client' });
        }
      }
    }

    if (toImport.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No folders to import - all folders already imported',
        imported: [],
        failed: [],
        stats: { total: 0, imported: 0, failed: 0 },
      });
    }

    const imported: ImportResult[] = [];
    const failed: ImportError[] = [];

    // Process each folder
    for (const { path: folderPath, entityType } of toImport) {
      try {
        // Read master doc
        const masterDoc = await readMasterDoc(folderPath);
        if (!masterDoc) {
          failed.push({ folderPath, error: 'Master doc not found' });
          continue;
        }

        // Generate summary if requested
        let customInstructions = '';
        if (generateSummaries) {
          try {
            // Only deal and client types support summary generation
            const summaryType = entityType === 'client' ? 'client' : 'deal';
            customInstructions = await generateSummary(masterDoc, summaryType);
          } catch {
            console.warn(`[bulk-import] Summary generation failed for ${folderPath}`);
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

        if (!project) {
          failed.push({ folderPath, error: 'Failed to create project' });
          continue;
        }

        imported.push({
          name: project.name,
          id: project.id,
          folderPath,
          entityType,
        });

        // Small delay between imports to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        failed.push({
          folderPath,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Imported ${imported.length} of ${toImport.length} folders`,
      imported,
      failed,
      stats: {
        total: toImport.length,
        imported: imported.length,
        failed: failed.length,
      },
    });
  } catch (error) {
    console.error('[api/advisory/bulk-import] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Bulk import failed' },
      { status: 500 }
    );
  }
}
