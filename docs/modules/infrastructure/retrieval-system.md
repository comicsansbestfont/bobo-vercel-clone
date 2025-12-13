# INF-003: Retrieval System

**Status:** Production

## Purpose

Double-loop hybrid search system combining project-specific context caching (Loop A) with global semantic search (Loop B) for intelligent context retrieval and knowledge management.

## Key Components

### Loop A: Project Context Caching
- **High-Fidelity Context:** Retrieves ALL files from active project (no chunking)
- **Model-Specific Caching:**
  - Anthropic: Prompt caching with cache breakpoints
  - Gemini: Native context caching API
  - Others: Standard system prompt injection
- **Token Budget Management:** Ensures context fits within model limits
- **Custom Instructions:** Per-project instructions injected into system prompt
- **Advisory File Reference:** Reads master docs directly from file system for advisory projects

### Loop B: Global Hybrid Search
- **Semantic Search:** Vector similarity via pgvector (cosine distance)
- **Full-Text Search:** PostgreSQL tsvector with BM25 ranking
- **Reciprocal Rank Fusion:** Merges results (70% vector + 30% text)
- **Cross-Project Patterns:** Searches across ALL projects, excludes current project
- **Top Results:** Returns top 5 from files and messages tables

### Specialized Libraries
- **Advisory Library:** Deal/client files with entity filtering (`11111111-...`)
- **Inspiration Library:** Blog posts, videos, LinkedIn archive (`22222222-...`)
- **Reference Library:** Identity docs, playbooks, LinkedIn export (`33333333-...`)

## Entry Points

- `lib/ai/context-manager.ts` - Loop A project context caching
- `lib/ai/embedding.ts` - Vector embedding generation
- `lib/db/queries.ts` - Hybrid search queries (Loop B)
- `lib/advisory/file-reader.ts` - Advisory master doc parsing
- `scripts/index-advisory.ts` - Advisory file indexing
- `scripts/index-inspiration.ts` - Inspiration library indexing
- `scripts/index-reference.ts` - Reference library indexing

## Dependencies

- Supabase PostgreSQL with pgvector extension
- Vercel AI SDK for embedding generation
- Chat Engine (INF-001) for context injection

## Related Documentation

- [Module Registry](../REGISTRY.md)
- [M2: Double-Loop RAG Architecture](../../../CLAUDE.md#m2-double-loop-rag-architecture)
