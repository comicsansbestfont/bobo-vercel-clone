# QA Test Plan: Sprint M3.6-01 - Access Tracking Foundation

**Sprint:** M3.6-01
**Feature:** Temporal decay infrastructure (database schema + RPC function)
**QA Engineer:** [Name]
**Date:** December 1, 2025
**Estimated QA Time:** 1-2 hours

---

## Executive Summary

This sprint added database infrastructure to enable "cognitive memory" - making frequently/recently accessed memories rank higher in search. **No behavior changes were made** - this is purely additive schema work.

### What Was Added

| Component | Description |
|-----------|-------------|
| `last_accessed` | TIMESTAMPTZ column tracking when a memory was last retrieved |
| `access_count` | INT column counting how many times a memory was retrieved |
| 2 indexes | Performance optimization for user_id + column queries |
| RPC function | `update_memory_access(UUID[])` to atomically update tracking fields |
| TypeScript types | Updated `MemoryEntry` interface |
| Wrapper function | `updateMemoryAccess()` in `lib/db/queries.ts` |

### Dead Code Fix (Bonus)

The RPC function also fixes a pre-existing bug: `last_mentioned` was NEVER updated by agent tools. Now the RPC updates `last_mentioned` alongside `last_accessed`.

---

## Pre-Testing Setup

### Environment Requirements

- Access to Supabase dashboard (SQL Editor)
- Access to project codebase
- Node.js installed (for running tests)
- Project running locally (`npm run dev`)

### Verification: Migration Applied

Before testing, verify the migration was applied:

```sql
-- Run in Supabase SQL Editor
SELECT version, name FROM supabase_migrations
WHERE name LIKE '%m36%'
ORDER BY version DESC
LIMIT 5;
```

**Expected:** See `20251201134314_m36_access_tracking` in results.

---

## Test Cases

### TC-01: Column Existence Verification

**Objective:** Verify new columns exist with correct data types and defaults.

**Steps:**
1. Open Supabase SQL Editor
2. Run the following query:

```sql
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'memory_entries'
  AND column_name IN ('last_accessed', 'access_count')
ORDER BY column_name;
```

**Expected Results:**

| column_name | data_type | column_default | is_nullable |
|-------------|-----------|----------------|-------------|
| access_count | integer | 0 | YES |
| last_accessed | timestamp with time zone | now() | YES |

**Pass Criteria:** Both columns exist with exact types and defaults shown above.

---

### TC-02: Backfill Verification

**Objective:** Verify all existing rows have been backfilled (no nulls).

**Steps:**
1. Run in Supabase SQL Editor:

```sql
-- Check for any NULL values
SELECT
  COUNT(*) FILTER (WHERE last_accessed IS NULL) AS null_last_accessed,
  COUNT(*) FILTER (WHERE access_count IS NULL) AS null_access_count,
  COUNT(*) AS total_rows
FROM memory_entries;
```

**Expected Results:**

| null_last_accessed | null_access_count | total_rows |
|--------------------|-------------------|------------|
| 0 | 0 | 50 (or current total) |

**Pass Criteria:**
- `null_last_accessed = 0`
- `null_access_count = 0`
- Total rows matches expected count (~50 as of sprint completion)

---

### TC-03: Index Verification

**Objective:** Verify indexes were created for performance.

**Steps:**
1. Run in Supabase SQL Editor:

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'memory_entries'
  AND indexname LIKE '%last_accessed%'
   OR indexname LIKE '%access_count%';
```

**Expected Results:**
- `idx_memory_entries_last_accessed` - on (user_id, last_accessed DESC)
- `idx_memory_entries_access_count` - on (user_id, access_count DESC)

**Pass Criteria:** Both indexes exist with correct column ordering.

---

### TC-04: RPC Function Exists

**Objective:** Verify the RPC function was created.

**Steps:**
1. Run in Supabase SQL Editor:

```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name = 'update_memory_access';
```

**Expected Results:**

| routine_name | routine_type |
|--------------|--------------|
| update_memory_access | FUNCTION |

**Pass Criteria:** Function exists.

---

### TC-05: RPC Function Basic Operation

**Objective:** Verify RPC function increments `access_count` and updates timestamps.

**Steps:**

1. First, get a test memory ID:

```sql
-- Get a memory to test with
SELECT id, access_count, last_accessed, last_mentioned
FROM memory_entries
WHERE is_active = true
LIMIT 1;
```

2. Note the current values (especially `access_count`).

3. Call the RPC function:

```sql
-- Replace 'YOUR-UUID-HERE' with the actual ID from step 1
SELECT update_memory_access(ARRAY['YOUR-UUID-HERE']::uuid[]);
```

4. Verify the update:

```sql
SELECT id, access_count, last_accessed, last_mentioned
FROM memory_entries
WHERE id = 'YOUR-UUID-HERE';
```

**Expected Results:**
- `access_count` increased by 1
- `last_accessed` updated to current time (within last minute)
- `last_mentioned` ALSO updated to current time (this is the dead code fix)

**Pass Criteria:** All three fields updated correctly.

---

### TC-06: RPC Function Multiple IDs

**Objective:** Verify RPC function works with multiple memory IDs.

**Steps:**

1. Get 3 test memory IDs:

```sql
SELECT id, access_count
FROM memory_entries
WHERE is_active = true
LIMIT 3;
```

2. Note the `access_count` values.

3. Call RPC with all 3 IDs:

```sql
SELECT update_memory_access(ARRAY[
  'UUID-1',
  'UUID-2',
  'UUID-3'
]::uuid[]);
```

4. Verify all were updated:

```sql
SELECT id, access_count
FROM memory_entries
WHERE id IN ('UUID-1', 'UUID-2', 'UUID-3');
```

**Expected Results:** All 3 rows have `access_count` incremented by 1.

**Pass Criteria:** Batch update works correctly.

---

### TC-07: RPC Function Empty Array (Edge Case)

**Objective:** Verify RPC function handles empty array gracefully.

**Steps:**

```sql
SELECT update_memory_access(ARRAY[]::uuid[]);
```

**Expected Results:** No error, returns void, no rows affected.

**Pass Criteria:** Function does not throw error on empty input.

---

### TC-08: RPC Function Invalid UUID (Edge Case)

**Objective:** Verify RPC function handles non-existent UUIDs gracefully.

**Steps:**

```sql
SELECT update_memory_access(ARRAY['00000000-0000-0000-0000-000000000000']::uuid[]);
```

**Expected Results:** No error, returns void, 0 rows affected (UUID doesn't exist).

**Pass Criteria:** Function does not throw error on non-existent ID.

---

### TC-09: RPC Function Inactive Memory (Edge Case)

**Objective:** Verify RPC function does NOT update inactive (soft-deleted) memories.

**Steps:**

1. Find or create an inactive memory:

```sql
-- Find an inactive memory
SELECT id, access_count, is_active
FROM memory_entries
WHERE is_active = false
LIMIT 1;
```

2. If none exist, temporarily deactivate one (restore after):

```sql
UPDATE memory_entries
SET is_active = false
WHERE id = 'SOME-UUID'
RETURNING id, access_count;
```

3. Call RPC:

```sql
SELECT update_memory_access(ARRAY['INACTIVE-UUID']::uuid[]);
```

4. Verify NOT updated:

```sql
SELECT access_count FROM memory_entries WHERE id = 'INACTIVE-UUID';
```

5. **IMPORTANT:** Restore the memory if you deactivated it:

```sql
UPDATE memory_entries SET is_active = true WHERE id = 'SOME-UUID';
```

**Expected Results:** `access_count` should NOT have changed for inactive memory.

**Pass Criteria:** RPC respects `is_active = true` filter.

---

### TC-10: TypeScript Type Verification

**Objective:** Verify TypeScript types were updated correctly.

**Steps:**

1. Open `lib/db/types.ts`
2. Find the `MemoryEntry` interface
3. Verify new fields exist:

```typescript
// Should contain:
last_accessed?: string | null;
access_count?: number;
```

**Pass Criteria:** Both fields present in interface with correct types.

---

### TC-11: Wrapper Function Verification

**Objective:** Verify TypeScript wrapper function exists and is exported.

**Steps:**

1. Open `lib/db/queries.ts`
2. Search for `updateMemoryAccess`
3. Verify function signature:

```typescript
export async function updateMemoryAccess(memoryIds: string[]): Promise<void>
```

4. Verify it calls the RPC:

```typescript
const { error } = await supabase.rpc('update_memory_access', {
  p_memory_ids: memoryIds,
});
```

**Pass Criteria:** Function exists, is exported, calls correct RPC.

---

### TC-12: Build Verification

**Objective:** Verify the application builds without errors.

**Steps:**

```bash
npm run build
```

**Expected Results:** Build completes successfully with no TypeScript errors.

**Pass Criteria:** Exit code 0, no type errors related to memory_entries.

---

### TC-13: Automated Test Suite

**Objective:** Run the automated test suite for this feature.

**Steps:**

```bash
npx tsx tests/db/m36-access-tracking.test.ts
```

**Expected Results:**
```
Testing M3.6 Access Tracking Schema...

✓ Test 1: last_accessed column exists
✓ Test 2: access_count column exists
✓ Test 3: No NULL last_accessed values (backfill complete)
✓ Test 4: No NULL access_count values (backfill complete)
✓ Test 5: last_accessed index exists
✓ Test 6: access_count index exists
✓ Test 7: update_memory_access function exists
✓ Test 8: RPC increments access_count
✓ Test 9: RPC updates both last_accessed AND last_mentioned

═══════════════════════════════════════════════════════════════
RESULTS: 9/9 tests passed
═══════════════════════════════════════════════════════════════
```

**Pass Criteria:** 9/9 tests pass.

---

### TC-14: No Regression - Existing Memory Tools

**Objective:** Verify existing memory functionality still works.

**Steps:**

1. Start the dev server: `npm run dev`
2. Open the app in browser
3. Start a chat with the agent
4. Ask: "Remember that my favorite programming language is TypeScript"
5. Wait for confirmation
6. Ask: "What is my favorite programming language?"

**Expected Results:**
- Memory is stored successfully
- Memory is retrieved correctly
- No errors in console

**Pass Criteria:** Basic memory store/retrieve workflow unchanged.

---

## Regression Test: Dead Code Fix

### TC-15: last_mentioned Now Updates

**Objective:** Verify the "dead code" fix - `last_mentioned` is now updated.

**Context:** Before this sprint, `last_mentioned` existed but was NEVER updated by any code path. The new RPC function fixes this.

**Steps:**

1. Get a memory and note its `last_mentioned`:

```sql
SELECT id, last_mentioned, last_accessed
FROM memory_entries
WHERE is_active = true
LIMIT 1;
```

2. Call the RPC:

```sql
SELECT update_memory_access(ARRAY['YOUR-UUID']::uuid[]);
```

3. Check `last_mentioned`:

```sql
SELECT last_mentioned, last_accessed
FROM memory_entries
WHERE id = 'YOUR-UUID';
```

**Expected Results:**
- `last_mentioned` updated to current time
- `last_accessed` also updated to current time
- Both should be within seconds of each other

**Pass Criteria:** `last_mentioned` is no longer stale after RPC call.

---

## Test Summary Checklist

| TC | Test Name | Pass | Fail | Notes |
|----|-----------|------|------|-------|
| TC-01 | Column Existence | ☐ | ☐ | |
| TC-02 | Backfill Verification | ☐ | ☐ | |
| TC-03 | Index Verification | ☐ | ☐ | |
| TC-04 | RPC Function Exists | ☐ | ☐ | |
| TC-05 | RPC Basic Operation | ☐ | ☐ | |
| TC-06 | RPC Multiple IDs | ☐ | ☐ | |
| TC-07 | RPC Empty Array | ☐ | ☐ | |
| TC-08 | RPC Invalid UUID | ☐ | ☐ | |
| TC-09 | RPC Inactive Memory | ☐ | ☐ | |
| TC-10 | TypeScript Types | ☐ | ☐ | |
| TC-11 | Wrapper Function | ☐ | ☐ | |
| TC-12 | Build Verification | ☐ | ☐ | |
| TC-13 | Automated Test Suite | ☐ | ☐ | |
| TC-14 | No Regression | ☐ | ☐ | |
| TC-15 | Dead Code Fix | ☐ | ☐ | |

---

## Defect Reporting

If any test fails, document:

1. **Test Case ID:** (e.g., TC-05)
2. **Severity:** P0 (blocker) / P1 (major) / P2 (minor)
3. **Steps to Reproduce:** Exact SQL or commands used
4. **Expected vs Actual:** What should happen vs what happened
5. **Screenshots/Logs:** Error messages, console output
6. **Environment:** Browser, Node version, Supabase project

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| QA Engineer | | | |
| Developer | | | |
| Product Owner | | | |

---

## Appendix A: Quick Reference SQL

```sql
-- All-in-one schema verification
SELECT
  (SELECT COUNT(*) FROM memory_entries) as total_rows,
  (SELECT COUNT(*) FROM memory_entries WHERE last_accessed IS NULL) as null_last_accessed,
  (SELECT COUNT(*) FROM memory_entries WHERE access_count IS NULL) as null_access_count,
  EXISTS(SELECT 1 FROM pg_indexes WHERE indexname = 'idx_memory_entries_last_accessed') as has_last_accessed_idx,
  EXISTS(SELECT 1 FROM pg_indexes WHERE indexname = 'idx_memory_entries_access_count') as has_access_count_idx,
  EXISTS(SELECT 1 FROM information_schema.routines WHERE routine_name = 'update_memory_access') as has_rpc_function;
```

**Expected:** All `null_*` = 0, all `has_*` = true.

---

## Appendix B: Cleanup After Testing

If you created test data or modified memories during testing:

```sql
-- Reset access_count for test memories if needed
UPDATE memory_entries
SET access_count = 0
WHERE id IN ('TEST-UUID-1', 'TEST-UUID-2');

-- Re-activate any memories you deactivated
UPDATE memory_entries
SET is_active = true
WHERE id = 'DEACTIVATED-UUID';
```

---

**Document Version:** 1.0
**Last Updated:** December 1, 2025
**Next Sprint:** M3.6-02 - Wire Access Tracking (connects RPC to search_memory)
