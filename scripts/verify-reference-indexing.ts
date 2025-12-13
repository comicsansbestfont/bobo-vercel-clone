/**
 * Verify Reference Indexing
 *
 * Checks that reference files are properly indexed with embeddings.
 * Run with: npx tsx scripts/verify-reference-indexing.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { glob } from 'glob';
import * as fs from 'fs';
import * as path from 'path';

const REFERENCE_LIBRARY_PROJECT_ID = '33333333-3333-3333-3333-333333333333';

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

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function extractLinkedInActivityId(value: string): string | null {
  const match = value.match(/activity:(\d+)/);
  return match?.[1] ?? null;
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

type IndexedFileRow = {
  filename: string;
  embedding: unknown;
  entity_type: string | null;
  entity_name: string | null;
};

async function fetchAllIndexedFiles(projectId: string): Promise<IndexedFileRow[]> {
  const pageSize = 1000;
  const all: IndexedFileRow[] = [];

  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase
      .from('files')
      .select('filename, embedding, entity_type, entity_name')
      .eq('project_id', projectId)
      .range(offset, offset + pageSize - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;

    all.push(...(data as IndexedFileRow[]));

    if (data.length < pageSize) break;
  }

  return all;
}

async function verify() {
  console.log('Verifying reference indexing...\n');

  const diskMarkdownFiles = await glob(DISK_PATTERNS, {
    ignore: EXCLUDE_PATTERNS,
    nodir: true,
  });
  console.log(`Markdown files on disk: ${diskMarkdownFiles.length}`);

  // Expected LinkedIn posts (from CSV export)
  const expectedLinkedInFilenames = new Set<string>();
  let expectedLinkedInPosts = 0;

  const csvPath = path.join(process.cwd(), LINKEDIN_CSV_PATH);
  if (fs.existsSync(csvPath)) {
    const content = fs.readFileSync(csvPath, 'utf-8');
    const rows = parseLinkedInExportCsv(content);

    const authorSlug = slugify('Sachee Perera') || 'unknown';

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const copy = row.content?.trim();
      if (!copy) continue;

      expectedLinkedInPosts++;

      const urn = row.urn?.trim();
      const postUrl = row.post_url?.trim();
      const activityId = urn
        ? extractLinkedInActivityId(urn)
        : postUrl
          ? extractLinkedInActivityId(postUrl)
          : null;
      const stableId = activityId ? `activity-${activityId}` : `row-${i + 1}`;

      expectedLinkedInFilenames.add(`04_Reference/LinkedInPosts/${authorSlug}/${stableId}.md`);
    }
  }

  console.log(`LinkedIn posts expected from CSV: ${expectedLinkedInPosts}`);

  let indexedFiles: IndexedFileRow[] = [];
  try {
    indexedFiles = await fetchAllIndexedFiles(REFERENCE_LIBRARY_PROJECT_ID);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Error querying files:', message);
    return;
  }

  console.log(`Files indexed: ${indexedFiles?.length || 0}`);

  const withEmbedding = indexedFiles?.filter((f) => f.embedding !== null).length || 0;
  const withoutEmbedding = (indexedFiles?.length || 0) - withEmbedding;

  console.log(`With embeddings: ${withEmbedding}`);
  console.log(`Without embeddings: ${withoutEmbedding}`);

  // Source breakdown (entity_name)
  const bySource = new Map<string, number>();
  for (const f of indexedFiles || []) {
    const key = (f.entity_name as string | null) || 'Unknown';
    bySource.set(key, (bySource.get(key) || 0) + 1);
  }

  const sourceSummary = [...bySource.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ');

  console.log(`\nSources indexed: ${sourceSummary || '(none)'}`);

  const indexedPaths = new Set(indexedFiles?.map((f) => f.filename) || []);

  // Coverage for markdown files that exist on disk
  const missingMarkdown = diskMarkdownFiles.filter((p) => !indexedPaths.has(p));
  const extraMarkdown = diskMarkdownFiles.length === 0
    ? []
    : [...indexedPaths].filter((p) => p.startsWith('04_Reference/') && !p.startsWith('04_Reference/LinkedInPosts/') && !diskMarkdownFiles.includes(p));

  const markdownCoverage = diskMarkdownFiles.length > 0
    ? (((diskMarkdownFiles.length - missingMarkdown.length) / diskMarkdownFiles.length) * 100).toFixed(1)
    : '0';

  console.log(`\nMarkdown coverage: ${markdownCoverage}%`);

  if (missingMarkdown.length > 0) {
    console.log('\nMissing markdown files:');
    missingMarkdown.slice(0, 10).forEach((f) => console.log(`  - ${f}`));
    if (missingMarkdown.length > 10) {
      console.log(`  ... and ${missingMarkdown.length - 10} more`);
    }
  }

  if (extraMarkdown.length > 0) {
    console.log('\nExtra indexed markdown files (not on disk):');
    extraMarkdown.slice(0, 10).forEach((f) => console.log(`  - ${f}`));
    if (extraMarkdown.length > 10) {
      console.log(`  ... and ${extraMarkdown.length - 10} more`);
    }
  }

  // LinkedIn coverage (synthetic per-post docs)
  const indexedLinkedInFilenames = new Set(
    (indexedFiles || [])
      .filter((f) => f.entity_type === 'reference_linkedin_post')
      .map((f) => f.filename as string)
  );

  const missingLinkedInPosts = [...expectedLinkedInFilenames].filter((p) => !indexedLinkedInFilenames.has(p));
  const extraLinkedInPosts = [...indexedLinkedInFilenames].filter((p) => !expectedLinkedInFilenames.has(p));

  const linkedInCoverage = expectedLinkedInFilenames.size > 0
    ? (((expectedLinkedInFilenames.size - missingLinkedInPosts.length) / expectedLinkedInFilenames.size) * 100).toFixed(1)
    : '0';

  console.log(`\nLinkedIn post coverage: ${linkedInCoverage}%`);
  console.log(`LinkedIn posts indexed: ${indexedLinkedInFilenames.size}`);

  if (missingLinkedInPosts.length > 0) {
    console.log('\nMissing LinkedIn posts:');
    missingLinkedInPosts.slice(0, 10).forEach((f) => console.log(`  - ${f}`));
    if (missingLinkedInPosts.length > 10) {
      console.log(`  ... and ${missingLinkedInPosts.length - 10} more`);
    }
  }

  if (extraLinkedInPosts.length > 0) {
    console.log('\nExtra indexed LinkedIn posts (not in CSV):');
    extraLinkedInPosts.slice(0, 10).forEach((f) => console.log(`  - ${f}`));
    if (extraLinkedInPosts.length > 10) {
      console.log(`  ... and ${extraLinkedInPosts.length - 10} more`);
    }
  }

  console.log('\n--- Verification Summary ---');
  if (
    missingMarkdown.length === 0 &&
    extraMarkdown.length === 0 &&
    missingLinkedInPosts.length === 0 &&
    extraLinkedInPosts.length === 0 &&
    withoutEmbedding === 0
  ) {
    console.log('✅ All files indexed with embeddings');
  } else if (!indexedFiles || indexedFiles.length === 0) {
    console.log('⚠️  No files indexed yet - run: npm run index-reference');
  } else {
    console.log('⚠️  Indexing incomplete - run: npm run index-reference');
  }
}

verify().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
