# Bobo AI Chatbot - Product Backlog

**Last Updated:** December 9, 2025 (M3.13 Thinking Partner Foundation added)
**Maintained By:** Solo Developer (Personal Tool)
**Purpose:** Track all planned features, improvements, and technical debt

> **Note:** Bobo is a **personal internal tool**. This backlog reflects a strategic pivot on November 25, 2025 to prioritize Agent SDK over production/scale features.

> **December 9, 2025 Update:** 🧠 **M3.13 THINKING PARTNER FOUNDATION ADDED**
> - Critical review of "Bobo as Thinking Partner" architecture with 4 sub-agents
> - Key insight: **Build primitives first, defer graph infrastructure**
> - LLMs already do graph-like reasoning; bottleneck is **context assembly**, not graph traversal
> - M3.13: Memory types (question/decision/insight), tags, thought threads, similar questions
> - 1 sprint, 15h total (7 tasks) - delivers 80% of "thinking partner" value with 10% of effort
> - **Recommendation:** Complete M3.13 BEFORE M3.10 (Knowledge Graph) to prove value

> **December 8, 2025 Update (Late PM):** 🎨 **M3.12 CHAT UX ENHANCEMENTS ADDED**
> - **Message Editing** - Edit sent messages and retry (like Claude/ChatGPT)
> - **Document Attachments** - Add PDFs, text files, images to chat context
> - **GitHub Integration** - Pull context from git repos into Bobo
> - **Advisory Folder Browser** - Visualize and reference files in project advisory folders
> - 1 sprint, 15h total (8 tasks) - dogfooding quality-of-life improvements

> **December 8, 2025 Update (PM):** 🚀 **M3.11 GTM HEALTH CHECK BOT ADDED**
> - Lead generation chatbot launching January 2026
> - "Introducing Bobo, a GTM co-pilot for advisory portfolio startups"
> - Chatbot IS the interface: collects info, runs assessment, delivers report
> - 1 sprint, 8h total (6 tasks) - simple and focused

> **December 8, 2025 Update (AM):** 🧠 **M3.10 PAPR-INSPIRED KNOWLEDGE GRAPH ADDED**
> - Research conducted on [PAPR AI](https://platform.papr.ai/) - #1 on Stanford's STaRK benchmark
> - Key insight: PAPR's value comes from **knowledge graphs**, not prediction
> - Added M3.10 milestone: Entity extraction, spreading activation, agent self-learning
> - 4 sprints, 28.5 hours total (20 tasks)
> - Tier 1 (HIGH VALUE): Entity relationships, spreading activation, agent self-learning
> - Tier 2 (MEDIUM): Context pre-fetching (optional)
> - Skipped: Predictive caching, ML models (over-engineered for advisory workflow)

> **December 7, 2025 Update (PM):** 🗂️ **M3.7 REPOSITORY CONSOLIDATION COMPLETE + DATABASE CLEANED**
> - M3.7 Sprint complete: 11/11 tasks done in 3.9h (70% faster than estimate)
> - 43 advisory files indexed (deals: MyTab, ArcheloLab, ControlShiftAI, Talvin, Tandm, SwiftCheckin + clients)
> - `search_advisory` tool operational with hybrid search
> - M3.8 Auto Tool Selection: Intent classifier + pre-flight knowledge search
> - **Database cleaned for serious dogfooding** - all test data removed, fresh start
> - **M3.8 Advisory Project Integration ready to start** - project-per-deal system
> - Created `docs/architecture/BRAIN_ARCHITECTURE.md` - comprehensive memory/context diagram

> **December 7, 2025 Update (AM):** 🧠 **M3.6 SPRINT 1 COMPLETE**
> - M3.6 Sprint 1 (Cognitive Foundation): 7/7 tasks complete
> - REQ-013: Hebbian reinforcement - duplicates now strengthen existing memories
> - REQ-014: Context-aware search - conversation context influences retrieval
> - Pre-flight knowledge search - auto-detects intent and injects advisory files + memories
> - Intent classifier with pattern matching for advisory/memory/hybrid queries

> **December 6, 2025 Update (PM):** 📂 **M3.7 REPOSITORY CONSOLIDATION PLANNED**
> - Strategic decision: Consolidate Blog Migration into Bobo (vs MCP/sync)
> - NOW phase: Move Deals/ + Clients/ (~70 files) with build-time indexing
> - Created comprehensive roadmap: `docs/product-vision/REPOSITORY_CONSOLIDATION_ROADMAP.md`
> - Dogfooding validation revealed memories insufficient → need full file access

> **December 6, 2025 Update (AM):** 🧠 **M3.6-02 ENHANCED SEARCH + BULK API COMPLETE**
> - `enhanced_memory_search` RPC deployed with 5-component temporal weighting (45% vector, 15% text, 20% recency, 10% frequency, 10% confidence)
> - `importance` column added with category-based defaults (red flags=0.9, instructions=0.85, history=0.7)
> - Bulk seeding API created (`POST /api/memory/bulk`) with deduplication and backdating support
> - 45-day half-life for Ebbinghaus recency decay
> - 22 deal/client memories seeded with embeddings (100% coverage)

> **December 1, 2025 Update:** 🧠 **M3.6 COGNITIVE MEMORY ROADMAP INTEGRATED**
> - Extracted 23 new requirements from cognitive memory research (neuroscience-inspired memory)
> - Added 9 audit items improving existing backlog definitions
> - Created 5-sprint sequence for systematic implementation (~100-120h total)
> - Key additions: temporal decay (Ebbinghaus), Hebbian reinforcement, memory graph, consolidation
> - Source: `/docs/COGNITIVE_MEMORY_REQUIREMENTS.md`

> **November 29, 2025 Update:** ✅ **ALL CRITICAL BLOCKERS RESOLVED**
> - Fixed Claude Agent SDK build error (client/server module separation)
> - Backfilled 49/49 existing memory entries with embeddings (100% coverage)
> - Verified search_memory hybrid search working (text + vector)
> - Ship status restored from REVOKED (35%) → **READY TO SHIP (100%)**

> **Sprint M3.5 Summary:** Agent mode (M4) can now self-edit memory. remember_fact and search_memory tools fully functional. Update/forget tools work but missing UI confirmation dialogs (deferred). BETA banner deployed for user expectations.

---

## 🗺️ PRODUCT ROADMAP

### Executive Summary

| Metric | Value |
|--------|-------|
| **Milestones Complete** | 8 of 10 core (M1, M2, M3 P1-3, M3.5, M4, M3.6-S1, M3.7, M3.8) |
| **Tasks Complete** | 115 of 160 (72%) |
| **Hours Invested** | ~110 hours actual |
| **Hours Remaining** | ~146.5 hours (M3.6: 64h, M3.9: 15h, M3.10: 28.5h, M3.11: 8h, M3.12: 15h, M3.13: 15h) |
| **Build Status** | ✅ Passing |
| **Current Phase** | **DOGFOODING 🐕** |

*Dec 7, 2025: M3.8 complete (19 tasks). Full advisory project system operational. Database cleaned. Serious dogfooding begins.*

### Gantt Chart - Timeline View

```
                            2024                      2025
                    Nov       Jan       Nov          Dec          Jan 2026
Milestone           ├─────────├─────────├────────────├────────────├──────────

M1: PERSISTENCE     ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
  V1-01 (6 tasks)   ████████ Nov 1-15 ✅ Complete
  V1-02 (10 tasks)       ████ Nov 16-22 ✅ Complete

M2: RAG             ░░░░░░░░░████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
  Phase 1-4 (18)             ████████ Jan 15-23 ✅ Complete

M3: MEMORY          ░░░░░░░░░░░░░░░░░░████████████████░░░░░░░░░░░░░░░░░░░░░░░
  Phase 1 (4)                         ██ Nov 24 ✅ 4.5h
  Phase 2 (12)                        ██ Nov 24 ✅ 4h
  Phase 3 (7)                         ██ Nov 24 ✅ 16h
  Phase 3.1 (7)                       ██ Nov 24 ✅ 3.5h
  Phase 4 (7)                                          ░░░░░░ Jan 2026 📝 After M3.5

M3.5: AGENT MEMORY  ░░░░░░░░░░░░░░░░░░░░░░░░████████░░░░░░░░░░░░░░░░░░░░░░░░
  Sprint 01 (7)                                ████████ Nov 28 - Dec 8 📝 ACTIVE

MOBILE v1.3.0       ░░░░░░░░░░░░░░░░░░░░██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
  UX Sprint (10)                        ██ Nov 25 ✅ 4h

M4: AGENT SDK       ░░░░░░░░░░░░░░░░░░░░░░██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
  Sprint 01 (10)                          ██ Nov 26 ✅ 10h (Day 1!)

M3.6: COGNITIVE MEM ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████████████░░░░░░░░
  Sprint 1 (7)                                              ████ Dec 2025 ✅ DONE
  Sprint 2 (4)                                                  ████ Jan 2026
  Sprint 3 (8)                                                      ████
  Sprint 4 (8)                                                          ████
  Sprint 5 (5)                                                              ████

M3.7: REPO CONSOL   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████████░
  NOW Phase (15)                                                        ████ Dec 2025 📝 PLANNED

M5: COGNITIVE       ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
  (8 tasks)                                           📝 Deferred (After M3.7)

FUTURE (SaaS)       ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
  (20 tasks)                                          📝 Not Planned

Legend: ████ Complete  ░░░░ Planned/Deferred
```

### Milestone Status Dashboard

| Milestone | Status | Tasks | Hours Est | Hours Actual | Efficiency | Key Deliverables |
|-----------|--------|-------|-----------|--------------|------------|------------------|
| **M1: Persistence** | ✅ Complete | 16/16 | 16h | 16h | 100% | Supabase integration, CRUD APIs, E2E tests |
| **M2: RAG** | ✅ Complete | 18/18 | 28h | 26h | 107% | Double-Loop architecture, pgvector, citations |
| **M3: Memory (P1-3)** | ✅ Complete | 22/22 | 51h | 28h | 182% | Hierarchical memory, Memory UI, UX polish |
| **M3.5: Agent Memory** | ✅ Complete | 7/7 | 28h | 12h | 233% | remember_fact, search_memory, embedding backfill |
| **M4: Agent SDK** | ✅ Complete | 10/10 | 25.5h | 10h | 255% | Claude SDK, tools, safety hooks, streaming |
| **M3.6: Cognitive Memory** | 🟡 **IN PROGRESS** | 7/32 | 100h | 15h | 167% | Sprint 1 complete. Sprints 2-5 remaining |
| **M3.7: Repo Consolidation** | ✅ Complete | 11/11 | 13h | 3.9h | 333% | 43 advisory files, search_advisory tool, auto tool selection |
| **M3.8: Advisory Projects** | ✅ Complete | 19/19 | 16h | ~8h | 200% | Project-per-deal, file-reference mode, AI summaries |
| **M3.9: Advisory-Memory Integration** | 📝 Planned | 0/8 | 15h | - | - | Bidirectional advisory↔memory linking |
| **M3.10: Knowledge Graph** | 📝 Planned | 0/20 | 28.5h | - | - | Entity extraction, spreading activation, agent self-learning |
| **M3.11: GTM Health Check Bot** | 📝 Planned | 0/6 | 8h | - | - | Lead gen chatbot, collects info + runs assessment, Jan 2026 launch |
| **M3.12: Chat UX Enhancements** | 📝 Planned | 0/8 | 15h | - | - | Message editing, document attachments, GitHub integration, folder browser |
| **M3.13: Thinking Partner Foundation** | 📝 Planned | 0/7 | 15h | - | - | Memory types (question/decision/insight), tags, thought threads, similar questions prompt |
| **M3: Phase 4** | 📝 Deferred | 0/7 | 17h | - | - | Provenance, debugger, export |
| **M5: Cognitive** | 📝 Deferred | 0/8 | 36h | - | - | Living docs, knowledge graph |

*Dec 1, 2025: M3.6 Cognitive Memory integrated from cognitive memory research. 32 tasks across 5 sprints.*

### Sprint Velocity History

```
Sprint        │ Tasks │ Est (h) │ Actual │ Variance │ Status
──────────────┼───────┼─────────┼────────┼──────────┼────────
V1-01         │   6   │    8    │    8   │    0%    │ ✅
V1-02         │  10   │   10    │    8   │  -20%    │ ✅
M2-01         │  18   │   28    │   26   │   -7%    │ ✅
M3-01         │   4   │   10    │  4.5   │  -55%    │ ✅
M3-02         │  12   │   16    │    4   │  -75%    │ ✅
M3-03         │   7   │   15    │   16   │   +7%    │ ✅
M3-03.1       │   7   │  3.5    │  3.5   │    0%    │ ✅
Mobile v1.3.0 │  10   │    4    │    4   │    0%    │ ✅
M4-01         │  10   │ 25.5    │   10   │  -61%    │ ✅
M3.6-01       │   7   │  15     │    9   │  -40%    │ ✅ Complete
M3.7-01       │  11   │  13     │  3.9   │  -70%    │ ✅ Complete
M3.8-01       │  19   │  16     │   ~8   │  -50%    │ ✅ Complete
──────────────┼───────┼─────────┼────────┼──────────┼────────
TOTALS        │ 126   │ 173h    │ 111h   │  -36%    │ 72% ✅
```

**Average Velocity:** 30% faster than estimated

### Feature Capability Matrix

| Capability | Status | Milestone | Notes |
|------------|--------|-----------|-------|
| **Chat Persistence** | ✅ Live | M1 | Messages saved to Supabase |
| **Project Organization** | ✅ Live | M1 | Projects with file uploads |
| **Multi-Model Support** | ✅ Live | M1 | GPT, Claude, Gemini, Deepseek |
| **Context Compression** | ✅ Live | M1 | Auto-compress when >90% |
| **Web Search** | ✅ Live | M1 | Perplexity integration |
| **File Upload & RAG** | ✅ Live | M2 | Markdown files, 10MB max |
| **Custom Instructions** | ✅ Live | M2 | Per-project system prompts |
| **Hybrid Search** | ✅ Live | M2 | Vector + full-text (pgvector) |
| **Inline Citations** | ✅ Live | M2 | Perplexity-style [1], [2] |
| **User Profile** | ✅ Live | M3 | Bio, background, preferences |
| **Auto Memory Extraction** | ✅ Live | M3 | Gemini 2.5 Flash Lite |
| **Memory UI** | ✅ Live | M3 | Browse, edit, delete memories |
| **6 Memory Categories** | ✅ Live | M3 | Work, personal, top-of-mind, etc |
| **Chat Management** | ✅ Live | M3.1 | Rename, move, delete via context menu |
| **Streaming UX (typewriter/fade)** | ✅ Live | M3.1 | ResponseStream animation for assistant replies |
| **Mobile Optimization** | ✅ Live | v1.3.0 | Drawer sidebar, footer bar |
| **Bobo Personality** | ✅ Live | v1.3.0 | Identity responses |
| **Agent Mode** | ✅ Live | M4 | Claude-only agentic capabilities |
| **File Read/Write** | ✅ Live | M4 | Read, Edit, Write tools |
| **Code Search** | ✅ Live | M4 | Grep, Glob tools |
| **Bash Execution** | ✅ Live | M4 | With safety hooks |
| **Tool Confirmation** | ✅ Live | M4 | Diff preview for edits |
| **Safety Hooks** | ✅ Live | M4 | Blocked patterns, protected files |
| **Agent Memory Tools** | ✅ Live | M3.5 | remember_fact, search_memory (update/forget backend only) |
| **Embedding Backfill** | ✅ Live | M3.5 | 100% coverage (50/50 entries) |
| **Hybrid Memory Search** | ✅ Live | M3.5 | 70% vector + 30% BM25 text search |
| **Enhanced Memory Search** | ✅ Live | M3.6 | 5-component temporal weighting (vector/text/recency/freq/confidence) |
| **Importance Weighting** | ✅ Live | M3.6 | Category-based salience (red flags=0.9) |
| **Recency Decay** | ✅ Live | M3.6 | Ebbinghaus curve with 45-day half-life |
| **Bulk Memory Seeding** | ✅ Live | M3.6 | `/api/memory/bulk` with deduplication |
| **Hebbian Reinforcement** | ✅ Live | M3.6 | Duplicate mentions strengthen existing memories |
| **Context-Aware Search** | ✅ Live | M3.6 | Conversation context influences memory retrieval |
| **Auto Tool Selection** | ✅ Live | M3.7 | Intent classification + pre-flight knowledge search |
| **Advisory File Search** | ✅ Live | M3.7 | 43 deal/client files with hybrid search |
| **Advisory File Access** | ✅ Live | M3.7 | Deals/ + Clients/ in advisory/ folder |
| **Manual Indexing** | ✅ Live | M3.7 | `npm run index-advisory` for embeddings |
| **Repository Consolidation** | ✅ Live | M3.7 | Blog Migration consolidated into Bobo |
| **Project-per-Deal** | ✅ Live | M3.8 | Each deal/client gets dedicated project |
| **File-Reference Mode** | ✅ Live | M3.8 | Projects read from advisory/ folder (always current) |
| **AI Deal Summaries** | ✅ Live | M3.8 | Auto-generated custom_instructions from master docs |
| **Entity Type Badges** | ✅ Live | M3.8 | Deal/Client/Personal project classification |
| **Advisory-Memory Link** | 📝 Planned | M3.9 | Bidirectional relationship between files and memories |
| **Entity Relationship Extraction** | 📝 Planned | M3.10 | Extract people, companies, deals from advisory files |
| **Spreading Activation Search** | 📝 Planned | M3.10 | Graph traversal to surface related entities |
| **Agent Self-Learning** | 📝 Planned | M3.10 | Claude records user preference observations |
| **Knowledge Graph (PAPR-inspired)** | 📝 Planned | M3.10 | Entity relationships + multi-hop queries |
| **Memory Types (Thinking Capture)** | 📝 Planned | M3.13 | question/decision/insight as first-class types |
| **Tags for Emergent Domains** | 📝 Planned | M3.13 | TEXT[] array, no clustering algorithm needed |
| **Thought Threads** | 📝 Planned | M3.13 | Link related thinking across time |
| **Similar Questions Prompt** | 📝 Planned | M3.13 | Surface past questions when new question asked |
| **Memory Provenance** | 📝 Planned | M3-04 | Source chat tracking |
| **Memory Debugger** | 📝 Planned | M3-04 | "What was injected?" view |
| **Description-Driven Extraction** | 📝 Planned | M3-04 | Letta-inspired guidance fields |
| **Async Memory Extraction** | 📝 Planned | M3-04 | Non-blocking background processing |
| **Living Documentation** | 📝 Deferred | M5 | Auto-updating project docs |
| **Multi-User Auth** | 📝 Not Planned | Future | OAuth, if SaaS pivot |

### Next Priorities

```
✅ COMPLETED (Nov 29, 2025)
├─ M3.5: Agent Memory Tools ✅ DONE
│  ├─ ✅ remember_fact tool (real-time memory capture)
│  ├─ ✅ search_memory tool (hybrid search)
│  ├─ ✅ update_memory backend (UI deferred)
│  ├─ ✅ forget_memory backend (UI deferred)
│  ├─ ✅ Embedding backfill (100% coverage)
│  └─ ✅ Build error fix (client/server separation)
│
🟡 IN PROGRESS: M3.6 Cognitive Memory (79h remaining, 4 sprints)
├─ Sprint 1: Cognitive Foundation ✅ COMPLETE (Dec 7)
│  ├─ ✅ REQ-001: Temporal columns (last_accessed, access_count) - Done Dec 4
│  ├─ ✅ REQ-009: Enhanced search with Ebbinghaus decay - Done Dec 6
│  ├─ ✅ REQ-010: Update access metrics function - Done Dec 4
│  ├─ ✅ REQ-013: Hebbian reinforcement (strengthen duplicates) - Done Dec 7
│  ├─ ✅ REQ-014: Context-aware search (conversation context) - Done Dec 7
│  ├─ ✅ REQ-023: API updates for new fields + Bulk API - Done Dec 6
│  └─ ✅ REQ-002: Importance column - Done Dec 6 (pulled from Sprint 3)
│
├─ Sprint 2: Memory Safety (8-10h)
│  ├─ AUDIT-006: Confirmation dialogs (update/forget)
│  └─ AUDIT-001: Token budget enforcement (500 tokens)
│
├─ Sprint 3: Memory Graph Foundation (12-15h)
│  ├─ REQ-007: memory_relationships table
│  ├─ REQ-011: Spreading activation search
│  ├─ REQ-012: Build edges function
│  └─ REQ-003/004/008: Memory type + bi-temporal columns
│
├─ Sprint 4: Consolidation (15-20h)
│  ├─ REQ-017: Consolidation cron job
│  ├─ REQ-018: Consolidation logging table
│  └─ REQ-019: Verification layer (hallucination prevention)
│
└─ Sprint 5: M3 Phase 4 Completion (15h)
   ├─ AUDIT-002: Conflict resolution UI
   ├─ AUDIT-003: Memory debugger
   ├─ AUDIT-004: Provenance UI
   └─ AUDIT-005: Description-driven extraction
│
✅ COMPLETE: M3.7 Repository Consolidation (Dec 7)
├─ 11/11 tasks in 3.9h (70% faster than estimate)
├─ 43 advisory files indexed with embeddings
├─ search_advisory tool + intent classifier
└─ Pre-flight knowledge search operational
│
✅ COMPLETE: M3.8 Advisory Project Integration (Dec 7)
├─ 19/19 tasks complete
├─ Project-per-deal system operational
├─ File-reference mode (reads from disk, always current)
├─ AI-generated deal summaries as custom_instructions
└─ Entity type badges in project list
│
🐕 DOGFOODING PHASE (Dec 7+)
├─ Database cleaned, fresh start
├─ All advisory infrastructure operational
├─ Cognitive memory foundations (M3.6 Sprint 1) active
└─ Validating real-world usage before friends testing
│
📝 PLANNED: M3.9 Advisory-Memory Integration (15h)
├─ Close the loop between advisory files and cognitive memory
├─ Memory entries track source advisory file
├─ Cross-reference: "See MyTab master doc for details"
└─ Learnings from chats suggest advisory updates
│
📝 PLANNED: M3.10 PAPR-Inspired Knowledge Graph (28.5h) - NEW Dec 8
├─ Research source: PAPR AI (STaRK benchmark #1)
├─ Sprint 1: Entity extraction from advisory files (9h)
│  ├─ entity_relationships table
│  ├─ Claude extraction prompt (people, companies, deals)
│  └─ Auto-extract on indexing
├─ Sprint 2: Spreading activation search (8h)
│  ├─ Graph traversal (1-hop, 2-hop)
│  └─ Boost related entities in search results
├─ Sprint 3: Agent self-learning memory (6h)
│  ├─ learn_preference tool
│  └─ Agent-inferred memories with faster decay
└─ Sprint 4 (Optional): Context pre-fetching (5.5h)
│
LATER (After Dogfooding)
├─ M3.6 Sprints 2-5: Memory Safety, Graph, Consolidation
├─ M5: Cognitive Layer (Living docs, knowledge graph)
│
MAYBE (If SaaS Pivot)
└─ Future: Production features
```

> **Source:** All M3.6 requirements extracted from `/docs/COGNITIVE_MEMORY_REQUIREMENTS.md`
> **Research:** Neuroscience-inspired memory (Ebbinghaus forgetting curve, Hebbian learning, CLS theory)

---

## 📊 Backlog Priority Matrix

```
Agent SDK (M4) ✅ → M3.5 ✅ → M3.6 → M3.9 → M3.13 → M3.10 (if needed) → M3 Phase 4 → M5 → Future
                           ─────────────────────────────────────
                           📝 NEXT (Dec 2025 - Q1 2026)
                           ~123h across milestones
                           M3.6: Neuroscience-inspired memory (64h)
                           M3.9: Advisory-memory integration (15h)
                           M3.13: Thinking Partner Foundation (15h) ← NEW - DO THIS BEFORE M3.10
                           M3.10: PAPR-inspired knowledge graph (28.5h) ← ONLY IF NEEDED after M3.13
```

---

## 🧪 LETTA SDK LEARNINGS (Competitive Analysis - Nov 27, 2025)

**Source:** [Letta AI Memory SDK](https://github.com/letta-ai/ai-memory-sdk)
**Analysis:** Deep-dive comparison of Letta's memory architecture vs Bobo's implementation

### Executive Summary

| Dimension | Letta SDK | Bobo (Current) | Verdict |
|-----------|-----------|----------------|---------|
| Memory Structure | Labeled blocks with descriptions | 6 hierarchical categories | **Bobo ahead** |
| Self-Editing Memory | Agent tools (append, replace, rethink) | Passive extraction only | **Letta ahead** |
| Retrieval | Pure vector (cosine) | Hybrid (70% vector + 30% BM25) | **Bobo ahead** |
| Cross-Project | Per-subject isolation | Double-Loop with Loop B | **Bobo ahead** |
| Async Processing | Background "sleeptime agent" | Synchronous extraction | **Letta ahead** |
| Token Transparency | Opaque/server-side | Real-time tracking with segments | **Bobo ahead** |
| Citations | None | Perplexity-style inline [1], [2] | **Bobo ahead** |

### What to ADOPT from Letta

#### 1. Self-Editing Memory via Agent Tools 🔴 HIGH PRIORITY
**Gap:** Bobo's memory extraction is passive (runs after chat). Letta agents can modify memory in real-time during conversation.

**Benefit:** User corrections captured immediately; agent decides what's worth remembering in-the-moment.

#### 2. Description-Driven Memory Blocks 🟡 MEDIUM PRIORITY
**Gap:** Bobo categories have implicit meanings. Letta blocks have explicit `description` fields that guide extraction.

**Benefit:** Better extraction accuracy; categories become self-documenting.

#### 3. Async Memory Processing 🟡 MEDIUM PRIORITY
**Gap:** Bobo extraction blocks chat API response. Letta fires-and-forgets to background.

**Benefit:** Faster response times; non-blocking UX.

### What to KEEP (Bobo Advantages)

| Feature | Why Keep |
|---------|----------|
| **Hybrid Search (RRF)** | Catches keyword matches that pure semantic misses |
| **Cross-Project RAG (Loop B)** | Key differentiator - enables learning across projects |
| **Inline Citations** | Trust and transparency - Letta has none |
| **Model-Specific Caching** | Anthropic/Gemini optimizations for cost/speed |
| **Transparent Token Tracking** | Developer experience - know exactly what's happening |

### What to SKIP from Letta

| Feature | Why Skip |
|---------|----------|
| Subject isolation model | Bobo's cross-project is a differentiator |
| Pure vector search | Keep hybrid RRF for better recall |
| Opaque token management | Keep transparency |
| Vercel AI SDK Provider wrapper | Direct SDK integration works fine |

### Implementation Priority (UPDATED Nov 27, 2025)

| Phase | Tasks | Effort | Timeline | Status |
|-------|-------|--------|----------|--------|
| **Sprint 1** | M3.5 Agent Memory Tools (7 tasks) | 28h | Nov 28 - Dec 8 | 🚧 ACTIVE |
| **Sprint 2** | M3 Phase 4 + description-driven extraction | 17h | Jan 2026 | 📝 Planned |
| **Sprint 3** | M5 Cognitive Layer | 36h | Pain-driven | 📝 Deferred |

> **Sequencing Change:** M3.5 moved BEFORE Phase 4. Agent mode (M4) delivered on Day 1 but can't self-edit memory. User says "Remember that I moved to London" and agent responds "I'll remember that!" but actually does nothing. This trust gap undermines M4's value proposition. M3.5 fixes this.

---

## 🎯 V1 CRITICAL PATH (Milestone 1 - Must Ship)

**Goal:** Replace all mock data, ship working persistence layer
**Target:** Complete within 6-8 hours
**Status:** ✅ Complete (see PROGRESS_TRACKER.md)

### Frontend Integration Tasks

| ID | Task | Priority | Estimate | Status | Assignee | Notes |
|----|------|----------|----------|--------|----------|-------|
| V1-1 | Replace mock data in sidebar | 🔴 CRITICAL | 2-3h | ✅ Done | TBD | Fetch projects/chats from API |
| V1-2 | Replace mock data in project page | 🔴 CRITICAL | 1h | ✅ Done | TBD | Use `/api/projects/[id]` |
| V1-3 | Create project creation modal | 🔴 CRITICAL | 1h | ✅ Done | TBD | POST to `/api/projects` |
| V1-4 | Add loading states (skeletons) | 🟡 HIGH | 1h | ✅ Done | TBD | Better UX during fetch |
| V1-5 | Add error boundary | 🟡 HIGH | 30m | ✅ Done | TBD | Graceful error handling |
| V1-6 | End-to-end testing | 🟠 MEDIUM | 1h | ✅ Done | TBD | Manual testing flow |

**V1 Definition of Done:**
- ✅ User creates project → persists after refresh
- ✅ User sends message → saved to database (DONE)
- ✅ User returns → sees full chat history (DONE)
- ✅ User moves chat → association updates
- ✅ Zero mock data in codebase
- ✅ No console errors in production build

---

## 🗂️ DEFERRED ITEMS (Post-V1 Polish)

**Items that were considered but deemed non-critical for V1 launch**

### Technical Debt & Code Quality

| ID | Item | Category | Priority | Effort | Rationale for Deferral |
|----|------|----------|----------|--------|------------------------|
| TD-1 | Reduce verbose logging in `/api/chat` | Code Quality | 🟢 LOW | 30m | Developer-only impact, not user-facing |
| TD-2 | Add tool/source parsing for OpenAI models | Feature Enhancement | 🟡 MEDIUM | 2-3h | Covered in M2 (RAG), works for non-OpenAI models |
| TD-3 | Add unit tests for `lib/db/queries.ts` | Testing | 🟢 LOW | 3-4h | Manual testing sufficient for V1 |
| TD-4 | Performance optimization (query caching) | Performance | 🟢 LOW | 2-3h | Premature optimization, no scale issues yet |
| TD-5 | Bundle size analysis and optimization | Performance | 🟢 LOW | 2h | Not blocking V1 launch |
| TD-6 | Precise tokenization with WASM tiktoken | Performance | 🟡 MEDIUM | 3h | Current heuristic fallback sufficient for V1 |
| TD-7 | Background/async compression | Performance | 🟡 MEDIUM | 2-3h | ✅ DONE (v1.2.0) |
| TD-8 | Chat history state synchronization (viewport bug) | Code Quality | 🟢 DONE | 3-4h | Fixed: single ChatInterface mount + guarded history loads |
| TD-9 | Proper Next.js router usage for chat ID updates | Code Quality | 🟢 DONE | 1h | Uses Next.js router replace for chatId sync |
| TD-10 | Add E2E tests for chat creation flow | Testing | 🟡 HIGH | 6-8h | ✅ DONE (v1.2.0) |

### TD-1: Verbose Logging Cleanup

**Description:**
Currently `/api/chat/route.ts` logs every step of the request flow:
```
[api/chat] Request received
[api/chat] Processing message...
[api/chat] Streaming text with model: openai/gpt-4o
[api/chat] Stream created successfully
[api/chat] Message saved to database
```

**Action Items:**
1. Remove debug logs from production builds
2. Add environment-based logging (`NODE_ENV === 'development'`)
3. Keep only error logs and critical events

**Estimated Effort:** 30 minutes
**Assigned To:** Post-V1 cleanup
**Milestone:** Post-Launch Polish

---

### TD-2: OpenAI Tool/Source Parsing

**Description:**
The custom OpenAI streaming path (bypassing AI SDK) currently handles:
- ✅ Text parts
- ✅ Reasoning parts (for GPT-5.1 Thinking)
- ❌ Tool call results (not parsed)
- ❌ Source citations (not surfaced to UI)

**Why Deferred:**
- Not needed for basic chat functionality
- File upload/RAG (which needs sources) is Milestone 2
- Non-OpenAI models already support sources via AI SDK
- Adds complexity to dual-path architecture

**Action Items:**
1. Parse `tool_calls` from OpenAI SSE stream
2. Parse `function` results
3. Convert to UIMessage `tool-result` parts
4. Add UI components to display tool usage

**Estimated Effort:** 2-3 hours
**Assigned To:** Milestone 2 (RAG Pipeline)
**Milestone:** M2 - Project Intelligence
**Dependencies:** File upload system, source citation UI

---

### TD-6: Precise Tokenization with WASM tiktoken

**Description:**
Current implementation uses `gpt-tokenizer` package with character-based heuristic fallback (text.length / 4) when tokenization fails. This is approximate but sufficient for V1.

**Current State:**
- ✅ Uses `gpt-tokenizer` with `encode()` for most cases
- ✅ Fallback heuristic for edge cases
- ✅ Accurate enough for context monitoring (within 10-15% margin)
- ❌ Not exact for billing/cost tracking
- ❌ Doesn't cache token counts (recomputes every render)

**Why Deferred:**
- Current system works well for context management
- User doesn't notice 10-15% margin of error
- No billing/cost features in V1
- Optimization would add complexity without user benefit

**Action Items (V2+):**
1. Adopt WASM-based `tiktoken` or equivalent for exact counts
2. Implement token count caching per message (avoid recomputation)
3. Add cost estimation per model based on exact tokens
4. Display precise token breakdown in debug mode

**Estimated Effort:** 3 hours
**Assigned To:** Post-V1 optimization
**Milestone:** V2 - Performance & Polish
**Related:** Context tracking, cost analytics

---

### TD-7: Background/Async Compression

**Description:**
Currently compression is triggered synchronously when user submits a message and context usage is >90%. This briefly blocks the submit action with "Compressing history..." indicator.

**Current State:**
- ✅ Compression works correctly
- ✅ User sees feedback ("Compressing history...")
- ✅ Only takes 1-2 seconds typically
- ⚠️ Blocks user from sending next message during compression
- ❌ No background processing
- ❌ No timestamp/history of compressions

**Why Deferred:**
- Current UX is acceptable (1-2 second delay)
- Happens infrequently (every 50+ messages)
- More important to ship V1 than optimize edge case
- Background jobs add infrastructure complexity

**Action Items (V2+):**
1. Run compression right after assistant response (not on submit)
2. Process in background (no blocking)
3. Add UI status indicator: "History compressed at 12:05 PM"
4. Store compression events in database for history
5. Allow re-expansion when switching to high-context models

**Estimated Effort:** 2-3 hours
**Assigned To:** Post-V1 UX polish
**Milestone:** V2 - Performance & Polish
**Related:** Context management, memory compression

---

### TD-8: Chat History State Synchronization (Viewport Disappearing Bug)

**Status:** ✅ Resolved (Nov 23, 2025)

**What changed:**
- Keep a single `ChatInterface` mounted in project view and hide the project header/list when a `chatId` is active (prevents remount wipe).
- Guard history loading with streaming/persistence flags (`status`, `justSubmittedRef`, `messages.length`) and a 1.5s DB persistence window.
- Sync `chatId` via Next.js router and local state without reloading mid-stream.

**Remaining follow-ups (still recommended):**
1. Implement intelligent history merging instead of overwrite when loading persisted messages.
2. Add E2E test for “send first message in new chat” (project + main) to prevent regressions.

**Related:** TD-10 (tests)

---

### TD-9: Proper Next.js Router Usage for Chat ID Updates

**Status:** ✅ Resolved (Nov 23, 2025)

**What changed:**
- Replaced `window.history.replaceState` with `router.replace` for `chatId` updates in `ChatInterface`, keeping `useSearchParams` in sync.
- Added guarded `chatId` syncing effect so URL navigation does not reload mid-stream.

**Residual risk:** Minimal; monitor navigation/back-forward behavior during E2E (TD-10).

---

### TD-10: Add E2E Tests for Chat Creation Flow

**Description:**
The viewport disappearing bug (TD-8) went undetected because we lack automated tests for the critical "create first chat" user flow. We need comprehensive E2E tests to prevent regressions.

**Critical Flows to Test:**

1. **New Chat Creation (Main Page)**
   - User sends first message from home page
   - Chat is created in backend
   - URL updates with chatId
   - Message streams correctly
   - **Viewport doesn't disappear during streaming** ← TD-8 regression test
   - Message persists after refresh

2. **Project Chat Creation**
   - User creates project
   - User sends first message in project view
   - Chat is created and associates with project
   - **Viewport doesn't disappear during streaming** ← TD-8 regression test
   - Chat appears in project's chat list
   - Project appears in sidebar

3. **Chat Persistence & History Loading**
   - User creates chat with multiple messages
   - User refreshes page
   - All messages load correctly
   - Scroll position maintained

4. **Stop Button During Streaming**
   - User sends message
   - User clicks stop button mid-stream
   - Streaming stops immediately
   - Partial response is saved

**Testing Framework Options:**
- Playwright (recommended - already have test recording from user)
- Cypress
- Puppeteer

**Implementation Plan:**
1. Set up Playwright in project
2. Convert user's Lighthouse recording to Playwright test
3. Add assertions for viewport visibility
4. Add database state checks
5. Run in CI/CD pipeline

**Success Criteria:**
- All critical flows pass
- Tests run in <2 minutes
- Run on every PR
- Catch TD-8 type bugs before they ship

**Estimated Effort:** 6-8 hours
**Assigned To:** Post-V1 QA sprint
**Milestone:** V2 - Testing & Quality
**Related:** TD-8 (viewport bug), TD-3 (unit tests)
**Priority:** 🟡 HIGH (prevents regressions)
**Filed:** 2025-01-23 (from senior engineering review)

---

## 📝 MILESTONE 2: Project Intelligence (Double-Loop Architecture)

**Status:** ✅ Complete
**Target Start:** Jan 2025
**Target End:** Feb 2025
**Strategy:** Implement "Double-Loop" architecture: Context Caching for active project (Loop A) + Hybrid RAG for global context (Loop B).

### 2.1 Custom Instructions (Phase 1 - Complete ✅)

| ID | Feature | Priority | Estimate | Status |
|----|---------|----------|----------|--------|
| M2-1 | Add `custom_instructions` column to projects | 🔴 HIGH | 1h | ✅ Done |
| M2-2 | Project settings page UI | 🔴 HIGH | 2h | ✅ Done |
| M2-3 | Inject instructions into chat system prompt | 🔴 HIGH | 1h | ✅ Done |

### 2.2 File Upload & Storage (Phase 2 - Complete ✅)

| ID | Feature | Priority | Estimate | Status |
|----|---------|----------|----------|--------|
| M2-4 | Create `project_files` table | 🔴 HIGH | 1h | ✅ Done |
| M2-5 | POST `/api/projects/[id]/files` endpoint | 🔴 HIGH | 2h | ✅ Done |
| M2-6 | File validation (.md, max 10MB) | 🔴 HIGH | 1h | ✅ Done |
| M2-7 | File management UI (upload, delete, preview) | 🔴 HIGH | 3h | ✅ Done |

### 2.3 Loop A: Project Context (Context Caching)

**Goal:** Use Anthropic's Prompt Caching to pin full project context into memory, avoiding RAG fragmentation for active work.

| ID | Feature | Priority | Estimate | Status |
|----|---------|----------|----------|--------|
| M2-8 | Implement `getProjectFiles` utility | 🔴 HIGH | 1h | ⏳ |
| M2-9 | Implement Context Caching (Anthropic & Gemini) | 🔴 HIGH | 3h | ⏳ |
| M2-10 | Implement Token Budget Manager for Caching | 🟡 MEDIUM | 2h | ⏳ |
| M2-11 | Standard Context Injection (OpenAI/Others) | 🔴 HIGH | 2h | ⏳ |

### 2.4 Loop B: Global Context (Hybrid RAG)

**Goal:** Weighted search across ALL projects to find patterns and inspiration.

| ID | Feature | Priority | Estimate | Status |
|----|---------|----------|----------|--------|
| M2-12 | Enable `pgvector` extension in Supabase | 🔴 HIGH | 30m | ✅ Done |
| M2-13 | Add `embedding` columns to files/messages | 🔴 HIGH | 30m | ✅ Done |
| M2-14 | Implement `hybrid_search` RPC function | 🔴 HIGH | 1h | ✅ Done |
| M2-15 | Build embedding generation pipeline (OpenAI) | 🔴 HIGH | 3h | ✅ Done |
| M2-16 | Integrate "Inspiration" section into System Prompt | 🔴 HIGH | 1h | ✅ Done |

### 2.5 Source Citations & UI

| ID | Feature | Priority | Estimate | Status |
|----|---------|----------|----------|--------|
| M2-17 | Return source metadata in responses | 🔴 HIGH | 2h | ✅ Done |
| M2-18 | Display "Used Project Files" vs "Global Inspiration" | 🔴 HIGH | 2h | ✅ Done |

**Total M2 Tasks:** 18 (100% Complete)
**Estimated Effort:** 2-3 weeks

---

## 🧠 MILESTONE 3: User Profile & Bio Memory (Q1 2026)

**Status:** 🚧 In Progress (Phases 1, 2, 3 & 3.1 Complete, Phase 4 Planned)
**Target Start:** November 24, 2025
**Target End:** December 21, 2025 (4 weeks across 4 sprints)
**Tasks Completed:** 22 of 28 (79% complete)
**Hours Actual:** 26h (Phase 1: 4.5h, Phase 2: 4h, Phase 3: 16h, Phase 3.1: 3.5h)
**Hours Remaining:** ~13h (Phase 4: 13h estimate)
**Focus:** Three-layer memory architecture combining manual user profile (Layer 1), automatic hierarchical memory extraction (Layer 2), and project context (Layer 3 from M2).
**Architecture:** Hybrid approach inspired by Claude's hierarchical memory and Gemini's personal context, using Gemini 2.5 Flash Lite for extraction (56% cheaper than GPT-4o-mini).
**Architecture Note:** See `docs/context-memory-vision.md` for conceptual design and `docs/memory-schema.md` for complete technical specification.

### 3.1 Phase 1: Personal Context Foundation ✅ COMPLETE

**Sprint:** M3-01 (Nov 24-30, 2025)
**Status:** ✅ Complete (4.5 hours, 55% under estimate)
**Goal:** Manual "About You" profile with system prompt injection

| ID | Feature | Priority | Estimate | Status | Actual | Notes |
|----|---------|----------|----------|--------|--------|-------|
| M3-11 | Personal context profile schema (bio, background, key facts) | 🔴 HIGH | 2h | ✅ Done | 1h | Migration + types |
| M3-12 | "About You" settings UI + form fields | 🔴 HIGH | 3h | ✅ Done | 2h | /settings/profile page |
| M3-13 | Inject personal context into system prompt | 🔴 HIGH | 3h | ✅ Done | 1h | Chat API route |
| M3-8 | Define memory schema & categories (documentation) | 🔴 HIGH | 2h | ✅ Done | 0.5h | memory-schema.md v2.0 |

**Deliverables:**
- ✅ `user_profiles` table with RLS policies
- ✅ `/settings/profile` page with 4 text fields
- ✅ GET/POST `/api/user/profile` endpoints
- ✅ System prompt injection: "### ABOUT THE USER"
- ✅ Memory schema v2.0 documentation with hierarchical categories

### 3.2 Phase 2: Hierarchical Memory Extraction ✅ COMPLETE

**Sprint:** M3-02 (Nov 24, 2025)
**Status:** ✅ 100% Complete (Migration Applied, Identity Backload Done)
**Goal:** Automatic Claude-style memory extraction with 6 hierarchical categories
**Actual Hours:** 4h (2h integration + 2h model optimization + identity backload)
**Build Status:** ✅ Passing
**Test Status:** ✅ 9/10 tests passing (90% pass rate)

| ID | Feature | Priority | Estimate | Actual | Status |
|----|---------|----------|----------|--------|--------|
| M3-17 | Create `memory_entries` table with hierarchical categories | 🔴 HIGH | 2h | 0.5h | ✅ Done |
| M3-18 | Implement extraction pipeline (Gemini 2.5 Flash Lite) | 🔴 HIGH | 4h | 0h | ✅ Done (pre-existing) |
| M3-19 | Background job to extract from completed chats | 🔴 HIGH | 3h | 0h | ✅ Done (pre-existing) |
| M3-20 | Deduplication logic (content_hash + fuzzy matching) | 🔴 HIGH | 2h | 0h | ✅ Done (pre-existing) |
| M3-21 | Inject hierarchical memory into system prompt | 🔴 HIGH | 2h | 0h | ✅ Done (pre-existing) |
| M3-22 | Weekly consolidation process (merge duplicates, archive low-relevance) | 🟡 MEDIUM | 3h | 0h | ✅ Done (pre-existing) |
| NEW | Memory settings initialization | 🔴 HIGH | - | 0.5h | ✅ Done |
| NEW | Vercel cron configuration | 🔴 HIGH | - | 0.5h | ✅ Done |
| NEW | Type safety fixes (MemorySettingsInsert) | 🟡 MEDIUM | - | 0.5h | ✅ Done |
| NEW | Model optimization: GPT-4o-mini → Gemini 2.5 Flash Lite | 🔴 HIGH | - | 1h | ✅ Done |
| NEW | Identity backload: 25 memory entries for user Sachee | 🔴 HIGH | - | 1h | ✅ Done |
| NEW | RLS policy fixes for single-user MVP | 🔴 HIGH | - | 0.5h | ✅ Done |

**Total Estimated:** 16 hours
**Total Actual:** 4 hours (75% faster than estimated!)

**Key Achievement:** Discovered that 95% of extraction system was already implemented in codebase, only needed integration, model optimization, and identity backload.

**Model Optimization:**
- **Before:** GPT-4o-mini ($0.15/$0.60 per 1M tokens)
- **After:** Gemini 2.5 Flash Lite ($0.0375/$0.15 per 1M tokens)
- **Cost Reduction:** 56% cheaper (4x reduction on input, 4x on output)
- **Performance:** Comparable quality, faster response times
- **Rationale:** Memory extraction is high-frequency, cost-sensitive operation

**Identity Backload:**
- ✅ 25 memory entries manually created for user "Sachee"
- ✅ Covers work_context, personal_context, top_of_mind, brief_history, long_term_background
- ✅ Realistic test data for dogfooding and UX validation
- ✅ Confidence scores: 1.0 (stated facts from user profile)

**RLS Policy Fixes:**
- ✅ Single-user MVP security model implemented
- ✅ Permissive RLS policies + anon role access (temporary for MVP)
- ⚠️ MUST be reverted for M4 multi-user (see M4-4: Row-level security)
- ✅ Frontend now has full read/write access to memory system

**Deliverables:**
- ✅ Database migration applied (memory_entries, memory_settings, memory_suggestions tables)
- ✅ Gemini 2.5 Flash Lite extraction pipeline with 6 categories
- ✅ Deduplication system (exact + fuzzy matching via Levenshtein distance)
- ✅ Memory injection into chat context (system prompt)
- ✅ Extraction trigger (automatic after each chat via /api/memory/extract)
- ✅ Memory settings initialization with sane defaults
- ✅ Weekly consolidation cron job (Vercel cron)
- ✅ CRON_SECRET security for cron endpoints
- ✅ Test suite: 9/10 tests passing (extraction, deduplication, injection, RLS)
- ✅ Identity backload with 25 realistic memory entries
- ✅ Comprehensive documentation (ACTIVITY_OVERVIEW.md)

**Testing Results:**
- ✅ Memory extraction: PASS
- ✅ Deduplication (exact match): PASS
- ✅ Deduplication (fuzzy match): PASS
- ✅ Memory injection into chat: PASS
- ✅ RLS policies (read access): PASS
- ✅ RLS policies (write access): PASS
- ✅ Hierarchical categories: PASS
- ✅ Confidence scoring: PASS
- ✅ Time period tagging: PASS
- ❌ Edge case: Empty chat extraction (minor bug, non-blocking)

**Next Phase:** M3-04 (Advanced Features) - Provenance tracking, debugger, export

**Schema:**
```sql
CREATE TABLE memory_entries (
  category TEXT CHECK (category IN (
    'work_context', 'personal_context', 'top_of_mind',
    'brief_history', 'long_term_background', 'other_instructions'
  )),
  subcategory TEXT,  -- e.g. 'recent_months', 'earlier', 'long_term'
  content TEXT,
  confidence FLOAT,  -- 0.9-1.0 (stated), 0.7-0.8 (implied), 0.5-0.6 (inferred)
  source_chat_ids UUID[],
  time_period TEXT,  -- 'current', 'recent', 'past', 'long_ago'
  relevance_score FLOAT,  -- Temporal decay
  ...
);
```

**Extraction Categories:**
1. **work_context** - Current role, expertise, active projects, work preferences
2. **personal_context** - Location, family, hobbies, background, identity
3. **top_of_mind** - Current priorities, immediate focus (fast decay)
4. **brief_history** - Past experiences (3 subcategories: recent_months, earlier, long_term)
5. **long_term_background** - Education, career history, foundational facts
6. **other_instructions** - Misc preferences, communication style

**Total Estimate:** 16 hours

### 3.3 Phase 3: Claude-Style Memory UI ✅ COMPLETE

**Sprint:** M3-03 (Nov 24, 2025)
**Status:** ✅ Complete (16 hours actual, +1h over estimate due to bug fixes)
**Goal:** `/memory` page with hierarchical sections, edit/delete, and privacy controls

| ID | Feature | Priority | Estimate | Status | Actual | Notes |
|----|---------|----------|----------|--------|--------|-------|
| M3-5 | Memory management page (`/memory`) with hierarchical UI | 🔴 HIGH | 4h | ✅ Done | 4.5h | Main page + routing + bug fixes |
| M3-23 | Collapsible sections: Work Context, Personal Context, Top of Mind, Brief History | 🔴 HIGH | 3h | ✅ Done | 3h | Sections + localStorage persistence |
| M3-6 | Edit/delete specific memory entries | 🔴 HIGH | 2h | ✅ Done | 2.5h | Modals + API + validation |
| M3-24 | Memory suggestions UI ("We think you might be...") | 🟡 MEDIUM | 2h | ✅ Done | 2h | Suggestions component + API routes |
| M3-7 | Settings page: toggle auto-memory, set extraction frequency | 🔴 HIGH | 2h | ✅ Done | 2h | Settings modal with all controls |
| M3-25 | Privacy controls (per-category toggle, clear all) | 🔴 HIGH | 2h | ✅ Done | 2h | Privacy section + clear all dialog |

**UI Structure:**
```
┌─────────────────────────────────────┐
│ Your Memory                         │
├─────────────────────────────────────┤
│ > Work Context (3 memories)         │
│   - Current role: Full-stack dev... │
│   - Expertise: React, TypeScript... │
│                                     │
│ > Personal Context (5 memories)     │
│   - Location: San Francisco         │
│   - Family: Married, 2 kids         │
│                                     │
│ > Top of Mind (2 memories)          │
│   - Learning Rust                   │
│   - Building AI chatbot             │
│                                     │
│ > Brief History                     │
│   > Recent Months (4 memories)      │
│   > Earlier (6 memories)            │
│   > Long Term (3 memories)          │
└─────────────────────────────────────┘
```

**Total Estimate:** 15 hours

### 3.3.1 Post-Launch UX/UI Polish Sprint ✅ COMPLETE

**Sprint:** Nov 24, 2025 (Evening Session)
**Status:** ✅ Complete
**Goal:** Navigation consistency, mobile UX, chat management, bug fixes
**Actual Hours:** 3.5h
**Build Status:** ✅ Passing

| ID | Feature | Priority | Estimate | Actual | Status |
|----|---------|----------|----------|--------|--------|
| UX-1 | Sidebar consistency across all pages (/memory) | 🔴 HIGH | 30m | 30m | ✅ Done |
| UX-2 | Add Home navigation link to sidebar | 🔴 HIGH | 15m | 15m | ✅ Done |
| UX-3 | Remove non-functional Settings link | 🔴 HIGH | 5m | 5m | ✅ Done |
| UX-4 | Chat context menu (rename, move, delete, archive) | 🔴 HIGH | 1.5h | 1.5h | ✅ Done |
| UX-5 | Fix nested button hydration error in MemorySection | 🔴 CRITICAL | 15m | 15m | ✅ Done |
| UX-6 | Auto-refresh sidebar on chat creation | 🟡 MEDIUM | 30m | 30m | ✅ Done |
| UX-7 | Mobile auto-close sidebar after navigation | 🔴 HIGH | 30m | 30m | ✅ Done |

**Total Actual:** 3.5 hours

**Deliverables:**

**1. Sidebar Navigation Improvements**
- ✅ Wrapped `/memory` page with `BoboSidebarOptionA` layout for consistency
- ✅ Added explicit "Home" navigation link (IconHome)
- ✅ Removed broken Settings link that pointed to `#`
- ✅ Added "Memory" link to sidebar (IconBrain)
- ✅ Mobile sidebar already has hamburger menu (verified working)

**2. Chat Context Menu** (`components/chat/chat-context-menu.tsx`)
- ✅ Created comprehensive context menu component (350 lines)
- ✅ **Rename Chat:** Dialog with input validation, PATCH `/api/chats/[id]`
- ✅ **Move to Project:** Dropdown selector, PATCH `/api/chats/[id]/project`
- ✅ **Delete Chat:** Confirmation dialog, DELETE `/api/chats/[id]`, auto-redirect
- ✅ **Archive:** Placeholder (disabled, "Soon" badge)
- ✅ Toast notifications for all actions
- ✅ Auto-refresh sidebar after modifications
- ✅ Prevents default browser context menu with `onContextMenu={(e) => e.preventDefault()}`
- ✅ Integrated with sidebar chat items

**3. Hydration Error Fix**
- ✅ Fixed nested `<button>` in `<button>` error in `components/memory/memory-section.tsx`
- ✅ Restructured layout: CollapsibleTrigger button and Add button are now siblings in flex container
- ✅ Zero hydration warnings in console

**4. Auto-Refresh Sidebar**
- ✅ Added `useSearchParams` hook to monitor URL changes
- ✅ Added `useEffect` to watch for `chatId` parameter changes
- ✅ Debounced refresh (500ms) to prevent multiple rapid fetches
- ✅ Sidebar now updates automatically when new chat is created

**5. Mobile Navigation UX**
- ✅ Changed New Chat button from Link to button with `router.push()` + auto-close
- ✅ Added auto-close to chat items on mobile (< 768px)
- ✅ Added auto-close to project items on mobile
- ✅ Added auto-close to bottom navigation (Home, Memory, Profile)
- ✅ Native app-like experience with instant feedback
- ✅ Only affects mobile viewports (preserves desktop behavior)

**Files Modified:**
- `app/memory/page.tsx` - Wrapped with sidebar layout
- `components/ui/bobo-sidebar-option-a.tsx` - URL monitoring, mobile auto-close, navigation links
- `components/memory/memory-section.tsx` - Fixed nested button structure
- `components/chat/chat-context-menu.tsx` - New file (350 lines)

**Bug Fixes:**
1. ✅ Memory page missing sidebar
2. ✅ Settings link pointing to nowhere
3. ✅ Nested button hydration error
4. ✅ Sidebar not refreshing after chat creation
5. ✅ Slow mobile navigation (sidebar staying open)

**User Experience Improvements:**
- Consistent sidebar across all pages (Memory, Home, Profile)
- Clear navigation paths (Home link always visible)
- Right-click chat management (industry-standard UX)
- Mobile feels native (auto-close on navigation)
- Real-time sidebar updates (no manual refresh needed)

**Related Features Promoted from Nice-to-Have:**
- NTH-2: Rename chat ✅ Implemented via context menu
- NTH-3: Delete chat from sidebar ✅ Implemented via context menu
- Partial NTH-11: Archive placeholder created (backend pending)

**Next Steps:**
- M3-04: Advanced memory features (provenance, debugger, export)
- Complete archive backend implementation
- Consider adding project context menu (rename, delete, export)

### 3.4 Phase 4: Advanced Memory Features 📝 PLANNED

**Sprint:** M3-04 (Dec 15-21, 2025)
**Status:** 📝 Planned
**Goal:** Provenance tracking, debugging tools, polish, AND Letta-inspired enhancements

| ID | Feature | Priority | Estimate | Status | Source |
|----|---------|----------|----------|--------|--------|
| M3-27 | Token budget enforcement (500 tokens max) | 🔴 HIGH | 2h | ⏳ | Original |
| M3-9 | Conflict resolution UI (manual override vs auto-extracted) | 🔴 HIGH | 3h | ⏳ | Original |
| M3-31 | **Description-driven extraction guidance** | 🔴 HIGH | 3h | ⏳ | **Letta** |
| M3-26 | Memory provenance UI (show source chats) | 🟡 MEDIUM | 2h | ⏳ | Original |
| M3-10 | Memory debugger ("What was injected in this chat?") | 🟡 MEDIUM | 3h | ⏳ | Original |
| M3-28 | Export memory as JSON/Markdown | 🟡 MEDIUM | 2h | ⏳ | Original |
| M3-16 | Profile preview ("What AI sees" view) | 🟢 LOW | 1h | ⏳ | Original |

**Total Estimate:** 16 hours (+3h for Letta enhancement)

#### M3-31: Description-Driven Extraction Guidance (NEW - Letta Learning)

**What:** Add `extraction_guidance` field to memory categories that explicitly tells the extraction LLM what to look for and how to update each block.

**Why:** Letta's labeled blocks with descriptions produce more accurate extractions because the agent knows exactly what belongs in each section.

**Implementation:**
```sql
-- Add guidance column
ALTER TABLE memory_entries ADD COLUMN extraction_guidance TEXT;

-- Populate with category-specific guidance
UPDATE memory_entries SET extraction_guidance = CASE category
  WHEN 'work_context' THEN
    'Current role, company, expertise areas, active projects. Update when user mentions job changes or new responsibilities.'
  WHEN 'personal_context' THEN
    'Location, family, hobbies, identity. Update when user shares personal details. Be conservative - only store what is clearly stated.'
  WHEN 'top_of_mind' THEN
    'Immediate priorities, current focus, urgent concerns. High decay rate - replace frequently as priorities shift.'
  WHEN 'brief_history' THEN
    'Past experiences grouped by recency. Append new events, consolidate old. Subcategories: recent_months, earlier, long_term.'
  WHEN 'long_term_background' THEN
    'Education, career history, foundational life facts. Rarely changes - only update for major life events.'
  WHEN 'other_instructions' THEN
    'Communication preferences, formatting requests, recurring instructions. Update when user expresses preferences.'
END;
```

**Extraction Prompt Update:**
```typescript
const extractionPrompt = `
Extract memories into these categories. Follow the guidance for each:

${categories.map(c => `
### ${c.label.toUpperCase()}
Guidance: ${c.extraction_guidance}
Current entries: ${c.entries.length}
`).join('\n')}

For each extraction, determine:
1. Which category it belongs to (use guidance)
2. Confidence level (0.9-1.0 stated, 0.7-0.8 implied, 0.5-0.6 inferred)
3. Whether it updates, replaces, or adds to existing entries
`;
```

**Success Criteria:**
- [ ] All 6 categories have extraction guidance
- [ ] Extraction prompt uses guidance dynamically
- [ ] Extraction quality improves (fewer miscategorized entries)
- [ ] Categories are self-documenting in database

### 3.5 Phase 5: Agent Memory Tools (M3.5) 🚧 ACTIVE - LETTA INSPIRED

**Sprint:** M3.5-01 (Nov 28 - Dec 8, 2025) **← NOW ACTIVE**
**Status:** 🚧 In Progress (moved before Phase 4 per CPO review)
**Goal:** Enable agent to self-edit memory in real-time during conversations
**Source:** Letta AI Memory SDK competitive analysis (Nov 27, 2025)
**Rationale:** Biggest functional gap vs Letta. Passive extraction misses user corrections and in-the-moment insights. **Agent mode (M4) can't self-edit memory = trust gap.**
**Execution Guide:** [HANDOVER_M35-01.md](sprints/handover/HANDOVER_M35-01.md)

| ID | Feature | Priority | Estimate | Status | Notes |
|----|---------|----------|----------|--------|-------|
| M3.5-0 | `search_memory` agent tool | 🔴 HIGH | 3h | ⏳ | **NEW** - Prerequisite for update/forget |
| M3.5-1 | `remember_fact` agent tool | 🔴 HIGH | 3h | ⏳ | Real-time memory capture |
| M3.5-2 | `update_memory` agent tool | 🔴 HIGH | 5h | ⏳ | User corrections (revised +3h for search) |
| M3.5-3 | `forget_memory` agent tool | 🟡 MEDIUM | 3h | ⏳ | Graceful memory deletion (revised +1h) |
| M3.5-4 | Async extraction pipeline | 🟡 MEDIUM | 6h | ⏳ | Non-blocking background (revised +2h) |
| M3.5-5 | Memory tool error handling | 🟡 MEDIUM | 2h | ⏳ | **NEW** - Graceful failure recovery |
| M3.5-6 | Memory tool safety permissions | 🔴 HIGH | 2h | ⏳ | **NEW** - Confirmation dialogs for destructive ops |

**Total Estimate:** 28 hours (revised from 11h based on implementation gap analysis)

#### Why Estimates Increased (+17h)

| Task | Original | Revised | Reason |
|------|----------|---------|--------|
| M3.5-0 | N/A | 3h | NEW: Agent needs to find memories before updating |
| M3.5-2 | 2h | 5h | Needs memory search + conflict handling |
| M3.5-3 | 2h | 3h | Needs search logic to find target memory |
| M3.5-4 | 4h | 6h | Edge cases, race conditions, testing |
| M3.5-5 | N/A | 2h | NEW: Error recovery prevents chat crashes |
| M3.5-6 | N/A | 2h | NEW: Safety hooks for destructive operations |

#### M3.5-0: `search_memory` Agent Tool (NEW)

**What:** Tool to search user's memories by category, keywords, or recency. **Critical prerequisite** for M3.5-2 and M3.5-3.

**Why:** `update_memory` and `forget_memory` need to discover which memory to modify. Without search, agent would need to guess memory IDs.

**Parameters:**
```typescript
{
  category?: MemoryCategory,  // Filter by category
  keywords?: string,          // Semantic search query
  limit?: number              // Max results (default 10)
}
```

**Returns:** Array of `{ id, category, content, last_updated, confidence }` sorted by relevance.

**Implementation:** Reuses existing hybrid search from Loop B (70% vector + 30% BM25).

#### M3.5-1: `remember_fact` Agent Tool

**What:** New tool in Agent SDK that allows the AI to store facts about the user during conversation.

**Why:** Currently memory extraction only happens after chat ends. Agent should be able to say "I'll remember that" and actually do it.

**Implementation:**
```typescript
// lib/agent-sdk/memory-tools.ts
export const memoryTools = {
  remember_fact: {
    description: `Store an important fact about the user or their work.
    Use this when the user shares something worth remembering long-term.
    Be selective - only store meaningful, actionable information.`,
    parameters: z.object({
      category: z.enum([
        'work_context', 'personal_context', 'top_of_mind',
        'brief_history', 'long_term_background', 'other_instructions'
      ]).describe('Which category this fact belongs to'),
      content: z.string().describe('The fact to remember'),
      confidence: z.number().min(0.5).max(1.0).describe('How certain: 1.0 = stated explicitly, 0.7 = implied'),
    }),
    execute: async ({ category, content, confidence }, { userId }) => {
      const memory = await createMemory({
        user_id: userId,
        category,
        content,
        confidence,
        source: 'agent_extracted',
        source_chat_ids: [currentChatId],
      });
      return `Remembered: "${content}" in ${category}`;
    }
  },
};
```

**UX Flow:**
1. User: "By the way, I'm moving to London next month"
2. Agent: "That's exciting! I'll remember that you're relocating to London."
3. Agent calls `remember_fact({ category: 'personal_context', content: 'Relocating to London in [month]', confidence: 1.0 })`
4. Memory instantly saved (not waiting for chat end)

#### M3.5-2: `update_memory` Agent Tool

**What:** Tool to update existing memories when user provides corrections.

**Implementation:**
```typescript
update_memory: {
  description: `Update an existing memory when the user provides a correction or update.`,
  parameters: z.object({
    memoryId: z.string().describe('ID of the memory to update'),
    newContent: z.string().describe('Updated content'),
    reason: z.string().optional().describe('Why the update was made'),
  }),
  execute: async ({ memoryId, newContent, reason }) => {
    await updateMemory(memoryId, {
      content: newContent,
      updated_reason: reason,
      confidence: 1.0 // User correction = high confidence
    });
    return `Memory updated successfully.`;
  }
}
```

#### M3.5-3: `forget_memory` Agent Tool

**What:** Tool to mark memories as outdated/deleted when user indicates they're wrong.

**Implementation:**
```typescript
forget_memory: {
  description: `Mark a memory as outdated when the user says it's no longer accurate.`,
  parameters: z.object({
    memoryId: z.string().describe('ID of the memory to forget'),
    reason: z.string().describe('Why this memory is being removed'),
  }),
  execute: async ({ memoryId, reason }) => {
    await deleteMemory(memoryId); // Soft delete
    return `Memory removed: ${reason}`;
  }
}
```

#### M3.5-4: Async Extraction Pipeline

**What:** Move memory extraction to background job instead of blocking chat response.

**Implementation:**
```typescript
// In /api/chat/route.ts
export async function POST(req: Request) {
  // ... generate response ...

  // Fire-and-forget memory extraction (don't await)
  if (shouldExtract) {
    fetch('/api/memory/extract-background', {
      method: 'POST',
      body: JSON.stringify({ chatId, messages }),
    }).catch(console.error); // Log but don't block
  }

  return response; // Return immediately
}

// New edge function: /api/memory/extract-background/route.ts
export const runtime = 'edge';
export const maxDuration = 60;

export async function POST(req: Request) {
  const { chatId, messages } = await req.json();
  await extractMemories(messages);
  return Response.json({ success: true });
}
```

**Benefits:**
- Response time improvement (removes extraction latency)
- Better UX (user doesn't wait for extraction)
- Enables longer extraction windows without blocking

#### M3.5-5: Memory Tool Error Handling (NEW)

**What:** Graceful handling of memory tool failures during conversation. Ensures failed memory operations don't crash the chat API.

**Why:** Memory tools call external services (database, embeddings). Failures shouldn't break the user's conversation.

**Implementation:**
```typescript
// In lib/agent-sdk/memory-tools.ts
const wrapWithErrorHandling = (tool) => ({
  ...tool,
  execute: async (params) => {
    try {
      return await tool.execute(params);
    } catch (error) {
      logger.error('Memory tool failed:', error);
      return `Memory operation failed: ${error.message}. Please try again or use the /memory page.`;
    }
  }
});

// Apply to all memory tools
export const safeMemoryTools = Object.fromEntries(
  Object.entries(memoryTools).map(([name, tool]) =>
    [name, wrapWithErrorHandling(tool)]
  )
);
```

**Acceptance Criteria:**
- [ ] Failed memory operations return error strings (not thrown exceptions)
- [ ] Chat API doesn't crash if createMemory() times out
- [ ] Agent acknowledges failures gracefully in conversation
- [ ] Errors logged for debugging

#### M3.5-6: Memory Tool Safety Permissions (NEW)

**What:** Prevent agent from manipulating memories without user awareness. Destructive operations require confirmation.

**Why:** Agent shouldn't be able to delete memories or overwrite manual entries without user consent.

**Implementation:**
```typescript
// In lib/agent-sdk/tool-config.ts
export const CONFIRMATION_REQUIRED_TOOLS = [
  'Write',
  'Edit',
  'Bash',
  'forget_memory',  // NEW: Destructive memory operation
  'update_memory',  // NEW: Show diff for approval
];

// remember_fact is auto-approved (additive only)
export const AUTO_APPROVED_TOOLS = [
  'Read',
  'Glob',
  'Grep',
  'search_memory',   // NEW: Read-only
  'remember_fact',   // NEW: Additive, low risk
];
```

**Confirmation Dialog Enhancements:**
```typescript
// In components/agent/tool-confirmation-dialog.tsx
const MemoryUpdatePreview = ({ oldContent, newContent }) => (
  <div className="space-y-2">
    <div className="text-sm text-muted-foreground">Current memory:</div>
    <div className="text-red-500 line-through">{oldContent}</div>
    <div className="text-sm text-muted-foreground">Will be updated to:</div>
    <div className="text-green-500">{newContent}</div>
  </div>
);
```

**Acceptance Criteria:**
- [ ] `forget_memory` triggers permission modal before execution
- [ ] `update_memory` shows before/after diff for approval
- [ ] `remember_fact` auto-approved (no modal needed)
- [ ] `search_memory` auto-approved (read-only)
- [ ] Manual memory entries (source_type='manual') protected from agent modification

---

#### M3.5 Sprint Status & Ship Decision (Nov 28, 2025)

**Sprint M3.5-02 Completion Status:**
- ✅ **SHIPPED (MVP):** Core memory tools (remember_fact, search_memory) - 70% production-ready
- ✅ **Backend fixes:** REST API content_hash, Zod validation, error codes - 81.8% API test pass rate
- ✅ **Critical bug fixes:** Chat initialization 404 loop fixed, New Chat button crash fixed
- ✅ **BETA banner added:** Users informed that memory tools are in BETA, updates happen automatically

**Ship Decision (Option A - Pragmatic MVP):**
Following pragmatic CTO reasoning, we shipped M3.5 as MVP with known gaps. The 70% that works (remember_fact, search_memory) provides immediate value. The deferred 30% will be implemented based on real user feedback, not assumptions.

**Deferred to Backlog (30%):**

| ID | Feature | Priority | Estimate | Status | Rationale for Deferral |
|----|---------|----------|----------|--------|------------------------|
| M3.5-7 | Confirmation dialogs for update_memory/forget_memory | 🟡 MEDIUM | 2-3h | 📝 Deferred | UI integration incomplete. Backend works perfectly. Requires tool call interception in chat interface. **Impact:** update_memory and forget_memory execute without user confirmation dialog. |
| M3.5-8 | Toast notifications for memory operations | 🟢 LOW | 1h | 📝 Deferred | Visual feedback missing for tool executions. **Impact:** No "Remembered..." or "Memory updated" toast confirmations. |
| M3.5-9 | Unit tests for memory tools (80% coverage) | 🟡 MEDIUM | 4h | 📝 Deferred | API integration tests passing at 81.8%. Unit tests improve maintainability but not blocking for MVP. |
| M3.5-10 | Performance optimization (memory retrieval <500ms) | 🟢 LOW | 2h | 📝 Deferred | Current: 2.1s for 48 records. Target: <500ms. Not user-blocking for MVP scale. |

---

### 🚨 CRITICAL POST-SHIP BLOCKERS (November 28, 2025)

**BLOCKER DISCOVERED DURING E2E TESTING:** REST API was NOT generating embeddings for memory entries. Search feature is 100% non-functional.

| ID | Feature | Priority | Status | Estimate | Critical? |
|----|---------|----------|--------|----------|-----------|
| **M3.5-BLOCKER-1** | **Fix: Add embedding generation to REST API POST endpoint** | 🔴 **CRITICAL** | ✅ **CODE FIXED** | 5 min code | **P0 - SHIP BLOCKER** |
| **M3.5-BLOCKER-2** | **Fix: Claude Agent SDK build error (child_process import)** | 🔴 **CRITICAL** | ⏳ **ASSIGNED** | 30-60 min | **P0 - BLOCKS TESTING** |
| **M3.5-BLOCKER-3** | **Backfill: Generate embeddings for 49 existing memory entries** | 🔴 **CRITICAL** | ⏳ **SCRIPT READY** | 20-30 min | **P0 - BLOCKS SEARCH** |
| **M3.5-BLOCKER-4** | **Test: Verify REST API embedding generation & search functionality** | 🔴 **CRITICAL** | ⏳ **BLOCKED** | 20-30 min | **P0 - VERIFY SHIP** |

**What Happened:**
- API tests passed 81.8% but didn't verify embeddings were actually stored in database
- REST API missing embedding generation (only agent tool path had it)
- 49 existing entries have 0% embedding coverage
- search_memory feature is completely broken (requires embeddings for hybrid search)
- Discovered during comprehensive database validation layer of E2E testing

**Ship Status:** 🚨 **REVOKED** - Requires re-evaluation after blocker fixes

**See:** `/docs/sprints/active/sprint-m35-02-BLOCKER-UPDATE.md` for full investigation and recovery plan

**Total Deferred Effort (Original):** 9.5-10.5 hours
**Total Critical Blocker Effort:** ~2-2.5 hours (once build fixed)

**Why This Decision Was Right:**
1. **User value first:** 2 of 4 tools work perfectly (50% coverage), better than 0%
2. **Fast feedback:** Ship now, iterate based on real usage patterns
3. **Risk mitigation:** BETA banner sets expectations, users know it's experimental
4. **Technical debt is documented:** All gaps tracked with estimates and rationale
5. **Quality bar met:** API tests passing, critical bugs fixed, no P0 blockers remaining

**Next Steps:**
1. Monitor user feedback on memory tools usage
2. Track which deferred features users request most
3. Implement high-demand features first (data-driven prioritization)
4. Run full UI E2E test suite after confirmation dialogs are implemented

---

### 3.6 Deferred Features (Post-M3)

| ID | Feature | Priority | Estimate | Status | Notes |
|----|---------|----------|----------|--------|-------|
| M3-14 | Detect and store user local time & timezone | 🟡 MEDIUM | 2h | 📝 | Auto-context feature |
| M3-15 | Inject current local time and location into prompt | 🟡 MEDIUM | 3h | 📝 | Privacy concerns |
| M3-29 | Import memory from external sources (resume, LinkedIn) | 🟢 LOW | 4h | 📝 | Nice-to-have |
| M3-30 | Memory versioning (history of changes) | 🟢 LOW | 3h | 📝 | Advanced feature |

**Note:** Original M3-1 through M3-4 (Supermemory.ai integration) were replaced with custom Gemini 2.5 Flash Lite extraction for better control and 56% lower cost.

**Total M3 Core Tasks:** 36 (22 complete + 7 Phase 4 + 7 M3.5)
**Total Estimated Effort:** 96 hours (revised with realistic M3.5 estimates)
**Phase 1 Actual:** 4.5 hours (55% efficiency gain)
**Phase 2 Actual:** 4 hours (75% efficiency gain)
**Phase 3 Actual:** 16 hours (+1h over estimate)
**Phase 3.1 Actual:** 3.5 hours (on estimate)
**M3.5 (NOW FIRST):** 28 hours (7 tasks - Agent Memory Tools) **← ACTIVE**
**Phase 4 (AFTER M3.5):** 17 hours (7 tasks - Polish features)

---

## 🤖 MILESTONE 4: Agent SDK ✅ COMPLETE

**Status:** ✅ Complete (Nov 26, 2025 - Day 1!)
**Sprint:** M4-01 (Nov 26)
**Total Tasks:** 10/10 (100%)
**Estimated Effort:** 25.5 hours
**Actual Effort:** 10 hours (61% under estimate!)
**Architecture:** Hybrid (Chat Mode + Agent Mode)

### Why Agent SDK Now?

1. **Core differentiator** - Everyone has chat, few have good agents
2. **Foundation ready** - M1/M2 provide persistence and RAG
3. **Memory ready** - M3 at 79% provides user context
4. **Accelerator** - Agent can help build remaining features

### Architecture

```
Chat Mode (/api/chat)    → AI Gateway → GPT, Gemini, Claude, Deepseek
Agent Mode (/api/chat)   → Claude SDK → Claude only (with tools)

Both modes share:
├─ User memory injection (M3)
├─ Project context injection (M2 Loop A)
├─ RAG search (M2 Loop B)
└─ Context tracking
```

### 4.1 Core Agent Integration

| ID | Feature | Priority | Estimate | Actual | Status |
|----|---------|----------|----------|--------|--------|
| M4-1 | Install Claude Agent SDK + Zod downgrade | 🔴 HIGH | 0.5h | 0.5h | ✅ Done |
| M4-2 | Add agentMode flag to /api/chat | 🔴 HIGH | 2h | 1h | ✅ Done |
| M4-3 | Integrate memory injection with agent | 🔴 HIGH | 2h | 1h | ✅ Done |
| M4-4 | Integrate project context with agent | 🔴 HIGH | 2h | 1h | ✅ Done |
| M4-5 | Configure built-in tools (Read, Write, Edit, Bash, Glob, Grep) | 🔴 HIGH | 4h | 1h | ✅ Done |

### 4.2 UI & Streaming

| ID | Feature | Priority | Estimate | Actual | Status |
|----|---------|----------|----------|--------|--------|
| M4-6 | Agent mode toggle in chat interface | 🔴 HIGH | 2h | 1h | ✅ Done |
| M4-7 | Tool execution streaming to UI | 🔴 HIGH | 4h | 1.5h | ✅ Done |
| M4-8 | Tool result display components | 🔴 HIGH | 4h | 1.5h | ✅ Done |

### 4.3 Safety & Confirmation

| ID | Feature | Priority | Estimate | Actual | Status |
|----|---------|----------|----------|--------|--------|
| M4-9 | User confirmation for write operations | 🔴 HIGH | 3h | 1h | ✅ Done |
| M4-10 | PreToolUse safety hooks | 🟡 MEDIUM | 2h | 0.5h | ✅ Done |

**Total:** 10 tasks | **Estimated:** 25.5h | **Actual:** 10h | **Variance:** -61%

### Success Criteria

- [x] Can toggle between Chat Mode and Agent Mode
- [x] Agent can read files from projects
- [x] Agent can search codebase (Grep, Glob)
- [x] Agent can create/edit files (with confirmation)
- [x] Agent has access to user memory
- [x] Agent has access to project context
- [x] Tool execution streams to UI in real-time

### Deliverables (15 files)

**lib/agent-sdk/** (8 files):
- `agent-handler.ts` - Main agent routing with SSE streaming
- `memory-integration.ts` - M3 memory injection
- `project-integration.ts` - M2 project context (50k token budget)
- `tool-config.ts` - Tool tier configurations (DEFAULT, FULL, READONLY)
- `safety-hooks.ts` - PreToolUse hooks with blocked patterns
- `stream-adapter.ts` - SDK message parsing
- `utils.ts` - Client-safe exports (`isClaudeModel()`)
- `index.ts` - Barrel exports

**components/agent/** (7 files):
- `tool-card.tsx` - Tool execution card with icons
- `file-preview.tsx` - Syntax-highlighted file display
- `bash-output.tsx` - Terminal-style output
- `search-results.tsx` - Grep/glob result parsing
- `tool-execution.tsx` - Tool output routing
- `tool-confirmation-dialog.tsx` - Diff preview for edits
- `index.ts` - Component exports

---

## 🧠 MILESTONE 3.6: Cognitive Memory System (Neuroscience-Inspired)

**Status:** 📝 NEXT
**Target Start:** December 2025
**Target End:** March 2026
**Total Tasks:** 32 (23 new requirements + 9 audit items)
**Total Effort:** ~100-120 hours across 5 sprints
**Focus:** Transform Bobo's memory from simple key-value storage to a neuroscience-inspired cognitive system
**Source:** Comprehensive requirements extracted from `/docs/COGNITIVE_MEMORY_REQUIREMENTS.md`
**Research Basis:** Ebbinghaus forgetting curve, Hebbian learning, CLS (Complementary Learning Systems) theory, spreading activation

### Why M3.6 Now?

1. **Cognitive memory research gap** - Extensive research in `/docs/product/research/` was never translated into actionable backlog items
2. **Current memory is passive** - Memories don't decay, strengthen, or relate to each other
3. **No temporal dynamics** - 1-year-old memory weighted same as yesterday's
4. **No associative network** - Can't traverse related concepts
5. **Foundation ready** - M3/M3.5 provides basic memory infrastructure to build upon

### Architecture Overview

```
Current Memory (M3.5)          →    Cognitive Memory (M3.6)
─────────────────────────────────────────────────────────────
Simple key-value storage       →    Temporal decay (Ebbinghaus)
Duplicate rejection            →    Hebbian reinforcement
Isolated memories              →    Memory graph (relationships)
Static confidence              →    Dynamic importance + salience
No consolidation               →    Sleep-inspired consolidation
Same results every query       →    Context-aware search
```

### Sprint 1: Cognitive Foundation (12-15h) ← IN PROGRESS

**Goal:** Add temporal dynamics and smarter search. Recent memories should rank higher. Duplicates should strengthen existing rather than reject.

| ID | Feature | Priority | Estimate | Status | Source |
|----|---------|----------|----------|--------|--------|
| M3.6-001 | Add `last_accessed`, `access_count` columns | 🔴 P0 | 1h | ✅ Done (Dec 4) | REQ-001 |
| M3.6-002 | Create `enhanced_memory_search` function with temporal decay | 🔴 P0 | 3h | ✅ Done (Dec 6) | REQ-009 |
| M3.6-003 | Create `update_memory_access` function | 🔴 P0 | 1h | ✅ Done (Dec 4) | REQ-010 |
| M3.6-004 | Implement Hebbian reinforcement in `remember_fact` | 🔴 P0 | 2h | ✅ Done (Dec 7) | REQ-013 |
| M3.6-005 | Implement context-aware search in `search_memory` | 🔴 P0 | 4h | ✅ Done (Dec 7) | REQ-014 |
| M3.6-006 | Update Memory API for new fields + Bulk API | 🔴 P0 | 2h | ✅ Done (Dec 6) | REQ-023 |
| M3.6-007 | Testing buffer (25% allocation) | 🔴 HIGH | 2h | ✅ Done (Dec 7) | Sprint rule |

**Sprint 1 Progress:** 7/7 tasks complete ✅ (~15h actual)

**Dec 6, 2025 Deliverables:**
- ✅ `enhanced_memory_search` RPC with 5-component weighting (45% vector, 15% text, 20% recency, 10% freq, 10% confidence)
- ✅ `importance` column added with category defaults (0.9 red flags, 0.85 instructions, 0.75 background, 0.7 history, 0.5 work)
- ✅ 45-day half-life for Ebbinghaus recency decay
- ✅ Bulk seeding API (`POST /api/memory/bulk`) with deduplication (0.85 threshold), backdating, sequential embedding
- ✅ 22 deal/client memories seeded with embeddings and importance values
- ✅ Migration: `20251206031627_enhanced_memory_search`

**Definition of Done:**
- [x] Recent memories rank higher than old ones (Ebbinghaus decay) ✅
- [x] Frequently accessed memories get priority (access_count) ✅
- [ ] Duplicate inputs strengthen existing memories (Hebbian)
- [ ] Search results influenced by conversation context
- [x] API accepts new fields (importance, memory_type) ✅
- [x] All tests passing ✅

### Sprint 2: Memory Safety (8-10h)

**Goal:** Add user protection for destructive operations. Enforce token budget to prevent context overflow.

| ID | Feature | Priority | Estimate | Status | Source |
|----|---------|----------|----------|--------|--------|
| M3.6-008 | Confirmation dialogs for update_memory/forget_memory | 🔴 HIGH | 4h | ⏳ | AUDIT-006 |
| M3.6-009 | Token budget enforcement (500 tokens max) | 🔴 HIGH | 4h | ⏳ | AUDIT-001 |
| M3.6-010 | Testing buffer | 🔴 HIGH | 2h | ⏳ | Sprint rule |

**Sprint 2 Total:** 10h

**Definition of Done:**
- [ ] `update_memory` triggers modal showing before/after diff
- [ ] `forget_memory` triggers red destructive confirmation modal
- [ ] Total injected memory never exceeds 500 tokens
- [ ] Truncation follows priority hierarchy (work > top_of_mind > personal > brief > long_term > other)
- [ ] Memory UI shows "X/500 tokens used"

### Sprint 3: Memory Graph Foundation (12-15h)

**Goal:** Add relationships between memories. Enable spreading activation search.

| ID | Feature | Priority | Estimate | Status | Source |
|----|---------|----------|----------|--------|--------|
| M3.6-011 | Create `memory_relationships` table | 🔴 P1 | 2h | ⏳ | REQ-007 |
| M3.6-012 | Create `build_memory_edges` function | 🔴 P1 | 2h | ⏳ | REQ-012 |
| M3.6-013 | Create `spreading_activation_search` function | 🔴 P1 | 3h | ⏳ | REQ-011 |
| M3.6-014 | Add `memory_type` column (episodic/semantic/consolidated) | 🔴 P1 | 1h | ⏳ | REQ-003 |
| M3.6-015 | Add `episode_context` JSONB column | 🔴 P1 | 1h | ⏳ | REQ-004 |
| M3.6-016 | Add bi-temporal columns (valid_from, valid_to, superseded_by) | 🔴 P1 | 2h | ⏳ | REQ-008 |
| M3.6-017 | Add `importance` column | 🟡 P2 | 1h | ✅ Done (Dec 6) | REQ-002 |
| M3.6-018 | Testing buffer | 🔴 HIGH | 3h | ⏳ | Sprint rule |

**Sprint 3 Total:** 15h

**Definition of Done:**
- [ ] Memories can be linked with relationship types (similar, elaborates, contradicts, temporal_sequence)
- [ ] New memories auto-build edges to similar existing memories
- [ ] Spreading activation finds related concepts (1-hop neighbors)
- [ ] Episodic vs semantic memories distinguishable
- [ ] Contradictions tracked via bi-temporal model

### Sprint 4: Consolidation System (15-20h)

**Goal:** Implement "sleep-like" memory consolidation. Cluster, synthesize, and prune memories.

| ID | Feature | Priority | Estimate | Status | Source |
|----|---------|----------|----------|--------|--------|
| M3.6-019 | Create `memory_consolidation_logs` table | 🔴 P1 | 1h | ⏳ | REQ-018 |
| M3.6-020 | Implement consolidation job (cluster → synthesize → prune) | 🔴 P1 | 10h | ⏳ | REQ-017 |
| M3.6-021 | Add verification layer (prevent hallucination) | 🔴 P0 | 8h | ⏳ | REQ-019 |
| M3.6-022 | Add `consolidated_from` UUID[] column | 🔴 P1 | 0.5h | ⏳ | REQ-005 |
| M3.6-023 | Update `source_type` constraint for 'consolidated' | 🔴 P1 | 0.5h | ⏳ | REQ-006 |
| M3.6-024 | Testing buffer | 🔴 HIGH | 3h | ⏳ | Sprint rule |

**Sprint 4 Total:** 23h (may split into 2 sprints)

**Definition of Done:**
- [ ] Nightly cron job runs consolidation
- [ ] Similar memories (>0.75 similarity) clustered
- [ ] Clusters synthesized into single consolidated memory
- [ ] Original memories soft-deleted, traceable via `consolidated_from`
- [ ] All consolidated memories go through verification (different model)
- [ ] Stale memories (90+ days, 0 access, low confidence) flagged for review
- [ ] Consolidation logged for audit

### Sprint 5: M3 Phase 4 Completion + Production Hardening (15-20h)

**Goal:** Complete remaining M3 Phase 4 items with improved definitions. Add production safety.

| ID | Feature | Priority | Estimate | Status | Source |
|----|---------|----------|----------|--------|--------|
| M3.6-025 | Conflict resolution UI | 🔴 HIGH | 5h | ⏳ | AUDIT-002 |
| M3.6-026 | Memory debugger ("What was injected?") | 🟡 MED | 5h | ⏳ | AUDIT-003 |
| M3.6-027 | Memory provenance UI | 🟡 MED | 3h | ⏳ | AUDIT-004 |
| M3.6-028 | Description-driven extraction | 🟡 MED | 4h | ⏳ | AUDIT-005 |
| M3.6-029 | Latency budget enforcement (<2s retrieval) | 🔴 P0 | 4h | ⏳ | REQ-020 |
| M3.6-030 | Pruning safety guards | 🔴 P1 | 2h | ⏳ | REQ-021 |
| M3.6-031 | Graph explosion prevention (entity resolution) | 🔴 P1 | 4h | ⏳ | REQ-022 |
| M3.6-032 | Testing buffer | 🔴 HIGH | 3h | ⏳ | Sprint rule |

**Sprint 5 Total:** 30h (may split into 2 sprints)

**Definition of Done:**
- [ ] Conflict modal shows side-by-side comparison (manual vs auto)
- [ ] Memory debugger panel shows 3 sections (Profile, Memories, Project Context)
- [ ] Each memory shows clickable source chat link
- [ ] All 6 categories have `extraction_guidance` populated
- [ ] Memory retrieval completes in <2s (with graceful degradation)
- [ ] Pruning runs in log-only mode first (no auto-delete)
- [ ] Duplicate entities merged before node creation

### M3.6 Success Criteria

- [ ] Memory system feels "alive" - recent interactions influence retrieval
- [ ] Repetition strengthens memories (Hebbian learning)
- [ ] Related concepts surface together (spreading activation)
- [ ] Old unused memories naturally fade (temporal decay)
- [ ] Memory doesn't grow unbounded (consolidation + pruning)
- [ ] No hallucinated facts in consolidated memories (verification layer)
- [ ] User has visibility into what AI "knows" (debugger)
- [ ] Destructive operations require confirmation (safety)

### Critical Warnings (from PDF Research Reviews)

> ⚠️ **DO NOT:**
> 1. Use large context windows as memory substitute ("Lost in the Middle" phenomenon)
> 2. Use MemGPT self-editing loop for real-time chat (2.6s+ latency unacceptable)
> 3. Hard-delete during consolidation (always soft-delete/archive)
> 4. Let pruning run without safety guards (log candidates first)
> 5. Skip verification for consolidated memories (hallucination risk)

### Files to Create/Modify

**New Files:**
- `supabase/migrations/YYYYMMDD_cognitive_memory_schema.sql`
- `lib/brain/index.ts` - Public API
- `lib/brain/config.ts` - Configuration constants
- `lib/brain/hippocampus/remember.ts` - Hebbian reinforcement
- `lib/brain/hippocampus/retrieve.ts` - Context-aware search
- `lib/brain/hippocampus/graph.ts` - Relationship management
- `lib/brain/neocortex/consolidation.ts` - Sleep-like consolidation
- `app/api/cron/consolidate/route.ts` - Nightly cron endpoint

**Modified Files:**
- `lib/agent-sdk/memory-tools.ts` - Tool updates
- `lib/db/queries.ts` - New RPC calls
- `app/api/memory/entries/route.ts` - Schema validation
- `components/memory/*` - UI updates

---

## 📂 MILESTONE 3.7: Repository Consolidation (Advisory Core)

**Status:** 📝 Planned
**Target:** December 2025
**Trigger:** Dogfooding validation revealed memories insufficient for advisory work
**Focus:** Consolidate Blog Migration repository into Bobo for unified "Second Brain" with full file access
**Architecture Note:** See `docs/product-vision/REPOSITORY_CONSOLIDATION_ROADMAP.md` for comprehensive implementation plan

### Strategic Context

**Problem:** Two-repository architecture creates friction:
- Cold start every conversation (no advisory context)
- Manual file selection required
- No cross-repository search
- Workflow fragmentation between Claude Code (files) and Bobo (chat)

**Solution:** Consolidate Blog Migration into Bobo:
- Files in Git (version controlled, editable via Claude Code)
- Files indexed to Supabase at build time (searchable via RAG)
- Agent Mode can access both memories AND files
- Single source of truth, single workflow

**Validation Finding (Dec 6, 2025):** Testing with 22 seeded memories showed that memories provide high-level context, but users need granular file access for real work (e.g., "What was my last email to Mikaela?" requires actual Communications Log).

### M3.7 NOW Phase: Advisory Core ✅ COMPLETE (Dec 7, 2025)

| ID | Task | Priority | Estimate | Actual | Status |
|----|------|----------|----------|--------|--------|
| **M3.7-01** | Create directory structure (advisory/deals, advisory/clients) | 🔴 HIGH | 1.5h | 0.5h | ✅ |
| **M3.7-02** | Database migration - search RPC | 🔴 HIGH | 1.5h | 0.5h | ✅ |
| **M3.7-03** | TypeScript type definitions | 🔴 HIGH | 0.5h | 0.25h | ✅ |
| **M3.7-04** | Build indexing script | 🔴 HIGH | 2.5h | 0.5h | ✅ |
| **M3.7-05** | Package.json integration | 🔴 HIGH | 0.5h | 0.1h | ✅ |
| **M3.7-06** | Create advisory tools module | 🔴 HIGH | 2h | 0.5h | ✅ |
| **M3.7-07** | Register tool in configuration | 🔴 HIGH | 1h | 0.25h | ✅ |
| **M3.7-08** | Verification script | 🟡 MEDIUM | 1h | 0.25h | ✅ |
| **M3.7-09** | Indexing + validation | 🔴 HIGH | 1.5h | 0.5h | ✅ |
| **M3.7-10** | Update CLAUDE.md | 🟡 MEDIUM | 0.5h | 0.25h | ✅ |
| **M3.7-11** | Sprint completion docs | 🟡 MEDIUM | 0.5h | 0.25h | ✅ |

**Estimated:** 13h | **Actual:** 3.9h | **Variance:** -70% (3.3x faster)

**Key Outcomes:**
- 43 advisory files indexed (deals + clients)
- 100% embedding coverage
- `search_advisory` tool operational
- Intent classifier + pre-flight knowledge search (M3.8 extension)

---

### M3.8 Advisory Project Integration ✅ COMPLETE (Dec 7, 2025)

| ID | Task | Priority | Estimate | Status |
|----|------|----------|----------|--------|
| **M3.8-01** | Create migration: add entity_type, advisory_folder_path | 🔴 HIGH | 0.5h | ✅ |
| **M3.8-02** | Update lib/db/types.ts with EntityType | 🔴 HIGH | 0.5h | ✅ |
| **M3.8-03** | Update lib/db/queries.ts with new functions | 🔴 HIGH | 0.5h | ✅ |
| **M3.8-04** | Install gray-matter dependency | 🟡 MEDIUM | 0.5h | ✅ |
| **M3.8-05** | Create lib/advisory/file-reader.ts | 🔴 HIGH | 1.5h | ✅ |
| **M3.8-06** | Create lib/advisory/summarizer.ts | 🔴 HIGH | 1h | ✅ |
| **M3.8-07** | Test file reading with MyTab | 🟡 MEDIUM | 0.5h | ✅ |
| **M3.8-08** | Create /api/advisory/available | 🔴 HIGH | 0.5h | ✅ |
| **M3.8-09** | Create /api/advisory/import | 🔴 HIGH | 1h | ✅ |
| **M3.8-10** | Create /api/advisory/bulk-import | 🔴 HIGH | 0.5h | ✅ |
| **M3.8-11** | Create /api/advisory/refresh/[projectId] | 🟡 MEDIUM | 0.5h | ✅ |
| **M3.8-12** | Update /api/projects/[id] for new fields | 🟡 MEDIUM | 0.5h | ✅ |
| **M3.8-13** | Modify context-manager.ts for advisory | 🔴 HIGH | 1h | ✅ |
| **M3.8-14** | Create bulk-import.tsx component | 🔴 HIGH | 1.5h | ✅ |
| **M3.8-15** | Create import-wizard.tsx component | 🟡 MEDIUM | 1.5h | ✅ |
| **M3.8-16** | Add "Import Advisory" button to project creation | 🟡 MEDIUM | 0.5h | ✅ |
| **M3.8-17** | Add entity type badges to project list | 🟡 MEDIUM | 0.5h | ✅ |
| **M3.8-18** | Bulk import all 6 deals, verify context | 🔴 HIGH | 0.5h | ✅ |
| **M3.8-19** | Update CLAUDE.md with docs | 🟡 MEDIUM | 0.5h | ✅ |

**Estimated:** 16h | **Actual:** ~8h | **Variance:** -50% (2x faster)

**Key Outcomes:**
- Project-per-deal system operational
- File-reference mode reads directly from disk (always current)
- AI-generated summaries as custom_instructions
- Entity type badges (Deal/Client/Personal)
- Bulk import + individual import wizard

---

### M3.9 Advisory-Memory Integration 📝 PLANNED

**Goal:** Close the loop between advisory files and cognitive memory - bidirectional relationship

| ID | Task | Priority | Estimate | Status |
|----|------|----------|----------|--------|
| **M3.9-01** | Add `source_advisory_path` column to memory_entries | 🔴 HIGH | 1h | ⏳ |
| **M3.9-02** | Auto-extract key facts from advisory master docs → memory | 🔴 HIGH | 3h | ⏳ |
| **M3.9-03** | Link extracted memories to source advisory file | 🔴 HIGH | 2h | ⏳ |
| **M3.9-04** | When memory recalled, include "See [file] for details" | 🟡 MEDIUM | 2h | ⏳ |
| **M3.9-05** | Cross-reference chat discussions with advisory content | 🟡 MEDIUM | 2h | ⏳ |
| **M3.9-06** | Track which advisory sections were discussed | 🟡 MEDIUM | 2h | ⏳ |
| **M3.9-07** | Suggest advisory file updates from chat learnings | 🟢 LOW | 2h | ⏳ |
| **M3.9-08** | Memory deduplication with advisory content awareness | 🟡 MEDIUM | 1h | ⏳ |

**Total Estimate:** 15 hours

**Why This Matters:**
Currently advisory files and cognitive memory are isolated:
- Advisory files → Context (one-way)
- Chat → Memory (one-way)
- Advisory ↔ Memory: **NO CONNECTION**

This milestone closes the loop:
- Facts from advisory files become trackable memories
- Memories know their source ("this came from MyTab master doc")
- Chat learnings can suggest advisory file updates
- No duplicate context (advisory content vs extracted memories)

**Definition of Done:**
- [ ] Memory entries have optional `source_advisory_path` field
- [ ] Auto-extraction populates memories from master docs
- [ ] Memory search results include advisory source links
- [ ] Deduplication considers advisory content
- [ ] Chat insights flag potential advisory updates

**Total Estimate:** 15 hours

### Validation Queries (Success Criteria)

After implementation, verify these queries work in Agent Mode:

| Query | Expected Behavior |
|-------|-------------------|
| "Brief me on MyTab" | Returns master-doc summary, recent activity, red flags |
| "What was my last email to Mikaela?" | Finds Communications Log in MyTab master-doc |
| "What deals have red flags?" | Searches Strategic Observations across all deals |
| "Prep me for SwiftCheckin call" | Returns client profile + recent touchpoints |
| "What's the valuation range for ArcheloLab?" | Finds Valuation Snapshot section |
| "Show me the Dec 2 meeting notes for MyTab" | Returns specific meeting file |

### Definition of Done

- [ ] advisory/deals/ and advisory/clients/ exist in Bobo repo
- [ ] ~70 files migrated from Blog Migration (Deals + Clients)
- [ ] scripts/index-advisory.ts successfully indexes all files
- [ ] All files have embeddings in Supabase files table
- [ ] search_advisory tool available in Agent Mode
- [ ] search_advisory_files RPC function deployed
- [ ] npm run prebuild automatically re-indexes on build
- [ ] All 6 validation queries return accurate results
- [ ] No build errors (dev and production)
- [ ] CLAUDE.md updated with advisory workflow guidance

### Files to Create/Modify

**New Files:**
- `advisory/deals/_TEMPLATE/` - Deal templates and SOPs
- `advisory/clients/_TEMPLATE/` - Client templates and SOPs
- `advisory/deals/[deal-name]/master-doc.md` - Individual deal files
- `advisory/clients/[client-name]/client-profile.md` - Individual client files
- `scripts/index-advisory.ts` - Build-time indexing script
- `lib/agent-sdk/advisory-tools.ts` - search_advisory tool
- `supabase/migrations/[timestamp]_advisory_search_function.sql` - RPC function

**Modified Files:**
- `package.json` - Add index-advisory and prebuild scripts
- `lib/agent-sdk/server.ts` - Register advisory tools
- `CLAUDE.md` - Add advisory workflow documentation

### Future Phases (NEXT, LATER)

**NEXT Phase (Week 2-3):** Content System
- Move Content-Workspace/ (~30 files)
- Move 02_Workbench/ (~50 files)
- Extend indexing for content-specific metadata
- Add search_content tool

**LATER Phase (Week 4+):** Full Knowledge Base
- Move 01_Inspiration/ (493 blog posts)
- Move 04_Reference/ (~100 files)
- Implement chunking for large corpus
- Port document processor utilities

### Benefits

| Benefit | Description |
|---------|-------------|
| **Single Source of Truth** | All knowledge in one Git repository |
| **Unified Search** | One RAG system (Supabase pgvector) searches everything |
| **No Sync Required** | Files ARE the source, indexed at build time |
| **Same Workflow** | Claude Code edits files in Bobo repo (identical UX) |
| **Production Access** | Vercel deployment includes all files |
| **Version Control** | Git history for all advisory + content files |

### Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Indexing fails on large files | Medium | Medium | Add chunking, skip files > 100KB |
| Search returns irrelevant results | Medium | High | Tune similarity threshold, add filters |
| Build time increases significantly | Low | Medium | Parallelize indexing, cache embeddings |
| Vercel deployment size limit | Low | High | Exclude large files, use external storage |

---

## 🧠 MILESTONE 3.10: PAPR-Inspired Knowledge Graph (Research: Dec 8, 2025)

**Status:** 📝 Planned
**Target:** January-February 2026 (after M3.9)
**Research Source:** [PAPR AI Platform](https://platform.papr.ai/) - Predictive Memory Graph architecture
**Focus:** Entity relationship extraction, spreading activation search, agent self-learning
**Rationale:** PAPR's #1 STaRK benchmark ranking comes from knowledge graphs, not just vector search. Key insight: relationships ARE the value for advisory work.

### Strategic Analysis: What's Actually Useful from PAPR

**PAPR's Core Innovation:** Predictive Memory Graph that maps real relationships between entities, enabling multi-hop reasoning (code → ticket → conversation → decision).

**Key Insight for Bobo:** PAPR optimizes for speed/prediction (voice apps). Bobo optimizes for depth/accuracy (advisory work). Adopt the **relationship graph** without the ML prediction complexity.

| PAPR Feature | Adopt? | Rationale |
|--------------|--------|-----------|
| Knowledge Graph with Entity Extraction | ✅ YES | Highest ROI - enables "What patterns across deals?" |
| Spreading Activation Search | ✅ YES | Surfaces hidden connections automatically |
| Agent Self-Learning Memory | ✅ YES | Claude learns user preferences over time |
| Context-Aware Pre-fetching | 🟡 MAYBE | Nice-to-have, not critical for deliberate work |
| Memory Consolidation | 🟡 MAYBE | Already partially in M3.6 Sprint 4 |
| <100ms Predictive Caching | ❌ NO | Over-engineered for advisory workflow |
| Full Predictive ML Model | ❌ NO | Adds complexity without clear ROI |

### Sprint 1: Entity Extraction Foundation (8-10h)

**Goal:** Extract entities (people, companies, deals) and their relationships from advisory files. Store as graph edges.

| ID | Task | Priority | Estimate | Status | Notes |
|----|------|----------|----------|--------|-------|
| **M3.10-01** | Create `entity_relationships` table | 🔴 HIGH | 1h | ⏳ | source_entity, relationship_type, target_entity, confidence |
| **M3.10-02** | Design entity extraction prompt for Claude | 🔴 HIGH | 2h | ⏳ | Extract people, companies, deals, relationships |
| **M3.10-03** | Create `extractEntities()` function | 🔴 HIGH | 2h | ⏳ | Call Claude to parse file content |
| **M3.10-04** | Run extraction on existing advisory files | 🔴 HIGH | 1h | ⏳ | Batch process 43 files |
| **M3.10-05** | Add extraction to advisory indexing pipeline | 🟡 MED | 1h | ⏳ | Auto-extract on `npm run index-advisory` |
| **M3.10-06** | Testing buffer | 🔴 HIGH | 2h | ⏳ | Sprint rule |

**Sprint 1 Total:** 9h

**Schema Design:**
```sql
CREATE TABLE entity_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_entity_type TEXT NOT NULL,  -- 'deal', 'person', 'company', 'document'
  source_entity_id TEXT NOT NULL,    -- e.g., 'MyTab', 'John Smith'
  relationship_type TEXT NOT NULL,   -- 'employs', 'invested_in', 'related_to', 'mentioned_in', 'previously_at'
  target_entity_type TEXT NOT NULL,
  target_entity_id TEXT NOT NULL,
  confidence FLOAT DEFAULT 0.8,
  extracted_from UUID REFERENCES files(id),
  metadata JSONB,                    -- Additional context
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_entity_source ON entity_relationships(source_entity_type, source_entity_id);
CREATE INDEX idx_entity_target ON entity_relationships(target_entity_type, target_entity_id);
```

**Example Relationships:**
```
MyTab (deal) --employs--> John Smith (person)
John Smith (person) --previously_at--> SwiftCheckin (company)
SwiftCheckin (company) --related_to--> SwiftCheckin Deal (deal)
MyTab (deal) --has_investor--> VC Firm X (company)
```

**Definition of Done:**
- [ ] `entity_relationships` table exists with indexes
- [ ] Claude extraction prompt identifies: people, companies, deals, relationship types
- [ ] All 43 advisory files have entities extracted
- [ ] Entities stored with confidence scores
- [ ] Extraction runs automatically during indexing

### Sprint 2: Spreading Activation Search (6-8h)

**Goal:** When searching, automatically surface related entities via graph traversal.

| ID | Task | Priority | Estimate | Status | Notes |
|----|------|----------|----------|--------|-------|
| **M3.10-07** | Create `getRelatedEntities(entityId, hops)` function | 🔴 HIGH | 2h | ⏳ | 1-hop and 2-hop traversal |
| **M3.10-08** | Create `spreadingActivationSearch` RPC | 🔴 HIGH | 2h | ⏳ | Combine vector search + graph boost |
| **M3.10-09** | Modify hybrid_search to boost related entities | 🟡 MED | 1h | ⏳ | Optional `boost_entities` parameter |
| **M3.10-10** | Update context injection to include relationships | 🟡 MED | 1h | ⏳ | Show "Related: Person X (previously at Company Y)" |
| **M3.10-11** | Testing buffer | 🔴 HIGH | 2h | ⏳ | Sprint rule |

**Sprint 2 Total:** 8h

**Algorithm:**
```typescript
async function spreadingActivationSearch(query: string, startEntity?: string) {
  // 1. Standard hybrid search
  const baseResults = await hybridSearch(query);

  // 2. If entity detected, find related entities (1-hop)
  if (startEntity) {
    const related = await getRelatedEntities(startEntity, hops: 1);

    // 3. Boost scores for results mentioning related entities
    for (const result of baseResults) {
      if (related.some(r => result.content.includes(r.entity_id))) {
        result.score *= 1.2; // 20% boost for related entities
      }
    }
  }

  // 4. Optionally expand to 2-hop for high-confidence relations
  const secondaryEntities = related
    .filter(r => r.confidence > 0.8)
    .flatMap(r => getRelatedEntities(r.entity_id, hops: 1));

  return { results: baseResults, relatedEntities: related };
}
```

**Definition of Done:**
- [ ] `getRelatedEntities()` returns 1-hop and 2-hop neighbors
- [ ] Search for "MyTab" also surfaces related people and companies
- [ ] Related entities shown in context injection
- [ ] Graph traversal completes in <200ms

### Sprint 3: Agent Self-Learning Memory (4-6h)

**Goal:** Let Claude record observations about user preferences and patterns.

| ID | Task | Priority | Estimate | Status | Notes |
|----|------|----------|----------|--------|-------|
| **M3.10-12** | Add `memory_source` column to memory_entries | 🔴 HIGH | 0.5h | ⏳ | 'user_stated', 'agent_inferred', 'system_derived' |
| **M3.10-13** | Create `learn_preference` agent tool | 🔴 HIGH | 2h | ⏳ | Agent records observations |
| **M3.10-14** | Add confirmation workflow for agent-inferred memories | 🟡 MED | 1.5h | ⏳ | "I noticed X. Should I remember this?" |
| **M3.10-15** | Set decay rules for unconfirmed inferences | 🟡 MED | 1h | ⏳ | Faster decay if never confirmed |
| **M3.10-16** | Testing buffer | 🔴 HIGH | 1h | ⏳ | Sprint rule |

**Sprint 3 Total:** 6h

**Tool Design:**
```typescript
const learnPreferenceTool = {
  name: 'learn_preference',
  description: 'Record an observation about user preferences or work patterns',
  parameters: {
    observation: string,      // "User prefers bullet points over paragraphs"
    confidence: number,       // 0.3-0.7 for agent-inferred
    evidence: string,         // "User asked for bullets in last 3 responses"
    category: string          // 'communication_style', 'workflow', 'priorities'
  }
};
```

**Agent-Inferred Memory Rules:**
- Initial confidence: 0.5 (vs 0.9 for user-stated)
- Decay rate: 2x faster than normal (22-day half-life vs 45-day)
- Strengthening: User confirmation bumps confidence to 0.85
- Examples:
  - "User always asks about red flags first when reviewing deals"
  - "User prefers meeting prep in format: Summary → Key People → Questions"
  - "User's investment thesis focuses on B2B SaaS"

**Definition of Done:**
- [ ] `memory_source` column distinguishes user vs agent memories
- [ ] `learn_preference` tool available in agent mode
- [ ] Agent-inferred memories have lower initial confidence
- [ ] Unconfirmed inferences decay faster
- [ ] User can confirm/reject agent observations

### Sprint 4: Context-Aware Pre-fetching (Optional - 4-6h)

**Goal:** Pre-load related context when user switches projects.

| ID | Task | Priority | Estimate | Status | Notes |
|----|------|----------|----------|--------|-------|
| **M3.10-17** | Create `onProjectSwitch` pre-fetch hook | 🟢 LOW | 2h | ⏳ | Fire when project changes |
| **M3.10-18** | Pre-fetch related entities for deals | 🟢 LOW | 1.5h | ⏳ | People, related deals, companies |
| **M3.10-19** | Cache pre-fetched context | 🟢 LOW | 1h | ⏳ | 5-minute TTL |
| **M3.10-20** | Testing buffer | 🟢 LOW | 1h | ⏳ | Sprint rule |

**Sprint 4 Total:** 5.5h (OPTIONAL)

**Definition of Done:**
- [ ] Switching to deal project pre-fetches related entities
- [ ] Pre-fetched context available for immediate injection
- [ ] Cache invalidates on entity relationship changes

### M3.10 Success Criteria

- [ ] Asking "Brief me on MyTab" also surfaces related people and their other involvements
- [ ] Cross-deal patterns discoverable: "What deals involve people who worked together?"
- [ ] Agent learns user preferences without explicit instruction
- [ ] Graph queries complete in <200ms
- [ ] No significant increase in chat latency (<500ms total)

### M3.10 Milestone Totals

| Sprint | Focus | Hours | Status |
|--------|-------|-------|--------|
| Sprint 1 | Entity Extraction | 9h | ⏳ Planned |
| Sprint 2 | Spreading Activation | 8h | ⏳ Planned |
| Sprint 3 | Agent Self-Learning | 6h | ⏳ Planned |
| Sprint 4 | Pre-fetching (Optional) | 5.5h | ⏳ Optional |
| **Total** | | **28.5h** | |

### Validation Queries (Success Criteria)

| Query | Expected Behavior (with Knowledge Graph) |
|-------|------------------------------------------|
| "Brief me on MyTab" | Returns master doc + related people + their other involvements |
| "Who from SwiftCheckin is involved in other deals?" | Graph traversal finds people at SwiftCheckin → their other connections |
| "What patterns exist across deals with red flags?" | Cross-entity analysis of red flag sections |
| "What's my preferred meeting prep format?" | Agent-inferred memory from past interactions |
| "Find deals connected through common investors" | Multi-hop graph query: Deal → Investor → Other Deals |

### Files to Create/Modify

**New Files:**
- `supabase/migrations/YYYYMMDD_entity_relationships.sql` - Graph schema
- `lib/knowledge-graph/extract.ts` - Entity extraction
- `lib/knowledge-graph/traverse.ts` - Graph traversal
- `lib/knowledge-graph/search.ts` - Spreading activation
- `lib/agent-sdk/self-learning-tools.ts` - learn_preference tool

**Modified Files:**
- `lib/db/types.ts` - Add EntityRelationship types
- `lib/db/queries.ts` - Add graph query functions
- `lib/agent-sdk/server.ts` - Register new tools
- `scripts/index-advisory.ts` - Add entity extraction step
- `app/api/chat/route.ts` - Inject related entities in context

### Research References

- [PAPR AI Platform](https://platform.papr.ai/) - Predictive Memory Graph architecture
- [STaRK Benchmark](https://arxiv.org/html/2404.13207v1) - Semi-structured retrieval evaluation
- [PAPR TypeScript SDK](https://github.com/Papr-ai/papr-TypescriptSDK) - API patterns

---

## 🚀 M3.11: GTM Health Check Bot (Lead Generation)

**Status:** 📝 Planned
**Target Launch:** January 2026
**Focus:** Chatbot-driven GTM assessment for lead generation
**Positioning:** "Introducing Bobo, a GTM co-pilot" - free health check open to anyone

### Concept

> "Introducing Bobo, a GTM co-pilot for my advisory portfolio startups to navigate go-to-market. But Bobo is opening up for anyone and everyone to conduct a **free GTM health check**."

**The chatbot IS the interface.** No separate landing page needed. User lands on chat, Bobo:
1. Collects basic info (name, company, email, role)
2. Asks GTM assessment questions conversationally
3. Runs the assessment
4. Delivers personalized report with scores + recommendations

### Tasks (8h)

| ID | Task | Priority | Estimate | Status | Notes |
|----|------|----------|----------|--------|-------|
| **M3.11-01** | Design GTM assessment conversation flow | 🔴 HIGH | 1.5h | ⏳ | Questions for: ICP, channels, metrics, positioning |
| **M3.11-02** | Create GTM Health Check system prompt | 🔴 HIGH | 1.5h | ⏳ | Bobo persona + assessment logic |
| **M3.11-03** | Build assessment data model | 🔴 HIGH | 1h | ⏳ | `gtm_assessments` table: contact info, responses, scores |
| **M3.11-04** | Implement scoring + report generation | 🔴 HIGH | 2h | ⏳ | Claude analyzes responses → personalized report |
| **M3.11-05** | Public chat route (no auth required) | 🔴 HIGH | 1h | ⏳ | `/gtm` or similar - anonymous access |
| **M3.11-06** | Testing buffer | 🔴 HIGH | 1h | ⏳ | Sprint rule |

**Total:** 8h

### Assessment Flow

```
User lands on /gtm
    ↓
Bobo: "Hey! I'm Bobo. Want a free GTM health check? First, tell me about yourself..."
    ↓
Collects: Name, Company, Email, Role
    ↓
Bobo asks 8-10 GTM questions conversationally
    ↓
Bobo: "Analyzing your GTM setup..."
    ↓
Delivers report: Overall score + dimension breakdown + 3 recommendations
```

### Assessment Dimensions

1. **ICP Clarity** - How well-defined is the ideal customer?
2. **Channel Fit** - Are you where your customers are?
3. **Metrics** - Do you know what's working?
4. **Positioning** - Is your value prop clear?

### Success Criteria

- [ ] Assessment feels like a natural conversation (not a form)
- [ ] Completes in < 5 minutes
- [ ] Report provides actionable insights (not generic)
- [ ] Contact info captured for follow-up

### Files to Create

- `app/gtm/page.tsx` - Public chat interface (no auth)
- `lib/gtm/system-prompt.ts` - GTM Health Check Bobo persona
- `lib/gtm/scoring.ts` - Assessment scoring logic
- `supabase/migrations/YYYYMMDD_gtm_assessments.sql` - Store results

---

## 🎨 M3.12: Chat UX Enhancements (Dogfooding Quality-of-Life)

**Status:** 📝 Planned
**Priority:** 🔴 HIGH (dogfooding blockers)
**Estimate:** 15h total (8 tasks)
**Goal:** Essential UX features identified during dogfooding to match Claude/ChatGPT usability

### Background

During active dogfooding of Bobo, several UX gaps were identified that impact daily usability:
1. No way to edit a sent message and retry (must retype entire message)
2. Can't add documents (PDFs, text files, images) to chat context
3. No GitHub integration for pulling repo context
4. Can't see what files exist in advisory folders for projects

### Task Breakdown

| ID | Task | Priority | Estimate | Status | Notes |
|----|------|----------|----------|--------|-------|
| **M3.12-01** | Message editing UI component | 🔴 HIGH | 2h | ⏳ | Edit button on user messages, inline editing mode |
| **M3.12-02** | Edit/retry API endpoint | 🔴 HIGH | 1.5h | ⏳ | Regenerate from edited message, preserve history |
| **M3.12-03** | Document upload modal (multi-type) | 🔴 HIGH | 2h | ⏳ | Accept PDF, TXT, MD, images in chat input |
| **M3.12-04** | Document processing pipeline | 🔴 HIGH | 3h | ⏳ | PDF text extraction, image OCR/vision, file chunking |
| **M3.12-05** | GitHub repo context integration | 🟡 MEDIUM | 3h | ⏳ | Add GitHub repo as context source, file tree + content |
| **M3.12-06** | Advisory folder browser component | 🔴 HIGH | 2h | ⏳ | Tree view of files in project's advisory folder |
| **M3.12-07** | Quick file reference from folder view | 🟡 MEDIUM | 1h | ⏳ | Click file → inject into chat context or copy path |
| **M3.12-08** | Testing buffer | 🔴 HIGH | 0.5h | ⏳ | Sprint rule |

**Total:** 15h

### Feature Details

#### F1: Message Editing & Retry

Like Claude and ChatGPT, users should be able to:
- Click an edit icon on any sent user message
- Edit the message text inline
- Submit to regenerate the assistant response from that point
- Previous response is replaced (not appended)

**Files to modify:**
- `components/ai-elements/message.tsx` - Add edit mode for user messages
- `app/api/chat/route.ts` - Handle edit/regenerate requests
- `lib/ai/claude-client.ts` - Support message replacement

#### F2: Document Attachments

Upload documents directly into chat context:
- **PDF:** Extract text via pdf-parse or similar
- **Text/Markdown:** Direct injection
- **Images:** Send to Claude vision for description, or inject as base64

**Files to create/modify:**
- `components/ai-elements/document-upload.tsx` - Upload UI
- `lib/documents/processor.ts` - Parse different file types
- `app/api/documents/process/route.ts` - Server-side processing

#### F3: GitHub Integration

Pull context from GitHub repositories:
- Enter repo URL or select from connected repos
- Fetch file tree and selected file contents
- Inject as context for chat

**Files to create:**
- `lib/github/client.ts` - GitHub API wrapper
- `components/github/repo-browser.tsx` - Repo selection UI
- `app/api/github/fetch/route.ts` - Fetch repo contents

#### F4: Advisory Folder Browser

For projects linked to advisory folders:
- Show a file tree of the advisory folder contents
- Click to preview file
- Quick action to reference file in chat

**Files to create/modify:**
- `components/advisory/folder-browser.tsx` - Tree view component
- `lib/advisory/file-list.ts` - List files in advisory folder
- Integrate into project detail view

### Success Criteria

- [ ] Can edit any user message and regenerate response
- [ ] Can upload PDF, TXT, MD, and image files to chat
- [ ] Can connect a GitHub repo and pull files as context
- [ ] Can see all files in an advisory project's folder
- [ ] Can reference a specific file from the folder browser

### Dependencies

- M3.8 (Advisory Projects) - folder browser needs advisory project system
- Claude SDK vision capabilities for image processing

---

## 🧠 M3.13: Thinking Partner Foundation (Critical Path)

**Status:** 📝 Planned
**Estimate:** 15 hours (1 sprint)
**Priority:** 🔴 HIGH - **Should be completed BEFORE M3.10 (Knowledge Graph)**
**Target:** Q1 2025

### Strategic Context

**Origin:** Critical review of "Bobo as Thinking Partner" architecture (Dec 9, 2025) with 4 sub-agents analyzing:
1. Schema design
2. Product vision
3. Implementation plan
4. Papr AI comparison

**Key Insight:** The proposed knowledge graph architecture (4 loops, Louvain clustering, entity extraction) is **premature optimization**. The real value comes from capturing **thinking processes** (questions, decisions, insights) as first-class entities.

**Core Finding:**
> "LLMs already do graph-like reasoning. The bottleneck isn't graph structure—it's what gets into the context window. Build the primitives first, defer the infrastructure."

### Why M3.13 Before M3.10?

| Approach | Effort | Value |
|----------|--------|-------|
| **M3.13 (Primitives)** | 15h | 80% of "thinking partner" value |
| **M3.10 (Knowledge Graph)** | 28.5h | 20% additional value |

**Recommendation:** Complete M3.13 and use it for 3 months. Then decide if M3.10's graph infrastructure is needed. It probably won't be.

### The Simpler Architecture

Instead of 4 loops + knowledge graph:

```
┌─────────────────────────────────────────────────────────────────┐
│  memory_entries (existing)                                       │
│  + memory_type   ← 'fact' | 'question' | 'decision' | 'insight' │
│  + tags          ← Emergent domains                              │
│  + thread_id     ← Temporal continuity                           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  ENHANCED SEARCH (Already Exists!)                               │
│  • 45% vector, 15% BM25, 20% recency, 10% frequency, 10% conf   │
│  + NEW: Filter by memory_type                                    │
│  + NEW: Boost by matching tags                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  "RELATED THINKING" PROMPT                                       │
│  On new question:                                                │
│  1. Search memory_type='question' with high similarity          │
│  2. If match > 0.8: "You asked something similar before..."     │
│  3. Claude does the cross-domain reasoning                      │
└─────────────────────────────────────────────────────────────────┘
```

### Sprint Tasks

| ID | Task | Priority | Estimate | Status | Notes |
|----|------|----------|----------|--------|-------|
| **M3.13-01** | Add `memory_type` column to memory_entries | 🔴 HIGH | 2h | ⏳ | 'fact' \| 'question' \| 'decision' \| 'insight' |
| **M3.13-02** | Add `tags` array column to memory_entries | 🔴 HIGH | 2h | ⏳ | TEXT[], enables emergent domains without clustering |
| **M3.13-03** | Create `record_question` agent tool | 🔴 HIGH | 1.5h | ⏳ | Captures open questions with status: 'open' \| 'answered' |
| **M3.13-04** | Create `record_decision` agent tool | 🔴 HIGH | 1.5h | ⏳ | Captures decisions with rationale, alternatives_considered |
| **M3.13-05** | Create `record_insight` agent tool | 🔴 HIGH | 1h | ⏳ | Captures insights with optional source_question_id |
| **M3.13-06** | Add `thread_id` column for thought threads | 🟡 MED | 2h | ⏳ | Groups related thinking over time |
| **M3.13-07** | Implement "similar questions" prompt | 🔴 HIGH | 3h | ⏳ | On new question, search memory_type='question', surface similar |
| **M3.13-08** | Testing buffer | 🔴 HIGH | 2h | ⏳ | Sprint rule |

**Total:** 15h

### Schema Changes

```sql
-- M3.13-01: Memory types for thinking capture
ALTER TABLE memory_entries ADD COLUMN memory_type TEXT
  DEFAULT 'fact'
  CHECK (memory_type IN ('fact', 'question', 'decision', 'insight'));

-- M3.13-02: Tags for emergent domains (no clustering algorithm needed)
ALTER TABLE memory_entries ADD COLUMN tags TEXT[] DEFAULT ARRAY[]::TEXT[];
CREATE INDEX idx_memory_tags ON memory_entries USING gin(tags);

-- M3.13-06: Thought threads for temporal continuity
ALTER TABLE memory_entries ADD COLUMN thread_id UUID REFERENCES thought_threads(id);

CREATE TABLE thought_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  title TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Agent Tools Specification

#### M3.13-03: `record_question`

```typescript
{
  name: 'record_question',
  description: 'Capture an open question the user is exploring. Use when user asks strategic or exploratory questions.',
  parameters: {
    content: 'The question being asked',
    context: 'Why this question arose',
    tags: 'Optional tags (e.g., ["product", "strategy"])',
    thread_id: 'Optional thread to link to'
  }
}
```

#### M3.13-04: `record_decision`

```typescript
{
  name: 'record_decision',
  description: 'Capture a decision the user has made. Use when user explicitly decides something.',
  parameters: {
    content: 'The decision made',
    rationale: 'Why this decision was made',
    alternatives_considered: 'Other options that were rejected',
    tags: 'Optional tags'
  }
}
```

#### M3.13-05: `record_insight`

```typescript
{
  name: 'record_insight',
  description: 'Capture an insight or learning. Use when user has a realization or learns something.',
  parameters: {
    content: 'The insight',
    source_question_id: 'Optional: question this insight answers',
    tags: 'Optional tags'
  }
}
```

### "Similar Questions" Flow

When user asks a question:

1. **Detect question type:**
   - Strategic: "How should I...?", "What's the best way to...?"
   - Exploratory: "I wonder if...", "Could we...?"

2. **Search existing questions:**
   ```sql
   SELECT * FROM memory_entries
   WHERE memory_type = 'question'
     AND user_id = :user_id
     AND 1 - (embedding <=> :query_embedding) > 0.8
   ORDER BY similarity DESC
   LIMIT 3;
   ```

3. **Surface related thinking:**
   ```
   "You asked something similar 4 months ago about MyTab:
   'How do I evaluate founder-market fit?'

   Here's what you decided then: [decision]
   And what you learned: [insight]"
   ```

4. **Claude does the reasoning** - connects past thinking to current question

### Success Criteria

- [ ] Can capture questions, decisions, and insights as distinct memory types
- [ ] Can tag memories for emergent domain grouping
- [ ] Can link related thinking via thread_id
- [ ] When asking a strategic question, Bobo surfaces similar past questions
- [ ] Related decisions and insights are included in context

### What This Enables (Without Graph Infrastructure)

| Use Case | How It Works |
|----------|--------------|
| "Show me my decisions about pricing" | Search `memory_type='decision'` + tag boost for 'pricing' |
| "What have I learned about PMF?" | Search `memory_type='insight'` + 'pmf' tag or semantic match |
| "I'm thinking about X again" | Similar questions prompt surfaces prior exploration |
| "Connect my MyTab learning to this" | Claude already does this with good context |

### Why Tags > Clustering

| Approach | Effort | Value | Scale Needed |
|----------|--------|-------|--------------|
| **Tags** (M3.13) | 2h | Full domain organization | Works at any scale |
| **Louvain Clustering** (M3.10) | 10-15h | Auto-discovers domains | Needs 200+ entities |

At current scale (~100 entities), tags work better:
- User/agent naturally tag: `['advisory', 'sales', 'swiftcheckin']`
- Emergent domains appear: "I keep tagging things with #product-strategy"
- No algorithm needed

### Dependencies

- M3.5 (Memory Tools) - extend existing `remember_fact` pattern
- M3.6 (Enhanced Search) - reuse `enhanced_memory_search` with type filter

### Deferred to M3.10 (Only if Needed)

| Feature | Why Defer |
|---------|-----------|
| `nodes` and `edges` tables | Search works fine at current scale |
| Entity extraction pipeline | Noisy, expensive, requires entity resolution |
| Louvain community detection | Tags work better for <200 entities |
| Loop C / Loop D separation | Just improve existing search ranking |

### Milestone Totals

| Metric | Value |
|--------|-------|
| Tasks | 8 |
| High Priority | 6 |
| Total Estimate | 15h |
| Sprints | 1 |

### Post-M3.13 Decision Gate

After completing M3.13, use it for 3 months. Then answer:

1. **Are tags insufficient for domain organization?** → Consider clustering
2. **Is semantic search missing explicit relationships?** → Consider graph
3. **Are multi-hop queries common?** → Consider M3.10

If all answers are "no", M3.10 can be indefinitely deferred.

---

## 🧭 MILESTONE 5: Cognitive Layer & Living Documentation (Deferred)

**Status:** 📝 Deferred (After M3.7)
**Target:** When cross-project querying feels limited
**Trigger:** "Implement when frustrated by its absence"
**Focus:** Turn Bobo into a true "Memory Palace" with project living docs, hierarchical summaries, and a lightweight knowledge graph.
**Architecture Note:** See `docs/context-memory-vision.md` for the conceptual design of the Cognitive Layer (Project Brains, hierarchical summaries, fact graph, executive briefs).

### 5.1 Living Documentation & Hierarchical Summaries

| ID | Feature | Priority | Estimate | Status |
|----|---------|----------|----------|--------|
| M5-1 | Per-project living doc entity (status, decisions, risks) | 🟡 MEDIUM | 4h | ⏳ |
| M5-2 | Background updater from chats/files (session → daily → weekly) | 🟡 MEDIUM | 6h | ⏳ |
| M5-3 | “Project Brain” overview tab in UI | 🟡 MEDIUM | 4h | ⏳ |
| M5-4 | Weekly review view with drill-down to summaries/logs | 🟡 MEDIUM | 4h | ⏳ |

### 5.2 Knowledge Graph & Executive View

| ID | Feature | Priority | Estimate | Status |
|----|---------|----------|----------|--------|
| M5-5 | Fact extraction job (subject/predicate/object) from chats | 🟡 MEDIUM | 6h | ⏳ |
| M5-6 | Fact browser per project (decisions, architecture, constraints) | 🟡 MEDIUM | 4h | ⏳ |
| M5-7 | Cross-project graph queries (e.g. “Supabase decisions”) | 🟡 MEDIUM | 4h | ⏳ |
| M5-8 | Weekly executive brief using summaries + facts | 🟡 MEDIUM | 4h | ⏳ |

---

## 🔮 FUTURE: Production & Scale (If SaaS Pivot)

**Status:** 📝 Not Planned - Personal Tool Focus
**Trigger:** Only if decision made to pivot to multi-user SaaS after extended dogfooding (3-6 months minimum)

### Why Deferred Indefinitely

Bobo is a personal internal tool. These features would only be needed if:
1. Extended dogfooding (3-6 months) proves the tool is valuable
2. Explicit decision made to offer Bobo to other users
3. Business model and target market defined

### Preserved Tasks (From Original M4)

#### Authentication & Multi-User

| ID | Feature | Priority | Estimate | Status |
|----|---------|----------|----------|--------|
| FUT-1 | OAuth integration (Google, GitHub) | - | 4h | 📝 |
| FUT-2 | Email/password authentication | - | 3h | 📝 |
| FUT-3 | User management UI | - | 3h | 📝 |
| FUT-4 | Row-level security (RLS) in Supabase | - | 3h | 📝 |
| FUT-5 | Update all queries to use `user_id` | - | 2h | 📝 |

#### Team Workspaces

| ID | Feature | Priority | Estimate | Status |
|----|---------|----------|----------|--------|
| FUT-6 | Create `teams` and `team_members` tables | - | 2h | 📝 |
| FUT-7 | Team creation and invitation flow | - | 4h | 📝 |
| FUT-8 | Shared projects within teams | - | 3h | 📝 |
| FUT-9 | Permission system (view/edit/admin) | - | 4h | 📝 |

#### Analytics & Monitoring

| ID | Feature | Priority | Estimate | Status |
|----|---------|----------|----------|--------|
| FUT-10 | Usage analytics dashboard | - | 4h | 📝 |
| FUT-11 | Cost tracking per user | - | 3h | 📝 |
| FUT-12 | Token usage history | - | 2h | 📝 |
| FUT-13 | Error tracking (Sentry integration) | - | 2h | 📝 |
| FUT-14 | Performance monitoring (APM) | - | 3h | 📝 |

#### DevOps & Infrastructure

| ID | Feature | Priority | Estimate | Status |
|----|---------|----------|----------|--------|
| FUT-15 | CI/CD pipeline (GitHub Actions) | - | 3h | 📝 |
| FUT-16 | Automated database backups | - | 2h | 📝 |
| FUT-17 | Staging environment | - | 2h | 📝 |
| FUT-18 | API versioning strategy | - | 2h | 📝 |
| FUT-19 | Load testing and benchmarks | - | 4h | 📝 |
| FUT-20 | Rate limiting middleware | - | 2h | 📝 |

**Note:** These are preserved for reference, not scheduled for implementation.

---

## 🚀 Advanced Agent Features (Post-M4, Pain-Driven)

**Status:** 📝 Deferred
**Trigger:** After M4 Agent SDK is implemented, if advanced features become necessary

> These features extend M4's Agent SDK capabilities. Only implement when the basic agent feels limiting.

### Code Execution Sandbox (If Needed)

| ID | Feature | Priority | Estimate | Status |
|----|---------|----------|----------|--------|
| ADV-1 | Sandboxed code execution (Docker/WebContainers) | 🟢 LOW | 8h | 📝 |
| ADV-2 | File system isolation (temp directories, cleanup) | 🟢 LOW | 4h | 📝 |
| ADV-3 | Output streaming (real-time stdout/stderr) | 🟢 LOW | 3h | 📝 |

### Multi-Provider Tool Support (If Needed)

| ID | Feature | Priority | Estimate | Status |
|----|---------|----------|----------|--------|
| ADV-4 | Unified tool definitions for non-Claude models | 🟢 LOW | 4h | 📝 |
| ADV-5 | OpenAI native tool calling | 🟢 LOW | 4h | 📝 |
| ADV-6 | Gemini native tool calling | 🟢 LOW | 4h | 📝 |

### Advanced Agent Behaviors (If Needed)

| ID | Feature | Priority | Estimate | Status |
|----|---------|----------|----------|--------|
| ADV-7 | Multi-agent orchestration (sub-agents) | 🟢 LOW | 8h | 📝 |
| ADV-8 | MCP server integration | 🟢 LOW | 6h | 📝 |
| ADV-9 | Knowledge graph integration (with M5) | 🟢 LOW | 4h | 📝 |

**Note:** Claude Agent SDK provides most capabilities out of the box. Only build custom extensions when SDK limitations are felt.

---

## 🔬 RESEARCH & SPIKES

**Items that need investigation before committing to implementation**

| ID | Research Topic | Questions to Answer | Estimate | Status | Priority |
|----|---------------|---------------------|----------|--------|----------|
| R-1 | Supermemory.ai evaluation | Does it meet our needs? Pricing? API limits? | 2h | ⏳ | 🟡 MEDIUM |
| R-2 | Vector database alternatives | Should we use pgvector or dedicated DB (Pinecone, Weaviate)? | 2h | ⏳ | 🟡 MEDIUM |
| R-3 | Chunking strategies | What's optimal chunk size? Overlap? Semantic vs fixed? | 3h | ⏳ | 🟡 MEDIUM |
| R-4 | Embedding model comparison | OpenAI vs Cohere vs open-source? Cost vs accuracy? | 2h | ⏳ | 🟢 LOW |
| R-5 | React Query vs SWR | Should we add data fetching library? | 2h | ⏳ | 🟢 LOW |
| R-6 | WebSocket for streaming | Would WebSockets improve performance vs SSE? | 2h | ⏳ | 🟢 LOW |
| R-7 | Web search vs deep research orchestration | When should Bobo use quick web search vs multi-step deep research? How does this interact with RAG and model context limits? | 3h | ⏳ | 🟡 MEDIUM |
| R-8 | Native model tool-calling for search | How can we leverage built-in tools (e.g. Gemini’s Google Search, OpenAI browsing) alongside Perplexity, and route/tool-call intelligently via the AI Gateway? | 3h | ⏳ | 🟡 MEDIUM |

---

## 🐛 BUG BACKLOG

**Known bugs that are not blocking V1 launch**

| ID | Bug | Severity | Impact | Workaround | Status |
|----|-----|----------|--------|------------|--------|
| BUG-1 | Tokenizer fallback warnings in console | 🟢 LOW | Dev only, expected behavior | N/A - working as designed | 📝 Not a bug |
| BUG-2 | Non-functional buttons in ProjectHeader | 🟡 MEDIUM | False affordances, bad UX | Implement or remove | ✅ Fixed |

---

### BUG-2: Non-Functional Buttons in ProjectHeader

**Description:**
The `ProjectHeader` component (`components/project/project-header.tsx`) displays 5 action buttons, but only 1 is functional:
- ✅ Settings button - works (links to project settings)
- ❌ Share button - no onClick handler
- ❌ Copy link button - no onClick handler
- ❌ Export button - no onClick handler
- ❌ More options button - no onClick handler

**Impact:**
- **False affordances** - buttons look clickable but do nothing
- **User frustration** - users click and nothing happens
- **Accessibility violation** (WCAG 2.1) - screen readers announce clickable buttons that don't work
- **Dead code** - taking up DOM/visual space with no benefit

**Root Cause:**
Buttons were added as UI placeholders but never implemented. Common anti-pattern in prototyping that made it to production.

**Solution Implemented:**
1. ✅ Removed dead buttons (Share, Export, More options)
2. ✅ Kept Settings button (functional)
3. ✅ Implemented Copy Link button with toast notification

**Code Changes:**
- Removed 3 non-functional buttons
- Added `navigator.clipboard.writeText()` to Copy button
- Added `toast.success()` feedback
- Cleaned up imports (removed unused icons)

**Testing:**
- [x] Copy button copies project URL to clipboard
- [x] Toast notification appears on copy
- [x] Settings button still works
- [x] No console errors
- [x] Keyboard navigation works
- [x] Screen reader announces correctly

**Estimated Effort:** 10 minutes
**Assigned To:** Immediate fix (completed)
**Milestone:** V1 Polish
**Priority:** 🟡 MEDIUM (UX improvement)
**Status:** ✅ Fixed (2025-01-23)
**Related:** UX polish, accessibility compliance

---

## 📈 NICE-TO-HAVE FEATURES

**User-requested or brainstormed features with unclear priority**

| ID | Feature | Description | User Value | Complexity | Status |
|----|---------|-------------|------------|------------|--------|
| NTH-1 | Chat export (Markdown) | Export conversation as .md file | 🟡 MEDIUM | 🟢 LOW (2h) | ⏳ Backlog |
| NTH-2 | Rename chat | Inline edit chat title in sidebar | 🟡 MEDIUM | 🟢 LOW (1h) | ✅ Done (Nov 24) |
| NTH-3 | Delete chat from sidebar | Delete chat with confirmation dialog | 🟡 MEDIUM | 🟢 LOW (1h) | ✅ Done (Nov 24) |
| NTH-4 | Chat search | Search across all chat messages | 🟡 MEDIUM | 🟡 MEDIUM (4h) | ⏳ Backlog |
| NTH-5 | Dark mode toggle | Manual dark/light theme switch | 🟢 LOW | 🟢 LOW (1h) | ⏳ Backlog |
| NTH-6 | Keyboard shortcuts | Vim-style or Cmd+K navigation | 🟡 MEDIUM | 🟡 MEDIUM (3h) | ⏳ Backlog |
| NTH-7 | Conversation templates | Pre-defined prompts for common tasks | 🟡 MEDIUM | 🟢 LOW (2h) | ⏳ Backlog |
| NTH-8 | Message editing | Edit previous user messages | 🟡 MEDIUM | 🟡 MEDIUM (3h) | ⏳ Backlog |
| NTH-9 | Voice input | Speech-to-text for messages | 🟢 LOW | 🔴 HIGH (6h) | ⏳ Backlog |
| NTH-10 | Image generation | DALL-E integration | 🟢 LOW | 🟡 MEDIUM (4h) | ⏳ Backlog |
| NTH-11 | Three-dots options menu | Chat actions menu with Move to Project, Archive, Report, Delete (ChatGPT-style) | 🟡 MEDIUM | 🟡 MEDIUM (4-5h) | 🚧 Partial (Nov 24) |
| NTH-12 | Project sharing | Share project via link with permissions (view/edit) | 🟡 MEDIUM | 🔴 HIGH (8h) | ⏳ Backlog |
| NTH-13 | Project export | Export project data (chats, files, settings) as JSON/ZIP | 🟡 MEDIUM | 🟡 MEDIUM (3h) | ⏳ Backlog |
| NTH-14 | User profile preview | "What AI sees" view in profile settings | 🟢 LOW | 🟢 LOW (1h) | ⏳ Backlog |

**Recently Implemented (Nov 24, 2025):**
- ✅ **NTH-2 & NTH-3:** Implemented via right-click context menu on chat items
  - Rename chat with validation
  - Delete chat with confirmation
  - Integrated into `components/chat/chat-context-menu.tsx`
- 🚧 **NTH-11 (Partial):** Context menu created with Move to Project and Archive placeholder
  - Move to Project: ✅ Done
  - Archive: UI exists, backend pending
  - Report: Not implemented (deferred)
  - Delete: ✅ Done

### NTH-11: Three-Dots Options Menu

**Description:**
Implement a ChatGPT-style three-dots menu in the chat interface that provides quick access to chat management actions. The menu should be accessible from the chat header and include the following options:

**Features:**
1. **Move to Project** - Submenu to select destination project
   - Display list of available projects
   - Update chat's project association via API
   - Show success toast notification

2. **Archive** - Archive the current conversation
   - Hide chat from main view but keep accessible
   - Add `archived` boolean field to chats table
   - Filter archived chats in sidebar (with toggle to show)

3. **Report** - Report issues or inappropriate content
   - Open modal with report form
   - Categories: Bug, Inappropriate Content, Feedback
   - Submit to API endpoint or email notification

4. **Delete** - Permanently delete the conversation
   - Show confirmation dialog (styled in red like ChatGPT)
   - Cascade delete messages
   - Redirect to home after deletion
   - Success toast notification

**UI/UX Requirements:**
- Menu triggered by three-dots icon (⋮) in chat header
- Dropdown menu using shadcn/ui DropdownMenu component
- "Delete" option styled in red/destructive color
- "Move to Project" has arrow indicator (→) for submenu
- Icons for each menu item
- Keyboard navigation support
- Click outside to close

**Technical Implementation:**
1. Create `ChatOptionsMenu` component in `components/chat/`
2. Add to chat interface header (app/page.tsx or dedicated chat header component)
3. Database migration: add `archived` column to `chats` table
4. API endpoints:
   - PATCH `/api/chats/[id]` - update archived status (already exists, extend)
   - POST `/api/reports` - new endpoint for report submissions
5. Integrate with existing DELETE `/api/chats/[id]` endpoint
6. Use existing PATCH `/api/chats/[id]/project` for move functionality

**Dependencies:**
- shadcn/ui DropdownMenu, AlertDialog components
- Existing chat API endpoints (mostly already built)
- Icon library (Lucide React)

**Estimated Effort:** 4-5 hours
- Component creation: 1.5h
- Archive functionality (DB + API): 1h
- Report modal and endpoint: 1.5h
- Testing and polish: 1h

**Priority Justification:**
- Improves chat management UX
- Common pattern in modern chat interfaces
- Low technical risk (mostly UI work)
- Enhances existing features rather than adding new complexity

**Design Reference:**
See ChatGPT's three-dots menu for visual reference (provided in feature request)

---

### NTH-14: User Profile Preview ("What AI Sees")

**Description:**
Add a "Preview" tab to the `/settings/profile` page that shows users exactly how their profile data is formatted and injected into the AI's system prompt. This provides transparency and helps users understand what context the AI has about them.

**Features:**
1. **Preview Tab** - Toggle between "Edit" and "Preview" modes
   - Edit mode: Standard form fields (current implementation)
   - Preview mode: Read-only formatted view of system prompt injection

2. **Formatted System Prompt Display**
   - Shows exact text: `### ABOUT THE USER`
   - Displays each populated field with its label (BIO, BACKGROUND, PREFERENCES, TECHNICAL CONTEXT)
   - Empty fields are not shown (matches actual injection logic)
   - Syntax-highlighted or styled as code block

3. **Token Usage Indicator**
   - Show approximate token count: "Your profile uses ~87 tokens"
   - Visual progress bar if token budget exists (e.g., 87/500 tokens = 17%)
   - Color-coded: green (safe), yellow (approaching limit), red (over limit)

4. **Live Preview**
   - Preview updates in real-time as user types in Edit mode (optional enhancement)
   - Or: Refresh preview when switching to Preview tab

**UI/UX Requirements:**
- Use shadcn/ui Tabs component for Edit/Preview toggle
- Preview shown in monospace font (`<pre>` or code block styling)
- Match dark mode styling
- Responsive design (works on mobile)
- Clear visual hierarchy

**Example Preview Display:**
```
┌─────────────────────────────────────┐
│ This is what the AI sees:           │
│                                     │
│ ### ABOUT THE USER                 │
│                                     │
│ BIO:                                │
│ Full-stack developer at TechCorp    │
│                                     │
│ BACKGROUND:                         │
│ 10 years experience with React...   │
│                                     │
│ PREFERENCES:                        │
│ Prefer TypeScript, explain like I'm│
│ 5                                   │
│                                     │
│ TECHNICAL CONTEXT:                  │
│ Expert: TypeScript, React           │
│ Learning: Rust                      │
│                                     │
│ Token Usage: 87 / 500 (17%)         │
│ ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │
└─────────────────────────────────────┘
```

**Technical Implementation:**
1. Add `generatePreview()` function in `app/settings/profile/page.tsx`
   - Mirrors the formatting logic from `app/api/chat/route.ts` (lines 286-293)
   - Returns formatted string with section header and populated fields only

2. Add token counting (approximate):
   - Simple: `Math.ceil(previewText.length / 4)` (heuristic)
   - Advanced: Use `gpt-tokenizer` package (more accurate)

3. Add Tabs component:
   ```tsx
   <Tabs defaultValue="edit">
     <TabsList>
       <TabsTrigger value="edit">Edit</TabsTrigger>
       <TabsTrigger value="preview">Preview</TabsTrigger>
     </TabsList>
     <TabsContent value="edit">
       {/* Existing form fields */}
     </TabsContent>
     <TabsContent value="preview">
       <pre className="bg-muted p-4 rounded-lg font-mono text-sm">
         {generatePreview()}
       </pre>
       <p className="text-sm text-muted-foreground mt-2">
         Token count: ~{calculateTokens(generatePreview())} tokens
       </p>
     </TabsContent>
   </Tabs>
   ```

**Dependencies:**
- shadcn/ui Tabs component (likely already installed)
- Optional: `gpt-tokenizer` package (already used in project)

**Estimated Effort:** 1 hour
- Generate preview function: 15m
- Tabs UI integration: 30m
- Token counting display: 15m

**Priority Justification:**
- **Low Priority** - Nice-to-have, not essential for functionality
- Users can test by asking AI "what do you know about me?"
- Adds transparency but increases UI complexity
- Better suited for after M3 core features are complete

**When to Build:**
- After M3-02 and M3-03 are complete
- If users request it during dogfooding
- When implementing token budget limits (M3-9)
- During "UX polish" sprint

**Alternative Approaches:**
1. **Debug Panel in Chat** - Add a collapsible "Context Injected" panel in chat interface showing all system prompt components
2. **Settings Tooltip** - Simple tooltip on save button: "This creates: ### ABOUT THE USER..."
3. **Test Chat Button** - "Test Profile" button that opens a test chat with profile context pre-loaded

**User Value:**
- **Power Users:** Love seeing exactly what's happening under the hood
- **Beginners:** Helps them understand how profile affects AI responses
- **Debugging:** Quickly identify if profile is causing issues
- **Confidence:** Transparency builds trust in the system

---

## 📊 BACKLOG METRICS

### Distribution by Priority

```
🔴 CRITICAL:  6 items (V1 must-haves)
🟡 HIGH:      50 items (M2/M3 core features + deferred improvements)
🟠 MEDIUM:    10 items (Nice-to-haves)
🟢 LOW:       15 items (Future improvements)
```

### Distribution by Milestone

```
V1 (Critical):     6 items  (6-8 hours)      ✅ Complete
Deferred (TD):     10 items (23-28 hours)
M2 (Intelligence): 18 items (3 weeks)        ✅ Complete
M3 (Memory):       28 items (52 hours)       🚧 79% Complete
M4 (Agent SDK):    10 items (25-35 hours)    🎯 Current Priority
M5 (Cognitive):    8 items  (36 hours)       📝 Deferred
Future (SaaS):     20 items (~48 hours)      📝 Not Planned
Advanced Agent:    9 items  (~45 hours)      📝 Deferred
Research:          8 items  (18 hours)
Nice-to-Have:      14 items (35-40 hours)
```

### Total Backlog Size

**Total Items:** 139
**Total Estimated Effort:** ~18-20 weeks (full-time)

---

## 🗂 CARD STATES & STATUS LEGEND

### Card Groups & Overall State

These are the major “cards” you can think of as lanes on a Kanban board:

| Card Group                  | Current State    | Notes                            |
|----------------------------|------------------|----------------------------------|
| V1 Critical Path           | ✅ Complete      | Persistence foundation shipped   |
| V1.1 Bug Fixes & Polish    | ✅ Complete      | Viewport bug, E2E, UX polish    |
| M2 Project Intelligence    | ✅ Complete      | Double-Loop + citations shipped |
| Deferred Tech Debt (TD-*)  | 🟡 Mixed         | Some DONE, some Planned         |
| M3 User Profile & Bio      | 🚧 79% Complete  | 22/28 tasks, Phase 4 planned    |
| M4 Agent SDK               | ✅ Complete      | 10/10 tasks in 10h (Day 1!)     |
| M5 Cognitive Layer         | 📝 Deferred      | Pain-driven implementation      |
| Future (If SaaS)           | 📝 Not Planned   | Multi-user, teams, analytics    |
| Advanced Agent             | 📝 Deferred      | Extends M4 if needed            |
| Research & Spikes (R-*)    | 📝 Planned       | To inform decisions             |
| Nice-to-Haves (NTH-*)      | 📝 Backlog       | UX & feature ideas              |

### Status Legend (Per-Item “Card” States)

Each row in the backlog tables (V1, TD, M2, M3, M4, M5, Research, NTH) is treated as a **card** with a simple state:

| Status Text / Icon | Meaning                                  |
|--------------------|------------------------------------------|
| 📝 Planned          | Defined but not yet scheduled            |
| ⏳ Backlog          | In backlog, waiting for prioritization   |
| 🚧 In Progress      | Actively being worked on                 |
| ✅ Done             | Implemented and verified                 |

Milestone‑level states (e.g. “✅ Complete”, “📝 Backlog”) are summaries of the states of their child cards. When grooming, update the per‑item Status first, then adjust the milestone’s summary state if needed.

---

## 📱 MOBILE OPTIMIZATION (Completed Nov 24, 2025)

**Status:** ✅ Complete
**Effort:** 4 hours
**Goal:** Optimize entire app for mobile devices (320px - 768px viewports)

---

## 📱 MOBILE UX SPRINT v1.3.0 (Completed Nov 25, 2025)

**Status:** ✅ Complete
**Effort:** 3-4 hours
**Goal:** Enhanced mobile experience with Bobo character prominence and sidebar redesign

### v1.3.0 Mobile UX Tasks

| ID | Feature | Priority | Status | Notes |
|----|---------|----------|--------|-------|
| MUX-1 | Change greeting to "Tell Bobo Anything" | 🔴 HIGH | ✅ Done | Replaced time-based greeting |
| MUX-2 | Change placeholder to "What's on your mind?" | 🔴 HIGH | ✅ Done | Avoids redundancy with greeting |
| MUX-3 | Make Bobo character 4x larger | 🔴 HIGH | ✅ Done | w-96 h-96 (384px), md:w-[32rem] (512px) |
| MUX-4 | Reduce Bobo-greeting spacing on mobile | 🟡 MEDIUM | ✅ Done | mb-0 on mobile, mb-2 on desktop |
| MUX-5 | Redesign mobile sidebar as drawer panel | 🔴 HIGH | ✅ Done | 85% width, max 320px, backdrop overlay |
| MUX-6 | Improve sidebar animation | 🟡 MEDIUM | ✅ Done | Pure slide (0.2s), removed opacity fade |
| MUX-7 | Redesign footer to horizontal icon bar | 🔴 HIGH | ✅ Done | Home, Memory, Profile, Theme icons |
| MUX-8 | Add Bobo identity/personality system | 🔴 HIGH | ✅ Done | Triggers on "who is Bobo?" questions |
| MUX-9 | Fix accessibility (button semantics) | 🔴 HIGH | ✅ Done | Proper aria-labels, button elements |
| MUX-10 | Remove SVG black background | 🟡 MEDIUM | ✅ Done | Fixed bobo-character.svg |

**Deliverables:**
- ✅ Prominent Bobo character on welcome screen (512px on desktop)
- ✅ Friendly greeting "Tell Bobo Anything" with inviting placeholder
- ✅ 85% width mobile drawer with backdrop (max 320px)
- ✅ Smooth slide animation (0.2s) without clunky fade
- ✅ Horizontal footer bar with 44px touch targets
- ✅ Bobo personality that responds warmly to identity questions
- ✅ Full accessibility compliance (button semantics, aria-labels)

**Files Modified:**
- `components/chat/chat-interface.tsx` - Greeting, placeholder, Bobo size
- `components/ui/collapsible-sidebar.tsx` - Drawer redesign, animation, accessibility
- `components/ui/bobo-sidebar-option-a.tsx` - Footer bar redesign
- `app/api/chat/route.ts` - Bobo identity system prompt
- `public/bobo-character.svg` - Removed black background

**Bobo Identity System:**
```typescript
// Triggers on "who is Bobo?", "who are you?", etc.
const BOBO_IDENTITY_TRIGGER = `If the user asks "who is Bobo?"...
  "G'day! I'm Bobo - a friendly AI companion who lives for curiosity
   and connection. Picture me as a constellation creature made of
   interconnected nodes, with big curious eyes and a warm smile..."
`
```

### Mobile Optimization Tasks

| ID | Feature | Priority | Estimate | Status | Actual | Notes |
|----|---------|----------|----------|--------|--------|-------|
| MOB-1 | Add viewport meta tag and mobile CSS optimizations | 🔴 HIGH | 1h | ✅ Done | 1h | Safe area insets, touch scrolling |
| MOB-2 | Optimize main chat page for mobile | 🔴 HIGH | 1h | ✅ Done | 0.5h | Reduced padding, responsive spacing |
| MOB-3 | Optimize memory page for mobile | 🔴 HIGH | 1h | ✅ Done | 1h | Responsive cards, sections, summary |
| MOB-4 | Optimize modals and dialogs for mobile | 🔴 HIGH | 30m | ✅ Done | 0.5h | Max height, scrolling, close button |
| MOB-5 | Fix mobile sidebar blocking chat content | 🔴 CRITICAL | 30m | ✅ Done | 1h | Flex layout fix |

**Deliverables:**
- ✅ Proper viewport configuration with PWA support
- ✅ Touch-friendly button sizes (minimum 44x44px on mobile)
- ✅ Responsive layouts for all pages
- ✅ Mobile-optimized modals with dynamic viewport height
- ✅ Always-visible action buttons on mobile (no hover)
- ✅ Safe area support for notched devices (iPhone X+)
- ✅ Fixed critical layout issue (sidebar blocking chat)
- ✅ Comprehensive mobile optimization report

**Key Changes:**
- 11 files modified (layout, CSS, components)
- Build passing with zero warnings
- Mobile-first responsive patterns established
- Documentation: `docs/reports/MOBILE_OPTIMIZATION_REPORT.md`

---

## 🔄 BACKLOG GROOMING PROCESS

### Weekly Review Schedule
- **Every Monday:** Review V1 progress, reprioritize if needed
- **Every Friday:** Groom upcoming milestone, refine estimates
- **End of Milestone:** Retrospective, update backlog priorities

### Promotion Criteria (Moving items UP in priority)
1. **User requests** (3+ users ask for feature)
2. **Blocker discovered** (prevents other work)
3. **Technical debt impact** (slowing development)
4. **Competitive pressure** (others have feature)

### Demotion Criteria (Moving items DOWN)
1. **Low usage** (feature not used if built)
2. **Complexity creep** (estimate doubles)
3. **Dependencies unavailable** (blocked externally)
4. **Scope change** (product direction shifts)

### Purge Criteria (Removing items)
1. **No longer relevant** (superseded by other solution)
2. **Not aligned with vision** (doesn't fit product)
3. **Permanent blocker** (can't implement technically)
4. **Zero votes after 6 months** (no one wants it)

---

## 📝 CHANGELOG

| Date | Change | By |
|------|--------|-----|
| 2025-11-22 | Initial backlog created with M1-M4 breakdown | Claude Code |
| 2025-11-22 | Added TD-1 (verbose logging) and TD-2 (OpenAI parsing) to deferred | Claude Code |
| 2025-11-24 | M3-02 Complete: Hierarchical Memory Extraction (95% pre-existing, 5% integration, 2h actual vs 16h est) | Claude Code |
| 2025-11-22 | Documented V1 critical path (6 remaining tasks) | Claude Code |
| 2025-11-22 | Merged old product-backlog.md context management items (TD-6, TD-7) | Claude Code |
| 2025-11-22 | Consolidated to single PRODUCT_BACKLOG.md (archived old version) | Claude Code |
| 2025-01-23 | Added NTH-11: Three-dots options menu (Move to Project, Archive, Report, Delete) | Claude Code |
| 2025-01-23 | Added TD-8, TD-9, TD-10 from senior engineering review of viewport disappearing bug | Claude Code |
| 2025-01-23 | Fixed BUG-2: Removed non-functional buttons from ProjectHeader, implemented copy link | Claude Code |
| 2025-01-23 | M2 Phase 2 (Loop B) Complete: Vector search, hybrid RAG, embeddings implemented | Claude Code |
| 2025-01-23 | M2 Complete (100%): Inline citations with Perplexity-style source attribution | Claude Code |
| 2025-01-23 | v1.2.0 Polish Sprint Complete: E2E tests, background compression, CI/CD, improved UX | Claude Code |
| 2025-11-23 | Aligned V1/M2 status, added M3 governance tasks and M5 Cognitive Layer (living docs, summaries, knowledge graph) | GPT-5.1 Code |
| 2025-11-24 | Added M3-16/NTH-14: User profile preview ("What AI sees" view) with full implementation details | Claude Code |
| 2025-11-24 | M3-03 Sprint Complete: Claude-Style Memory UI with 6 features, 7 bugs fixed, 100% delivery | Claude Code |
| 2025-11-24 | Mobile Optimization Complete: 11 files optimized, critical layout fix, comprehensive responsive design | Claude Code |
| 2025-11-24 | M3-02 Model Optimization: Switched from GPT-4o-mini to Gemini 2.5 Flash Lite (56% cost reduction) | Claude Code |
| 2025-11-24 | M3-02 Identity Backload Complete: 25 memory entries created for user Sachee | Claude Code |
| 2025-11-24 | M3-02 RLS Fixes: Single-user MVP security policies implemented | Claude Code |
| 2025-11-24 | M3-02 Test Suite: 9/10 tests passing (extraction, deduplication, injection, RLS) | Claude Code |
| 2025-11-24 | Phase 3.1 UX/UI Polish Complete: Navigation consistency, chat context menu, mobile auto-close | Claude Code |
| 2025-11-24 | Chat Context Menu Implemented: Rename, Move to Project, Delete, Archive (placeholder) | Claude Code |
| 2025-11-24 | NTH-2 & NTH-3 Complete: Rename/Delete chat via right-click context menu | Claude Code |
| 2025-11-24 | Sidebar Auto-Refresh: URL monitoring with debounced refresh on chat creation | Claude Code |
| 2025-11-24 | Mobile Navigation Fix: Auto-close sidebar after navigation on mobile devices | Claude Code |
| 2025-11-24 | Bug Fix: Nested button hydration error in MemorySection component | Claude Code |
| 2025-11-24 | Documentation Update: Comprehensive product backlog refresh with 11 new changelog entries | Claude Code |
| 2025-11-25 | Added M6 Agentic Capabilities milestone (22 tasks, 4 phases, ~102h estimate) | Claude Code |
| 2025-11-25 | Deprecated docs/archive/product-roadmap.md - consolidated into this document | Claude Code |
| 2025-11-25 | v1.3.0 Mobile UX Sprint Complete: Bobo character prominence, drawer sidebar, footer bar | Claude Code |
| 2025-11-25 | Added Bobo identity/personality system (triggers on "who is Bobo?" questions) | Claude Code |
| 2025-11-25 | Mobile sidebar redesigned: 85% width drawer, backdrop overlay, pure slide animation | Claude Code |
| 2025-11-25 | Footer bar redesigned: Horizontal icon layout (Home, Memory, Profile, Theme) | Claude Code |
| 2025-11-25 | Accessibility fixes: Button semantics, aria-labels for hamburger and close buttons | Claude Code |
| 2025-11-25 | **STRATEGIC PIVOT**: Reframed Bobo as personal internal tool (not SaaS) | Claude Code |
| 2025-11-25 | Renamed M4 milestone to "Agent SDK" (Claude Agent SDK integration) | Claude Code |
| 2025-11-25 | Moved old M4 tasks (auth, teams, analytics) to "Future/If SaaS" section | Claude Code |
| 2025-11-25 | Deferred M5 (Knowledge Graph) to pain-driven implementation | Claude Code |
| 2025-11-25 | Removed SaaS success metrics from PROJECT_BRIEF.md | Claude Code |
| 2025-11-25 | Replaced M6 Agentic Capabilities with "Advanced Agent Features (Post-M4)" | Claude Code |
| 2025-11-26 | **M4 Agent SDK Complete**: 10/10 tasks in 10h (Day 1!), 61% under estimate | Claude Code |
| 2025-11-26 | Added Product Roadmap section with Gantt chart, velocity history, capability matrix | Claude Code |
| 2025-11-26 | Fixed Bug 2 (SAFETY_HOOKS empty): Connected PreToolUse hook to canUseTool() | Claude Code |
| 2025-11-26 | Updated all M4 tasks to ✅ Done with actual hours | Claude Code |
| 2025-11-27 | **Letta SDK Analysis Integration**: Added competitive analysis section comparing Bobo vs Letta | Claude Code |
| 2025-11-27 | Added M3-31: Description-driven extraction guidance (Letta learning) to Phase 4 | Claude Code |
| 2025-11-27 | Added M3.5 milestone: Agent Memory Tools (4 tasks, 11h) - remember_fact, update_memory, forget_memory, async extraction | Claude Code |
| 2025-11-27 | Updated roadmap: M4 ✅ → M3 Phase 4 → M3.5 → M5 (pain-driven) | Claude Code |
| 2025-11-27 | Updated metrics: 89 total tasks (was 78), 27h remaining for memory enhancements | Claude Code |
| 2025-11-27 | Documented Bobo's advantages over Letta: Hybrid search (RRF), Cross-project RAG, Citations, Token transparency | Claude Code |
| 2025-11-27 | **v1.3.1 Sidebar UX Enhancement**: Removed redundant header space, integrated toggle inline with content (ChatGPT-style pattern) | Claude Code |
| 2025-11-27 | Sidebar trigger now shown inline with ChatHeader and empty states (mobile + desktop collapsed state) | Claude Code |
| 2025-11-27 | **CPO Sprint Planning**: Deployed 3 sub-agents to analyze backlog status, Letta tasks, and M4/M5 strategy | Claude Code |
| 2025-11-27 | **SEQUENCING CHANGE**: M3.5 (Agent Memory) now executes BEFORE M3 Phase 4 (Polish) | Claude Code |
| 2025-11-27 | Rationale: Agent mode (M4) can't self-edit memory = trust gap ("I'll remember that" does nothing) | Claude Code |
| 2025-11-27 | Added M3.5-0: search_memory tool (prerequisite for update/forget operations) | Claude Code |
| 2025-11-27 | Added M3.5-5: Memory tool error handling (graceful failure recovery) | Claude Code |
| 2025-11-27 | Added M3.5-6: Memory tool safety permissions (confirmation dialogs for destructive ops) | Claude Code |
| 2025-11-27 | Revised M3.5 estimates: 11h → 28h (realistic based on implementation gap analysis) | Claude Code |
| 2025-11-27 | M3.5-2 revised from 2h → 5h (needs search + conflict handling) | Claude Code |
| 2025-11-27 | M3.5-4 revised from 4h → 6h (edge cases, race conditions, testing) | Claude Code |
| 2025-11-27 | Created Sprint M3.5-01 documentation (active sprint Nov 28 - Dec 8) | Claude Code |
| 2025-11-27 | Created HANDOVER_M35-01.md execution guide with team composition | Claude Code |
| 2025-11-27 | Eliminated ~48px wasted header space on all devices by removing MobileHeader component | Claude Code |
| 2025-11-27 | Updated chat-header.tsx, chat-interface.tsx, app-sidebar.tsx for consistent sidebar UX | Claude Code |

---

## 📌 NOTES

**How to Use This Backlog:**
1. **V1 Critical Path** - Must complete before shipping
2. **Deferred Items** - Nice-to-haves for post-launch
3. **Milestone Sections** - Plan sprints from these
4. **Research Spikes** - Do before committing to features
5. **Nice-to-Have** - Community/user-driven features

**Prioritization Framework:**
- 🔴 **CRITICAL** - Blocks launch or core functionality
- 🟡 **HIGH** - Key differentiator or major UX improvement
- 🟠 **MEDIUM** - Incremental improvement, not urgent
- 🟢 **LOW** - Polish, nice-to-have, future ideas

**Definition of Ready (for items to enter sprint):**
- [ ] Clear user story or acceptance criteria
- [ ] Effort estimated (T-shirt or hours)
- [ ] Dependencies identified
- [ ] Design mockups (if UI work)
- [ ] Technical approach agreed upon

**Definition of Done (for items to be marked complete):**
- [ ] Code written and reviewed
- [ ] Tests passing (manual or automated)
- [ ] Documentation updated
- [ ] No regressions introduced
- [ ] Deployed to staging/production

---

**Document Maintained By:** Solo Developer (Personal Tool)
**Next Grooming Session:** Start of M3 Phase 4 sprint
**Last Updated:** November 27, 2025 (v1.3.1 Sidebar UX Enhancement)
