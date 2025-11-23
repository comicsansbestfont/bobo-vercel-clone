# Bobo AI Chatbot - Comprehensive Project Brief

**Version:** 2.1
**Last Updated:** January 23, 2025
**Status:** Milestone 2 - COMPLETE (100%)

---

## 1. Executive Summary

**Bobo AI** is a next-generation AI chatbot that goes beyond simple question-and-answer. It provides **deep contextual understanding** through three key innovations:

1. **Forever Context** - Never lose conversation history through intelligent compression
2. **Project Workspaces** - Organize chats with custom instructions and knowledge bases
3. **Global Memory** - AI remembers your preferences across all conversations

Unlike ChatGPT or Claude, Bobo maintains persistent context through advanced memory management, project-based organization, and RAG-powered knowledge retrieval.

---

## 2. Core Value Propositions

### For Users

**Problem:** Current AI chatbots forget context, can't access project files, and treat every conversation independently.

**Solution:** Bobo organizes work into Projects with persistent knowledge, remembers user preferences globally, and never loses context through compression.

**Unique Benefits:**
- 📁 **Projects** - Group related chats with custom AI instructions
- 📚 **Knowledge Base** - Upload files; AI finds relevant info automatically
- 🧠 **Global Memory** - AI remembers your coding style, preferences, role
- ♾️ **Forever Context** - Automatic compression when context fills up
- 🔄 **Model Switching** - Use GPT-4o, Claude, Gemini, or Deepseek mid-conversation
- 🌐 **Web Search** - Toggle Perplexity for up-to-date information

### For Developers

**Technical Innovation:**
- Real-time token tracking with visual segmentation
- Automatic context compression using GPT-4o-mini
- Semantic search with pgvector (no separate vector DB needed)
- Model-agnostic architecture (works with any OpenAI-compatible API)
- Single codebase for chat + projects + memory

---

## 3. Target Audience

### Primary: Knowledge Workers & Developers

**Demographics:**
- Software engineers, data scientists, researchers
- Technical writers, product managers
- Ages 25-45, tech-savvy, work remotely

**Needs:**
- Manage multiple projects with different contexts
- Access project documentation quickly
- Maintain conversation history across sessions
- Switch models based on task complexity
- Track token usage and costs

**Pain Points:**
- ChatGPT loses context after ~128k tokens
- Claude projects don't persist files well
- Can't switch models mid-conversation
- No visibility into token usage
- Files aren't searchable semantically

### Secondary: Power Users & Teams

**Future Market:**
- Teams collaborating on shared projects
- Companies with internal knowledge bases
- Educators with course materials
- Writers with research libraries

---

## 4. Product Vision & Roadmap

### Current State (Milestone 0.5)

✅ **Completed:**
- Streaming chat interface with markdown/code support
- 10+ model selector (GPT, Claude, Gemini, Deepseek)
- Real-time context tracking with visual progress bar
- Automatic memory compression at 90% context usage
- Web search integration via Perplexity
- Project UI scaffolding (frontend only)
- ChatGPT-style collapsible sidebar

❌ **Missing:**
- Database and persistence layer
- Project backend API
- Chat history and loading
- File upload and RAG pipeline
- Supermemory integration

### Milestone 1: Persistence Foundation (Current)

**Goal:** Users can create projects, save chats, and move chats between projects.

**Timeline:** 2-3 weeks
**Status:** 🚧 Schema complete, building backend

**Deliverables:**
- ✅ Supabase database schema
- ⏳ Database client utilities
- ⏳ Project CRUD API routes
- ⏳ Chat persistence (save/load messages)
- ⏳ Chat-project association (add/move/detach)
- ⏳ Replace all mock data with real DB calls

**Success Criteria:**
- User creates a project → persists across refresh
- User sends message → saved to database in real-time
- User returns → sees full chat history
- User moves chat to project → association updates
- Zero mock data in codebase

### Milestone 2: Project Intelligence (Q1 2025)

**Goal:** Projects have custom instructions and contextual knowledge using Double-Loop architecture.

**Timeline:** 2-3 weeks after M1
**Status:** ✅ COMPLETE (100%)

**Deliverables:**
- ✅ Custom system instructions per project
- ✅ File upload API (markdown files)
- ✅ Vector search with pgvector (Loop B)
- ✅ Embedding generation and hybrid search
- ✅ Context caching for active projects (Loop A)
- ✅ Source citation display with inline markers

**Success Criteria:**
- ✅ User uploads .md file → embedded with vector search
- ✅ User asks question in project → AI uses project files (Loop A)
- ✅ User asks cross-project question → AI finds relevant patterns (Loop B)
- ✅ AI response includes sources with inline citations [1], [2]
- ✅ Context tracking accounts for injected knowledge

### Milestone 3: Global Memory (Q1 2025)

**Goal:** AI remembers user preferences and facts across all projects.

**Timeline:** 2-3 weeks after M2
**Status:** 📝 Planned

**Deliverables:**
- Supermemory.ai integration
- Automatic memory extraction from conversations
- Memory retrieval before each AI response
- Memory management UI
- Cross-project context sharing
- Knowledge graph visualization

**Success Criteria:**
- AI remembers user's name, role, preferences
- Facts from old projects inform new ones
- User can view and edit memories
- Cross-project context improves responses

### Milestone 4: Polish & Scale (Q2 2025)

**Goal:** Production-ready with teams support.

**Timeline:** Ongoing
**Status:** 📝 Backlog

**Features:**
- Multi-user authentication (OAuth, email)
- Team workspaces and sharing
- Usage analytics and cost tracking
- Advanced RAG (PDFs, code repos, URLs)
- Performance optimizations (caching, CDN)
- Deployment pipeline and monitoring

---

## 5. Technical Architecture

### Tech Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| **Frontend** | Next.js 16 (App Router) | RSC, server actions, streaming |
| **UI Library** | React 19 | Latest features, performance |
| **Styling** | Tailwind CSS v4 + shadcn/ui | Rapid development, consistency |
| **AI SDK** | Vercel AI SDK (@ai-sdk/react) | Streaming, model abstraction |
| **Database** | Supabase (PostgreSQL) | Managed, free tier, pgvector |
| **Vector Store** | Supabase pgvector | No separate service needed |
| **Memory** | Supermemory.ai | Specialized for long-term memory |
| **AI Gateway** | Custom (supports OpenAI, Anthropic, etc.) | Model flexibility, cost control |
| **Token Counting** | gpt-tokenizer | Accurate, fast |
| **Markdown** | streamdown + Shiki | Streaming-friendly, code highlighting |
| **Animation** | Motion (Framer Motion) | Smooth transitions |
| **Validation** | Zod v4 | Type-safe schemas |

### Architecture Diagram

#### System Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│  (Next.js 16 App Router + React 19)                         │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Chat UI    │  │ Project View │  │   Sidebar    │     │
│  │   (page.tsx) │  │ (project/*)  │  │  (sidebar)   │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
└────────────────────────────┼─────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                      Backend API                             │
│  (Next.js API Routes + Server Actions)                      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ /api/chat    │  │/api/projects │  │  /api/memory │     │
│  │ (streaming)  │  │   (CRUD)     │  │  (compress)  │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │              │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌──────────────────┐ ┌─────────────────┐ ┌──────────────────┐
│   AI Gateway     │ │    Supabase     │ │  Supermemory.ai  │
│ (OpenAI, etc.)   │ │   (Postgres)    │ │ (Global Memory)  │
│                  │ │                 │ │                  │
│  - GPT-4o        │ │  - users        │ │ - User prefs     │
│  - Claude        │ │  - projects     │ │ - Facts          │
│  - Gemini        │ │  - chats        │ │ - Decisions      │
│  - Deepseek      │ │  - messages     │ │ - Knowledge      │
│  - Perplexity    │ │  - files        │ │   graph          │
│                  │ │  - embeddings   │ │                  │
└──────────────────┘ └─────────────────┘ └──────────────────┘
```

#### Double-Loop Architecture (M2)
```
┌────────────────────────────────────────────────────────────────┐
│                  DOUBLE-LOOP ARCHITECTURE                       │
│          Model-Agnostic Context Management System               │
└────────────────────────────────────────────────────────────────┘

                         User Query
                             │
                             ▼
                    ┌────────────────┐
                    │  Chat API      │
                    │  /api/chat     │
                    └────┬───────┬───┘
                         │       │
        ┌────────────────┘       └────────────────┐
        │                                         │
        ▼                                         ▼
┌──────────────────────┐            ┌──────────────────────────┐
│  LOOP A: PROJECT     │            │  LOOP B: GLOBAL          │
│  CONTEXT CACHING     │            │  HYBRID SEARCH           │
│  (High Fidelity)     │            │  (Associative Wisdom)    │
└──────────────────────┘            └──────────────────────────┘
        │                                         │
        │ 1. Get project files                   │ 1. Generate embedding
        │ 2. Get custom instructions             │ 2. Vector similarity
        │ 3. Check token budget                  │ 3. Text search (tsvector)
        │                                         │ 4. Reciprocal Rank Fusion
        ▼                                         ▼
┌──────────────────────┐            ┌──────────────────────────┐
│  Model Supports      │            │  Supabase pgvector       │
│  Caching?            │            │  hybrid_search RPC       │
│  (Gemini, Claude)    │            │                          │
└───┬──────────┬───────┘            │  - Search files table    │
    │ Yes      │ No                 │  - Search messages table │
    ▼          ▼                    │  - Cosine similarity     │
┌────────┐  ┌─────────┐            │  - Weight: 0.7 vector    │
│Prompt  │  │ Full    │            │            0.3 text      │
│Caching │  │Context  │            └──────────┬───────────────┘
└────┬───┘  └────┬────┘                       │
     │           │                            │
     └─────┬─────┘                            │ Top 5 results
           │                                  │ (excluding current
           │                                  │  project)
           ▼                                  ▼
      ┌────────────────────────────────────────────────┐
      │      SYSTEM PROMPT CONSTRUCTION                │
      │                                                 │
      │  1. ACTIVE PROJECT CONTEXT (Authoritative)     │
      │     - Full files from Loop A                   │
      │     - Custom instructions                      │
      │     - "Ground truth" for current work          │
      │                                                 │
      │  2. RELEVANT MEMORY (Inspiration)              │
      │     - Snippets from Loop B (other projects)    │
      │     - "Wisdom" for pattern matching            │
      │     - Cross-project learnings                  │
      └─────────────────┬──────────────────────────────┘
                        │
                        ▼
                   ┌─────────┐
                   │   LLM   │
                   │  (Any   │
                   │  Model) │
                   └────┬────┘
                        │
                        ▼
                 Streaming Response
```

### Data Flow

**Chat Message Flow:**
1. User types message → PromptInput component
2. `handleSubmit` → calls `sendMessage` from useChat
3. POST to `/api/chat` with messages, model, settings, projectId
4. API checks context usage → compress if critical
5. API executes Double-Loop context gathering (M2):
   - **Loop A:** Project files + custom instructions (high fidelity)
   - **Loop B:** Hybrid search across all projects (associative wisdom)
6. API injects memories from Supermemory (M3)
7. API calls AI model via AI Gateway with enriched context
8. Streaming response → parsed by AI SDK → rendered
9. Messages saved to database with embeddings

**Loop A: Project Context Caching (M2):**
1. User uploads file → POST `/api/projects/[id]/files`
2. File stored in database → embedding generated → stored in pgvector
3. User sends message in project chat
4. API retrieves ALL project files and custom instructions
5. If model supports caching (Gemini, Claude):
   - Marks project context for prompt caching
   - Subsequent requests reuse cached context
6. If model doesn't support caching:
   - Injects full project context into system prompt
   - Token budget checked to ensure it fits
7. AI response has high-fidelity access to project knowledge

**Loop B: Global Hybrid Search (M2):**
1. User sends message (in any project or standalone chat)
2. API generates embedding for user query
3. API calls `hybrid_search` RPC function in Supabase:
   - Vector similarity search (cosine distance)
   - Text search using tsvector
   - Reciprocal Rank Fusion to merge results
   - Weighted combination: 70% vector + 30% text
4. Top 5 results retrieved from files and messages tables
5. Results filtered to exclude current project (avoid duplication)
6. Relevant snippets injected as "inspiration" context
7. AI response can reference patterns from other projects

**Memory Flow (M3):**
1. Every N messages → extract facts (background job)
2. Facts sent to Supermemory API
3. Before each AI response → search memories
4. Relevant memories injected into system prompt
5. AI response informed by global user context

### Database Schema (ER Diagram)

```
users
├── id (UUID, PK)
├── email (TEXT, UNIQUE)
├── name (TEXT)
└── timestamps

projects
├── id (UUID, PK)
├── user_id (UUID, FK → users)
├── name (TEXT)
├── description (TEXT)
└── timestamps

chats
├── id (UUID, PK)
├── user_id (UUID, FK → users)
├── project_id (UUID, FK → projects, NULLABLE)
├── title (TEXT)
├── model (TEXT)
├── last_message_at (TIMESTAMP)
└── timestamps

messages
├── id (UUID, PK)
├── chat_id (UUID, FK → chats)
├── role (TEXT: user|assistant|system)
├── content (JSONB)
├── sequence_number (INT)
├── token_count (INT)
└── created_at (TIMESTAMP)
```

---

## 6. Key Features Deep Dive

### 6.1 Forever Context

**Problem:** LLMs have fixed context windows. Once full, older messages are lost.

**Solution:** Three-tiered system:
1. **Real-time tracking** - Visual progress bar shows token usage
2. **Smart segmentation** - Separate tracking for system/history/draft
3. **Auto-compression** - Summarize older messages when >90% full

**Implementation:**
- `lib/context-tracker.ts` - Token counting with gpt-tokenizer
- `lib/memory-manager.ts` - Compression logic
- `/api/memory/compress` - GPT-4o-mini summarizer
- Keeps 4 most recent messages intact
- Summary injected as system message

**UX:**
- Color-coded progress bar (green → amber → red)
- Hover tooltip with exact token counts
- "Compressing history..." indicator during compression
- No user action required (fully automatic)

### 6.2 Project Workspaces

**Problem:** Can't organize related chats or share context between them.

**Solution:** Projects are folders with:
- Custom AI instructions
- Uploaded knowledge base files
- Associated chats
- Shared context across chats

**Implementation (M1):**
- Database tables: projects, chats (with project_id)
- API routes: `/api/projects/*` for CRUD
- UI: Project view page, sidebar organization
- Chats can be standalone or in projects

**Implementation (M2 - Double-Loop):**
- File upload: `/api/projects/[id]/files`
- Embeddings: OpenAI text-embedding-3-small (1536d)
- Storage: Supabase pgvector (vector(1536) columns)
- Loop A: Full file context injection (no chunking for active project)
  - Model-specific caching for Gemini and Claude
  - Standard context injection for other models
- Loop B: Hybrid search combining:
  - Vector similarity (cosine distance)
  - Full-text search (tsvector)
  - Reciprocal Rank Fusion algorithm
  - Weighted: 70% vector + 30% text

**UX:**
- Create project from sidebar
- Drag-and-drop chats into projects
- Detach chats from projects
- Upload files via project settings
- See which files were referenced in responses

### 6.3 Model Switching

**Problem:** Different tasks need different models (speed vs reasoning).

**Solution:** Dropdown selector with 10+ models, switch anytime.

**Supported Models:**
- **OpenAI:** GPT-4o, GPT-5 Pro/Mini, GPT-5.1 Thinking/Instant
- **Anthropic:** Claude Sonnet 4.5, Claude Opus 4
- **Google:** Gemini 3 Pro, Gemini 2.5 Flash
- **Deepseek:** Deepseek R1
- **Perplexity:** Sonar (web search)

**Implementation:**
- Model ID sent to `/api/chat` in request body
- AI Gateway routes to correct provider
- Context limits stored in `MODEL_CONTEXT_LIMITS` map
- Token tracking adjusts per model

**UX:**
- Dropdown in chat input footer
- Switch mid-conversation (new messages use new model)
- Visual indicator of current model
- Web search toggle (switches to Perplexity)

### 6.4 Global Memory (M3)

**Problem:** AI doesn't remember you across sessions or projects.

**Solution:** Supermemory extracts and stores facts, preferences, decisions.

**Memory Types:**
- **User Profile:** Name, role, company, location
- **Preferences:** Coding style, tone, language
- **Technical Facts:** APIs, frameworks, tools used
- **Decisions:** Architecture choices, constraints

**Implementation:**
- Background job: Every 10 messages → extract facts
- Extraction model: GPT-4o-mini with structured prompt
- Storage: Supermemory.ai API
- Retrieval: Before each response → search memories
- Injection: Relevant memories in system prompt

**UX:**
- Fully automatic (background extraction)
- Memory management page: View, edit, delete
- Visual indicators when AI uses a memory
- Toggle auto-memory on/off in settings

---

## 7. User Flows

### 7.1 First-Time User

1. Lands on home page (no auth needed for single-user MVP)
2. Sees empty chat interface with "Start a conversation"
3. Types question → AI responds with streaming text
4. Continues chatting → sees context bar filling up
5. Creates first project from sidebar → adds chat to it
6. Uploads markdown file → AI starts using it
7. Comes back tomorrow → sees full chat history

### 7.2 Power User (Multiple Projects)

1. Has 5 projects with 20+ chats each
2. Uses sidebar to navigate between projects
3. Searches for specific chat by keyword
4. Creates new chat → AI remembers preferences from Supermemory
5. Switches to Claude Opus mid-conversation for deep reasoning
6. Context reaches 90% → auto-compresses, continues seamlessly
7. Shares project export with team (M4 feature)

### 7.3 Knowledge Worker (File Upload)

1. Starts project for "Product Documentation"
2. Uploads 50 markdown files (API specs, guides, FAQs)
3. Files chunked and embedded automatically
4. Asks "How do I authenticate with the API?"
5. AI retrieves relevant chunks from docs
6. Response includes source citations
7. Clicks source → sees original file content

---

## 8. Success Metrics

### MVP (Milestone 1)

- **Adoption:** 10 beta users within 1 week
- **Retention:** 50%+ return after 1 week
- **Usage:** 100+ chats created
- **Technical:** < 2s p95 response latency

### Product-Market Fit (Milestone 3)

- **Adoption:** 1,000 users within 3 months
- **Retention:** 40%+ DAU/MAU
- **Engagement:** 20+ messages per user per day
- **NPS:** 50+

### Long-Term (Milestone 4)

- **Revenue:** $10k MRR from pro subscriptions
- **Scale:** 10k active users
- **Enterprise:** 5 team accounts

---

## 9. Risks & Mitigation

### Technical Risks

**Risk:** Supabase free tier limits (500MB DB, 2GB bandwidth)
**Mitigation:** Upgrade to $25/month Pro when needed. Monitor usage.

**Risk:** OpenAI API costs spiral with high embedding usage
**Mitigation:** Cache embeddings, limit chunk count, use smaller models.

**Risk:** Context compression loses important info
**Mitigation:** Keep 4 recent messages, use high-quality summarizer (GPT-4o-mini).

**Risk:** Supermemory doesn't integrate well
**Mitigation:** Build fallback with local vector store, or skip M3 for now.

### Product Risks

**Risk:** Users don't understand projects vs chats
**Mitigation:** Onboarding tooltips, default project, guided flow.

**Risk:** File upload is too slow
**Mitigation:** Process in background, show progress, limit file size.

**Risk:** Model switching is confusing
**Mitigation:** Smart defaults, tooltips, suggested models per task.

---

## 10. Competitive Landscape

| Feature | Bobo AI | ChatGPT | Claude Projects | Perplexity |
|---------|---------|---------|-----------------|------------|
| Projects | ✅ Full | ❌ None | ⚠️ Limited | ❌ None |
| File RAG | ✅ (M2) | ⚠️ Paid only | ✅ | ❌ |
| Context Management | ✅ Auto | ❌ Manual | ⚠️ Extended | ❌ |
| Model Switching | ✅ 10+ | ❌ GPT only | ❌ Claude only | ❌ Fixed |
| Global Memory | ✅ (M3) | ❌ | ❌ | ❌ |
| Web Search | ✅ Toggle | ⚠️ GPT-4o only | ❌ | ✅ Always |
| Self-Hosted | ✅ | ❌ | ❌ | ❌ |

**Key Differentiators:**
1. Only AI with automatic context compression
2. Model-agnostic (use any LLM)
3. Real-time token visualization
4. True project-based organization
5. Self-hostable and transparent

---

## 11. Development Timeline

### Phase 1: Foundation (Weeks 1-3) - CURRENT

- **Week 1:** Database + Client Setup
  - Set up Supabase
  - Run migrations
  - Create `lib/db/` utilities
  - Build user service (hardcoded for now)

- **Week 2:** Chat Persistence
  - Save messages in real-time
  - Load chat history on mount
  - Generate chat titles automatically
  - Delete/archive chats

- **Week 3:** Projects Backend
  - Project CRUD API routes
  - Chat-project associations
  - Replace all mock data
  - End-to-end testing

### Phase 2: Intelligence (Weeks 4-6)

- **Week 4:** File Upload
  - Upload API + validation
  - File storage in DB
  - Chunking algorithm
  - Basic UI for file management

- **Week 5:** RAG Pipeline
  - Embedding generation
  - pgvector setup
  - Semantic search implementation
  - Context injection in chat

- **Week 6:** RAG Polish
  - Source citations
  - Relevance scoring
  - Token accounting for context
  - Performance optimization

### Phase 3: Memory (Weeks 7-9)

- **Week 7:** Supermemory Setup
  - API integration
  - Memory extraction logic
  - Background job scheduling
  - Basic memory storage

- **Week 8:** Memory Retrieval
  - Search before each response
  - Memory injection in prompts
  - Cross-project memories
  - Memory UI (view/edit/delete)

- **Week 9:** Memory Polish
  - Knowledge graph visualization
  - Memory categorization
  - User controls (toggle, frequency)
  - Analytics and insights

### Phase 4: Production (Weeks 10+)

- **Week 10:** Multi-User Auth
- **Week 11:** Performance & Caching
- **Week 12:** Deployment & Monitoring
- **Week 13+:** Iterate based on feedback

---

## 12. Next Actions

### This Week (Milestone 1 - Setup)

- [x] Create Supabase schema
- [ ] Set up Supabase project at supabase.com
- [ ] Run migration in SQL editor
- [ ] Install `@supabase/supabase-js`
- [ ] Create `lib/db/client.ts`
- [ ] Create `lib/db/queries.ts`
- [ ] Create `lib/db/types.ts`
- [ ] Test database connection

### Next Week (Milestone 1 - API)

- [ ] Build `/api/projects/*` routes
- [ ] Build `/api/chats/*` routes
- [ ] Update `/api/chat` to save messages
- [ ] Create server actions for mutations
- [ ] Test all CRUD operations

### Week After (Milestone 1 - Frontend)

- [ ] Replace mock data in sidebar
- [ ] Replace mock data in project view
- [ ] Implement chat loading from DB
- [ ] Implement project creation flow
- [ ] Implement chat association (add/move/detach)
- [ ] End-to-end testing
- [ ] Deploy Milestone 1 MVP

---

## 13. Resources

**Documentation:**
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Supermemory API](https://supermemory.ai/docs)
- [OpenAI API](https://platform.openai.com/docs)

**Code References:**
- [Vercel AI Chatbot](https://github.com/vercel/ai-chatbot)
- [Supabase Examples](https://github.com/supabase/supabase/tree/master/examples)

**Design:**
- [ChatGPT Interface](https://chat.openai.com)
- [Claude Projects](https://claude.ai/projects)
- [shadcn/ui](https://ui.shadcn.com)

---

## 14. Team & Contacts

**Single Developer (MVP)**
- Developer/Designer: You
- Target Support: Indie makers, solo devs

**Future Team (Post-MVP)**
- Backend Engineer: API, database, RAG
- Frontend Engineer: UI/UX, components
- DevOps: Deployment, monitoring, scaling
- Growth: Marketing, user acquisition

---

**Document Maintained By:** Claude Code (AI Assistant)
**Next Review:** After Milestone 1 completion
