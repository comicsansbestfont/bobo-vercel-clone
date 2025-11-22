# BUG REPORT: AI Chat Streaming Non-Functional

**Report ID:** BUG-2025-01-22-001
**Date:** January 22, 2025
**Severity:** CRITICAL - Blocking core functionality
**Reporter:** Claude Code AI Assistant
**Status:** NEEDS SENIOR ENGINEER ESCALATION

---

## EXECUTIVE SUMMARY

After implementing AI SDK integration fixes based on official Vercel documentation, the chat streaming functionality remains non-functional. While the AI Gateway connectivity is confirmed working, API requests from the frontend hang indefinitely. Investigation reveals a **blocking TypeScript compilation error** in an unrelated database file (`lib/db/queries.ts:113`) that prevents Next.js from properly serving API routes.

**Root Cause:** TypeScript compilation failure blocking API route execution
**Impact:** All API endpoints non-responsive (both `/api/chat` and `/api/projects`)
**User Experience:** Messages send but never receive responses; infinite loading state

---

## ENVIRONMENT DETAILS

### System Information
- **OS:** macOS (Darwin 25.0.0)
- **Node.js:** v22.18.0
- **npm:** 10.9.3
- **Next.js:** 16.0.3 (Turbopack)
- **React:** 19.2.0

### Package Versions
```json
{
  "ai": "^5.0.98",
  "@ai-sdk/react": "^2.0.98",
  "@ai-sdk/openai": "^2.0.71",
  "next": "16.0.3",
  "react": "19.2.0"
}
```

### Environment Variables
```bash
AI_GATEWAY_API_KEY=vck_70PoyoMl4KL****************aiJT2RXqT31N96ab (VALID ✓)
NEXT_PUBLIC_SUPABASE_URL=https://xrwbbqvwhwabbnwwxcxm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc******************* (VALID ✓)
```

---

## EXPECTED VS ACTUAL BEHAVIOR

### Expected Behavior
1. User sends message "Hello! Can you tell me what 2+2 equals?"
2. Frontend sends POST to `/api/chat` with UIMessage format
3. Backend streams response using `streamText()` and `toUIMessageStreamResponse()`
4. Frontend displays streamed assistant response in real-time
5. Messages persist to Supabase database

### Actual Behavior
1. ✅ User sends message successfully
2. ✅ Frontend sends POST to `/api/chat` (request format correct)
3. ❌ Request hangs indefinitely (status: pending)
4. ❌ No response ever received
5. ❌ Loader spins forever
6. ❌ No console errors in browser
7. ❌ Dev server consumes high CPU (120.2%) but no visible error logs

---

## REPRODUCTION STEPS

1. Start dev server: `npm run dev`
2. Navigate to `http://localhost:3000`
3. Type message in chat input: "Hello! Can you tell me what 2+2 equals?"
4. Click Submit button
5. Observe: Message displays, loader appears, but no response ever arrives

**Reproduction Rate:** 100% (every attempt fails)

---

## TECHNICAL INVESTIGATION

### 1. AI Gateway Connectivity Test ✅

**Test Command:**
```bash
curl -X POST 'https://ai-gateway.vercel.sh/v1/chat/completions' \
  -H 'Authorization: Bearer vck_70PoyoMl4KL***' \
  -H 'Content-Type: application/json' \
  -d '{"model":"openai/gpt-4o","messages":[{"role":"user","content":"test"}],"stream":false,"max_tokens":5}'
```

**Result:** ✅ SUCCESS
```json
{
  "id": "gen_01KAMWZ297FNB82BTRGEC936SC",
  "object": "chat.completion",
  "choices": [{
    "message": {
      "role": "assistant",
      "content": "Yes, your message was"
    }
  }],
  "usage": {
    "total_tokens": 13,
    "cost": 0.00007
  }
}
```

**Conclusion:** AI Gateway is accessible and functioning correctly. API key is valid.

---

### 2. Frontend Request Analysis ✅

**Network Request to `/api/chat`:**
```http
POST /api/chat HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "model": "openai/gpt-4o",
  "webSearch": false,
  "chatId": null,
  "id": "rDigXOqtUpYPkcF3",
  "messages": [{
    "parts": [{"type": "text", "text": "Hello! Can you tell me what 2+2 equals?"}],
    "id": "CQxmyfaRsG8nCVkP",
    "role": "user"
  }],
  "trigger": "submit-message"
}
```

**Status:** PENDING (indefinitely)
**Conclusion:** Request format is correct per AI SDK UIMessage specification

---

### 3. TypeScript Compilation Error ❌ **ROOT CAUSE**

**Build Command Output:**
```bash
npm run build

Running TypeScript ...
Failed to compile.

./lib/db/queries.ts:113:6
Type error: No overload matches this call.
  Overload 1 of 2, '(values: never, options?: { count?: "exact" | "planned" | "estimated" | undefined; } | undefined): PostgrestFilterBuilder<{ PostgrestVersion: "12"; }, never, never, null, "projects", never, "POST">', gave the following error.
    Argument of type '{ user_id: string; id?: string | undefined; name: string; description: string | null; }' is not assignable to parameter of type 'never'.
```

**Location:** `lib/db/queries.ts:113`

**Code:**
```typescript
const { data, error } = await supabase
  .from('projects')
  .insert({          // <-- LINE 113: TypeScript error here
    ...project,
    user_id: DEFAULT_USER_ID,
  })
```

**Impact:** Next.js in development mode cannot compile TypeScript, preventing API routes from being served.

---

### 4. Process Analysis

**Dev Server Process:**
```
PID: 28993
CPU: 120.2%  (HIGH - indicates blocking operation)
Memory: 1.35 GB
Status: Running but unresponsive to HTTP requests
```

**Pending Network Requests:**
- `/api/projects` - PENDING
- `/api/chats` - SUCCESS (200)
- `/api/chat` - PENDING

**Conclusion:** TypeScript error is preventing server from compiling routes. Server is stuck trying to compile.

---

## CODE CHANGES IMPLEMENTED (AI SDK Integration)

### Changes Made to Fix AI SDK Integration ✅

#### 1. Created Model Provider Configuration
**File:** `lib/ai/models.ts` (NEW)
```typescript
import { createOpenAI } from '@ai-sdk/openai';

const gateway = createOpenAI({
  apiKey: process.env.AI_GATEWAY_API_KEY || '',
  baseURL: 'https://ai-gateway.vercel.sh/v1',
  name: 'vercel-ai-gateway',
});

export function getModel(modelId: string) {
  return gateway(modelId);
}
```

**Rationale:** Per official docs, AI Gateway requires proper provider configuration with base URL

---

#### 2. Updated Backend API Route
**File:** `app/api/chat/route.ts`

**Changes:**
```typescript
// BEFORE
const result = streamText({
  model: webSearch ? 'perplexity/sonar' : model,  // ❌ String not allowed
  // ...
});
return result.toTextStreamResponse({...});  // ❌ Wrong format for useChat

// AFTER
import { getModel } from '@/lib/ai/models';

const result = streamText({
  model: getModel(webSearch ? 'perplexity/sonar' : model),  // ✅ Model instance
  messages: convertToModelMessages(messages),
  // ...
});
return result.toUIMessageStreamResponse({...});  // ✅ Correct format for useChat
```

**Reference:** https://ai-sdk.dev/docs/ai-sdk-ui/chatbot

---

#### 3. Updated Frontend useChat Hook
**File:** `app/page.tsx`

**Changes:**
```typescript
// BEFORE
const { messages, sendMessage, ... } = useChat({
  api: '/api/chat',  // ❌ Invalid option
  onResponse: (response) => {...},  // ❌ Invalid option
});

// AFTER
import { DefaultChatTransport } from 'ai';

const { messages, sendMessage, ... } = useChat({
  transport: new DefaultChatTransport({
    api: '/api/chat',
    fetch: async (input, init) => {
      const response = await fetch(input, init);
      // Custom header handling
      const responseChatId = response.headers.get('X-Chat-Id');
      if (responseChatId && !chatId) {
        setChatId(responseChatId);
      }
      return response;
    },
  }),
  onError: (error) => {...},  // ✅ Valid option
  onFinish: (message) => {...},  // ✅ Valid option
});
```

**Rationale:** useChat requires DefaultChatTransport per official docs

---

#### 4. Fixed TypeScript Route Params (Next.js 16)
**Files:** `app/api/projects/[id]/route.ts`, `app/api/projects/[id]/chats/route.ts`

**Changes:**
```typescript
// BEFORE
type RouteContext = {
  params: { id: string };  // ❌ Next.js 16 requires Promise
};

// AFTER
type RouteContext = {
  params: Promise<{ id: string }>;  // ✅ Async params
};
```

---

## BLOCKING ISSUE DETAILS

### Error Location
**File:** `lib/db/queries.ts`
**Line:** 113
**Function:** `createProject()`

### Error Details
```typescript
export async function createProject(
  project: Omit<ProjectInsert, 'user_id'>
): Promise<Project | null> {
  const { data, error } = await supabase
    .from('projects')
    .insert({          // <-- LINE 113: TYPE ERROR
      ...project,
      user_id: DEFAULT_USER_ID,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating project:', error);
    return null;
  }

  return data;
}
```

### TypeScript Error Message
```
Type error: No overload matches this call.
Argument of type '{ user_id: string; id?: string | undefined; name: string; description: string | null; }'
is not assignable to parameter of type 'never'.
```

### Why This Blocks Everything
1. Next.js 16 with Turbopack compiles TypeScript on-demand
2. When a route is requested, Next.js attempts to compile it
3. If any imported module has TypeScript errors, compilation fails
4. The API route never gets served, request hangs
5. `lib/db/queries.ts` is imported by `/api/projects` which is loaded on page mount
6. This cascades to block `/api/chat` as well

---

## HYPOTHESIS: ROOT CAUSE

### Primary Cause
**Supabase TypeScript types are mismatched or incorrectly generated.**

The error suggests that `.insert()` expects type `never`, which indicates:
1. The table schema in Supabase might not match the TypeScript types
2. The types may need to be regenerated from the current schema
3. There may be a version mismatch between `@supabase/supabase-js` and the schema

### Secondary Contributing Factors
- Database might have been migrated without regenerating types
- View permissions grant migration may have altered table structure
- Type generation command may not have been run after schema changes

---

## EVIDENCE & ARTIFACTS

### Browser DevTools Network Tab
```
Request: POST http://localhost:3000/api/chat
Status: pending
Time: >30 seconds (timeout)
Size: (pending)
Headers: ✅ Correctly formatted
Body: ✅ Valid UIMessage format
```

### Browser Console
```
No errors logged
Status: useChat hook waiting for response
Loader: Visible and spinning
Messages: User message visible, no assistant response
```

### Server Logs
```
High CPU usage (120.2%)
No error output visible in terminal
Process appears stuck in compilation loop
```

---

## RECOMMENDED NEXT STEPS

### IMMEDIATE ACTION (Critical Priority)

#### 1. Fix TypeScript Compilation Error
**File to fix:** `lib/db/queries.ts:113`

**Option A - Regenerate Supabase Types:**
```bash
npx supabase gen types typescript --project-id xrwbbqvwhwabbnwwxcxm > lib/db/types-generated.ts
```

**Option B - Add Type Assertion:**
```typescript
.insert({
  ...project,
  user_id: DEFAULT_USER_ID,
} as ProjectInsert)
```

**Option C - Investigate Schema Mismatch:**
```sql
-- Verify projects table structure in Supabase
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'projects';
```

#### 2. Restart Dev Server
```bash
pkill -f "next-server"
npm run dev
```

#### 3. Verify Build Passes
```bash
npm run build
```

#### 4. Test Chat Functionality
- Send test message
- Verify response streams correctly
- Check database persistence

---

### SECONDARY ACTIONS (High Priority)

#### 1. Add Better Error Logging
**In `app/api/chat/route.ts`:**
```typescript
export async function POST(req: Request) {
  console.log('[API Chat] Request received');
  try {
    // ... existing code
    console.log('[API Chat] Streaming text with model:', modelId);
    const result = streamText({...});
    console.log('[API Chat] Stream created successfully');
    return result.toUIMessageStreamResponse({...});
  } catch (error) {
    console.error('[API Chat] ERROR:', error);
    // ... error handling
  }
}
```

#### 2. Add Request Timeout
**In `app/page.tsx`:**
```typescript
transport: new DefaultChatTransport({
  api: '/api/chat',
  fetch: async (input, init) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(input, {
        ...init,
        signal: controller.signal
      });
      return response;
    } finally {
      clearTimeout(timeout);
    }
  },
}),
```

#### 3. Validate Model Format
Test different model formats to ensure gateway routing:
```typescript
// Test with explicit provider prefixes
"openai/gpt-4o"         ✓ Tested, works via gateway
"anthropic/claude-sonnet-4"  ? Not yet tested
"perplexity/sonar"      ? Not yet tested
```

---

### LONG-TERM IMPROVEMENTS (Medium Priority)

1. **Add Health Check Endpoint**
   ```typescript
   // app/api/health/route.ts
   export async function GET() {
     return Response.json({
       status: 'ok',
       aiGatewayKey: !!process.env.AI_GATEWAY_API_KEY,
       supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
       timestamp: new Date().toISOString()
     });
   }
   ```

2. **Add API Request Logging Middleware**
3. **Implement Circuit Breaker for AI Gateway**
4. **Add Monitoring for Pending Requests**
5. **Set up Error Tracking (Sentry)**

---

## TESTING CHECKLIST

When fix is implemented, verify:

- [ ] `npm run build` completes without errors
- [ ] Dev server starts without TypeScript errors
- [ ] `/api/health` endpoint responds (if implemented)
- [ ] `/api/projects` responds successfully
- [ ] `/api/chats` responds successfully
- [ ] `/api/chat` accepts POST and streams response
- [ ] Frontend displays streamed assistant messages
- [ ] Messages persist to Supabase database
- [ ] Chat ID updates in URL
- [ ] No console errors in browser
- [ ] No tokenizer fallback warnings (expected, acceptable)

---

## ADDITIONAL CONTEXT

### AI SDK Documentation References
- **Chatbot Guide:** https://ai-sdk.dev/docs/ai-sdk-ui/chatbot
- **Providers:** https://ai-sdk.dev/providers/ai-sdk-providers/openai
- **AI Gateway:** https://vercel.com/docs/ai-gateway

### Related Files Modified
```
✓ lib/ai/models.ts (NEW)
✓ app/api/chat/route.ts
✓ app/page.tsx
✓ lib/context-tracker.ts (tokenizer warnings expected)
✓ app/layout.tsx (added Toaster)
✓ components/ui/bobo-sidebar-option-a.tsx (real data integration)
✓ components/project/create-project-modal.tsx (NEW)
✓ app/error.tsx (NEW)
```

### Files Blocking Compilation
```
❌ lib/db/queries.ts:113 (CRITICAL - MUST FIX FIRST)
```

---

## SENIOR ENGINEER QUESTIONS

1. **Should we regenerate Supabase types or patch the insert call?**
   - Regenerating is safer but takes longer
   - Type assertion is quick but might hide other issues

2. **Is the TypeScript error related to a recent Supabase migration?**
   - Check migration history: `supabase/migrations/`
   - Last migration: `20250122120001_grant_view_permissions.sql`

3. **Should we add middleware to log all API requests for debugging?**
   - Would help diagnose future hanging requests
   - Performance impact needs consideration

4. **Do we need to implement request queuing for AI Gateway?**
   - Current implementation has no rate limiting
   - Could cause issues at scale

---

## CONTACT & ESCALATION

**Assigned To:** Senior Engineer (TBD)
**Priority:** P0 - Critical (Blocks core functionality)
**Estimated Fix Time:** 30 minutes - 2 hours
**Next Review:** After TypeScript error resolution

**Report Generated By:** Claude Code AI Assistant
**Report Date:** January 22, 2025
**Git Branch:** `integration-to-vision`
**Last Commit:** `d5c61e7 Remove deprecated files and components`

---

## APPENDIX

### Full Error Stack
```
Failed to compile.

./lib/db/queries.ts:113:6
Type error: No overload matches this call.
  Overload 1 of 2, '(values: never, options?: { count?: "exact" | "planned" | "estimated" | undefined; } | undefined): PostgrestFilterBuilder<{ PostgrestVersion: "12"; }, never, never, null, "projects", never, "POST">', gave the following error.
    Argument of type '{ user_id: string; id?: string | undefined; name: string; description: string | null; }' is not assignable to parameter of type 'never'.
  Overload 2 of 2, '(values: never[], options?: { count?: "exact" | "planned" | "estimated" | undefined; defaultToNull?: boolean | undefined; } | undefined): PostgrestFilterBuilder<{ PostgrestVersion: "12"; }, never, never, null, "projects", never, "POST">', gave the following error.
    Object literal may only specify known properties, and 'user_id' does not exist in type 'never[]'.

 111 |   const { data, error } = await supabase
 112 |     .from('projects')
>113 |     .insert({
     |      ^
 114 |       ...project,
 115 |       user_id: DEFAULT_USER_ID,
 116 |     })
```

### Environment Variables (Sanitized)
```bash
# .env.local
AI_GATEWAY_API_KEY=vck_**************** (48 chars, valid format)
NEXT_PUBLIC_SUPABASE_URL=https://xrwbbqvwhwabbnwwxcxm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc******************* (valid JWT format)
```

---

**END OF BUG REPORT**

---

## 2025-01-23 FINAL STATUS — STREAMING UNBLOCKED (OPENAI VIA DIRECT GATEWAY)

### Summary
- Build now passes. Non-OpenAI providers (Anthropic/Gemini/Perplexity) work via AI SDK `streamText`.
- OpenAI models (GPT-5.1, GPT-4o) now work by bypassing the AI SDK and calling the AI Gateway directly with an OpenAI-compatible `/chat/completions` payload.
- Chat history loading is re-enabled; OpenAI messages are persisted to Supabase after streaming. Reasoning parts are supported in the OpenAI path; tool-call parsing is not yet implemented.

### Key changes implemented
- `lib/ai/models.ts`: accepts provider/model IDs without a provider guard.
- `app/api/chat/route.ts`:
  - For `openai/...` models: direct fetch to `https://ai-gateway.vercel.sh/v1/chat/completions` (stream=true), emit UI text + reasoning events, persist user/assistant messages, and update chat metadata.
  - For other providers: continue AI SDK `streamText` + `toUIMessageStreamResponse`.
  - Normalizes roles to system/user/assistant before sending.
- `app/page.tsx`: chat history loading restored on page load.

### Current behavior
- Working: OpenAI (GPT-5.1 Thinking/Instant, GPT-4o), Anthropic (Claude), Gemini, Perplexity. Streaming succeeds; history persists after refresh.
- Limitations: The custom OpenAI stream currently handles text and reasoning parts; tool/source parts from OpenAI are not yet surfaced. Logging is still verbose.

### Tradeoffs
- Two code paths: custom direct call for OpenAI; AI SDK path for others. This was required because the SDK+gateway combo returned 400s on GPT-5.1. If a future AI SDK release fixes this, we can remove the custom path and unify later.

### Suggested next actions
1) Reduce noisy `[api/chat] ...` logging once stable.
2) (Optional) Add tool/source parsing to the OpenAI stream if needed.
3) (Optional) Test the latest `ai`, `@ai-sdk/openai`, and `@ai-sdk/react`; if OpenAI works via the SDK, consider removing the custom OpenAI path to simplify.
4) Keep an eye on Supabase persistence for OpenAI chats to confirm rows are created as expected.
