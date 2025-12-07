# Sprint M37-01 Execution Guide

**Sprint:** M37-01 - Repository Consolidation (Advisory Core)
**Duration:** December 7-10, 2025
**Prepared:** December 7, 2025

---

## TL;DR (Plain English Summary)

This sprint brings the advisory files (Deals and Clients folders from Blog Migration) into the Bobo repository and makes them searchable via a new Agent tool called `search_advisory`.

**Why it matters:** Currently, when you ask Bobo "Brief me on MyTab", it can only return what's stored in memory entries (facts we seeded). But the actual master docs, meeting notes, and client profiles live in separate files. This sprint connects those files so Bobo can retrieve actual document content.

**The core idea:** We copy the advisory files into the repo, run an indexing script that generates embeddings and stores them in Supabase's `files` table, then expose a `search_advisory` agent tool that performs hybrid search (70% vector + 30% text) just like the memory tools.

**What success looks like:** When you ask "Brief me on MyTab", Bobo retrieves the actual master-doc content with red flags, recent meetings, and valuation analysis - not just the seeded memory facts.

---

## Architecture Overview

### System Architecture
```
┌──────────────────────────────────────────────────────────────────────┐
│                         Agent Mode Chat                               │
└───────────────────────────────┬──────────────────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
            ┌───────▼───────┐       ┌───────▼───────┐
            │ search_memory │       │search_advisory│  ← NEW
            │  (memories)   │       │   (files)     │
            └───────┬───────┘       └───────┬───────┘
                    │                       │
            ┌───────▼───────────────────────▼───────┐
            │           Supabase Database            │
            ├────────────────┬──────────────────────┤
            │ memory_entries │       files          │
            │   (50 rows)    │ (70+ advisory docs)  │
            └────────────────┴──────────────────────┘
```

### Data Flow (Indexing)
```
Blog Migration/Deals/*.md  ───┐
Blog Migration/Clients/*.md ──┼──► advisory/**/*.md ──► index-advisory.ts
                              │         │
                              │         ├──► Generate embedding (OpenAI)
                              │         ├──► Extract metadata from path
                              │         └──► Upsert to files table
                              │
                              └──► project_id = 'advisory-knowledge-base'
```

### Data Flow (Search)
```
User Query: "Brief me on MyTab"
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│ search_advisory tool                                             │
│  1. Generate query embedding                                     │
│  2. Call search_advisory_files RPC                               │
│  3. Hybrid: 70% vector + 30% BM25 text match                    │
│  4. Filter by entity_name if provided                           │
│  5. Return top 5 file excerpts                                  │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
"MyTab master doc: $24K ARR, Phase 1a, Mikaela Greene founder..."
```

---

## Quick Start (15 minutes)

```bash
# 1. Ensure you're on the right branch
git checkout feature/m36-cognitive-memory

# 2. Verify build works before changes
npm run build

# 3. After implementation, run indexing
npm run index-advisory

# 4. Verify
npm run dev
# Test: "Brief me on MyTab" in Agent Mode
```

**Environment:** OpenAI API key required (already in `.env.local`)

---

## Tasks

### Phase 1: Foundation Setup (3.5h)

| Task | What to Do | Hours |
|------|------------|-------|
| 1.1 | Create `advisory/` directories, copy files from Blog Migration | 1.5h |
| 1.2 | Create `search_advisory_files` RPC function in Supabase | 1.5h |
| 1.3 | Add TypeScript types for advisory search results | 0.5h |

### Phase 2: Indexing Infrastructure (3h)

| Task | What to Do | Hours |
|------|------------|-------|
| 2.1 | Build `scripts/index-advisory.ts` to generate embeddings | 2.5h |
| 2.2 | Add `npm run index-advisory` to package.json | 0.5h |

### Phase 3: Agent Tool Implementation (3h)

| Task | What to Do | Hours |
|------|------------|-------|
| 3.1 | Create `lib/agent-sdk/advisory-tools.ts` with `search_advisory` | 2.0h |
| 3.2 | Register tool in tool-config.ts, utils.ts, server.ts | 1.0h |

### Phase 4: Testing (2.5h)

| Task | What to Do | Hours |
|------|------------|-------|
| 4.1 | Create verification script for indexing coverage | 1.0h |
| 4.2 | Manual testing with 6 validation queries | 1.5h |

### Phase 5: Documentation (1h)

| Task | What to Do | Hours |
|------|------------|-------|
| 5.1 | Update CLAUDE.md with advisory system docs | 0.5h |
| 5.2 | Update backlog, archive sprint | 0.5h |

**Total: 13h** (+ 1h buffer)

---

## Files to Create

```
advisory/
├── deals/
│   ├── MyTab/                  # All MyTab files
│   ├── SwiftCheckin/           # All SwiftCheckin deal files
│   ├── ArcheloLab/             # etc.
│   ├── ControlShiftAI/
│   ├── Talvin/
│   └── Tandm/
├── clients/
│   └── SwiftCheckin/           # Client profile
└── README.md                   # Structure guide

scripts/
├── index-advisory.ts           # Indexing script
└── verify-advisory-indexing.ts # Verification script

lib/agent-sdk/
└── advisory-tools.ts           # Advisory search tool

supabase/migrations/
└── [timestamp]_search_advisory_files.sql
```

---

## Implementation Details

### Task 1.1: Create Directory Structure + Copy Files

**What it does:** Copy advisory files from Blog Migration repo into Bobo

```bash
# Create directories
mkdir -p advisory/deals advisory/clients

# Copy files (excluding _Inbox, _raw, _TEMPLATE)
cp -r "/Users/sacheeperera/VibeCoding Projects/Blog Migration/Deals/"* advisory/deals/
cp -r "/Users/sacheeperera/VibeCoding Projects/Blog Migration/Clients/"* advisory/clients/

# Remove excluded directories
rm -rf advisory/**/_Inbox advisory/**/_raw advisory/**/_TEMPLATE
```

**Update .gitignore:**
```
# Advisory file excludes
advisory/**/_Inbox/
advisory/**/_raw/
```

**Create advisory/README.md:**
```markdown
# Advisory Files

Local repository of deal and client documentation for Bobo's advisory search.

## Structure
- `deals/[Company]/` - Deal documentation (master-doc, meetings, comms)
- `clients/[Company]/` - Client profiles and engagement history

## Syncing
After modifying files, run: `npm run index-advisory`

## Indexed Files
~70 markdown files with embeddings in Supabase `files` table.
```

---

### Task 1.2: Database Migration - Search RPC

**File:** `supabase/migrations/[timestamp]_search_advisory_files.sql`

**What it does:** Creates hybrid search function for advisory files

```sql
-- Add metadata columns to files table for advisory filtering
ALTER TABLE files
ADD COLUMN IF NOT EXISTS entity_type text,
ADD COLUMN IF NOT EXISTS entity_name text;

-- Create text search vector for BM25
ALTER TABLE files
ADD COLUMN IF NOT EXISTS fts tsvector
GENERATED ALWAYS AS (to_tsvector('english', coalesce(filename, '') || ' ' || coalesce(content_text, ''))) STORED;

-- Create index for text search
CREATE INDEX IF NOT EXISTS files_fts_idx ON files USING gin(fts);

-- Advisory file search function with hybrid scoring
CREATE OR REPLACE FUNCTION search_advisory_files(
  query_embedding vector(1536),
  query_text text,
  p_project_id uuid DEFAULT NULL,
  entity_type_filter text DEFAULT NULL,
  entity_name_filter text DEFAULT NULL,
  match_count int DEFAULT 5,
  vector_weight float DEFAULT 0.7,
  text_weight float DEFAULT 0.3,
  min_similarity float DEFAULT 0.3
)
RETURNS TABLE (
  id uuid,
  filename text,
  content_text text,
  entity_type text,
  entity_name text,
  file_type text,
  vector_score float,
  text_score float,
  combined_score float
)
LANGUAGE plpgsql
AS $$
DECLARE
  max_text_rank float;
BEGIN
  -- Get max text rank for normalization
  SELECT MAX(ts_rank_cd(f.fts, plainto_tsquery('english', query_text)))
  INTO max_text_rank
  FROM files f
  WHERE (p_project_id IS NULL OR f.project_id = p_project_id)
    AND f.embedding IS NOT NULL;

  -- Handle case where no text matches
  IF max_text_rank IS NULL OR max_text_rank = 0 THEN
    max_text_rank := 1.0;
  END IF;

  RETURN QUERY
  SELECT
    f.id,
    f.filename,
    f.content_text,
    f.entity_type,
    f.entity_name,
    f.file_type,
    (1 - (f.embedding <=> query_embedding))::float AS vector_score,
    (ts_rank_cd(f.fts, plainto_tsquery('english', query_text)) / max_text_rank)::float AS text_score,
    (
      vector_weight * (1 - (f.embedding <=> query_embedding)) +
      text_weight * (ts_rank_cd(f.fts, plainto_tsquery('english', query_text)) / max_text_rank)
    )::float AS combined_score
  FROM files f
  WHERE f.embedding IS NOT NULL
    AND (p_project_id IS NULL OR f.project_id = p_project_id)
    AND (entity_type_filter IS NULL OR f.entity_type = entity_type_filter)
    AND (entity_name_filter IS NULL OR f.entity_name ILIKE '%' || entity_name_filter || '%')
    AND (1 - (f.embedding <=> query_embedding)) >= min_similarity
  ORDER BY combined_score DESC
  LIMIT match_count;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION search_advisory_files TO authenticated, anon;
```

---

### Task 1.3: TypeScript Type Definitions

**File:** `lib/db/types.ts`

**Add to existing types:**

```typescript
// Advisory search result type
export type AdvisorySearchResult = {
  id: string;
  filename: string;
  content_text: string;
  entity_type: string | null;
  entity_name: string | null;
  file_type: string;
  vector_score: number;
  text_score: number;
  combined_score: number;
};

// Add to Database.Functions if using generated types
export interface DatabaseFunctions {
  // ... existing functions ...

  search_advisory_files: {
    Args: {
      query_embedding: number[];
      query_text: string;
      p_project_id?: string;
      entity_type_filter?: string;
      entity_name_filter?: string;
      match_count?: number;
      vector_weight?: number;
      text_weight?: number;
      min_similarity?: number;
    };
    Returns: AdvisorySearchResult[];
  };
}
```

---

### Task 2.1: Build Indexing Script

**File:** `scripts/index-advisory.ts`

**What it does:** Scans advisory files, generates embeddings, upserts to Supabase

```typescript
/**
 * Index Advisory Files
 *
 * Scans advisory/**/*.md, generates embeddings, upserts to files table.
 * Run with: npx tsx scripts/index-advisory.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { supabase, DEFAULT_USER_ID } from '../lib/db/client';
import { generateEmbedding } from '../lib/ai/embedding';
import { glob } from 'glob';
import * as fs from 'fs';
import * as path from 'path';

// Fixed project ID for all advisory files
const ADVISORY_PROJECT_ID = 'advisory-knowledge-base';

// Exclude patterns
const EXCLUDE_PATTERNS = ['**/_Inbox/**', '**/_raw/**', '**/_TEMPLATE/**'];

interface AdvisoryFile {
  filepath: string;
  filename: string;
  content: string;
  entityType: 'deal' | 'client';
  entityName: string;
  fileSize: number;
}

/**
 * Parse entity info from file path
 * e.g., advisory/deals/MyTab/master-doc-mytab.md -> { entityType: 'deal', entityName: 'MyTab' }
 */
function parseFilePath(filepath: string): { entityType: 'deal' | 'client'; entityName: string } {
  const parts = filepath.split(path.sep);
  const advisoryIdx = parts.findIndex(p => p === 'advisory');

  if (advisoryIdx === -1 || parts.length < advisoryIdx + 3) {
    return { entityType: 'deal', entityName: 'unknown' };
  }

  const typeFolder = parts[advisoryIdx + 1]; // 'deals' or 'clients'
  const entityName = parts[advisoryIdx + 2]; // Company name

  return {
    entityType: typeFolder === 'clients' ? 'client' : 'deal',
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

    advisoryFiles.push({
      filepath,
      filename: path.basename(filepath),
      content,
      entityType,
      entityName,
      fileSize: stats.size,
    });
  }

  console.log(`Found ${advisoryFiles.length} advisory files`);
  return advisoryFiles;
}

async function indexFile(file: AdvisoryFile): Promise<boolean> {
  try {
    console.log(`Indexing: ${file.filepath}`);

    // Generate embedding
    const embedding = await generateEmbedding(file.content);

    // Upsert to files table
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
      console.error(`Error indexing ${file.filepath}:`, error);
      return false;
    }

    return true;
  } catch (err) {
    console.error(`Failed to index ${file.filepath}:`, err);
    return false;
  }
}

async function main() {
  console.log('Starting advisory file indexing...\n');

  // Check for API key
  if (!process.env.OPENAI_API_KEY && !process.env.AI_GATEWAY_API_KEY) {
    console.error('Error: OPENAI_API_KEY or AI_GATEWAY_API_KEY required');
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

main().catch(console.error);
```

---

### Task 2.2: Package.json Integration

**File:** `package.json`

**Add to scripts:**
```json
{
  "scripts": {
    "index-advisory": "npx tsx scripts/index-advisory.ts",
    "verify-advisory": "npx tsx scripts/verify-advisory-indexing.ts"
  }
}
```

---

### Task 3.1: Create Advisory Tools Module

**File:** `lib/agent-sdk/advisory-tools.ts`

**What it does:** Exposes `search_advisory` tool for Agent Mode

```typescript
/**
 * M3.7: Advisory File Search Tool
 *
 * Agent tool for searching indexed advisory files (deals, clients, meetings).
 * Uses hybrid search (70% vector + 30% text) matching memory-tools pattern.
 */

import { z } from 'zod';
import { generateEmbedding } from '@/lib/ai/embedding';
import { supabase } from '@/lib/db/client';
import type { AdvisorySearchResult } from '@/lib/db/types';

// Fixed project ID for advisory files
const ADVISORY_PROJECT_ID = 'advisory-knowledge-base';

// Entity type options
const ENTITY_TYPES = ['deal', 'client', 'all'] as const;

// ============================================================================
// Types
// ============================================================================

export type AdvisoryToolResult = {
  success: boolean;
  message: string;
  results?: AdvisorySearchResult[];
};

// ============================================================================
// Tool Definition
// ============================================================================

/**
 * search_advisory - Search advisory files (deals, clients, meetings)
 *
 * Auto-approved (read-only operation)
 */
export const searchAdvisoryTool = {
  name: 'search_advisory',

  description: `Search advisory files including deal master docs, client profiles, and meeting notes.
Use when: User asks about specific deals, clients, meetings, or wants briefings.
Returns: Relevant file excerpts with similarity scores.
Examples: "Brief me on MyTab", "What's the valuation for Talvin?", "Show me SwiftCheckin client profile"`,

  parameters: z.object({
    query: z
      .string()
      .min(1)
      .max(500)
      .describe('Search query - company name, topic, or natural language question'),
    entity_type: z
      .enum(ENTITY_TYPES)
      .default('all')
      .describe('Filter by entity type: deal, client, or all'),
    entity_name: z
      .string()
      .optional()
      .describe('Filter by specific company/entity name (e.g., "MyTab", "SwiftCheckin")'),
    limit: z
      .number()
      .min(1)
      .max(20)
      .default(5)
      .describe('Max results to return'),
  }),

  execute: async ({
    query,
    entity_type = 'all',
    entity_name,
    limit = 5,
  }: {
    query: string;
    entity_type?: 'deal' | 'client' | 'all';
    entity_name?: string;
    limit?: number;
  }): Promise<string> => {
    try {
      console.log(`[search_advisory] Searching for: "${query}"`, {
        entity_type,
        entity_name,
        limit,
      });

      // Generate embedding for semantic search
      const embedding = await generateEmbedding(query);

      // Call advisory search RPC
      const { data: results, error } = await supabase.rpc(
        'search_advisory_files',
        {
          query_embedding: embedding,
          query_text: query,
          p_project_id: ADVISORY_PROJECT_ID,
          entity_type_filter: entity_type === 'all' ? null : entity_type,
          entity_name_filter: entity_name ?? null,
          match_count: limit,
          vector_weight: 0.7,
          text_weight: 0.3,
          min_similarity: 0.3,
        }
      );

      if (error) {
        console.error('[search_advisory] RPC error:', error);
        throw new Error(`Advisory search failed: ${error.message}`);
      }

      if (!results || results.length === 0) {
        console.log('[search_advisory] No results found');
        return 'No matching advisory files found. Try different keywords or entity names.';
      }

      // Format results for agent consumption
      const formatted = (results as AdvisorySearchResult[])
        .map((r, i) => {
          // Truncate content to ~500 chars for readability
          const excerpt = r.content_text.length > 500
            ? r.content_text.substring(0, 500) + '...'
            : r.content_text;

          return `[${i + 1}] ${r.entity_name} (${r.entity_type})\nFile: ${r.filename}\nScore: ${r.combined_score.toFixed(2)}\n---\n${excerpt}`;
        })
        .join('\n\n');

      console.log(`[search_advisory] Found ${results.length} files`);
      return `Found ${results.length} advisory files:\n\n${formatted}`;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[search_advisory] Failed:', error);
      return `Advisory search failed: ${errorMessage}`;
    }
  },
};

// ============================================================================
// Tool Collection Export
// ============================================================================

/**
 * All advisory tools for agent use
 */
export const advisoryTools = {
  search_advisory: searchAdvisoryTool,
};

/**
 * Advisory tool names for configuration
 */
export const ADVISORY_TOOL_NAMES = Object.keys(advisoryTools);

/**
 * Get an advisory tool by name
 */
export function getAdvisoryTool(name: string) {
  return advisoryTools[name as keyof typeof advisoryTools];
}
```

---

### Task 3.2: Register Tool in Configuration

**File:** `lib/agent-sdk/tool-config.ts`

**Add to allowedTools:**
```typescript
export const FULL_AGENT_TOOL_CONFIG = {
  allowedTools: [
    // ... existing tools ...
    'search_advisory',  // M3.7: Advisory file search
  ],
};
```

**File:** `lib/agent-sdk/utils.ts`

**Add to descriptions/icons:**
```typescript
export const TOOL_DESCRIPTIONS: Record<string, string> = {
  // ... existing ...
  search_advisory: 'Search advisory files (deals, clients, meetings)',
};

export const TOOL_ICONS: Record<string, string> = {
  // ... existing ...
  search_advisory: 'file-text',  // or 'briefcase'
};

export const TOOL_EMOJIS: Record<string, string> = {
  // ... existing ...
  search_advisory: '📂',
};

// Add to AUTO_APPROVED_TOOLS (read-only)
export const AUTO_APPROVED_TOOLS = [
  'search_memory',
  'search_advisory',  // M3.7: Read-only, auto-approve
  // ... others ...
];
```

**File:** `lib/agent-sdk/server.ts`

**Export advisory tools:**
```typescript
// Add import
export { advisoryTools, searchAdvisoryTool, ADVISORY_TOOL_NAMES } from './advisory-tools';
```

---

### Task 4.1: Verification Script

**File:** `scripts/verify-advisory-indexing.ts`

```typescript
/**
 * Verify Advisory Indexing
 *
 * Checks that all advisory files are properly indexed with embeddings.
 * Run with: npx tsx scripts/verify-advisory-indexing.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { supabase } from '../lib/db/client';
import { glob } from 'glob';

const ADVISORY_PROJECT_ID = 'advisory-knowledge-base';
const EXCLUDE_PATTERNS = ['**/_Inbox/**', '**/_raw/**', '**/_TEMPLATE/**'];

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
    .select('filename, embedding')
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
    missing.forEach(f => console.log(`  - ${f}`));
  }

  // Summary
  console.log('\n--- Verification Summary ---');
  if (diskFiles.length === indexedFiles?.length && withoutEmbedding === 0) {
    console.log('✅ All files indexed with embeddings');
  } else {
    console.log('⚠️  Indexing incomplete - run npm run index-advisory');
  }
}

verify().catch(console.error);
```

---

## Reuse Existing Code

**Embedding Generation:**
```typescript
// lib/ai/embedding.ts - already exists
import { generateEmbedding } from '@/lib/ai/embedding';
const embedding = await generateEmbedding(content);
```

**Supabase Client:**
```typescript
// lib/db/client.ts - already exists
import { supabase, DEFAULT_USER_ID } from '@/lib/db/client';
```

**Memory Tools Pattern:**
```typescript
// lib/agent-sdk/memory-tools.ts - pattern to follow
// See searchMemoryTool for execute function structure
// See MEMORY_TOOL_NAMES for export pattern
```

---

## Known Gotchas

| Issue | Why It Happens | Solution |
|-------|----------------|----------|
| Large files fail embedding | OpenAI limit ~8K tokens | Skip files >100KB with warning |
| Duplicate filenames | Same filename in different folders | Use full path as filename key |
| project_id type mismatch | UUID vs string | Use fixed string ID, cast in query |
| Missing entity_type/name columns | New columns not in schema | Run migration first |
| Rate limit 429 errors | Too many API calls | 100ms delay, exponential backoff |

---

## Testing Checklist

**After each task:**
- [ ] `npm run build` passes
- [ ] Dev server starts (`npm run dev`)
- [ ] No TypeScript errors

**After indexing (Task 2.1):**
- [ ] `npm run index-advisory` completes
- [ ] `npm run verify-advisory` shows 100% coverage
- [ ] No files >100KB skipped (or documented)

**Final demo (Task 4.2):**
- [ ] "Brief me on MyTab" → Master doc content
- [ ] "What was my last email to Mikaela?" → Communications
- [ ] "What deals have red flags?" → Multiple deals
- [ ] "Prep me for SwiftCheckin call" → Client profile
- [ ] "What's the valuation for ArcheloLab?" → Valuation section
- [ ] "Show me Dec 2 meeting notes for MyTab" → Meeting file

---

## Success Criteria

- [ ] Build passes (`npm run build`)
- [ ] ~70 advisory files in `advisory/` directory
- [ ] 100% files indexed with embeddings
- [ ] `search_advisory` tool visible in Agent Mode
- [ ] 5/6 validation queries return relevant results
- [ ] No regression in `search_memory` functionality
- [ ] Deploys successfully to Vercel

---

## Resources

**External Docs:**
- [OpenAI Embeddings](https://platform.openai.com/docs/guides/embeddings)
- [Supabase Vector Search](https://supabase.com/docs/guides/database/extensions/pgvector)

**Project Files:**
- Sprint tracking: `docs/sprints/active/M37-01/sprint-m37-01.md`
- Architecture: `CLAUDE.md`
- Seeding strategy: `docs/product/roadmaps/SEEDING_STRATEGY.md`

---

*Prepared by Claude Code - December 7, 2025*
