# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an AI chatbot application built with Next.js 16, React 19. It provides a production-ready chat interface with multi-modal capabilities, context management, and advisory file search tools.

---

## ⚠️ CRITICAL: SDK Architecture Decision (M3.9)

**ALL CHAT FUNCTIONALITY MUST USE THE ANTHROPIC CLAUDE SDK** (`@anthropic-ai/sdk`)

### SDK Responsibilities

| Function | SDK | Package |
|----------|-----|---------|
| **Chat (ALL models)** | Anthropic Claude SDK | `@anthropic-ai/sdk` |
| **Tool Use (advisory search)** | Anthropic Claude SDK | `@anthropic-ai/sdk` |
| **Embeddings** | AI Gateway (Vercel) | `ai` package |
| **Summarization** | AI Gateway (Vercel) | `ai` package |
| **Non-Claude models** | AI Gateway (Vercel) | `ai` package |

### Why Claude SDK for Chat?

1. **Native `tool_use`** - Required for advisory file search/read/grep/glob tools
2. **Prompt caching** - Cost/latency optimization for project context
3. **Extended thinking** - Full access to Claude's reasoning capabilities
4. **Direct API access** - No abstraction limitations

### Key Files

- `lib/ai/claude-client.ts` - Anthropic client singleton
- `lib/ai/claude-message-converter.ts` - UIMessage → Claude format
- `lib/ai/claude-stream-transformer.ts` - Claude SSE → UI SSE format
- `lib/ai/claude-advisory-tools.ts` - ALL chat tools (advisory + memory)
- `app/api/chat/route.ts` - Chat endpoint using Claude SDK

### Environment Variables

```bash
# REQUIRED for chat
ANTHROPIC_API_KEY=sk-ant-...  # Get from console.anthropic.com

# Used for embeddings/summarization only
AI_GATEWAY_API_KEY=...
```

### ⚠️ CRITICAL: Where to Add New Tools

**ALL new tools MUST be added to `lib/ai/claude-advisory-tools.ts`**

This is the ONLY file that defines tools used during chat. The chat handler imports tools from here:
```typescript
// lib/ai/chat/handlers/claude-handler.ts
import { advisoryTools, executeAdvisoryTool } from '@/lib/ai/claude-advisory-tools';
```

To add a new tool:
1. Add tool definition to `advisoryTools` array in `lib/ai/claude-advisory-tools.ts`
2. Add case to `executeAdvisoryTool()` switch statement
3. Implement the tool function in the same file

**DO NOT create separate tool files.** All chat tools live in `claude-advisory-tools.ts`.

---

## Development Commands

### Running the Application
```bash
npm run dev        # Start development server on localhost:3000
npm run build      # Build for production
npm start          # Start production server
npm run lint       # Run ESLint
```

### Environment Setup
Required environment variables in `.env.local`:
- `ANTHROPIC_API_KEY` - **REQUIRED** for Claude SDK chat (get from console.anthropic.com)
- `AI_GATEWAY_API_KEY` - Used for embeddings, summarization, non-Claude models

## Architecture Overview

### API Routes & Backend Logic

**Chat API** (`app/api/chat/route.ts`)
- Main chat endpoint using **Anthropic Claude SDK** (`@anthropic-ai/sdk`)
- Native `tool_use` for advisory file search (5 tools: search, read, list, glob, grep)
- Agentic loop: up to 5 iterations of tool use per request
- Custom stream transformer: Claude SSE → UI SSE format for `useChat` hook
- Fallback to Vercel AI SDK for web search (Perplexity) only
- Returns streaming responses compatible with `@ai-sdk/react` useChat

**Memory Compression API** (`app/api/memory/compress/route.ts`)
- Summarizes conversation history when context limits are reached
- Uses `gpt-4o-mini` as the summarizer model
- Generates technical summaries preserving key decisions and constraints

### Core Libraries

**Context Tracking** (`lib/context-tracker.ts`)
- Monitors token usage across different models with model-specific limits
- Three-segment tracking: system prompts, conversation history, draft input
- Uses `gpt-tokenizer` for accurate token counting with heuristic fallback
- Usage states: `safe` (< 70%), `warning` (70-90%), `critical` (> 90%)
- Supports all major model families (OpenAI, Anthropic, Google, Deepseek)

**Memory Management** (`lib/memory-manager.ts`)
- Automatically compresses conversation history when context is critical
- Keeps most recent 4 messages intact, summarizes older messages
- Preserves system prompts and inserts summary as a system message
- Handles UIMessage format with support for text, reasoning, sources, and tool results

**M2: Double-Loop RAG Architecture** (`lib/ai/`)
The application uses a sophisticated "Double-Loop" context retrieval system for project-based knowledge:

**Loop A: Project Context Caching** (`lib/ai/context-manager.ts`)
- Retrieves ALL files from the active project (high-fidelity, no chunking)
- Implements model-specific caching strategies:
  - Anthropic: Prompt caching with cache breakpoints
  - Gemini: Native context caching API
  - Others: Standard system prompt injection
- Token budget management to ensure context fits within model limits
- Custom instructions per project injected into system prompt

**Loop B: Global Hybrid Search** (`lib/ai/embedding.ts`, `lib/db/queries.ts`)
- Semantic search across ALL projects for cross-project patterns
- Hybrid search combining:
  - Vector similarity (cosine distance via pgvector)
  - Full-text search (PostgreSQL tsvector)
  - Reciprocal Rank Fusion algorithm for result merging
  - Weighted: 70% vector + 30% text
- Top 5 results from files and messages tables
- Excludes current project to avoid duplication

**Source Tracking & Citations** (`lib/ai/source-tracker.ts`)
- Smart file usage detection through content similarity analysis
- Inserts Perplexity-style inline citations [1], [2] after complete sentences
- Tracks two source types:
  - "Project Files" (Loop A) - authoritative context from active project
  - "Global Inspiration" (Loop B) - patterns from other projects
- Citation metadata includes file names, project names, relevance scores

### Frontend Architecture

**Main Page** (`app/page.tsx`)
- Client component using `useChat` hook from `@ai-sdk/react`
- Real-time context usage visualization with segmented progress bar
- Model selector supporting 10+ AI models
- Web search toggle for Perplexity integration
- Auto-compression when context reaches critical state
- Message rendering supports: text, reasoning (collapsible), and sources

**AI Elements Components** (`components/ai-elements/`)
Reusable chat UI primitives:
- `conversation.tsx` - Message container with scroll management
- `message.tsx` - Message bubbles with role-based styling and actions (copy, retry)
- `prompt-input.tsx` - Multi-file attachment input with model/tool selection
- `reasoning.tsx` - Collapsible reasoning display for thinking models
- `sources.tsx` - Web search source citations
- `inline-citations.tsx` - M2 citation components:
  - `CitationMarker` - Superscript [1] with hover tooltips
  - `CitationsList` - Expandable source list at message bottom
  - Separate sections for "Project Files" vs "Global Inspiration"
- `code-block.tsx` - Syntax-highlighted code with Shiki
- `loader.tsx` - Streaming message indicator
- Other specialized components: artifact, canvas, chain-of-thought, checkpoint, etc.

**UI Components** (`components/ui/`)
shadcn/ui components built on Radix UI primitives with Tailwind styling

### Message Format

The application uses Vercel AI SDK's `UIMessage` format:
```typescript
{
  id: string;
  role: 'user' | 'assistant' | 'system';
  parts: Array<{
    type: 'text' | 'reasoning' | 'source-url' | 'tool-result';
    text?: string;
    url?: string;
    result?: string;
  }>;
}
```

## Key Technical Patterns

### Token Counting
- Primary: `gpt-tokenizer` package with `encodeChat()` for chat format
- Fallback: Heuristic estimation (text.length / 4) if tokenizer fails
- All message parts are serialized to text before counting

### Context Management Flow
1. User types message → draft tokens calculated in real-time
2. On submit → total usage checked against model's context limit
3. If critical (> 90%) → compression triggered before sending
4. Compression → older messages summarized, recent 4 kept intact
5. Summary inserted as system message to preserve context

### Streaming Response Handling
- Uses `toTextStreamResponse()` to preserve all chunk types
- Supports reasoning chunks for thinking models (despite non-OpenAI warning)
- Client receives and renders streaming text, reasoning, and sources in real-time

### Model Configuration
Supported models defined in `app/page.tsx`:
- OpenAI: GPT-4o, GPT-5 variants
- Anthropic: Claude Sonnet 4.5, Opus 4
- Google: Gemini 2.5/3 Pro/Flash
- Deepseek: R1 and V3

Context limits stored in `MODEL_CONTEXT_LIMITS` map in `lib/context-tracker.ts`

## Path Aliases
- `@/*` maps to project root (configured in `tsconfig.json`)
- Use `@/components/*`, `@/lib/*`, `@/app/*` for imports

## Sprint Planning & Quality Assurance

**Sprint Planning Agent** (`.claude/agents/sprint-planning-agent.md`)
- Ubiquitous co-pilot for ALL sprint planning sessions
- Enforces quality gates learned from M3.5-01 post-mortem
- Guides through 4 phases: Scoping → Task Definition → Capacity Planning → Quality Gates
- Validates pre-sprint audit (integration surface, reusable code verification)
- Prevents anti-patterns: vague testing phases, missing DoD, narrow sub-agent instructions
- Use in plan mode: `@sprint-planning-agent let's plan {sprint name}`

**Sprint Planning Skill** (`.claude/skills/sprint-planning/SKILL.md`)
- Reusable DoD templates (Feature, Bug Fix, Refactoring, API, UI, Database tasks)
- Testing task templates (Unit, Integration, E2E, Manual)
- Pre-sprint audit checklist
- Sub-agent instruction template
- Capacity calculator (65% impl, 20% testing, 10% docs, 5% buffer)
- Quality gates checklist
- Historical velocity reference (average 1.5x faster than estimates)

**Key Principle:** Sprint planning quality directly impacts execution quality. A 2-hour planning session with proper audit prevents week-long debugging later.

---

## ✅ Embedding Blocker RESOLVED (Nov 29, 2025)

**STATUS:** ✅ **FULLY RESOLVED** - All blockers cleared, 100% ship ready

### What Was Fixed

1. **REST API Embedding Generation** (Nov 28)
   - **File:** `/app/api/memory/entries/route.ts`
   - **Fix:** Added `generateEmbedding()` call in POST handler
   - **Result:** New memory entries get embeddings automatically

3. **Embedding Backfill** (Nov 29)
   - **Created:** `/app/api/memory/backfill/route.ts` - API endpoint for backfill
   - **Executed:** `curl -X POST http://localhost:3000/api/memory/backfill`
   - **Result:** 49/49 existing entries backfilled (100% coverage)

### Verification Results

| Component | Status | Details |
|-----------|--------|---------|
| Build | ✅ Working | App loads, HTTP 200 |
| REST API | ✅ Working | New entries get embeddings |
| Embedding Coverage | ✅ 100% | 50/50 entries have embeddings |
| Text Search (FTS) | ✅ Working | tsvector queries return results |
| Vector Search | ✅ Working | Cosine similarity returns correct scores |
| search_memory | ✅ Functional | Hybrid search (70% vector + 30% BM25) works |

### Key Files
- `app/api/memory/backfill/route.ts` - Backfill endpoint (created Nov 29)

**Current Build Status:** ✅ WORKING - All features functional

---

## M3.7: Advisory File Search (Dec 2025)

**STATUS:** ✅ **COMPLETE** - 43 files indexed, search_advisory tool operational

### What Was Implemented

1. **Advisory File Repository** (`advisory/`)
   - `deals/` - MyTab, SwiftCheckin, ArcheloLab, ControlShiftAI, Talvin, Tandm
   - `clients/` - SwiftCheckin
   - 43 markdown files with embeddings in `files` table

2. **Advisory Tools** (`lib/ai/claude-advisory-tools.ts`)
   - Hybrid search: 70% vector + 30% full-text (BM25)
   - Filters by entity_type (deal/client) and entity_name
   - Auto-approved (read-only)

3. **Database RPC Function** (`search_advisory_files`)
   - Added columns: entity_type, entity_name, fts (tsvector)
   - Fixed advisory project UUID: `11111111-1111-1111-1111-111111111111`

### Usage

```bash
# Index advisory files (after adding/modifying)
npm run index-advisory

# Verify indexing coverage
npm run verify-advisory
```

### Key Files
- `advisory/` - Advisory file repository
- `scripts/index-advisory.ts` - Indexing script
- `scripts/verify-advisory-indexing.ts` - Verification script
- `lib/ai/claude-advisory-tools.ts` - All chat tools (search, read, memory)

### Example Queries (Agent Mode)
- "Brief me on MyTab" → Master-doc content
- "What deals have red flags?" → Multiple deal files
- "Prep me for SwiftCheckin call" → Client profile

---

## M3.8: Advisory Project Integration (Dec 2025)

**STATUS:** ✅ **COMPLETE** - Project-per-deal system with file-reference mode

### What Was Implemented

1. **Database Schema Extensions**
   - `entity_type` column: 'deal' | 'client' | 'personal'
   - `advisory_folder_path` column: Links project to `/advisory/` folder
   - Index for efficient entity type filtering

2. **File Reference Mode** (`lib/advisory/`)
   - `file-reader.ts` - Reads master docs with gray-matter YAML parsing
   - `summarizer.ts` - Generates AI summaries using gpt-4o-mini
   - Projects read directly from file system (always current)

3. **Context Manager Enhancement** (`lib/ai/context-manager.ts`)
   - Advisory projects read master doc from file system instead of database
   - Extracts key sections for token-efficient context injection
   - Supports `isAdvisory` flag for file-reference mode

4. **API Endpoints** (`app/api/advisory/`)
   - `GET /api/advisory/available` - Lists unimported deal/client folders
   - `POST /api/advisory/import` - Imports single folder as project
   - `POST /api/advisory/bulk-import` - Batch imports multiple folders
   - `POST /api/advisory/refresh/[projectId]` - Re-reads from file, optionally regenerates summary

5. **UI Components** (`components/advisory/`)
   - `bulk-import.tsx` - Multi-select dialog for batch importing
   - `import-wizard.tsx` - Step-by-step wizard for single folder import
   - `entity-badge.tsx` - Deal (blue) / Client (green) badges

### Usage

**Import existing advisory folders:**
1. Click "New project" in sidebar
2. Select "Import Advisory" tab
3. Choose "Bulk Import" to import all at once
4. Projects appear with entity type badges

**Add future folders:**
1. Add folder to `advisory/deals/` or `advisory/clients/`
2. Use Import Wizard via "Import Advisory" → "Import Single Folder"
3. Review/edit AI-generated summary
4. Project created with file-reference mode

### Key Files
- `lib/advisory/file-reader.ts` - Master doc parsing
- `lib/advisory/summarizer.ts` - AI summary generation
- `lib/ai/context-manager.ts` - File-reference context injection
- `components/advisory/*.tsx` - Import UI components
- `components/project/create-project-modal.tsx` - Mode selector

### Architecture

```
Project (entity_type=deal, advisory_folder_path=advisory/deals/MyTab)
    ↓
Context Manager: if advisory_folder_path exists
    ↓
Read from FILE SYSTEM (not database)
    ↓
Extract key sections from master doc
    ↓
Inject into chat context (always current)
```

---

## M41: Inspiration Library (Dec 2025)

**STATUS:** ✅ **COMPLETE** - 741 files indexed, inspiration tools operational

### What Was Implemented

1. **Inspiration Library in Repo** (`01_Inspiration/`)
   - Blog posts: T2D3, MRR Unlocked, BasicArts, Fluint, The Venture Crew
   - Videos (markdown)
   - LinkedIn archive (CSV) ingested as per-post documents:
     - Brett Jansen: 391 posts
     - Alex Estner: 626 posts

2. **Indexing + Verification Scripts**
   - `scripts/index-inspiration.ts` - Indexes `01_Inspiration/**` into `files` with embeddings + source metadata
   - `scripts/verify-inspiration-indexing.ts` - Verifies disk vs DB coverage and embedding completeness

3. **Inspiration Project ID**
   - Fixed UUID: `22222222-2222-2222-2222-222222222222` (`INSPIRATION_LIBRARY_PROJECT_ID`)

4. **Claude Tools**
   - `search_inspiration` - Semantic search scoped to the Inspiration Library
   - `read_inspiration_file` - Full file read from DB (no filesystem dependency)

### Usage

```bash
# Index inspiration files (after adding/modifying)
npm run index-inspiration

# Verify indexing coverage
npm run verify-inspiration
```

### Example Queries
- "Can you enrich this draft with T2D3 guidance?"
- "What does MRR Unlocked say about pricing strategy?"

---

## M42: Reference Library (Dec 2025)

**STATUS:** ✅ **COMPLETE** - 213 docs indexed, reference tools operational

### What Was Implemented

1. **Reference Library in Repo** (`04_Reference/`)
   - Identity docs, Medium posts, and personal LinkedIn export (CSV)
   - Internal playbooks/training material (CorePlan + SwiftCheckin) as a *pattern library*
   - **Skipped:** PPTX/PDF/images (kept out of indexing)

2. **Indexing + Verification Scripts**
   - `scripts/index-reference.ts` - Indexes `04_Reference/**` markdown + ingests `04_Reference/linkedin_posts.csv` as per-post documents
   - `scripts/verify-reference-indexing.ts` - Verifies disk vs DB coverage and embedding completeness

3. **Reference Project ID**
   - Fixed UUID: `33333333-3333-3333-3333-333333333333` (`REFERENCE_LIBRARY_PROJECT_ID`)

4. **Claude Tools**
   - `search_reference` - Semantic search scoped to the Reference Library
   - `read_reference_file` - Full file read from DB
   - Guardrail: playbooks are for patterns/structure by default (no verbatim/internal specifics unless explicitly requested)

### Usage

```bash
# Index reference files (after adding/modifying)
npm run index-reference

# Verify indexing coverage
npm run verify-reference
```

## M3.16: Ask ChatGPT + Gemini Cross-Model Query Tools (Dec 2025)

**STATUS:** ✅ **COMPLETE** - Cross-model query tools available during Claude chats

### What Was Implemented

1. **Ask ChatGPT + Ask Gemini Tools** (`lib/ai/claude-advisory-tools.ts`)
   - `ask_chatgpt` → `openai/gpt-5.2` via Vercel AI Gateway
   - `ask_gemini` → `google/gemini-3-pro-preview` via Vercel AI Gateway
   - Supports 2 query modes via `query_type`:
     - `parallel_answer`: normal assistant answer to the user's latest message (excludes Claude's latest reply)
     - `second_opinion` (default): critical second opinion (includes Claude's latest reply when available)
   - Includes full chat transcript + active project summary + full project files (when enabled)

2. **Claude Tool Context Wiring** (`lib/ai/chat/handlers/claude-handler.ts`)
   - Passes full conversation + active project context to both `ask_gemini` and `ask_chatgpt`
   - Provides `claudeLatestReply` (draft text from the tool-using iteration) for second-opinion evaluation
   - Includes attachment metadata; decodes text-based data-URL attachments for tool context

### Usage

- In a Claude chat, ask for:
  - An independent answer: “Ask Gemini/ChatGPT the same question I just asked you.”
  - A second opinion: “Can you get a second opinion from Gemini/ChatGPT on your answer?”
- Claude will invoke the tool, show the response as a blockquote, then synthesize.

### Key Files
- `lib/ai/claude-advisory-tools.ts` - Tool definition, executor case, and implementation
- `lib/ai/chat/handlers/claude-handler.ts` - Second-opinion context injection

---

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **React**: v19.2.0
- **AI SDK**: Vercel AI SDK (@ai-sdk/react, @ai-sdk/openai)
- **Database**: Supabase (PostgreSQL with pgvector extension)
- **Vector Search**: pgvector for semantic similarity (via `lib/ai/embedding.ts`), tsvector for full-text
- **UI**: Radix UI primitives + shadcn/ui + Tailwind CSS v4
- **Animation**: Motion (Framer Motion)
- **Code Highlighting**: Shiki
- **Markdown**: streamdown (with rehype-raw for HTML in citations)
- **Token Counting**: gpt-tokenizer
- **Validation**: Zod v4
- **Claude SDK**: Anthropic Claude SDK (`@anthropic-ai/sdk`) for ALL chat functionality
