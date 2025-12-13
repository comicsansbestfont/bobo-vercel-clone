# KNO-001: Advisory Library

**Status:** Production
**Project UUID:** `11111111-1111-1111-1111-111111111111`
**Directory:** `advisory/`
**File Count:** 43

## Purpose

The Advisory Library provides deal and client context for advisory work. It operates in file-reference mode, reading master documents directly from the file system to ensure always-current data.

## Content Types

- **Deals:** MyTab, SwiftCheckin, ArcheloLab, ControlShiftAI, Talvin, Tandm
- **Clients:** SwiftCheckin client profiles
- **Format:** Markdown files with YAML frontmatter (gray-matter)

## Architecture

- **Mode:** File-reference (reads from disk, not database)
- **Context Injection:** Master docs are read and key sections extracted for token-efficient context
- **Project Integration:** Each deal/client can be imported as a project with `entity_type` and `advisory_folder_path`

## Tools Available

- `search_advisory` - Hybrid search (70% vector + 30% full-text BM25)
  - Filters by entity_type (deal/client) and entity_name
  - Auto-approved (read-only)
- `read_advisory_file` - Full file read from database

## Indexing

```bash
# Index advisory files (after adding/modifying)
npm run index-advisory

# Verify indexing coverage
npm run verify-advisory
```

## Key Files

- `lib/advisory/file-reader.ts` - Master doc parsing
- `lib/advisory/summarizer.ts` - AI summary generation
- `lib/ai/context-manager.ts` - File-reference context injection
- `scripts/index-advisory.ts` - Indexing script
- `scripts/verify-advisory-indexing.ts` - Verification script

## Related Documentation

See [REGISTRY.md](../REGISTRY.md) for complete module registry.
