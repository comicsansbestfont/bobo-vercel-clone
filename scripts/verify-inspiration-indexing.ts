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

const INSPIRATION_LIBRARY_PROJECT_ID = '22222222-2222-2222-2222-222222222222';

const DISK_PATTERNS = [
  '01_Inspiration/BlogPosts/**/*.md',
  '01_Inspiration/LinkedInPosts/**/*.md',
  '01_Inspiration/Videos/**/*.md',
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

async function verify() {
  console.log('Verifying inspiration indexing...\n');

  const diskFiles = await glob(DISK_PATTERNS, {
    ignore: EXCLUDE_PATTERNS,
    nodir: true,
  });
  console.log(`Files on disk: ${diskFiles.length}`);

  const { data: indexedFiles, error: countError } = await supabase
    .from('files')
    .select('filename, embedding, entity_type, entity_name')
    .eq('project_id', INSPIRATION_LIBRARY_PROJECT_ID);

  if (countError) {
    console.error('Error querying files:', countError);
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

  // Coverage & missing/extra files
  const indexedPaths = new Set(indexedFiles?.map((f) => f.filename) || []);
  const diskPaths = new Set(diskFiles);

  const missing = diskFiles.filter((p) => !indexedPaths.has(p));
  const extra = [...indexedPaths].filter((p) => !diskPaths.has(p));

  const coverage = diskFiles.length > 0
    ? (((diskFiles.length - missing.length) / diskFiles.length) * 100).toFixed(1)
    : '0';

  console.log(`\nCoverage: ${coverage}%`);

  if (missing.length > 0) {
    console.log('\nMissing files:');
    missing.slice(0, 10).forEach((f) => console.log(`  - ${f}`));
    if (missing.length > 10) {
      console.log(`  ... and ${missing.length - 10} more`);
    }
  }

  if (extra.length > 0) {
    console.log('\nExtra indexed files (not on disk):');
    extra.slice(0, 10).forEach((f) => console.log(`  - ${f}`));
    if (extra.length > 10) {
      console.log(`  ... and ${extra.length - 10} more`);
    }
  }

  console.log('\n--- Verification Summary ---');
  if (missing.length === 0 && extra.length === 0 && withoutEmbedding === 0) {
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
