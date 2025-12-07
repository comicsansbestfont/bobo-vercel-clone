# Repository Consolidation Roadmap: Blog Migration → Bobo

**Version:** 1.0
**Created:** 2025-12-06
**Author:** Sachee Perera & Claude
**Status:** Strategic Planning
**Related:** [KNOWLEDGE_MIGRATION_STRATEGY.md](./KNOWLEDGE_MIGRATION_STRATEGY.md)

---

## Executive Summary

This document outlines the strategic roadmap for consolidating the **Blog Migration** repository into the **Bobo** repository. The goal is to transform Bobo from a standalone chat application into a unified **"Second Brain"** that serves as Sachee's complete knowledge management, advisory practice, and content creation system.

**Key Insight:** The original Knowledge Migration Strategy focused on syncing deal/client memories to Bobo. Through dogfooding validation, we discovered that **memories alone aren't sufficient** - Bobo needs access to the actual file content (meeting transcripts, emails, master docs) to provide meaningful advisory assistance.

**The Solution:** Rather than building complex sync mechanisms between two repositories, we consolidate everything into a single repository where:
- Files live in Git (version controlled, editable via Claude Code)
- Files are indexed to Supabase at build time (searchable via RAG)
- Agent Mode can access both memories AND files
- Single source of truth, single workflow

---

## Part 1: Current State Analysis

### 1.1 Two-Repository Architecture (Current)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    BLOG MIGRATION REPOSITORY                             │
│         /Users/sacheeperera/VibeCoding Projects/Blog Migration/         │
│                                                                          │
│  Purpose: Internal strategy development and content creation system      │
│  Git: Separate repository, pushed to GitHub                              │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  Deals/          - Sales pipeline (6+ active deals)             │    │
│  │  Clients/        - Active engagements (SwiftCheckin + templates)│    │
│  │  01_Inspiration/ - 493 blog posts (research corpus)             │    │
│  │  02_Workbench/   - AI conversations, drafts, frameworks         │    │
│  │  Content-Workspace/ - Content production pipeline               │    │
│  │  04_Reference/   - Playbooks, slides, identity docs             │    │
│  │  Utilities/      - Python utilities (RAG, scrapers, processors) │    │
│  │  chroma_db/      - ChromaDB vector database                     │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  Total Size: ~90MB (excluding vector DB)                                │
│  Files: ~640 markdown files                                              │
└─────────────────────────────────────────────────────────────────────────┘

                              ↕ No automated connection

┌─────────────────────────────────────────────────────────────────────────┐
│                         BOBO REPOSITORY                                  │
│       /Users/sacheeperera/VibeCoding Projects/bobo-vercel-clone/        │
│                                                                          │
│  Purpose: AI chat application with memory and context                    │
│  Git: Separate repository, deployed to Vercel                            │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  app/         - Next.js 16 application                          │    │
│  │  lib/         - Shared libraries (AI, DB, Agent SDK)            │    │
│  │  components/  - React components                                │    │
│  │  docs/        - Product documentation                           │    │
│  │  supabase/    - Database migrations                             │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  Capabilities: Memory system, Double-Loop RAG, Agent Mode               │
│  Database: Supabase (PostgreSQL + pgvector)                             │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Problems with Two-Repository Architecture

| Problem | Impact | Example |
|---------|--------|---------|
| **Cold start every conversation** | High friction | Each Bobo chat starts without advisory context |
| **Manual file selection** | Time waste | Must explicitly choose files for Claude Code/Web |
| **No cross-repository search** | Lost insights | Can't ask Bobo "what deals have red flags?" |
| **Sync complexity** | Engineering overhead | KNOWLEDGE_MIGRATION_STRATEGY requires Python sync script |
| **Workflow fragmentation** | Context switching | Jump between Claude Code (files) and Bobo (chat) |
| **Duplicate tooling** | Maintenance burden | ChromaDB in Blog Migration, pgvector in Bobo |

### 1.3 Validation Finding

During dogfooding validation (December 6, 2025), we tested Bobo with 22 seeded memories. The finding:

> **Memories provide high-level context, but users need granular file access for real work.**

Example queries that failed with memories alone:
- "What was my last email to Mikaela?" → Requires actual Communications Log
- "Prep me for the MyTab call tomorrow" → Requires meeting history + research docs
- "What did we discuss in the Dec 2 pitch practice?" → Requires meeting transcript

**Conclusion:** Bobo needs access to actual files, not just memory summaries.

---

## Part 2: Target State Vision

### 2.1 Unified Repository Architecture (Target)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              BOBO                                        │
│                      "Advisory Command Center"                           │
│       /Users/sacheeperera/VibeCoding Projects/bobo-vercel-clone/        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  APPLICATION LAYER                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  app/           - Next.js 16 application                        │    │
│  │  lib/           - Shared libraries (AI, DB, Agent SDK)          │    │
│  │  components/    - React components                              │    │
│  │  scripts/       - Build-time utilities (indexing, processing)   │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  KNOWLEDGE LAYER (Migrated from Blog Migration)                         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  advisory/      - Advisory practice files                       │    │
│  │    ├── deals/   - Sales pipeline (master-docs, meetings, inbox) │    │
│  │    └── clients/ - Active engagements (profiles, touchpoints)    │    │
│  │                                                                  │    │
│  │  content/       - Content creation system                       │    │
│  │    ├── workspace/   - Production pipeline (ideas → published)   │    │
│  │    └── workbench/   - AI conversations, drafts, frameworks      │    │
│  │                                                                  │    │
│  │  knowledge/     - Reference materials                           │    │
│  │    ├── inspiration/ - Blog posts, research corpus (493 posts)   │    │
│  │    └── reference/   - Playbooks, presentations, identity        │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  DATA LAYER                                                              │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  Supabase (PostgreSQL + pgvector)                               │    │
│  │    ├── memory_entries  - Facts, patterns, preferences           │    │
│  │    ├── files           - Indexed file content + embeddings      │    │
│  │    ├── chats/messages  - Conversation history                   │    │
│  │    └── projects        - Project containers                     │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  DOCUMENTATION                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  docs/          - Product documentation                         │    │
│  │  CLAUDE.md      - Unified workspace guide (merged from both)    │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 How It Works

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          USER QUERY                                      │
│              "Brief me on MyTab for tomorrow's call"                     │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         BOBO AGENT MODE                                  │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  1. search_memory("MyTab")                                        │  │
│  │     → Returns: "MyTab is in Relationship Development stage"       │  │
│  │     → Returns: "Red flag: Valuation mismatch concern"             │  │
│  │                                                                    │  │
│  │  2. search_advisory("MyTab meetings recent")                      │  │
│  │     → Returns: advisory/deals/MyTab/Meetings/2025-12-02.md        │  │
│  │     → Returns: advisory/deals/MyTab/master-doc.md                 │  │
│  │                                                                    │  │
│  │  3. Read(advisory/deals/MyTab/master-doc.md)                      │  │
│  │     → Returns: Full master doc with Communications Log            │  │
│  │                                                                    │  │
│  │  4. Synthesize response                                           │  │
│  │     → Combines memory context + file details                      │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           RESPONSE                                       │
│  "MyTab is in Relationship Development stage. Key context:               │
│   - Last meeting: Dec 2 pitch practice with Mikaela                     │
│   - Red flag: Valuation expectations ($6M) may be high for $24K ARR     │
│   - Recent email: Dec 2 follow-up on pitch deck feedback                │
│   - Next steps: Review updated pitch deck, prep VC intro list           │
│                                                                          │
│   Suggested talking points for tomorrow:                                 │
│   1. Pitch deck improvements since last session                         │
│   2. Timeline for next funding round                                    │
│   3. Address valuation expectation alignment"                           │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Benefits of Consolidation

| Benefit | Description |
|---------|-------------|
| **Single Source of Truth** | All knowledge in one Git repository |
| **Unified Search** | One RAG system (Supabase pgvector) searches everything |
| **No Sync Required** | Files ARE the source, indexed at build time |
| **Same Workflow** | Claude Code edits files in Bobo repo (identical UX) |
| **Production Access** | Vercel deployment includes all files |
| **Version Control** | Git history for all advisory + content files |
| **Simplified Tooling** | Replace ChromaDB with existing Supabase infrastructure |

---

## Part 3: What's Being Consolidated

### 3.1 Blog Migration Inventory

| Directory | Files | Size | Content Type | Migration Phase |
|-----------|-------|------|--------------|-----------------|
| `Deals/` | ~50 | ~2MB | Master docs, meetings, research | **NOW** |
| `Clients/` | ~20 | ~1MB | Client profiles, engagements | **NOW** |
| `Content-Workspace/` | ~30 | ~2MB | Content pipeline (ideas→published) | **NEXT** |
| `02_Workbench/` | ~50 | ~5MB | AI conversations, drafts | **NEXT** |
| `01_Inspiration/` | 493 | ~20MB | Blog posts (research corpus) | **LATER** |
| `04_Reference/` | ~100 | ~10MB | Playbooks, slides, identity | **LATER** |
| `Utilities/` | 6 | ~100KB | Python utilities | **Special** |
| `00_System/` | ~10 | ~100KB | Workspace docs | **Merge to CLAUDE.md** |
| `chroma_db/` | - | ~50MB | Vector database | **Replace** (use Supabase) |
| `Archive-Notion-Migration/` | ~500 | ~5MB | Archived project | **Do Not Migrate** |

**Total to migrate:** ~750 files, ~40MB (excluding archives and ChromaDB)

### 3.2 Utility Migration Strategy

| Utility | Current Function | Bobo Strategy |
|---------|------------------|---------------|
| `rag_pipeline.py` | ChromaDB semantic search | **Replace** with Supabase pgvector + build-time indexing |
| `search_blog.py` | CLI search wrapper | **Replace** with `search_advisory` agent tool |
| `content_pipeline.py` | Blog scraping | **Keep** as CLI tool OR port to API route |
| `ai_services.py` | AI API wrappers | **Deprecate** (Bobo has AI SDK) |
| `gemini_document_processor.py` | PDF/image processing | **Port** to Edge Function (LATER) |

---

## Part 4: Implementation Roadmap

### 4.1 Phase Overview

```
NOW (Week 1)              NEXT (Week 2-3)           LATER (Week 4+)
─────────────────         ──────────────────        ─────────────────
Advisory Core             Content System            Full Knowledge Base

├─ Move Deals/            ├─ Move Content-          ├─ Move Inspiration/
├─ Move Clients/          │  Workspace/             │  (493 blog posts)
├─ Build indexing         ├─ Move Workbench/        ├─ Move Reference/
├─ Add agent tools        ├─ Extend indexing        ├─ Port document
├─ Test queries           ├─ Content-specific       │  processor
└─ Start dogfooding       │  agent tools            └─ Optimize chunking
                          └─ Validate workflow          for large corpus
```

---

### 4.2 NOW Phase: Advisory Core (Week 1)

**Goal:** Enable Bobo to answer advisory questions with full file context.

**Success Criteria:**
- "Brief me on MyTab" returns accurate, detailed context
- "What was my last email to Mikaela?" finds Communications Log
- "What deals have red flags?" searches across all deals
- "Prep me for tomorrow's call" synthesizes relevant context

#### Step 1: Create Directory Structure

```bash
# Target structure
/bobo-vercel-clone/
├── advisory/
│   ├── deals/
│   │   ├── _TEMPLATE/
│   │   │   ├── master-doc-template.md
│   │   │   └── DEAL_SOP.md
│   │   ├── MyTab/
│   │   │   ├── master-doc.md
│   │   │   ├── Meetings/
│   │   │   ├── Docs/
│   │   │   └── _Inbox/
│   │   ├── ControlShiftAI/
│   │   ├── Talvin/
│   │   ├── ArcheloLab/
│   │   └── [other deals]/
│   ├── clients/
│   │   ├── _TEMPLATE/
│   │   │   ├── client-profile-template.md
│   │   │   └── CLIENT_SOP.md
│   │   └── SwiftCheckin/
│   │       ├── client-profile.md
│   │       ├── Engagements/
│   │       └── Meetings/
│   └── README.md
```

#### Step 2: Move Files

```bash
# From Blog Migration to Bobo
cp -r "Blog Migration/Deals" "bobo-vercel-clone/advisory/deals"
cp -r "Blog Migration/Clients" "bobo-vercel-clone/advisory/clients"
```

#### Step 3: Build-Time Indexing Script

**File:** `scripts/index-advisory.ts`

```typescript
/**
 * Advisory File Indexer
 *
 * Scans advisory/ directory and indexes all markdown files to Supabase
 * for semantic search via Agent Mode.
 *
 * Run: npm run index-advisory
 * Runs automatically: npm run build (via prebuild hook)
 */

import { glob } from 'glob';
import fs from 'fs/promises';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Configuration
const ADVISORY_PROJECT_ID = 'advisory-knowledge-base';
const CHUNK_SIZE = 2000; // Characters per chunk for large files
const EMBEDDING_MODEL = 'text-embedding-3-small';

interface FileMetadata {
  filePath: string;
  entityType: 'deal' | 'client' | 'template' | 'sop';
  entityName: string | null;
  fileType: 'master-doc' | 'client-profile' | 'meeting' | 'document' | 'other';
}

function extractMetadata(filePath: string): FileMetadata {
  const parts = filePath.split('/');

  // Determine entity type
  let entityType: FileMetadata['entityType'] = 'other';
  let entityName: string | null = null;
  let fileType: FileMetadata['fileType'] = 'other';

  if (filePath.includes('/deals/')) {
    entityType = 'deal';
    // Extract deal name (folder after deals/)
    const dealsIndex = parts.indexOf('deals');
    if (dealsIndex >= 0 && parts[dealsIndex + 1]) {
      entityName = parts[dealsIndex + 1];
      if (entityName === '_TEMPLATE') {
        entityType = 'template';
        entityName = null;
      }
    }
  } else if (filePath.includes('/clients/')) {
    entityType = 'client';
    const clientsIndex = parts.indexOf('clients');
    if (clientsIndex >= 0 && parts[clientsIndex + 1]) {
      entityName = parts[clientsIndex + 1];
      if (entityName === '_TEMPLATE') {
        entityType = 'template';
        entityName = null;
      }
    }
  }

  // Determine file type
  const filename = parts[parts.length - 1];
  if (filename.includes('master-doc')) fileType = 'master-doc';
  else if (filename.includes('client-profile')) fileType = 'client-profile';
  else if (filePath.includes('/Meetings/')) fileType = 'meeting';
  else if (filePath.includes('/Docs/')) fileType = 'document';
  else if (filename.includes('SOP')) entityType = 'sop';

  return { filePath, entityType, entityName, fileType };
}

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: text.slice(0, 8000), // Limit input size
    }),
  });

  const data = await response.json();
  return data.data[0].embedding;
}

async function indexAdvisoryFiles() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log('🔍 Scanning advisory/ directory...');

  // Find all markdown files
  const files = await glob('advisory/**/*.md', {
    ignore: ['**/node_modules/**', '**/_Inbox/**', '**/_raw/**']
  });

  console.log(`📁 Found ${files.length} files to index`);

  let indexed = 0;
  let errors = 0;

  for (const filePath of files) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const metadata = extractMetadata(filePath);

      // Generate embedding
      const embedding = await generateEmbedding(content);

      // Upsert to files table
      const { error } = await supabase
        .from('files')
        .upsert({
          project_id: ADVISORY_PROJECT_ID,
          user_id: process.env.DEFAULT_USER_ID,
          filename: filePath,
          content_text: content,
          embedding,
          file_type: 'markdown',
          file_size: Buffer.byteLength(content, 'utf-8'),
          // Store metadata in a way we can query
          // Note: May need schema update for entity fields
        }, {
          onConflict: 'project_id,filename'
        });

      if (error) {
        console.error(`❌ Error indexing ${filePath}:`, error.message);
        errors++;
      } else {
        console.log(`✅ Indexed: ${filePath}`);
        indexed++;
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (err) {
      console.error(`❌ Failed to process ${filePath}:`, err);
      errors++;
    }
  }

  console.log(`\n📊 Indexing complete: ${indexed} indexed, ${errors} errors`);
}

// Run
indexAdvisoryFiles().catch(console.error);
```

#### Step 4: Add Agent Tool

**File:** `lib/agent-sdk/advisory-tools.ts`

```typescript
import { z } from 'zod';
import { generateEmbedding } from '@/lib/ai/embedding';
import { createClient } from '@supabase/supabase-js';

export const searchAdvisoryTool = {
  name: 'search_advisory',
  description: `Search advisory files including deals, clients, meeting notes, and documents.
Use this tool when you need to find specific information from:
- Deal master documents and research
- Client profiles and engagement history
- Meeting notes and transcripts
- Communications logs and emails
- Strategic observations and red flags`,

  parameters: z.object({
    query: z.string().describe('Natural language search query'),
    entity_type: z.enum(['deal', 'client', 'all']).default('all')
      .describe('Filter by entity type'),
    entity_name: z.string().optional()
      .describe('Filter by specific deal/client name (e.g., "MyTab")'),
    file_type: z.enum(['master-doc', 'meeting', 'document', 'all']).default('all')
      .describe('Filter by file type'),
    limit: z.number().min(1).max(20).default(5)
      .describe('Number of results to return'),
  }),

  execute: async ({ query, entity_type, entity_name, file_type, limit }) => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Generate embedding for semantic search
    const embedding = await generateEmbedding(query);

    // Build filter conditions
    let folderFilter = null;
    if (entity_type === 'deal') folderFilter = 'advisory/deals/';
    else if (entity_type === 'client') folderFilter = 'advisory/clients/';

    // Search using hybrid approach
    const { data, error } = await supabase.rpc('search_advisory_files', {
      query_embedding: embedding,
      query_text: query,
      folder_filter: folderFilter,
      entity_name_filter: entity_name || null,
      file_type_filter: file_type === 'all' ? null : file_type,
      match_count: limit,
    });

    if (error) {
      return { error: error.message };
    }

    return data.map((file: any) => ({
      file: file.filename,
      entity: file.entity_name,
      type: file.file_type,
      excerpt: file.content_text.slice(0, 1000) + '...',
      similarity: Math.round(file.similarity * 100) + '%',
    }));
  },

  // Auto-approve read-only search
  requiresApproval: false,
};

export const ADVISORY_TOOLS = [searchAdvisoryTool];
```

#### Step 5: Database Migration

**File:** `supabase/migrations/[timestamp]_advisory_search_function.sql`

```sql
-- Function to search advisory files with hybrid search
CREATE OR REPLACE FUNCTION search_advisory_files(
  query_embedding vector(1536),
  query_text text,
  folder_filter text DEFAULT NULL,
  entity_name_filter text DEFAULT NULL,
  file_type_filter text DEFAULT NULL,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  filename text,
  content_text text,
  entity_name text,
  file_type text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id,
    f.filename,
    f.content_text,
    -- Extract entity name from path
    CASE
      WHEN f.filename LIKE '%/deals/%' THEN
        split_part(split_part(f.filename, '/deals/', 2), '/', 1)
      WHEN f.filename LIKE '%/clients/%' THEN
        split_part(split_part(f.filename, '/clients/', 2), '/', 1)
      ELSE NULL
    END as entity_name,
    -- Determine file type
    CASE
      WHEN f.filename LIKE '%master-doc%' THEN 'master-doc'
      WHEN f.filename LIKE '%client-profile%' THEN 'client-profile'
      WHEN f.filename LIKE '%/Meetings/%' THEN 'meeting'
      WHEN f.filename LIKE '%/Docs/%' THEN 'document'
      ELSE 'other'
    END as file_type,
    -- Hybrid similarity score
    (
      0.7 * (1 - (f.embedding <=> query_embedding)) +
      0.3 * COALESCE(ts_rank(to_tsvector('english', f.content_text), plainto_tsquery('english', query_text)), 0)
    ) as similarity
  FROM files f
  WHERE
    f.project_id = 'advisory-knowledge-base'
    AND (folder_filter IS NULL OR f.filename LIKE folder_filter || '%')
    AND (entity_name_filter IS NULL OR f.filename ILIKE '%/' || entity_name_filter || '/%')
    AND (file_type_filter IS NULL OR
      CASE file_type_filter
        WHEN 'master-doc' THEN f.filename LIKE '%master-doc%'
        WHEN 'client-profile' THEN f.filename LIKE '%client-profile%'
        WHEN 'meeting' THEN f.filename LIKE '%/Meetings/%'
        WHEN 'document' THEN f.filename LIKE '%/Docs/%'
        ELSE TRUE
      END
    )
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
```

#### Step 6: Package.json Updates

```json
{
  "scripts": {
    "index-advisory": "npx tsx scripts/index-advisory.ts",
    "prebuild": "npm run index-advisory",
    "dev": "next dev",
    "build": "next build"
  }
}
```

#### Step 7: Validation Tests

After implementation, verify these queries work:

| Query | Expected Behavior |
|-------|-------------------|
| "Brief me on MyTab" | Returns master-doc summary, recent activity, red flags |
| "What was my last email to Mikaela?" | Finds Communications Log in MyTab master-doc |
| "What deals have red flags?" | Searches Strategic Observations across all deals |
| "Prep me for SwiftCheckin call" | Returns client profile + recent touchpoints |
| "What's the valuation range for ArcheloLab?" | Finds Valuation Snapshot section |
| "Show me the Dec 2 meeting notes for MyTab" | Returns specific meeting file |

---

### 4.3 NEXT Phase: Content System (Week 2-3)

**Goal:** Bring content creation workflow into Bobo.

#### Directory Structure

```bash
/bobo-vercel-clone/
├── advisory/                    # (from NOW phase)
├── content/                     # NEW
│   ├── workspace/
│   │   ├── 00-reference/
│   │   │   ├── gtm-framework/   # Sachee GTM Strategy Workbook
│   │   │   ├── templates/       # Phase-gated toolkits
│   │   │   └── campaigns/       # Strategic campaign examples
│   │   ├── 01-ideas/            # Raw content ideas
│   │   ├── 02-in-development/   # Active content with BRIEF.md
│   │   ├── 03-ready-to-publish/ # Scheduled queue
│   │   └── 04-published/        # Archive with PERFORMANCE.md
│   └── workbench/
│       ├── chats/
│       │   ├── claude/
│       │   ├── openai/
│       │   └── gemini/
│       └── drafts/
│           ├── strategy/
│           ├── content/
│           └── copy/
```

#### Implementation Tasks

1. **Move Content-Workspace/**
   ```bash
   cp -r "Blog Migration/Content-Workspace" "bobo-vercel-clone/content/workspace"
   ```

2. **Move 02_Workbench/**
   ```bash
   cp -r "Blog Migration/02_Workbench" "bobo-vercel-clone/content/workbench"
   ```

3. **Extend Indexing Script**
   - Add `content/**/*.md` to glob pattern
   - Extract content-specific metadata (stage, AI provider)

4. **Add Content-Specific Agent Tool**
   ```typescript
   export const searchContentTool = {
     name: 'search_content',
     description: 'Search content workspace including drafts, frameworks, and AI conversations',
     parameters: z.object({
       query: z.string(),
       stage: z.enum(['reference', 'ideas', 'development', 'ready', 'published', 'all']),
       ai_provider: z.enum(['claude', 'openai', 'gemini', 'all']),
       content_type: z.enum(['strategy', 'content', 'copy', 'all']),
     }),
     // ...
   };
   ```

#### Success Criteria

- "Find my SPICED framework content" → Returns GTM Framework docs
- "What LinkedIn posts are ready to publish?" → Lists 03-ready-to-publish/
- "Show me the Claude conversation about pricing" → Finds relevant chat
- "What content ideas do I have about founder-led sales?" → Searches 01-ideas/

---

### 4.4 LATER Phase: Full Knowledge Base (Week 4+)

**Goal:** Complete consolidation with research corpus and reference materials.

#### Directory Structure

```bash
/bobo-vercel-clone/
├── advisory/                    # (from NOW)
├── content/                     # (from NEXT)
├── knowledge/                   # NEW
│   ├── inspiration/
│   │   └── blog-posts/
│   │       ├── substack-mrrunlocked/  # 103 posts
│   │       ├── basicarts/              # 306 posts
│   │       ├── t2d3/                   # 84 posts
│   │       └── fluint/                 # 73 posts
│   └── reference/
│       ├── playbooks/
│       │   ├── coreplan-sales/
│       │   ├── swiftcheckin-training/
│       │   └── coreplan-cs/
│       ├── presentations/
│       │   └── coreplan-slidedecks/
│       └── identity/
│           ├── core-profile.md
│           ├── story-library.md
│           └── resume.pdf
```

#### Implementation Considerations

1. **Large Corpus Indexing**
   - 493 blog posts = significant embedding cost
   - Consider chunking strategy for long posts
   - May need batch processing with rate limiting

2. **Chunking Strategy**
   ```typescript
   // For large files, chunk into 500-token segments
   function chunkContent(content: string, maxTokens: number = 500): string[] {
     // Split on paragraph boundaries
     // Ensure overlap for context continuity
     // Store chunk index in metadata
   }
   ```

3. **Reference Material Handling**
   - PDFs need extraction (use Gemini document processor)
   - Slide decks may need special handling
   - Consider which materials are worth indexing

#### Success Criteria

- "Find blog posts about pricing psychology" → Searches 493 posts
- "What did I write about SPICED at CorePlan?" → Returns reference materials
- "Show me my bio for speaking engagements" → Returns identity docs

---

## Part 5: Technical Architecture

### 5.1 Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        GIT REPOSITORY                                    │
│                                                                          │
│  advisory/deals/MyTab/master-doc.md                                     │
│  advisory/clients/SwiftCheckin/client-profile.md                        │
│  content/workspace/02-in-development/post.md                            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Build Time (npm run build)
                                    │ scripts/index-advisory.ts
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        SUPABASE (files table)                            │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  id: uuid                                                        │    │
│  │  project_id: 'advisory-knowledge-base'                          │    │
│  │  filename: 'advisory/deals/MyTab/master-doc.md'                 │    │
│  │  content_text: '---\ncompany: MyTab\n...'                       │    │
│  │  embedding: vector(1536)                                         │    │
│  │  file_type: 'markdown'                                          │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Runtime (Agent Mode)
                                    │ search_advisory_files()
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        BOBO AGENT MODE                                   │
│                                                                          │
│  Tools:                                                                  │
│  ├── search_memory      → Query memory_entries table                    │
│  ├── search_advisory    → Query files table (advisory project)          │
│  ├── Read               → Read file from Vercel bundle                  │
│  ├── Glob               → Find files by pattern                         │
│  └── Grep               → Search file contents                          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Search Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         UNIFIED SEARCH                                   │
│                                                                          │
│  User Query: "What deals have valuation concerns?"                      │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  LAYER 1: Memory Search (Fast Facts)                            │    │
│  │                                                                  │    │
│  │  search_memory("valuation concerns")                            │    │
│  │  → "MyTab: Valuation mismatch - $24K ARR asking $6M"           │    │
│  │  → "ArcheloLab: Pre-revenue, valuation TBD"                    │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                              +                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  LAYER 2: File Search (Deep Context)                            │    │
│  │                                                                  │    │
│  │  search_advisory("valuation", file_type="master-doc")           │    │
│  │  → advisory/deals/MyTab/master-doc.md (Valuation Snapshot)     │    │
│  │  → advisory/deals/ArcheloLab/master-doc.md (Valuation section) │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                              =                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  SYNTHESIZED RESPONSE                                           │    │
│  │                                                                  │    │
│  │  "Two deals have valuation-related concerns:                    │    │
│  │                                                                  │    │
│  │  1. MyTab - Red flag: Expecting $6M valuation on $24K ARR      │    │
│  │     - Founder Engine Score: 3.8/5.0                             │    │
│  │     - Recommendation: Align expectations before intro to VCs    │    │
│  │                                                                  │    │
│  │  2. ArcheloLab - Pre-revenue, valuation not yet established    │    │
│  │     - Currently in Phase 1a                                     │    │
│  │     - Recommendation: Focus on first customer before valuation" │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          VERCEL DEPLOYMENT                               │
│                                                                          │
│  Build Process:                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  1. npm run prebuild                                            │    │
│  │     └── scripts/index-advisory.ts                               │    │
│  │         ├── Scan advisory/**/*.md                               │    │
│  │         ├── Generate embeddings                                 │    │
│  │         └── Upsert to Supabase files table                     │    │
│  │                                                                  │    │
│  │  2. npm run build                                               │    │
│  │     └── next build                                              │    │
│  │         ├── Bundle app code                                     │    │
│  │         └── Include advisory/ in deployment                    │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  Runtime:                                                                │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  Serverless Functions                                           │    │
│  │  ├── /api/chat         → Agent Mode with advisory tools        │    │
│  │  ├── /api/memory/*     → Memory CRUD operations                │    │
│  │  └── advisory/**       → Static files (readable by Agent)      │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  External Services:                                                      │
│  ├── Supabase (PostgreSQL + pgvector)                                   │
│  ├── OpenAI (Embeddings + Chat)                                         │
│  └── Anthropic (Claude for Agent Mode)                                  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Part 6: Migration Execution

### 6.1 Pre-Migration Checklist

- [ ] Backup Blog Migration repository
- [ ] Verify Supabase has sufficient storage
- [ ] Ensure OpenAI API key has embedding quota
- [ ] Document current Blog Migration file counts
- [ ] Create Bobo feature branch for migration

### 6.2 NOW Phase Execution Steps

| Step | Action | Verification |
|------|--------|--------------|
| 1 | Create `advisory/` directory | `ls advisory/` shows empty dir |
| 2 | Copy Deals folder | `ls advisory/deals/` shows all deals |
| 3 | Copy Clients folder | `ls advisory/clients/` shows all clients |
| 4 | Create indexing script | `cat scripts/index-advisory.ts` exists |
| 5 | Run indexing | `npm run index-advisory` completes |
| 6 | Verify Supabase | Files appear in files table |
| 7 | Add agent tool | Tool registered in config |
| 8 | Test queries | All validation queries pass |
| 9 | Commit and push | Changes in Git |
| 10 | Deploy to Vercel | Production site updated |

### 6.3 Rollback Plan

If issues arise:
1. Revert Git commits
2. Delete indexed files from Supabase: `DELETE FROM files WHERE project_id = 'advisory-knowledge-base'`
3. Remove advisory tools from agent config
4. Redeploy

---

## Part 7: Success Metrics

### 7.1 Dogfooding Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Daily Bobo usage for advisory | 5+ queries/day | Self-tracking |
| Query success rate | 80%+ useful responses | Manual assessment |
| Time to answer vs file browsing | 50% faster | Stopwatch comparison |
| Context switching reduction | 75% fewer tool switches | Self-tracking |

### 7.2 Technical Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Indexing time | < 5 min for NOW phase | Build logs |
| Search latency | < 2 seconds | Agent response time |
| Embedding cost | < $5/month | OpenAI billing |
| Storage growth | < 100MB | Supabase dashboard |

### 7.3 Qualitative Indicators

- "Brief me on X" feels natural and complete
- No longer opening master docs manually for context
- Confident in Bobo's answers (not second-guessing)
- Discovering cross-deal patterns through conversation

---

## Part 8: Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Indexing fails on large files | Medium | Medium | Add chunking, skip files > 100KB |
| Search returns irrelevant results | Medium | High | Tune similarity threshold, add filters |
| Build time increases significantly | Low | Medium | Parallelize indexing, cache embeddings |
| Vercel deployment size limit | Low | High | Exclude large files, use external storage |
| Dual repo confusion during migration | Medium | Low | Clear documentation, branch strategy |
| Loss of Blog Migration Git history | Low | Medium | Keep Blog Migration repo archived |

---

## Part 9: Future Considerations

### 9.1 Database-Native Architecture (Beyond LATER)

Eventually, consider moving from file-based to database-first:

```
Current: Files in Git → Indexed to Supabase
Future:  Supabase as source of truth → Export to files if needed
```

**Benefits:**
- Real-time updates without rebuild
- Multi-device sync
- Structured queries (filter by stage, entity)
- Version history in database

**When to consider:**
- Multiple users need access
- Mobile app needs direct DB access
- File-based approach hits scaling limits

### 9.2 MCP Server (Alternative Path)

If consolidation proves problematic, the MCP server approach from KNOWLEDGE_MIGRATION_STRATEGY.md remains viable:

- Build Python MCP server in Blog Migration repo
- Expose file access via MCP protocol
- Bobo Agent connects via MCP tools
- Files stay in Blog Migration

**Trade-offs:**
- More complex architecture
- Two repos to maintain
- But: Zero migration effort for files

---

## Part 10: References

### Related Documents

- [KNOWLEDGE_MIGRATION_STRATEGY.md](./KNOWLEDGE_MIGRATION_STRATEGY.md) - Original sync-based approach
- [SEEDING_STRATEGY.md](./SEEDING_STRATEGY.md) - Memory seeding approach
- [PRODUCT_VISION_BOBO_CRM.md](./PRODUCT_VISION_BOBO_CRM.md) - CRM vision for advisory practice
- [/docs/PRODUCT_BACKLOG.md](../PRODUCT_BACKLOG.md) - Current development backlog

### Blog Migration Documentation

- `/Users/sacheeperera/VibeCoding Projects/Blog Migration/CLAUDE.md` - Full workspace guide
- `Blog Migration/Deals/_TEMPLATE/DEAL_SOP.md` - Deal management SOPs
- `Blog Migration/Clients/_TEMPLATE/CLIENT_SOP.md` - Client management SOPs

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-06 | Sachee & Claude | Initial comprehensive roadmap |

---

## Appendix A: File Count Summary

**Blog Migration Repository (Source):**
```
Deals/           ~50 files    ~2MB
Clients/         ~20 files    ~1MB
Content-Workspace/ ~30 files  ~2MB
02_Workbench/    ~50 files    ~5MB
01_Inspiration/  493 files    ~20MB
04_Reference/    ~100 files   ~10MB
Utilities/       6 files      ~100KB
00_System/       ~10 files    ~100KB
─────────────────────────────────────
Total:           ~760 files   ~40MB
```

**Migration by Phase:**
```
NOW:    ~70 files    ~3MB   (Deals + Clients)
NEXT:   ~80 files    ~7MB   (Content + Workbench)
LATER:  ~600 files   ~30MB  (Inspiration + Reference)
```

---

## Appendix B: CLAUDE.md Merge Plan

After consolidation, Bobo's CLAUDE.md should incorporate key sections from Blog Migration's CLAUDE.md:

**Sections to merge:**
- Who is Sachee? (identity context)
- GTM Framework overview
- Sachee-isms operating principles
- Content workflow (modified for new structure)
- Metadata standards (YAML frontmatter, AI output headers)
- File naming conventions

**Sections to update:**
- Repository structure (new unified layout)
- Directory purposes (advisory/, content/, knowledge/)
- Utility commands (TypeScript instead of Python)
- RAG search (Supabase instead of ChromaDB)
