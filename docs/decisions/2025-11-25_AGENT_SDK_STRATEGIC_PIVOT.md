# Strategic Decision Record: Agent SDK Pivot

**Date:** November 25, 2025
**Decision Makers:** Product Owner
**Status:** DRAFT - Pending Review

---

## Executive Summary

This document captures the strategic decision to **prioritize Claude Agent SDK implementation immediately**, pivoting from the original roadmap that placed agentic capabilities at Milestone 6 (2027 Q1+). This pivot is driven by the realization that Bobo is a **personal internal tool**, not a SaaS product, which fundamentally changes priorities.

---

## Background Context

### Current State of Bobo

| Milestone | Status | Description |
|-----------|--------|-------------|
| V1 | ✅ Complete | Persistence foundation (Supabase, chat history, projects) |
| M2 | ✅ Complete | Double-Loop RAG (Loop A: project context, Loop B: hybrid search) |
| M3 | 🚧 79% Complete | User memory (Gemini extraction, 6 categories, memory UI) |
| M4 | 📝 Planned | Auth, multi-user, teams (25 tasks) |
| M5 | 📝 Planned | Knowledge graph, living docs (8 tasks) |
| M6 | 📝 Planned | Agentic capabilities (22 tasks, ~102h) |

### Original Roadmap Assumptions

The original roadmap assumed Bobo would become a **multi-user SaaS product**:
- M4 focused on authentication, teams, and production scale
- M5 added cognitive layer after "months of real data"
- M6 came last because "agent needs auth, rate limiting, audit logging"

### The Realization

**Bobo is being built as a personal internal tool, not a SaaS.**

This changes everything:
- No need for authentication (single user)
- No need for teams or multi-user features
- No need for usage analytics or cost tracking UI
- Success metrics like "10 beta users" or "$10k MRR" are irrelevant

---

## Key Decisions

### Decision 1: Implement Agent SDK NOW

**Decision:** Move Agent SDK from M6 (last) to current priority.

**Rationale:**
1. Agent SDK is the **core differentiator** - everyone has chat, few have good agents
2. Nothing technically blocks it - M1/M2 provide the foundation, M3 is sufficient at 79%
3. The agent is the **interface to the future second brain** - it's how you'll interact with your knowledge
4. Shipping the agent enables using it to **accelerate building everything else**

**Original Timeline:** Q1 2027+ (after M4, M5)
**New Timeline:** This week (~15 hours)

---

### Decision 2: Kill M4 Entirely

**Decision:** Remove all M4 tasks (authentication, multi-user, teams) from the roadmap.

**Rationale:**
- Single user = no authentication needed
- No teams = no team workspaces, permissions, or sharing
- No multi-user = no RLS security model required (beyond current MVP)

**Killed Tasks (25 total):**
- M4-1 through M4-5: Authentication & Multi-User
- M4-6 through M4-9: Team Workspaces
- M4-10 through M4-14: Analytics & Monitoring (keep error tracking only)
- M4-15 through M4-20: Advanced Features (defer, not kill)
- M4-21 through M4-25: DevOps (keep CI/CD, backups)

**Hours Saved:** ~60+ hours

---

### Decision 3: Defer M5 (Knowledge Graph)

**Decision:** Move knowledge graph to "future" status, implement only when pain is felt.

**Rationale:**
- Agent can work without knowledge graph (uses RAG instead)
- Agent can help BUILD the knowledge graph when needed
- Knowledge graph becomes more valuable with more content
- "Let pain guide priorities" - implement when frustrated by its absence

**Deferred Tasks:**
- M5-1 through M5-8: Living docs, fact extraction, executive briefs

---

### Decision 4: Defer M3 Phase 4

**Decision:** Leave M3 at 79% complete, defer Phase 4 polish features.

**Rationale:**
- Memory extraction works (Gemini Flash Lite pipeline)
- Memory injection works (system prompt)
- Memory UI works (/memory page)
- Phase 4 features are polish, not critical:
  - Memory provenance UI
  - Memory debugger
  - Export as JSON
  - Profile preview

**Deferred Tasks:**
- M3-26: Memory provenance UI (2h)
- M3-10: Memory debugger (3h)
- M3-9: Conflict resolution UI (3h)
- M3-27: Token budget enforcement (2h)
- M3-28: Export memory as JSON (2h)
- M3-16: Profile preview (1h)

**Hours Deferred:** ~13 hours

---

### Decision 5: Hybrid Architecture (Agent SDK + AI Gateway)

**Decision:** Keep AI Gateway for multi-model chat, use Claude Agent SDK for agentic tasks.

**Rationale:**
- Users might prefer different models for different tasks
- Cost optimization (Gemini Flash is cheaper for simple tasks)
- Preserves existing chat experience while adding agent capabilities
- Pragmatic approach - best of both worlds

**Architecture:**
```
Chat Mode (/api/chat/)     → AI Gateway → GPT, Gemini, Claude, Deepseek
Agent Mode (/api/agent/)   → Claude Agent SDK → Claude only (with tools)
```

Both modes share:
- User memory injection (M3)
- Project context injection (M2 Loop A)
- RAG search (M2 Loop B)
- Context tracking

---

### Decision 6: Keep Existing Memory & Embedding Systems

**Decision:** Do not change memory extraction (Gemini) or embeddings (OpenAI).

**Rationale:**

| Component | Current | Considered | Decision |
|-----------|---------|------------|----------|
| Memory Extraction | Gemini 2.5 Flash Lite | Claude | **Keep Gemini** (56% cheaper, works well) |
| Embeddings | OpenAI text-embedding-3-small | Voyage AI | **Keep OpenAI** (provider-agnostic, high quality) |
| Compression | Custom (memory-manager.ts) | SDK compaction | **Keep both** (custom for chat, SDK for agent) |

---

### Decision 7: Simplify Roadmap to 3 Milestones

**Decision:** Replace M4-M6 with three focused milestones.

**New Roadmap:**

| Milestone | Focus | Hours | Timeline |
|-----------|-------|-------|----------|
| **AGENT** | Claude Agent SDK integration | ~15h | Now (Week 1-2) |
| **FILES** | Enhanced file system (subdirectories, bulk upload) | ~12h | Next (Week 3-4) |
| **SANDBOX** | Code execution sandbox | ~10h | Then (Week 5-6) |

**Total:** ~37 hours vs original ~162 hours (M4+M5+M6)

---

## What the Claude Agent SDK Provides

Based on review of official documentation:

### Built-in Tools (No Implementation Needed)
- `Read` - Read file contents
- `Write` - Write/create files
- `Edit` - Edit existing files
- `Bash` - Execute shell commands
- `Glob` - Find files by pattern
- `Grep` - Search file contents

### Key Features
- **Hooks** - Deterministic callbacks for safety (PreToolUse, PostToolUse)
- **Subagents** - Parallel execution with isolated context
- **MCP Servers** - External service integrations
- **Compaction** - Auto-summarizes context when limits approach
- **Permission Modes** - Control tool execution approval

### What We Still Need to Build
- `/api/agent/route.ts` - API endpoint
- Agent mode toggle in UI
- Tool result streaming components
- User confirmation flow for sensitive operations
- Integration with existing memory/context systems

---

## Technical Architecture (Post-Pivot)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Bobo Frontend                                 │
│                                                                     │
│   ┌─────────────────────┐              ┌─────────────────────┐     │
│   │   Chat Mode         │              │   Agent Mode        │     │
│   │   (Multi-Model)     │              │   (Claude SDK)      │     │
│   │   - GPT-5           │              │   - Tools           │     │
│   │   - Gemini          │              │   - Hooks           │     │
│   │   - Claude          │              │   - MCP             │     │
│   │   - Deepseek        │              │                     │     │
│   └──────────┬──────────┘              └──────────┬──────────┘     │
└──────────────┼─────────────────────────────────────┼────────────────┘
               │                                     │
               ▼                                     ▼
┌──────────────────────────────┐    ┌──────────────────────────────────┐
│      /api/chat/              │    │        /api/agent/               │
│      AI Gateway              │    │        Claude Agent SDK          │
└──────────────────────────────┘    └──────────────────────────────────┘
               │                                     │
               └──────────────┬──────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Shared Services                               │
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │   User Memory   │  │   RAG Search    │  │    Context      │     │
│  │   (Gemini)      │  │   (pgvector)    │  │    Tracking     │     │
│  │                 │  │                 │  │                 │     │
│  │ - 6 categories  │  │ - Loop A: full  │  │ - Token counts  │     │
│  │ - Extraction    │  │   project files │  │ - Compression   │     │
│  │ - Deduplication │  │ - Loop B: hybrid│  │ - Usage states  │     │
│  └─────────────────┘  │   search        │  └─────────────────┘     │
│                       └─────────────────┘                           │
│                                                                     │
│                      Supabase (PostgreSQL + pgvector)               │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Permanently Out of Scope

| Item | Reason |
|------|--------|
| Authentication (OAuth, email/password) | Single user |
| Multi-user support | Single user |
| Teams and workspaces | Single user |
| Usage analytics UI | Check API dashboards directly |
| Cost tracking UI | Check API dashboards directly |
| Supermemory.ai integration | Custom extraction works better, 56% cheaper |
| OpenAI Assistants API | Claude-only for agent |
| Gemini code execution | Claude-only for agent |
| Multi-agent orchestration | Overkill for personal use |
| Rate limiting middleware | Single user |

---

## Implementation Plan

### Week 1-2: Agent SDK Core (AGENT Milestone)

| Task | Hours | Description |
|------|-------|-------------|
| AGT-1 | 0.5h | Install Claude Agent SDK |
| AGT-2 | 2h | Create `/api/agent/route.ts` |
| AGT-3 | 1h | Integrate existing memory injection |
| AGT-4 | 1h | Integrate existing project context |
| AGT-5 | 3h | Wire up built-in tools |
| AGT-6 | 2h | Tool result streaming to UI |
| AGT-7 | 2h | Tool result display components |
| AGT-8 | 1h | Agent mode toggle in UI |
| AGT-9 | 2h | User confirmation for writes |

**Total:** ~15 hours

### Week 3-4: Enhanced Files (FILES Milestone)

| Task | Hours | Description |
|------|-------|-------------|
| FILE-1 | 1h | Add `parent_id` for subdirectories |
| FILE-2 | 2h | Update upload API for nested paths |
| FILE-3 | 2h | Bulk file upload endpoint |
| FILE-4 | 3h | Directory tree UI component |
| FILE-5 | 2h | Expand file types (.txt, .json, .csv) |
| FILE-6 | 2h | File management MCP server |

**Total:** ~12 hours

### Week 5-6: Code Execution (SANDBOX Milestone)

| Task | Hours | Description |
|------|-------|-------------|
| EXEC-1 | 2h | Evaluate sandbox options |
| EXEC-2 | 4h | Implement sandboxed execution |
| EXEC-3 | 2h | Output streaming |
| EXEC-4 | 2h | Security guardrails |

**Total:** ~10 hours

---

## Success Criteria

### AGENT Milestone Complete When:
- [ ] Can toggle between Chat Mode and Agent Mode
- [ ] Agent can read files from projects
- [ ] Agent can search codebase (Grep, Glob)
- [ ] Agent can create/edit files (with confirmation)
- [ ] Agent has access to user memory
- [ ] Agent has access to project context
- [ ] Tool execution streams to UI in real-time

### FILES Milestone Complete When:
- [ ] Can create subdirectories within projects
- [ ] Can upload multiple files at once
- [ ] Agent can navigate and manage file hierarchy

### SANDBOX Milestone Complete When:
- [ ] Agent can run code safely
- [ ] Output streams to UI in real-time
- [ ] Execution isolated from host system

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Claude SDK doesn't integrate well with existing systems | Low | High | SDK uses same Anthropic infrastructure as current prompt caching |
| Tool execution causes unintended changes | Medium | High | Hooks + confirmation flow for sensitive operations |
| Context limits with agent mode | Medium | Medium | SDK has built-in compaction |
| Single-provider lock-in for agent | High | Low | Chat mode still multi-provider; agent is differentiated value |

---

## Future Considerations (Not Committed)

These items may be added later based on felt need:

- **Knowledge Graph (M5)** - When cross-project querying feels limited
- **M3 Phase 4 Polish** - When memory debugging is frustrating
- **PDF Ingestion** - When you have PDFs to add
- **Apple Notes / Notion Import** - When you want to consolidate
- **Living Documentation** - When project summaries would help

**Principle:** Let pain guide priorities. Add features when you feel their absence.

---

## Document References

| Document | Current State | Action Needed |
|----------|---------------|---------------|
| PROJECT_BRIEF.md | Out of date (still references Supermemory, multi-user) | Update to reflect personal tool focus |
| PRODUCT_BACKLOG.md | Accurate for built features, but M6 at end | Restructure with Agent SDK at top |
| CLAUDE.md | Current | Add Agent SDK architecture section |

---

## Approval

- [ ] Product Owner reviewed and approved
- [ ] Technical approach validated
- [ ] Ready to update PROJECT_BRIEF.md
- [ ] Ready to update PRODUCT_BACKLOG.md
- [ ] Ready to begin implementation

---

**Document Author:** Claude (AI Assistant)
**Review Requested From:** Product Owner
**Next Action:** Review and approve, then update project documents
