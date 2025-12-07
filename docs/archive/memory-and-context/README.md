# Memory and Context Research (ARCHIVED)

> **Status:** SUPERSEDED - December 2025
> **Superseded by:**
> - `CLAUDE.md` (M2: Double-Loop RAG Architecture section)
> - `docs/product/PLATFORM_BRIEF.md` (Memory System documentation)

## What's in this folder

These documents were **pre-implementation planning** for the Double-Loop memory architecture. The core concepts have been implemented and are now documented in:

1. **CLAUDE.md** - Contains the actual implementation details:
   - Loop A: Project Context Caching
   - Loop B: Global Hybrid Search (70% vector + 30% BM25 via RRF)

2. **PLATFORM_BRIEF.md** - Contains the product-level architecture documentation

## Files

| File | Original Purpose | Implementation Status |
|------|-----------------|----------------------|
| `Briefing.md` | Product strategy brief for memory architecture | Core concepts implemented in M2 |
| `Technical Memo.md` | Engineering spec for Double-Loop | Implemented with enhancements (RRF, hybrid search) |

## Why Archived

These documents represent the **thinking/planning phase** before implementation. While historically valuable for understanding design decisions, the actual implementation evolved during development:

- **Original spec:** Cosine similarity with 0.82 threshold
- **Actual implementation:** Reciprocal Rank Fusion (RRF) combining 70% vector + 30% BM25

Keep these files for historical reference, but refer to `CLAUDE.md` for current implementation details.

---
*Archived: December 7, 2025*
