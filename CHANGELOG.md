# Changelog

All notable changes to Bobo AI Chatbot will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-11-22

### V1: Persistence Foundation - SHIPPED ✅

**Major Release:** Full database persistence with Supabase, project management, and comprehensive testing.

### Added

#### Database & Backend
- Full Supabase PostgreSQL integration
- 4-table schema: users, projects, chats, messages
- 15 API endpoints for projects, chats, and messages
- Real-time message persistence during streaming
- Automatic chat title generation
- Chat history loading from database
- Project-chat association management

#### Frontend
- Project creation modal with validation
- Sidebar integration with real API data (removed 130+ lines of mock data)
- Project detail pages with chat listings
- Professional skeleton loading states
- Toast notifications for user feedback
- Error boundaries at component and global levels
- Custom 404 page

#### Testing Infrastructure
- Automated backend API test suite (16 tests, 100% pass rate)
- Data seeding script for test data generation
- Comprehensive testing plan documentation (70+ pages)
- Quick start testing guide
- QA testing via Chrome DevTools

#### Documentation
- Complete progress tracker
- Sprint planning for Milestone 2
- Product backlog
- Testing quick start guide
- V1 completion summary
- QA test results report

### Changed
- Replaced all mock data with real API calls
- Updated sidebar to fetch from `/api/projects` and `/api/chats`
- Enhanced project page with live data and edit functionality
- Improved loading states with structured skeleton screens

### Fixed
- TypeScript type error in project page (projectId type mismatch)
- Test script field naming (project_id → projectId)
- 404 page prerendering error (added 'use client' directive)
- Seed data script variable typo (standaloneChats)

### Technical Details

**Stack:**
- Next.js 16 (App Router)
- React 19
- Supabase (PostgreSQL + Auth)
- TypeScript
- Tailwind CSS v4
- Vercel AI SDK

**API Endpoints:**
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create project
- `GET /api/projects/[id]` - Get project details
- `PATCH /api/projects/[id]` - Update project
- `DELETE /api/projects/[id]` - Delete project
- `GET /api/projects/[id]/chats` - List project chats
- `GET /api/chats` - List all chats
- `POST /api/chats` - Create chat
- `GET /api/chats/[id]` - Get chat details
- `PATCH /api/chats/[id]` - Update chat
- `DELETE /api/chats/[id]` - Delete chat
- `GET /api/chats/[id]/messages` - List chat messages
- `POST /api/chats/[id]/messages` - Create message
- `PATCH /api/chats/[id]/project` - Move chat to/from project
- `POST /api/chat` - Streaming chat endpoint

**Test Coverage:**
- Backend: 16 automated API tests (100% pass rate)
- Frontend: 5 critical UI flows tested
- Build: Production build successful
- Zero console errors

### Performance
- Loading states implemented throughout
- Optimized API response with proper indexing
- Efficient token counting with heuristic fallback

### Known Limitations
- AI responses require `AI_GATEWAY_API_KEY` environment variable
- Turbopack warning about multiple lockfiles (cosmetic, non-blocking)

### Migration Notes
- Requires Supabase project setup
- Environment variables needed: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Run migration: `supabase/migrations/20250122000000_initial_schema.sql`

---

## [Unreleased]

### Planned for v2.0.0 (Milestone 2: Project Intelligence)
- Custom project instructions
- File upload to projects (Markdown)
- RAG pipeline with semantic search
- Vector embeddings with pgvector
- Source citations in responses
- Project settings page

---

**Legend:**
- ✅ Shipped
- 🚀 Next Up
- 📝 Planned
- ⏳ In Progress
