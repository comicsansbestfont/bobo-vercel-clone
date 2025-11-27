# M3.5-01 Testing Plan - Agent Memory Tools

**Sprint:** M3.5-01 - Agent Memory Tools
**Version:** 1.0
**Created:** November 28, 2025
**Test Architect:** Claude Code (Opus 4.5)
**Status:** Ready for Execution

---

## Executive Summary

### Scope

This test plan covers end-to-end testing for the Sprint M3.5-01 Agent Memory Tools implementation, which introduces 4 new agent tools that enable real-time memory manipulation during conversations:

- **search_memory** - Hybrid vector+text search (auto-approved)
- **remember_fact** - Store facts with deduplication (auto-approved)
- **update_memory** - Update with diff preview (requires confirmation)
- **forget_memory** - Soft delete with audit (requires confirmation)

### Objectives

1. Verify all 4 memory tools function correctly in isolation and integration
2. Validate the permission framework (auto-approve vs confirmation flows)
3. Confirm UI components render correctly (dialogs, previews, toasts)
4. Ensure error handling prevents chat crashes
5. Verify database operations maintain data integrity
6. Validate performance meets benchmarks

### Success Criteria

| Criteria | Target | Priority |
|----------|--------|----------|
| All P0 test cases pass | 100% | Critical |
| All P1 test cases pass | 95%+ | High |
| All P2 test cases pass | 90%+ | Medium |
| No critical bugs blocking | 0 | Critical |
| Performance benchmarks met | 100% | High |
| Build remains passing | Yes | Critical |

---

## Test Levels

### Level 1: Unit Tests (Missing - Recommended for Future)

Unit tests for individual functions are **not currently implemented** but recommended for future sprints.

**Recommended Unit Test Coverage:**
- `findSimilarMemories()` - Embedding similarity calculation
- `generateContentHash()` - Hash generation consistency
- `wrapWithErrorHandling()` - Error wrapper behavior
- Zod parameter validation for each tool
- Category enum validation

**Location (if implemented):** `lib/agent-sdk/memory-tools.test.ts`

### Level 2: Integration Tests

Test database operations and API endpoint interactions.

**Coverage Areas:**
- Database queries (`lib/db/queries.ts`)
- Memory tool RPC functions (`hybrid_memory_search`, `find_memories_by_embedding`)
- API endpoints (`/api/memory/extract-background`)
- Supabase client operations

### Level 3: E2E Tests (Primary Focus)

End-to-end testing using Chrome DevTools MCP for UI automation.

**Coverage Areas:**
- Complete user flows (Agent Mode enabled)
- Confirmation dialog interactions
- Memory UI updates
- Toast notifications
- Error states

### Level 4: Performance Tests

Benchmark critical operations against defined targets.

**Coverage Areas:**
- Search latency
- Embedding generation time
- Async extraction completion
- Memory tool execution time

---

## Test Environment

### Prerequisites

```bash
# 1. Local dev server running
npm run dev

# 2. Supabase database with migrations applied
# Migration: 20251128000000_m35_memory_tools.sql

# 3. Environment variables configured
# AI_GATEWAY_API_KEY set in .env.local

# 4. Chrome browser with DevTools open (for MCP testing)
```

### Test Data Requirements

1. **User with default ID** - DEFAULT_USER_ID from `lib/db/client.ts`
2. **Existing memories** for search/update/forget tests
3. **Clean slate option** - Ability to clear test memories

### Tools Available

- **Chrome DevTools MCP** - UI automation and inspection
- **Supabase Dashboard** - Direct database verification
- **Network DevTools** - API request monitoring
- **Console DevTools** - Error and log inspection

---

## Test Data Sets

### TD-001: Sample Memories for Testing

```typescript
const TEST_MEMORIES = {
  // Basic test memories
  basic: [
    { category: 'work_context', content: 'Senior software engineer at Acme Corp' },
    { category: 'personal_context', content: 'Living in San Francisco, California' },
    { category: 'top_of_mind', content: 'Working on the memory system this week' },
    { category: 'brief_history', content: 'Previously worked at Google for 5 years' },
    { category: 'long_term_background', content: 'Computer Science degree from Stanford' },
    { category: 'other_instructions', content: 'Prefers TypeScript over JavaScript' },
  ],

  // For duplicate detection tests
  duplicates: {
    original: "I'm a software engineer at Google",
    variations: [
      "I am a software engineer at Google",       // Should be caught (semantic)
      "Software engineer working at Google",       // Should be caught (semantic)
      "I'm a software developer at Google",        // May be caught depending on threshold
      "I'm a data scientist at Google",            // Should NOT be caught (different role)
    ],
  },

  // For update/forget tests (will need real IDs from database)
  updateTargets: [
    { content: 'Moving to London next month', category: 'personal_context' },
    { content: 'Learning Rust programming', category: 'top_of_mind' },
  ],
};
```

### TD-002: Edge Case Test Data

```typescript
const EDGE_CASES = {
  // Validation edge cases
  validation: {
    empty: '',
    tooShort: 'test',                              // < 10 chars
    exactMin: 'ten chars!',                        // Exactly 10 chars
    tooLong: 'x'.repeat(501),                      // > 500 chars
    exactMax: 'x'.repeat(500),                     // Exactly 500 chars
    unicode: 'I speak Japanese: ',
    specialChars: "I'm using <script>alert('xss')</script>",
    newlines: "Line 1\nLine 2\nLine 3",
    quotesAndApostrophes: `He said "It's working!"`,
  },

  // Search edge cases
  search: {
    singleWord: 'engineer',
    multiWord: 'software engineer San Francisco',
    symbols: 'C++ development',
    numbers: '5 years experience',
    noMatches: 'xyzabc123nonexistent',
  },

  // UUID edge cases
  uuids: {
    invalid: 'not-a-uuid',
    malformed: '12345-6789-abcd',
    nonexistent: '00000000-0000-0000-0000-000000000000',
  },
};
```

### TD-003: Category Test Data

```typescript
const CATEGORY_TESTS = {
  work_context: [
    'Senior engineer at Acme Corp',
    'Lead developer on Project X',
    'Managing a team of 5 engineers',
  ],
  personal_context: [
    'Living in San Francisco',
    'Have 2 dogs named Max and Luna',
    'Enjoy hiking on weekends',
  ],
  top_of_mind: [
    'Launching product next week',
    'Learning new framework',
    'Preparing for interview',
  ],
  brief_history: [
    'Worked at startup for 3 years',
    'Completed bootcamp in 2020',
    'Previous career in finance',
  ],
  long_term_background: [
    'CS degree from MIT',
    'Born and raised in Boston',
    '10+ years in tech industry',
  ],
  other_instructions: [
    'Prefer concise responses',
    'Always use TypeScript',
    'Format code with Prettier',
  ],
};
```

---

## Test Cases

### TC-001: search_memory Tool

| Field | Value |
|-------|-------|
| **Test ID** | TC-001 |
| **Priority** | P0 (Critical) |
| **Component** | `search_memory` tool |
| **File** | `lib/agent-sdk/memory-tools.ts` |

#### TC-001.1: Basic Search Returns Relevant Results

**Preconditions:**
- Dev server running on localhost:3000
- Agent Mode enabled
- Test memories exist in database

**Steps:**
1. Open chat interface at localhost:3000
2. Enable Agent Mode toggle
3. Send message: "What do you know about my job?"
4. Observe agent uses `search_memory` tool
5. Verify search returns work-related memories

**Expected Results:**
- Agent calls `search_memory` with relevant query
- Results include work_context memories
- Response includes memory content
- No confirmation dialog shown (auto-approved)

**Actual Results:** _______________

**Pass/Fail:** [ ]

---

#### TC-001.2: Category Filter Works

**Preconditions:**
- Memories exist in multiple categories

**Steps:**
1. Trigger search with category filter: `search_memory({ query: "test", category: "work_context" })`
2. Verify only work_context memories returned
3. Repeat with each category

**Expected Results:**
- Only memories matching category are returned
- Other category memories excluded
- Empty result if no matches in category

**Actual Results:** _______________

**Pass/Fail:** [ ]

---

#### TC-001.3: Empty Results Handled Gracefully

**Preconditions:**
- No memories matching query exist

**Steps:**
1. Search for: "xyzabc123nonexistent"
2. Observe agent response

**Expected Results:**
- Returns "No matching memories found."
- Agent acknowledges no results
- No error thrown

**Actual Results:** _______________

**Pass/Fail:** [ ]

---

#### TC-001.4: Auto-Approval (No Confirmation Dialog)

**Preconditions:**
- Agent Mode enabled

**Steps:**
1. Trigger `search_memory` via chat
2. Observe UI during execution

**Expected Results:**
- No confirmation dialog appears
- Tool executes immediately
- Results returned to agent without interruption

**Actual Results:** _______________

**Pass/Fail:** [ ]

---

#### TC-001.5: Limit Parameter Respected

**Preconditions:**
- More than 10 memories exist

**Steps:**
1. Search with limit=3
2. Search with limit=10 (max)
3. Search with limit=1

**Expected Results:**
- Results count matches limit
- Limit of 10 is maximum enforced
- Results sorted by relevance

**Actual Results:** _______________

**Pass/Fail:** [ ]

---

### TC-002: remember_fact Tool

| Field | Value |
|-------|-------|
| **Test ID** | TC-002 |
| **Priority** | P0 (Critical) |
| **Component** | `remember_fact` tool |
| **File** | `lib/agent-sdk/memory-tools.ts` |

#### TC-002.1: Memory Creation Success

**Preconditions:**
- Agent Mode enabled
- Clean database (no similar memories)

**Steps:**
1. Send message: "Remember that I'm moving to London next month"
2. Observe agent uses `remember_fact`
3. Check database for new entry
4. Verify Memory UI shows new entry

**Expected Results:**
- Agent calls `remember_fact` with:
  - category: 'personal_context'
  - content: 'Moving to London next month'
  - confidence: ~0.9
- Memory created with `source_type: 'agent_tool'`
- Success message returned with memory ID
- Toast notification shown

**Actual Results:** _______________

**Pass/Fail:** [ ]

---

#### TC-002.2: Deduplication Prevents Duplicates

**Preconditions:**
- Memory "I'm a software engineer at Google" already exists

**Steps:**
1. Request: "Remember I am a software engineer at Google"
2. Observe agent response

**Expected Results:**
- Agent detects semantic similarity
- Returns "Similar memory already exists" message
- No duplicate created
- Suggests using `update_memory` if needed

**Actual Results:** _______________

**Pass/Fail:** [ ]

---

#### TC-002.3: All 6 Categories Work

**Preconditions:**
- Agent Mode enabled

**Steps:**
1. Test each category with appropriate content:
   - work_context: "I'm a senior engineer at Acme Corp"
   - personal_context: "I live in San Francisco"
   - top_of_mind: "Working on memory system this week"
   - brief_history: "Previously worked at Google"
   - long_term_background: "CS degree from Stanford"
   - other_instructions: "Prefer TypeScript over JavaScript"

**Expected Results:**
- Each category accepts appropriate content
- Memories created with correct category
- Agent chooses appropriate category automatically

**Actual Results:** _______________

**Pass/Fail:** [ ]

---

#### TC-002.4: Confidence Scoring Works

**Preconditions:**
- Agent Mode enabled

**Steps:**
1. Explicit statement: "I am 35 years old" (expect confidence ~1.0)
2. Implied info: "I mentioned working in tech" (expect confidence ~0.7-0.8)
3. Verify confidence in database

**Expected Results:**
- Explicit statements get higher confidence
- Inferred info gets lower confidence
- Confidence range: 0.5 to 1.0

**Actual Results:** _______________

**Pass/Fail:** [ ]

---

#### TC-002.5: Auto-Approval with Toast Notification

**Preconditions:**
- Agent Mode enabled

**Steps:**
1. Trigger `remember_fact` via chat
2. Observe UI during execution

**Expected Results:**
- No confirmation dialog appears
- Tool executes immediately
- Toast notification shows "Memory saved" or similar
- Memory appears in Memory UI (if visible)

**Actual Results:** _______________

**Pass/Fail:** [ ]

---

#### TC-002.6: Content Validation

**Preconditions:**
- Agent Mode enabled

**Steps:**
1. Try content < 10 chars: "test"
2. Try content > 500 chars: "x".repeat(501)
3. Try empty content: ""

**Expected Results:**
- Short content: Validation error
- Long content: Validation error or truncation
- Empty content: Validation error
- Errors returned gracefully, no crash

**Actual Results:** _______________

**Pass/Fail:** [ ]

---

### TC-003: update_memory Tool

| Field | Value |
|-------|-------|
| **Test ID** | TC-003 |
| **Priority** | P0 (Critical) |
| **Component** | `update_memory` tool |
| **File** | `lib/agent-sdk/memory-tools.ts` |

#### TC-003.1: Search Then Update Flow

**Preconditions:**
- Memory exists: "Moving to London next month"
- Memory ID known

**Steps:**
1. Send: "Actually, I'm staying in Sydney"
2. Observe agent calls `search_memory` first
3. Agent calls `update_memory` with found ID
4. Confirmation dialog appears
5. Click "Approve"
6. Verify update in database

**Expected Results:**
- Agent searches for relevant memory
- Agent correctly identifies memory to update
- Confirmation dialog shows diff preview
- After approval, memory content updated
- Confidence set to 1.0 (user correction)

**Actual Results:** _______________

**Pass/Fail:** [ ]

---

#### TC-003.2: Diff Preview Display

**Preconditions:**
- Memory exists for update

**Steps:**
1. Trigger `update_memory`
2. Examine confirmation dialog

**Expected Results:**
- Dialog title: "Update Memory"
- Dialog shows category being updated
- Old content displayed with red background/strikethrough
- New content displayed with green background
- "Current:" and "Will become:" labels visible

**Actual Results:** _______________

**Pass/Fail:** [ ]

---

#### TC-003.3: Manual Entry Protection

**Preconditions:**
- Memory exists with `source_type: 'manual'`

**Steps:**
1. Try to update manual entry via agent
2. Observe agent response

**Expected Results:**
- Agent returns error message
- Message indicates manual entries cannot be modified
- Suggests user edit via Memory settings
- No update occurs

**Actual Results:** _______________

**Pass/Fail:** [ ]

---

#### TC-003.4: User Approval Flow

**Preconditions:**
- Non-manual memory exists

**Steps:**
1. Trigger `update_memory`
2. Click "Approve" in dialog
3. Verify update

**Expected Results:**
- Dialog has "Approve" and "Deny" buttons
- Clicking "Approve" executes update
- Success message returned
- Memory updated in database

**Actual Results:** _______________

**Pass/Fail:** [ ]

---

#### TC-003.5: User Denial Flow

**Preconditions:**
- Non-manual memory exists

**Steps:**
1. Trigger `update_memory`
2. Click "Deny" in dialog
3. Verify no update

**Expected Results:**
- Dialog closes on denial
- Agent acknowledges cancellation
- Memory remains unchanged
- No error state

**Actual Results:** _______________

**Pass/Fail:** [ ]

---

#### TC-003.6: Invalid Memory ID Handling

**Preconditions:**
- Agent Mode enabled

**Steps:**
1. Call `update_memory` with non-existent UUID
2. Observe response

**Expected Results:**
- Returns "Memory not found" message
- Suggests using `search_memory` first
- No crash or error state

**Actual Results:** _______________

**Pass/Fail:** [ ]

---

### TC-004: forget_memory Tool

| Field | Value |
|-------|-------|
| **Test ID** | TC-004 |
| **Priority** | P0 (Critical) |
| **Component** | `forget_memory` tool |
| **File** | `lib/agent-sdk/memory-tools.ts` |

#### TC-004.1: Search Then Forget Flow

**Preconditions:**
- Memory exists to delete

**Steps:**
1. Send: "Forget that I mentioned Tokyo"
2. Observe agent calls `search_memory`
3. Agent calls `forget_memory` with ID
4. Confirmation dialog appears
5. Click "Approve"
6. Verify soft delete

**Expected Results:**
- Agent searches for relevant memory
- Confirmation dialog shows destructive warning
- After approval, `is_active = false`
- `deleted_reason` populated
- `deleted_at` timestamp set

**Actual Results:** _______________

**Pass/Fail:** [ ]

---

#### TC-004.2: Destructive Warning Display

**Preconditions:**
- Memory exists for deletion

**Steps:**
1. Trigger `forget_memory`
2. Examine confirmation dialog

**Expected Results:**
- Dialog title: "Delete Memory"
- Red/destructive styling present
- Warning about irreversibility (displayed)
- Memory content shown for verification
- Reason displayed
- TrashIcon visible

**Actual Results:** _______________

**Pass/Fail:** [ ]

---

#### TC-004.3: Manual Entry Protection

**Preconditions:**
- Memory exists with `source_type: 'manual'`

**Steps:**
1. Try to delete manual entry via agent
2. Observe response

**Expected Results:**
- Agent returns error message
- Message indicates manual entries protected
- Suggests user remove via Memory settings
- No deletion occurs

**Actual Results:** _______________

**Pass/Fail:** [ ]

---

#### TC-004.4: Soft Delete Verification

**Preconditions:**
- Memory deleted via `forget_memory`

**Steps:**
1. Query database directly for deleted memory
2. Check `is_active` flag
3. Check `deleted_reason`
4. Check `deleted_at`

**Expected Results:**
- `is_active = false`
- `deleted_reason` contains reason from tool
- `deleted_at` is valid timestamp
- Memory row still exists (soft delete)

**Actual Results:** _______________

**Pass/Fail:** [ ]

---

#### TC-004.5: Audit Trail Complete

**Preconditions:**
- Memory soft-deleted

**Steps:**
1. Examine deleted memory in database
2. Verify all audit fields populated

**Expected Results:**
- `deleted_reason` matches tool parameter
- `deleted_at` is accurate timestamp
- `is_active` is false
- Original content preserved

**Actual Results:** _______________

**Pass/Fail:** [ ]

---

### TC-005: Permission Framework

| Field | Value |
|-------|-------|
| **Test ID** | TC-005 |
| **Priority** | P0 (Critical) |
| **Component** | Permission framework |
| **File** | `lib/agent-sdk/utils.ts` |

#### TC-005.1: Auto-Approved Tools Configuration

**Preconditions:**
- Review `AUTO_APPROVED_TOOLS` array

**Steps:**
1. Verify `search_memory` in array
2. Verify `remember_fact` in array
3. Trigger both tools, confirm no dialog

**Expected Results:**
- `search_memory` auto-approves
- `remember_fact` auto-approves
- No confirmation dialog for either

**Actual Results:** _______________

**Pass/Fail:** [ ]

---

#### TC-005.2: Confirmation-Required Tools Configuration

**Preconditions:**
- Review `CONFIRMATION_REQUIRED_TOOLS` array

**Steps:**
1. Verify `update_memory` in array
2. Verify `forget_memory` in array
3. Trigger both tools, confirm dialog appears

**Expected Results:**
- `update_memory` shows confirmation
- `forget_memory` shows confirmation
- Dialogs have correct content

**Actual Results:** _______________

**Pass/Fail:** [ ]

---

#### TC-005.3: requiresConfirmation Function

**Preconditions:**
- Function exported from utils.ts

**Steps:**
1. Test: `requiresConfirmation('update_memory')` -> true
2. Test: `requiresConfirmation('forget_memory')` -> true
3. Test: `requiresConfirmation('search_memory')` -> false
4. Test: `requiresConfirmation('remember_fact')` -> false

**Expected Results:**
- Function returns correct boolean
- Consistent with tool arrays

**Actual Results:** _______________

**Pass/Fail:** [ ]

---

### TC-006: Error Handling

| Field | Value |
|-------|-------|
| **Test ID** | TC-006 |
| **Priority** | P1 (High) |
| **Component** | Error handling wrapper |
| **File** | `lib/agent-sdk/memory-tools.ts` |

#### TC-006.1: Invalid Memory ID Error

**Preconditions:**
- Agent Mode enabled

**Steps:**
1. Call `update_memory` with invalid UUID format
2. Call `forget_memory` with non-existent UUID
3. Observe responses

**Expected Results:**
- Validation error returned gracefully
- "Memory not found" message for non-existent
- No chat crash
- Agent continues conversation

**Actual Results:** _______________

**Pass/Fail:** [ ]

---

#### TC-006.2: Network Failure Handling

**Preconditions:**
- Ability to simulate network failure

**Steps:**
1. Disconnect network during tool execution
2. Observe error handling

**Expected Results:**
- Error message returned to agent
- Suggests retry or fallback to /memory
- Chat remains functional
- Error logged

**Actual Results:** _______________

**Pass/Fail:** [ ]

---

#### TC-006.3: Database Error Handling

**Preconditions:**
- Ability to trigger database error

**Steps:**
1. Simulate database constraint violation
2. Observe error response

**Expected Results:**
- Error wrapped gracefully
- User-friendly message returned
- Suggests fallback: "visit Memory settings at /memory"
- No stack trace exposed

**Actual Results:** _______________

**Pass/Fail:** [ ]

---

#### TC-006.4: Chat Stability Under Errors

**Preconditions:**
- Multiple error scenarios prepared

**Steps:**
1. Trigger various tool errors
2. Continue conversation afterward
3. Verify chat remains usable

**Expected Results:**
- Chat never crashes
- Can continue messaging after error
- Agent acknowledges errors gracefully
- No UI broken state

**Actual Results:** _______________

**Pass/Fail:** [ ]

---

#### TC-006.5: Error Logging Verification

**Preconditions:**
- Access to console/logs

**Steps:**
1. Trigger tool error
2. Check console for log output

**Expected Results:**
- Error logged with `memoryLogger.error()`
- Includes tool name
- Includes relevant params
- Stack trace in development

**Actual Results:** _______________

**Pass/Fail:** [ ]

---

### TC-007: UI/UX

| Field | Value |
|-------|-------|
| **Test ID** | TC-007 |
| **Priority** | P1 (High) |
| **Component** | UI components |
| **Files** | `components/agent/*.tsx` |

#### TC-007.1: Confirmation Dialog Appearance

**Preconditions:**
- Agent Mode enabled

**Steps:**
1. Trigger `update_memory` or `forget_memory`
2. Examine dialog styling

**Expected Results:**
- Dialog centered on screen
- Semi-transparent backdrop
- Proper border and shadow
- Header with icon and title
- Content area with preview
- Footer with Deny/Approve buttons

**Actual Results:** _______________

**Pass/Fail:** [ ]

---

#### TC-007.2: Memory Update Preview Rendering

**Preconditions:**
- `update_memory` dialog open

**Steps:**
1. Examine MemoryUpdatePreview component
2. Verify diff styling

**Expected Results:**
- Category label displayed
- "Current:" section with old content
- Old content has red background + strikethrough
- "Will become:" section with new content
- New content has green/emerald background
- Rounded corners on sections

**Actual Results:** _______________

**Pass/Fail:** [ ]

---

#### TC-007.3: Forget Memory Preview Rendering

**Preconditions:**
- `forget_memory` dialog open

**Steps:**
1. Examine delete preview content
2. Verify destructive styling

**Expected Results:**
- Destructive red background/border
- Category displayed
- Memory content in quotes
- Reason displayed
- TrashIcon in header

**Actual Results:** _______________

**Pass/Fail:** [ ]

---

#### TC-007.4: Toast Notifications

**Preconditions:**
- Toast system configured

**Steps:**
1. Execute `remember_fact` successfully
2. Observe toast notification

**Expected Results:**
- Toast appears (bottom-right or configured position)
- Shows success message
- Auto-dismisses after timeout
- No visual artifacts

**Actual Results:** _______________

**Pass/Fail:** [ ]

---

#### TC-007.5: Memory UI Updates

**Preconditions:**
- Memory UI visible alongside chat

**Steps:**
1. Create memory via `remember_fact`
2. Update memory via `update_memory`
3. Delete memory via `forget_memory`
4. Observe Memory UI after each

**Expected Results:**
- New memory appears immediately
- Updated memory reflects changes
- Deleted memory disappears
- No full page refresh needed

**Actual Results:** _______________

**Pass/Fail:** [ ]

---

#### TC-007.6: Loading States

**Preconditions:**
- Agent Mode enabled

**Steps:**
1. Trigger tool execution
2. Observe loading indicators

**Expected Results:**
- Tool execution shows loading state
- Dialog may show spinner during preview fetch
- No UI freeze during operations

**Actual Results:** _______________

**Pass/Fail:** [ ]

---

### TC-008: Integration

| Field | Value |
|-------|-------|
| **Test ID** | TC-008 |
| **Priority** | P1 (High) |
| **Component** | System integration |
| **Files** | Multiple |

#### TC-008.1: Chat API to Memory Tool Flow

**Preconditions:**
- Agent Mode enabled via Chat API

**Steps:**
1. Send chat message
2. Agent decides to use memory tool
3. Tool executes
4. Result returned to chat

**Expected Results:**
- Full flow completes without error
- Agent receives tool result
- Agent incorporates result in response
- Chat continues normally

**Actual Results:** _______________

**Pass/Fail:** [ ]

---

#### TC-008.2: Agent Handler Integration

**Preconditions:**
- Agent handler configured with memory tools

**Steps:**
1. Verify tools registered in `FULL_AGENT_TOOL_CONFIG`
2. Verify tools appear in agent's available tools
3. Agent can call tools successfully

**Expected Results:**
- Memory tools in allowedTools array
- Agent can discover and use tools
- Tool execution routes correctly

**Actual Results:** _______________

**Pass/Fail:** [ ]

---

#### TC-008.3: Async Extraction Non-Blocking

**Preconditions:**
- Async extraction endpoint exists

**Steps:**
1. Send multiple messages rapidly
2. Monitor response times
3. Check extraction happens in background

**Expected Results:**
- Chat responses not delayed
- Extraction fires in background
- No blocking on extraction completion
- Responses return immediately

**Actual Results:** _______________

**Pass/Fail:** [ ]

---

#### TC-008.4: Database Operations Succeed

**Preconditions:**
- Database connection active

**Steps:**
1. Create memory (INSERT)
2. Search memory (SELECT + RPC)
3. Update memory (UPDATE)
4. Soft delete memory (UPDATE)
5. Verify each operation

**Expected Results:**
- All CRUD operations succeed
- Data integrity maintained
- Constraints not violated
- Indexes used efficiently

**Actual Results:** _______________

**Pass/Fail:** [ ]

---

#### TC-008.5: RPC Functions Work

**Preconditions:**
- Database migration applied

**Steps:**
1. Test `hybrid_memory_search` RPC
2. Test `find_memories_by_embedding` RPC
3. Verify parameters accepted
4. Verify results returned

**Expected Results:**
- Both RPCs accessible
- Parameters validated
- Results formatted correctly
- Performance acceptable

**Actual Results:** _______________

**Pass/Fail:** [ ]

---

### TC-009: Performance

| Field | Value |
|-------|-------|
| **Test ID** | TC-009 |
| **Priority** | P1 (High) |
| **Component** | Performance benchmarks |
| **Target** | Production-ready latency |

#### TC-009.1: Search Latency Benchmark

**Benchmark:** < 100ms average

**Steps:**
1. Execute 10 search operations
2. Measure each response time
3. Calculate average

**Expected Results:**
- Average < 100ms
- P95 < 200ms
- No outliers > 500ms

**Actual Results:**
- Average: _____ ms
- P95: _____ ms
- Max: _____ ms

**Pass/Fail:** [ ]

---

#### TC-009.2: Embedding Generation Time

**Benchmark:** < 300ms p95

**Steps:**
1. Generate embeddings for 10 different texts
2. Measure each generation time
3. Calculate P95

**Expected Results:**
- Average < 200ms
- P95 < 300ms
- No timeout errors

**Actual Results:**
- Average: _____ ms
- P95: _____ ms

**Pass/Fail:** [ ]

---

#### TC-009.3: Async Extraction Non-Blocking

**Benchmark:** Chat response not delayed

**Steps:**
1. Measure chat response time without extraction
2. Measure chat response time with extraction triggered
3. Compare difference

**Expected Results:**
- < 50ms difference
- Extraction truly async
- No user-perceived delay

**Actual Results:**
- Without extraction: _____ ms
- With extraction: _____ ms
- Difference: _____ ms

**Pass/Fail:** [ ]

---

#### TC-009.4: Memory Tool Execution Time

**Benchmark:** < 500ms p95

**Steps:**
1. Time full tool execution (including DB)
2. Measure 10 executions of each tool
3. Calculate P95

**Expected Results:**
- search_memory: < 300ms p95
- remember_fact: < 500ms p95 (includes embedding)
- update_memory: < 300ms p95
- forget_memory: < 200ms p95

**Actual Results:**
- search_memory: _____ ms
- remember_fact: _____ ms
- update_memory: _____ ms
- forget_memory: _____ ms

**Pass/Fail:** [ ]

---

#### TC-009.5: Memory Leak Check

**Benchmark:** No memory growth over time

**Steps:**
1. Record initial memory usage
2. Execute 100 tool operations
3. Check memory usage after
4. Force garbage collection
5. Check final memory usage

**Expected Results:**
- No significant memory growth
- Memory returns to baseline after GC
- No accumulated objects

**Actual Results:**
- Initial: _____ MB
- After operations: _____ MB
- After GC: _____ MB

**Pass/Fail:** [ ]

---

## Performance Benchmarks Summary

| Operation | Target | P95 Target | Status |
|-----------|--------|------------|--------|
| Memory search | < 100ms avg | < 200ms | [ ] |
| Embedding generation | < 200ms avg | < 300ms | [ ] |
| Async extraction | Non-blocking | < 50ms delay | [ ] |
| remember_fact | < 400ms avg | < 500ms | [ ] |
| update_memory | < 200ms avg | < 300ms | [ ] |
| forget_memory | < 150ms avg | < 200ms | [ ] |

---

## Risk Assessment

### High Risk Areas

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Vector search performance degradation | Search too slow | Medium | IVFFlat index, tune lists parameter |
| Deduplication false positives | Good memories rejected | Medium | Tune similarity threshold (0.85) |
| Confirmation dialog state issues | User stuck in dialog | Low | Dialog timeout, escape key handling |
| Async extraction timing | Missing extractions | Low | Retry logic, error logging |
| Manual entry bypass | User data modified | Low | Double-check source_type before ops |

### Medium Risk Areas

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Embedding API rate limits | Tool failures | Low | Caching, rate limiting |
| Large memory corpus | Slow search | Low | Pagination, relevance filtering |
| Network instability | Intermittent failures | Medium | Retry logic, offline detection |

### Mitigation Strategies

1. **Performance Monitoring:** Add metrics to track tool execution times
2. **Error Alerting:** Log errors with sufficient context for debugging
3. **Fallback UI:** Always provide path to manual Memory settings
4. **Rate Limiting:** Prevent tool spam with sensible limits
5. **Threshold Tuning:** Allow configuration of similarity thresholds

---

## Test Execution Order

### Phase 1: Foundation (2 hours)

1. **TC-005** Permission Framework (validate configuration)
2. **TC-001** search_memory Tool (base functionality)
3. **TC-002** remember_fact Tool (base functionality)

### Phase 2: Corrections (2 hours)

4. **TC-003** update_memory Tool (full flow)
5. **TC-004** forget_memory Tool (full flow)

### Phase 3: Quality (1.5 hours)

6. **TC-006** Error Handling (all scenarios)
7. **TC-007** UI/UX (all components)

### Phase 4: Integration (1 hour)

8. **TC-008** Integration (end-to-end flows)

### Phase 5: Performance (1 hour)

9. **TC-009** Performance (benchmarks)

**Total Estimated Time:** 7.5 hours

---

## Bug Reporting Template

When issues are found, document using this format:

```markdown
## BUG-XXX: [Brief Description]

**Severity:** P0/P1/P2
**Test Case:** TC-XXX.X
**Environment:** localhost:3000

### Steps to Reproduce
1. Step 1
2. Step 2
3. Step 3

### Expected Behavior
What should happen

### Actual Behavior
What actually happens

### Screenshots/Logs
[Attach if relevant]

### Notes
Additional context
```

---

## Test Completion Checklist

### Pre-Testing

- [ ] Dev server running on localhost:3000
- [ ] Database migrations applied
- [ ] Test memories seeded
- [ ] Chrome DevTools MCP available
- [ ] Environment variables configured

### Test Execution

- [ ] TC-001 search_memory: ___/5 passed
- [ ] TC-002 remember_fact: ___/6 passed
- [ ] TC-003 update_memory: ___/6 passed
- [ ] TC-004 forget_memory: ___/5 passed
- [ ] TC-005 Permission Framework: ___/3 passed
- [ ] TC-006 Error Handling: ___/5 passed
- [ ] TC-007 UI/UX: ___/6 passed
- [ ] TC-008 Integration: ___/5 passed
- [ ] TC-009 Performance: ___/5 passed

**Total:** ___/46 test cases passed

### Post-Testing

- [ ] All P0 bugs resolved
- [ ] All P1 bugs documented
- [ ] Build still passing
- [ ] Test report completed
- [ ] Stakeholders notified

---

## Appendix A: Database Schema Reference

### memory_entries Table

```sql
CREATE TABLE memory_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  category TEXT NOT NULL,
  subcategory TEXT,
  content TEXT NOT NULL,
  summary TEXT,
  confidence NUMERIC(3,2) DEFAULT 0.8,
  source_type TEXT NOT NULL DEFAULT 'extracted',
  content_hash TEXT,
  embedding vector(1536),
  relevance_score NUMERIC(3,2) DEFAULT 1.0,
  source_chat_ids UUID[],
  source_project_ids UUID[],
  source_message_count INTEGER DEFAULT 0,
  time_period TEXT,
  is_active BOOLEAN DEFAULT true,
  deleted_reason TEXT,
  deleted_at TIMESTAMPTZ,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Indexes

```sql
-- Vector similarity search
CREATE INDEX idx_memory_entries_embedding
ON memory_entries USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Active memories filter
CREATE INDEX idx_memory_entries_active
ON memory_entries(user_id, is_active) WHERE is_active = true;
```

---

## Appendix B: API Reference

### Memory Tool Signatures

```typescript
// search_memory
search_memory({
  query: string,       // 1-500 chars
  category?: MemoryCategory,
  limit?: number       // 1-10, default 5
}) => Promise<string>

// remember_fact
remember_fact({
  category: MemoryCategory,
  content: string,     // 10-500 chars
  confidence?: number  // 0.5-1.0, default 0.8
}) => Promise<string>

// update_memory
update_memory({
  memoryId: string,    // UUID
  newContent: string,  // 10-500 chars
  reason: string       // 5-200 chars
}) => Promise<string>

// forget_memory
forget_memory({
  memoryId: string,    // UUID
  reason: string       // 5-200 chars
}) => Promise<string>
```

### Memory Categories

```typescript
type MemoryCategory =
  | 'work_context'
  | 'personal_context'
  | 'top_of_mind'
  | 'brief_history'
  | 'long_term_background'
  | 'other_instructions';
```

---

## Appendix C: Chrome DevTools MCP Commands

Useful commands for testing:

```typescript
// Take snapshot for element identification
mcp__chrome-devtools__take_snapshot()

// Click on elements
mcp__chrome-devtools__click({ uid: "element-id" })

// Fill form inputs
mcp__chrome-devtools__fill({ uid: "input-id", value: "text" })

// Check for text
mcp__chrome-devtools__wait_for({ text: "Expected text" })

// Take screenshot
mcp__chrome-devtools__take_screenshot()

// List console messages
mcp__chrome-devtools__list_console_messages()

// Get network requests
mcp__chrome-devtools__list_network_requests()
```

---

## Sign-Off

**Test Plan Author:** Claude Code (Opus 4.5)
**Created:** November 28, 2025
**Version:** 1.0

**Approval:**
- [ ] Engineering Lead
- [ ] QA Lead
- [ ] Product Owner

---

*This test plan is a living document and should be updated as the implementation evolves.*
