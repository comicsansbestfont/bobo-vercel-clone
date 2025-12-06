# Cognitive Memory System - Complete Requirements Document

**Created:** December 1, 2025
**Purpose:** Comprehensive extraction of ALL requirements from brain-building research + backlog gaps
**Status:** DRAFT - Pending sprint planning integration

> **Why This Document Exists:**
> The brain-building folder contains extensive research that was never fully translated into actionable backlog items. This document bridges that gap by extracting every technical requirement with implementation-ready specifications.

---

## Executive Summary

| Source | Requirements | Effort | Status |
|--------|-------------|--------|--------|
| Neuroscience Analysis | 20 items | ~48h | NOT in backlog |
| Cognitive Core Brief | 11 items | ~44h | Partially overlaps |
| PDF Research Reviews | 15 items | ~120h | NOT in backlog |
| Backlog Items Needing Definition | 16 items | +20h revision | IN backlog but vague |
| **Total Unique Work** | **~50 items** | **~150h** | Mixed |

**After deduplication:** ~100-120 hours of work across 3-4 sprints.

---

## Part 1: Requirements NOT in Product Backlog

### 1.1 Schema/Database Changes (P0 Critical)

#### REQ-001: Temporal Dynamics Columns
**Source:** Neuroscience Analysis Section 6.1, Cognitive Core Phase 1
**Priority:** P0 (Critical) | **Effort:** 1h | **Dependencies:** None

**Problem:** All memories weighted equally regardless of recency or access frequency.

**Solution:**
```sql
ALTER TABLE memory_entries
  ADD COLUMN IF NOT EXISTS last_accessed TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS access_count INT DEFAULT 0;

CREATE INDEX idx_memory_entries_last_accessed ON memory_entries(user_id, last_accessed DESC);
CREATE INDEX idx_memory_entries_access_count ON memory_entries(user_id, access_count DESC);
```

**Acceptance Criteria:**
- [ ] Columns exist with sensible defaults
- [ ] Indexes created for query performance
- [ ] Migration runs idempotently

---

#### REQ-002: Importance/Salience Column
**Source:** Neuroscience Analysis Section 6.8, Cognitive Core Phase 1
**Priority:** P2 (Medium) | **Effort:** 1h | **Dependencies:** None

**Problem:** Only confidence exists. Need to distinguish trivial facts from critical information.

**Solution:**
```sql
ALTER TABLE memory_entries
  ADD COLUMN IF NOT EXISTS importance FLOAT DEFAULT 0.5
    CHECK (importance >= 0 AND importance <= 1);

CREATE INDEX idx_memory_entries_importance ON memory_entries(user_id, importance DESC);
```

**Acceptance Criteria:**
- [ ] Column exists with 0-1 constraint
- [ ] Default 0.5 (neutral importance)

---

#### REQ-003: Memory Type Distinction
**Source:** Neuroscience Analysis Section 6.3
**Priority:** P1 (High) | **Effort:** 1h | **Dependencies:** None

**Problem:** All memories treated as semantic facts. No episodic/semantic distinction.

**Solution:**
```sql
ALTER TABLE memory_entries
  ADD COLUMN IF NOT EXISTS memory_type VARCHAR(20) DEFAULT 'semantic'
    CHECK (memory_type IN ('episodic', 'semantic', 'consolidated'));

CREATE INDEX idx_memory_entries_memory_type ON memory_entries(user_id, memory_type);
```

---

#### REQ-004: Episode Context Column
**Source:** Neuroscience Analysis Section 6.3
**Priority:** P1 (High) | **Effort:** 1h | **Dependencies:** REQ-003

**Problem:** Episodic memories need rich context (when, where, topic).

**Solution:**
```sql
ALTER TABLE memory_entries
  ADD COLUMN IF NOT EXISTS episode_context JSONB;

CREATE INDEX idx_memory_entries_episode_context
  ON memory_entries USING GIN (episode_context)
  WHERE memory_type = 'episodic';
```

**TypeScript Interface:**
```typescript
interface EpisodeContext {
  chat_id?: string;
  timestamp: string;
  conversation_topic?: string;
  emotional_valence?: number; // -1 to 1
  confidence_source: 'explicit_statement' | 'inferred' | 'behavior';
}
```

---

#### REQ-005: Consolidation Tracking Column
**Source:** Neuroscience Analysis Section 6.4
**Priority:** P1 (High) | **Effort:** 0.5h | **Dependencies:** None

**Problem:** No way to track which memories were consolidated together.

**Solution:**
```sql
ALTER TABLE memory_entries
  ADD COLUMN IF NOT EXISTS consolidated_from UUID[];
```

---

#### REQ-006: Update source_type Constraint
**Source:** Neuroscience Analysis Section 8.3
**Priority:** P1 (High) | **Effort:** 0.5h | **Dependencies:** None

**Solution:**
```sql
ALTER TABLE memory_entries
  DROP CONSTRAINT IF EXISTS memory_entries_source_type_check;

ALTER TABLE memory_entries
  ADD CONSTRAINT memory_entries_source_type_check
  CHECK (source_type IN ('manual', 'extracted', 'suggested', 'agent_tool', 'consolidated'));
```

---

#### REQ-007: Memory Relationships Table (Graph)
**Source:** Neuroscience Analysis Section 6.2, Cognitive Core Phase 3
**Priority:** P1 (High) | **Effort:** 2h | **Dependencies:** None

**Problem:** No associative network for spreading activation.

**Solution:**
```sql
CREATE TABLE IF NOT EXISTS memory_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES memory_entries(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES memory_entries(id) ON DELETE CASCADE,
  relationship_type VARCHAR(30) NOT NULL
    CHECK (relationship_type IN ('similar', 'elaborates', 'contradicts', 'temporal_sequence', 'same_topic')),
  strength FLOAT NOT NULL DEFAULT 0.5
    CHECK (strength >= 0 AND strength <= 1),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_id, target_id)
);

CREATE INDEX idx_memory_rel_source ON memory_relationships(source_id);
CREATE INDEX idx_memory_rel_target ON memory_relationships(target_id);
CREATE INDEX idx_memory_rel_strength ON memory_relationships(strength DESC);
```

---

#### REQ-008: Bi-Temporal Columns for Contradiction Resolution
**Source:** Gemini PDF Review Section 5.2
**Priority:** P1 (High) | **Effort:** 2h | **Dependencies:** None

**Problem:** "User lives in London" and "User lives in New York" both appear valid. No temporal validity tracking.

**Solution:**
```sql
ALTER TABLE memory_entries
  ADD COLUMN IF NOT EXISTS valid_from TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS valid_to TIMESTAMPTZ, -- NULL = currently valid
  ADD COLUMN IF NOT EXISTS superseded_by UUID REFERENCES memory_entries(id);
```

---

### 1.2 Search Algorithm Changes (P0 Critical)

#### REQ-009: Enhanced Memory Search with Temporal Decay
**Source:** Neuroscience Analysis Section 8.1, Cognitive Core Phase 1
**Priority:** P0 (Critical) | **Effort:** 3h | **Dependencies:** REQ-001, REQ-002

**Problem:** Current search doesn't weight recency or frequency.

**Solution:**
```sql
CREATE OR REPLACE FUNCTION enhanced_memory_search(
  query_embedding vector(1536),
  query_text text,
  match_count int DEFAULT 5,
  vector_weight float DEFAULT 0.45,
  text_weight float DEFAULT 0.15,
  recency_weight float DEFAULT 0.20,
  frequency_weight float DEFAULT 0.10,
  importance_weight float DEFAULT 0.10,
  recency_half_life_days float DEFAULT 30.0,
  p_user_id uuid DEFAULT NULL,
  p_category text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  category text,
  content text,
  confidence float,
  importance float,
  combined_score float
)
LANGUAGE plpgsql
AS $$
DECLARE
  log_normalizer float := LN(100.0);
BEGIN
  RETURN QUERY
  WITH scored_memories AS (
    SELECT
      m.id,
      m.category,
      m.content,
      m.confidence::float,
      COALESCE(m.importance, 0.5)::float as importance,
      (1 - (m.embedding <=> query_embedding))::float as vector_score,
      COALESCE(ts_rank_cd(to_tsvector('english', m.content), plainto_tsquery('english', query_text), 32), 0)::float as text_score,
      EXP(-0.693 * EXTRACT(EPOCH FROM NOW() - COALESCE(m.last_accessed, m.created_at)) / (recency_half_life_days * 86400))::float as recency_score,
      (LN(1.0 + COALESCE(m.access_count, 0)) / log_normalizer)::float as frequency_score
    FROM memory_entries m
    WHERE m.is_active = true
      AND (p_user_id IS NULL OR m.user_id = p_user_id)
      AND (p_category IS NULL OR m.category = p_category)
      AND m.embedding IS NOT NULL
  )
  SELECT
    sm.id,
    sm.category,
    sm.content,
    sm.confidence,
    sm.importance,
    (vector_weight * sm.vector_score + text_weight * LEAST(sm.text_score, 1.0) + recency_weight * sm.recency_score + frequency_weight * sm.frequency_score + importance_weight * sm.importance)::float as combined_score
  FROM scored_memories sm
  WHERE sm.vector_score > 0.3
  ORDER BY combined_score DESC
  LIMIT match_count;
END;
$$;
```

**Acceptance Criteria:**
- [ ] Recency decay follows Ebbinghaus curve: `exp(-0.693 * t / half_life)`
- [ ] Frequency uses logarithmic scaling
- [ ] Minimum vector threshold (0.3) filters irrelevant results
- [ ] Backward compatible with existing queries

---

#### REQ-010: Update Access Metrics Function
**Source:** Neuroscience Analysis Section 8.4, PDF Review
**Priority:** P0 (Critical) | **Effort:** 1h | **Dependencies:** REQ-001

**Problem:** Access metrics not updated after retrieval.

**Solution:**
```sql
CREATE OR REPLACE FUNCTION update_memory_access(p_memory_ids UUID[])
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE memory_entries
  SET last_accessed = NOW(), access_count = access_count + 1
  WHERE id = ANY(p_memory_ids) AND is_active = true;
END;
$$;
```

**TypeScript:**
```typescript
async function updateAccessMetrics(memoryIds: string[]): Promise<void> {
  if (memoryIds.length === 0) return;
  const { error } = await supabase.rpc('update_memory_access', { p_memory_ids: memoryIds });
  if (error) console.error('[updateAccessMetrics] Failed:', error);
  // Non-throwing - access tracking is non-critical
}
```

---

#### REQ-011: Spreading Activation Search Function
**Source:** Neuroscience Analysis Section 8.2, Cognitive Core Phase 3
**Priority:** P1 (High) | **Effort:** 3h | **Dependencies:** REQ-007

**Solution:**
```sql
CREATE OR REPLACE FUNCTION spreading_activation_search(
  query_embedding vector(1536),
  query_text text,
  p_user_id uuid,
  direct_limit int DEFAULT 5,
  neighbor_limit int DEFAULT 3,
  activation_decay float DEFAULT 0.5
)
RETURNS TABLE (
  id uuid,
  category text,
  content text,
  activation float,
  hop_distance int
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH direct_matches AS (
    SELECT m.id, m.category, m.content,
      (1 - (m.embedding <=> query_embedding))::float as activation,
      0 as hop_distance
    FROM memory_entries m
    WHERE m.user_id = p_user_id AND m.is_active = true AND m.embedding IS NOT NULL
    ORDER BY m.embedding <=> query_embedding
    LIMIT direct_limit
  ),
  neighbor_matches AS (
    SELECT DISTINCT ON (m.id)
      m.id, m.category, m.content,
      (dm.activation * activation_decay * r.strength)::float as activation,
      1 as hop_distance
    FROM direct_matches dm
    JOIN memory_relationships r ON r.source_id = dm.id OR r.target_id = dm.id
    JOIN memory_entries m ON m.id = CASE WHEN r.source_id = dm.id THEN r.target_id ELSE r.source_id END
    WHERE m.is_active = true AND m.id NOT IN (SELECT id FROM direct_matches)
    ORDER BY m.id, activation DESC
  )
  SELECT * FROM direct_matches
  UNION ALL
  SELECT * FROM neighbor_matches
  ORDER BY activation DESC
  LIMIT direct_limit + neighbor_limit;
END;
$$;
```

---

#### REQ-012: Build Memory Edges Function
**Source:** Neuroscience Analysis Section 8.2
**Priority:** P1 (High) | **Effort:** 2h | **Dependencies:** REQ-007

**Solution:**
```sql
CREATE OR REPLACE FUNCTION build_memory_edges(
  p_memory_id uuid,
  p_embedding vector(1536),
  p_user_id uuid,
  similarity_threshold float DEFAULT 0.6
)
RETURNS int
LANGUAGE plpgsql
AS $$
DECLARE
  edge_count int := 0;
BEGIN
  INSERT INTO memory_relationships (source_id, target_id, relationship_type, strength)
  SELECT p_memory_id, m.id, 'similar', (1 - (m.embedding <=> p_embedding))::float
  FROM memory_entries m
  WHERE m.id != p_memory_id
    AND m.user_id = p_user_id
    AND m.is_active = true
    AND m.embedding IS NOT NULL
    AND (1 - (m.embedding <=> p_embedding)) > similarity_threshold
  ORDER BY (m.embedding <=> p_embedding)
  LIMIT 10
  ON CONFLICT (source_id, target_id) DO UPDATE SET strength = EXCLUDED.strength, created_at = NOW();

  GET DIAGNOSTICS edge_count = ROW_COUNT;
  RETURN edge_count;
END;
$$;
```

---

### 1.3 Agent Tool Changes (P0 Critical)

#### REQ-013: Hebbian Reinforcement in remember_fact
**Source:** Neuroscience Analysis Section 6.6, Cognitive Core Phase 1
**Priority:** P0 (Critical) | **Effort:** 2h | **Dependencies:** REQ-001

**Problem:** Near-duplicate memories rejected. Should strengthen existing instead.

**Solution:**
```typescript
// In remember_fact tool execute function
const SIMILARITY_THRESHOLD = 0.80;
const duplicates = await findSimilarMemories(content, SIMILARITY_THRESHOLD);

if (duplicates.length > 0) {
  const existing = duplicates[0];

  // REINFORCE instead of reject
  const newConfidence = Math.min(1.0, existing.confidence + 0.05);
  const newImportance = Math.max(existing.importance || 0.5, importance);

  await supabase
    .from('memory_entries')
    .update({
      confidence: newConfidence,
      importance: newImportance,
      access_count: (existing.access_count || 0) + 1,
      last_mentioned: new Date().toISOString(),
      last_accessed: new Date().toISOString(),
    })
    .eq('id', existing.id);

  return `Reinforced existing memory: "${existing.content}"
Confidence: ${existing.confidence.toFixed(2)} → ${newConfidence.toFixed(2)}
(Memory strengthened through repetition)`;
}

// Create new memory if no match...
```

**Acceptance Criteria:**
- [ ] Similarity > 0.80 triggers reinforcement
- [ ] Confidence increases by 0.05 (capped at 1.0)
- [ ] access_count incremented
- [ ] Response indicates "Reinforced" vs "Remembered"

---

#### REQ-014: Context-Aware Search in search_memory
**Source:** Neuroscience Analysis Section 6.5, Cognitive Core Phase 1
**Priority:** P0 (Critical) | **Effort:** 4h | **Dependencies:** REQ-009

**Problem:** Same query always returns same results regardless of conversation context.

**Solution:**
```typescript
// In search_memory tool
execute: async ({ query, category, limit = 5, conversationContext = [] }) => {
  // Build contextual query from last 3 turns
  const contextualText = conversationContext.length > 0
    ? [...conversationContext.slice(-3), query].join('\n')
    : query;

  const embedding = await generateEmbedding(contextualText);

  const { data: memories } = await supabase.rpc('enhanced_memory_search', {
    query_embedding: embedding,
    query_text: query, // Original query for text search
    match_count: limit,
    p_user_id: DEFAULT_USER_ID,
    p_category: category ?? null,
  });

  // Update access metrics
  if (memories?.length) {
    await updateAccessMetrics(memories.map(m => m.id));
  }

  // Format and return results...
}
```

**Acceptance Criteria:**
- [ ] Last 3 conversation turns included in embedding
- [ ] Original query used for text search component
- [ ] Access metrics updated after retrieval

---

#### REQ-015: Importance Parameter in remember_fact
**Source:** Neuroscience Analysis Section 6.8
**Priority:** P2 (Medium) | **Effort:** 1h | **Dependencies:** REQ-002

**Solution:**
```typescript
parameters: z.object({
  category: z.enum(MEMORY_CATEGORIES),
  content: z.string().min(10).max(500),
  confidence: z.number().min(0.5).max(1.0).default(0.8),
  importance: z.number().min(0).max(1.0).default(0.5)
    .describe('How important? 0=trivial, 1=critical'),
}),
```

---

#### REQ-016: Memory Type Parameter in remember_fact
**Source:** Neuroscience Analysis Section 6.3
**Priority:** P1 (High) | **Effort:** 2h | **Dependencies:** REQ-003, REQ-004

**Solution:**
```typescript
parameters: z.object({
  // ... existing
  memory_type: z.enum(['episodic', 'semantic']).default('semantic')
    .describe('episodic for contextual events, semantic for general facts'),
  episode_context: z.object({
    conversation_topic: z.string().optional(),
    emotional_valence: z.number().min(-1).max(1).optional(),
  }).optional(),
}).refine(
  (data) => data.memory_type !== 'episodic' || data.episode_context !== undefined,
  { message: 'episode_context required for episodic memories' }
),
```

---

### 1.4 Background Jobs (P1 High)

#### REQ-017: Memory Consolidation Job
**Source:** Neuroscience Analysis Section 6.4, Cognitive Core Phase 2
**Priority:** P1 (High) | **Effort:** 10h | **Dependencies:** REQ-003, REQ-005, REQ-006

**Problem:** Memories never refined or pruned. Bloat over time.

**Solution Overview:**
1. Find memory clusters (similarity > 0.75, min 3 memories)
2. Synthesize cluster into single fact via LLM
3. Create consolidated memory with source_type='consolidated'
4. Soft-delete originals with deleted_reason='consolidated'
5. Prune stale memories (0 access, 90+ days, low confidence)

**Cron Route:**
```typescript
// app/api/cron/consolidate/route.ts
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { data: users } = await supabase
    .from('memory_entries')
    .select('user_id')
    .eq('is_active', true);

  const uniqueUserIds = [...new Set(users?.map(u => u.user_id) ?? [])];

  const results = await Promise.all(
    uniqueUserIds.map(userId => consolidateMemories(userId))
  );

  return Response.json({ success: true, results });
}
```

**Vercel Config:**
```json
{
  "crons": [{
    "path": "/api/cron/consolidate",
    "schedule": "0 4 * * *"
  }]
}
```

---

#### REQ-018: Consolidation Logging Table
**Source:** Neuroscience Analysis Appendix C
**Priority:** P1 (High) | **Effort:** 1h | **Dependencies:** None

**Solution:**
```sql
CREATE TABLE IF NOT EXISTS memory_consolidation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  clusters_processed INT DEFAULT 0,
  memories_consolidated INT DEFAULT 0,
  memories_pruned INT DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_consolidation_logs_user ON memory_consolidation_logs(user_id, started_at DESC);
```

---

### 1.5 Production Hardening (from PDF Reviews)

#### REQ-019: Summarization Verification Layer
**Source:** Gemini PDF Review Section 8.1
**Priority:** P0 (Critical) | **Effort:** 8h | **Dependencies:** REQ-017

**Problem:** LLM consolidation may hallucinate facts ("False Memory Syndrome").

**Solution:**
```typescript
interface StagedMemory {
  id: string;
  content: string;
  sourceMemoryIds: string[];
  verificationStatus: 'pending' | 'verified' | 'rejected';
  rawTranscript: string;
}

async function verifyConsolidatedMemory(staged: StagedMemory): Promise<boolean> {
  // Use different model as verifier
  const verification = await gpt4o.verify({
    extractedFact: staged.content,
    originalContext: staged.rawTranscript
  });
  return verification.isAccurate && !verification.hasHallucination;
}
```

**Acceptance Criteria:**
- [ ] All consolidated memories go through staging
- [ ] Verification model different from extraction model
- [ ] Original memories archived (not deleted)
- [ ] Verification failures logged

---

#### REQ-020: Latency Budget Enforcement
**Source:** Gemini PDF Review Section 3.3
**Priority:** P0 (Critical) | **Effort:** 12h | **Dependencies:** REQ-009, REQ-011

**Problem:** Full neuro-symbolic retrieval can take 5-10 seconds. Target is <2s.

**Solution:**
```typescript
const LATENCY_BUDGET_MS = 2000;

async function hybridRetrieval(query: string): Promise<RetrievalResult> {
  const vectorPromise = vectorSearch(query);
  const graphPromise = graphSearch(query);

  // Race with timeout - parallel execution
  const results = await Promise.allSettled([
    Promise.race([vectorPromise, timeout(LATENCY_BUDGET_MS * 0.6)]),
    Promise.race([graphPromise, timeout(LATENCY_BUDGET_MS * 0.8)])
  ]);

  return mergeResults(results);
}

// Route simple queries away from graph
function shouldUseGraphRAG(query: string): boolean {
  return detectsEntities(query) || requiresRelationalReasoning(query);
}
```

---

#### REQ-021: Pruning Safety Guards
**Source:** ChatGPT PDF Review
**Priority:** P1 (High) | **Effort:** 4h | **Dependencies:** REQ-017

**Problem:** Aggressive pruning may delete useful memories.

**Solution:**
```typescript
// Very conservative criteria
const PRUNING_CRITERIA = {
  minDaysSinceAccess: 90,
  maxAccessCount: 2,
  maxConfidence: 0.5,
  maxImportance: 0.3,
};

async function identifyPruningCandidates(): Promise<PruningCandidate[]> {
  return await db.query(`
    SELECT * FROM memory_entries
    WHERE last_accessed < NOW() - INTERVAL '90 days'
      AND access_count < 3
      AND confidence < 0.5
      AND importance < 0.3
      AND is_active = true
  `);
}

// Phase 1: Log for review (don't auto-delete)
// Phase 2: Soft delete only after manual approval
```

---

#### REQ-022: Graph Explosion Prevention
**Source:** Gemini PDF Review Section 8.2
**Priority:** P1 (High) | **Effort:** 8h | **Dependencies:** REQ-007, REQ-012

**Problem:** Graph can explode with duplicate nodes ("Bob", "Bobby", "Robert").

**Solution:**
- Entity resolution before node creation
- Schema enforcement (allowed relationship types)
- Weekly maintenance job to merge duplicates
- Maximum 10 edges per memory

---

### 1.6 API Changes (P0)

#### REQ-023: Update Memory API for New Fields
**Source:** All schema changes
**Priority:** P0 (Critical) | **Effort:** 2h | **Dependencies:** All schema changes

**Solution:**
```typescript
// Update validation schema
const memoryEntrySchema = z.object({
  category: z.enum(MEMORY_CATEGORIES),
  content: z.string().min(10).max(500),
  confidence: z.number().min(0.5).max(1.0).default(0.8),
  importance: z.number().min(0).max(1.0).default(0.5),
  memory_type: z.enum(['episodic', 'semantic', 'consolidated']).default('semantic'),
  episode_context: z.object({
    chat_id: z.string().optional(),
    timestamp: z.string().optional(),
    conversation_topic: z.string().optional(),
    emotional_valence: z.number().min(-1).max(1).optional(),
  }).optional().nullable(),
  source_type: z.enum(['manual', 'extracted', 'suggested', 'agent_tool', 'consolidated']).default('manual'),
});
```

---

## Part 2: Backlog Items Needing Better Definition

### 2.1 M3 Phase 4 Items

#### AUDIT-001: M3-27 - Token Budget Enforcement (500 tokens max)

**Current:** 2h estimate, no DoD

**Gaps:**
- What happens when budget exceeded? (Truncation strategy?)
- Which memories get truncated first?
- Where is limit enforced?

**Revised Definition:**

**Description:** Implement token budget system limiting total memory injection to 500 tokens. When exceeded, apply priority-based truncation: work_context > top_of_mind > personal_context > brief_history > long_term_background > other_instructions.

**Acceptance Criteria:**
- [ ] Total injected memory never exceeds 500 tokens
- [ ] Truncation follows priority hierarchy
- [ ] Memory UI shows "X/500 tokens used"
- [ ] Warning at 80% (400 tokens)
- [ ] Truncated memories marked in UI

**Revised Estimate:** 4h (was 2h)

---

#### AUDIT-002: M3-9 - Conflict Resolution UI

**Current:** 3h estimate, no DoD

**Gaps:**
- What defines a "conflict"?
- Who wins by default?
- UI interaction pattern?

**Revised Definition:**

**Description:** When auto-extraction identifies fact contradicting existing manual entry (>80% similarity), show conflict resolution modal. Options: keep manual, accept auto, merge both, keep both separate.

**Acceptance Criteria:**
- [ ] Conflict detection at >80% similarity
- [ ] Modal shows side-by-side comparison
- [ ] Four resolution options available
- [ ] Manual entries marked with badge
- [ ] Auto-extraction never overwrites manual without consent

**Revised Estimate:** 5h (was 3h)

---

#### AUDIT-003: M3-10 - Memory Debugger

**Current:** 3h estimate, no DoD

**Gaps:**
- Where does debugger appear?
- What info shown?
- How to access?

**Revised Definition:**

**Description:** Add collapsible "Context Injected" panel below chat header. Shows: (1) User profile with token count, (2) Memory entries grouped by category with token counts, (3) Project context. Accessible via Cmd+Shift+D or debug icon.

**Acceptance Criteria:**
- [ ] Panel shows 3 sections: Profile, Memories, Project Context
- [ ] Each section shows token count
- [ ] Collapsed by default, state persists
- [ ] Keyboard shortcut works
- [ ] Total: "1,247 / 4,096 tokens (30%)"

**Revised Estimate:** 5h (was 3h)

---

#### AUDIT-004: M3-26 - Memory Provenance UI

**Current:** 2h estimate, no DoD

**Gaps:**
- How is source chat displayed?
- Multiple sources handling?
- Deleted chat handling?

**Revised Definition:**

**Description:** Show source attribution for each memory. Display as clickable link(s) to source chat(s). Deleted chats show "Chat deleted". Multiple sources show as expandable list.

**Acceptance Criteria:**
- [ ] Each memory shows "Source: [Chat Title]"
- [ ] Click opens chat in new tab
- [ ] Deleted chats show graceful fallback
- [ ] Multiple sources expandable

**Revised Estimate:** 3h (was 2h)

---

#### AUDIT-005: M3-31 - Description-Driven Extraction

**Current:** 3h estimate, partial DoD

**Gaps:**
- How to measure improvement?
- Baseline metrics needed

**Revised Definition:**

**Description:** Add `extraction_guidance` TEXT column to categories. Update extraction prompt to use guidance dynamically. Measure before/after on 20 sample conversations.

**Acceptance Criteria:**
- [ ] All 6 categories have guidance populated
- [ ] Extraction prompt uses `${category.extraction_guidance}`
- [ ] Before/after accuracy comparison documented
- [ ] Miscategorization rate improves

**Revised Estimate:** 4h (was 3h)

---

### 2.2 M3.5 Deferred Items

#### AUDIT-006: M3.5-7 - Confirmation Dialogs for update/forget

**Current:** 2-3h estimate, "deferred"

**Gaps:**
- UI mockup?
- Tool call interception pattern?
- Diff view for update?

**Revised Definition:**

**Description:** Intercept update_memory and forget_memory tool calls before execution. update_memory shows diff (old vs new). forget_memory shows red destructive styling. User can approve or reject.

**Acceptance Criteria:**
- [ ] update_memory triggers modal with before/after diff
- [ ] forget_memory triggers modal with red styling
- [ ] "Approve" executes tool
- [ ] "Reject" sends rejection to agent
- [ ] remember_fact and search_memory remain auto-approved

**Revised Estimate:** 4h (was 2-3h)

---

### 2.3 M5 Items

#### AUDIT-007: M5-1 - Per-Project Living Doc Entity

**Current:** 4h estimate, no DoD

**Revised Definition:**

**Description:** Create `project_living_docs` table with: project_id, status (text), decisions (JSON array), risks (JSON array), goals (JSON array), last_updated, update_source (manual/auto).

**Acceptance Criteria:**
- [ ] Table created with one-to-one relationship to projects
- [ ] GET/PUT `/api/projects/[id]/living-doc` endpoints
- [ ] "Project Brain" section on project page
- [ ] Empty state message
- [ ] Manual edit capability

**Revised Estimate:** 5h (was 4h)

---

#### AUDIT-008: M5-2 - Background Updater (session/daily/weekly)

**Current:** 6h estimate, no DoD

**SHOULD BE BROKEN DOWN:**

**M5-2a: Session Summary Generation** (2h)
- Generate summary after chat ends
- Store in chat metadata

**M5-2b: Daily Summary Cron** (2h)
- Midnight aggregation of sessions
- Store in living doc

**M5-2c: Weekly Summary Cron** (2h)
- Sunday aggregation of dailies
- Store in living doc

**Revised Estimate:** 8h total (was 6h)

---

#### AUDIT-009: M5-5 - Fact Extraction Job

**Current:** 6h estimate, no DoD

**SHOULD BE BROKEN DOWN:**

**M5-5a: Fact Schema & API** (3h)
- Create `project_facts` table
- Basic CRUD endpoints

**M5-5b: Extraction Pipeline & Cron** (5h)
- LLM extraction of subject/predicate/object
- Deduplication
- Nightly cron

**Revised Estimate:** 8h total (was 6h)

---

## Part 3: Summary & Sprint Planning Guide

### Priority Matrix

| Priority | Requirements | Total Effort |
|----------|-------------|--------------|
| **P0 Critical** | REQ-001, 009, 010, 013, 014, 019, 020, 023 | ~35h |
| **P1 High** | REQ-003-008, 011, 012, 016, 017, 018, 021, 022 | ~45h |
| **P2 Medium** | REQ-002, 015 | ~2h |

### Recommended Sprint Sequence

#### Sprint 1: Cognitive Foundation (12-15h)
- REQ-001: Temporal columns (1h)
- REQ-009: Enhanced search function (3h)
- REQ-010: Update access metrics (1h)
- REQ-013: Hebbian reinforcement (2h)
- REQ-014: Context-aware search (4h)
- REQ-023: API updates (2h)
- Testing buffer (2h)

**DoD:** Recent memories rank higher. Duplicates strengthen. Context improves results.

#### Sprint 2: Memory Safety (8-10h)
- AUDIT-006: Confirmation dialogs (4h)
- AUDIT-001: Token budget enforcement (4h)
- Testing buffer (2h)

**DoD:** Destructive actions require confirmation. Memory injection respects budget.

#### Sprint 3: Memory Graph Foundation (12-15h)
- REQ-007: Relationships table (2h)
- REQ-012: Build edges function (2h)
- REQ-011: Spreading activation search (3h)
- REQ-003, 004: Memory type columns (2h)
- REQ-008: Bi-temporal columns (2h)
- Testing buffer (3h)

**DoD:** Memories can be linked. Spreading activation retrieval works.

#### Sprint 4: Consolidation (15-20h)
- REQ-017: Consolidation job (10h)
- REQ-018: Logging table (1h)
- REQ-019: Verification layer (8h)
- Testing buffer (3h)

**DoD:** Nightly job consolidates similar memories with verification.

#### Sprint 5: M3 Phase 4 Completion (15h)
- AUDIT-002: Conflict resolution (5h)
- AUDIT-003: Memory debugger (5h)
- AUDIT-004: Provenance UI (3h)
- AUDIT-005: Description-driven extraction (4h)

**DoD:** All M3 Phase 4 items complete with DoD met.

---

## Appendix A: Files to Create/Modify

### New Files
- `supabase/migrations/YYYYMMDD_cognitive_memory_schema.sql`
- `lib/brain/index.ts` - Public API
- `lib/brain/config.ts` - Configuration
- `lib/brain/hippocampus/remember.ts`
- `lib/brain/hippocampus/retrieve.ts`
- `lib/brain/hippocampus/graph.ts`
- `lib/brain/neocortex/consolidation.ts`
- `app/api/cron/consolidate/route.ts`

### Modified Files
- `lib/agent-sdk/memory-tools.ts` - Tool updates
- `lib/db/queries.ts` - New RPC calls
- `app/api/memory/entries/route.ts` - Schema validation
- `components/memory/*` - UI updates

---

## Appendix B: Warnings from PDF Reviews

1. **Do NOT use large context windows as memory substitute** - "Lost in the Middle" phenomenon
2. **Do NOT use MemGPT self-editing loop for real-time chat** - 2.6s+ latency
3. **Do NOT hard-delete during consolidation** - Always soft-delete/archive
4. **Do NOT let pruning run without safety guards** - Log candidates first
5. **Do NOT skip verification for consolidated memories** - Hallucination risk

---

**Document End**

*This document should be reviewed and integrated into PRODUCT_BACKLOG.md after approval.*
