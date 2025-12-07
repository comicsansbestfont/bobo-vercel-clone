/**
 * Verify Advisory Indexing
 *
 * Checks that all advisory files are properly indexed with embeddings.
 * Run with: npx tsx scripts/verify-advisory-indexing.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { glob } from 'glob';

const ADVISORY_PROJECT_ID = '11111111-1111-1111-1111-111111111111';
const EXCLUDE_PATTERNS = ['**/_Inbox/**', '**/_raw/**', '**/_TEMPLATE/**', '**/README.md'];

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
  console.log('Verifying advisory indexing...\n');

  // Count files on disk
  const diskFiles = await glob('advisory/**/*.md', {
    ignore: EXCLUDE_PATTERNS,
    nodir: true,
  });
  console.log(`Files on disk: ${diskFiles.length}`);

  // Count indexed files
  const { data: indexedFiles, error: countError } = await supabase
    .from('files')
    .select('filename, embedding, entity_type, entity_name')
    .eq('project_id', ADVISORY_PROJECT_ID);

  if (countError) {
    console.error('Error querying files:', countError);
    return;
  }

  console.log(`Files indexed: ${indexedFiles?.length || 0}`);

  // Check embedding coverage
  const withEmbedding = indexedFiles?.filter(f => f.embedding !== null).length || 0;
  const withoutEmbedding = (indexedFiles?.length || 0) - withEmbedding;

  console.log(`With embeddings: ${withEmbedding}`);
  console.log(`Without embeddings: ${withoutEmbedding}`);

  // Entity breakdown
  const deals = indexedFiles?.filter(f => f.entity_type === 'deal').length || 0;
  const clients = indexedFiles?.filter(f => f.entity_type === 'client').length || 0;
  console.log(`\nEntity breakdown:`);
  console.log(`  Deals: ${deals}`);
  console.log(`  Clients: ${clients}`);

  // Entity names
  const entityNames = [...new Set(indexedFiles?.map(f => f.entity_name) || [])];
  console.log(`\nCompanies indexed: ${entityNames.join(', ')}`);

  // Calculate coverage
  const coverage = diskFiles.length > 0
    ? ((indexedFiles?.length || 0) / diskFiles.length * 100).toFixed(1)
    : 0;
  console.log(`\nCoverage: ${coverage}%`);

  // Find missing files
  const indexedPaths = new Set(indexedFiles?.map(f => f.filename) || []);
  const missing = diskFiles.filter(f => !indexedPaths.has(f));

  if (missing.length > 0) {
    console.log('\nMissing files:');
    missing.slice(0, 10).forEach(f => console.log(`  - ${f}`));
    if (missing.length > 10) {
      console.log(`  ... and ${missing.length - 10} more`);
    }
  }

  // Summary
  console.log('\n--- Verification Summary ---');
  if (diskFiles.length === indexedFiles?.length && withoutEmbedding === 0) {
    console.log('✅ All files indexed with embeddings');
  } else if (indexedFiles?.length === 0) {
    console.log('⚠️  No files indexed yet - run: npm run index-advisory');
  } else {
    console.log('⚠️  Indexing incomplete - run: npm run index-advisory');
  }
}

verify().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
