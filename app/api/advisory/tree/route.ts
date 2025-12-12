/**
 * Advisory Folder Tree API
 *
 * GET /api/advisory/tree - Returns folder structure of advisory directory
 * GET /api/advisory/tree?basePath=advisory/deals/MyTab - Returns filtered tree
 *
 * M312A-05: Advisory Folder Browser Tree View
 * M312B-04: Added basePath query param for filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdvisoryFolderTree } from '@/lib/advisory/file-reader';
import { apiLogger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const basePath = request.nextUrl.searchParams.get('basePath') || 'advisory';

    // Security: ensure path starts with 'advisory' to prevent directory traversal
    if (!basePath.startsWith('advisory')) {
      return NextResponse.json(
        { error: 'Invalid path: must start with advisory' },
        { status: 400 }
      );
    }

    const tree = getAdvisoryFolderTree(basePath);
    return NextResponse.json({ tree });
  } catch (error) {
    apiLogger.error('Error getting folder tree', error);
    return NextResponse.json(
      { error: 'Failed to get folder tree' },
      { status: 500 }
    );
  }
}
