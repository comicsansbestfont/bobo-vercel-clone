# Bobo AI Chatbot - Context & Instructions

## Project Overview
Bobo AI Chatbot is an advanced, production-ready AI chat application built with Next.js 16 and React 19. It features multi-model support (OpenAI, Anthropic, Google, Deepseek) via Vercel AI Gateway, real-time streaming with reasoning visualization, project-based organization, and persistent history using Supabase.

## Tech Stack
-   **Framework:** Next.js 16 (App Router)
-   **Frontend:** React 19, Tailwind CSS v4, shadcn/ui (Radix Primitives)
-   **AI:** Vercel AI SDK (`@ai-sdk/react`, `ai`), Vercel AI Gateway
-   **Database:** Supabase (PostgreSQL)
-   **Utilities:** `gpt-tokenizer` (token counting), `zod` (validation), `date-fns` (dates)

## Key Architecture

### Database (Supabase)
-   **Tables:** `users`, `projects`, `chats`, `messages`.
-   **Schema:** Stored in `supabase/migrations/`.
-   **Client:** `lib/db/client.ts`, `lib/db/queries.ts`.
-   **Conventions:** Use `lib/db` helpers for all DB interactions. Do not query Supabase directly from components.

### Chat & AI
-   **Route:** `app/api/chat/route.ts` handles streaming, model switching, and persistence.
-   **Gateway:** Uses `https://ai-gateway.vercel.sh/v1` via `@ai-sdk/openai` provider (configured in `lib/ai/models.ts`).
-   **Persistence:** Messages are saved *after* streaming completes (via `onFinish` callback or manual handling for OpenAI gateway).
-   **Message Format:** JSONB in DB. `parts` array supports `text`, `reasoning`, `source-url`, `tool-result`.

### Context Management
-   **Token Counting:** Real-time tracking in `lib/context-tracker.ts`.
-   **Compression:** Auto-compresses history when limits are reached (`app/api/memory/compress/route.ts`).
-   **UI:** Visual progress bar in chat interface.

## Development Workflow

### Commands
-   `npm run dev`: Start development server.
-   `npm run build`: Build for production.
-   `npm start`: Start production server.
-   `npm run lint`: Run ESLint.
-   `tests/api/run-all-tests.sh`: Run backend API tests.

### Directory Structure
-   `app/`: Next.js App Router pages and API routes.
-   `components/`: UI components (divided into `ai-elements`, `chat`, `project`, `ui`).
-   `lib/`: Utility functions, DB client, AI configuration.
-   `docs/`: Comprehensive documentation (read `docs/INDEX.md` for navigation).
-   `supabase/`: Database migrations and setup.

### Conventions
-   **Components:** Use functional components with TypeScript interfaces.
-   **Styling:** Tailwind CSS utility classes.
-   **State:** `useState` for local state, URL params for navigation state (e.g., `chatId`).
-   **Async/Await:** Always use async/await for promises.
-   **Error Handling:** Use `try/catch` blocks in API routes and meaningful error messages.

## Status
-   **Current Phase:** Milestone 2 (Project Intelligence/RAG) - In Progress.
-   **Completed:** Core Chat, Persistence, Basic Project Management.
-   **Backlog:** See `docs/product/PRODUCT_BACKLOG.md` and `CLAUDE.md` for current status.
