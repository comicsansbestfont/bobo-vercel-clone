# Bobo AI Chatbot - Product Backlog

**Last Updated:** November 27, 2025 (Letta SDK Analysis Integration)
**Maintained By:** Solo Developer (Personal Tool)
**Purpose:** Track all planned features, improvements, and technical debt

> **Note:** Bobo is a **personal internal tool**. This backlog reflects a strategic pivot on November 25, 2025 to prioritize Agent SDK over production/scale features.

> **November 27, 2025 Update:** Integrated learnings from [Letta AI Memory SDK](https://github.com/letta-ai/ai-memory-sdk) competitive analysis. Key additions: Agent Memory Tools (self-editing memory), description-driven extraction, async memory processing. See "Letta SDK Learnings" section below.

---

## 🗺️ PRODUCT ROADMAP

### Executive Summary

| Metric | Value |
|--------|-------|
| **Milestones Complete** | 4 of 5 core (M1, M2, M3*, M4) |
| **Tasks Complete** | 67 of 89 (75%) |
| **Hours Invested** | ~60 hours actual |
| **Hours Remaining** | ~27 hours (M3 Phase 4 + M3.5) |
| **Build Status** | ✅ Passing |
| **Current Phase** | M4 Complete → M3 Phase 4 → M3.5 |

*M3 is 69% complete (Phase 4 + Phase 5/M3.5 planned with Letta enhancements)

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
  Phase 4 (6)                                  ░░░░░░ Dec 15-21 📝 Planned

MOBILE v1.3.0       ░░░░░░░░░░░░░░░░░░░░██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
  UX Sprint (10)                        ██ Nov 25 ✅ 4h

M4: AGENT SDK       ░░░░░░░░░░░░░░░░░░░░░░██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
  Sprint 01 (10)                          ██ Nov 26 ✅ 10h (Day 1!)

M5: COGNITIVE       ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
  (8 tasks)                                           📝 Deferred (Pain-Driven)

FUTURE (SaaS)       ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
  (20 tasks)                                          📝 Not Planned

Legend: ████ Complete  ░░░░ Planned/Deferred
```

### Milestone Status Dashboard

| Milestone | Status | Tasks | Hours Est | Hours Actual | Efficiency | Key Deliverables |
|-----------|--------|-------|-----------|--------------|------------|------------------|
| **M1: Persistence** | ✅ Complete | 16/16 | 16h | 16h | 100% | Supabase integration, CRUD APIs, E2E tests |
| **M2: RAG** | ✅ Complete | 18/18 | 28h | 26h | 107% | Double-Loop architecture, pgvector, citations |
| **M3: Memory** | 🚧 69% | 22/32 | 79h | 28h | - | Hierarchical memory, Memory UI, UX polish |
| **M3.5: Agent Memory** | 📝 Planned | 0/4 | 11h | - | - | Self-editing memory tools (Letta-inspired) |
| **M4: Agent SDK** | ✅ Complete | 10/10 | 25.5h | 10h | 255% | Claude SDK, tools, safety hooks, streaming |
| **M5: Cognitive** | 📝 Deferred | 0/8 | 36h | - | - | Living docs, knowledge graph |

*M3 includes 7 Phase 4 tasks + 4 M3.5 tasks (Letta enhancements)

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
──────────────┼───────┼─────────┼────────┼──────────┼────────
TOTALS        │  84   │ 120h    │  84h   │  -30%    │ 100% ✅
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
| **Mobile Optimization** | ✅ Live | v1.3.0 | Drawer sidebar, footer bar |
| **Bobo Personality** | ✅ Live | v1.3.0 | Identity responses |
| **Agent Mode** | ✅ Live | M4 | Claude-only agentic capabilities |
| **File Read/Write** | ✅ Live | M4 | Read, Edit, Write tools |
| **Code Search** | ✅ Live | M4 | Grep, Glob tools |
| **Bash Execution** | ✅ Live | M4 | With safety hooks |
| **Tool Confirmation** | ✅ Live | M4 | Diff preview for edits |
| **Safety Hooks** | ✅ Live | M4 | Blocked patterns, protected files |
| **Memory Provenance** | 📝 Planned | M3-04 | Source chat tracking |
| **Memory Debugger** | 📝 Planned | M3-04 | "What was injected?" view |
| **Description-Driven Extraction** | 📝 Planned | M3-04 | Letta-inspired guidance fields |
| **Agent Memory Tools** | 📝 Planned | M3.5 | remember_fact, update_memory, forget_memory |
| **Async Memory Extraction** | 📝 Planned | M3.5 | Non-blocking background processing |
| **Living Documentation** | 📝 Deferred | M5 | Auto-updating project docs |
| **Knowledge Graph** | 📝 Deferred | M5 | Fact extraction & queries |
| **Multi-User Auth** | 📝 Not Planned | Future | OAuth, if SaaS pivot |

### Next Priorities

```
NOW (Q4 2025)
├─ M3 Phase 4: Memory polish (13h est)
│  ├─ Memory provenance UI
│  ├─ Memory debugger
│  ├─ Conflict resolution
│  ├─ Token budget enforcement
│  └─ NEW: Description-driven extraction (Letta learning)
│
NEXT (Q1 2026)
├─ M3.5: Agent Memory Tools (11h est) ← NEW from Letta analysis
│  ├─ remember_fact tool (real-time memory capture)
│  ├─ update_memory tool (user corrections)
│  ├─ forget_memory tool (graceful deletion)
│  └─ Async extraction pipeline
│
LATER (When Pain-Driven)
├─ M5: Cognitive Layer (36h est)
│  ├─ Living documentation
│  ├─ Hierarchical summaries
│  └─ Knowledge graph
│
MAYBE (If SaaS Pivot)
└─ Future: Production features
   ├─ OAuth authentication
   ├─ Team workspaces
   └─ Usage analytics
```

---

## 📊 Backlog Priority Matrix

```
Agent SDK (M4) ✅ → M3 Phase 4 (polish) → M3.5 (agent memory) → M5 (cognitive) → Future (if SaaS)
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

### Implementation Priority

| Phase | Tasks | Effort | Timeline |
|-------|-------|--------|----------|
| **Phase 1** | M3 Phase 4 + description-driven extraction | 16h | This sprint |
| **Phase 2** | Agent Memory Tools (M3.5) | 11h | Next sprint |
| **Phase 3** | M5 Cognitive Layer | 36h | Pain-driven |

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

### 3.5 Phase 5: Agent Memory Tools (M3.5) 📝 PLANNED - LETTA INSPIRED

**Sprint:** M3.5 (Q1 2026)
**Status:** 📝 Planned (after M3 Phase 4)
**Goal:** Enable agent to self-edit memory in real-time during conversations
**Source:** Letta AI Memory SDK competitive analysis (Nov 27, 2025)
**Rationale:** Biggest functional gap vs Letta. Passive extraction misses user corrections and in-the-moment insights.

| ID | Feature | Priority | Estimate | Status | Notes |
|----|---------|----------|----------|--------|-------|
| M3.5-1 | `remember_fact` agent tool | 🔴 HIGH | 3h | ⏳ | Real-time memory capture |
| M3.5-2 | `update_memory` agent tool | 🔴 HIGH | 2h | ⏳ | User corrections flow to memory |
| M3.5-3 | `forget_memory` agent tool | 🟡 MEDIUM | 2h | ⏳ | Graceful memory deletion |
| M3.5-4 | Async extraction pipeline | 🟡 MEDIUM | 4h | ⏳ | Non-blocking background processing |

**Total Estimate:** 11 hours

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

### 3.6 Deferred Features (Post-M3)

| ID | Feature | Priority | Estimate | Status | Notes |
|----|---------|----------|----------|--------|-------|
| M3-14 | Detect and store user local time & timezone | 🟡 MEDIUM | 2h | 📝 | Auto-context feature |
| M3-15 | Inject current local time and location into prompt | 🟡 MEDIUM | 3h | 📝 | Privacy concerns |
| M3-29 | Import memory from external sources (resume, LinkedIn) | 🟢 LOW | 4h | 📝 | Nice-to-have |
| M3-30 | Memory versioning (history of changes) | 🟢 LOW | 3h | 📝 | Advanced feature |

**Note:** Original M3-1 through M3-4 (Supermemory.ai integration) were replaced with custom Gemini 2.5 Flash Lite extraction for better control and 56% lower cost.

**Total M3 Core Tasks:** 32 (22 complete + 7 Phase 4 + 4 Phase 5/M3.5)
**Total Estimated Effort:** 79 hours (original 52h + 27h Letta enhancements)
**Phase 1 Actual:** 4.5 hours (55% efficiency gain)
**Phase 2 Actual:** 4 hours (75% efficiency gain)
**Phase 3 Actual:** 16 hours (+1h over estimate)
**Phase 3.1 Actual:** 3.5 hours (on estimate)
**Phase 4 Remaining:** 16 hours (+3h for M3-31 Letta enhancement)
**Phase 5 (M3.5) Remaining:** 11 hours (NEW - Agent Memory Tools)

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

## 🧭 MILESTONE 5: Cognitive Layer & Living Documentation (Deferred)

**Status:** 📝 Deferred (Pain-Driven)
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
**Last Updated:** November 27, 2025 (Letta SDK Analysis Integration)
