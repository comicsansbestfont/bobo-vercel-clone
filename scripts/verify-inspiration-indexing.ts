/**
 * Verify Inspiration Indexing
 *
 * Checks that all inspiration files are properly indexed with embeddings.
 * Run with: npx tsx scripts/verify-inspiration-indexing.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { glob } from 'glob';
import { parse as parseCsv } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';

const INSPIRATION_LIBRARY_PROJECT_ID = '22222222-2222-2222-2222-222222222222';

const DISK_PATTERNS = [
  '01_Inspiration/BlogPosts/**/*.md',
  '01_Inspiration/Videos/**/*.md',
];

const LINKEDIN_CSV_PATTERNS = [
  '01_Inspiration/LinkedInPosts/**/*.csv',
];

const EXCLUDE_PATTERNS = [
  '**/README.md',
  '**/.DS_Store',
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

function extractLinkedInAuthorFromCsvFilename(csvPath: string): string {
  const base = path.basename(csvPath, '.csv');
  const parts = base.split(' - ');
  const candidate = parts.length >= 2 ? parts[parts.length - 1] : base;
  return candidate.trim() || base.trim();
}

function extractLinkedInActivityId(link: string): string | null {
  const match = link.match(/activity:(\d+)/);
  return match?.[1] ?? null;
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

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) break;

    all.push(...(data as IndexedFileRow[]));

    if (data.length < pageSize) break;
  }

  return all;
}

async function verify() {
  console.log('Verifying inspiration indexing...\n');

  const diskMarkdownFiles = await glob(DISK_PATTERNS, {
    ignore: EXCLUDE_PATTERNS,
    nodir: true,
  });
  console.log(`Markdown files on disk: ${diskMarkdownFiles.length}`);

  const linkedInCsvFiles = await glob(LINKEDIN_CSV_PATTERNS, {
    ignore: EXCLUDE_PATTERNS,
    nodir: true,
  });

  // Count expected LinkedIn posts by parsing CSVs and generating stable IDs
  const expectedLinkedInFilenames = new Set<string>();
  let expectedLinkedInPosts = 0;

  for (const csvPath of linkedInCsvFiles) {
    const author = extractLinkedInAuthorFromCsvFilename(csvPath);
    const authorSlug = slugify(author) || 'unknown';
    const content = fs.readFileSync(csvPath, 'utf-8');

    const rows = parseCsv(content, {
      columns: true,
      skip_empty_lines: true,
      relax_quotes: true,
      relax_column_count: true,
      trim: true,
    }) as Array<Record<string, string>>;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const copy = row.post_copy?.trim();
      if (!copy) continue;

      expectedLinkedInPosts++;
      const link = row.post_link?.trim();
      const activityId = link ? extractLinkedInActivityId(link) : null;
      const stableId = activityId ? `activity-${activityId}` : `row-${i + 1}`;
      expectedLinkedInFilenames.add(`01_Inspiration/LinkedInPosts/${authorSlug}/${stableId}.md`);
    }
  }

  console.log(`LinkedIn CSV files on disk: ${linkedInCsvFiles.length}`);
  console.log(`LinkedIn posts expected from CSVs: ${expectedLinkedInPosts}`);

  let indexedFiles: IndexedFileRow[] = [];
  try {
    indexedFiles = await fetchAllIndexedFiles(INSPIRATION_LIBRARY_PROJECT_ID);
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

  // Coverage & missing/extra markdown files
  const indexedPaths = new Set(indexedFiles?.map((f) => f.filename) || []);

  const missingMarkdown = diskMarkdownFiles.filter((p) => !indexedPaths.has(p));
  const extraMarkdown = diskMarkdownFiles.length === 0
    ? []
    : [...indexedPaths].filter((p) => (p.startsWith('01_Inspiration/BlogPosts/') || p.startsWith('01_Inspiration/Videos/')) && !diskMarkdownFiles.includes(p));

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

  // LinkedIn post coverage
  const indexedLinkedInFilenames = new Set(
    (indexedFiles || [])
      .filter((f) => f.entity_type === 'inspiration_linkedin_post')
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
    console.log('\nExtra indexed LinkedIn posts (not in CSVs):');
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
    console.log('⚠️  No files indexed yet - run: npm run index-inspiration');
  } else {
    console.log('⚠️  Indexing incomplete - run: npm run index-inspiration');
  }
}

verify().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
