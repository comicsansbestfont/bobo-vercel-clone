# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.3.0] - 2025-11-25

### Added
- **Bobo Identity System**
  - Bobo now has a personality that activates when users ask "who is Bobo?" or "who are you?"
  - Friendly Australian-ish persona: "constellation creature made of interconnected nodes"
  - Identity only triggers on direct questions, otherwise acts as normal assistant
  - System prompt injection in `/api/chat/route.ts`

- **Welcome Screen with Bobo Character**
  - Large Bobo mascot (384x384px mobile, 512x512px desktop) on empty chat state
  - Greeting: "Tell Bobo Anything"
  - Placeholder: "What's on your mind?"
  - Character SVG at `/public/bobo-character.svg` (transparent background)

### Improved
- **Mobile Sidebar Overhaul** (Complete redesign)
  - Changed from full-screen overlay to 85% width panel with backdrop
  - Smooth 0.2s slide animation (removed clunky fade)
  - Dark backdrop that dims content and can be clicked to close
  - Shadow on panel for visual depth
  - Close button (X) properly positioned
  - `components/ui/collapsible-sidebar.tsx` completely refactored

- **Mobile Footer Bar** (Option B design)
  - Changed from stacked list (Home, Memory, Profile) to horizontal icon bar
  - 44px touch targets for proper mobile accessibility
  - Icons: Home, Memory, Profile + Theme switcher in single row
  - `justify-around` spacing for even distribution
  - `components/ui/bobo-sidebar-option-a.tsx` bottom section redesigned

- **Accessibility Improvements**
  - Wrapped hamburger menu (IconMenu2) in proper `<button>` with `aria-label="Open navigation menu"`
  - Wrapped close button (IconX) in proper `<button>` with `aria-label="Close navigation menu"`
  - Added `aria-expanded` state to hamburger button
  - Fixed raw SVG accessibility violations

- **Toolbar Layout** (Claude-inspired)
  - Single row layout with left/right grouping
  - Left: Action buttons (attach, web search, context)
  - Right: Model selector + submit button
  - Consistent spacing and alignment

### Fixed
- Bobo character SVG had black background - removed via sed
- Sidebar animation was clunky (slide + fade combo) - now pure slide
- Close button in mobile sidebar was hard to find - now floating top-right
- Footer navigation items (Home, Memory, Profile) were stacked - now horizontal
- Touch targets on mobile footer were too small - now 44x44px minimum

### Changed
- `components/chat/chat-interface.tsx` - Added Bobo welcome screen, redesigned toolbar
- `components/ui/collapsible-sidebar.tsx` - Mobile sidebar panel + backdrop
- `components/ui/bobo-sidebar-option-a.tsx` - Footer bar redesign
- `app/api/chat/route.ts` - Bobo identity trigger system prompt
- `public/bobo-character.svg` - Copied from docs, removed black background

## [1.2.0] - 2025-01-23

### Added
- **E2E Testing Suite** with Playwright
  - Chat creation test with TD-8 viewport regression check (app/api/chat/route.ts:28)
  - Project chat creation test with database association verification
  - Chat persistence test across page refreshes
  - M2 Citations Flow test (file upload → inline citations)
- **CI/CD Pipeline** via GitHub Actions
  - Automated linting on every push/PR
  - Build verification before merge
  - E2E test execution in CI environment
  - Test artifact uploads (reports, screenshots)
- **Background Compression** system
  - Non-blocking conversation history compression via onFinish hook
  - Automatic compression when conversations exceed 20 messages
  - Preserves recent 4 messages, summarizes older ones
  - Implemented in both OpenAI and non-OpenAI streaming paths (app/api/chat/route.ts:157-210)
- **Empty State Components** for better UX
  - FileUploadEmptyState for knowledge base section
  - Illustrated empty states with icons and helpful text
- **Testing Documentation** (TESTING.md)
  - Comprehensive guide for running and writing E2E tests
  - Troubleshooting section for common issues
  - CI/CD integration documentation
  - Best practices for test maintenance

### Improved
- **API Error Messages** across 13 endpoints
  - Replaced generic "Unknown error" with contextual messages
  - Added helpful guidance like "Please refresh and try again"
  - Better user experience during error conditions
- **Logging System** standardization
  - Replaced 15+ console.log statements with structured chatLogger
  - Consistent error tracking across API routes
  - Debug logs auto-suppressed in production
- **Source Type Detection** in citation system
  - Smart detection of file vs message sources in global search
  - Database queries for proper source attribution
  - Async trackGlobalSources for accurate project name resolution (lib/ai/source-tracker.ts:77-124)
- **Project Name Queries** for citations
  - Proper database joins for project names in citations
  - Eliminates TODO comments and placeholder logic
  - Accurate "Source: [Project Name]" attribution (app/api/chat/route.ts:88-150)

### Fixed
- **TD-1**: Verbose logging cleanup - migrated to structured logger
- **TD-6**: Implemented smart source type detection (was placeholder TODO)
- **TD-7**: Background compression now runs asynchronously (app/api/chat/route.ts:634-637, 744-747)
- **TD-10**: E2E tests prevent TD-8 viewport bug regressions

### Changed
- Updated documentation to reflect M2 100% completion
  - PROJECT_BRIEF.md: M2 status 67% → 100%
  - README.md: M2 progress 39% → 100%
  - CLAUDE.md: Added Double-Loop RAG architecture details
- Package.json test scripts
  - Added `npm test` for headless Playwright execution
  - Added `npm run test:ui` for interactive test debugging
  - Added `npm run test:headed` for visible browser testing
  - Added `npm run test:debug` for step-through debugging
  - Added `npm run test:report` for HTML report viewing
- .gitignore updated with Playwright artifacts
  - /test-results/, /playwright-report/, /playwright/.cache/, tests/fixtures/

### Technical Debt Paid
- TD-1: ✅ Logging cleanup completed
- TD-7: ✅ Background compression implemented
- TD-10: ✅ E2E test suite created

## [1.1.0] - 2025-01-23

### Added
- **M2: Project Intelligence (Double-Loop RAG)** - 100% Complete
  - Loop A: Project Context Caching
    - Full file context loading for active projects
    - Anthropic Prompt Caching integration
    - Gemini Context Caching support
    - Standard context injection for other models
  - Loop B: Global Hybrid Search
    - pgvector semantic search across all projects
    - Full-text search with PostgreSQL tsvector
    - Reciprocal Rank Fusion algorithm
    - Cross-project pattern matching ("Inspiration" mode)
  - **Inline Citations** (Perplexity-style)
    - Automatic [1], [2], [3] citation markers
    - Source attribution for project files
    - Source attribution for global search results
    - Click-to-view source functionality
    - Project name resolution for citations
- **Custom Instructions** per project
  - Project-specific system prompts
  - Settings page UI for instruction management
  - Auto-save functionality
- **Knowledge Base File Upload**
  - Markdown file upload (.md, max 10MB)
  - File validation and size checks
  - File management UI (upload, delete, preview)
  - Automatic embedding generation
  - Vector storage with pgvector
- **Source Tracking System**
  - Citation metadata in message parts
  - Dual-source tracking (Loop A + Loop B)
  - Inline citation insertion algorithm
  - Source viewer UI component

### Fixed
- **TD-8**: Chat viewport disappearing during first message streaming
  - Single ChatInterface mount prevents state wipes
  - Guarded history loading with streaming/persistence flags
  - 1.5s DB persistence window before reload
- **TD-9**: Proper Next.js router usage for chatId updates
  - Replaced window.history.replaceState with router.replace
  - useSearchParams sync maintained
  - No mid-stream navigation interruptions
- **BUG-2**: Non-functional buttons in ProjectHeader
  - Removed dead buttons (Share, Export, More options)
  - Implemented Copy Link button with clipboard API
  - Toast notifications for user feedback

### Technical Details
- Database schema updates:
  - Added `custom_instructions` TEXT to projects table
  - Created `files` table with embedding support
  - Added `embedding` column to messages table (vector(1536))
  - Created `hybrid_search` RPC function for weighted search
- API endpoints:
  - POST `/api/projects/[id]/files` - File upload
  - DELETE `/api/projects/[id]/files/[fileId]` - File deletion
  - GET `/api/projects/[id]/files` - List project files
  - PATCH `/api/projects/[id]` - Update custom instructions
- Libraries added:
  - OpenAI Embeddings API integration
  - Supabase pgvector extension

## [1.0.0] - 2025-01-22

### Added
- **Core Chat Functionality**
  - Real-time streaming responses via Vercel AI SDK
  - Support for 10+ AI models (OpenAI, Anthropic, Google, Deepseek)
  - Web search integration via Perplexity
  - Reasoning display for thinking models (GPT-5.1)
- **Database Layer** with Supabase/PostgreSQL
  - Projects and chats persistence
  - Message history storage
  - Full conversation replay
  - Automatic sequence numbering
- **Project Management**
  - Create and organize projects
  - Move chats between projects
  - Project-based chat filtering
  - Project settings page
- **UI Components**
  - Sidebar with projects and chats
  - Message bubbles with copy/retry actions
  - Code blocks with syntax highlighting (Shiki)
  - Model selector with 10+ options
  - Web search toggle
  - Loading states and skeletons
- **Context Management**
  - Real-time token counting with gpt-tokenizer
  - Three-segment tracking (system, history, draft)
  - Model-specific context limits
  - Visual progress indicators (safe/warning/critical)
  - Usage states with color coding

### Technical Architecture
- Next.js 16 (App Router) with React 19
- Vercel AI SDK for streaming
- AI Gateway for unified model access
- shadcn/ui + Radix UI primitives
- Tailwind CSS v4 for styling
- TypeScript with strict mode
- Supabase for database and auth (future)

---

## Version History Summary

- **v1.2.0** (2025-01-23): Polish & Testing Sprint - E2E tests, CI/CD, background compression
- **v1.1.0** (2025-01-23): M2 Project Intelligence - Double-Loop RAG, inline citations, file uploads
- **v1.0.0** (2025-01-22): Initial release - Core chat, projects, persistence

---

## Upgrade Notes

### Upgrading to 1.2.0

**Database**: No migrations required.

**Environment**: No new variables required.

**Testing Setup**:
```bash
# Install Playwright browsers
npx playwright install chromium

# Run tests
npm test
```

**CI/CD**:
- Add repository secrets if using GitHub Actions:
  - AI_GATEWAY_API_KEY
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY

### Upgrading to 1.1.0

**Database Migrations Required**:
```sql
-- Add custom_instructions to projects
ALTER TABLE projects ADD COLUMN custom_instructions TEXT;

-- Create files table
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  content TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add embedding to messages
ALTER TABLE messages ADD COLUMN embedding vector(1536);

-- Create hybrid_search RPC function
-- (See migrations/add_hybrid_search.sql)
```

**Environment Variables**:
- No new variables required (uses existing AI_GATEWAY_API_KEY for embeddings)

---

## Links

- [Project Brief](./docs/PROJECT_BRIEF.md)
- [Product Backlog](./docs/PRODUCT_BACKLOG.md)
- [Testing Guide](./TESTING.md)
- [Claude Code Guide](./CLAUDE.md)
- [GitHub Repository](https://github.com/yourusername/ai-chatbot)

---

**Maintained by**: Product Owner / CTO
**Last Updated**: January 23, 2025
