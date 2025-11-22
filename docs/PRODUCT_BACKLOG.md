# Bobo AI Chatbot - Product Backlog

**Last Updated:** November 22, 2025 - 11:59 PM
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
**Status:** 🚧 In Progress (85% complete)

### Frontend Integration Tasks

| ID | Task | Priority | Estimate | Status | Assignee | Notes |
|----|------|----------|----------|--------|----------|-------|
| V1-1 | Replace mock data in sidebar | 🔴 CRITICAL | 2-3h | ⏳ | TBD | Fetch projects/chats from API |
| V1-2 | Replace mock data in project page | 🔴 CRITICAL | 1h | ⏳ | TBD | Use `/api/projects/[id]` |
| V1-3 | Create project creation modal | 🔴 CRITICAL | 1h | ⏳ | TBD | POST to `/api/projects` |
| V1-4 | Add loading states (skeletons) | 🟡 HIGH | 1h | ⏳ | TBD | Better UX during fetch |
| V1-5 | Add error boundary | 🟡 HIGH | 30m | ⏳ | TBD | Graceful error handling |
| V1-6 | End-to-end testing | 🟠 MEDIUM | 1h | ⏳ | TBD | Manual testing flow |

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
| TD-7 | Background/async compression | Performance | 🟡 MEDIUM | 2-3h | Manual trigger works, not urgent |

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

## 📝 MILESTONE 2: Project Intelligence (Q1 2026)

**Status:** 📝 Planned
**Target Start:** After V1 ships
**Target End:** 3 weeks after start

### 2.1 Custom Instructions

| ID | Feature | Priority | Estimate | Status |
|----|---------|----------|----------|--------|
| M2-1 | Add `system_instructions` column to projects | 🔴 HIGH | 1h | ⏳ |
| M2-2 | Project settings page UI | 🔴 HIGH | 2h | ⏳ |
| M2-3 | Inject instructions into chat system prompt | 🔴 HIGH | 1h | ⏳ |

### 2.2 File Upload & Storage

| ID | Feature | Priority | Estimate | Status |
|----|---------|----------|----------|--------|
| M2-4 | Create `project_files` table | 🔴 HIGH | 1h | ⏳ |
| M2-5 | POST `/api/projects/[id]/files` endpoint | 🔴 HIGH | 2h | ⏳ |
| M2-6 | File validation (.md, max 10MB) | 🔴 HIGH | 1h | ⏳ |
| M2-7 | File management UI (upload, delete, preview) | 🔴 HIGH | 3h | ⏳ |
| M2-8 | Background processing queue | 🟡 MEDIUM | 2h | ⏳ |

### 2.3 RAG Pipeline

| ID | Feature | Priority | Estimate | Status |
|----|---------|----------|----------|--------|
| M2-9 | Create `embeddings` table with pgvector | 🔴 HIGH | 2h | ⏳ |
| M2-10 | Implement chunking logic (semantic) | 🔴 HIGH | 3h | ⏳ |
| M2-11 | Generate embeddings (OpenAI API) | 🔴 HIGH | 2h | ⏳ |
| M2-12 | Store embeddings in pgvector | 🔴 HIGH | 2h | ⏳ |
| M2-13 | Implement similarity search | 🔴 HIGH | 3h | ⏳ |
| M2-14 | Inject retrieved chunks into chat | 🔴 HIGH | 2h | ⏳ |

### 2.4 Source Citations

| ID | Feature | Priority | Estimate | Status |
|----|---------|----------|----------|--------|
| M2-15 | Return source metadata in responses | 🔴 HIGH | 2h | ⏳ |
| M2-16 | Display source citations in UI | 🔴 HIGH | 2h | ⏳ |
| M2-17 | Source preview modal | 🟡 MEDIUM | 2h | ⏳ |
| M2-18 | Track context tokens for RAG | 🔴 HIGH | 1h | ⏳ |

**Total M2 Tasks:** 18
**Estimated Effort:** 3 weeks

---

## 🧠 MILESTONE 3: Global Memory (Q1 2026)

**Status:** 📝 Planned
**Target Start:** After M2 ships
**Target End:** 3 weeks after start

### 3.1 Supermemory Integration

| ID | Feature | Priority | Estimate | Status |
|----|---------|----------|----------|--------|
| M3-1 | Sign up for Supermemory.ai | 🔴 HIGH | 30m | ⏳ |
| M3-2 | Install SDK / create REST client | 🔴 HIGH | 1h | ⏳ |
| M3-3 | Test memory CRUD operations | 🔴 HIGH | 1h | ⏳ |

### 3.2 Memory Extraction

| ID | Feature | Priority | Estimate | Status |
|----|---------|----------|----------|--------|
| M3-4 | Design extraction prompt (structured) | 🔴 HIGH | 2h | ⏳ |
| M3-5 | Background job (every N messages) | 🔴 HIGH | 2h | ⏳ |
| M3-6 | Extract user profile facts | 🔴 HIGH | 2h | ⏳ |
| M3-7 | Extract technical facts | 🔴 HIGH | 2h | ⏳ |
| M3-8 | Extract decisions & constraints | 🔴 HIGH | 2h | ⏳ |
| M3-9 | Store in Supermemory with tags | 🔴 HIGH | 1h | ⏳ |

### 3.3 Memory Retrieval

| ID | Feature | Priority | Estimate | Status |
|----|---------|----------|----------|--------|
| M3-10 | Search memories before each response | 🔴 HIGH | 2h | ⏳ |
| M3-11 | Filter by relevance score | 🔴 HIGH | 1h | ⏳ |
| M3-12 | Inject into system prompt | 🔴 HIGH | 1h | ⏳ |
| M3-13 | Track which memories used | 🟡 MEDIUM | 1h | ⏳ |

### 3.4 Memory Management UI

| ID | Feature | Priority | Estimate | Status |
|----|---------|----------|----------|--------|
| M3-14 | Memory management page (`/memory`) | 🔴 HIGH | 3h | ⏳ |
| M3-15 | List/search all memories | 🔴 HIGH | 2h | ⏳ |
| M3-16 | Edit memory modal | 🟡 MEDIUM | 2h | ⏳ |
| M3-17 | Delete memory with confirmation | 🟡 MEDIUM | 1h | ⏳ |
| M3-18 | Memory indicators in chat | 🟡 MEDIUM | 2h | ⏳ |
| M3-19 | Settings (toggle auto-memory) | 🟡 MEDIUM | 1h | ⏳ |

### 3.5 Cross-Project Context (Stretch)

| ID | Feature | Priority | Estimate | Status |
|----|---------|----------|----------|--------|
| M3-20 | Link projects for shared context | 🟢 LOW | 2h | ⏳ |
| M3-21 | Merge context from linked projects | 🟢 LOW | 2h | ⏳ |
| M3-22 | Knowledge graph visualization | 🟢 LOW | 5h | ⏳ |

**Total M3 Tasks:** 22
**Estimated Effort:** 3 weeks

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

---

## 🐛 BUG BACKLOG

**Known bugs that are not blocking V1 launch**

| ID | Bug | Severity | Impact | Workaround | Status |
|----|-----|----------|--------|------------|--------|
| BUG-1 | Tokenizer fallback warnings in console | 🟢 LOW | Dev only, expected behavior | N/A - working as designed | 📝 Not a bug |
| BUG-2 | _(No known bugs currently)_ | - | - | - | - |

---

## 📈 NICE-TO-HAVE FEATURES

**User-requested or brainstormed features with unclear priority**

| ID | Feature | Description | User Value | Complexity | Votes |
|----|---------|-------------|------------|------------|-------|
| NTH-1 | Chat export (Markdown) | Export conversation as .md file | 🟡 MEDIUM | 🟢 LOW (2h) | 0 |
| NTH-2 | Chat search | Search across all chat messages | 🟡 MEDIUM | 🟡 MEDIUM (4h) | 0 |
| NTH-3 | Dark mode toggle | Manual dark/light theme switch | 🟢 LOW | 🟢 LOW (1h) | 0 |
| NTH-4 | Keyboard shortcuts | Vim-style or Cmd+K navigation | 🟡 MEDIUM | 🟡 MEDIUM (3h) | 0 |
| NTH-5 | Conversation templates | Pre-defined prompts for common tasks | 🟡 MEDIUM | 🟢 LOW (2h) | 0 |
| NTH-6 | Message editing | Edit previous user messages | 🟡 MEDIUM | 🟡 MEDIUM (3h) | 0 |
| NTH-7 | Voice input | Speech-to-text for messages | 🟢 LOW | 🔴 HIGH (6h) | 0 |
| NTH-8 | Image generation | DALL-E integration | 🟢 LOW | 🟡 MEDIUM (4h) | 0 |

---

## 📊 BACKLOG METRICS

### Distribution by Priority

```
🔴 CRITICAL:  6 items (V1 must-haves)
🟡 HIGH:      47 items (M2/M3 core features + deferred improvements)
🟠 MEDIUM:    8 items (Nice-to-haves)
🟢 LOW:       15 items (Future improvements)
```

### Distribution by Milestone

```
V1 (Critical):     6 items  (6-8 hours)
Deferred (TD):     7 items  (13-15 hours)
M2 (Intelligence): 18 items (3 weeks)
M3 (Memory):       22 items (3 weeks)
M4 (Production):   25 items (4+ weeks)
Research:          6 items  (12 hours)
Nice-to-Have:      8 items  (20+ hours)
```

### Total Backlog Size

**Total Items:** 92
**Total Estimated Effort:** ~11-13 weeks (full-time)

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
**Last Updated:** November 22, 2025
