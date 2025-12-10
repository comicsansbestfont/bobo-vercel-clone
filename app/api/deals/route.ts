/**
 * Deals API - GET /api/deals
 *
 * Returns all deals with their frontmatter metadata for the Kanban view.
 * Reads from advisory folder master docs.
 */

import { NextResponse } from 'next/server';
import { listAdvisoryFolders, readMasterDoc } from '@/lib/advisory/file-reader';
import { getProjects } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

interface DealData {
  id: string;
  name: string;
  stage: string;
  company?: string;
  website?: string;
  founder?: string;
  arrEstimate?: string;
  teamSize?: string;
  firstContact?: string;
  lastUpdated?: string;
  engagementType?: string;
  folderPath?: string;
}

export async function GET() {
  try {
    // Get projects with entity_type = 'deal' from database (to match IDs)
    const projects = await getProjects();
    const dealProjects = projects.filter(p => p.entity_type === 'deal');

    // Get advisory folders
    const { deals: dealFolders } = await listAdvisoryFolders();

    // Read master docs for each deal and combine with project data
    const dealsPromises = dealFolders.map(async (folderName): Promise<DealData | null> => {
      const folderPath = `advisory/deals/${folderName}`;
      const masterDoc = await readMasterDoc(folderPath);

      if (!masterDoc) {
        return null;
      }

      // Find matching project by advisory_folder_path
      const matchingProject = dealProjects.find(
        p => p.advisory_folder_path === folderPath
      );

      const fm = masterDoc.frontmatter;

      return {
        id: matchingProject?.id || folderName,
        name: fm.company || folderName,
        stage: fm.deal_stage || 'New Opportunity',
        company: fm.company,
        website: fm.website,
        founder: fm.founder,
        arrEstimate: fm.arr_estimate,
        teamSize: fm.team_size,
        firstContact: fm.first_contact,
        lastUpdated: fm.last_updated,
        engagementType: fm.engagement_type,
        folderPath,
      };
    });

    const dealsResults = await Promise.all(dealsPromises);
    const deals = dealsResults.filter((d): d is DealData => d !== null);

    return NextResponse.json({ deals });
  } catch (error) {
    console.error('[deals-api] Error fetching deals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deals' },
      { status: 500 }
    );
  }
}
