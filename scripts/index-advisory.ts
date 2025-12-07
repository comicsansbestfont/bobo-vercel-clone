/**
 * Index Advisory Files
 *
 * Scans advisory markdown files, generates embeddings, upserts to files table.
 * Run with: npx tsx scripts/index-advisory.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { embed } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { glob } from 'glob';
import * as fs from 'fs';
import * as path from 'path';

// Fixed project ID for all advisory files
const ADVISORY_PROJECT_ID = '11111111-1111-1111-1111-111111111111';
const DEFAULT_USER_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

// Exclude patterns
const EXCLUDE_PATTERNS = ['**/_Inbox/**', '**/_raw/**', '**/_TEMPLATE/**'];

// Create Supabase client directly (can't import from lib due to module resolution)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Create OpenAI provider for embeddings
const openaiGateway = createOpenAI({
  apiKey: process.env.AI_GATEWAY_API_KEY || '',
  baseURL: 'https://ai-gateway.vercel.sh/v1',
  name: 'vercel-ai-gateway',
});

const embeddingModel = openaiGateway.textEmbeddingModel('text-embedding-3-small');

interface AdvisoryFile {
  filepath: string;
  filename: string;
  content: string;
  entityType: 'deal' | 'client' | 'identity';
  entityName: string;
  fileSize: number;
}

/**
 * Generate embedding for text
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: embeddingModel,
    value: text,
  });
  return embedding;
}

/**
 * Parse entity info from file path
 * e.g., advisory/deals/MyTab/master-doc-mytab.md -> { entityType: 'deal', entityName: 'MyTab' }
 * e.g., advisory/identity/Sachee/CORE_PROFILE.md -> { entityType: 'identity', entityName: 'Sachee' }
 */
function parseFilePath(filepath: string): { entityType: 'deal' | 'client' | 'identity'; entityName: string } {
  const parts = filepath.split(path.sep);
  const advisoryIdx = parts.findIndex(p => p === 'advisory');

  if (advisoryIdx === -1 || parts.length < advisoryIdx + 3) {
    return { entityType: 'deal', entityName: 'unknown' };
  }

  const typeFolder = parts[advisoryIdx + 1]; // 'deals', 'clients', or 'identity'
  const entityName = parts[advisoryIdx + 2]; // Company/person name

  let entityType: 'deal' | 'client' | 'identity';
  if (typeFolder === 'clients') {
    entityType = 'client';
  } else if (typeFolder === 'identity') {
    entityType = 'identity';
  } else {
    entityType = 'deal';
  }

  return {
    entityType,
    entityName,
  };
}

async function scanAdvisoryFiles(): Promise<AdvisoryFile[]> {
  console.log('Scanning advisory files...');

  const files = await glob('advisory/**/*.md', {
    ignore: EXCLUDE_PATTERNS,
    nodir: true,
  });

  const advisoryFiles: AdvisoryFile[] = [];

  for (const filepath of files) {
    const content = fs.readFileSync(filepath, 'utf-8');
    const stats = fs.statSync(filepath);
    const { entityType, entityName } = parseFilePath(filepath);

    // Skip files larger than 100KB (embedding limit)
    if (stats.size > 100000) {
      console.warn(`Skipping large file (${stats.size} bytes): ${filepath}`);
      continue;
    }

    // Skip README files
    if (path.basename(filepath).toLowerCase() === 'readme.md') {
      console.log(`Skipping README: ${filepath}`);
      continue;
    }

    advisoryFiles.push({
      filepath,
      filename: path.basename(filepath),
      content,
      entityType,
      entityName,
      fileSize: stats.size,
    });
  }

  console.log(`Found ${advisoryFiles.length} advisory files to index`);
  return advisoryFiles;
}

// Maximum characters for embedding (approx 6000 tokens = ~24000 chars)
const MAX_CONTENT_CHARS = 24000;

async function indexFile(file: AdvisoryFile): Promise<boolean> {
  try {
    console.log(`Indexing: ${file.filepath}`);

    // Truncate content if too long for embedding model
    let contentToEmbed = file.content;
    if (file.content.length > MAX_CONTENT_CHARS) {
      console.log(`  Truncating large file (${file.content.length} chars -> ${MAX_CONTENT_CHARS})`);
      contentToEmbed = file.content.substring(0, MAX_CONTENT_CHARS) + '\n\n[Content truncated for embedding...]';
    }

    // Generate embedding
    const embedding = await generateEmbedding(contentToEmbed);

    // Upsert to files table using full filepath as filename for uniqueness
    const { error } = await supabase
      .from('files')
      .upsert({
        project_id: ADVISORY_PROJECT_ID,
        user_id: DEFAULT_USER_ID,
        filename: file.filepath, // Use full path for uniqueness
        file_type: 'markdown',
        file_size: file.fileSize,
        content_text: file.content,
        embedding,
        entity_type: file.entityType,
        entity_name: file.entityName,
      }, {
        onConflict: 'project_id,filename',
        ignoreDuplicates: false,
      });

    if (error) {
      console.error(`Error indexing ${file.filepath}:`, error.message);
      return false;
    }

    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Failed to index ${file.filepath}:`, message);
    return false;
  }
}

async function main() {
  console.log('Starting advisory file indexing...\n');

  // Check for API key
  if (!process.env.AI_GATEWAY_API_KEY) {
    console.error('Error: AI_GATEWAY_API_KEY required for embeddings');
    process.exit(1);
  }

  const files = await scanAdvisoryFiles();

  if (files.length === 0) {
    console.log('No files to index. Make sure advisory/ directory exists.');
    return;
  }

  let successCount = 0;
  let errorCount = 0;

  for (const file of files) {
    const success = await indexFile(file);
    if (success) {
      successCount++;
    } else {
      errorCount++;
    }

    // Rate limit: 100ms between API calls
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n--- Indexing Complete ---');
  console.log(`Success: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Total: ${files.length}`);

  if (errorCount > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
