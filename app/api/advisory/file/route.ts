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
import { normalize, resolve, sep, posix as pathPosix } from 'path';
import { apiLogger } from '@/lib/logger';

function isErrnoException(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}

export async function GET(request: NextRequest) {
  const pathParam = request.nextUrl.searchParams.get('path');

  if (!pathParam) {
    return NextResponse.json({ error: 'Missing path' }, { status: 400 });
  }

  const requestedPath = pathPosix.normalize(pathParam.replaceAll('\\', '/'));

  if (!requestedPath.startsWith('advisory/')) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  const advisoryRoot = resolve(process.cwd(), 'advisory');
  const absolutePath = resolve(process.cwd(), normalize(requestedPath));

  if (
    absolutePath !== advisoryRoot &&
    !absolutePath.startsWith(advisoryRoot + sep)
  ) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  try {
    const content = readFileSync(absolutePath, 'utf-8');
    return NextResponse.json({ content });
  } catch (error) {
    apiLogger.error('Error reading file', error);
    if (isErrnoException(error) && error.code === 'ENOENT') {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to read file' }, { status: 500 });
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

  if (!path || typeof path !== 'string') {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  const requestedPath = pathPosix.normalize(path.replaceAll('\\', '/'));

  if (!requestedPath.startsWith('advisory/')) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  if (
    !requestedPath.toLowerCase().endsWith('.md') &&
    !requestedPath.toLowerCase().endsWith('.markdown')
  ) {
    return NextResponse.json({ error: 'Only markdown files can be edited' }, { status: 400 });
  }

  if (typeof content !== 'string') {
    return NextResponse.json({ error: 'Invalid content' }, { status: 400 });
  }

  try {
    const advisoryRoot = resolve(process.cwd(), 'advisory');
    const normalizedPath = normalize(requestedPath);
    const absolutePath = resolve(process.cwd(), normalizedPath);

    if (
      absolutePath !== advisoryRoot &&
      !absolutePath.startsWith(advisoryRoot + sep)
    ) {
      return NextResponse.json({ error: 'Path traversal detected' }, { status: 400 });
    }

    writeFileSync(absolutePath, content, 'utf-8');
    return NextResponse.json({ success: true });
  } catch (error) {
    apiLogger.error('Error writing file', error);
    return NextResponse.json({ error: 'Failed to write file' }, { status: 500 });
  }
}
