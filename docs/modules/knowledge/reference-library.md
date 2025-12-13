# KNO-003: Reference Library

**Status:** Production
**Project UUID:** `33333333-3333-3333-3333-333333333333`
**Directory:** `04_Reference/`
**File Count:** 213

## Purpose

The Reference Library provides identity documents, published content, and internal playbooks as a pattern library. Playbooks are used for structure/patterns by default, not verbatim copying.

## Content Types

- **Identity Docs:** Personal positioning and messaging
- **Medium Posts:** Published articles
- **LinkedIn Archive:** Personal LinkedIn export (CSV ingested as per-post documents)
- **Playbooks/Training Material:**
  - CorePlan training modules
  - SwiftCheckin internal documentation
  - **Use Case:** Pattern library for structure and approach
- **Excluded:** PPTX, PDF, images (not indexed)

## Architecture

- **Storage:** Files indexed in database with embeddings
- **Search:** Semantic search scoped to Reference Library project
- **Guardrail:** Playbooks are for patterns/structure only; no verbatim internal specifics unless explicitly requested

## Tools Available

- `search_reference` - Semantic search across reference content
  - Scoped to Reference Library project UUID
  - Includes identity docs, posts, and playbook patterns
- `read_reference_file` - Full file read from database
  - Subject to guardrail for playbook content

## Indexing

```bash
# Index reference files (after adding/modifying)
npm run index-reference

# Verify indexing coverage
npm run verify-reference
```

## Example Queries

- "What's my positioning on sales development?"
- "Show me the structure of a good training module from the playbooks"
- "Find my Medium posts about founder-led sales"

## Key Files

- `scripts/index-reference.ts` - Indexing script with LinkedIn CSV ingestion
- `scripts/verify-reference-indexing.ts` - Verification script
- `lib/ai/claude-advisory-tools.ts` - Tool definitions and executors

## Related Documentation

See [REGISTRY.md](../REGISTRY.md) for complete module registry.
