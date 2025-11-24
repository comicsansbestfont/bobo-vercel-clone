# Bobo AI Chatbot - Product Backlog

**Last Updated:** November 23, 2025
**Maintained By:** Product Owner / CTO
**Purpose:** Track all planned features, improvements, and technical debt not in current milestone

---

## 📊 Backlog Priority Matrix

```
Critical Path (V1) → High Priority (M2) → Medium Priority (M3) → Low Priority (M4+)
```

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

**Status:** 🚧 In Progress (Phase 1 Complete, Phase 2-4 Planned)
**Target Start:** November 24, 2025
**Target End:** December 21, 2025 (4 weeks across 3 sprints)
**Focus:** Three-layer memory architecture combining manual user profile (Layer 1), automatic hierarchical memory extraction (Layer 2), and project context (Layer 3 from M2).
**Architecture:** Hybrid approach inspired by Claude's hierarchical memory and Gemini's personal context, using GPT-4o-mini for extraction instead of Supermemory.ai.
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

### 3.2 Phase 2: Hierarchical Memory Extraction 📝 PLANNED

**Sprint:** M3-02 (Dec 1-7, 2025)
**Status:** 📝 Planned
**Goal:** Automatic Claude-style memory extraction with 6 hierarchical categories

| ID | Feature | Priority | Estimate | Status |
|----|---------|----------|----------|--------|
| M3-17 | Create `memory_entries` table with hierarchical categories | 🔴 HIGH | 2h | ⏳ |
| M3-18 | Implement GPT-4o-mini extraction pipeline | 🔴 HIGH | 4h | ⏳ |
| M3-19 | Background job to extract from completed chats | 🔴 HIGH | 3h | ⏳ |
| M3-20 | Deduplication logic (content_hash + fuzzy matching) | 🔴 HIGH | 2h | ⏳ |
| M3-21 | Inject hierarchical memory into system prompt | 🔴 HIGH | 2h | ⏳ |
| M3-22 | Weekly consolidation process (merge duplicates, archive low-relevance) | 🟡 MEDIUM | 3h | ⏳ |

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

### 3.3 Phase 3: Claude-Style Memory UI 📝 PLANNED

**Sprint:** M3-03 (Dec 8-14, 2025)
**Status:** 📝 Planned
**Goal:** `/memory` page with hierarchical sections, edit/delete, and privacy controls

| ID | Feature | Priority | Estimate | Status |
|----|---------|----------|----------|--------|
| M3-5 | Memory management page (`/memory`) with hierarchical UI | 🔴 HIGH | 4h | ⏳ |
| M3-23 | Collapsible sections: Work Context, Personal Context, Top of Mind, Brief History | 🔴 HIGH | 3h | ⏳ |
| M3-6 | Edit/delete specific memory entries | 🔴 HIGH | 2h | ⏳ |
| M3-24 | Memory suggestions UI ("We think you might be...") | 🟡 MEDIUM | 2h | ⏳ |
| M3-7 | Settings page: toggle auto-memory, set extraction frequency | 🔴 HIGH | 2h | ⏳ |
| M3-25 | Privacy controls (per-category toggle, clear all) | 🔴 HIGH | 2h | ⏳ |

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

### 3.4 Phase 4: Advanced Memory Features 📝 PLANNED

**Sprint:** M3-04 (Dec 15-21, 2025)
**Status:** 📝 Planned
**Goal:** Provenance tracking, debugging tools, and polish

| ID | Feature | Priority | Estimate | Status |
|----|---------|----------|----------|--------|
| M3-26 | Memory provenance UI (show source chats) | 🟡 MEDIUM | 2h | ⏳ |
| M3-10 | Memory debugger ("What was injected in this chat?") | 🟡 MEDIUM | 3h | ⏳ |
| M3-9 | Conflict resolution UI (manual override vs auto-extracted) | 🔴 HIGH | 3h | ⏳ |
| M3-27 | Token budget enforcement (500 tokens max) | 🔴 HIGH | 2h | ⏳ |
| M3-28 | Export memory as JSON/Markdown | 🟡 MEDIUM | 2h | ⏳ |
| M3-16 | Profile preview ("What AI sees" view) | 🟢 LOW | 1h | ⏳ |

**Total Estimate:** 13 hours

### 3.5 Deferred Features (Post-M3)

| ID | Feature | Priority | Estimate | Status | Notes |
|----|---------|----------|----------|--------|-------|
| M3-14 | Detect and store user local time & timezone | 🟡 MEDIUM | 2h | 📝 | Auto-context feature |
| M3-15 | Inject current local time and location into prompt | 🟡 MEDIUM | 3h | 📝 | Privacy concerns |
| M3-29 | Import memory from external sources (resume, LinkedIn) | 🟢 LOW | 4h | 📝 | Nice-to-have |
| M3-30 | Memory versioning (history of changes) | 🟢 LOW | 3h | 📝 | Advanced feature |

**Note:** Original M3-1 through M3-4 (Supermemory.ai integration) were replaced with custom GPT-4o-mini extraction for better control and lower cost.

**Total M3 Core Tasks:** 22 (4 complete + 18 planned)
**Total Estimated Effort:** 48.5 hours (3 weeks across 3 sprints)
**Phase 1 Actual:** 4.5 hours (55% efficiency gain)
**Remaining Estimate:** 44 hours

---

## 🚀 MILESTONE 4: Production & Scale (Q2 2026)

**Status:** 📝 Backlog
**Target:** Q2 2026 (ongoing)

### 4.1 Authentication & Multi-User

| ID | Feature | Priority | Estimate | Status |
|----|---------|----------|----------|--------|
| M4-1 | OAuth integration (Google, GitHub) | 🔴 HIGH | 4h | ⏳ |
| M4-2 | Email/password authentication | 🔴 HIGH | 3h | ⏳ |
| M4-3 | User management UI | 🔴 HIGH | 3h | ⏳ |
| M4-4 | Row-level security (RLS) in Supabase | 🔴 HIGH | 3h | ⏳ |
| M4-5 | Update all queries to use `user_id` | 🔴 HIGH | 2h | ⏳ |

### 4.2 Team Workspaces

| ID | Feature | Priority | Estimate | Status |
|----|---------|----------|----------|--------|
| M4-6 | Create `teams` and `team_members` tables | 🟡 MEDIUM | 2h | ⏳ |
| M4-7 | Team creation and invitation flow | 🟡 MEDIUM | 4h | ⏳ |
| M4-8 | Shared projects within teams | 🟡 MEDIUM | 3h | ⏳ |
| M4-9 | Permission system (view/edit/admin) | 🟡 MEDIUM | 4h | ⏳ |

### 4.3 Analytics & Monitoring

| ID | Feature | Priority | Estimate | Status |
|----|---------|----------|----------|--------|
| M4-10 | Usage analytics dashboard | 🟡 MEDIUM | 4h | ⏳ |
| M4-11 | Cost tracking per user | 🟡 MEDIUM | 3h | ⏳ |
| M4-12 | Token usage history | 🟡 MEDIUM | 2h | ⏳ |
| M4-13 | Error tracking (Sentry integration) | 🔴 HIGH | 2h | ⏳ |
| M4-14 | Performance monitoring (APM) | 🟡 MEDIUM | 3h | ⏳ |

### 4.4 Advanced Features

| ID | Feature | Priority | Estimate | Status |
|----|---------|----------|----------|--------|
| M4-15 | PDF upload support | 🟡 MEDIUM | 4h | ⏳ |
| M4-16 | Code repository integration | 🟢 LOW | 6h | ⏳ |
| M4-17 | URL scraping for knowledge base | 🟢 LOW | 4h | ⏳ |
| M4-18 | Redis caching layer | 🟡 MEDIUM | 3h | ⏳ |
| M4-19 | CDN for static assets | 🟢 LOW | 2h | ⏳ |
| M4-20 | Rate limiting middleware | 🔴 HIGH | 2h | ⏳ |

### 4.5 DevOps & Infrastructure

| ID | Feature | Priority | Estimate | Status |
|----|---------|----------|----------|--------|
| M4-21 | CI/CD pipeline (GitHub Actions) | 🔴 HIGH | 3h | ⏳ |
| M4-22 | Automated database backups | 🔴 HIGH | 2h | ⏳ |
| M4-23 | Staging environment | 🟡 MEDIUM | 2h | ⏳ |
| M4-24 | API versioning strategy | 🟡 MEDIUM | 2h | ⏳ |
| M4-25 | Load testing and benchmarks | 🟡 MEDIUM | 4h | ⏳ |

**Total M4 Tasks:** 25
**Estimated Effort:** Ongoing (4+ weeks)

---

## 🧭 MILESTONE 5: Cognitive Layer & Living Documentation (Q3 2026+)

**Status:** 📝 Backlog  
**Target:** After M4 stabilizes (post-production rollout)  
**Focus:** Turn Bobo into a true “Memory Palace” with project living docs, hierarchical summaries, and a lightweight knowledge graph.
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

| ID | Feature | Description | User Value | Complexity | Votes |
|----|---------|-------------|------------|------------|-------|
| NTH-1 | Chat export (Markdown) | Export conversation as .md file | 🟡 MEDIUM | 🟢 LOW (2h) | 1 |
| NTH-2 | Rename chat | Inline edit chat title in sidebar | 🟡 MEDIUM | 🟢 LOW (1h) | 1 |
| NTH-3 | Delete chat from sidebar | Delete chat with confirmation dialog | 🟡 MEDIUM | 🟢 LOW (1h) | 1 |
| NTH-4 | Chat search | Search across all chat messages | 🟡 MEDIUM | 🟡 MEDIUM (4h) | 0 |
| NTH-5 | Dark mode toggle | Manual dark/light theme switch | 🟢 LOW | 🟢 LOW (1h) | 0 |
| NTH-6 | Keyboard shortcuts | Vim-style or Cmd+K navigation | 🟡 MEDIUM | 🟡 MEDIUM (3h) | 0 |
| NTH-7 | Conversation templates | Pre-defined prompts for common tasks | 🟡 MEDIUM | 🟢 LOW (2h) | 0 |
| NTH-8 | Message editing | Edit previous user messages | 🟡 MEDIUM | 🟡 MEDIUM (3h) | 0 |
| NTH-9 | Voice input | Speech-to-text for messages | 🟢 LOW | 🔴 HIGH (6h) | 0 |
| NTH-10 | Image generation | DALL-E integration | 🟢 LOW | 🟡 MEDIUM (4h) | 0 |
| NTH-11 | Three-dots options menu | Chat actions menu with Move to Project, Archive, Report, Delete (ChatGPT-style) | 🟡 MEDIUM | 🟡 MEDIUM (4-5h) | 1 |
| NTH-12 | Project sharing | Share project via link with permissions (view/edit) | 🟡 MEDIUM | 🔴 HIGH (8h) | 0 |
| NTH-13 | Project export | Export project data (chats, files, settings) as JSON/ZIP | 🟡 MEDIUM | 🟡 MEDIUM (3h) | 0 |
| NTH-14 | User profile preview | "What AI sees" view in profile settings | 🟢 LOW | 🟢 LOW (1h) | 0 |

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
V1 (Critical):     6 items  (6-8 hours)
Deferred (TD):     10 items (23-28 hours)
M2 (Intelligence): 18 items (3 weeks)
M3 (Memory):       22 items (3 weeks)
M4 (Production):   25 items (4+ weeks)
M5 (Cognitive):    TBD      (not yet sized)
Research:          6 items  (12 hours)
Nice-to-Have:      13 items (35-40 hours)
```

### Total Backlog Size

**Total Items:** 100
**Total Estimated Effort:** ~11-13 weeks (full-time)

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
| M3 User Profile & Bio      | 📝 Planned       | Personal Bio & global memory    |
| M4 Production & Scale      | 📝 Backlog       | Multi-user, teams, analytics    |
| M5 Cognitive Layer         | 📝 Backlog       | Living docs, graph, briefs      |
| Research & Spikes (R-*)    | 📝 Planned       | To inform M3–M5 decisions       |
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

**Document Maintained By:** Product Owner / CTO
**Next Grooming Session:** After V1 ships
**Last Updated:** November 23, 2025
