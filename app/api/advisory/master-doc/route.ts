/**
 * Advisory Master Doc API
 *
 * GET /api/advisory/master-doc?folderPath=advisory/deals/MyTab
 * Returns master doc frontmatter for entity info card
 *
 * M312B-07: Entity Info Card support
 */

import { NextRequest, NextResponse } from 'next/server';
import { readMasterDoc } from '@/lib/advisory/file-reader';
import { apiLogger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const folderPath = request.nextUrl.searchParams.get('folderPath');

    if (!folderPath) {
      return NextResponse.json(
        { error: 'Missing folderPath parameter' },
        { status: 400 }
      );
    }

    // Security: ensure path starts with 'advisory'
    if (!folderPath.startsWith('advisory')) {
      return NextResponse.json(
        { error: 'Invalid path: must start with advisory' },
        { status: 400 }
      );
    }

    const masterDoc = await readMasterDoc(folderPath);

    if (!masterDoc) {
      return NextResponse.json(
        { frontmatter: null, message: 'No master doc found' },
        { status: 200 }
      );
    }

    // Map frontmatter fields to what the UI expects
    const frontmatter = {
      stage: masterDoc.frontmatter.deal_stage || masterDoc.frontmatter.current_stage,
      lastUpdated: masterDoc.frontmatter.last_updated,
      company: masterDoc.frontmatter.company,
      founder: masterDoc.frontmatter.founder,
      website: masterDoc.frontmatter.website,
      arrEstimate: masterDoc.frontmatter.arr_estimate,
      teamSize: masterDoc.frontmatter.team_size,
      engagementType: masterDoc.frontmatter.engagement_type,
    };

    return NextResponse.json({ frontmatter });
  } catch (error) {
    apiLogger.error('Error reading master doc', error);
    return NextResponse.json(
      { error: 'Failed to read master doc' },
      { status: 500 }
    );
  }
}
