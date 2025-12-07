# HANDOVER_M36-02: Wire Access Tracking

**Sprint:** M3.6-02
**Milestone:** M3.6 - Cognitive Memory
**Duration:** December 1-3, 2025
**Estimated Hours:** 4.5h

---

## Executive Summary

This sprint wires the access tracking infrastructure (created in Sprint 1) into the `search_memory` tool. After this sprint, every successful memory search will update:
- `access_count` - incremented by 1
- `last_accessed` - set to NOW()
- `last_mentioned` - set to NOW() (dead code fix from Sprint 1)

**Key Principle:** Access tracking must NEVER break search functionality. All updates are fire-and-forget with comprehensive error handling.

---

## Prerequisites

### Sprint M3.6-01 Deliverables (REQUIRED)

Verify these exist before starting:

```sql
-- In Supabase SQL Editor
-- 1. Columns exist
SELECT column_name FROM information_schema.columns
WHERE table_name = 'memory_entries'
AND column_name IN ('last_accessed', 'access_count');
-- Should return 2 rows

-- 2. RPC function exists
SELECT update_memory_access(ARRAY[]::uuid[]);
-- Should return void (no error)
```

### Codebase State

| File | Expected State |
|------|----------------|
| `lib/db/types.ts` | May NOT have `last_accessed`/`access_count` yet |
| `lib/db/queries.ts` | May NOT have `updateMemoryAccess()` yet |
| `lib/agent-sdk/memory-tools.ts` | Has `searchMemoryTool` at lines 111-197 |

---

## Architecture

### Current Flow (Before Sprint 2)

```
┌─────────────────────────────────────────────────────────────┐
│                    searchMemoryTool.execute                  │
├─────────────────────────────────────────────────────────────┤
│  1. Generate embedding                                       │
│  2. Call hybrid_memory_search RPC                           │
│  3. Format results                                          │
│  4. Return to agent                                         │
└─────────────────────────────────────────────────────────────┘
```

### Target Flow (After Sprint 2)

```
┌─────────────────────────────────────────────────────────────┐
│                    searchMemoryTool.execute                  │
├─────────────────────────────────────────────────────────────┤
│  1. Generate embedding                                       │
│  2. Call hybrid_memory_search RPC                           │
│  3. Format results                                          │
│  4. Extract memory IDs from results                         │
│  5. Fire-and-forget: updateMemoryAccess(ids)    ◄── NEW    │
│  6. Return to agent (don't wait for step 5)                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              updateMemoryAccess (async, non-blocking)        │
├─────────────────────────────────────────────────────────────┤
│  • Calls update_memory_access RPC                           │
│  • Catches ALL errors (logs only, never throws)             │
│  • Updates: access_count++, last_accessed, last_mentioned   │
└─────────────────────────────────────────────────────────────┘
```

---

## Tasks

### S2-01: Add TypeScript Types (0.5h)

**File:** `lib/db/types.ts`

**Find the MemoryEntry interface** (around line 130-150) and add the new fields:

```typescript
export interface MemoryEntry {
  id: string;
  user_id: string;
  category: MemoryCategory;
  subcategory: string | null;
  content: string;
  summary: string | null;
  confidence: number;
  source_type: MemorySourceType;
  source_chat_ids: string[];
  source_project_ids: string[];
  source_message_count: number;
  time_period: MemoryTimePeriod;
  content_hash: string;
  embedding: number[] | null;
  relevance_score: number;
  is_active: boolean;
  created_at: string;
  last_updated: string;
  last_mentioned: string | null;
  updated_reason: string | null;
  // M3.6-01: Access tracking fields
  last_accessed: string | null;  // ADD THIS
  access_count: number;          // ADD THIS
}
```

**Verification:**
```bash
# Should compile without errors
npx tsc --noEmit lib/db/types.ts
```

---

### S2-02: Add updateMemoryAccess() Wrapper (1h)

**File:** `lib/db/queries.ts`

Add this function at the end of the file, in the MEMORY QUERIES section (after line 1100):

```typescript
// ============================================================================
// M3.6-02: ACCESS TRACKING
// ============================================================================

/**
 * Update access metrics for retrieved memories
 *
 * This is called after search_memory returns results.
 * It's fire-and-forget - failures are logged but never throw.
 *
 * Updates:
 * - access_count: incremented by 1
 * - last_accessed: set to NOW()
 * - last_mentioned: set to NOW() (fixes dead code from original schema)
 *
 * @param memoryIds - Array of memory UUIDs that were retrieved
 */
export async function updateMemoryAccess(memoryIds: string[]): Promise<void> {
  // Guard: empty array = no-op
  if (!memoryIds || memoryIds.length === 0) {
    return;
  }

  try {
    const { error } = await supabase.rpc('update_memory_access', {
      p_memory_ids: memoryIds,
    });

    if (error) {
      // Log but don't throw - access tracking should never break search
      dbLogger.warn('[updateMemoryAccess] RPC failed (non-fatal):', {
        error: error.message,
        memoryIds,
      });
      return;
    }

    dbLogger.debug('[updateMemoryAccess] Updated access metrics:', {
      count: memoryIds.length,
      memoryIds,
    });
  } catch (error) {
    // Catch-all: absolutely never throw
    dbLogger.warn('[updateMemoryAccess] Unexpected error (non-fatal):', {
      error: error instanceof Error ? error.message : String(error),
      memoryIds,
    });
  }
}
```

**Key Design Decisions:**
1. **Never throws** - All errors caught and logged
2. **Guard for empty array** - Avoid unnecessary RPC calls
3. **Uses `warn` not `error`** - This is expected behavior, not a bug
4. **Debug logging on success** - Track that it's working

---

### S2-03: Export from index.ts (0.1h)

**File:** `lib/db/index.ts`

Find the exports section and add:

```typescript
export {
  // ... existing exports ...
  updateMemoryAccess,  // ADD THIS
} from './queries';
```

**Verification:**
```typescript
// Should be importable
import { updateMemoryAccess } from '@/lib/db';
```

---

### S2-04: Integrate into searchMemoryTool (1h)

**File:** `lib/agent-sdk/memory-tools.ts`

**Step 1:** Add import at top of file (around line 12):

```typescript
import { createMemory, getMemoryById, updateMemoryEntry, softDeleteMemory, updateMemoryAccess } from '@/lib/db/queries';
```

**Step 2:** Find `searchMemoryTool.execute` (starts at line 136) and modify the success path:

**BEFORE (lines 178-189):**
```typescript
      // Format results for agent consumption
      const results = (memories as MemorySearchResult[])
        .map(
          (m, i) =>
            `[${i + 1}] ${m.category}: "${m.content}" (id: ${m.id})`
        )
        .join('\n');

      memoryLogger.info(
        `[search_memory] Found ${memories.length} memories`
      );
      return `Found ${memories.length} memories:\n${results}`;
```

**AFTER:**
```typescript
      // Format results for agent consumption
      const results = (memories as MemorySearchResult[])
        .map(
          (m, i) =>
            `[${i + 1}] ${m.category}: "${m.content}" (id: ${m.id})`
        )
        .join('\n');

      // M3.6-02: Fire-and-forget access tracking
      // Extract IDs and update metrics asynchronously (don't await)
      const memoryIds = (memories as MemorySearchResult[]).map(m => m.id);
      updateMemoryAccess(memoryIds).catch(() => {
        // Errors already logged inside updateMemoryAccess
        // This catch prevents unhandled promise rejection
      });

      memoryLogger.info(
        `[search_memory] Found ${memories.length} memories`
      );
      return `Found ${memories.length} memories:\n${results}`;
```

**Key Pattern: Fire-and-Forget**

```typescript
// DON'T do this (blocks response):
await updateMemoryAccess(memoryIds);

// DO this (non-blocking):
updateMemoryAccess(memoryIds).catch(() => {});
```

The `.catch(() => {})` is required to prevent unhandled promise rejection warnings, even though `updateMemoryAccess` already catches internally.

---

### S2-05: Write API Tests (1h)

**File:** `tests/api/m36-access-tracking-api.test.ts`

```typescript
// tests/api/m36-access-tracking-api.test.ts
//
// M3.6-02 Access Tracking Integration Tests
// Run with: NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... npx tsx tests/api/m36-access-tracking-api.test.ts

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    results.push({ name, passed: true });
    console.log(`✅ ${name}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    results.push({ name, passed: false, error: message });
    console.log(`❌ ${name}: ${message}`);
  }
}

// Simulates what searchMemoryTool does
async function simulateSearch(query: string): Promise<string[]> {
  // Generate a simple embedding (in real code this uses generateEmbedding)
  // For testing, we just query directly
  const { data, error } = await supabase
    .from('memory_entries')
    .select('id, content, category')
    .eq('is_active', true)
    .textSearch('content', query.split(' ').join(' | '))
    .limit(3);

  if (error || !data) return [];
  return data.map(m => m.id);
}

async function runTests() {
  console.log('\n🧪 M3.6-02 Access Tracking Integration Tests\n');
  console.log('='.repeat(60) + '\n');

  // ============================================================
  // TEST 1: updateMemoryAccess wrapper works
  // ============================================================
  await test('updateMemoryAccess RPC wrapper works', async () => {
    // Get a test memory
    const { data: memories } = await supabase
      .from('memory_entries')
      .select('id, access_count')
      .eq('is_active', true)
      .limit(1);

    if (!memories || memories.length === 0) {
      console.log('  ⚠️  No memories to test - skipping');
      return;
    }

    const memory = memories[0];
    const originalCount = memory.access_count;

    // Call RPC directly (simulating what wrapper does)
    const { error } = await supabase.rpc('update_memory_access', {
      p_memory_ids: [memory.id],
    });

    if (error) throw new Error(`RPC failed: ${error.message}`);

    // Verify increment
    const { data: updated } = await supabase
      .from('memory_entries')
      .select('access_count')
      .eq('id', memory.id)
      .single();

    if (updated?.access_count !== originalCount + 1) {
      throw new Error(`Expected ${originalCount + 1}, got ${updated?.access_count}`);
    }

    console.log(`  └─ access_count: ${originalCount} → ${updated.access_count}`);
  });

  // ============================================================
  // TEST 2: Empty array handling
  // ============================================================
  await test('Empty array does not cause errors', async () => {
    const { error } = await supabase.rpc('update_memory_access', {
      p_memory_ids: [],
    });

    if (error) throw new Error(`Empty array failed: ${error.message}`);
  });

  // ============================================================
  // TEST 3: Multiple IDs in single call
  // ============================================================
  await test('Batch update works for multiple memories', async () => {
    const { data: memories } = await supabase
      .from('memory_entries')
      .select('id, access_count')
      .eq('is_active', true)
      .limit(3);

    if (!memories || memories.length < 2) {
      console.log('  ⚠️  Not enough memories - skipping');
      return;
    }

    const ids = memories.map(m => m.id);
    const originalCounts = Object.fromEntries(
      memories.map(m => [m.id, m.access_count])
    );

    // Batch update
    const { error } = await supabase.rpc('update_memory_access', {
      p_memory_ids: ids,
    });

    if (error) throw new Error(`Batch update failed: ${error.message}`);

    // Verify all incremented
    const { data: updated } = await supabase
      .from('memory_entries')
      .select('id, access_count')
      .in('id', ids);

    for (const m of updated || []) {
      const expected = originalCounts[m.id] + 1;
      if (m.access_count !== expected) {
        throw new Error(`Memory ${m.id}: expected ${expected}, got ${m.access_count}`);
      }
    }

    console.log(`  └─ Updated ${ids.length} memories in single call`);
  });

  // ============================================================
  // TEST 4: Invalid UUIDs don't throw
  // ============================================================
  await test('Invalid UUIDs handled gracefully', async () => {
    const { error } = await supabase.rpc('update_memory_access', {
      p_memory_ids: ['00000000-0000-0000-0000-000000000000'],
    });

    // Should not error - just no rows affected
    if (error) throw new Error(`Should handle invalid UUID: ${error.message}`);
  });

  // ============================================================
  // TEST 5: Inactive memories not updated
  // ============================================================
  await test('Inactive memories are not updated', async () => {
    // Find an inactive memory
    const { data: inactive } = await supabase
      .from('memory_entries')
      .select('id, access_count')
      .eq('is_active', false)
      .limit(1);

    if (!inactive || inactive.length === 0) {
      console.log('  ⚠️  No inactive memories - skipping');
      return;
    }

    const memory = inactive[0];
    const originalCount = memory.access_count;

    // Try to update
    await supabase.rpc('update_memory_access', {
      p_memory_ids: [memory.id],
    });

    // Verify NOT incremented
    const { data: check } = await supabase
      .from('memory_entries')
      .select('access_count')
      .eq('id', memory.id)
      .single();

    if (check?.access_count !== originalCount) {
      throw new Error(`Inactive memory was updated! ${originalCount} → ${check?.access_count}`);
    }

    console.log('  └─ Inactive memory correctly skipped');
  });

  // ============================================================
  // TEST 6: Timestamps updated
  // ============================================================
  await test('last_accessed and last_mentioned both updated', async () => {
    const { data: memories } = await supabase
      .from('memory_entries')
      .select('id, last_accessed, last_mentioned')
      .eq('is_active', true)
      .limit(1);

    if (!memories || memories.length === 0) {
      console.log('  ⚠️  No memories - skipping');
      return;
    }

    const memory = memories[0];
    const beforeAccessed = memory.last_accessed;
    const beforeMentioned = memory.last_mentioned;

    // Wait a moment to ensure timestamp difference
    await new Promise(r => setTimeout(r, 100));

    // Update
    await supabase.rpc('update_memory_access', {
      p_memory_ids: [memory.id],
    });

    // Check timestamps
    const { data: updated } = await supabase
      .from('memory_entries')
      .select('last_accessed, last_mentioned')
      .eq('id', memory.id)
      .single();

    const afterAccessed = new Date(updated!.last_accessed!);
    const afterMentioned = new Date(updated!.last_mentioned!);
    const before = beforeAccessed ? new Date(beforeAccessed) : new Date(0);

    if (afterAccessed <= before) {
      throw new Error('last_accessed not updated');
    }

    if (afterMentioned <= before) {
      throw new Error('last_mentioned not updated (dead code fix)');
    }

    console.log('  └─ Both timestamps updated correctly');
  });

  // ============================================================
  // SUMMARY
  // ============================================================
  console.log('\n' + '='.repeat(60));
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  console.log(`\n📊 Results: ${passed}/${total} tests passed\n`);

  if (passed === total) {
    console.log('✅ All tests passed! M3.6-02 integration verified.\n');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed. Review the errors above.\n');
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
```

---

### S2-06: Manual E2E Test (0.5h)

**Test Script:**

1. **Start the app:**
   ```bash
   npm run dev
   ```

2. **Get baseline access_count:**
   ```sql
   -- In Supabase SQL Editor
   SELECT id, content, access_count, last_accessed
   FROM memory_entries
   WHERE is_active = true
   ORDER BY access_count DESC
   LIMIT 5;
   ```
   Note the `access_count` values.

3. **Trigger search via agent:**
   - Open the app at localhost:3000
   - Start a chat
   - Ask: "What do you know about my preferences?"
   - Wait for response

4. **Verify increment:**
   ```sql
   -- Run same query again
   SELECT id, content, access_count, last_accessed
   FROM memory_entries
   WHERE is_active = true
   ORDER BY last_accessed DESC
   LIMIT 5;
   ```
   The memories returned in step 3 should have:
   - `access_count` incremented by 1
   - `last_accessed` updated to recent timestamp

5. **Test error resilience:**
   - Temporarily modify `updateMemoryAccess` to throw
   - Search should still work (return results)
   - Console should show warning log

---

## Verification Checklist

### After Each Task

- [ ] **S2-01:** `npx tsc --noEmit` passes
- [ ] **S2-02:** Function added, no TypeScript errors
- [ ] **S2-03:** Import works: `import { updateMemoryAccess } from '@/lib/db'`
- [ ] **S2-04:** searchMemoryTool modified, `npm run build` passes
- [ ] **S2-05:** All API tests pass (6/6)
- [ ] **S2-06:** Manual test shows increment

### Final Verification

```bash
# Build check
npm run build

# API tests
NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
npx tsx tests/api/m36-access-tracking-api.test.ts

# All previous tests still pass
npx tsx tests/db/m36-access-tracking.test.ts
```

---

## Rollback Plan

### If Issues Found

**Immediate:** Remove the integration (10 seconds)

In `lib/agent-sdk/memory-tools.ts`, comment out:
```typescript
// M3.6-02: Fire-and-forget access tracking
// const memoryIds = (memories as MemorySearchResult[]).map(m => m.id);
// updateMemoryAccess(memoryIds).catch(() => {});
```

This restores original behavior instantly. The wrapper function and types can remain (harmless).

### If Persistent Issues

```bash
git revert HEAD
npm run build
```

---

## Common Issues

### Issue 1: "Cannot find module '@/lib/db'"

**Cause:** Export not added to index.ts
**Fix:** Add `updateMemoryAccess` to exports in `lib/db/index.ts`

### Issue 2: "Property 'last_accessed' does not exist"

**Cause:** Types not updated
**Fix:** Add fields to MemoryEntry interface in `lib/db/types.ts`

### Issue 3: "Unhandled promise rejection"

**Cause:** Missing `.catch()` on fire-and-forget call
**Fix:** Ensure `updateMemoryAccess(ids).catch(() => {})` pattern

### Issue 4: Search is slower

**Cause:** Accidentally awaiting the access update
**Fix:** Remove `await` - should be fire-and-forget

---

## Files Reference

### Files to Create

| File | Purpose | Lines |
|------|---------|-------|
| `tests/api/m36-access-tracking-api.test.ts` | Integration tests | ~200 |

### Files to Modify

| File | Section | Change |
|------|---------|--------|
| `lib/db/types.ts` | MemoryEntry interface | Add 2 fields |
| `lib/db/queries.ts` | End of file | Add ~40 line function |
| `lib/db/index.ts` | Exports | Add 1 export |
| `lib/agent-sdk/memory-tools.ts` | searchMemoryTool.execute | Add 5 lines |

---

## Post-Mortem Lessons Applied

| M3.5-01 Issue | How This Sprint Addresses It |
|---------------|------------------------------|
| Testing not included | API tests are explicit task (S2-05) |
| "Reuse existing code" assumption | Pre-sprint verification of RPC |
| No verification steps | Checklist after each task |
| Narrow sub-agent instructions | Full code provided, not just description |
| No rollback plan | Explicit rollback section |

---

## Success Criteria

At sprint completion:

1. **Functional:** Search triggers access tracking
2. **Safe:** Failures never break search
3. **Observable:** Logs show updates happening
4. **Tested:** 6+ API tests pass
5. **Verified:** Manual E2E confirms increment

---

## Links

- **Sprint Tracker:** [sprint-m36-02.md](../active/sprint-m36-02.md)
- **Previous Sprint:** [HANDOVER_M36-01.md](./HANDOVER_M36-01.md)
- **Plan:** [glittery-launching-wall.md](~/.claude/plans/glittery-launching-wall.md)
- **Requirements:** [COGNITIVE_MEMORY_REQUIREMENTS.md](../../COGNITIVE_MEMORY_REQUIREMENTS.md)

---

**Created:** December 1, 2025
**Author:** Claude Code (Opus 4.5)
**Status:** Ready for Implementation
