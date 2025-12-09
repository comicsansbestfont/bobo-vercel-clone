# Codebase Review: Bobo AI Chatbot

## 1. Executive Summary

**Project Status:** Production-ready MVP with advanced features.
**Tech Stack:** Next.js 16 (App Router), React 19, Supabase, Vercel AI SDK, Tailwind CSS v4.
**Overall Quality:** High. The codebase demonstrates a strong command of modern React patterns, server-side streaming, and database design.

**Critical Findings:**
1.  **"God Object" API Route:** The core chat logic (`app/api/chat/route.ts`) is over-complicated and difficult to maintain.
2.  **Frontend State Complexity:** The main chat interface (`chat-interface.tsx`) suffers from complex, race-condition-prone state management.
3.  **Single-User Architecture:** The application is hard-wired for a single user via a constant ID, which will be a significant refactoring blocker for multi-user support.

---

## 2. Architectural Analysis

### 2.1 Backend API (`app/api/chat/route.ts`)
**Severity:** 🔴 Critical / Refactor Needed

The chat route acts as a monolithic controller handling too many distinct responsibilities:
-   **Request Processing:** Validation and parsing.
-   **Context Assembly:** Parallel fetching of User Profile, Memories, Projects, and vector embeddings.
-   **System Prompt Engineering:** Dynamic construction of complex prompts based on context.
-   **Model Orchestration:** Three separate execution paths (OpenAI Gateway, Native Claude SDK, Vercel AI SDK fallback) are intermingled.
-   **Persistence:** Code for saving messages to Supabase is duplicated across the execution paths.
-   **Side Effects:** Triggers memory compression and extraction asynchronously.

**Recommendation:** Split into service layers:
-   `ContextService`: Handles data fetching and context assembly.
-   `PromptService`: Pure functions to generate system prompts.
-   `ModelGateway`: Unified interface for different model providers.
-   `PersistenceService`: Centralized logic for saving messages and handling side effects.

### 2.2 Frontend Architecture (`components/chat/chat-interface.tsx`)
**Severity:** 🟠 High / Refactor Recommended

The component mixes UI presentation with complex session logic:
-   **State Management:** Uses multiple `useState` and `useRef` hooks to track history loading, URL syncing, and "auto-submit" logic.
-   **Hydration Issues:** Complex `useEffect` chains attempt to sync URL parameters (`?chatId=...`) with local state, leading to potential race conditions (evidenced by extensive logging and guard clauses).

**Recommendation:** Extract custom hooks:
-   `useChatSession()`: Manages `chatId` and URL synchronization.
-   `useChatHistory()`: Handles fetching and setting initial messages.
-   `useAutoSubmit()`: Encapsulates logic for handling the `?message=...` URL parameter.

### 2.3 Database Layer (`lib/db/`)
**Severity:** 🟢 Good / Minor Improvements

-   **Strengths:**
    -   Clean separation of concerns with `client.ts` (connection) and `queries.ts` (logic).
    -   Use of `rpc` for performance-critical operations (vector search).
    -   Strong typing with TypeScript interfaces.
-   **Weaknesses:**
    -   **Hardcoded User:** `DEFAULT_USER_ID` in `client.ts` bypasses auth.
    -   **Indexing:** Verify composite index on `messages(chat_id, sequence_number)` exists for efficient history loading.

---

## 3. Code Quality & Security

### 3.1 Security Hotspots
-   **Path Traversal:** The `read_advisory_file` tool in `lib/ai/claude-advisory-tools.ts` checks for `..` manually.
    -   *Risk:* Low (checked), but using `path.resolve` and ensuring the result starts with the expected root is safer.
-   **SSRF Protection:** The `fetch_url` tool correctly blocks localhost/private IP ranges.
-   **RLS Policies:** Reliance on application-level filtering (`.eq('user_id', DEFAULT_USER_ID)`) instead of Row Level Security (RLS) is risky if RLS is not enforced at the database level.

### 3.2 Code Consistency
-   **Duplication:** Message persistence logic is repeated 3 times in the API route.
-   **Type Definitions:** Types in `lib/db/types.ts` seem manually maintained. Use `supabase gen types` to auto-generate types from the schema to ensure synchronization.

### 3.3 Performance
-   **Parallelization:** Excellent use of `Promise.all` in `route.ts` to fetch context concurrently.
-   **Bundle Size:** `next.config.ts` correctly excludes heavy directories (`docs`, `tests`) from serverless builds.
-   **Streaming:** Robust implementation of custom SSE for Claude SDK to support "thinking" blocks and tool use.

---

## 4. Feature-Specific Review

### 4.1 Memory System (M3.5)
-   **Implementation:** Sophisticated pipeline involving "progressive saving" (for timeouts), background extraction, and vector search.
-   **Risk:** The "fire-and-forget" nature of background tasks (`triggerMemoryExtraction`) might lead to silent failures. Consider a task queue (e.g., QStash or Supabase Edge Functions) for reliability in production.

### 4.2 Agent Tools
-   **Structure:** `lib/ai/claude-advisory-tools.ts` is well-structured with clear Zod-like schemas for Claude.
-   **Functionality:** Covers search, read, list, and even grep (content search), providing powerful context to the LLM.

---

## 5. Recommendations Roadmap

1.  **Refactor Persistence:** Create a unified `saveMessage(chatId, role, content)` function in `lib/db` and use it across all 3 API paths.
2.  **Extract Hooks:** Refactor `chat-interface.tsx` to move logic into `hooks/use-chat-session.ts`.
3.  **Modularize API:** Break `app/api/chat/route.ts` into smaller files within `lib/ai/services/`.
4.  **Enforce RLS:** Ensure Supabase RLS policies are enabled and functionally redundant to the application-level user ID checks.
5.  **Automate Types:** Switch to auto-generated Supabase types to prevent schema-code drift.
