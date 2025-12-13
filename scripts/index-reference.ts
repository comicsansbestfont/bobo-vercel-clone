/**
 * Index Reference Library
 *
 * Scans `04_Reference/` markdown files + the LinkedIn export CSV, generates embeddings,
 * and upserts them to the `files` table under a dedicated project.
 *
 * Run with: npx tsx scripts/index-reference.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { embed } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { glob } from 'glob';
import * as fs from 'fs';
import * as path from 'path';

const REFERENCE_LIBRARY_PROJECT_ID = '33333333-3333-3333-3333-333333333333';
const DEFAULT_USER_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

const DISK_PATTERNS = [
  '04_Reference/**/*.md',
];

const LINKEDIN_CSV_PATH = '04_Reference/linkedin_posts.csv';

const EXCLUDE_PATTERNS = [
  '**/.DS_Store',
  '**/*.backup-*',
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

type ReferenceDocument = {
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

function parseReferenceMetadata(relativePath: string): Pick<
  ReferenceDocument,
  'entityType' | 'entityName'
> {
  const normalized = normalizePathForDb(relativePath);

  if (normalized.startsWith('04_Reference/Identity/')) {
    return { entityType: 'reference_identity', entityName: 'Identity' };
  }

  if (normalized.startsWith('04_Reference/Medium-Blog-Posts/')) {
    return { entityType: 'reference_medium_post', entityName: 'Medium' };
  }

  if (normalized.startsWith('04_Reference/CorePlan-SalesPlaybook/')) {
    return { entityType: 'reference_playbook', entityName: 'CorePlan Sales Playbook' };
  }

  if (normalized.startsWith('04_Reference/Coreplan-customer-success/')) {
    return { entityType: 'reference_playbook', entityName: 'CorePlan Customer Success' };
  }

  if (normalized.startsWith('04_Reference/SwiftCheckin-Training/')) {
    return { entityType: 'reference_playbook', entityName: 'SwiftCheckin Training' };
  }

  if (normalized.startsWith('04_Reference/Angel-Investing/')) {
    return { entityType: 'reference_playbook', entityName: 'Angel Investing' };
  }

  if (normalized.startsWith('04_Reference/Sachee-CorePlan-slidedecks/Markdown/')) {
    return { entityType: 'reference_playbook', entityName: 'CorePlan Slide Decks (Markdown)' };
  }

  if (normalized === '04_Reference/content-guidelines.md') {
    return { entityType: 'reference_guidelines', entityName: 'Content Guidelines' };
  }

  if (normalized === '04_Reference/SACHEE_ISMS_OPERATING_PRINCIPLES.md') {
    return { entityType: 'reference_isms', entityName: 'Sachee-isms' };
  }

  return { entityType: 'reference', entityName: 'Unknown' };
}

async function ensureReferenceProjectExists(): Promise<void> {
  const { data: existing, error: existsError } = await supabase
    .from('projects')
    .select('id')
    .eq('id', REFERENCE_LIBRARY_PROJECT_ID)
    .maybeSingle();

  if (existsError) {
    console.error('Failed to check reference project:', existsError.message);
    process.exit(1);
  }

  if (existing?.id) return;

  const { error: insertError } = await supabase.from('projects').insert({
    id: REFERENCE_LIBRARY_PROJECT_ID,
    user_id: DEFAULT_USER_ID,
    name: 'Reference Library',
    description: '04_Reference (Identity, Medium posts, LinkedIn, playbooks). PPTX/PDF excluded.',
    entity_type: 'personal',
    advisory_folder_path: null,
  });

  if (insertError) {
    console.error('Failed to create reference project:', insertError.message);
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

async function scanMarkdownReferenceFiles(repoRoot: string): Promise<ReferenceDocument[]> {
  const referenceFolder = path.join(repoRoot, '04_Reference');
  if (!fs.existsSync(referenceFolder)) {
    console.error('Missing 04_Reference/ folder.');
    console.error('Copy the Blog Migration/04_Reference markdown + CSV subset into the Bobo repo root and re-run.');
    process.exit(1);
  }

  const files = await glob(DISK_PATTERNS, {
    cwd: repoRoot,
    ignore: EXCLUDE_PATTERNS,
    nodir: true,
  });

  const docs: ReferenceDocument[] = [];

  for (const relativePath of files) {
    const fullPath = path.join(repoRoot, relativePath);
    const stats = fs.statSync(fullPath);

    if (stats.size > MAX_FILE_BYTES) {
      console.warn(`Skipping oversized file (${stats.size} bytes): ${relativePath}`);
      continue;
    }

    const content = fs.readFileSync(fullPath, 'utf-8');
    if (!content.trim()) continue;

    const { entityType, entityName } = parseReferenceMetadata(relativePath);

    docs.push({
      dbFilename: normalizePathForDb(relativePath),
      content,
      entityType,
      entityName,
      fileSize: stats.size,
    });
  }

  console.log(`Found ${docs.length} markdown files to index`);
  return docs;
}

type LinkedInExportRow = {
  post_number?: string;
  urn?: string;
  post_url?: string;
  post_date?: string;
  content?: string;
  likes?: string;
  comments?: string;
  impressions?: string;
  analytics_url?: string;
  image_urls?: string;
};

function parseLinkedInExportCsv(csvContent: string): LinkedInExportRow[] {
  const normalized = csvContent.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');

  const recordStartIndices: number[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('Feed post number ')) {
      recordStartIndices.push(i);
    }
  }

  const records: LinkedInExportRow[] = [];
  for (let i = 0; i < recordStartIndices.length; i++) {
    const start = recordStartIndices[i];
    const end = i + 1 < recordStartIndices.length ? recordStartIndices[i + 1] : lines.length;
    const chunk = lines.slice(start, end).join('\n').trimEnd();
    const parsed = parseLinkedInExportRecord(chunk);
    if (parsed) records.push(parsed);
  }

  return records;
}

function parseLinkedInExportRecord(record: string): LinkedInExportRow | null {
  const commaIndices: number[] = [];
  let searchFrom = 0;

  for (let i = 0; i < 4; i++) {
    const idx = record.indexOf(',', searchFrom);
    if (idx === -1) return null;
    commaIndices.push(idx);
    searchFrom = idx + 1;
  }

  const post_number = record.substring(0, commaIndices[0]).trim();
  const urn = record.substring(commaIndices[0] + 1, commaIndices[1]).trim();
  const post_url = record.substring(commaIndices[1] + 1, commaIndices[2]).trim();
  const post_date = record.substring(commaIndices[2] + 1, commaIndices[3]).trim();

  const remainder = record.substring(commaIndices[3] + 1).trimEnd();

  const analyticsMarker = 'https://www.linkedin.com/analytics/post-summary/';
  const analyticsStart = remainder.lastIndexOf(analyticsMarker);

  let content = remainder;
  let likes = '';
  let comments = '';
  let impressions = '';
  let analytics_url = '';
  let image_urls = '';

  if (analyticsStart !== -1) {
    const commaBeforeAnalytics = remainder.lastIndexOf(',', analyticsStart - 1);
    if (commaBeforeAnalytics !== -1) {
      const tail = remainder.substring(analyticsStart);
      const commaAfterAnalytics = tail.indexOf(',');
      if (commaAfterAnalytics !== -1) {
        analytics_url = tail.substring(0, commaAfterAnalytics).trim();
        image_urls = tail.substring(commaAfterAnalytics + 1).trim();
      } else {
        analytics_url = tail.trim();
      }

      const prefix = remainder.substring(0, commaBeforeAnalytics);
      const tailMatch = prefix.match(/([\s\S]*),([^,\n]*),([^,\n]*),("([^"]*)"|[^,\n]*)$/);

      if (tailMatch) {
        content = tailMatch[1];
        likes = (tailMatch[2] || '').trim();
        comments = (tailMatch[3] || '').trim();
        const rawImpressions = (tailMatch[5] ?? tailMatch[4] ?? '').trim();
        impressions = rawImpressions.replace(/^"|"$/g, '');
      } else {
        content = prefix;
      }
    }
  }

  return {
    post_number,
    urn,
    post_url,
    post_date,
    content: content.trim(),
    likes,
    comments,
    impressions,
    analytics_url: analytics_url.trim(),
    image_urls: image_urls.trim(),
  };
}

function extractLinkedInActivityId(value: string): string | null {
  const match = value.match(/activity:(\d+)/);
  return match?.[1] ?? null;
}

function buildLinkedInExportPostMarkdown(options: {
  author: string;
  sourceCsvPath: string;
  postNumber?: string;
  urn?: string;
  postUrl?: string;
  postDate?: string;
  likes?: string;
  comments?: string;
  impressions?: string;
  analyticsUrl?: string;
  imageUrls?: string;
  content: string;
}): string {
  const {
    author,
    sourceCsvPath,
    postNumber,
    urn,
    postUrl,
    postDate,
    likes,
    comments,
    impressions,
    analyticsUrl,
    imageUrls,
    content,
  } = options;

  const engagementParts = [
    likes ? `${likes} likes` : null,
    comments ? `${comments} comments` : null,
    impressions ? `${impressions}` : null,
  ].filter(Boolean);

  const headerLines = [
    '# LinkedIn Post',
    '',
    `Author: ${author}`,
    postNumber ? `Post: ${postNumber}` : null,
    urn ? `URN: ${urn}` : null,
    postUrl ? `URL: ${postUrl}` : null,
    postDate ? `Date: ${postDate}` : null,
    engagementParts.length > 0 ? `Engagement: ${engagementParts.join(' · ')}` : null,
    analyticsUrl ? `Analytics URL: ${analyticsUrl}` : null,
    imageUrls ? `Images: ${imageUrls}` : null,
    `Source CSV: ${sourceCsvPath}`,
  ].filter(Boolean) as string[];

  return `${headerLines.join('\n')}\n\n---\n\n${content.trim()}\n`;
}

async function scanLinkedInExportPosts(repoRoot: string): Promise<ReferenceDocument[]> {
  const csvPath = path.join(repoRoot, LINKEDIN_CSV_PATH);
  if (!fs.existsSync(csvPath)) return [];

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  if (!csvContent.trim()) return [];

  const author = 'Sachee Perera';
  const authorSlug = slugify(author) || 'unknown';
  const rows = parseLinkedInExportCsv(csvContent);

  const docs: ReferenceDocument[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const copy = row.content?.trim();
    if (!copy) continue;

    const urn = row.urn?.trim();
    const postUrl = row.post_url?.trim();
    const activityId = urn
      ? extractLinkedInActivityId(urn)
      : postUrl
        ? extractLinkedInActivityId(postUrl)
        : null;
    const stableId = activityId ? `activity-${activityId}` : `row-${i + 1}`;

    const dbFilename = normalizePathForDb(
      `04_Reference/LinkedInPosts/${authorSlug}/${stableId}.md`
    );

    const markdown = buildLinkedInExportPostMarkdown({
      author,
      sourceCsvPath: LINKEDIN_CSV_PATH,
      postNumber: row.post_number?.trim(),
      urn,
      postUrl,
      postDate: row.post_date?.trim(),
      likes: row.likes?.trim(),
      comments: row.comments?.trim(),
      impressions: row.impressions?.trim(),
      analyticsUrl: row.analytics_url?.trim(),
      imageUrls: row.image_urls?.trim(),
      content: copy,
    });

    docs.push({
      dbFilename,
      content: markdown,
      entityType: 'reference_linkedin_post',
      entityName: author,
      fileSize: Buffer.byteLength(markdown, 'utf-8'),
    });
  }

  console.log(`Found ${docs.length} LinkedIn posts to index (from ${LINKEDIN_CSV_PATH})`);
  return docs;
}

async function indexFile(file: ReferenceDocument): Promise<boolean> {
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
          project_id: REFERENCE_LIBRARY_PROJECT_ID,
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
      .eq('project_id', REFERENCE_LIBRARY_PROJECT_ID)
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.warn('Warning: failed to fetch existing reference files (will re-index everything):', error.message);
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
  console.log('Starting reference library indexing...\n');

  if (!process.env.AI_GATEWAY_API_KEY) {
    console.error('Error: AI_GATEWAY_API_KEY required for embeddings');
    process.exit(1);
  }

  const repoRoot = process.cwd();

  await ensureReferenceProjectExists();

  const markdownFiles = await scanMarkdownReferenceFiles(repoRoot);
  const linkedInDocs = await scanLinkedInExportPosts(repoRoot);
  const files = [...markdownFiles, ...linkedInDocs];

  if (files.length === 0) {
    console.log('No reference files found. Check 04_Reference/ folder structure.');
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
