# Bobo AI Chatbot - Comprehensive Project Brief

**Version:** 3.0
**Last Updated:** November 25, 2025
**Status:** Personal productivity tool | M1-M2 Complete | M3 79% | Agent SDK Next

---

## 1. Executive Summary

> **Note:** Bobo is built as a **personal internal tool** for the developer. If successful after extended dogfooding (3-6 months), it may be adapted for broader use.

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

---

## 4. Product Vision & Roadmap

> For the detailed architecture of Bobo’s Knowledge, Context, and Cognitive layers (including projects vs chats vs global memory and About‑You docs), see `docs/context-memory-vision.md`.

### 4.0 Usage-First Roadmap & Dogfooding Guidelines

To avoid "building forever without shipping to myself", Bobo follows a usage-first cadence:

- After each milestone ships, pause net-new features for 1–2 weeks and use Bobo as the primary assistant for real work (coding, planning, docs).
- During these periods, only fix bugs, address paper-cuts, and refine backlog priorities based on actual friction you encounter.
- Start **M4 (Agent SDK)** now that M3 memory foundation is ready and agentic capabilities will accelerate everything else.
- Start **M5 (Cognitive Layer)** only when cross-project querying feels limited or project summaries become necessary.

This keeps the roadmap grounded in lived experience: every phase exists to solve pains you actually feel while using Bobo day-to-day.

**Personal Tool Principle:** "Let pain guide priorities." Build features when you feel their absence, not speculatively.

### Current State (v1.3.0 - Personal Tool MVP)

✅ **Completed:**
- Streaming chat interface with markdown/code support
- 10+ model selector (GPT, Claude, Gemini, Deepseek)
- Real-time context tracking with visual progress bar
- Automatic memory compression at 90% context usage
- Web search integration via Perplexity
- Full persistence layer (Supabase PostgreSQL + pgvector)
- ChatGPT-style collapsible sidebar
- Double-Loop RAG architecture (M2 complete)
- Hierarchical memory extraction system (M3 79% complete)
- Mobile-first responsive design (v1.3.0)
- Bobo identity/personality system

🎯 **Next Priority: Agent SDK (M4)**
- Claude Agent SDK integration
- Built-in tools: Read, Write, Edit, Bash, Glob, Grep
- Agent mode toggle in UI
- Tool execution streaming and display
- User confirmation for sensitive operations
- Integration with existing memory/context systems

📝 **Deferred (Pain-Driven):**
- M3 Phase 4: Memory polish features (provenance, debugger, export)
- M5: Knowledge graph & living docs
- Future: Multi-user features (if SaaS pivot)

### Milestone 1: Persistence Foundation ✅

**Goal:** Users can create projects, save chats, and move chats between projects.

**Status:** ✅ COMPLETE

**Deliverables:**
- ✅ Supabase database schema
- ✅ Database client utilities
- ✅ Project CRUD API routes
- ✅ Chat persistence (save/load messages)
- ✅ Chat-project association (add/move/detach)
- ✅ Replace all mock data with real DB calls

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

### Milestone 3: Global Memory 🚧

**Goal:** AI remembers user preferences and facts across all projects.

**Status:** 🚧 79% Complete (Phase 4 deferred)

**Deliverables:**
- ✅ User profile system (bio, background, preferences, technical context)
- ✅ Automatic memory extraction (Gemini 2.5 Flash Lite - 56% cheaper than GPT-4o-mini)
- ✅ 6 hierarchical memory categories
- ✅ Memory retrieval before each AI response
- ✅ Memory management UI (/memory page)
- ✅ Memory deduplication and consolidation
- 📝 Phase 4: Provenance tracking, debugger, export (deferred)

**Success Criteria:**
- ✅ AI remembers user's name, role, preferences
- ✅ Facts from conversations inform future responses
- ✅ User can view and edit memories

### Milestone 4: Agent SDK 🎯

**Goal:** Transform Bobo into an agentic assistant using Claude Agent SDK.

**Status:** 🎯 Current Priority

**Architecture:**
```
Chat Mode (/api/chat)    → AI Gateway → GPT, Gemini, Claude, Deepseek
Agent Mode (/api/chat)   → Claude SDK → Claude only (with tools)

Both modes share:
├─ User memory injection (M3)
├─ Project context injection (M2 Loop A)
├─ RAG search (M2 Loop B)
└─ Context tracking
```

**Deliverables:**
- Claude Agent SDK integration
- Built-in tools: Read, Write, Edit, Bash, Glob, Grep
- Agent mode toggle in UI
- Tool execution streaming and display
- User confirmation for sensitive operations (writes, deletes, bash)
- PreToolUse safety hooks
- Integration with existing memory/context systems

**Success Criteria:**
- Can toggle between Chat Mode and Agent Mode
- Agent can read/search project files
- Agent can create/edit files (with confirmation)
- Agent has access to user memory and project context
- Tool execution visible in real-time

### Milestone 5: Cognitive Layer (Deferred)

**Goal:** Living documentation and knowledge graph.

**Status:** 📝 Deferred (Pain-Driven)

**Trigger:** Implement when cross-project querying feels limited or project summaries become necessary.

**Features (when needed):**
- Per-project living doc entity (status, decisions, risks)
- Hierarchical summaries (session → daily → weekly)
- Fact extraction (subject/predicate/object)
- Cross-project knowledge graph queries
- Weekly executive brief

### Future: Production & Scale (If SaaS Pivot)

**Status:** 📝 Not Planned

> These features would only be built if Bobo transitions from personal tool to multi-user SaaS product after extended dogfooding (3-6 months minimum).

**Deferred Features:**
- Multi-user authentication (OAuth, email)
- Team workspaces and sharing
- Usage analytics and cost tracking
- Rate limiting and quotas
- Enterprise features

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
| **Memory** | Custom (Gemini 2.5 Flash Lite) | 56% cheaper than GPT-4o-mini |
| **AI Gateway** | Custom (supports OpenAI, Anthropic, etc.) | Model flexibility, cost control |
| **Agent SDK** | Claude Agent SDK | Agentic capabilities (M4) |
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
│   AI Gateway     │ │    Supabase     │ │  Custom Memory   │
│ (OpenAI, etc.)   │ │   (Postgres)    │ │  (Gemini 2.5)    │
│                  │ │                 │ │                  │
│  - GPT-4o        │ │  - users        │ │ - User prefs     │
│  - Claude        │ │  - projects     │ │ - Facts          │
│  - Gemini        │ │  - chats        │ │ - Decisions      │
│  - Deepseek      │ │  - messages     │ │ - Categories     │
│  - Perplexity    │ │  - files        │ │ - Technical      │
│                  │ │  - embeddings   │ │   context        │
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
6. API injects user memories from custom extraction system (M3)
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
1. Every N messages → extract facts using Gemini 2.5 Flash Lite
2. Facts stored in Supabase with hierarchical categories
3. Before each AI response → search relevant memories
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

**Solution:** Custom Gemini-powered system extracts and stores facts, preferences, decisions.

**Memory Types:**
- **User Profile:** Name, role, company, location
- **Preferences:** Coding style, tone, language
- **Technical Facts:** APIs, frameworks, tools used
- **Decisions:** Architecture choices, constraints

**Implementation:**
- Background job: Every 10 messages → extract facts
- Extraction model: Gemini 2.5 Flash Lite (56% cheaper than GPT-4o-mini)
- Storage: Supabase with 6 hierarchical memory categories
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

## 8. Risks & Mitigation

### Technical Risks

**Risk:** Supabase free tier limits (500MB DB, 2GB bandwidth)
**Mitigation:** Upgrade to $25/month Pro when needed. Monitor usage.

**Risk:** OpenAI API costs spiral with high embedding usage
**Mitigation:** Cache embeddings, limit chunk count, use smaller models.

**Risk:** Context compression loses important info
**Mitigation:** Keep 4 recent messages, use high-quality summarizer (GPT-4o-mini).

**Risk:** Memory extraction quality varies
**Mitigation:** Use Gemini 2.5 Flash Lite with structured extraction, deduplication.

### Product Risks

**Risk:** Users don't understand projects vs chats
**Mitigation:** Onboarding tooltips, default project, guided flow.

**Risk:** File upload is too slow
**Mitigation:** Process in background, show progress, limit file size.

**Risk:** Model switching is confusing
**Mitigation:** Smart defaults, tooltips, suggested models per task.

---

## 9. Competitive Landscape

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

## 10. Development Timeline

### Completed
- ✅ Phase 1: Persistence Foundation (M1)
- ✅ Phase 2: Project Intelligence (M2)
- 🚧 Phase 3: User Memory (M3) - 79%

### Current
- 🎯 Phase 4: Agent SDK Integration

### Future (Pain-Driven)
- 📝 Cognitive Layer (M5) - when cross-project querying feels limited
- 📝 SaaS Features - if pivot decision made after dogfooding

---

## 11. Resources

**Documentation:**
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview)
- [OpenAI API](https://platform.openai.com/docs)

**Code References:**
- [Vercel AI Chatbot](https://github.com/vercel/ai-chatbot)
- [Supabase Examples](https://github.com/supabase/supabase/tree/master/examples)

**Design:**
- [ChatGPT Interface](https://chat.openai.com)
- [Claude Projects](https://claude.ai/projects)
- [shadcn/ui](https://ui.shadcn.com)

---

## 12. Development

**Solo Developer Project** - Built for personal use
**AI Assistance:** Claude Code

---

**Document Maintained By:** Claude Code
**Last Major Update:** November 25, 2025 (Personal Tool + Agent SDK Pivot)
