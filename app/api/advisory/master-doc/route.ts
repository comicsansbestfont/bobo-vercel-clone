/**
 * Advisory Master Doc API
 *
 * GET /api/advisory/master-doc?folderPath=advisory/deals/MyTab
 * Returns master doc frontmatter for entity info card
 *
 * M312B-07: Entity Info Card support
 */

import { NextRequest, NextResponse } from 'next/server';
import { resolve, sep, posix as pathPosix } from 'path';
import { readMasterDoc } from '@/lib/advisory/file-reader';
import { apiLogger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const folderPathParam = request.nextUrl.searchParams.get('folderPath');

    if (!folderPathParam) {
      return NextResponse.json(
        { error: 'Missing folderPath parameter' },
        { status: 400 }
      );
    }

    const folderPath = pathPosix.normalize(folderPathParam.replaceAll('\\', '/'));
    const advisoryRoot = resolve(process.cwd(), 'advisory');
    const absolutePath = resolve(process.cwd(), folderPath);

    // Security: ensure resolved path stays within advisory root
    if (
      absolutePath !== advisoryRoot &&
      !absolutePath.startsWith(advisoryRoot + sep)
    ) {
      return NextResponse.json(
        { error: 'Invalid path: must be under advisory' },
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
