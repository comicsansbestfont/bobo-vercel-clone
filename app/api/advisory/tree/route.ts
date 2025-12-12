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
import { statSync } from 'fs';
import { resolve, sep, posix as pathPosix } from 'path';
import { getAdvisoryFolderTree } from '@/lib/advisory/file-reader';
import { apiLogger } from '@/lib/logger';

function isErrnoException(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}

export async function GET(request: NextRequest) {
  try {
    const basePathParam = request.nextUrl.searchParams.get('basePath') ?? 'advisory';
    const basePath = pathPosix.normalize(basePathParam.replaceAll('\\', '/'));

    if (!basePath || basePath === '.' || basePath === '/') {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    const advisoryRoot = resolve(process.cwd(), 'advisory');
    const absolutePath = resolve(process.cwd(), basePath);

    // Security: ensure the resolved path stays within the advisory root
    if (
      absolutePath !== advisoryRoot &&
      !absolutePath.startsWith(advisoryRoot + sep)
    ) {
      return NextResponse.json(
        { error: 'Invalid path: must be under advisory' },
        { status: 400 }
      );
    }

    try {
      const stats = statSync(absolutePath);
      if (!stats.isDirectory()) {
        return NextResponse.json(
          { error: 'Folder not found', basePath },
          { status: 404 }
        );
      }
    } catch (error) {
      if (isErrnoException(error) && error.code === 'ENOENT') {
        return NextResponse.json(
          { error: 'Folder not found', basePath },
          { status: 404 }
        );
      }
      throw error;
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
