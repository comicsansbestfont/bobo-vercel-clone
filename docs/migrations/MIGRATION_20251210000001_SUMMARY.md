# Migration 20251210000001: Memory Type and Tag Filtering

**Date:** December 10, 2025
**Sprint:** M3.13-01 (Thinking Partner Foundation)
**Purpose:** Add support for filtering memory searches by `memory_type` and `tags`

---

## Overview

This migration enables the `enhanced_memory_search` RPC function to filter memories by:
- **Memory Type** (`p_memory_type`): Filter by fact, question, decision, or insight
- **Tags** (`p_tags`): Filter by tag array (PostgreSQL array overlap `&&` operator)

This is the foundational database work for M3.13-01 (Thinking Partner), which enables Bobo to distinguish between different types of memories and support tag-based organization.

---

## What Was Changed

### Database Schema

#### New Columns Added to `memory_entries`

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `memory_type` | `TEXT` | `'fact'` | Type of memory: fact, question, decision, insight |
| `tags` | `TEXT[]` | `[]` | Array of tags for categorization |
| `last_accessed` | `TIMESTAMPTZ` | `NULL` | When memory was last retrieved (M3.6) |
| `access_count` | `INT` | `0` | How many times memory was accessed (M3.6) |
| `importance` | `FLOAT` | `0.5` | Importance score 0-1 (M3.6) |

**Constraints:**
- `memory_type` must be one of: `'fact'`, `'question'`, `'decision'`, `'insight'`
- `importance` must be between 0 and 1

#### New Indexes

| Index | Purpose |
|-------|---------|
| `idx_memory_tags` | GIN index on `tags` for fast array overlap queries |
| `idx_memory_entries_last_accessed` | Composite index on `(user_id, last_accessed DESC)` for temporal queries |
| `idx_memory_entries_access_count` | Composite index on `(user_id, access_count DESC)` for frequency queries |

### RPC Functions

#### `enhanced_memory_search` (NEW)

**Purpose:** 5-component weighted memory search with temporal dynamics and filtering

**Signature:**
```sql
enhanced_memory_search(
  query_embedding vector(1536),
  query_text text,
  match_count int DEFAULT 5,
  vector_weight float DEFAULT 0.45,
  text_weight float DEFAULT 0.15,
  recency_weight float DEFAULT 0.20,
  frequency_weight float DEFAULT 0.10,
  importance_weight float DEFAULT 0.10,
  recency_half_life_days float DEFAULT 30.0,
  min_vector_similarity float DEFAULT 0.3,
  p_user_id uuid DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_memory_type text DEFAULT NULL,      -- NEW: Filter by memory type
  p_tags text[] DEFAULT NULL             -- NEW: Filter by tags (array overlap)
)
```

**Scoring Components:**
1. **Vector Similarity (45%)** - Cosine distance on embeddings
2. **BM25 Text Search (15%)** - PostgreSQL full-text search with `ts_rank_cd`
3. **Recency (20%)** - Exponential decay based on `last_accessed` (Ebbinghaus curve)
4. **Frequency (10%)** - Logarithmic scaling of `access_count`
5. **Importance (10%)** - Direct importance score

**Filters (all optional):**
- `p_user_id` - Filter to specific user
- `p_category` - Filter to memory category (work_context, personal_context, etc.)
- `p_memory_type` - Filter to memory type (fact, question, decision, insight)
- `p_tags` - Filter to memories with ANY of these tags (array overlap)

**Returns:**
```typescript
{
  id: string;
  category: string;
  content: string;
  confidence: number;
  source_type: string;
  last_accessed: string | null;
  access_count: number;
  importance: number;
  combined_score: number;
  vector_score: number;
  text_score: number;
  recency_score: number;
  frequency_score: number;
}[]
```

#### `update_memory_access` (NEW)

**Purpose:** Update access tracking metrics for Hebbian reinforcement

**Signature:**
```sql
update_memory_access(p_memory_ids UUID[])
RETURNS void
```

**Actions:**
- Sets `last_accessed = NOW()`
- Sets `last_mentioned = NOW()` (fixes dead code bug from M3.6)
- Increments `access_count`
- Only updates active memories (`is_active = true`)

**Usage:** Called after memory retrieval to track which memories are being used

---

## TypeScript Integration

### Updated Types (`lib/db/types.ts`)

```typescript
// RPC function signature
enhanced_memory_search: {
  Args: {
    query_embedding: number[];
    query_text: string;
    match_count?: number;
    vector_weight?: number;
    text_weight?: number;
    recency_weight?: number;
    frequency_weight?: number;
    confidence_weight?: number;
    recency_half_life_days?: number;
    min_vector_similarity?: number;
    p_user_id?: string;
    p_category?: string;
    p_memory_type?: string;    // NEW
    p_tags?: string[];          // NEW
  };
  Returns: {
    id: string;
    category: string;
    content: string;
    confidence: number;
    source_type: string;
    last_accessed: string | null;
    access_count: number;
    importance: number;
    vector_score: number;
    text_score: number;
    recency_score: number;
    frequency_score: number;
    combined_score: number;
  }[];
}
```

---

## Existing Usage

### Similar Questions Feature (`lib/ai/similar-questions.ts`)

This file was **already written** expecting the `p_memory_type` parameter:

```typescript
const { data, error } = await supabase.rpc('enhanced_memory_search', {
  query_embedding: embedding,
  query_text: query,
  match_count: limit,
  p_user_id: DEFAULT_USER_ID,
  p_category: undefined,
  p_memory_type: 'question',  // ALREADY USING THIS!
});
```

This migration makes this code functional.

### Memory Search Tool (`lib/agent-sdk/memory-tools.ts`)

Currently uses `p_category` filter but not `p_memory_type` or `p_tags` yet. Can be extended to use these filters in future sprints.

---

## Migration Safety

### Idempotency

All schema changes use `IF NOT EXISTS`:
- `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
- `CREATE INDEX IF NOT EXISTS`

This migration can be run multiple times safely.

### Backward Compatibility

- All new parameters are **optional** with defaults
- Existing code calling `enhanced_memory_search` without new parameters continues to work
- New columns have sensible defaults:
  - `memory_type` defaults to `'fact'`
  - `tags` defaults to empty array `[]`
  - `last_accessed` defaults to `NULL` (will use `created_at` in calculations)
  - `access_count` defaults to `0`
  - `importance` defaults to `0.5`

---

## Testing Verification

### Manual Testing Queries

```sql
-- Verify columns exist
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'memory_entries'
AND column_name IN ('memory_type', 'tags', 'last_accessed', 'access_count', 'importance');

-- Test memory_type constraint
INSERT INTO memory_entries (user_id, category, content, memory_type)
VALUES ('00000000-0000-0000-0000-000000000001', 'work_context', 'Test', 'invalid');
-- Should fail with constraint violation

-- Test enhanced_memory_search with filters
SELECT * FROM enhanced_memory_search(
  ARRAY[0.1, 0.2, ...]::vector(1536),  -- dummy embedding
  'test query',
  5,                                    -- match_count
  p_memory_type := 'question',
  p_tags := ARRAY['important', 'work']
);

-- Test update_memory_access
SELECT update_memory_access(ARRAY['some-uuid-here']::UUID[]);

-- Verify access tracking works
SELECT id, access_count, last_accessed
FROM memory_entries
WHERE id = 'some-uuid-here';
```

### Expected Build Status

- `npm run build` should pass (TypeScript compilation)
- No breaking changes to existing API routes
- Existing memory tools continue to work

---

## Related Sprints

| Sprint | Feature | Dependency |
|--------|---------|------------|
| **M3.6-01** | Access Tracking Columns | Columns added in this migration |
| **M3.6-02** | Enhanced Memory Search | RPC function created in this migration |
| **M3.13-01** | Memory Types & Tags | Schema added in this migration |
| **M3.13-08** | Similar Questions | Already using `p_memory_type` filter |

---

## Rollback Plan

If issues arise, rollback in reverse order:

```sql
-- Remove functions
DROP FUNCTION IF EXISTS update_memory_access(UUID[]);
DROP FUNCTION IF EXISTS enhanced_memory_search(
  vector(1536), text, int, float, float, float, float, float, float, float,
  uuid, text, text, text[]
);

-- Remove indexes
DROP INDEX IF EXISTS idx_memory_entries_access_count;
DROP INDEX IF EXISTS idx_memory_entries_last_accessed;
DROP INDEX IF EXISTS idx_memory_tags;

-- Remove columns
ALTER TABLE memory_entries DROP COLUMN IF EXISTS importance;
ALTER TABLE memory_entries DROP COLUMN IF EXISTS access_count;
ALTER TABLE memory_entries DROP COLUMN IF EXISTS last_accessed;
ALTER TABLE memory_entries DROP COLUMN IF EXISTS tags;
ALTER TABLE memory_entries DROP COLUMN IF EXISTS memory_type;
```

---

## Next Steps

After this migration is applied:

1. **Verify in Supabase Dashboard:**
   - Columns exist on `memory_entries`
   - Indexes are active
   - RPC functions are callable

2. **Test Similar Questions Feature:**
   - Feature depends on `p_memory_type` filter
   - Should now work end-to-end

3. **Future Enhancements:**
   - Add `record_question`, `record_decision`, `record_insight` agent tools (M3.13)
   - Add tag-based search to memory tools
   - Add UI for browsing memories by type/tags

---

**Migration File:** `supabase/migrations/20251210000001_add_memory_type_tag_filters.sql`
**Created:** December 10, 2025
**Status:** Ready for deployment
