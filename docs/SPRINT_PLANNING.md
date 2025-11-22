# Bobo AI - Sprint Planning

**Last Updated:** November 22, 2025 (End of Day)
**Current Position:** V1 Complete (pending QA) → Planning M2
**Planning Horizon:** Next 3-4 weeks

---

## 📊 Current State Summary

### ✅ Completed: Milestone 1 - Persistence Foundation
**Status:** Development Complete (100%)
**Timeline:** 1 day (Nov 22, 2025)
**What Works:**
- ✅ Full database persistence (Supabase)
- ✅ Project CRUD with chat associations
- ✅ Chat history loading and persistence
- ✅ Real-time message saving during streaming
- ✅ Professional UI with loading states
- ✅ Error boundaries and 404 handling
- ✅ Comprehensive testing infrastructure

**Pending:**
- 🟡 Manual QA testing
- 🟡 Production build verification
- 🟡 Performance validation

**Recommendation:** Ship V1 after QA passes

---

## 🎯 Next Up: Milestone 2 - Project Intelligence

### Vision
Transform projects from simple chat containers into intelligent workspaces with:
- **Custom Instructions** - Project-specific AI behavior
- **Knowledge Base** - Upload markdown files for context
- **RAG Pipeline** - Semantic search and retrieval
- **Source Citations** - Show where AI found information

### Business Value
- **Differentiation:** Claude Projects has this, we need parity
- **User Stickiness:** Knowledge bases lock users into the platform
- **Use Case Expansion:** Documentation projects, research, technical writing

### Technical Complexity
- **Medium-High** - Requires vector embeddings, chunking strategy, prompt engineering
- **External Deps:** OpenAI embeddings API, Supabase pgvector extension
- **New Skills:** RAG architecture, semantic chunking, relevance scoring

---

## 📋 Milestone 2 Breakdown (32 Tasks, 3 Weeks)

### Phase 2.1: Foundation (Week 1) - 8 tasks, ~12 hours

**Goal:** Add custom instructions + basic file storage (no RAG yet)

| ID | Task | Effort | Priority | Dependencies |
|----|------|--------|----------|--------------|
| M2-1 | Database migration: Add `system_instructions` to projects | 30m | 🔴 CRITICAL | None |
| M2-2 | Database migration: Create `project_files` table | 1h | 🔴 CRITICAL | None |
| M2-3 | Update `lib/db/types.ts` with new schemas | 30m | 🔴 CRITICAL | M2-1, M2-2 |
| M2-4 | PATCH `/api/projects/[id]` to update instructions | 1h | 🔴 HIGH | M2-1 |
| M2-5 | POST `/api/projects/[id]/files` - Upload endpoint | 2h | 🔴 HIGH | M2-2 |
| M2-6 | GET `/api/projects/[id]/files` - List files | 1h | 🔴 HIGH | M2-2 |
| M2-7 | DELETE `/api/projects/[id]/files/[id]` - Delete file | 1h | 🔴 HIGH | M2-2 |
| M2-8 | Inject custom instructions into `/api/chat` system prompt | 2h | 🔴 HIGH | M2-1 |

**Deliverable:** Projects can have custom instructions + store files (not yet searchable)

**Success Criteria:**
- [ ] User can set custom instructions on a project
- [ ] Instructions appear in chat system prompt
- [ ] User can upload markdown files to project
- [ ] Files stored in database
- [ ] File list displayed in project settings

---

### Phase 2.2: RAG Pipeline (Week 2) - 12 tasks, ~20 hours

**Goal:** Make uploaded files searchable via semantic search

| ID | Task | Effort | Priority | Dependencies |
|----|------|--------|----------|--------------|
| M2-9 | Research: Chunking strategies (fixed vs semantic) | 2h | 🟡 MEDIUM | None |
| M2-10 | Database migration: Create `embeddings` table with pgvector | 1h | 🔴 CRITICAL | None |
| M2-11 | Enable pgvector extension in Supabase | 30m | 🔴 CRITICAL | None |
| M2-12 | Create `lib/rag/chunking.ts` - Markdown chunker | 3h | 🔴 HIGH | M2-9 |
| M2-13 | Create `lib/rag/embeddings.ts` - OpenAI embedding gen | 2h | 🔴 HIGH | None |
| M2-14 | Create `lib/rag/storage.ts` - Store embeddings in DB | 2h | 🔴 HIGH | M2-10 |
| M2-15 | Background job: Process uploaded files → chunks → embeddings | 3h | 🔴 HIGH | M2-12, M2-13, M2-14 |
| M2-16 | Create `lib/rag/search.ts` - Cosine similarity search | 2h | 🔴 HIGH | M2-10 |
| M2-17 | Add vector indexes for performance | 1h | 🟡 MEDIUM | M2-10 |
| M2-18 | Test retrieval accuracy with sample docs | 2h | 🟡 MEDIUM | M2-16 |
| M2-19 | Optimize chunk size/overlap based on testing | 1h | 🟡 MEDIUM | M2-18 |
| M2-20 | Handle edge cases (empty files, huge files) | 1h | 🟡 MEDIUM | M2-15 |

**Deliverable:** Files are chunked, embedded, and searchable

**Success Criteria:**
- [ ] Upload file → auto-processes in background
- [ ] Embeddings stored in pgvector
- [ ] Can retrieve top-k relevant chunks for a query
- [ ] Retrieval is fast (< 200ms)

---

### Phase 2.3: Context Injection (Week 2-3) - 6 tasks, ~8 hours

**Goal:** Inject retrieved context into chat responses

| ID | Task | Effort | Priority | Dependencies |
|----|------|--------|----------|--------------|
| M2-21 | Detect if chat belongs to a project in `/api/chat` | 1h | 🔴 HIGH | None |
| M2-22 | Perform semantic search on user query | 1h | 🔴 HIGH | M2-16 |
| M2-23 | Build enhanced system prompt with context chunks | 2h | 🔴 HIGH | M2-22 |
| M2-24 | Track injected context tokens in context tracker | 2h | 🔴 HIGH | M2-23 |
| M2-25 | Return source metadata in response | 1h | 🔴 HIGH | M2-22 |
| M2-26 | Test context injection doesn't break streaming | 1h | 🔴 HIGH | M2-23 |

**Deliverable:** AI uses project knowledge to answer questions

**Success Criteria:**
- [ ] User asks question in project chat
- [ ] System retrieves relevant chunks
- [ ] AI response uses retrieved context
- [ ] Context tokens counted correctly
- [ ] Source metadata returned

---

### Phase 2.4: Frontend UI (Week 3) - 7 tasks, ~12 hours

**Goal:** Build UI for managing instructions, files, and viewing sources

| ID | Task | Effort | Priority | Dependencies |
|----|------|--------|----------|--------------|
| M2-27 | Project settings page: `/project/[id]/settings` | 2h | 🔴 HIGH | None |
| M2-28 | System instructions editor (textarea with preview) | 2h | 🔴 HIGH | M2-27 |
| M2-29 | File upload dropzone (drag-and-drop) | 2h | 🔴 HIGH | M2-27 |
| M2-30 | File list with delete action | 2h | 🔴 HIGH | M2-27 |
| M2-31 | File preview modal (show content) | 1h | 🟡 MEDIUM | M2-30 |
| M2-32 | Source citation display in chat messages | 2h | 🔴 HIGH | M2-25 |
| M2-33 | Upload progress indicators | 1h | 🟡 MEDIUM | M2-29 |

**Deliverable:** Complete user-facing UI for M2 features

**Success Criteria:**
- [ ] User can navigate to project settings
- [ ] User can edit custom instructions
- [ ] User can drag-and-drop markdown files
- [ ] User sees file list with delete option
- [ ] User can preview file contents
- [ ] Chat shows source citations when using knowledge

---

## 🗓️ Recommended Sprint Plan

### SPRINT 1: Foundation + Custom Instructions (5 days)
**Goal:** Get custom instructions working end-to-end

**Week 1 - Days 1-2: Database & Backend**
- [ ] M2-1: Add `system_instructions` column
- [ ] M2-2: Create `project_files` table
- [ ] M2-3: Update TypeScript types
- [ ] M2-4: PATCH API for instructions
- [ ] M2-8: Inject instructions into chat

**Week 1 - Days 3-4: File Storage (No RAG Yet)**
- [ ] M2-5: POST file upload endpoint
- [ ] M2-6: GET list files endpoint
- [ ] M2-7: DELETE file endpoint
- [ ] Add file validation (markdown only, max 10MB)

**Week 1 - Day 5: Frontend**
- [ ] M2-27: Project settings page
- [ ] M2-28: Instructions editor
- [ ] Basic file list UI (no upload yet)

**Sprint 1 Deliverable:** Users can set custom instructions and see them work in chat

---

### SPRINT 2: RAG Pipeline (7 days)
**Goal:** Make files searchable and inject context

**Week 2 - Days 1-2: Chunking Research & Implementation**
- [ ] M2-9: Research chunking strategies
- [ ] M2-12: Implement markdown chunker
- [ ] Test chunker with real docs

**Week 2 - Days 3-4: Embeddings & Storage**
- [ ] M2-10: Embeddings table migration
- [ ] M2-11: Enable pgvector
- [ ] M2-13: OpenAI embeddings integration
- [ ] M2-14: Storage layer
- [ ] M2-15: Background processing job

**Week 2 - Days 5-6: Semantic Search**
- [ ] M2-16: Similarity search implementation
- [ ] M2-17: Add vector indexes
- [ ] M2-18: Test retrieval accuracy
- [ ] M2-19: Optimize chunk parameters

**Week 2 - Day 7: Context Injection**
- [ ] M2-21: Detect project in chat
- [ ] M2-22: Perform search on query
- [ ] M2-23: Build enhanced prompt
- [ ] M2-24: Track context tokens
- [ ] M2-25: Return source metadata

**Sprint 2 Deliverable:** AI can retrieve and use context from uploaded files

---

### SPRINT 3: UI Polish (3-4 days)
**Goal:** Build user-facing features

**Week 3 - Days 1-2: File Management UI**
- [ ] M2-29: Drag-and-drop upload
- [ ] M2-30: File list with delete
- [ ] M2-31: File preview modal
- [ ] M2-33: Upload progress

**Week 3 - Days 3-4: Source Citations & Testing**
- [ ] M2-32: Source citation display
- [ ] End-to-end testing of full RAG flow
- [ ] Bug fixes and polish
- [ ] Update documentation

**Sprint 3 Deliverable:** Complete M2 ready to ship

---

## 🔍 Key Decisions Required

### Decision 1: Chunking Strategy
**Options:**
- **A) Fixed-size chunks (500 tokens)** - Simple, fast, works well enough
- **B) Semantic chunks (by headers/paragraphs)** - Better quality, more complex
- **C) Hybrid (semantic with max size)** - Best of both worlds

**Recommendation:** Start with **A**, upgrade to **C** if quality issues

---

### Decision 2: Background Processing
**Options:**
- **A) Synchronous (process on upload)** - Simple, user waits
- **B) Vercel Queue** - Proper queue, costs money
- **C) Simple polling (check for unprocessed files)** - DIY, works

**Recommendation:** Start with **A** (sync), upgrade to **C** if needed

---

### Decision 3: Embedding Model
**Options:**
- **A) OpenAI text-embedding-3-small** - 1536 dims, $0.02/1M tokens, good quality
- **B) OpenAI text-embedding-3-large** - 3072 dims, $0.13/1M tokens, best quality
- **C) Open-source (sentence-transformers)** - Free, self-host required

**Recommendation:** **A** (small) for MVP, upgrade to **B** if quality lacking

---

### Decision 4: Chunk Retrieval Count
**Options:**
- **A) Top 3 chunks** - Less context, faster, cheaper
- **B) Top 5 chunks** - Good balance
- **C) Top 10 chunks** - More context, slower, fills up context window

**Recommendation:** **B** (top 5), make configurable per project later

---

## ⚠️ Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| pgvector extension not enabled in Supabase | 🔴 HIGH | 🟡 MEDIUM | Verify before starting, have fallback plan |
| Chunking quality poor | 🟡 MEDIUM | 🟡 MEDIUM | Build test suite early, iterate on strategy |
| Embeddings API costs spiral | 🟡 MEDIUM | 🟢 LOW | Cache embeddings, limit file size to 10MB |
| Context injection breaks streaming | 🔴 HIGH | 🟢 LOW | Test early and often, use existing patterns |
| Retrieval too slow (>500ms) | 🟡 MEDIUM | 🟡 MEDIUM | Add indexes, consider caching search results |
| Users upload non-markdown files | 🟢 LOW | 🟡 MEDIUM | Strict validation, clear error messages |

---

## 📊 Effort Summary

### Total M2 Effort Estimate
- **Backend:** 18 hours (database, APIs, RAG pipeline)
- **Frontend:** 12 hours (settings page, file UI, citations)
- **Research/Testing:** 6 hours (chunking, retrieval accuracy)
- **Buffer (20%):** 7 hours
- **Total:** **43 hours** (~5-6 days full-time)

### Sprint Breakdown
- **Sprint 1 (Foundation):** 12 hours → 1.5-2 days
- **Sprint 2 (RAG Pipeline):** 20 hours → 2.5-3 days
- **Sprint 3 (UI Polish):** 11 hours → 1.5-2 days
- **Total:** **43 hours** → **5-7 days** (with buffer)

**Original Estimate:** 3 weeks
**Revised Estimate:** 1-2 weeks (if focused)

---

## ✅ Recommended Next Sprint: Sprint 1

### Why Sprint 1 First?
- ✅ **Low risk** - No complex RAG, just database + API
- ✅ **Quick win** - Users see custom instructions working immediately
- ✅ **Foundation** - Sets up infrastructure for Sprint 2
- ✅ **Incremental value** - Shippable even without RAG

### Sprint 1 Kickoff Checklist
- [ ] Verify Supabase project has pgvector extension available
- [ ] Review database schema design for `project_files` table
- [ ] Decide on file storage approach (database TEXT vs Supabase Storage)
- [ ] Create Sprint 1 task list in todo tracker
- [ ] Set up development branch: `feature/m2-custom-instructions`

### Sprint 1 Success Criteria
- [ ] Database migrations run successfully
- [ ] Custom instructions persist and inject into chat
- [ ] Files upload and store in database
- [ ] Project settings page accessible
- [ ] Instructions editor functional
- [ ] No regressions in V1 functionality

---

## 🎯 Milestone 3 Sneak Peek (After M2)

**Supermemory.ai Integration - Global Memory**
- Automatic fact extraction from conversations
- Cross-project memory retrieval
- Memory management UI
- Knowledge graph visualization

**Estimated:** 3 weeks
**Complexity:** Medium (dependent on Supermemory API)
**Decision:** Research Supermemory API during M2 sprints

---

## 📌 Action Items

### Immediate (Before Sprint 1)
1. **QA V1** - Complete manual testing checklist
2. **Ship V1** - Deploy to production (if QA passes)
3. **Research** - Verify pgvector availability in Supabase
4. **Design** - Finalize database schema for M2

### This Week (Sprint 1)
1. **Start Sprint 1** - Custom instructions + file storage
2. **Daily Progress** - Track in `PROGRESS_TRACKER.md`
3. **Test Continuously** - Don't wait until end of sprint

### Next Week (Sprint 2)
1. **Research chunking** - Test different strategies
2. **Build RAG pipeline** - Embeddings + search
3. **Context injection** - Make it work with streaming

---

## 📚 Reference Documentation

### For M2 Implementation
- **RAG Best Practices:** https://www.pinecone.io/learn/retrieval-augmented-generation/
- **pgvector Guide:** https://supabase.com/docs/guides/ai/vector-databases
- **OpenAI Embeddings:** https://platform.openai.com/docs/guides/embeddings
- **Markdown Chunking:** Research LangChain's text splitters

### Project Docs
- **Progress Tracker:** `docs/PROGRESS_TRACKER.md`
- **Product Backlog:** `docs/PRODUCT_BACKLOG.md`
- **Project Brief:** `docs/PROJECT_BRIEF.md`

---

**Document Created:** November 22, 2025
**Next Review:** After Sprint 1 completion
**Owner:** Product/Engineering Lead
