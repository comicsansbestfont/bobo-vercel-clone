# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an AI chatbot application built with Next.js 16, React 19, and the Vercel AI SDK. It provides a production-ready chat interface with multi-modal capabilities, context management, and support for multiple AI models through the AI Gateway.

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
- `AI_GATEWAY_API_KEY` - API key for the AI Gateway (supports OpenAI, Anthropic, Google, Deepseek models)

## Architecture Overview

### API Routes & Backend Logic

**Chat API** (`app/api/chat/route.ts`)
- Main chat endpoint using Vercel AI SDK's `streamText`
- Supports web search via Perplexity when `webSearch: true`
- Uses AI Gateway for unified access to multiple LLM providers
- SDK warnings for non-OpenAI reasoning are disabled globally
- Returns streaming responses via `toTextStreamResponse()`

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

1. **Claude Agent SDK Build Error** (Nov 29)
   - **Problem:** Node.js modules (`child_process`, `fs`) imported in client bundle via barrel exports
   - **Fix:** Separated `lib/agent-sdk/index.ts` (client-safe) from `lib/agent-sdk/server.ts` (server-only)
   - **Result:** App builds and loads successfully

2. **REST API Embedding Generation** (Nov 28)
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

### Architecture Pattern (Client/Server Separation)

```
lib/agent-sdk/
├── index.ts      # Client-safe exports (utils, UI helpers, emojis)
└── server.ts     # Server-only exports (Agent SDK, safety hooks, tools)
```

**Import Guidelines:**
- Client components: `import { ... } from '@/lib/agent-sdk'`
- Server components/API routes: `import { ... } from '@/lib/agent-sdk/server'`

### Key Files
- `lib/agent-sdk/index.ts` - Client-safe exports only
- `lib/agent-sdk/server.ts` - Server-only exports (created Nov 29)
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

2. **search_advisory Agent Tool** (`lib/agent-sdk/advisory-tools.ts`)
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
- `lib/agent-sdk/advisory-tools.ts` - Agent tool module

### Example Queries (Agent Mode)
- "Brief me on MyTab" → Master-doc content
- "What deals have red flags?" → Multiple deal files
- "Prep me for SwiftCheckin call" → Client profile

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
- **Agent SDK**: Anthropic Claude Agent SDK (M4 - Agent Mode)
