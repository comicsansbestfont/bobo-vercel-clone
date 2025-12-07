# Decision: MVP Simplification Proposal & Dogfooding-First Approach

**Date:** December 7, 2025
**Status:** DECIDED - Wait and Dogfood First
**Participants:** Sachee, Claude (Opus 4.5)
**Context:** Architecture comparison between Claude Code CLI and Bobo AI Brain

---

## Executive Summary

After extensive analysis comparing Bobo's memory architecture with Claude Code CLI's approach, we identified potential simplifications. However, we decided to **dogfood the current implementation for 1-2 weeks before making changes**, following the product vision's "let pain guide priorities" principle.

---

## The Discussion

### What Triggered This

During a review of how Claude Code CLI manages memory and context (via `.claude/` folder and `CLAUDE.md` files), we identified architectural patterns that could simplify Bobo:

1. **File-based context** (BOBO.md) vs database-only memory
2. **Explicit user control** (`#` prefix, `/compact` commands) vs auto-extraction
3. **Feature flags** to toggle complexity on/off
4. **Disable Loop B** (cross-project search) for faster, simpler responses

### Proposed Simplifications (Deferred)

| Change | Effort | Rationale |
|--------|--------|-----------|
| Add `lib/config/features.ts` | 30 min | Toggle complexity without deleting code |
| Disable Loop B via flag | 15 min | Reduce latency, simplify debugging |
| Disable auto-extraction | 5 min | Use explicit `#` prefix instead |
| Add BOBO.md loader | 2-3 hr | File-based stable context |
| Add `/compact`, `/clear` commands | 2 hr | User-triggered compression |
| Add `#` quick memory prefix | 1 hr | Explicit memory adds |

**Total estimated: ~6-8 hours**

### The Counter-Argument (Accepted)

> "I think what we have implemented may be quite comprehensive and I don't actually know if it's working or not."

This is the correct instinct. We were about to simplify a system we haven't validated. The current implementation includes:

- ✅ Enhanced memory search with 5-component weighting
- ✅ 45-day Ebbinghaus decay
- ✅ Advisory files indexed with `search_advisory`
- ✅ Agent memory tools (remember_fact, search_memory)
- ✅ Hybrid search (70% vector + 30% BM25)

**Premature simplification is just as wasteful as premature optimization.**

---

## Decision

### Immediate Action: Dogfood for 1-2 Weeks

Use Bobo daily for Advisory workflow queries. Track:

1. **What queries worked well?**
2. **What queries failed?**
3. **What felt slow?**
4. **What felt opaque?**
5. **What did you wish you could do?**

### Review Date: December 14-21, 2025

Return to this document with dogfooding data. Decide which simplifications (if any) to implement based on actual pain points.

---

## Future Direction: Layered .md File Approach

If dogfooding reveals that stable context is missing, we'll implement a layered .md approach:

### Proposed File Structure

```
~/.bobo/
└── BOBO.md                    # Global user preferences (stable)

/bobo-vercel-clone/
├── BOBO.md                    # Project-level context for Bobo itself
├── advisory/
│   ├── CONTEXT.md             # How to interpret advisory files (NEW)
│   ├── deals/
│   │   ├── MyTab/master-doc.md
│   │   └── ...
│   └── clients/
│       └── SwiftCheckin/client-profile.md
```

### Context Types

| Type | Storage | Purpose |
|------|---------|---------|
| **Stable** | .md files | Who you are, methodology, how to interpret files |
| **Dynamic** | Database | Extracted facts, temporal learnings, decayable |

### System Prompt Assembly (Future)

```
1. Base Bobo personality
2. User-level BOBO.md (stable: who you are, preferences)
3. Project custom_instructions (if in a project)
4. Advisory CONTEXT.md (if querying advisory)
5. Retrieved memories from database (dynamic)
6. Retrieved files via search_advisory (on-demand)
```

### Example: advisory/CONTEXT.md

```markdown
# How to Interpret Advisory Files

## Deal Stages
- Phase 0: Early exploration
- Phase 1: Active relationship
- Phase 2: Investment/engagement

## Key Sections in Master Docs
- "Red Flags" = Critical concerns to always surface
- "Communications Log" = Recent interactions (check dates)
- "Valuation Snapshot" = Financial context

## When Briefing Deals
- Always mention current stage
- Always surface red flags
- Include last 2-3 communications
```

---

## Alignment with Product Vision

From `PLATFORM_BRIEF.md`:

> "Let pain guide priorities. Build features when you feel their absence, not speculatively."

> "Ship infrastructure, build one use case at a time, dogfood extensively, let pain guide priorities."

This decision follows these principles exactly:
1. We have infrastructure (M1-M4 complete)
2. We have a use case (Advisory workflow)
3. We will dogfood extensively (1-2 weeks)
4. We will let pain guide the simplification priorities

---

## Dogfooding Log Template

```markdown
# Dogfooding Log - Week of Dec 9, 2025

## Dec 9
- Query: "Brief me on MyTab"
- Result: ✅ Good / ❌ Bad / ⚠️ Partial
- Notes:

## Dec 10
...
```

---

## Related Documents

- `docs/product/PLATFORM_BRIEF.md` - Product vision
- `docs/product/use-cases/ADVISORY_WORKFLOW.md` - Advisory use case
- `docs/product/roadmaps/COGNITIVE_MEMORY.md` - M3.6 cognitive features
- `docs/product/PRODUCT_BACKLOG.md` - Current backlog

---

## Appendix: Claude Code vs Bobo Comparison

### Where They Align

| Pattern | Claude Code | Bobo |
|---------|-------------|------|
| Hierarchical context | CLAUDE.md files | User profile → memories → project context |
| Model-specific caching | Anthropic/Gemini prompt caching | Same pattern in context-manager.ts |
| Compression philosophy | /compact command | Auto-compress at 90% |
| Project isolation | Per-directory sessions | project_id foreign key |

### Where Bobo Goes Further

| Feature | Claude Code | Bobo |
|---------|-------------|------|
| Memory source | Manual CLAUDE.md files | Auto-extracted from conversations |
| Retrieval | File inclusion at load time | Semantic search via embeddings |
| Cross-project | None (isolated) | Loop B global hybrid search |
| Citations | None | Perplexity-style inline [1], [2] |
| Memory lifecycle | Static | Dynamic with decay |

### What We Could Borrow (If Needed)

1. **BOBO.md files** - Stable context, user-controlled
2. **`#` prefix** - Quick memory adds without extraction
3. **`/compact`, `/clear`** - Explicit user commands
4. **Feature flags** - Toggle complexity without removing code

---

## Document History

| Date | Author | Change |
|------|--------|--------|
| 2025-12-07 | Sachee & Claude | Initial decision document |

---

*This document will be updated after the dogfooding period with findings and next steps.*
