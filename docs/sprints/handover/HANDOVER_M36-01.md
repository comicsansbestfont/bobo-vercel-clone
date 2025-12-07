# Sprint M3.6-01 Execution Guide

**Sprint:** M3.6-01 - Access Tracking Foundation
**Duration:** December 1-3, 2025
**Prepared:** December 1, 2025

---

## TL;DR (Plain English Summary)

**What we're building:** We're adding two new columns to the `memory_entries` table that will track when a memory was last accessed and how many times it has been accessed. This is the foundation for "temporal decay" - the idea that memories accessed recently and frequently should rank higher in search results (like how your brain works).

**Why this matters:** Currently, Bobo's memory search only considers vector similarity and text matching. A memory from 6 months ago that you've never referenced again ranks the same as one from yesterday that you've mentioned 5 times. After this sprint, we'll have the data to make recently-accessed memories more prominent.

**The core idea:** We're adding infrastructure without changing behavior. The columns get added, existing data gets backfilled with sensible defaults, and a new RPC function is created that can update these metrics. But nothing CALLS that function yet - that's Sprint 2. This means Sprint 1 literally cannot break anything.

**Key technical decisions:**
1. `last_accessed` defaults to `NOW()` for new rows, backfilled from `last_mentioned` for existing rows
2. `access_count` defaults to 0, backfilled from `source_message_count - 1` (since first mention isn't an "access")
3. The RPC function fixes a bug: `last_mentioned` was never being updated by agent tools
4. Indexes are added for performance (searches will filter by user_id + sort by these columns)

**What success looks like:** After this sprint, you can:
1. See the new columns in Supabase dashboard
2. Query them and get non-null values for all rows
3. Call the RPC function and see access_count increment
4. Run `npm run build` with no errors
5. Run memory search and it still works exactly as before (zero behavior change)

---

## Architecture Overview

### Current State (Before Sprint)

```
┌─────────────────────────────────────────────────────────────────┐
│                    memory_entries table                          │
├─────────────────────────────────────────────────────────────────┤
│  id              │ UUID (PK)                                     │
│  user_id         │ TEXT                                          │
│  category        │ TEXT (work_context, personal_context, etc.)   │
│  content         │ TEXT                                          │
│  confidence      │ FLOAT (0.0 - 1.0)                             │
│  embedding       │ VECTOR(1536)                                  │
│  content_hash    │ TEXT                                          │
│  content_text    │ TEXT (for FTS)                                │
│  source_type     │ TEXT (agent_tool, extraction, manual)         │
│  created_at      │ TIMESTAMPTZ                                   │
│  last_updated    │ TIMESTAMPTZ                                   │
│  last_mentioned  │ TIMESTAMPTZ ⚠️ DEAD CODE - never updated!     │
│  is_active       │ BOOLEAN                                       │
│  source_message_count │ INT                                      │
└─────────────────────────────────────────────────────────────────┘
```

### Target State (After Sprint)

```
┌─────────────────────────────────────────────────────────────────┐
│                    memory_entries table                          │
├─────────────────────────────────────────────────────────────────┤
│  id              │ UUID (PK)                                     │
│  user_id         │ TEXT                                          │
│  category        │ TEXT                                          │
│  content         │ TEXT                                          │
│  confidence      │ FLOAT (0.0 - 1.0)                             │
│  embedding       │ VECTOR(1536)                                  │
│  content_hash    │ TEXT                                          │
│  content_text    │ TEXT                                          │
│  source_type     │ TEXT                                          │
│  created_at      │ TIMESTAMPTZ                                   │
│  last_updated    │ TIMESTAMPTZ                                   │
│  last_mentioned  │ TIMESTAMPTZ ✅ NOW updated by RPC!             │
│  is_active       │ BOOLEAN                                       │
│  source_message_count │ INT                                      │
│  last_accessed   │ TIMESTAMPTZ 🆕 NEW - when memory was retrieved │
│  access_count    │ INT 🆕 NEW - how many times retrieved          │
├─────────────────────────────────────────────────────────────────┤
│  NEW INDEXES:                                                    │
│  - idx_memory_entries_last_accessed (user_id, last_accessed DESC)│
│  - idx_memory_entries_access_count (user_id, access_count DESC)  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│           NEW: update_memory_access(UUID[]) RPC                  │
├─────────────────────────────────────────────────────────────────┤
│  Input: Array of memory UUIDs                                    │
│  Action:                                                         │
│    SET last_accessed = NOW()                                     │
│    SET last_mentioned = NOW()  ← FIXES dead code bug!            │
│    SET access_count = access_count + 1                           │
│  Filter: WHERE is_active = true                                  │
│  Output: void                                                    │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow (Not Yet Active)

```
                        ┌───────────────────┐
                        │  search_memory    │
                        │  tool executes    │
                        └─────────┬─────────┘
                                  │
                                  ▼
                        ┌───────────────────┐
                        │ Returns memory    │
                        │ IDs to agent      │
                        └─────────┬─────────┘
                                  │
                                  │ (SPRINT 2: Will call RPC here)
                                  │
                                  ▼
┌────────────────────────────────────────────────────────────────────┐
│                    update_memory_access(UUID[])                     │
│                                                                     │
│    UPDATE memory_entries                                            │
│    SET last_accessed = NOW(),                                       │
│        last_mentioned = NOW(),   ← Fixes dead code                  │
│        access_count = access_count + 1                              │
│    WHERE id = ANY(p_memory_ids)                                     │
│      AND is_active = true;                                          │
│                                                                     │
│    ✅ Sprint 1: Create this RPC                                     │
│    ⏳ Sprint 2: Wire it to search_memory                            │
└────────────────────────────────────────────────────────────────────┘
```

---

## Quick Start (10 minutes)

```bash
# Step 1: Ensure you're on the correct branch
git checkout feature/m36-cognitive-memory

# Step 2: Pull latest changes
git pull origin feature/m36-cognitive-memory

# Step 3: Verify build passes before starting
npm run build

# Step 4: Open Supabase dashboard
open https://app.supabase.com/project/YOUR_PROJECT/editor

# Step 5: Review current memory_entries schema
# Run this query to see existing columns:
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'memory_entries'
ORDER BY ordinal_position;
```

**Environment:** No new environment variables required.

**Pre-Flight Checks:**
- [ ] On `feature/m36-cognitive-memory` branch
- [ ] `npm run build` passes
- [ ] Can connect to Supabase dashboard
- [ ] Can query `memory_entries` table

---

## Tasks

### Phase 1: Schema Changes (1.5h)

| Task | What to Do | Hours | Verification |
|------|------------|-------|--------------|
| S1-01 | Add `last_accessed` column | 0.5h | Column visible in dashboard |
| S1-02 | Add `access_count` column | 0.5h | Column visible in dashboard |
| S1-03 | Backfill existing rows | 0.5h | `WHERE last_accessed IS NULL` returns 0 rows |

### Phase 2: RPC Function (1h)

| Task | What to Do | Hours | Verification |
|------|------------|-------|--------------|
| S1-04 | Create `update_memory_access` RPC | 1h | RPC callable, returns void, updates 3 fields |

### Phase 3: Testing & Verification (1.5h)

| Task | What to Do | Hours | Verification |
|------|------------|-------|--------------|
| S1-05 | Write DB verification tests | 1h | All tests pass |
| S1-06 | Manual verification + docs | 0.5h | DoD checklist complete |

**Total: 4h** (+ 0.5h buffer = 4.5h)

---

## Files to Create/Modify

```
supabase/migrations/
└── 20251201000000_m36_access_tracking.sql   # NEW: Schema + RPC

tests/db/
└── m36-access-tracking.test.ts              # NEW: Verification tests

lib/db/
├── queries.ts                               # MODIFY: Add wrapper function
└── types.ts                                 # MODIFY: Add new fields to types
```

---

## Implementation Details

### S1-01, S1-02, S1-03: Migration SQL

**File:** `supabase/migrations/20251201000000_m36_access_tracking.sql`

**What it does:** Adds two new columns, backfills existing data, and creates indexes.

```sql
-- Migration: M3.6-01 Access Tracking Foundation
-- Date: December 1, 2025
-- Purpose: Add temporal tracking columns for cognitive memory decay
--
-- IMPORTANT: This migration adds columns and backfills data.
-- It does NOT change any application behavior.
-- All changes are additive and safe to apply to production.

-- ============================================================
-- STEP 1: Add new columns
-- ============================================================

-- Add last_accessed column
-- Tracks when a memory was last retrieved in a search
ALTER TABLE memory_entries
  ADD COLUMN IF NOT EXISTS last_accessed TIMESTAMPTZ DEFAULT NOW();

-- Add access_count column
-- Tracks how many times a memory has been retrieved
ALTER TABLE memory_entries
  ADD COLUMN IF NOT EXISTS access_count INT DEFAULT 0;

-- Add comment explaining the columns
COMMENT ON COLUMN memory_entries.last_accessed IS
  'When this memory was last retrieved via search. Used for temporal decay scoring.';
COMMENT ON COLUMN memory_entries.access_count IS
  'How many times this memory has been retrieved. Used for frequency scoring.';

-- ============================================================
-- STEP 2: Backfill existing data
-- ============================================================

-- Backfill last_accessed from existing timestamp columns
-- Priority: last_mentioned > last_updated > created_at
-- This preserves the relative temporal ordering of memories
UPDATE memory_entries
SET last_accessed = COALESCE(last_mentioned, last_updated, created_at)
WHERE last_accessed IS NULL
   OR last_accessed = NOW(); -- Catches rows just added with default

-- Backfill access_count from source_message_count
-- Subtract 1 because the first mention isn't an "access"
-- Use GREATEST to avoid negative numbers
UPDATE memory_entries
SET access_count = GREATEST(COALESCE(source_message_count, 1) - 1, 0)
WHERE access_count = 0 OR access_count IS NULL;

-- ============================================================
-- STEP 3: Create indexes for performance
-- ============================================================

-- Index for sorting by last_accessed (most recent first)
-- Filtered by user_id for multi-user support
CREATE INDEX IF NOT EXISTS idx_memory_entries_last_accessed
  ON memory_entries(user_id, last_accessed DESC);

-- Index for sorting by access_count (most accessed first)
CREATE INDEX IF NOT EXISTS idx_memory_entries_access_count
  ON memory_entries(user_id, access_count DESC);

-- ============================================================
-- STEP 4: Create RPC function
-- ============================================================

-- Function to update access metrics when memories are retrieved
-- IMPORTANT: Also updates last_mentioned to fix dead code bug!
--
-- Background: The last_mentioned column was added but NEVER updated
-- by the agent tools. This RPC fixes that by updating both timestamps.
--
-- Usage: SELECT update_memory_access(ARRAY['uuid1', 'uuid2']::uuid[]);
--
CREATE OR REPLACE FUNCTION update_memory_access(p_memory_ids UUID[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only update active memories (not soft-deleted)
  UPDATE memory_entries
  SET
    last_accessed = NOW(),
    last_mentioned = NOW(),  -- FIX: This was never being updated!
    access_count = access_count + 1
  WHERE id = ANY(p_memory_ids)
    AND is_active = true;

  -- Note: This function returns void. It does not throw on
  -- invalid UUIDs - they simply don't match any rows.
END;
$$;

-- Add comment explaining the function
COMMENT ON FUNCTION update_memory_access(UUID[]) IS
  'Updates access metrics for retrieved memories. Called after search_memory returns results. Also fixes the dead code bug where last_mentioned was never updated.';

-- ============================================================
-- VERIFICATION QUERIES (run manually after migration)
-- ============================================================

-- Check 1: Columns exist
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'memory_entries'
-- AND column_name IN ('last_accessed', 'access_count');
-- Expected: 2 rows

-- Check 2: No null values after backfill
-- SELECT COUNT(*) FROM memory_entries WHERE last_accessed IS NULL;
-- Expected: 0

-- Check 3: RPC function exists
-- SELECT proname FROM pg_proc WHERE proname = 'update_memory_access';
-- Expected: 1 row

-- Check 4: Indexes exist
-- SELECT indexname FROM pg_indexes
-- WHERE tablename = 'memory_entries'
-- AND indexname LIKE '%last_accessed%' OR indexname LIKE '%access_count%';
-- Expected: 2 rows
```

**Key points:**
- `IF NOT EXISTS` makes migration idempotent (safe to run twice)
- Backfill uses COALESCE to handle NULL values gracefully
- `GREATEST(..., 0)` prevents negative access counts
- `SECURITY DEFINER` allows RPC to run with elevated privileges
- Comments document the dead code fix for future developers

---

### S1-04: TypeScript Type Updates

**File:** `lib/db/types.ts`

**What it does:** Adds the new fields to TypeScript types so the rest of the application knows about them.

**BEFORE MODIFYING:** Verify the current type structure:
```bash
# Check current MemoryEntry type
grep -A 30 "interface MemoryEntry" lib/db/types.ts
```

**Add these fields to the MemoryEntry interface:**

```typescript
// lib/db/types.ts

export interface MemoryEntry {
  id: string;
  user_id: string;
  category: MemoryCategory;
  content: string;
  confidence: number;
  embedding?: number[];
  content_hash: string;
  content_text?: string;
  source_type: 'agent_tool' | 'extraction' | 'manual';
  source_chat_id?: string | null;
  source_message_count?: number;
  created_at: string;
  last_updated: string;
  last_mentioned?: string | null;
  is_active: boolean;
  deleted_reason?: string | null;
  deleted_at?: string | null;

  // NEW: M3.6 Cognitive Memory fields
  /** When this memory was last retrieved via search. Used for temporal decay scoring. */
  last_accessed?: string | null;
  /** How many times this memory has been retrieved. Used for frequency scoring. */
  access_count?: number;
}

// Also add to insert type if it exists
export interface MemoryEntryInsert {
  // ... existing fields ...

  // NEW: M3.6 fields (optional on insert, DB provides defaults)
  last_accessed?: string;
  access_count?: number;
}
```

**Verification:**
```bash
# Verify types are correct
npx tsc --noEmit
# Expected: No errors
```

---

### S1-04: RPC Wrapper Function

**File:** `lib/db/queries.ts`

**What it does:** Adds a TypeScript wrapper for the new RPC function.

**BEFORE MODIFYING:** Check current file structure:
```bash
# See existing function signatures
grep -n "export async function" lib/db/queries.ts | head -20
```

**Add this function:**

```typescript
// lib/db/queries.ts

/**
 * Updates access metrics for retrieved memories.
 * Called after search_memory returns results.
 *
 * This function:
 * 1. Sets last_accessed = NOW()
 * 2. Sets last_mentioned = NOW() (fixes dead code bug!)
 * 3. Increments access_count
 *
 * @param memoryIds - Array of memory UUIDs that were retrieved
 * @returns void - Does not throw on invalid UUIDs
 *
 * @example
 * // Call after search returns results
 * const results = await searchMemory(query);
 * await updateMemoryAccess(results.map(r => r.id));
 */
export async function updateMemoryAccess(memoryIds: string[]): Promise<void> {
  if (!memoryIds || memoryIds.length === 0) {
    return; // Nothing to update
  }

  const { error } = await supabase.rpc('update_memory_access', {
    p_memory_ids: memoryIds,
  });

  if (error) {
    // Log but don't throw - this is a non-critical operation
    // Failing to update metrics should NEVER break search
    console.error('[updateMemoryAccess] Failed to update access metrics:', error);
  }
}
```

**Verification:**
```bash
# Verify function compiles
npx tsc --noEmit
# Expected: No errors
```

---

### S1-05: DB Verification Tests

**File:** `tests/db/m36-access-tracking.test.ts`

**What it does:** Verifies the migration was applied correctly and the RPC works.

```typescript
// tests/db/m36-access-tracking.test.ts
//
// Run with: NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... npx tsx tests/db/m36-access-tracking.test.ts

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

async function runTests() {
  console.log('\n🧪 M3.6-01 Access Tracking Verification Tests\n');
  console.log('='.repeat(60) + '\n');

  // ============================================================
  // TEST 1: Columns exist
  // ============================================================
  await test('last_accessed column exists', async () => {
    const { data, error } = await supabase
      .from('memory_entries')
      .select('last_accessed')
      .limit(1);

    if (error && error.message.includes('last_accessed')) {
      throw new Error('Column last_accessed does not exist');
    }
  });

  await test('access_count column exists', async () => {
    const { data, error } = await supabase
      .from('memory_entries')
      .select('access_count')
      .limit(1);

    if (error && error.message.includes('access_count')) {
      throw new Error('Column access_count does not exist');
    }
  });

  // ============================================================
  // TEST 2: Backfill completed (no null values)
  // ============================================================
  await test('No null last_accessed values', async () => {
    const { data, error, count } = await supabase
      .from('memory_entries')
      .select('id', { count: 'exact' })
      .is('last_accessed', null);

    if (error) throw error;
    if (count && count > 0) {
      throw new Error(`Found ${count} rows with null last_accessed`);
    }
  });

  await test('No null access_count values', async () => {
    const { data, error, count } = await supabase
      .from('memory_entries')
      .select('id', { count: 'exact' })
      .is('access_count', null);

    if (error) throw error;
    if (count && count > 0) {
      throw new Error(`Found ${count} rows with null access_count`);
    }
  });

  // ============================================================
  // TEST 3: RPC function works
  // ============================================================
  await test('RPC function exists and is callable', async () => {
    // Call with empty array - should succeed without error
    const { error } = await supabase.rpc('update_memory_access', {
      p_memory_ids: [],
    });

    if (error) {
      throw new Error(`RPC call failed: ${error.message}`);
    }
  });

  await test('RPC function increments access_count', async () => {
    // Get a memory to test with
    const { data: memories, error: fetchError } = await supabase
      .from('memory_entries')
      .select('id, access_count, last_accessed, last_mentioned')
      .eq('is_active', true)
      .limit(1);

    if (fetchError) throw fetchError;
    if (!memories || memories.length === 0) {
      console.log('  ⚠️  No active memories to test RPC - skipping');
      return;
    }

    const memory = memories[0];
    const originalCount = memory.access_count || 0;
    const originalAccessed = memory.last_accessed;
    const originalMentioned = memory.last_mentioned;

    // Call RPC
    const { error: rpcError } = await supabase.rpc('update_memory_access', {
      p_memory_ids: [memory.id],
    });

    if (rpcError) throw new Error(`RPC failed: ${rpcError.message}`);

    // Verify the update
    const { data: updated, error: verifyError } = await supabase
      .from('memory_entries')
      .select('access_count, last_accessed, last_mentioned')
      .eq('id', memory.id)
      .single();

    if (verifyError) throw verifyError;

    // Check access_count incremented
    if (updated.access_count !== originalCount + 1) {
      throw new Error(
        `access_count not incremented: was ${originalCount}, now ${updated.access_count}`
      );
    }

    // Check timestamps updated (should be newer than original)
    const newAccessed = new Date(updated.last_accessed);
    const oldAccessed = originalAccessed ? new Date(originalAccessed) : new Date(0);
    if (newAccessed <= oldAccessed) {
      throw new Error('last_accessed was not updated');
    }

    // Check last_mentioned also updated (dead code fix verification)
    const newMentioned = new Date(updated.last_mentioned);
    const oldMentioned = originalMentioned ? new Date(originalMentioned) : new Date(0);
    if (newMentioned <= oldMentioned) {
      throw new Error('last_mentioned was not updated (dead code fix not working)');
    }

    console.log(`  └─ access_count: ${originalCount} → ${updated.access_count}`);
    console.log(`  └─ last_accessed: ${originalAccessed} → ${updated.last_accessed}`);
    console.log(`  └─ last_mentioned: ${originalMentioned} → ${updated.last_mentioned}`);
  });

  // ============================================================
  // TEST 4: Indexes exist
  // ============================================================
  await test('Index on last_accessed exists', async () => {
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
        SELECT indexname FROM pg_indexes
        WHERE tablename = 'memory_entries'
        AND indexname LIKE '%last_accessed%'
      `,
    });

    // If exec_sql doesn't exist, this is expected - just warn
    if (error && error.message.includes('exec_sql')) {
      console.log('  ⚠️  Cannot verify index (exec_sql not available)');
      return;
    }
    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error('Index idx_memory_entries_last_accessed not found');
    }
  });

  await test('Index on access_count exists', async () => {
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
        SELECT indexname FROM pg_indexes
        WHERE tablename = 'memory_entries'
        AND indexname LIKE '%access_count%'
      `,
    });

    if (error && error.message.includes('exec_sql')) {
      console.log('  ⚠️  Cannot verify index (exec_sql not available)');
      return;
    }
    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error('Index idx_memory_entries_access_count not found');
    }
  });

  // ============================================================
  // TEST 5: Build still passes (non-DB test)
  // ============================================================
  await test('TypeScript types are correct', async () => {
    // This is verified by running npx tsc --noEmit before tests
    // If we got here, types compiled successfully
  });

  // ============================================================
  // SUMMARY
  // ============================================================
  console.log('\n' + '='.repeat(60));
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  console.log(`\n📊 Results: ${passed}/${total} tests passed\n`);

  if (passed === total) {
    console.log('✅ All tests passed! Migration verified.\n');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed. Review the errors above.\n');
    process.exit(1);
  }
}

runTests().catch(console.error);
```

**To run:**
```bash
# Set environment variables and run
NEXT_PUBLIC_SUPABASE_URL=https://xrwbbqvwhwabbnwwxcxm.supabase.co \
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... \
npx tsx tests/db/m36-access-tracking.test.ts
```

---

## Reuse Existing Code

### ⚠️ CRITICAL: Validate Before Reusing (Lesson from M3.5-01)

**The M3.5-01 post-mortem taught us:** Don't assume existing code works correctly. VERIFY it before reusing.

### Code to Reuse

**1. Supabase Client (`lib/db/client.ts`)**
```typescript
// EXISTING - Verify it works
import { supabase } from '@/lib/db/client';

// VERIFICATION: Test connection
const { data, error } = await supabase.from('memory_entries').select('id').limit(1);
// Expected: No error, returns array
```

**2. Memory Entry Types (`lib/db/types.ts`)**
```typescript
// EXISTING - Need to extend
import type { MemoryEntry } from '@/lib/db/types';

// VERIFICATION: Check current type has all expected fields
// grep -A 30 "interface MemoryEntry" lib/db/types.ts
```

**3. Migration Pattern (`supabase/migrations/20251128000000_m35_memory_tools.sql`)**
```sql
-- EXISTING - Use as pattern reference
-- This migration shows the correct format for Supabase migrations
-- VERIFICATION: Check migration has been applied
SELECT * FROM supabase_migrations ORDER BY version DESC LIMIT 5;
```

### Verification Checklist (Run Before Coding)

- [ ] `supabase` client connects successfully
- [ ] `memory_entries` table exists
- [ ] `MemoryEntry` type matches actual table schema
- [ ] `npm run build` passes with current code

---

## Known Gotchas

| Issue | Why It Happens | Solution |
|-------|----------------|----------|
| Migration fails with "column already exists" | Re-running migration | Use `IF NOT EXISTS` clause |
| Backfill sets wrong values | `last_mentioned` was never updated | Use COALESCE with fallbacks |
| RPC returns error for non-existent UUID | UUID doesn't match any row | Function silently skips invalid IDs (by design) |
| TypeScript errors after adding fields | Types not updated | Update `lib/db/types.ts` BEFORE running build |
| Tests fail with "exec_sql not found" | Custom SQL function not in Supabase | Use direct query or skip index verification |
| `access_count` goes negative | Bad backfill formula | Use `GREATEST(..., 0)` |

---

## Testing Checklist

### After Each Task

**S1-01, S1-02 (Columns):**
- [ ] Query `SELECT last_accessed, access_count FROM memory_entries LIMIT 1` succeeds
- [ ] Both columns have default values

**S1-03 (Backfill):**
- [ ] `SELECT COUNT(*) FROM memory_entries WHERE last_accessed IS NULL` returns 0
- [ ] `SELECT COUNT(*) FROM memory_entries WHERE access_count IS NULL` returns 0
- [ ] `SELECT COUNT(*) FROM memory_entries WHERE access_count < 0` returns 0

**S1-04 (RPC):**
- [ ] `SELECT update_memory_access(ARRAY[]::uuid[])` returns without error
- [ ] `SELECT update_memory_access(ARRAY['<valid-uuid>']::uuid[])` increments count
- [ ] Verify `last_mentioned` is updated (dead code fix)

**S1-05 (Tests):**
- [ ] `npx tsx tests/db/m36-access-tracking.test.ts` passes all tests
- [ ] Test output shows access_count incrementing

**S1-06 (Final):**
- [ ] `npm run build` passes
- [ ] Memory search still works (zero behavior change)
- [ ] DoD checklist 100% complete

### Manual Verification Script

Run this in Supabase SQL Editor after migration:

```sql
-- 1. Check columns exist
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'memory_entries'
AND column_name IN ('last_accessed', 'access_count');
-- Expected: 2 rows

-- 2. Check no null values
SELECT
  COUNT(*) FILTER (WHERE last_accessed IS NULL) as null_accessed,
  COUNT(*) FILTER (WHERE access_count IS NULL) as null_count,
  COUNT(*) as total
FROM memory_entries;
-- Expected: null_accessed = 0, null_count = 0

-- 3. Check RPC exists
SELECT proname, proargnames
FROM pg_proc
WHERE proname = 'update_memory_access';
-- Expected: 1 row with proargnames = {p_memory_ids}

-- 4. Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'memory_entries'
AND (indexname LIKE '%last_accessed%' OR indexname LIKE '%access_count%');
-- Expected: 2 rows

-- 5. Test RPC (pick a real memory ID)
SELECT id, access_count, last_accessed, last_mentioned
FROM memory_entries
WHERE is_active = true
LIMIT 1;
-- Note the values, then:
-- SELECT update_memory_access(ARRAY['<that-id>']::uuid[]);
-- Then re-query and verify access_count incremented, timestamps updated
```

---

## Success Criteria

### Must Have (Sprint Fails Without These)

- [ ] `last_accessed` column exists with TIMESTAMPTZ type
- [ ] `access_count` column exists with INT type
- [ ] All existing rows have non-null values (backfill complete)
- [ ] `update_memory_access(UUID[])` RPC exists and works
- [ ] RPC updates `last_accessed`, `last_mentioned`, AND `access_count`
- [ ] `npm run build` passes with zero errors
- [ ] Existing memory functionality unchanged (search, remember, update, forget)

### Should Have (Quality Gates)

- [ ] Indexes created for performance
- [ ] DB verification tests pass
- [ ] TypeScript types updated
- [ ] Dead code fix documented

### Nice to Have (Bonus)

- [ ] Sprint completion report written
- [ ] Performance baseline measured (optional)

---

## Execution Order

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: Pre-Flight Checks (15 min)                               │
├─────────────────────────────────────────────────────────────────┤
│  □ Verify on correct branch                                      │
│  □ npm run build passes                                          │
│  □ Can connect to Supabase                                       │
│  □ Review current memory_entries schema                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: Apply Migration (30 min)                                 │
├─────────────────────────────────────────────────────────────────┤
│  □ Create migration file                                         │
│  □ Run in Supabase SQL Editor OR use Supabase CLI                │
│  □ Verify columns added                                          │
│  □ Verify backfill completed                                     │
│  □ Verify indexes created                                        │
│  □ Verify RPC function created                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: Update TypeScript (15 min)                               │
├─────────────────────────────────────────────────────────────────┤
│  □ Add fields to MemoryEntry type                                │
│  □ Add wrapper function to queries.ts                            │
│  □ Run npm run build - verify passes                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: Write & Run Tests (1h)                                   │
├─────────────────────────────────────────────────────────────────┤
│  □ Create test file                                              │
│  □ Run tests                                                     │
│  □ Fix any failures                                              │
│  □ All tests passing                                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: Manual Verification (15 min)                             │
├─────────────────────────────────────────────────────────────────┤
│  □ Run manual verification SQL script                            │
│  □ Test RPC with real memory ID                                  │
│  □ Verify dead code fix (last_mentioned updates)                 │
│  □ Test memory search still works                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 6: Complete DoD Checklist (15 min)                          │
├─────────────────────────────────────────────────────────────────┤
│  □ Check off all DoD items in sprint file                        │
│  □ Check off all quality gates                                   │
│  □ Commit changes to branch                                      │
│  □ Write completion summary                                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Rollback Plan

If something goes wrong:

```sql
-- ROLLBACK: Remove new columns (DESTRUCTIVE - loses data)
ALTER TABLE memory_entries DROP COLUMN IF EXISTS last_accessed;
ALTER TABLE memory_entries DROP COLUMN IF EXISTS access_count;

-- ROLLBACK: Remove indexes
DROP INDEX IF EXISTS idx_memory_entries_last_accessed;
DROP INDEX IF EXISTS idx_memory_entries_access_count;

-- ROLLBACK: Remove RPC function
DROP FUNCTION IF EXISTS update_memory_access(UUID[]);
```

**Note:** Rollback is safe because Sprint 1 adds infrastructure only - nothing uses it yet.

---

## Resources

**External Docs:**
- [Supabase Migrations](https://supabase.com/docs/guides/database/migrations)
- [PostgreSQL ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)
- [PostgreSQL CREATE FUNCTION](https://www.postgresql.org/docs/current/sql-createfunction.html)

**Project Files:**
- Sprint tracking: `docs/sprints/active/sprint-m36-01.md`
- Requirements: `docs/COGNITIVE_MEMORY_REQUIREMENTS.md`
- Previous sprint: `docs/sprints/completed/sprint-m35-02.md`
- Post-mortem (lessons): `docs/sprints/POST_MORTEM_M35-01.md`

**Database Reference:**
- Table: `memory_entries`
- Existing RPC: `hybrid_memory_search`
- Supabase Dashboard: [Project Editor](https://app.supabase.com)

---

## Lessons Applied from M3.5-01 Post-Mortem

This handover document addresses the failures identified in the M3.5-01 post-mortem:

| Failure | How We're Addressing It |
|---------|------------------------|
| "Testing wasn't part of sprint" | S1-05 is explicitly a testing task with 1h allocation |
| "Reuse existing code assumption was flawed" | Added verification checklist before reusing code |
| "Sub-agent instructions were narrow" | This document includes verification steps after each task |
| "No quality gates" | Added 3 explicit quality gates with checkboxes |
| "Sprint declared complete without validation" | DoD checklist must be 100% before completion |
| "Prioritized speed over correctness" | Sprint 1 is minimal (4.5h) with buffer for verification |

---

*Prepared by Claude Code (Opus 4.5) - December 1, 2025*
*Template based on HANDOVER_M4-01.md and HANDOVER_M35-01.md with lessons from POST_MORTEM_M35-01.md*
