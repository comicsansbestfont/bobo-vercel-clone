/**
 * Advisory File Content API
 *
 * GET /api/advisory/file?path=advisory/deals/MyTab/master-doc.md
 * Returns file content for preview
 *
 * M312A-06: File Preview Panel + API
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync } from 'fs';
import { join, normalize, resolve } from 'path';
import { apiLogger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get('path');

  if (!path || !path.startsWith('advisory/')) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  try {
    const content = readFileSync(join(process.cwd(), path), 'utf-8');
    return NextResponse.json({ content });
  } catch (error) {
    apiLogger.error('Error reading file', error);
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}

export async function PATCH(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (
    !body ||
    typeof body !== 'object' ||
    !('path' in body) ||
    !('content' in body)
  ) {
    return NextResponse.json({ error: 'Missing path or content' }, { status: 400 });
  }

  const { path, content } = body as { path: string; content: string };

  if (!path || typeof path !== 'string' || !path.startsWith('advisory/')) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  if (!path.toLowerCase().endsWith('.md') && !path.toLowerCase().endsWith('.markdown')) {
    return NextResponse.json({ error: 'Only markdown files can be edited' }, { status: 400 });
  }

  if (typeof content !== 'string') {
    return NextResponse.json({ error: 'Invalid content' }, { status: 400 });
  }

  try {
    const advisoryRoot = resolve(process.cwd(), 'advisory');
    const normalizedPath = normalize(path);
    const absolutePath = resolve(process.cwd(), normalizedPath);

    if (!absolutePath.startsWith(advisoryRoot)) {
      return NextResponse.json({ error: 'Path traversal detected' }, { status: 400 });
    }

    writeFileSync(join(process.cwd(), normalizedPath), content, 'utf-8');
    return NextResponse.json({ success: true });
  } catch (error) {
    apiLogger.error('Error writing file', error);
    return NextResponse.json({ error: 'Failed to write file' }, { status: 500 });
  }
}
