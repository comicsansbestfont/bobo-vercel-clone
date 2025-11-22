# Bobo AI Chatbot - Milestone Breakdown

**Last Updated:** November 22, 2025

## Current Implementation Status

### ✅ FULLY IMPLEMENTED

**1. Core Chat Functionality**
- Streaming chat interface with Vercel AI SDK
- Model switcher (10+ models: GPT-4o, GPT-5 variants, Claude, Gemini, Deepseek)
- Web search integration via Perplexity
- Message rendering with markdown, code blocks, reasoning display
- File attachment support in UI
- Real-time streaming responses
- Error handling and retry mechanism

**2. Context Management ("Forever Context")**
- Token counting with `gpt-tokenizer`
- Model-specific context limits (128k - 2M tokens)
- Real-time usage visualization (system/history/draft segments)
- Three-state monitoring: safe (< 70%), warning (70-90%), critical (> 90%)
- Visual progress bar with color-coded segments

**3. Memory Compression**
- Automatic compression when context reaches critical state
- API endpoint `/api/memory/compress` using GPT-4o-mini
- Keeps 4 most recent messages intact
- Summarizes older messages into system prompt
- Preserves system prompts and key decisions

**4. Frontend Architecture**
- Next.js 16 App Router with React 19
- ChatGPT-style collapsible sidebar
- Responsive design with Tailwind CSS v4
- shadcn/ui component library
- Motion animations for smooth transitions

**5. Project UI Scaffolding** ⚠️ (Frontend Only - No Backend)
- Project view page (`/project/[projectId]`)
- Project header with breadcrumbs
- Chat cards grid view
- Empty state for projects with no chats
- Project name editing (UI only)
- Chat input with model selector and web search
- Sidebar shows projects and associated chats
- All data is MOCK DATA (hardcoded in components)

### ❌ NOT IMPLEMENTED

**Critical Missing Components:**
1. **Database Layer** - No Supabase, PostgreSQL, or any persistence
2. **Project Backend API** - No CRUD operations for projects
3. **Chat Persistence** - Chats exist only in session state
4. **File Upload Pipeline** - No RAG, no embeddings, no vector store
5. **Supermemory Integration** - No global user memory
6. **Authentication** - No user management (even single-user)
7. **Project Knowledge Base** - No file storage or semantic search
8. **Cross-Project Context** - No context sharing mechanism
9. **User Memory/Preferences** - No persistent user profile

## Tech Stack Current vs Planned

| Component | Current | Planned (from brief) |
|-----------|---------|---------------------|
| Frontend | ✅ Next.js 16, React 19, Tailwind v4 | ✅ Same |
| Backend | ✅ Next.js API Routes | ✅ Same |
| Database | ❌ None | ❌ Supabase (Postgres) |
| Vector Store | ❌ None | ❌ Supabase pgvector |
| Memory Layer | ❌ None | ❌ Supermemory.ai |
| AI Provider | ✅ OpenAI via AI Gateway | ✅ Same |
| Auth | ❌ None | ❌ Single-User Hardcoded |

---

## MILESTONE 1: Project & Chat Management Foundation

**Goal:** User can create projects, start individual chats, associate chats to projects, and move/detach chats between projects.

### Scope
This milestone focuses on **data persistence and CRUD operations** without the advanced AI features (RAG, memories, cross-context).

### What's Needed

#### 1.1 Database Setup
- [ ] Set up Supabase project
- [ ] Create database schema:
  - `users` table (id, email, name, created_at)
  - `projects` table (id, user_id, name, description, created_at, updated_at)
  - `chats` table (id, user_id, project_id (nullable), title, model, created_at, updated_at)
  - `messages` table (id, chat_id, role, content, token_count, created_at)
- [ ] Set up environment variables (SUPABASE_URL, SUPABASE_ANON_KEY)
- [ ] Create database client utility

#### 1.2 Chat Persistence
- [ ] Save chat messages to database in real-time
- [ ] Load chat history from database
- [ ] Update chat title based on first message
- [ ] Store model and settings per chat
- [ ] Implement chat deletion
- [ ] List all user chats (with pagination)

#### 1.3 Project CRUD API
- [ ] `POST /api/projects` - Create new project
- [ ] `GET /api/projects` - List user's projects
- [ ] `GET /api/projects/[id]` - Get project details
- [ ] `PATCH /api/projects/[id]` - Update project (name, description)
- [ ] `DELETE /api/projects/[id]` - Delete project
- [ ] `GET /api/projects/[id]/chats` - Get chats in a project

#### 1.4 Chat-Project Association
- [ ] Add chat to project: `POST /api/projects/[id]/chats/[chatId]`
- [ ] Remove chat from project: `DELETE /api/projects/[id]/chats/[chatId]`
- [ ] Move chat between projects: `PATCH /api/chats/[id]/project`
- [ ] Detach chat from project (make it standalone)
- [ ] Handle orphaned chats (chats not in any project)

#### 1.5 Frontend Integration
- [ ] Replace mock data with API calls
- [ ] Implement real project creation flow
- [ ] Add "Add to Project" action to chat cards
- [ ] Implement drag-and-drop to move chats between projects
- [ ] Show loading states and error handling
- [ ] Update sidebar to reflect real data
- [ ] Navigate to actual chat page when clicking chat card

#### 1.6 Single-User Auth (MVP)
- [ ] Create hardcoded user session
- [ ] Middleware to inject user context
- [ ] No login required - auto-authenticate as default user

### Success Criteria
- ✅ User can create, edit, delete projects via UI
- ✅ All chats persist across page refreshes
- ✅ User can add existing chats to projects
- ✅ User can detach chats from projects
- ✅ User can move chats between projects
- ✅ Sidebar dynamically updates based on database state
- ✅ No mock data - everything reads from database

### Technical Decisions
- **Database:** Supabase (Postgres) - as per original brief
- **ORM:** Direct Supabase client (no Prisma/Drizzle for MVP)
- **Chat IDs:** Use nanoid for unique IDs
- **Soft Deletes:** Implement for projects and chats

---

## MILESTONE 2: Project Context & Instructions

**Goal:** User can add context/instructions to projects, and the AI retrieves relevant information when responding to prompts in that project.

### Scope
Implement **project-level system instructions** and **file-based knowledge retrieval (RAG)**.

### What's Needed

#### 2.1 Project Context Schema
- [ ] Add columns to `projects` table:
  - `system_instructions` (text) - Custom instructions for the project
  - `created_at`, `updated_at`
- [ ] Create `project_files` table:
  - `id`, `project_id`, `filename`, `content`, `file_size`, `mime_type`, `uploaded_at`
- [ ] Create `embeddings` table:
  - `id`, `project_id`, `file_id`, `chunk_text`, `chunk_index`, `embedding` (vector(1536)), `created_at`
- [ ] Enable `pgvector` extension on Supabase

#### 2.2 File Upload API
- [ ] `POST /api/projects/[id]/files` - Upload markdown file
- [ ] Validate file type (.md only for MVP)
- [ ] Store file content in database
- [ ] Return file metadata

#### 2.3 RAG Pipeline
- [ ] Chunking logic:
  - Split markdown files into semantic chunks (500-1000 tokens)
  - Preserve headings and code blocks
- [ ] Embedding generation:
  - Use OpenAI `text-embedding-3-small` (1536 dimensions)
  - Generate embeddings for each chunk
  - Store in `embeddings` table with vector type
- [ ] Create chunking utility: `lib/chunking.ts`
- [ ] Create embedding utility: `lib/embeddings.ts`

#### 2.4 Semantic Search
- [ ] Implement vector similarity search:
  - Query: `SELECT * FROM embeddings WHERE project_id = $1 ORDER BY embedding <-> $2 LIMIT 5`
  - Use cosine similarity for ranking
- [ ] Create search utility: `lib/vector-search.ts`
- [ ] Return top 3-5 most relevant chunks per query

#### 2.5 Context Injection
- [ ] Modify `/api/chat` route:
  - Check if chat belongs to a project
  - If yes, retrieve project's system instructions
  - Perform semantic search on user's query
  - Build enhanced system prompt:
    ```
    Base Instructions: {system_instructions}

    Relevant Context:
    {chunk1}
    {chunk2}
    {chunk3}

    User Query: {user_message}
    ```
- [ ] Track which chunks were used (for citation)
- [ ] Add token counting for context chunks

#### 2.6 Frontend Features
- [ ] Project settings modal/page:
  - Textarea for system instructions
  - File upload drag-and-drop zone
  - List uploaded files with delete option
  - Preview file content
- [ ] Show "Project Context Active" indicator in chat
- [ ] Display source citations when AI uses knowledge base
- [ ] Processing indicator during file upload/chunking

### Success Criteria
- ✅ User can add custom instructions to a project
- ✅ User can upload .md files to a project
- ✅ Files are automatically chunked and embedded
- ✅ AI retrieves relevant chunks when answering questions
- ✅ Context from knowledge base appears in AI responses
- ✅ User sees which files were referenced in response
- ✅ Token limits account for injected context

### Technical Decisions
- **Chunking Strategy:** Semantic chunking (respect markdown structure)
- **Embedding Model:** `text-embedding-3-small` (1536d, $0.02/1M tokens)
- **Vector DB:** Supabase pgvector (no separate Pinecone/Weaviate)
- **Chunk Size:** 500-1000 tokens with 100 token overlap
- **Retrieval:** Top 5 chunks, then filter to top 3 by relevance score

---

## MILESTONE 3: Global Memory & Knowledge Graph

**Goal:** Build holistic user memory across all chats and projects, creating a persistent knowledge graph.

### Scope
Implement **Supermemory.ai integration** for long-term memory and **cross-project context sharing**.

### What's Needed

#### 3.1 Supermemory Integration
- [ ] Sign up for Supermemory.ai account
- [ ] Get API key and add to `.env.local`
- [ ] Install Supermemory SDK or use REST API
- [ ] Create memory utilities: `lib/supermemory.ts`
- [ ] Implement memory operations:
  - `addMemory(userId, content, metadata)`
  - `searchMemory(userId, query, limit)`
  - `deleteMemory(memoryId)`

#### 3.2 Automatic Memory Creation
- [ ] Background job to extract facts from conversations:
  - Run after every N messages (e.g., 10)
  - Use GPT-4o-mini to extract: user preferences, facts, constraints, decisions
  - Store in Supermemory with tags (project_id, chat_id, timestamp)
- [ ] Memory categories:
  - User preferences (coding style, tone, language)
  - Technical facts (APIs used, frameworks, dependencies)
  - Project decisions (architecture choices, constraints)
  - Personal info (name, role, company)

#### 3.3 Memory Retrieval
- [ ] Before each AI response:
  - Search Supermemory for relevant memories
  - Include in system prompt:
    ```
    User Context:
    - Name: John, role: Senior Engineer
    - Prefers TypeScript over JavaScript
    - Working on e-commerce project using Next.js
    ```
- [ ] Scope memory retrieval:
  - Global memories (apply to all chats)
  - Project-specific memories
  - Chat-specific memories

#### 3.4 Cross-Project Context Sharing
- [ ] Add settings per project:
  - "Share context with other projects" (boolean)
  - "Import context from project X" (multi-select)
- [ ] When enabled:
  - Include embeddings from linked projects in semantic search
  - Merge system instructions from linked projects
  - Show which projects contributed context

#### 3.5 Knowledge Graph Visualization (Stretch)
- [ ] Create `/memory` page:
  - Show all stored memories
  - Visualize connections between projects/chats
  - Allow editing/deleting memories
  - Search memories by keyword/tag
- [ ] Use React Flow or similar library for graph visualization

#### 3.6 Memory Management UI
- [ ] User settings page:
  - Toggle auto-memory on/off
  - Set memory frequency (messages per extraction)
  - View and delete individual memories
  - Export all memories as JSON
- [ ] Inline memory indicators:
  - Show when AI uses a memory in response
  - "View memory" link to see source

### Success Criteria
- ✅ AI remembers user preferences across all chats
- ✅ Facts from past projects inform current work
- ✅ User can see what the AI "knows" about them
- ✅ Cross-project context improves AI responses
- ✅ User can control what gets remembered
- ✅ Memories persist even after chat deletion

### Technical Decisions
- **Memory Service:** Supermemory.ai (as per brief)
- **Extraction Frequency:** Every 10 messages or on demand
- **Memory Model:** GPT-4o-mini for fact extraction
- **Tagging Strategy:** Hierarchical (user → project → chat)
- **Retrieval Limit:** Top 10 memories per query

---

## MILESTONE 4: Polish & Advanced Features (Post-MVP)

These are enhancements beyond the core functionality:

### 4.1 Enhanced Chat Features
- [ ] Chat folders/organization
- [ ] Star/favorite chats
- [ ] Search across all chats
- [ ] Export chat as markdown/PDF
- [ ] Share chat publicly (read-only link)

### 4.2 Project Enhancements
- [ ] Project templates (e.g., "Code Review", "Research")
- [ ] Project archiving
- [ ] Project duplication
- [ ] Project sharing (collaborate with others)
- [ ] Project statistics (chat count, token usage, cost)

### 4.3 Advanced RAG
- [ ] Support PDF, DOCX, TXT files
- [ ] Web scraping for URLs added to project
- [ ] Code repository integration (GitHub)
- [ ] Automatic metadata extraction (author, date, tags)
- [ ] Re-ranking model for better retrieval

### 4.4 Multi-User Support
- [ ] Proper authentication (email/password, OAuth)
- [ ] User profiles
- [ ] Usage limits and quotas
- [ ] Billing integration

### 4.5 Performance & Monitoring
- [ ] Add request logging
- [ ] Track token usage per user
- [ ] Cost tracking dashboard
- [ ] Performance metrics (response time, error rate)
- [ ] Caching layer (Redis) for embeddings

---

## Recommended Development Order

Based on your agile approach, here's the optimal sequence:

### Phase 1: Foundation (2-3 weeks)
1. Database setup (Supabase)
2. Chat persistence
3. Basic project CRUD
4. Replace all mock data

### Phase 2: Project Context (2-3 weeks)
5. File upload API
6. RAG pipeline (chunking + embeddings)
7. Vector search
8. Context injection in chat

### Phase 3: Memory Layer (2-3 weeks)
9. Supermemory integration
10. Automatic memory extraction
11. Memory retrieval in chat
12. Memory management UI

### Phase 4: Cross-Context (1-2 weeks)
13. Cross-project context sharing
14. Knowledge graph visualization
15. Advanced memory features

### Phase 5: Polish (Ongoing)
16. UI/UX improvements
17. Performance optimization
18. Testing and bug fixes
19. Documentation

---

## What to Do Next

Based on your current state, I recommend:

1. **Start Milestone 1 immediately** - You have all the frontend pieces, now add the backend
2. **Focus on database schema first** - Once data persists, everything else follows
3. **Defer Milestone 3** - Supermemory is powerful but not critical for initial usability
4. **Keep Milestone 2 simple** - Start with .md files only, no PDFs/DOCx yet

Would you like me to:
- Generate the Supabase schema SQL?
- Create API route stubs for Milestone 1?
- Build the database client utilities?
- Implement the project CRUD operations?

Let me know which part you'd like to tackle first!
