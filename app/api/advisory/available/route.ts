/**
 * GET /api/advisory/available
 *
 * Returns list of advisory folders that haven't been imported yet as projects.
 *
 * M38: Advisory Project Integration
 */

import { NextResponse } from 'next/server';
import { listAdvisoryFolders } from '@/lib/advisory/file-reader';
import { supabase } from '@/lib/db/client';
import { apiLogger } from '@/lib/logger';

export async function GET() {
  try {
    // List all advisory folders on disk
    const folders = await listAdvisoryFolders();

    // Get already imported paths from database
    const { data: projects, error } = await supabase
      .from('projects')
      .select('advisory_folder_path')
      .not('advisory_folder_path', 'is', null);

    if (error) {
      apiLogger.error('Database query failed', error);
      return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
    }

    const importedPaths = new Set(
      (projects as Array<{ advisory_folder_path: string | null }> | null)
        ?.map(p => p.advisory_folder_path)
        .filter((path): path is string => path !== null) || []
    );

    // Filter to only available (not yet imported) folders
    const available = {
      deals: folders.deals.filter(d => !importedPaths.has(`advisory/deals/${d}`)),
      clients: folders.clients.filter(c => !importedPaths.has(`advisory/clients/${c}`)),
    };

    // Count totals
    const stats = {
      totalDeals: folders.deals.length,
      totalClients: folders.clients.length,
      availableDeals: available.deals.length,
      availableClients: available.clients.length,
      importedDeals: folders.deals.length - available.deals.length,
      importedClients: folders.clients.length - available.clients.length,
    };

    return NextResponse.json({
      available,
      stats,
    });
  } catch (error) {
    apiLogger.error('Failed to list folders', error);
    return NextResponse.json({ error: 'Failed to list folders' }, { status: 500 });
  }
}
