/**
 * Advisory Folder Tree API
 *
 * GET /api/advisory/tree - Returns folder structure of advisory directory
 *
 * M312A-05: Advisory Folder Browser Tree View
 */

import { NextResponse } from 'next/server';
import { getAdvisoryFolderTree } from '@/lib/advisory/file-reader';

export async function GET() {
  try {
    const tree = getAdvisoryFolderTree('advisory');
    return NextResponse.json({ tree });
  } catch (error) {
    console.error('[advisory/tree] Error getting folder tree:', error);
    return NextResponse.json(
      { error: 'Failed to get folder tree' },
      { status: 500 }
    );
  }
}
