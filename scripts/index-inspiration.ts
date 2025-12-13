/**
 * Index Inspiration Library
 *
 * Scans `01_Inspiration/` markdown files, generates embeddings,
 * and upserts them to the `files` table under a dedicated project.
 *
 * Run with: npx tsx scripts/index-inspiration.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { embed } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { parse as parseCsv } from 'csv-parse/sync';
import { glob } from 'glob';
import * as fs from 'fs';
import * as path from 'path';

const INSPIRATION_LIBRARY_PROJECT_ID = '22222222-2222-2222-2222-222222222222';
const DEFAULT_USER_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

const DISK_PATTERNS = [
  '01_Inspiration/BlogPosts/**/*.md',
  '01_Inspiration/Videos/**/*.md',
];

const EXCLUDE_PATTERNS = [
  '**/README.md',
  '**/.DS_Store',
  '**/Archive-Notion-Migration/**',
];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const openaiGateway = createOpenAI({
  apiKey: process.env.AI_GATEWAY_API_KEY || '',
  baseURL: 'https://ai-gateway.vercel.sh/v1',
  name: 'vercel-ai-gateway',
});

const embeddingModel = openaiGateway.textEmbeddingModel('text-embedding-3-small');

// files.file_size constraint is <= 10MB in the schema
const MAX_FILE_BYTES = 10_000_000;
const MAX_CONTENT_CHARS = 24_000;

type InspirationDocument = {
  dbFilename: string;
  content: string;
  entityType: string;
  entityName: string;
  fileSize: number;
};

function normalizePathForDb(relativePath: string): string {
  return relativePath.replace(/\\/g, '/');
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeSourceName(sourceFolder: string): string {
  const normalized = sourceFolder.trim();

  if (/^substack-mrrunlocked$/i.test(normalized)) return 'MRR Unlocked';
  if (/^substack-theventurecrew$/i.test(normalized)) return 'The Venture Crew';
  if (/^t2d3$/i.test(normalized)) return 'T2D3';
  if (/^basicarts$/i.test(normalized)) return 'BasicArts';
  if (/^fluint$/i.test(normalized)) return 'Fluint';

  return normalized;
}

function parseInspirationMetadata(relativePath: string): Pick<
  InspirationDocument,
  'entityType' | 'entityName'
> {
  const normalized = relativePath.replace(/\\/g, '/');

  if (normalized.includes('01_Inspiration/BlogPosts/')) {
    const parts = normalized.split('/');
    const idx = parts.indexOf('BlogPosts');
    const sourceFolder = idx !== -1 ? parts[idx + 1] : 'Unknown';
    return {
      entityType: 'inspiration_blog_post',
      entityName: normalizeSourceName(sourceFolder || 'Unknown'),
    };
  }

  if (normalized.includes('01_Inspiration/Videos/')) {
    return {
      entityType: 'inspiration_video',
      entityName: 'Video',
    };
  }

  return { entityType: 'inspiration', entityName: 'Unknown' };
}

async function ensureInspirationProjectExists(): Promise<void> {
  const { data: existing, error: existsError } = await supabase
    .from('projects')
    .select('id')
    .eq('id', INSPIRATION_LIBRARY_PROJECT_ID)
    .maybeSingle();

  if (existsError) {
    console.error('Failed to check inspiration project:', existsError.message);
    process.exit(1);
  }

  if (existing?.id) return;

  const { error: insertError } = await supabase.from('projects').insert({
    id: INSPIRATION_LIBRARY_PROJECT_ID,
    user_id: DEFAULT_USER_ID,
    name: 'Inspiration Library',
    description: 'Blog Migration /01_Inspiration (T2D3, MRR Unlocked, BasicArts, Fluint, Venture Crew)',
    entity_type: 'personal',
    advisory_folder_path: null,
  });

  if (insertError) {
    console.error('Failed to create inspiration project:', insertError.message);
    process.exit(1);
  }
}

async function generateEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: embeddingModel,
    value: text,
  });
  return embedding;
}

async function scanMarkdownInspirationFiles(inspirationRoot: string): Promise<InspirationDocument[]> {
  console.log(`Scanning inspiration files from: ${inspirationRoot}`);

  const inspirationFolder = path.join(inspirationRoot, '01_Inspiration');
  if (!fs.existsSync(inspirationFolder)) {
    console.error('Missing 01_Inspiration/ folder.');
    console.error('Copy Blog Migration/01_Inspiration into the Bobo repo root and re-run.');
    process.exit(1);
  }

  const files = await glob(DISK_PATTERNS, {
    cwd: inspirationRoot,
    ignore: EXCLUDE_PATTERNS,
    nodir: true,
  });

  const inspirationFiles: InspirationDocument[] = [];

  for (const relativePath of files) {
    const fullPath = path.join(inspirationRoot, relativePath);
    const stats = fs.statSync(fullPath);

    if (stats.size > MAX_FILE_BYTES) {
      console.warn(`Skipping oversized file (${stats.size} bytes): ${relativePath}`);
      continue;
    }

    const content = fs.readFileSync(fullPath, 'utf-8');
    if (!content.trim()) continue;

    const { entityType, entityName } = parseInspirationMetadata(relativePath);

    inspirationFiles.push({
      dbFilename: normalizePathForDb(relativePath),
      content,
      entityType,
      entityName,
      fileSize: stats.size,
    });
  }

  console.log(`Found ${inspirationFiles.length} markdown files to index`);
  return inspirationFiles;
}

type LinkedInCsvRow = {
  post_link?: string;
  post_copy?: string;
  post_date?: string;
  likes?: string;
  comments?: string;
  shares?: string;
  has_media?: string;
  media_type?: string;
  media_url?: string;
};

function extractLinkedInAuthorFromCsvFilename(csvFilename: string): string {
  const base = path.basename(csvFilename, '.csv');
  const parts = base.split(' - ');
  const candidate = parts.length >= 2 ? parts[parts.length - 1] : base;
  return candidate.trim() || base.trim();
}

function extractLinkedInActivityId(link: string): string | null {
  const match = link.match(/activity:(\d+)/);
  return match?.[1] ?? null;
}

function buildLinkedInPostMarkdown(options: {
  author: string;
  sourceCsvPath: string;
  link?: string;
  relativeDate?: string;
  likes?: string;
  comments?: string;
  shares?: string;
  hasMedia?: string;
  mediaType?: string;
  mediaUrl?: string;
  copy: string;
}): string {
  const {
    author,
    sourceCsvPath,
    link,
    relativeDate,
    likes,
    comments,
    shares,
    hasMedia,
    mediaType,
    mediaUrl,
    copy,
  } = options;

  const engagementParts = [
    likes ? `${likes} likes` : null,
    comments ? `${comments} comments` : null,
    shares ? `${shares} shares` : null,
  ].filter(Boolean);

  const engagementLine = engagementParts.length > 0 ? engagementParts.join(' · ') : '';

  const mediaLine = hasMedia && hasMedia.toLowerCase() === 'yes'
    ? `Yes${mediaType ? ` (${mediaType})` : ''}${mediaUrl ? ` — ${mediaUrl}` : ''}`
    : 'No';

  const headerLines = [
    '# LinkedIn Post',
    '',
    `Author: ${author}`,
    link ? `URL: ${link}` : null,
    relativeDate ? `Date: ${relativeDate}` : null,
    engagementLine ? `Engagement: ${engagementLine}` : null,
    `Media: ${mediaLine}`,
    `Source CSV: ${sourceCsvPath}`,
  ].filter(Boolean) as string[];

  return `${headerLines.join('\n')}\n\n---\n\n${copy.trim()}\n`;
}

async function scanLinkedInCsvPosts(inspirationRoot: string): Promise<InspirationDocument[]> {
  const csvPaths = await glob('01_Inspiration/LinkedInPosts/**/*.csv', {
    cwd: inspirationRoot,
    ignore: EXCLUDE_PATTERNS,
    nodir: true,
  });

  if (csvPaths.length === 0) return [];

  const docs: InspirationDocument[] = [];

  for (const csvRelativePath of csvPaths) {
    const fullPath = path.join(inspirationRoot, csvRelativePath);
    const csvContent = fs.readFileSync(fullPath, 'utf-8');
    if (!csvContent.trim()) continue;

    const author = extractLinkedInAuthorFromCsvFilename(csvRelativePath);
    const authorSlug = slugify(author) || 'unknown';

    const rows = parseCsv(csvContent, {
      columns: true,
      skip_empty_lines: true,
      relax_quotes: true,
      relax_column_count: true,
      trim: true,
    }) as Array<Record<string, string>>;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i] as LinkedInCsvRow;
      const copy = row.post_copy?.trim();
      if (!copy) continue;

      const link = row.post_link?.trim();
      const activityId = link ? extractLinkedInActivityId(link) : null;
      const stableId = activityId ? `activity-${activityId}` : `row-${i + 1}`;

      const dbFilename = normalizePathForDb(
        `01_Inspiration/LinkedInPosts/${authorSlug}/${stableId}.md`
      );

      const markdown = buildLinkedInPostMarkdown({
        author,
        sourceCsvPath: csvRelativePath,
        link,
        relativeDate: row.post_date?.trim(),
        likes: row.likes?.trim(),
        comments: row.comments?.trim(),
        shares: row.shares?.trim(),
        hasMedia: row.has_media?.trim(),
        mediaType: row.media_type?.trim(),
        mediaUrl: row.media_url?.trim(),
        copy,
      });

      docs.push({
        dbFilename,
        content: markdown,
        entityType: 'inspiration_linkedin_post',
        entityName: author,
        fileSize: Buffer.byteLength(markdown, 'utf-8'),
      });
    }
  }

  console.log(`Found ${docs.length} LinkedIn posts to index (from ${csvPaths.length} CSV file(s))`);
  return docs;
}

async function indexFile(file: InspirationDocument): Promise<boolean> {
  try {
    console.log(`Indexing: ${file.dbFilename}`);

    let contentToEmbed = file.content;
    if (contentToEmbed.length > MAX_CONTENT_CHARS) {
      console.log(`  Truncating for embedding (${contentToEmbed.length} chars -> ${MAX_CONTENT_CHARS})`);
      contentToEmbed =
        contentToEmbed.substring(0, MAX_CONTENT_CHARS) + '\n\n[Content truncated for embedding...]';
    }

    const embedding = await generateEmbedding(contentToEmbed);

    const { error } = await supabase
      .from('files')
      .upsert(
        {
          project_id: INSPIRATION_LIBRARY_PROJECT_ID,
          user_id: DEFAULT_USER_ID,
          filename: file.dbFilename,
          file_type: 'markdown',
          file_size: file.fileSize,
          content_text: file.content,
          embedding,
          entity_type: file.entityType,
          entity_name: file.entityName,
        },
        {
          onConflict: 'project_id,filename',
          ignoreDuplicates: false,
        }
      );

    if (error) {
      console.error(`Error indexing ${file.dbFilename}:`, error.message);
      return false;
    }

    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Failed to index ${file.dbFilename}:`, message);
    return false;
  }
}

async function getAlreadyIndexedFilenames(): Promise<Set<string>> {
  // PostgREST defaults to 1000 rows per request, so we paginate.
  const pageSize = 1000;
  const indexed = new Set<string>();

  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase
      .from('files')
      .select('filename, embedding')
      .eq('project_id', INSPIRATION_LIBRARY_PROJECT_ID)
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.warn('Warning: failed to fetch existing inspiration files (will re-index everything):', error.message);
      return new Set();
    }

    if (!data || data.length === 0) break;

    for (const row of data) {
      if (row.embedding !== null) {
        indexed.add(row.filename as string);
      }
    }

    if (data.length < pageSize) break;
  }

  return indexed;
}

async function main() {
  console.log('Starting inspiration library indexing...\n');

  if (!process.env.AI_GATEWAY_API_KEY) {
    console.error('Error: AI_GATEWAY_API_KEY required for embeddings');
    process.exit(1);
  }

  const inspirationRoot = process.cwd();

  await ensureInspirationProjectExists();

  const markdownFiles = await scanMarkdownInspirationFiles(inspirationRoot);
  const linkedInDocs = await scanLinkedInCsvPosts(inspirationRoot);
  const files = [...markdownFiles, ...linkedInDocs];

  if (files.length === 0) {
    console.log('No inspiration files found. Check 01_Inspiration/ folder structure.');
    return;
  }

  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  const reindexAll = process.env.REINDEX_ALL === '1';
  const alreadyIndexed = reindexAll ? new Set<string>() : await getAlreadyIndexedFilenames();

  if (!reindexAll && alreadyIndexed.size > 0) {
    console.log(`Skipping ${alreadyIndexed.size} already-indexed files (set REINDEX_ALL=1 to force reindex)\n`);
  }

  for (const file of files) {
    if (!reindexAll && alreadyIndexed.has(file.dbFilename)) {
      skippedCount++;
      continue;
    }

    const success = await indexFile(file);
    if (success) successCount++;
    else errorCount++;

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log('\n--- Indexing Complete ---');
  console.log(`Success: ${successCount}`);
  console.log(`Skipped: ${skippedCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Total: ${files.length}`);

  if (errorCount > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
