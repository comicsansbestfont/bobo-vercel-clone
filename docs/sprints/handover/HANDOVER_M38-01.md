# Sprint M38-01 Execution Guide

**Sprint:** M38-01 - Advisory Project Integration
**Duration:** December 7-10, 2025
**Prepared:** December 7, 2025

---

## TL;DR (Plain English Summary)

We're building a project-per-deal system so each advisory deal/client gets its own dedicated project in Bobo. When you open MyTab's project, all chats in that project will have MyTab's context automatically injected - including an AI-generated summary of the deal and live access to the master doc.

**The core idea:**
- Database: Add `entity_type` (deal/client/personal) and `advisory_folder_path` columns to projects
- Context: When chatting in an advisory project, read the master doc directly from the file system (always current)
- Summary: Generate an editable AI summary from the master doc, stored as `custom_instructions`
- Import: Bulk import all 6 existing deals at once, then use a wizard for future folders

**What success looks like:** You can open MyTab's project, start a new chat, and Bobo immediately knows everything about MyTab - the $24K ARR, Mikaela Greene, Phase 1a stage, red flags, and recent meetings.

---

## Architecture Overview

### System Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                    Projects (enhanced)                           │
├─────────────────────────────────────────────────────────────────┤
│ id | name | entity_type | advisory_folder_path | custom_instr   │
│----+------+-------------+----------------------+--------------  │
│ 1  | MyTab| deal        | advisory/deals/MyTab | AI summary     │
│ 2  | SwiftCheckin | client | advisory/clients/.. | AI summary   │
│ 3  | Personal | personal | NULL               | Manual notes    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Context Manager (enhanced)                       │
│  IF advisory_folder_path exists:                                │
│    → Read master doc from FILE SYSTEM (always current)          │
│    → Inject custom_instructions (editable AI summary)           │
│  ELSE:                                                          │
│    → Read from files table (existing behavior)                  │
└─────────────────────────────────────────────────────────────────┘
```

### Import Flow
```
User clicks "Import Advisory"
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│ BULK IMPORT (backlog)           │ IMPORT WIZARD (future)       │
│ ─────────────────────────────   │ ────────────────────────     │
│ 1. List all advisory folders    │ 1. Select folder             │
│ 2. Show checkboxes (select all) │ 2. Preview frontmatter       │
│ 3. Generate summaries in batch  │ 3. Edit AI summary           │
│ 4. Create projects              │ 4. Create project            │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow
```
Advisory Folder                    Database                      Chat Context
─────────────────                  ────────                      ────────────
advisory/deals/MyTab/              projects table                System Prompt
├── master-doc-mytab.md  ──────►  entity_type: 'deal'  ─────►  + AI Summary
├── Meetings/                      advisory_folder_path:         + Master Doc
└── Communications/                'advisory/deals/MyTab'        Content
```

---

## Quick Start (15 minutes)

```bash
# 1. Install new dependency
npm install gray-matter

# 2. Verify build works before changes
npm run build

# 3. After implementation, run bulk import via UI
# Or use the API directly:
curl -X POST http://localhost:3000/api/advisory/bulk-import \
  -H "Content-Type: application/json" \
  -d '{"generateSummaries": true}'

# 4. Verify
npm run dev
# Open a chat in MyTab project, verify context is injected
```

**Environment:** Existing env vars sufficient (AI_GATEWAY_API_KEY for summaries)

---

## Tasks

### Phase 1: Database + Types (2h)

| Task | What to Do | Hours |
|------|------------|-------|
| 1.1 | Create migration: add `entity_type`, `advisory_folder_path` to projects | 0.5h |
| 1.2 | Update `lib/db/types.ts` with EntityType and extended Project type | 0.5h |
| 1.3 | Update `lib/db/queries.ts` with new query functions | 0.5h |
| 1.4 | Install `gray-matter` for YAML frontmatter parsing | 0.5h |

### Phase 2: File Reading + AI Summarization (3h)

| Task | What to Do | Hours |
|------|------------|-------|
| 2.1 | Create `lib/advisory/file-reader.ts` - read master docs, parse sections | 1.5h |
| 2.2 | Create `lib/advisory/summarizer.ts` - generate AI summaries | 1.0h |
| 2.3 | Test file reading with MyTab master doc | 0.5h |

### Phase 3: API Endpoints (3h)

| Task | What to Do | Hours |
|------|------------|-------|
| 3.1 | Create `/api/advisory/available` - list unimported folders | 0.5h |
| 3.2 | Create `/api/advisory/import` - import single folder | 1.0h |
| 3.3 | Create `/api/advisory/bulk-import` - import multiple folders | 0.5h |
| 3.4 | Create `/api/advisory/refresh/[projectId]` - refresh from file | 0.5h |
| 3.5 | Update `/api/projects/[id]` - accept new fields | 0.5h |

### Phase 4: Context Manager Update (1h)

| Task | What to Do | Hours |
|------|------------|-------|
| 4.1 | Modify `lib/ai/context-manager.ts` to read from file system for advisory | 1.0h |

### Phase 5: UI Components (4h)

| Task | What to Do | Hours |
|------|------------|-------|
| 5.1 | Create `components/advisory/bulk-import.tsx` - multi-select import | 1.5h |
| 5.2 | Create `components/advisory/import-wizard.tsx` - step-by-step wizard | 1.5h |
| 5.3 | Add "Import Advisory" button to project creation flow | 0.5h |
| 5.4 | Add entity type badges to project list | 0.5h |

### Phase 6: Testing + Documentation (1h)

| Task | What to Do | Hours |
|------|------------|-------|
| 6.1 | Bulk import all 6 deals, verify context injection works | 0.5h |
| 6.2 | Update CLAUDE.md with advisory project docs | 0.5h |

**Total: 14h** (+ 2h buffer)

---

## Files to Create

```
lib/advisory/
├── file-reader.ts          # Read master docs, parse YAML + sections
└── summarizer.ts           # Generate AI summaries

app/api/advisory/
├── available/route.ts      # GET - list unimported folders
├── import/route.ts         # POST - import single folder
├── bulk-import/route.ts    # POST - import multiple folders
└── refresh/
    └── [projectId]/route.ts  # POST - refresh from file

components/advisory/
├── bulk-import.tsx         # Multi-select bulk import dialog
└── import-wizard.tsx       # Step-by-step import wizard

supabase/migrations/
└── YYYYMMDD_add_entity_type_to_projects.sql
```

---

## Implementation Details

### Task 1.1: Database Migration

**File:** `supabase/migrations/YYYYMMDD_add_entity_type_to_projects.sql`

**What it does:** Adds entity_type and advisory_folder_path columns to projects table

```sql
-- Add entity_type column to projects table
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS entity_type TEXT DEFAULT 'personal'
CHECK (entity_type IN ('deal', 'client', 'personal'));

-- Add advisory_folder_path for file-reference mode
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS advisory_folder_path TEXT;

-- Index for filtering by entity_type
CREATE INDEX IF NOT EXISTS idx_projects_entity_type ON projects(entity_type);

-- Comments for documentation
COMMENT ON COLUMN projects.entity_type IS 'Type of project: deal, client, or personal (default)';
COMMENT ON COLUMN projects.advisory_folder_path IS 'Path to advisory folder for file-reference mode';
```

**Key points:**
- Default is 'personal' so existing projects are unaffected
- advisory_folder_path is nullable (NULL for non-advisory projects)

---

### Task 1.2: Type Updates

**File:** `lib/db/types.ts`

**What it does:** Adds EntityType and extends Project type

```typescript
// Add near top of file
export type EntityType = 'deal' | 'client' | 'personal';

// Update Project type
export type Project = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  custom_instructions: string | null;
  entity_type: EntityType;              // NEW
  advisory_folder_path: string | null;  // NEW
  created_at: string;
  updated_at: string;
};

// Update ProjectInsert type
export type ProjectInsert = Omit<Project, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  entity_type?: EntityType;              // Optional, defaults to 'personal'
  advisory_folder_path?: string | null;  // Optional
};
```

---

### Task 2.1: File Reader

**File:** `lib/advisory/file-reader.ts`

**What it does:** Reads master docs from advisory folder, parses YAML frontmatter and sections

```typescript
/**
 * Advisory File Reader
 *
 * Reads master docs and supporting files from the advisory folder.
 * Server-side only (uses Node.js fs).
 */

import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

export interface AdvisoryFrontmatter {
  company: string;
  website?: string;
  founder?: string;
  deal_stage?: string;
  arr_estimate?: string;
  team_size?: string;
  last_updated?: string;
  [key: string]: string | undefined;
}

export interface AdvisorySection {
  title: string;
  content: string;
  level: number;
}

export interface AdvisoryFile {
  filename: string;
  filepath: string;
  content: string;
  frontmatter: AdvisoryFrontmatter;
  sections: AdvisorySection[];
}

/**
 * Read master doc from advisory folder
 */
export async function readMasterDoc(folderPath: string): Promise<AdvisoryFile | null> {
  const fullPath = path.join(process.cwd(), folderPath);

  try {
    const files = await fs.readdir(fullPath);
    const masterDocFile = files.find(f => f.startsWith('master-doc-') && f.endsWith('.md'));

    if (!masterDocFile) return null;

    const filepath = path.join(fullPath, masterDocFile);
    const rawContent = await fs.readFile(filepath, 'utf-8');
    const { data: frontmatter, content: body } = matter(rawContent);
    const sections = parseSections(body);

    return {
      filename: masterDocFile,
      filepath,
      content: body,
      frontmatter: frontmatter as AdvisoryFrontmatter,
      sections,
    };
  } catch (error) {
    console.error(`Error reading master doc from ${folderPath}:`, error);
    return null;
  }
}

/**
 * List all advisory folders (deals and clients)
 */
export async function listAdvisoryFolders(): Promise<{
  deals: string[];
  clients: string[];
}> {
  const advisoryPath = path.join(process.cwd(), 'advisory');

  const isValidFolder = (name: string) => !name.startsWith('_') && !name.startsWith('.');

  const [dealsDir, clientsDir] = await Promise.all([
    fs.readdir(path.join(advisoryPath, 'deals')).catch(() => []),
    fs.readdir(path.join(advisoryPath, 'clients')).catch(() => []),
  ]);

  return {
    deals: dealsDir.filter(isValidFolder),
    clients: clientsDir.filter(isValidFolder),
  };
}

/**
 * Parse markdown sections by heading level
 */
function parseSections(content: string): AdvisorySection[] {
  const lines = content.split('\n');
  const sections: AdvisorySection[] = [];
  let currentSection: AdvisorySection | null = null;
  let buffer: string[] = [];

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,3})\s+(.+)/);

    if (headingMatch) {
      if (currentSection) {
        currentSection.content = buffer.join('\n').trim();
        sections.push(currentSection);
      }

      currentSection = {
        title: headingMatch[2],
        content: '',
        level: headingMatch[1].length,
      };
      buffer = [];
    } else if (currentSection) {
      buffer.push(line);
    }
  }

  if (currentSection) {
    currentSection.content = buffer.join('\n').trim();
    sections.push(currentSection);
  }

  return sections;
}
```

---

### Task 2.2: AI Summarizer

**File:** `lib/advisory/summarizer.ts`

**What it does:** Generates AI summaries from master docs for custom_instructions

```typescript
/**
 * Advisory Summarizer
 *
 * Generates AI summaries from master docs for project instructions.
 */

import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import type { AdvisoryFile } from './file-reader';

const SUMMARY_PROMPT = `You are analyzing an advisory master document. Generate a concise project briefing that captures:

1. **Company Snapshot**: One paragraph with key facts (ARR, stage, team size, location)
2. **Key Context**: 2-3 bullet points about what makes this deal/client unique
3. **Red Flags**: Any concerns or risks mentioned (if none, say "None identified")
4. **Current Status**: What's the latest and what's next

Keep the total summary under 1000 characters. Focus on what an advisor needs to know for their next interaction.

Format as clean markdown without excessive formatting.`;

export async function generateSummary(
  masterDoc: AdvisoryFile,
  entityType: 'deal' | 'client'
): Promise<string> {
  const openai = createOpenAI({
    apiKey: process.env.AI_GATEWAY_API_KEY || process.env.OPENAI_API_KEY,
    baseURL: process.env.AI_GATEWAY_BASE_URL || 'https://api.openai.com/v1',
  });

  const { text } = await generateText({
    model: openai('gpt-4o-mini'),
    system: SUMMARY_PROMPT,
    prompt: `Entity Type: ${entityType}
Company: ${masterDoc.frontmatter.company || 'Unknown'}

FRONTMATTER:
${JSON.stringify(masterDoc.frontmatter, null, 2)}

DOCUMENT CONTENT (first 8000 chars):
${masterDoc.content.slice(0, 8000)}`,
  });

  return text;
}

/**
 * Extract key sections for context injection
 */
export function extractKeySections(masterDoc: AdvisoryFile): string {
  const keySectionTitles = [
    'Company Snapshot',
    'TLDR',
    'Key Stakeholders',
    'GTM Assessment',
    'Red Flags',
    'Current Status',
  ];

  const keyContent: string[] = [];

  // Add frontmatter as structured data
  keyContent.push('## Company Overview');
  if (masterDoc.frontmatter.company) keyContent.push(`**Company:** ${masterDoc.frontmatter.company}`);
  if (masterDoc.frontmatter.founder) keyContent.push(`**Founder:** ${masterDoc.frontmatter.founder}`);
  if (masterDoc.frontmatter.deal_stage) keyContent.push(`**Stage:** ${masterDoc.frontmatter.deal_stage}`);
  if (masterDoc.frontmatter.arr_estimate) keyContent.push(`**ARR:** ${masterDoc.frontmatter.arr_estimate}`);
  keyContent.push('');

  // Add key sections
  for (const section of masterDoc.sections) {
    if (keySectionTitles.some(t => section.title.includes(t))) {
      keyContent.push(`## ${section.title}`);
      keyContent.push(section.content.slice(0, 2000)); // Limit per section
      keyContent.push('');
    }
  }

  return keyContent.join('\n');
}
```

---

### Task 3.2: Import Single Folder API

**File:** `app/api/advisory/import/route.ts`

**What it does:** Import a single advisory folder as a project

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { readMasterDoc } from '@/lib/advisory/file-reader';
import { generateSummary } from '@/lib/advisory/summarizer';
import { createProject } from '@/lib/db/queries';

export async function POST(req: NextRequest) {
  try {
    const { folderPath, generateSummaryFlag = true } = await req.json();

    if (!folderPath) {
      return NextResponse.json({ error: 'folderPath required' }, { status: 400 });
    }

    // Read master doc
    const masterDoc = await readMasterDoc(folderPath);
    if (!masterDoc) {
      return NextResponse.json({ error: 'Master doc not found' }, { status: 404 });
    }

    // Determine entity type from path
    const entityType = folderPath.includes('/clients/') ? 'client' : 'deal';

    // Generate summary if requested
    let customInstructions = '';
    if (generateSummaryFlag) {
      customInstructions = await generateSummary(masterDoc, entityType);
    }

    // Create project
    const project = await createProject({
      name: masterDoc.frontmatter.company || 'Unknown',
      description: `${entityType === 'deal' ? 'Deal' : 'Client'}: ${masterDoc.frontmatter.company}`,
      custom_instructions: customInstructions,
      entity_type: entityType,
      advisory_folder_path: folderPath,
    });

    return NextResponse.json({
      success: true,
      project,
      frontmatter: masterDoc.frontmatter,
    });
  } catch (error) {
    console.error('[api/advisory/import] Error:', error);
    return NextResponse.json({ error: 'Import failed' }, { status: 500 });
  }
}
```

---

### Task 4.1: Context Manager Update

**File:** `lib/ai/context-manager.ts`

**What it does:** Read from file system for advisory projects

```typescript
// Add import at top
import { readMasterDoc, extractKeySections } from '@/lib/advisory/file-reader';
import { getProject } from '@/lib/db/queries';

// Modify getProjectContext function
export async function getProjectContext(projectId: string): Promise<ProjectContext> {
  // First, check if this is an advisory project
  const project = await getProject(projectId);

  // Advisory projects: read from file system (always current)
  if (project?.advisory_folder_path) {
    const masterDoc = await readMasterDoc(project.advisory_folder_path);

    if (masterDoc) {
      // Extract key sections to limit token usage
      const keySections = extractKeySections(masterDoc);

      return {
        projectId,
        files: [{
          id: 'master-doc',
          filename: masterDoc.filename,
          content_text: keySections, // Use extracted sections, not full doc
        }],
        totalTokens: keySections.length / 4,
      };
    }
  }

  // Regular projects: read from database (existing behavior)
  const files = await getFilesByProject(projectId);

  const totalTokens = files.reduce((acc, file) => {
    return acc + (file.content_text.length / 4);
  }, 0);

  return {
    projectId,
    files: files.map(f => ({
      id: f.id,
      filename: f.filename,
      content_text: f.content_text
    })),
    totalTokens
  };
}
```

---

## Reuse Existing Code

**Embedding Generation (for future search):**
```typescript
// lib/ai/embedding.ts - already exists
import { generateEmbedding } from '@/lib/ai/embedding';
```

**Supabase Client:**
```typescript
// lib/db/client.ts - already exists
import { supabase, DEFAULT_USER_ID } from '@/lib/db/client';
```

**Project Queries:**
```typescript
// lib/db/queries.ts - already exists
import { getProject, createProject, updateProject } from '@/lib/db/queries';
```

**AI Text Generation:**
```typescript
// Used in chat API - reuse pattern
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
```

---

## Known Gotchas

| Issue | Why It Happens | Solution |
|-------|----------------|----------|
| Server component vs client | File reading uses Node.js fs | Create API routes for file operations |
| Large master docs | Some docs >50KB | Extract key sections, limit context |
| Gray-matter import | ESM compatibility | Use `import matter from 'gray-matter'` |
| Null advisory_folder_path | Existing projects | Guard with `if (project?.advisory_folder_path)` |
| Build fails after migration | Column doesn't exist yet | Apply migration first |

---

## Testing Checklist

**After each task:**
- [ ] `npm run build` passes
- [ ] Dev server starts (`npm run dev`)
- [ ] No TypeScript errors

**After Phase 3 (APIs):**
- [ ] `GET /api/advisory/available` returns folder list
- [ ] `POST /api/advisory/import` creates project
- [ ] `POST /api/advisory/bulk-import` imports all folders

**Final demo:**
- [ ] Bulk import all 6 deals via UI
- [ ] Open MyTab project, verify context injected
- [ ] Edit custom instructions, verify saved
- [ ] Click "Refresh from file", verify updated
- [ ] Import wizard works for new folder

---

## Success Criteria

- [ ] Build passes (`npm run build`)
- [ ] All 6 deals imported as separate projects
- [ ] Entity type badges visible in project list
- [ ] New chat in MyTab project has full context injected
- [ ] Custom instructions editable in project settings
- [ ] "Refresh from file" updates context from current master doc
- [ ] Import wizard works for adding new advisory folders

---

## Resources

**External Docs:**
- [gray-matter](https://github.com/jonschlinkert/gray-matter) - YAML frontmatter parsing
- [Vercel AI SDK](https://sdk.vercel.ai/docs) - Text generation

**Project Files:**
- Sprint tracking: `docs/sprints/active/M38-01/sprint-m38-01.md`
- Architecture: `CLAUDE.md`
- Plan file: `~/.claude/plans/effervescent-crunching-volcano.md`

---

## Recommended Sub-Agents

| Phase | Sub-Agent | Purpose | Invocation |
|-------|-----------|---------|------------|
| All | `code-reviewer` | PR review before merge | `@code-reviewer review this PR` |
| Phase 5 | `ui-developer` | Component implementation | `@ui-developer build this component` |

---

*Prepared by Claude Code - December 7, 2025*
