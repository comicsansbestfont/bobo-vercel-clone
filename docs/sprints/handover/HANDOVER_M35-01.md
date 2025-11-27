# Sprint M3.5-01 Execution Guide

**Sprint:** M3.5-01 - Agent Memory Tools
**Duration:** November 28 - December 8, 2025
**Prepared:** November 27, 2025

---

## TL;DR (Plain English Summary)

**What we're building:** We're giving Bobo's Agent Mode the ability to remember, update, and forget facts about the user in real-time during conversation. Currently, when a user says "Remember that I moved to London," the agent says "I'll remember that!" but actually does nothing - memory extraction only happens passively after the chat ends. This creates a trust gap. After this sprint, the agent will have actual tools to manipulate memory.

**The core architecture:** We're adding 4 new agent tools (search_memory, remember_fact, update_memory, forget_memory) that integrate with our existing M3 memory system. These tools will use the same database tables, hybrid search, and categories as the existing memory UI. We're also moving memory extraction to a background edge function so it doesn't block chat responses.

**The three phases:** Phase 1 builds the foundation - search and remember tools plus the safety permission framework. Phase 2 adds correction tools - update and forget, which both depend on search. Phase 3 adds polish - async extraction and error handling to make everything production-ready.

**Key design decisions:** We're using the existing `CONFIRMATION_REQUIRED_TOOLS` pattern from M4 for destructive operations. `remember_fact` auto-approves (additive, low risk), while `update_memory` shows a diff and `forget_memory` requires explicit confirmation. Search is read-only and auto-approves.

**What success looks like:** A user says "I'm moving to London," the agent calls `remember_fact`, and the memory appears instantly in the Memory UI. Later, if the user says "Actually, I'm staying in Sydney," the agent searches for the London memory, shows a diff preview, and updates it on approval. The whole interaction feels natural and trustworthy.

---

## Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              BOBO CHAT APPLICATION                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────┐     ┌──────────────────────────────────────────────────────┐   │
│  │   Chat UI   │────▶│                 /api/chat                            │   │
│  │             │     │                                                       │   │
│  │ • Input     │     │  ┌────────────────────────────────────────────────┐  │   │
│  │ • Messages  │     │  │            Agent Handler (M4)                  │  │   │
│  │ • Agent     │     │  │                                                │  │   │
│  │   Toggle    │     │  │  Tools Available:                              │  │   │
│  │ • Memory    │     │  │  ├── Read, Write, Edit, Bash (M4) ✅           │  │   │
│  │   Tools     │     │  │  ├── Glob, Grep (M4) ✅                        │  │   │
│  └─────────────┘     │  │  └── search_memory (M3.5) 🆕                   │  │   │
│        ▲             │  │      remember_fact (M3.5) 🆕                   │  │   │
│        │             │  │      update_memory (M3.5) 🆕                   │  │   │
│        │             │  │      forget_memory (M3.5) 🆕                   │  │   │
│        │             │  └────────────────────────────────────────────────┘  │   │
│        │             │                         │                             │   │
│        │             └─────────────────────────┼─────────────────────────────┘   │
│        │                                       │                                  │
│        │              SSE Stream               │ Tool Execution                   │
│        │◀──────────────────────────────────────┘                                  │
│                                                                                   │
└───────────────────────────────────────────────────────────────────────────────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    │                   │                   │
                    ▼                   ▼                   ▼
        ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐
        │   M3: Memory      │  │   Memory Tools    │  │   Async Extract   │
        │   System          │  │   (NEW)           │  │   (NEW)           │
        │                   │  │                   │  │                   │
        │ • memory_entries  │◀─│ • search_memory   │  │ • Edge function   │
        │ • 6 categories    │  │ • remember_fact   │  │ • Fire-and-forget │
        │ • hybrid search   │  │ • update_memory   │  │ • Non-blocking    │
        │ • deduplication   │  │ • forget_memory   │  │                   │
        └───────────────────┘  └───────────────────┘  └───────────────────┘
```

### Data Flow (Memory Tool Execution)

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ STEP 1: User Request                                                              │
│                                                                                   │
│   User: "Remember that I'm moving to London next month"                           │
│   UI State: { agentMode: true, model: "claude-sonnet-4-5" }                       │
└──────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│ STEP 2: Agent Decides to Use Memory Tool                                          │
│                                                                                   │
│   Claude thinks: "User wants me to remember a fact about moving"                  │
│   Claude selects: remember_fact tool                                              │
│   Claude generates parameters: {                                                  │
│     category: 'personal_context',                                                 │
│     content: 'Moving to London next month',                                       │
│     confidence: 0.9                                                               │
│   }                                                                               │
└──────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│ STEP 3: Safety Check (PreToolUse Hook)                                            │
│                                                                                   │
│   ┌─────────────────────────────────────────────────────────────────────────┐    │
│   │ Tool: remember_fact                                                      │    │
│   │                                                                          │    │
│   │      ▼ canUseTool() Check                                                │    │
│   │      ├── Is in CONFIRMATION_REQUIRED_TOOLS? NO (additive only)          │    │
│   │      ├── Is in AUTO_APPROVED_TOOLS? YES                                 │    │
│   │      └── Decision: AUTO-APPROVE                                         │    │
│   └─────────────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│ STEP 4: Tool Execution                                                            │
│                                                                                   │
│   memoryTools.remember_fact.execute({                                             │
│     category: 'personal_context',                                                 │
│     content: 'Moving to London next month',                                       │
│     confidence: 0.9                                                               │
│   })                                                                              │
│                                                                                   │
│   ┌─────────────────────────────────────────────────────────────────────────┐    │
│   │ 1. Generate embedding for content                                        │    │
│   │ 2. Check for duplicates (fuzzy match + semantic similarity)             │    │
│   │ 3. Insert into memory_entries table                                      │    │
│   │ 4. Return success message                                                │    │
│   └─────────────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│ STEP 5: Stream Response to UI                                                     │
│                                                                                   │
│   Agent Response:                                                                 │
│   • Tool Result: { tool: "remember_fact", success: true }                        │
│   • Text: "I've remembered that you're moving to London next month!              │
│            You can always update this in your Memory settings."                   │
│                                                                                   │
│   UI Updates:                                                                     │
│   • Toast: "Memory saved: Moving to London"                                       │
│   • Memory badge increments (if visible)                                          │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Permission Flow for Memory Tools

```
                        ┌─────────────────────┐
                        │   Memory Tool       │
                        │   Request           │
                        └──────────┬──────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
                    ▼              ▼              ▼
          ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
          │ ADDITIVE?   │  │ READ-ONLY?  │  │ DESTRUCTIVE?│
          │             │  │             │  │             │
          │ remember_   │  │ search_     │  │ update_     │
          │ fact        │  │ memory      │  │ memory      │
          │             │  │             │  │ forget_     │
          │             │  │             │  │ memory      │
          └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
                 │                │                │
                 ▼                ▼                ▼
          ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
          │  ✅ ALLOW   │  │  ✅ ALLOW   │  │   ❓ ASK    │
          │             │  │             │  │             │
          │ Auto-approve│  │ Auto-approve│  │ Show dialog │
          │ + toast     │  │ silently    │  │ with preview│
          └─────────────┘  └─────────────┘  └──────┬──────┘
                                                   │
                                    ┌──────────────┴──────────────┐
                                    │                             │
                                    ▼                             ▼
                          ┌─────────────────┐          ┌─────────────────┐
                          │ User: APPROVE   │          │ User: DENY      │
                          │                 │          │                 │
                          │ Execute tool,   │          │ Agent explains  │
                          │ confirm toast   │          │ cancellation    │
                          └─────────────────┘          └─────────────────┘


TOOL PERMISSION MATRIX:
┌──────────────────┬─────────────┬─────────────────────────────────┐
│ Tool             │ Permission  │ Reason                          │
├──────────────────┼─────────────┼─────────────────────────────────┤
│ search_memory    │ AUTO        │ Read-only, no side effects      │
│ remember_fact    │ AUTO        │ Additive only, easily undone    │
│ update_memory    │ CONFIRM     │ Modifies existing data          │
│ forget_memory    │ CONFIRM     │ Destructive operation           │
└──────────────────┴─────────────┴─────────────────────────────────┘
```

---

## Quick Start (15 minutes)

```bash
# Ensure you're on the latest
git pull origin main

# Install any new dependencies (if added)
npm install

# Verify build passes
npm run build

# Start dev server
npm run dev
```

**Environment:** No new environment variables required. Uses existing:
- `AI_GATEWAY_API_KEY` - For embeddings (text-embedding-3-small)
- Supabase connection (existing)

**Key Files to Review Before Starting:**
```bash
# Existing memory system (reuse these)
cat lib/db/queries.ts           # Memory CRUD operations
cat lib/ai/embedding.ts         # Embedding generation
cat app/api/memory/*/route.ts   # Memory API endpoints

# Existing agent SDK (extend these)
cat lib/agent-sdk/tool-config.ts      # Add new tools here
cat lib/agent-sdk/agent-handler.ts    # Tool execution flow
cat components/agent/tool-confirmation-dialog.tsx  # Confirmation UI
```

---

## Tasks

### Phase 1: Foundation (9h)

| Task | What to Do | Hours |
|------|------------|-------|
| M3.5-0 | Create `search_memory` tool with hybrid search | 3h |
| M3.5-1 | Create `remember_fact` tool with deduplication | 3h |
| M3.5-6 | Add memory tools to permission framework | 3h |

### Phase 2: Corrections (8h)

| Task | What to Do | Hours |
|------|------------|-------|
| M3.5-2 | Create `update_memory` tool with diff preview | 5h |
| M3.5-3 | Create `forget_memory` tool with soft delete | 3h |

### Phase 3: Polish (8h)

| Task | What to Do | Hours |
|------|------------|-------|
| M3.5-4 | Create async extraction edge function | 6h |
| M3.5-5 | Wrap all tools with error handling | 2h |

### Phase 4: Integration (3h)

| Task | What to Do | Hours |
|------|------------|-------|
| - | End-to-end testing, build verification, demo prep | 3h |

**Total: 28h** (+ 7h buffer = 35h capacity)

---

## Files to Create

```
lib/agent-sdk/
├── memory-tools.ts           # NEW: All 4 memory tool definitions
├── memory-tools.test.ts      # NEW: Unit tests for memory tools
└── tool-config.ts            # MODIFY: Add memory tools to configs

components/agent/
├── memory-update-preview.tsx # NEW: Diff preview for update_memory
└── tool-confirmation-dialog.tsx  # MODIFY: Handle memory tool previews

app/api/memory/
└── extract-background/
    └── route.ts              # NEW: Edge function for async extraction
```

---

## Implementation Details

### M3.5-0: `search_memory` Agent Tool

**File:** `lib/agent-sdk/memory-tools.ts`

**What it does:** Searches user's memories using the same hybrid search (70% vector + 30% BM25) as Loop B. Returns relevant memories for the agent to reference or modify.

```typescript
// lib/agent-sdk/memory-tools.ts
import { z } from 'zod';
import { generateEmbedding } from '@/lib/ai/embedding';
import { supabase } from '@/lib/db/client';

export const memoryTools = {
  search_memory: {
    description: `Search the user's memories to find relevant information.
    Use this to look up facts you previously stored or to find memories to update/forget.
    Returns up to 10 matching memories sorted by relevance.`,

    parameters: z.object({
      query: z.string().describe('Search query - can be keywords or natural language'),
      category: z.enum([
        'work_context', 'personal_context', 'top_of_mind',
        'brief_history', 'long_term_background', 'other_instructions'
      ]).optional().describe('Filter to specific category'),
      limit: z.number().min(1).max(10).default(5).describe('Max results to return'),
    }),

    execute: async ({ query, category, limit = 5 }) => {
      // Generate embedding for semantic search
      const embedding = await generateEmbedding(query);

      // Build query with optional category filter
      let rpcQuery = supabase.rpc('hybrid_memory_search', {
        query_embedding: embedding,
        query_text: query,
        match_count: limit,
        vector_weight: 0.7,
        text_weight: 0.3,
      });

      if (category) {
        rpcQuery = rpcQuery.eq('category', category);
      }

      const { data: memories, error } = await rpcQuery;

      if (error) {
        throw new Error(`Memory search failed: ${error.message}`);
      }

      if (!memories || memories.length === 0) {
        return 'No matching memories found.';
      }

      // Format results for agent consumption
      const results = memories.map((m: any, i: number) =>
        `[${i + 1}] ${m.category}: "${m.content}" (id: ${m.id})`
      ).join('\n');

      return `Found ${memories.length} memories:\n${results}`;
    }
  },
  // ... other tools
};
```

**Database Function (if not exists):**
```sql
-- Run this migration if hybrid_memory_search doesn't exist
CREATE OR REPLACE FUNCTION hybrid_memory_search(
  query_embedding vector(1536),
  query_text text,
  match_count int DEFAULT 5,
  vector_weight float DEFAULT 0.7,
  text_weight float DEFAULT 0.3
)
RETURNS TABLE (
  id uuid,
  category text,
  content text,
  confidence float,
  last_updated timestamptz,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.category,
    m.content,
    m.confidence,
    m.last_updated,
    (
      vector_weight * (1 - (m.embedding <=> query_embedding)) +
      text_weight * ts_rank(to_tsvector('english', m.content), plainto_tsquery('english', query_text))
    ) as similarity
  FROM memory_entries m
  WHERE m.is_active = true
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
```

**Key points:**
- Reuses existing `generateEmbedding` from `lib/ai/embedding.ts`
- Uses Reciprocal Rank Fusion (same as Loop B) for best recall
- Returns memory IDs so agent can reference them in update/forget
- Category filter is optional for broad searches

---

### M3.5-1: `remember_fact` Agent Tool

**File:** `lib/agent-sdk/memory-tools.ts`

**What it does:** Stores a new fact about the user in the memory system. Includes deduplication to avoid storing the same fact twice.

```typescript
// Add to lib/agent-sdk/memory-tools.ts
import { createMemoryEntry, findSimilarMemories } from '@/lib/db/queries';

export const memoryTools = {
  // ... search_memory above ...

  remember_fact: {
    description: `Store an important fact about the user or their work.
    Use when the user shares something worth remembering long-term.
    Be selective - only store meaningful, actionable information.
    Examples: "I'm a senior engineer at Acme Corp", "I prefer TypeScript over JavaScript"
    Do NOT store: transient tasks, temporary states, obvious context`,

    parameters: z.object({
      category: z.enum([
        'work_context',        // Current role, expertise, active projects
        'personal_context',    // Location, family, hobbies, identity
        'top_of_mind',         // Current priorities (high decay)
        'brief_history',       // Past experiences
        'long_term_background', // Education, career history
        'other_instructions'   // Preferences, communication style
      ]).describe('Which memory category this belongs to'),
      content: z.string().min(10).max(500).describe('The fact to remember'),
      confidence: z.number().min(0.5).max(1.0).default(0.8)
        .describe('How confident are you this is accurate? 1.0 = user explicitly stated'),
    }),

    execute: async ({ category, content, confidence }) => {
      // Check for duplicates using semantic similarity
      const duplicates = await findSimilarMemories(content, 0.85);

      if (duplicates.length > 0) {
        const existing = duplicates[0];
        return `Similar memory already exists in ${existing.category}: "${existing.content}". Use update_memory if you need to modify it.`;
      }

      // Create new memory entry
      const memory = await createMemoryEntry({
        category,
        content,
        confidence,
        source_type: 'agent_tool',  // Mark as agent-created
        source_chat_id: null,       // Will be filled by context
      });

      return `Remembered: "${content}" in ${category} (id: ${memory.id})`;
    }
  },
};
```

**Helper Function (add to lib/db/queries.ts):**
```typescript
export async function findSimilarMemories(content: string, threshold: number = 0.85) {
  const embedding = await generateEmbedding(content);

  const { data, error } = await supabase.rpc('find_similar_memories', {
    query_embedding: embedding,
    similarity_threshold: threshold,
  });

  if (error) throw error;
  return data || [];
}
```

**Key points:**
- Uses same embedding model as existing system (text-embedding-3-small)
- Deduplication prevents "I'm a software engineer" being stored 10 times
- `source_type: 'agent_tool'` distinguishes from passive extraction and manual entries
- Category descriptions guide the agent's categorization decisions

---

### M3.5-2: `update_memory` Agent Tool

**File:** `lib/agent-sdk/memory-tools.ts`

**What it does:** Updates an existing memory when the user provides a correction. Requires the agent to first search for the memory to get its ID.

```typescript
// Add to lib/agent-sdk/memory-tools.ts
import { getMemoryById, updateMemoryEntry } from '@/lib/db/queries';

export const memoryTools = {
  // ... previous tools ...

  update_memory: {
    description: `Update an existing memory when the user provides a correction.
    IMPORTANT: First use search_memory to find the memory ID.
    User approval is required before execution (confirmation dialog shown).
    Use when: User says "Actually, I..." or "That's not right, I..."`,

    parameters: z.object({
      memoryId: z.string().uuid().describe('ID of the memory to update (from search_memory)'),
      newContent: z.string().min(10).max(500).describe('The corrected content'),
      reason: z.string().describe('Why this update is being made'),
    }),

    // This will be called AFTER user approves in confirmation dialog
    execute: async ({ memoryId, newContent, reason }) => {
      const existing = await getMemoryById(memoryId);

      if (!existing) {
        return `Memory not found with ID: ${memoryId}. Use search_memory to find the correct ID.`;
      }

      // Check if this is a manual entry (protected)
      if (existing.source_type === 'manual') {
        return `Cannot modify manual memory entries. The user set this directly in their profile.`;
      }

      await updateMemoryEntry(memoryId, {
        content: newContent,
        confidence: 1.0,  // User correction = high confidence
        updated_reason: reason,
        last_updated: new Date().toISOString(),
      });

      return `Memory updated successfully. Old: "${existing.content}" → New: "${newContent}"`;
    },

    // Metadata for confirmation dialog
    confirmationMetadata: {
      type: 'memory_update',
      getPreviewData: async (params: { memoryId: string; newContent: string }) => {
        const existing = await getMemoryById(params.memoryId);
        return {
          oldContent: existing?.content || 'Unknown',
          newContent: params.newContent,
          category: existing?.category || 'Unknown',
        };
      },
    },
  },
};
```

**Confirmation Dialog Component:**
```typescript
// components/agent/memory-update-preview.tsx
'use client';

interface MemoryUpdatePreviewProps {
  oldContent: string;
  newContent: string;
  category: string;
}

export function MemoryUpdatePreview({ oldContent, newContent, category }: MemoryUpdatePreviewProps) {
  return (
    <div className="space-y-3 p-3 bg-muted rounded-lg">
      <div className="text-sm font-medium text-muted-foreground">
        Updating memory in: {category}
      </div>

      <div className="space-y-2">
        <div className="text-sm text-muted-foreground">Current:</div>
        <div className="text-sm text-red-500 line-through bg-red-500/10 p-2 rounded">
          {oldContent}
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-sm text-muted-foreground">Will become:</div>
        <div className="text-sm text-green-500 bg-green-500/10 p-2 rounded">
          {newContent}
        </div>
      </div>
    </div>
  );
}
```

**Key points:**
- Requires memory ID from prior `search_memory` call
- Manual entries (source_type='manual') are protected from agent modification
- Shows diff preview before execution
- Updates `confidence` to 1.0 since user explicitly corrected

---

### M3.5-3: `forget_memory` Agent Tool

**File:** `lib/agent-sdk/memory-tools.ts`

**What it does:** Soft-deletes a memory when the user indicates it's no longer accurate. Requires user confirmation.

```typescript
// Add to lib/agent-sdk/memory-tools.ts
import { softDeleteMemory, getMemoryById } from '@/lib/db/queries';

export const memoryTools = {
  // ... previous tools ...

  forget_memory: {
    description: `Remove a memory that is no longer accurate.
    IMPORTANT: First use search_memory to find the memory ID.
    User approval is required before execution (confirmation dialog shown).
    Use when: User says "That's outdated", "I don't do that anymore", "Forget that"`,

    parameters: z.object({
      memoryId: z.string().uuid().describe('ID of the memory to forget (from search_memory)'),
      reason: z.string().describe('Why this memory is being removed'),
    }),

    execute: async ({ memoryId, reason }) => {
      const existing = await getMemoryById(memoryId);

      if (!existing) {
        return `Memory not found with ID: ${memoryId}. Use search_memory to find the correct ID.`;
      }

      if (existing.source_type === 'manual') {
        return `Cannot delete manual memory entries. The user should remove this from their profile directly.`;
      }

      await softDeleteMemory(memoryId, reason);

      return `Memory forgotten: "${existing.content}" (Reason: ${reason})`;
    },

    confirmationMetadata: {
      type: 'memory_delete',
      getPreviewData: async (params: { memoryId: string; reason: string }) => {
        const existing = await getMemoryById(params.memoryId);
        return {
          content: existing?.content || 'Unknown',
          category: existing?.category || 'Unknown',
          reason: params.reason,
        };
      },
    },
  },
};
```

**Helper Function (add to lib/db/queries.ts):**
```typescript
export async function softDeleteMemory(memoryId: string, reason: string) {
  const { error } = await supabase
    .from('memory_entries')
    .update({
      is_active: false,
      deleted_reason: reason,
      deleted_at: new Date().toISOString(),
    })
    .eq('id', memoryId);

  if (error) throw error;
}
```

**Key points:**
- Soft delete (sets `is_active = false`) - data preserved for potential recovery
- Manual entries protected
- Reason logged for audit trail

---

### M3.5-4: Async Extraction Pipeline

**File:** `app/api/memory/extract-background/route.ts`

**What it does:** Moves memory extraction to a background edge function so it doesn't block chat responses.

```typescript
// app/api/memory/extract-background/route.ts
import { NextRequest } from 'next/server';
import { extractMemoriesFromMessages } from '@/lib/memory-manager';
import { logger } from '@/lib/logger';

export const runtime = 'edge';
export const maxDuration = 60; // 60 second timeout

export async function POST(req: NextRequest) {
  try {
    const { chatId, messages, userId } = await req.json();

    if (!chatId || !messages || messages.length === 0) {
      return Response.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    logger.info(`[AsyncExtract] Starting extraction for chat ${chatId}`);

    // Run extraction (this is the slow part that used to block)
    const extractedCount = await extractMemoriesFromMessages(messages, userId, chatId);

    logger.info(`[AsyncExtract] Extracted ${extractedCount} memories from chat ${chatId}`);

    return Response.json({
      success: true,
      extractedCount,
      chatId,
    });
  } catch (error) {
    logger.error('[AsyncExtract] Extraction failed:', error);

    // Don't throw - this is a background job, failures shouldn't propagate
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
```

**Integration in Chat Route:**
```typescript
// In app/api/chat/route.ts - after generating response

// Fire-and-forget memory extraction (don't await)
if (shouldExtractMemories && messages.length > 0) {
  const extractUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/memory/extract-background`;

  fetch(extractUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chatId,
      messages: messages.slice(-10), // Last 10 messages only
      userId,
    }),
  }).catch((err) => {
    // Log but don't fail the request
    logger.error('[Chat] Background extraction trigger failed:', err);
  });
}

return response; // Return immediately, don't wait for extraction
```

**Key points:**
- Edge runtime for fast cold starts
- 60 second max duration (enough for extraction)
- Fire-and-forget pattern - chat response isn't blocked
- Errors logged but don't propagate to user

---

### M3.5-5: Error Handling Wrapper

**File:** `lib/agent-sdk/memory-tools.ts`

**What it does:** Wraps all memory tools with error handling so failures don't crash the chat.

```typescript
// lib/agent-sdk/memory-tools.ts

import { logger } from '@/lib/logger';

type ToolDefinition = {
  description: string;
  parameters: z.ZodType<any>;
  execute: (params: any) => Promise<string>;
  confirmationMetadata?: any;
};

function wrapWithErrorHandling(tool: ToolDefinition): ToolDefinition {
  return {
    ...tool,
    execute: async (params) => {
      try {
        return await tool.execute(params);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Memory tool failed: ${errorMessage}`, { params, error });

        return `Memory operation failed: ${errorMessage}. You can try again or suggest the user visit their Memory settings at /memory.`;
      }
    },
  };
}

// Apply error handling to all memory tools
export const safeMemoryTools = Object.fromEntries(
  Object.entries(memoryTools).map(([name, tool]) => [
    name,
    wrapWithErrorHandling(tool),
  ])
) as typeof memoryTools;

// Export the safe version for use in agent handler
export { safeMemoryTools as memoryTools };
```

**Key points:**
- All errors caught and converted to helpful messages
- Agent can acknowledge failure gracefully
- User directed to fallback (/memory page)
- Errors logged for debugging

---

### M3.5-6: Safety Permissions

**File:** `lib/agent-sdk/tool-config.ts`

**What it does:** Configures which memory tools require confirmation and which auto-approve.

```typescript
// lib/agent-sdk/tool-config.ts

// Tools that require user confirmation before execution
export const CONFIRMATION_REQUIRED_TOOLS = [
  // Existing M4 tools
  'Write',
  'Edit',
  'Bash',
  // New M3.5 memory tools
  'update_memory',  // Modifies existing data
  'forget_memory',  // Destructive operation
];

// Tools that auto-approve (low risk)
export const AUTO_APPROVED_TOOLS = [
  // Existing M4 tools
  'Read',
  'Glob',
  'Grep',
  // New M3.5 memory tools
  'search_memory',   // Read-only
  'remember_fact',   // Additive only, easily undone
];

// Full agent tool configuration including memory tools
export const FULL_AGENT_TOOL_CONFIG = {
  // ... existing tools ...

  // Memory tools (from M3.5)
  search_memory: memoryTools.search_memory,
  remember_fact: memoryTools.remember_fact,
  update_memory: memoryTools.update_memory,
  forget_memory: memoryTools.forget_memory,
};
```

**Update Confirmation Dialog:**
```typescript
// components/agent/tool-confirmation-dialog.tsx

import { MemoryUpdatePreview } from './memory-update-preview';

// Add to the switch statement in the dialog
case 'update_memory':
  return (
    <MemoryUpdatePreview
      oldContent={previewData.oldContent}
      newContent={previewData.newContent}
      category={previewData.category}
    />
  );

case 'forget_memory':
  return (
    <div className="space-y-2 p-3 bg-destructive/10 rounded-lg">
      <div className="text-sm font-medium text-destructive">
        Deleting memory from: {previewData.category}
      </div>
      <div className="text-sm text-muted-foreground">
        "{previewData.content}"
      </div>
      <div className="text-xs text-muted-foreground">
        Reason: {previewData.reason}
      </div>
    </div>
  );
```

---

## Reuse Existing Code

**Memory System (lib/db/queries.ts):**
```typescript
// Already exists - reuse these
export async function createMemoryEntry(data: CreateMemoryInput): Promise<MemoryEntry>
export async function getMemoryById(id: string): Promise<MemoryEntry | null>
export async function updateMemoryEntry(id: string, data: UpdateMemoryInput): Promise<void>
// Add soft delete function (see M3.5-3)
```

**Embedding Generation (lib/ai/embedding.ts):**
```typescript
// Already exists - reuse
export async function generateEmbedding(text: string): Promise<number[]>
```

**Agent Handler (lib/agent-sdk/agent-handler.ts):**
```typescript
// Already handles tool execution - just add memory tools to config
// No changes needed to the handler itself
```

**Confirmation Dialog (components/agent/tool-confirmation-dialog.tsx):**
```typescript
// Already handles Edit, Write, Bash - extend for memory tools
// Add new case statements for update_memory, forget_memory
```

---

## Known Gotchas

| Issue | Why It Happens | Solution |
|-------|----------------|----------|
| Memory search returns no results | Embeddings not generated for old memories | Run backfill script for existing memories |
| `update_memory` fails with "not found" | Agent didn't search first | Tool description emphasizes "First use search_memory" |
| Duplicate memories still created | Similarity threshold too low | Adjust threshold in `findSimilarMemories` (default 0.85) |
| Async extraction times out | Large conversation history | Limit to last 10 messages per extraction |
| Manual entries modified | Protection not checked | Always check `source_type === 'manual'` before modify/delete |
| Memory tools not appearing | Not registered in config | Ensure added to `FULL_AGENT_TOOL_CONFIG` |

---

## Testing Checklist

**After each task:**
- [ ] `npm run build` passes
- [ ] Dev server starts without errors
- [ ] Feature works manually in Agent Mode

**Per-tool testing:**

**M3.5-0 (search_memory):**
- [ ] Returns relevant memories for keyword search
- [ ] Category filter works
- [ ] Returns formatted results with IDs
- [ ] Handles empty results gracefully

**M3.5-1 (remember_fact):**
- [ ] Creates memory in correct category
- [ ] Detects and prevents duplicates
- [ ] Sets `source_type: 'agent_tool'`
- [ ] Returns success message with ID

**M3.5-2 (update_memory):**
- [ ] Shows confirmation dialog with diff
- [ ] Updates memory content on approval
- [ ] Rejects modification of manual entries
- [ ] Fails gracefully for invalid IDs

**M3.5-3 (forget_memory):**
- [ ] Shows confirmation dialog
- [ ] Soft deletes (is_active = false)
- [ ] Rejects deletion of manual entries
- [ ] Logs reason for deletion

**M3.5-4 (async extraction):**
- [ ] Edge function deploys successfully
- [ ] Chat response returns immediately (not blocked)
- [ ] Extraction completes in background
- [ ] Errors logged but don't crash

**M3.5-5 (error handling):**
- [ ] Failed operations return error strings
- [ ] Chat doesn't crash on memory errors
- [ ] Errors logged for debugging

**M3.5-6 (permissions):**
- [ ] `search_memory` auto-approves
- [ ] `remember_fact` auto-approves
- [ ] `update_memory` shows confirmation
- [ ] `forget_memory` shows confirmation

---

## Success Criteria

- [ ] Build passes with no TypeScript errors
- [ ] All 7 tasks complete
- [ ] "I'll remember that" actually stores a memory
- [ ] User corrections captured in real-time via `update_memory`
- [ ] Destructive operations require explicit user approval
- [ ] Memory tool failures don't crash the chat API
- [ ] Async extraction doesn't block chat response time
- [ ] Manual memory entries protected from agent modification
- [ ] Demo script executes successfully

---

## Team Composition & Sub-Agent Mapping

### Required Expertise

| Role | Skills Needed | Effort |
|------|---------------|--------|
| **Senior Backend Engineer** | TypeScript, Supabase, pgvector, Agent SDK | 18h |
| **Mid Backend Engineer** | Error handling, Edge functions, Testing | 6h |
| **Frontend Engineer** | React, Radix UI, Confirmation dialogs | 4h |

### Sub-Agent Execution Strategy

For Claude Code execution, use these agent types:

| Agent | Model | Tasks | Rationale |
|-------|-------|-------|-----------|
| **Agent 1** | `opus` | M3.5-0, M3.5-1, M3.5-2 | Core tool logic, complex integrations |
| **Agent 2** | `sonnet` | M3.5-3, M3.5-5, M3.5-6 | Simpler tools, safety, error handling |
| **Agent 3** | `sonnet` | M3.5-4 | Edge function, async patterns |

### Execution Order

```
Day 1-2: Agent 1 (Opus) - M3.5-0 search_memory
         Agent 2 (Sonnet) - M3.5-6 safety permissions (parallel)

Day 3-4: Agent 1 (Opus) - M3.5-1 remember_fact

Day 5-6: Agent 1 (Opus) - M3.5-2 update_memory

Day 7:   Agent 2 (Sonnet) - M3.5-3 forget_memory

Day 8:   Agent 3 (Sonnet) - M3.5-4 async extraction

Day 9:   Agent 2 (Sonnet) - M3.5-5 error handling

Day 10:  All agents - Integration testing, build verification
```

---

## Resources

**External Docs:**
- [Letta AI Memory SDK](https://github.com/letta-ai/ai-memory-sdk) - Inspiration
- [Supabase pgvector](https://supabase.com/docs/guides/ai/quickstarts/hello-world) - Vector search
- [Vercel Edge Functions](https://vercel.com/docs/functions/edge-functions) - Async extraction

**Project Files:**
- Sprint tracking: `docs/sprints/active/sprint-m35-01.md`
- Letta Analysis: `docs/Research/Letta-SDK-Analysis.md`
- Architecture: `CLAUDE.md`
- Backlog: `docs/PRODUCT_BACKLOG.md`

---

*Prepared by Claude Code (Opus 4.5) - November 27, 2025*
