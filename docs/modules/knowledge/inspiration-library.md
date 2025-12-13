# KNO-002: Inspiration Library

**Status:** Production
**Project UUID:** `22222222-2222-2222-2222-222222222222`
**Directory:** `01_Inspiration/`
**File Count:** 741

## Purpose

The Inspiration Library provides external thought leadership and industry insights to enrich drafts and provide strategic guidance. Content is indexed with embeddings for semantic search.

## Content Types

- **Blog Posts:** T2D3, MRR Unlocked, BasicArts, Fluint, The Venture Crew
- **Videos:** Markdown summaries of video content
- **LinkedIn Archives:**
  - Brett Jansen: 391 posts
  - Alex Estner: 626 posts
  - Format: CSV ingested as per-post documents

## Architecture

- **Storage:** Files indexed in database with embeddings and source metadata
- **Search:** Semantic search scoped to Inspiration Library project
- **No Filesystem Dependency:** Full file reads from database

## Tools Available

- `search_inspiration` - Semantic search across all inspiration content
  - Scoped to Inspiration Library project UUID
  - Returns relevant posts, articles, and LinkedIn content
- `read_inspiration_file` - Full file read from database

## Indexing

```bash
# Index inspiration files (after adding/modifying)
npm run index-inspiration

# Verify indexing coverage
npm run verify-inspiration
```

## Example Queries

- "Can you enrich this draft with T2D3 guidance?"
- "What does MRR Unlocked say about pricing strategy?"
- "Find Brett Jansen's posts about sales development"

## Key Files

- `scripts/index-inspiration.ts` - Indexing script with LinkedIn CSV ingestion
- `scripts/verify-inspiration-indexing.ts` - Verification script
- `lib/ai/claude-advisory-tools.ts` - Tool definitions and executors

## Related Documentation

See [REGISTRY.md](../REGISTRY.md) for complete module registry.
