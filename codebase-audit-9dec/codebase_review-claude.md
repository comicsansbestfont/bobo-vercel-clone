# Comprehensive Codebase Audit Report

**Date:** December 9, 2025
**Auditor:** Claude Opus 4.5
**Method:** 6 parallel analysis agents (Architecture, Code Quality, Security, Performance, Testing, Dependencies)

---

## Executive Summary

This is a thorough audit of the Bobo AI Chatbot codebase - a Next.js 16 + React 19 application with a sophisticated Double-Loop RAG system. The application is well-architected with good separation of concerns, but significant issues exist in **security**, **testing**, and **performance** that should be addressed before production deployment.

### Quick Stats

| Category | Critical | High | Medium | Low |
|----------|----------|------|--------|-----|
| Security | 1 | 2 | 5 | 0 |
| Performance | 0 | 3 | 4 | 1 |
| Architecture | 0 | 0 | 5 | 3 |
| Code Quality | 0 | 1 | 2 | 4 |
| Testing | 0 | 3 | 0 | 2 |
| Dependencies | 0 | 1 | 2 | 4 |
| **Total** | **1** | **10** | **18** | **14** |

---

## Critical Issues (Immediate Action Required)

### 1. No Authentication on Any API Routes - CRITICAL

**Location:** All `/app/api/*` routes

Every endpoint operates under a hardcoded `DEFAULT_USER_ID`. If deployed publicly, **all user data is exposed**.

```typescript
// lib/db/client.ts:89
export const DEFAULT_USER_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
```

**Affected Endpoints:**
- `/api/chat` - Full chat access
- `/api/memory/*` - Memory read/write/delete
- `/api/projects/*` - Project CRUD operations
- `/api/chats/*` - Chat management
- `/api/advisory/*` - Advisory file access
- `/api/user/profile` - User profile modification

**Impact:** Anyone with network access can read/write/delete all chats, projects, memories, and user profiles.

**Recommendation:** Implement authentication (NextAuth, Clerk, or Supabase Auth with RLS)

---

### 2. No Rate Limiting - HIGH

**Location:** All API endpoints

Zero rate limiting implementation found. No middleware protecting expensive operations.

**Impact:**
- API endpoints can be abused
- Embedding generation (expensive API calls) has no limits
- AI chat endpoint can be DoS'd
- Memory extraction can be triggered unlimited times

**Recommendation:** Add rate limiting middleware (e.g., `@upstash/ratelimit`)

---

### 3. No Unit Tests - HIGH

**Location:** `/lib/*`, `/components/*`, `/app/api/*`

The codebase has **zero unit tests**. Only Playwright E2E tests exist. Core business logic in `/lib/` is completely untested.

**Missing Test Coverage:**
- Unit tests for lib/ (core business logic)
- Component tests for React components
- API route unit tests
- Context manager tests
- Claude SDK integration tests
- Memory manager tests

**Recommendation:** Add Jest/Vitest for unit testing with React Testing Library for components

---

### 4. No Error Monitoring Service - HIGH

**Location:** `components/error-boundary.tsx`, `app/error.tsx`, `app/global-error.tsx`

Errors only log to `console.error()`. No Sentry or equivalent for production error tracking.

```typescript
componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
  console.error('ErrorBoundary caught an error:', error, errorInfo);
  // No external reporting
}
```

**Recommendation:** Implement Sentry or similar error tracking service

---

## Architecture Issues

### Overall Structure Assessment

```
bobo-vercel-clone/
├── .claude/          # Claude Code agent configuration
├── advisory/         # Advisory business files (deals/clients)
├── app/              # Next.js App Router
│   ├── api/          # API routes (well-organized)
│   ├── project/      # Project views
│   └── projects/     # DUPLICATE route (issue)
├── components/       # React components
│   ├── ai-elements/  # AI chat UI primitives (34 components)
│   ├── ui/           # shadcn/ui base components (36 components)
│   └── ...           # Domain components
├── lib/              # Core business logic
│   ├── agent-sdk/    # Claude Agent SDK (17 files)
│   ├── ai/           # AI utilities (13 files)
│   ├── db/           # Database layer (well-encapsulated)
│   └── memory/       # Memory utilities
├── scripts/          # Build/utility scripts
├── supabase/         # Database migrations
└── tests/            # Test suites (E2E only)
```

### Issues Found

| Issue | Severity | Location | Details |
|-------|----------|----------|---------|
| Monolithic chat route | Medium | `app/api/chat/route.ts` | 1600+ lines handling OpenAI, Claude, Vercel AI SDK paths |
| Duplicate route directories | Medium | `app/project/` vs `app/projects/` | Creates confusion |
| 5 duplicate sidebar implementations | Medium | `components/ui/` | sidebar.tsx, bobo-sidebar.tsx, bobo-sidebar-option-a.tsx, collapsible-sidebar.tsx (x2) |
| Large ChatInterface component | Medium | `components/chat/chat-interface.tsx` | 1400+ lines, 9 useEffects, 15+ useState calls |
| Orphan files at lib root | Low | `lib/context-tracker.ts`, `lib/memory-manager.ts` | Should be in lib/ai/ and lib/memory/ |
| Missing DB types | Low | `lib/db/types.ts` | `message_continuations` table uses `as any` assertions |
| Empty directory | Low | `lib/supabase/` | Exists but empty |

### Recommendations

1. **Refactor chat route** into:
   - `/api/chat/openai/route.ts`
   - `/api/chat/claude/route.ts`
   - `/api/chat/utils/` for shared logic

2. **Consolidate sidebar components** to single implementation

3. **Extract ChatInterface** into smaller composable components:
   - `useFileAttachments` hook
   - `useDragAndDrop` hook
   - `useFormSubmission` hook

4. **Update Database types** for `message_continuations` table

---

## Code Quality Issues

### TypeScript Type Safety

#### `as any` Type Assertions (HIGH Priority)

**File:** `lib/db/queries.ts`

| Line | Code Pattern |
|------|-------------|
| 1340 | `await (supabase as any).from('message_continuations')` |
| 1369 | `await (supabase as any).from('message_continuations')` |
| 1392 | `await (supabase as any).from('message_continuations')` |
| 1423 | `await (supabase as any).from('messages')` |
| 1452 | `await (supabase as any).from('messages')` |
| 1484 | `await (supabase as any).from('messages')` |
| 1511 | `await (supabase as any).from('messages')` |
| 1531 | `await (supabase as any).from('message_continuations')` |

**Root Cause:** The `message_continuations` table and new message columns (`is_partial`, `completion_status`) are not defined in the `Database` type.

**Fix:** Update `/lib/db/types.ts` to include the `message_continuations` table schema.

### Inconsistent Logger Usage

The codebase has a proper structured logging system but some files still use `console.*`:

**Files using console.* instead of logger:**
| File | Lines |
|------|-------|
| `lib/advisory/file-reader.ts` | 61, 78, 124, 254, 259 |
| `lib/advisory/summarizer.ts` | 48, 93 |
| `lib/agent-sdk/advisory-tools.ts` | 77, 103, 108, 124, 128 |

**Available loggers in `lib/logger.ts`:**
- `chatLogger` - for chat operations
- `projectLogger` - for project operations
- `apiLogger` - for API routes
- `dbLogger` - for database operations
- `embeddingLogger` - for embedding operations
- `memoryLogger` - for memory operations

### Code Duplication

#### Response Construction Pattern (9 instances)

**File:** `app/api/projects/[id]/route.ts`

```typescript
// Repeated at lines 37-45, 51-59, 80-88, 95-104, 107-117, 137-146, 152-161, 179-188, 195-204
return new Response(
  JSON.stringify({
    error: 'Not found',
    message: 'Project not found',
  }),
  {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  }
);
```

**Recommendation:** Create helper function:
```typescript
function jsonErrorResponse(error: string, message: string, status: number) {
  return new Response(
    JSON.stringify({ error, message }),
    { status, headers: { 'Content-Type': 'application/json' } }
  );
}
```

#### Directory Walking Logic Duplication

**File:** `lib/ai/claude-advisory-tools.ts`

`globAdvisory()` (lines 565-590) and `grepAdvisory()` (lines 708-732) contain similar recursive directory walking logic.

**Recommendation:** Extract common `walkAdvisoryDirectory()` utility.

### Other Code Quality Issues

| Issue | Severity | Location |
|-------|----------|----------|
| Typo: `attachements` | Low | `prompt-input.tsx:153,165,179,189` |
| Magic numbers (8000, 15000, 500000) | Low | `lib/ai/claude-advisory-tools.ts` |
| Commented-out code | Low | `lib/db/queries.ts:973, 986-993` |
| 4 TODO items pending | Low | Various files |

### TODO Items to Address

| File | Line | TODO |
|------|------|------|
| `lib/memory/deduplicator.ts` | 168 | `// TODO: Get project ID` |
| `lib/agent-sdk/memory-tools-wrapper.ts` | 44 | `// TODO: Emit tool-approval-request event` |
| `lib/agent-sdk/memory-tools-wrapper.ts` | 88 | `// TODO: Emit tool-approval-request event` |
| `lib/agent-sdk/permission-manager.ts` | 27 | `// TODO: Consider using Redis for production` |

---

## Security Vulnerabilities

### Summary by Severity

| Severity | Count | Key Issues |
|----------|-------|------------|
| CRITICAL | 1 | No authentication on API routes |
| HIGH | 2 | No rate limiting, No CSP headers |
| MEDIUM | 5 | Various (detailed below) |

### Detailed Findings

#### 1. No CSP Headers - HIGH

**Location:** `next.config.ts`

No Content-Security-Policy headers configured.

**Impact:** Vulnerable to XSS, clickjacking, MIME type confusion attacks.

**Recommendation:** Add security headers:
```typescript
// next.config.ts
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline';"
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  // ... more headers
];
```

#### 2. XSS Risk via dangerouslySetInnerHTML - MEDIUM

**Location:** `components/ai-elements/code-block.tsx:114,119`

```typescript
dangerouslySetInnerHTML={{ __html: html }}
dangerouslySetInnerHTML={{ __html: darkHtml }}
```

HTML generated from Shiki library. Risk is mitigated by Shiki's sanitization, but input should be validated.

#### 3. Incomplete Path Traversal Protection - MEDIUM

**Location:** `lib/ai/claude-advisory-tools.ts`

`read_advisory_file` has path traversal check (line 408-411):
```typescript
if (normalizedPath.includes('..')) {
  return JSON.stringify({ success: false, error: 'Invalid file path' });
}
```

**Missing from:**
- `list_advisory_folder`
- `glob_advisory`
- `grep_advisory`

#### 4. Incomplete SSRF Protection - MEDIUM

**Location:** `lib/ai/claude-advisory-tools.ts:811-825`

Current protection:
```typescript
if (
  hostname === 'localhost' ||
  hostname === '127.0.0.1' ||
  hostname.startsWith('192.168.') ||
  hostname.startsWith('10.') ||
  hostname.startsWith('172.16.') ||
  hostname.endsWith('.local')
) { /* blocked */ }
```

**Missing:**
- `169.254.x.x` (link-local)
- IPv6 localhost (`::1`)
- `172.17-31.x.x` range (only 172.16 blocked)
- DNS rebinding protection

#### 5. Optional Cron Authentication - MEDIUM

**Location:** `app/api/cron/consolidate-memories/route.ts:12`

```typescript
if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return new Response('Unauthorized', { status: 401 });
}
```

Authentication only applied if `CRON_SECRET` is set.

#### 6. Supabase Anon Key Exposure - MEDIUM

**Location:** `lib/db/client.ts:34`

The anon key is publicly exposed (standard for Supabase), but without RLS enforcement, it provides full database access.

### Positive Security Findings

- SQL injection protected (Supabase parameterized queries)
- Sensitive API keys kept server-side only
- Proper client/server code separation
- File upload has extension and size validation

---

## Performance Bottlenecks

### Critical Performance Issues

#### 1. N+1 Query in Search Results - HIGH

**Location:** `app/api/chat/route.ts:175-228`

```typescript
// Executes O(n) queries per chat request
for (const result of searchResults) {
  const { data: fileData } = await supabase
    .from('files')
    .select('id')
    .eq('id', result.id)
    .single();
  // ... repeat for each result
}
```

**Fix:** Replace with single `IN` query:
```typescript
const ids = searchResults.map(r => r.id);
const { data } = await supabase
  .from('files')
  .select('id, project_id')
  .in('id', ids);
```

#### 2. Shiki Dual Theme Rendering - HIGH

**Location:** `components/ai-elements/code-block.tsx:62-71`

```typescript
const [html, darkHtml] = await Promise.all([
  codeToHtml(code, { lang: language, theme: 'github-light' }),
  codeToHtml(code, { lang: language, theme: 'github-dark' }),
]);
```

Shiki processes EVERY code block twice (light + dark themes).

**Fix:** Use `next/dynamic` with `ssr: false`:
```typescript
const CodeBlock = dynamic(() => import('./code-block'), { ssr: false });
```

#### 3. No Lazy Loading - HIGH

**Location:** Entire codebase

Zero usage of `next/dynamic` or `React.lazy()` found.

**Heavy components that should be lazy loaded:**
- Code highlighting (Shiki) - only needed when viewing code
- Import wizards (`ImportWizard`, `BulkImport`) - rarely used
- Agent tool components - only during tool execution
- Memory settings modal - accessed infrequently
- `@xyflow/react` canvas components - feature-specific

#### 4. Missing React.memo on Message List - MEDIUM

**Location:** `components/chat/chat-interface.tsx`

Large `promptInputElement` JSX block created on every render (lines 880-998). No `useMemo` on message rendering despite complex transformations.

#### 5. Native `<img>` Instead of `<Image>` - MEDIUM

**Location:** `components/chat/chat-interface.tsx:1049`

```tsx
<img
  src="/bobo-character.svg"
  alt="Bobo"
  className="w-96 h-96 md:w-[32rem] md:h-[32rem]..."
/>
```

Also in `components/ai-elements/message.tsx:351-356` for attachments.

**Fix:** Use `next/image` for automatic optimization.

#### 6. No React Query Caching in Sidebar - MEDIUM

**Location:** `components/ui/app-sidebar.tsx:548`

Sidebar fetches projects and chats on every mount without caching.

### Positive Performance Patterns

- `Promise.all()` for parallel queries in chat route
- `optimizePackageImports` configured for streamdown
- Progressive save mechanism for long responses
- Singleton Supabase client prevents connection recreation

### Recommended Optimizations

```typescript
// next.config.ts
experimental: {
  optimizePackageImports: [
    'streamdown',
    'shiki',
    'lucide-react',
    '@tabler/icons-react',
    '@radix-ui/react-*',
  ],
}
```

---

## Testing & Reliability

### Current Test Infrastructure

| Framework | Config File | Status |
|-----------|------------|--------|
| Playwright | `playwright.config.ts` | Present |
| Jest | `jest.config.*` | **Missing** |
| Vitest | `vitest.config.*` | **Missing** |

### E2E Test Coverage

**Location:** `tests/e2e/`

| Test File | Lines | Coverage |
|-----------|-------|----------|
| `m37-advisory-security.spec.ts` | 550 | SQL injection, XSS, input validation |
| `m37-advisory-search.spec.ts` | 464 | Advisory search tool |
| `chat-creation.spec.ts` | - | Basic chat creation |
| `chat-persistence.spec.ts` | - | Multi-message persistence |
| `project-chat-creation.spec.ts` | - | Project-based chats |
| `m2-citations.spec.ts` | - | RAG citations |
| `m37-advisory-*.spec.ts` | - | Various advisory features |

### E2E Test Quality Issues

- Hardcoded timeouts (`await page.waitForTimeout(3000)`)
- Weak assertions (`expect(hasContent).toBe(true)` where `hasContent = response.length > 50`)
- Loose selectors
- No page object model pattern
- No test data isolation/cleanup

### API Integration Tests

**Location:** `tests/api/`

- Custom test runner (not Jest/Vitest compatible)
- Documented 47.1% pass rate with known blockers

### Critical Test Gaps

| Area | Status | Priority |
|------|--------|----------|
| Unit tests for `/lib/` | **MISSING** | P0 |
| Component tests | **MISSING** | P0 |
| API route unit tests | **MISSING** | P1 |
| Error monitoring | **MISSING** | P0 |
| Multi-browser E2E | Missing | P2 |
| Mobile viewport E2E | Missing | P2 |

### Reliability Patterns Found

#### Good Patterns

1. **Error Boundaries:**
   - Root-level ErrorBoundary in layout.tsx
   - Route-level error.tsx and global-error.tsx

2. **Graceful Degradation:**
   ```typescript
   const [chat, profile, memories] = await Promise.all([
     getChat(activeChatId),
     getUserProfile().catch(err => null),  // Graceful fallback
     getUserMemories().catch(err => []),
   ]);
   ```

3. **Timeout Handling:**
   ```typescript
   class TimeoutTracker {
     shouldShutdown(): boolean {
       return this.getRemainingMs() < SHUTDOWN_BUFFER_MS;
     }
   }
   ```

4. **Token Counting Fallback:**
   ```typescript
   try {
     return encode(text).length;
   } catch {
     return Math.ceil(text.length / 4);  // Heuristic fallback
   }
   ```

---

## Dependencies & Infrastructure

### Package Statistics

- **Production dependencies:** 61 packages
- **Dev dependencies:** 12 packages

### Duplicate/Redundant Packages

#### Icon Libraries (HIGH IMPACT)

| Package | Version | Usage |
|---------|---------|-------|
| `lucide-react` | v0.554.0 | 52 files |
| `@tabler/icons-react` | v3.35.0 | 11 files |

**Recommendation:** Consolidate to `lucide-react` only.

#### AI SDK Version Mismatch

- Root: `ai@5.0.104`
- `@ai-sdk/react` dependency: `5.0.98`

Creates duplicate bundles.

### Deprecated Transitive Dependencies

| Package | Deprecation |
|---------|-------------|
| `inflight` | "leaks memory. Do not use it" |
| `glob` v7/v8 | "versions prior to v9 are no longer supported" |
| `rimraf` v2/v3 | "won't be included in future versions" |
| `sourcemap-codec` | "use @jridgewell/sourcemap-codec instead" |

### Misplaced Dependencies

Should be in `devDependencies`:
- `dotenv` - Only used in scripts
- `glob` - Only used in indexing scripts

### Heavy Bundle Impact Dependencies

| Package | Estimated Size | Usage |
|---------|---------------|-------|
| `shiki` | ~500KB+ | 1 file (code-block.tsx) |
| `@tabler/icons-react` | ~300KB+ | 11 files |
| `@xyflow/react` | ~200KB+ | 7 files (canvas) |
| `motion` | ~150KB+ | 8 files |
| `posthog-js` | ~100KB+ | 2 files |

### TypeScript Configuration

**File:** `tsconfig.json`

Current: `strict: true` (good baseline)

**Missing strict options:**
- `noUnusedLocals`
- `noUnusedParameters`
- `noImplicitReturns`
- `noFallthroughCasesInSwitch`
- `exactOptionalPropertyTypes`

**Target:** `ES2017` - Could be updated to `ES2020+` for modern browsers.

### ESLint Configuration

**File:** `eslint.config.mjs`

Very minimal - only Next.js defaults. Missing rules for:
- Import ordering
- No console.log in production
- Accessibility (a11y)
- TypeScript-specific (no-explicit-any)

### Missing Configuration Files

- `.env.example` - Onboarding friction
- `.nvmrc` or `.node-version` - No Node.js version pinning

### Vercel Configuration

**File:** `vercel.json`

Missing:
- `functions` configuration (memory limits, timeouts, regions)
- `headers` configuration for security headers

---

## Prioritized Recommendations

### Immediate (P0) - Before Production

1. **Implement authentication**
   - Options: NextAuth, Clerk, or Supabase Auth with RLS
   - Affects: All API routes

2. **Add rate limiting**
   - Package: `@upstash/ratelimit`
   - Priority endpoints: `/api/chat`, `/api/memory/*`

3. **Configure CSP headers**
   - Location: `next.config.ts`
   - Include: X-Frame-Options, X-Content-Type-Options

4. **Set up error monitoring**
   - Package: `@sentry/nextjs`
   - Integrate with ErrorBoundary

5. **Add unit testing framework**
   - Package: Jest or Vitest + React Testing Library
   - Priority: `lib/ai/`, `lib/db/`, `lib/memory/`

### Short-term (P1) - Within 2 Sprints

6. **Fix N+1 query**
   - File: `app/api/chat/route.ts:175-228`
   - Replace loop with single `IN` query

7. **Add critical path unit tests**
   - Chat route logic
   - Context manager
   - Memory manager
   - Claude SDK integration

8. **Lazy load heavy components**
   - CodeBlock (Shiki)
   - Import wizards
   - @xyflow/react canvas

9. **Extend path traversal protection**
   - `list_advisory_folder`
   - `glob_advisory`
   - `grep_advisory`

10. **Consolidate icon libraries**
    - Migrate 11 files from Tabler to Lucide
    - Remove `@tabler/icons-react`

### Medium-term (P2) - Backlog

11. **Refactor monolithic chat route**
    - Split into `/api/chat/openai/`, `/api/chat/claude/`
    - Extract shared utilities

12. **Break up large components**
    - ChatInterface → smaller composable components
    - AppSidebar → extract sections

13. **Add `optimizePackageImports`**
    - `shiki`, `lucide-react`, `@radix-ui/*`

14. **Update Database types**
    - Add `message_continuations` to types.ts
    - Remove `as any` assertions

15. **Expand E2E testing**
    - Multi-browser (Firefox, Safari)
    - Mobile viewports
    - Network failure scenarios

---

## What's Working Well

### Architecture Strengths
- Clean separation of concerns (lib/api/components)
- Proper client/server code separation in agent-sdk
- Well-designed Double-Loop RAG architecture
- Comprehensive database layer with proper type definitions
- Good API route organization (RESTful, resource-based)

### Code Quality Strengths
- Strong TypeScript usage with comprehensive interfaces
- Good JSDoc documentation on database functions
- Consistent naming conventions
- Proper use of Zod validation (in memory endpoints)
- Structured logging with module-specific tags

### Reliability Strengths
- Progressive save mechanism for long AI responses
- Graceful degradation in parallel data fetching
- Root-level error boundary with recovery UI
- Timeout tracking with continuation tokens

### Security Strengths (Partial)
- SQL injection safe (Supabase parameterized queries)
- Sensitive API keys kept server-side only
- SSRF protection (partial implementation)
- File upload validation (extension, size)

### E2E Testing Strengths
- Comprehensive security test suite (550 lines)
- Performance testing with timing metrics
- Regression tests for specific bugs
- Advisory search validation queries

---

## Key Files Reference

| Category | Files |
|----------|-------|
| **Security** | All `/app/api/*` routes |
| **Performance** | `app/api/chat/route.ts`, `components/ai-elements/code-block.tsx` |
| **Architecture** | `lib/db/queries.ts`, `components/chat/chat-interface.tsx` |
| **Testing** | `tests/e2e/`, (add new `tests/unit/`) |
| **Config** | `next.config.ts`, `tsconfig.json`, `eslint.config.mjs` |
| **Types** | `lib/db/types.ts` |
| **Logging** | `lib/logger.ts` |
| **Error Handling** | `components/error-boundary.tsx`, `app/error.tsx` |

---

## Appendix: Files Audited

### API Routes
- `/app/api/chat/route.ts` (1598 lines)
- `/app/api/memory/entries/route.ts`
- `/app/api/memory/bulk/route.ts`
- `/app/api/memory/clear-all/route.ts`
- `/app/api/projects/route.ts`
- `/app/api/projects/[id]/route.ts`
- `/app/api/projects/[id]/files/route.ts`
- `/app/api/chats/[id]/route.ts`
- `/app/api/advisory/import/route.ts`
- `/app/api/cron/consolidate-memories/route.ts`
- `/app/api/agent/approve-tool/route.ts`
- `/app/api/user/profile/route.ts`

### Core Libraries
- `/lib/db/queries.ts`
- `/lib/db/client.ts`
- `/lib/db/types.ts`
- `/lib/ai/claude-advisory-tools.ts`
- `/lib/ai/context-manager.ts`
- `/lib/ai/embedding.ts`
- `/lib/advisory/file-reader.ts`
- `/lib/advisory/summarizer.ts`
- `/lib/agent-sdk/*.ts` (17 files)
- `/lib/memory/*.ts`
- `/lib/context-tracker.ts`
- `/lib/logger.ts`

### Components
- `/components/chat/chat-interface.tsx` (1400+ lines)
- `/components/ui/app-sidebar.tsx` (600+ lines)
- `/components/ai-elements/code-block.tsx`
- `/components/ai-elements/message.tsx`
- `/components/ai-elements/prompt-input.tsx`
- `/components/error-boundary.tsx`
- `/components/posthog-provider.tsx`

### Configuration
- `/next.config.ts`
- `/tsconfig.json`
- `/eslint.config.mjs`
- `/playwright.config.ts`
- `/vercel.json`
- `/package.json`

---

*This audit was conducted on December 9, 2025 using 6 parallel Claude Opus 4.5 agents analyzing architecture, code quality, security, performance, testing, and dependencies.*
