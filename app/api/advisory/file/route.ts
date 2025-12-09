/**
 * Advisory File Content API
 *
 * GET /api/advisory/file?path=advisory/deals/MyTab/master-doc.md
 * Returns file content for preview
 *
 * M312A-06: File Preview Panel + API
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get('path');

  if (!path || !path.startsWith('advisory/')) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  try {
    const content = readFileSync(join(process.cwd(), path), 'utf-8');
    return NextResponse.json({ content });
  } catch (error) {
    console.error('[advisory/file] Error reading file:', error);
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}
