# Handover Guide: M3.13-01 Thinking Partner Foundation

**Sprint:** M3.13-01
**Duration:** December 10-12, 2025
**Goal:** Enable Bobo to distinguish between facts, questions, decisions, and insights in memory

---

## Executive Summary

This sprint extends the memory system to support different memory types (fact, question, decision, insight), adds tagging support, and implements "Similar questions" context injection. The work builds on the existing `memory_entries` table and `search_memory` tool.

---

## Pre-Sprint Checklist

- [ ] Verify Supabase connection is working
- [ ] Confirm `memory_entries` table exists with current schema
- [ ] Review existing `lib/agent-sdk/memory-tools.ts`
- [ ] Review existing `lib/db/queries.ts` for search patterns
- [ ] Run `npm run build` to confirm clean starting state

---

## Day 1: Schema & Types (5h)

### Task M3.13-01: Schema Migration - memory_type, tags, thread_id (2h)

**Objective:** Add memory_type, tags, and thread_id columns to memory_entries

**Files to Modify:**
- Supabase migration (via MCP or SQL editor)

**SQL to Execute:**
```sql
-- Add memory_type column with validation
ALTER TABLE memory_entries
ADD COLUMN memory_type TEXT DEFAULT 'fact'
CHECK (memory_type IN ('fact', 'question', 'decision', 'insight'));

-- Add tags array column with GIN index for fast lookups
ALTER TABLE memory_entries
ADD COLUMN tags TEXT[] DEFAULT ARRAY[]::TEXT[];

CREATE INDEX idx_memory_tags ON memory_entries USING gin(tags);

-- Add thread_id for linking related memories (nullable for now)
ALTER TABLE memory_entries
ADD COLUMN thread_id UUID;
```

**Verification:**
```sql
-- Confirm columns exist
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'memory_entries'
AND column_name IN ('memory_type', 'tags', 'thread_id');

-- Test constraint
INSERT INTO memory_entries (content, memory_type) VALUES ('test', 'invalid');
-- Should fail with constraint violation
```

**Done When:**
- All 3 columns exist on memory_entries
- memory_type constraint rejects invalid values
- GIN index on tags is active

---

### Task M3.13-02: thought_threads Table Creation (1h)

**Objective:** Create table for grouping related memories into threads

**SQL to Execute:**
```sql
CREATE TABLE thought_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_thought_threads_user ON thought_threads(user_id);

-- Add foreign key to memory_entries
ALTER TABLE memory_entries
ADD CONSTRAINT fk_memory_thread
FOREIGN KEY (thread_id) REFERENCES thought_threads(id);
```

**Verification:**
```sql
-- Confirm table exists
SELECT * FROM thought_threads LIMIT 1;

-- Test FK relationship
INSERT INTO thought_threads (title) VALUES ('Test Thread') RETURNING id;
-- Use returned ID to insert memory with thread_id
```

**Done When:**
- thought_threads table exists with all columns
- FK constraint links memory_entries.thread_id to thought_threads.id

---

### Task M3.13-03: TypeScript Types (1h)

**Objective:** Add TypeScript types for memory types and thought threads

**File:** `lib/db/types.ts`

**Code to Add:**
```typescript
// Memory type enum
export type MemoryType = 'fact' | 'question' | 'decision' | 'insight';

// Thought thread for grouping memories
export interface ThoughtThread {
  id: string;
  user_id?: string;
  title: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

// Update existing MemoryEntry type (find and modify)
export interface MemoryEntry {
  // ... existing fields ...
  memory_type?: MemoryType;
  tags?: string[];
  thread_id?: string;
}
```

**Verification:**
- TypeScript compiles without errors
- Types are exported and importable

**Done When:**
- MemoryType union type exists
- ThoughtThread interface exists
- MemoryEntry includes new optional fields
- `npm run build` passes

---

## Day 2: Agent Tools (5.5h)

### Task M3.13-04: record_question Tool (2h)

**Objective:** Create tool for recording questions the user asks

**File:** `lib/agent-sdk/memory-tools.ts`

**Tool Definition:**
```typescript
export const recordQuestionTool = {
  name: 'record_question',
  description: 'Record a question the user is exploring. Use when the user asks a significant question worth remembering for future context.',
  parameters: z.object({
    question: z.string().describe('The question being asked'),
    context: z.string().optional().describe('Why this question is being asked'),
    tags: z.array(z.string()).optional().describe('Tags to categorize this question'),
    thread_id: z.string().uuid().optional().describe('Link to existing thought thread'),
  }),
  execute: async ({ question, context, tags, thread_id }) => {
    // Insert into memory_entries with memory_type='question'
    const entry = await createMemoryEntry({
      content: question,
      memory_type: 'question',
      tags: tags || [],
      thread_id,
      metadata: context ? { context } : undefined,
    });
    return { success: true, entry_id: entry.id };
  },
};
```

**Integration:**
- Add to tool registry in `lib/agent-sdk/tool-config.ts`
- Ensure auto-approved (read-write but user-beneficial)

**Verification:**
- Tool appears in agent tool list
- Creates entry with correct memory_type
- Tags are stored correctly

**Done When:**
- Tool is registered and callable
- Creates memory_entries with memory_type='question'
- Tags and thread_id stored if provided

---

### Task M3.13-05: record_decision Tool (2h)

**Objective:** Create tool for recording decisions made during conversation

**File:** `lib/agent-sdk/memory-tools.ts`

**Tool Definition:**
```typescript
export const recordDecisionTool = {
  name: 'record_decision',
  description: 'Record a decision made by the user. Use when the user decides on an approach, makes a choice, or commits to a direction.',
  parameters: z.object({
    decision: z.string().describe('The decision that was made'),
    alternatives: z.array(z.string()).optional().describe('Other options that were considered'),
    rationale: z.string().optional().describe('Why this decision was made'),
    tags: z.array(z.string()).optional().describe('Tags to categorize this decision'),
    thread_id: z.string().uuid().optional().describe('Link to existing thought thread'),
  }),
  execute: async ({ decision, alternatives, rationale, tags, thread_id }) => {
    const entry = await createMemoryEntry({
      content: decision,
      memory_type: 'decision',
      tags: tags || [],
      thread_id,
      metadata: {
        alternatives: alternatives || [],
        rationale: rationale || null
      },
    });
    return { success: true, entry_id: entry.id };
  },
};
```

**Verification:**
- Tool creates decision-type memories
- Metadata contains alternatives and rationale

**Done When:**
- Tool is registered and callable
- Creates memory_entries with memory_type='decision'
- Metadata properly structured with alternatives/rationale

---

### Task M3.13-06: record_insight Tool (1.5h)

**Objective:** Create tool for recording insights and patterns

**File:** `lib/agent-sdk/memory-tools.ts`

**Tool Definition:**
```typescript
export const recordInsightTool = {
  name: 'record_insight',
  description: 'Record an insight or pattern discovered. Use when recognizing a recurring theme, learning, or realization.',
  parameters: z.object({
    insight: z.string().describe('The insight or pattern observed'),
    evidence: z.array(z.string()).optional().describe('Examples or evidence supporting this insight'),
    tags: z.array(z.string()).optional().describe('Tags to categorize this insight'),
    thread_id: z.string().uuid().optional().describe('Link to existing thought thread'),
  }),
  execute: async ({ insight, evidence, tags, thread_id }) => {
    const entry = await createMemoryEntry({
      content: insight,
      memory_type: 'insight',
      tags: tags || [],
      thread_id,
      metadata: evidence ? { evidence } : undefined,
    });
    return { success: true, entry_id: entry.id };
  },
};
```

**Done When:**
- Tool is registered and callable
- Creates memory_entries with memory_type='insight'
- Evidence array stored in metadata

---

## Day 3: Search & Integration (4.5h)

### Task M3.13-07: Enhanced Memory Search (2h)

**Objective:** Add 5-component weighting to search_memory

**File:** `lib/db/queries.ts` or `lib/agent-sdk/memory-tools.ts`

**Search Components:**
1. **Vector similarity (45%)** - Cosine distance on embeddings
2. **BM25 full-text (15%)** - PostgreSQL tsvector search
3. **Recency (20%)** - Decay factor based on created_at
4. **Frequency (10%)** - How often this memory is accessed/referenced
5. **Confidence (10%)** - Source reliability (manual > extracted)

**SQL Function (if using RPC):**
```sql
CREATE OR REPLACE FUNCTION enhanced_memory_search(
  query_embedding vector(1536),
  query_text text,
  memory_type_filter text DEFAULT NULL,
  tag_filter text[] DEFAULT NULL,
  match_limit int DEFAULT 10
) RETURNS TABLE (
  id uuid,
  content text,
  memory_type text,
  tags text[],
  combined_score float
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.content,
    m.memory_type,
    m.tags,
    (
      0.45 * (1 - (m.embedding <=> query_embedding)) +
      0.15 * COALESCE(ts_rank(m.fts, plainto_tsquery(query_text)), 0) +
      0.20 * (1.0 / (1 + EXTRACT(EPOCH FROM (NOW() - m.created_at)) / 86400 / 30)) +
      0.10 * COALESCE(m.access_count::float / 100, 0) +
      0.10 * CASE WHEN m.source = 'manual' THEN 1.0 ELSE 0.5 END
    ) as combined_score
  FROM memory_entries m
  WHERE
    (memory_type_filter IS NULL OR m.memory_type = memory_type_filter)
    AND (tag_filter IS NULL OR m.tags && tag_filter)
  ORDER BY combined_score DESC
  LIMIT match_limit;
END;
$$ LANGUAGE plpgsql;
```

**Verification:**
- Search returns results with combined_score
- memory_type filter works
- tag filter works (array overlap)

**Done When:**
- Enhanced search function exists
- 5 components contribute to score
- Filters work correctly

---

### Task M3.13-08: "Similar Questions" Context Injection (1.5h)

**Objective:** When user asks a question, show similar past questions in context

**File:** `lib/ai/chat/context-builder.ts` (or equivalent)

**Logic:**
```typescript
async function buildContext(messages: UIMessage[], projectId: string) {
  const lastUserMessage = messages.filter(m => m.role === 'user').pop();

  if (lastUserMessage && isQuestion(lastUserMessage.content)) {
    const similarQuestions = await enhancedMemorySearch({
      query: lastUserMessage.content,
      memoryTypeFilter: 'question',
      limit: 3,
    });

    if (similarQuestions.length > 0) {
      context += `\n\n## Similar Questions You've Asked Before\n`;
      similarQuestions.forEach((q, i) => {
        context += `${i + 1}. ${q.content}\n`;
        if (q.metadata?.context) {
          context += `   Context: ${q.metadata.context}\n`;
        }
      });
    }
  }

  return context;
}

function isQuestion(text: string): boolean {
  return text.includes('?') ||
         /^(what|why|how|when|where|who|which|can|should|would|could|is|are|do|does)/i.test(text.trim());
}
```

**Verification:**
- Ask a question that matches past questions
- "Similar Questions" section appears in context
- Only questions shown (not facts/decisions/insights)

**Done When:**
- Question detection works
- Similar questions fetched and formatted
- Section appears in chat context

---

### Task M3.13-09: Integration Testing (2h)

**Objective:** End-to-end testing of all memory types and search

**Test Scenarios:**

1. **Create each memory type:**
   - Use chat to trigger record_question
   - Use chat to trigger record_decision
   - Use chat to trigger record_insight
   - Verify each has correct memory_type in DB

2. **Tag filtering:**
   - Create memories with tags
   - Search with tag filter
   - Verify only matching memories returned

3. **Similar questions flow:**
   - Create question memory
   - Ask similar question
   - Verify "Similar Questions" appears in context

4. **Thread linking:**
   - Create thought_thread
   - Create memories with thread_id
   - Verify FK relationship works

**Verification Queries:**
```sql
-- Check memory types
SELECT memory_type, COUNT(*) FROM memory_entries GROUP BY memory_type;

-- Check tags
SELECT id, content, tags FROM memory_entries WHERE array_length(tags, 1) > 0;

-- Check threads
SELECT t.title, COUNT(m.id) as memory_count
FROM thought_threads t
LEFT JOIN memory_entries m ON m.thread_id = t.id
GROUP BY t.id;
```

**Done When:**
- All 4 memory types can be created via tools
- Tag filtering works
- Similar questions injection works
- Build passes
- No regressions in existing functionality

---

## Definition of Done

- [ ] All 4 memory types (fact, question, decision, insight) can be created and retrieved
- [ ] Tags filter works in search_memory
- [ ] "Similar questions" appears when asking questions
- [ ] Build passes (`npm run build`)
- [ ] No regressions in existing memory functionality

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `lib/db/types.ts` | MemoryType, ThoughtThread types |
| `lib/agent-sdk/memory-tools.ts` | 3 new tools + updated search |
| `lib/agent-sdk/tool-config.ts` | Tool registration |
| `lib/ai/chat/context-builder.ts` | Similar questions injection |
| `lib/db/queries.ts` | Enhanced search function |

---

## Rollback Plan

If issues arise:
1. Remove FK constraint: `ALTER TABLE memory_entries DROP CONSTRAINT fk_memory_thread;`
2. Drop new columns: `ALTER TABLE memory_entries DROP COLUMN memory_type, DROP COLUMN tags, DROP COLUMN thread_id;`
3. Drop thought_threads: `DROP TABLE thought_threads;`
4. Revert TypeScript changes via git

---

## Notes for Executor

- Run migrations in order (M3.13-01 before M3.13-02)
- Test each tool in isolation before integration
- The enhanced search can fall back to existing search if issues arise
- Similar questions feature is additive - disabling doesn't break chat

---

**Created:** December 10, 2025
**Sprint Tracker:** [sprint-m313-01.md](../active/M313-01/sprint-m313-01.md)
