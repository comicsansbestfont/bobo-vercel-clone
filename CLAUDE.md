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

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **React**: v19.2.0
- **AI SDK**: Vercel AI SDK (@ai-sdk/react, @ai-sdk/openai)
- **Database**: Supabase (PostgreSQL with pgvector extension)
- **Vector Search**: pgvector for semantic similarity, tsvector for full-text
- **UI**: Radix UI primitives + shadcn/ui + Tailwind CSS v4
- **Animation**: Motion (Framer Motion)
- **Code Highlighting**: Shiki
- **Markdown**: streamdown (with rehype-raw for HTML in citations)
- **Token Counting**: gpt-tokenizer
- **Validation**: Zod v4
