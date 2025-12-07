# Letta AI Memory SDK - Competitive Analysis & Learnings

**Date:** November 27, 2025
**Analyst:** Claude Code (Opus 4)
**Repository Analyzed:** https://github.com/letta-ai/ai-memory-sdk
**Related Backlog Items:** M3-31, M3.5-1 through M3.5-4
**Purpose:** Provide deep technical context for sprint planning and implementation

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [What is Letta AI Memory SDK?](#what-is-letta-ai-memory-sdk)
3. [Architecture Deep Dive](#architecture-deep-dive)
4. [Memory Management Approach](#memory-management-approach)
5. [API Design & Integration Patterns](#api-design--integration-patterns)
6. [Embedding & Retrieval Strategies](#embedding--retrieval-strategies)
7. [Comparison: Letta vs Bobo](#comparison-letta-vs-bobo)
8. [Recommended Adoptions](#recommended-adoptions)
9. [Implementation Specifications](#implementation-specifications)
10. [What NOT to Adopt](#what-not-to-adopt)
11. [References](#references)

---

## Executive Summary

The Letta AI Memory SDK is a lightweight abstraction layer that wraps Letta's advanced memory management capabilities, enabling developers to build stateful AI agents with persistent, evolving memory. After thorough analysis, we identified **3 key features to adopt** that would significantly enhance Bobo's memory capabilities while **preserving 5 existing Bobo advantages** that Letta lacks.

### Key Findings

| Dimension | Letta SDK | Bobo (Current) | Verdict |
|-----------|-----------|----------------|---------|
| Memory Structure | Labeled blocks with descriptions | 6 hierarchical categories | **Bobo ahead** |
| Self-Editing Memory | Agent tools (append, replace, rethink) | Passive extraction only | **Letta ahead** |
| Retrieval | Pure vector (cosine) | Hybrid (70% vector + 30% BM25) | **Bobo ahead** |
| Cross-Project | Per-subject isolation | Double-Loop with Loop B | **Bobo ahead** |
| Async Processing | Background "sleeptime agent" | Synchronous extraction | **Letta ahead** |
| Token Transparency | Opaque/server-side | Real-time tracking with segments | **Bobo ahead** |
| Citations | None | Perplexity-style inline [1], [2] | **Bobo ahead** |

### Recommended Actions

1. **ADOPT:** Self-editing memory via agent tools (M3.5-1, M3.5-2, M3.5-3)
2. **ADOPT:** Description-driven extraction guidance (M3-31)
3. **ADOPT:** Async memory processing pipeline (M3.5-4)
4. **KEEP:** Hybrid search, cross-project RAG, citations, token transparency, model-specific caching

---

## What is Letta AI Memory SDK?

### Problem Statement

The SDK addresses a fundamental limitation of Large Language Models: **LLMs are stateless by design**. Traditional LLM APIs require sending the complete conversation history with every request, leading to:

1. Context window overflow as conversations grow
2. No persistent memory across sessions
3. Manual management of conversation state
4. Inability to learn and evolve from interactions over time

### Solution Approach

Letta provides agents that **actively manage their own memory** rather than passively retrieving information like traditional RAG systems. The key insight is treating memory as a living, evolvable state that persists across sessions.

### SDK Components

| Package | Language | Purpose |
|---------|----------|---------|
| `ai-memory-sdk` | Python | Core memory operations |
| `@letta-ai/memory-sdk` | TypeScript | Core memory operations |
| `@letta-ai/vercel-ai-sdk-provider` | TypeScript | Vercel AI SDK integration |

---

## Architecture Deep Dive

### Core Abstractions

#### 1. Subjects

The primary abstraction representing "what memory concerns":

```typescript
// A subject can be a user, project, or any logical entity
const memory = new Memory({ subjectId: 'user_sarah' });
const memory = new Memory({ subjectId: 'project_alpha' });
```

**Key Properties:**
- Each subject maps to exactly **one Letta agent**
- Subjects maintain isolated memory state
- Subject IDs support alphanumeric characters, underscores, and dashes (no colons)
- Agents are identified via namespaced tags like `subj:{subject_id}`

#### 2. Memory Blocks

Named, persistent memory sections within a subject's core context window:

```typescript
interface Block {
  label: string;        // identifier: "human", "summary", "policies"
  description: string;  // guides agent update behavior
  value: string;        // actual content stored
  limit: number;        // character limit, default 10,000
}
```

**Standard Block Types:**
- `human` - User profile and preferences
- `persona` - Agent personality/character definition
- `summary` - Conversation summaries
- `policies` - Domain-specific rules
- Custom blocks for any use case

**Critical Insight:** Blocks are **self-editing** - agents autonomously decide when to update them based on their descriptions.

#### 3. Messages

Conversation turns sent to the agent that trigger asynchronous memory processing:

```typescript
interface MessageCreate {
  content: string;   // Required: message text
  role: string;      // Required: "user", "assistant", etc.
  name?: string;     // Optional: speaker identifier
  metadata?: object; // Optional: additional context
}
```

### Memory Hierarchy (MemGPT Architecture)

Letta implements concepts from the **MemGPT research paper** (arXiv:2310.08560):

```
┌─────────────────────────────────────────────┐
│           IN-CONTEXT MEMORY                 │
│  (Memory Blocks in active context window)   │
│  - Self-editing by agent                    │
│  - Immediate access                         │
│  - Size-limited per block                   │
├─────────────────────────────────────────────┤
│         OUT-OF-CONTEXT MEMORY               │
│       (Archival/Vector Storage)             │
│  - Semantic search via embeddings           │
│  - Unlimited storage                        │
│  - Retrieved on demand                      │
└─────────────────────────────────────────────┘
```

### Agentic Context Engineering

Unlike passive RAG systems, Letta agents use **built-in tools** to:
- Edit memory blocks during conversations
- Insert facts into archival storage
- Search past conversations semantically
- Manage their own context window intelligently

---

## Memory Management Approach

### Memory Block Operations

Letta agents have access to these self-editing tools:

| Function | Purpose | Example |
|----------|---------|---------|
| `core_memory_append(label, content)` | Append text to a block | Add new fact to user profile |
| `core_memory_replace(label, old, new)` | Find-and-replace within block | Update outdated information |
| `core_memory_rethink(label, new_content)` | Complete block rewrite | Reorganize entire section |
| `memory_insert(label, line_number, content)` | Positional insertion | Insert at specific location |
| `memory_apply_patch(label, unified_diff)` | Batch edits via diff format | Multiple changes at once |

### Archival Memory Operations

| Function | Purpose |
|----------|---------|
| `archival_memory_insert(content, tags)` | Store long-term memory |
| `archival_memory_search(query, tags, date_range)` | Semantic retrieval |

### Compression & Summarization

Letta implements sophisticated compression strategies:

#### Summarization Modes

```python
class SummarizationMode(Enum):
    STATIC_MESSAGE_BUFFER = "static_message_buffer"
    PARTIAL_EVICT_MESSAGE_BUFFER = "partial_evict"
```

#### Strategy 1: Static Message Buffer
- Maintains a **fixed-size message window**
- Evicts oldest messages when buffer exceeds limit
- Simple truncation with optional background summarization

#### Strategy 2: Partial Evict Buffer (More Sophisticated)
1. Calculate target retention based on `partial_evict_summarizer_percentage`
2. Find assistant message boundaries to preserve conversational coherence
3. Generate recursive summaries of evicted segments
4. Inject summary back into context as a system message

#### Three-Tier Fallback System

When summarization itself exceeds context limits:

1. **Initial attempt**: Full transcript
2. **Retry with clamped tool returns**: 60% reduction in tool response size
3. **Hard truncate**: Conservative character budget (60% of context window x 4)

### Asynchronous Processing ("Sleeptime Agent")

Messages are processed asynchronously via a background agent:

```
User Message → Immediate Response → Background Memory Update (async)
                                           ↓
                                  waitForRun() if sync needed
```

**Benefits:**
- Non-blocking user experience
- Longer extraction windows without latency impact
- Enables parallel memory operations

---

## API Design & Integration Patterns

### TypeScript API Surface

```typescript
class Memory {
  constructor(config?: { apiKey?: string; subjectId?: string });

  // Subject Management
  initializeSubject(subjectId: string, reset?: boolean): Promise<string>;
  listBlocks(subjectId?: string): Promise<Block[]>;

  // Memory Block Operations
  initializeMemory(
    label: string,
    description: string,
    value?: string,
    charLimit?: number,
    reset?: boolean,
    subjectId?: string
  ): Promise<string>;

  getMemory(
    label: string,
    promptFormatted?: boolean,
    subjectId?: string
  ): Promise<string | null>;

  deleteBlock(label: string, subjectId?: string): Promise<void>;

  // Message Processing
  addMessages(messages: MessageCreate[], skipVectorStorage?: boolean): Promise<string>;
  addMessagesToSubject(
    subjectId: string,
    messages: MessageCreate[],
    skipVectorStorage?: boolean
  ): Promise<string>;

  // Search & Retrieval
  search(userId: string, query: string, tags?: string[]): Promise<string[]>;

  // Run Management
  waitForRun(runId: string, timeout?: number): Promise<void>;
}
```

### Integration Pattern: "Subconscious Agent"

```
┌──────────────────┐      ┌──────────────────┐
│  Your App/LLM    │◄────►│   Memory SDK     │
│  (OpenAI, etc.)  │      │                  │
└────────┬─────────┘      └────────┬─────────┘
         │                         │
         │ System prompt with      │ Manages Letta
         │ injected memory         │ agents & blocks
         │                         │
         │                         ▼
         │                ┌──────────────────┐
         │                │   Letta Cloud/   │
         │                │   Self-hosted    │
         │                │  ─────────────── │
         │                │  • Agent state   │
         │                │  • Memory blocks │
         │                │  • Archival DB   │
         │                │  • Vector search │
         │                └──────────────────┘
```

### OpenAI Integration Example

```python
from openai import OpenAI
from ai_memory_sdk import Memory

openai_client = OpenAI()
memory = Memory()

# 1. Retrieve formatted memory for injection
user_memory = memory.get_user_memory(user_id, prompt_formatted=True)

# 2. Build enriched system prompt
system_prompt = f"""You are a helpful assistant.
{user_memory}
"""

# 3. Call OpenAI as normal
response = openai_client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_input}
    ]
)

# 4. Store conversation for async learning
run = memory.add_messages(user_id, [
    {"role": "user", "content": user_input},
    {"role": "assistant", "content": response.choices[0].message.content}
])
memory.wait_for_run(run)
```

### Vercel AI SDK Integration

```typescript
import { lettaCloud } from '@letta-ai/vercel-ai-sdk-provider';
import { streamText } from 'ai';

const result = streamText({
  model: lettaCloud(),
  providerOptions: {
    letta: {
      agent: {
        id: 'your-agent-id',
        maxSteps: 100,
        background: true
      },
      timeoutInSeconds: 300
    }
  },
  prompt: 'Your prompt here',
});
```

---

## Embedding & Retrieval Strategies

### Embedding Configuration

**Supported Providers (19+):**
- **Cloud:** OpenAI, Anthropic, Google AI, Google Vertex, Azure, Bedrock (AWS), Groq, Mistral, Together, Pinecone
- **Local:** Ollama, LM Studio, LlamaCPP, KoboldCPP, VLLM, Hugging Face

**Default Models:**
- OpenAI: `text-embedding-ada-002` (1536 dimensions) or `text-embedding-3-small` (2000 dimensions)
- Letta Free: `letta-free` (1536 dimensions)
- Pinecone: `llama-text-embed-v2` (1536 dimensions)

### Batch Processing (OpenAI Implementation)

Sophisticated batch handling with progressive degradation:

1. **Progressive Degradation:** When API limits exceeded, batch size halved (2048 → 1024 → 512...) before reducing chunk size
2. **Concurrent Processing:** Uses `asyncio.gather()` with semaphore limiting to 3 concurrent requests
3. **Input Validation:** Rejects empty strings and non-string values upfront
4. **Performance Monitoring:** Logs slow requests (>1s warns, >2s errors)

### Retrieval Algorithm

**Pure Vector Search (Cosine Distance):**

```python
# PostgreSQL with pgvector
query = query.order_by(
    combined_query.c.embedding.cosine_distance(embedded_text).asc()
)
```

**Query Flow:**
1. Generate embedding for query text
2. Pad embedding to maximum dimension
3. Combine SourcePassage and ArchivalPassage via `union_all` CTE
4. Apply cosine distance ordering
5. Execute cursor-based pagination

### What Letta LACKS (Important for Bobo)

| Feature | Status in Letta |
|---------|-----------------|
| Hybrid Search (Vector + BM25) | **Not implemented** |
| Full-text search (tsvector) | **Not found** |
| Reranking | **Not present** |
| MMR (Maximum Marginal Relevance) | **Not implemented** |
| Relevance scores in results | **Not exposed** |
| Cross-encoder reranking | **Not present** |
| Query expansion | **Not implemented** |

---

## Comparison: Letta vs Bobo

### Feature-by-Feature Analysis

#### Memory Structure

| Aspect | Letta | Bobo |
|--------|-------|------|
| Organization | Labeled blocks | 6 hierarchical categories |
| Block descriptions | Explicit `description` field | Implicit meanings |
| Character limits | Per-block configurable | Global token budget |
| Self-editing | Agent-driven via tools | Passive extraction |

**Verdict:** Letta's explicit descriptions are better for extraction guidance; Bobo's hierarchy is better for organization.

#### Retrieval Quality

| Aspect | Letta | Bobo |
|--------|-------|------|
| Search type | Pure vector (cosine) | Hybrid (70% vector + 30% text) |
| Full-text search | No | Yes (PostgreSQL tsvector) |
| Fusion algorithm | None | Reciprocal Rank Fusion |
| Cross-project | No (subject isolation) | Yes (Loop B global search) |

**Verdict:** Bobo significantly ahead - hybrid search catches keyword matches that pure semantic misses.

#### Context Management

| Aspect | Letta | Bobo |
|--------|-------|------|
| Token tracking | Server-side (opaque) | Client-side (transparent) |
| Usage states | Not exposed | safe/warning/critical |
| Segment breakdown | Not available | system/history/draft |
| Model-specific limits | Backend-managed | Frontend-tracked |

**Verdict:** Bobo's transparency is a major advantage for developer experience.

#### Source Attribution

| Aspect | Letta | Bobo |
|--------|-------|------|
| Citations | None | Perplexity-style inline [1], [2] |
| Source tracking | Not built-in | Smart file detection |
| Attribution types | N/A | "Project Files" vs "Global Inspiration" |

**Verdict:** Bobo uniquely provides trust and transparency through citations.

### Side-by-Side Code Comparison

#### Memory Extraction

**Letta (Real-time, Agent-Driven):**
```python
# Agent decides what to remember during conversation
response = agent.chat("I'm moving to London next month")
# Agent internally calls: core_memory_append("human", "Relocating to London")
```

**Bobo (Batch, Passive):**
```typescript
// Extraction happens after chat ends
const messages = await getMessages(chatId);
const extracted = await extractMemories(messages); // Gemini 2.5 Flash Lite
await saveMemories(extracted);
```

#### Memory Retrieval

**Letta (Pure Vector):**
```python
results = memory.search(user_id, "programming languages")
# Returns: List[str] - just content, no scores
```

**Bobo (Hybrid + RRF):**
```typescript
const results = await hybridSearch(
  queryEmbedding,
  threshold,
  limit,
  activeProjectId
);
// Returns: { id, content, similarity, source_type }[]
```

---

## Recommended Adoptions

### 1. Self-Editing Memory via Agent Tools (HIGH PRIORITY)

**Backlog Items:** M3.5-1, M3.5-2, M3.5-3

**What:** Add tools to Agent SDK that allow real-time memory manipulation.

**Why:**
- Current M3 extraction is passive (runs after chat ends)
- User corrections aren't immediately captured
- Agent can't decide in-the-moment what's worth remembering

**Implementation:**

```typescript
// lib/agent-sdk/memory-tools.ts
export const memoryTools = {
  remember_fact: {
    description: `Store an important fact about the user or their work.
    Use when the user shares something worth remembering long-term.
    Be selective - only store meaningful, actionable information.`,
    parameters: z.object({
      category: z.enum([
        'work_context', 'personal_context', 'top_of_mind',
        'brief_history', 'long_term_background', 'other_instructions'
      ]),
      content: z.string(),
      confidence: z.number().min(0.5).max(1.0),
    }),
    execute: async ({ category, content, confidence }) => {
      await createMemory({
        category,
        content,
        confidence,
        source: 'agent_extracted',
      });
      return `Remembered: "${content}" in ${category}`;
    }
  },

  update_memory: {
    description: `Update an existing memory when user provides correction.`,
    parameters: z.object({
      memoryId: z.string(),
      newContent: z.string(),
      reason: z.string().optional(),
    }),
    execute: async ({ memoryId, newContent, reason }) => {
      await updateMemory(memoryId, {
        content: newContent,
        confidence: 1.0, // User correction = high confidence
      });
      return `Memory updated successfully.`;
    }
  },

  forget_memory: {
    description: `Mark memory as outdated when user says it's wrong.`,
    parameters: z.object({
      memoryId: z.string(),
      reason: z.string(),
    }),
    execute: async ({ memoryId, reason }) => {
      await deleteMemory(memoryId);
      return `Memory removed: ${reason}`;
    }
  }
};
```

**UX Flow:**
```
User: "By the way, I'm moving to London next month"
Agent: "That's exciting! I'll remember that you're relocating to London."
       [Calls remember_fact internally]
Memory: Instantly saved (not waiting for chat end)
```

**Effort:** 7 hours total
**Dependencies:** M4 Agent SDK (complete)

---

### 2. Description-Driven Extraction Guidance (MEDIUM PRIORITY)

**Backlog Item:** M3-31

**What:** Add `extraction_guidance` field to memory categories.

**Why:**
- Current M3 categories have implicit meanings
- Extraction prompt is generic, not category-aware
- Better descriptions = better extraction accuracy

**Implementation:**

```sql
-- Migration
ALTER TABLE memory_entries ADD COLUMN extraction_guidance TEXT;

UPDATE memory_entries SET extraction_guidance = CASE category
  WHEN 'work_context' THEN
    'Current role, company, expertise areas, active projects. Update when user mentions job changes or new responsibilities.'
  WHEN 'personal_context' THEN
    'Location, family, hobbies, identity. Update when user shares personal details. Be conservative - only store what is clearly stated.'
  WHEN 'top_of_mind' THEN
    'Immediate priorities, current focus, urgent concerns. High decay rate - replace frequently as priorities shift.'
  WHEN 'brief_history' THEN
    'Past experiences grouped by recency. Append new events, consolidate old. Subcategories: recent_months, earlier, long_term.'
  WHEN 'long_term_background' THEN
    'Education, career history, foundational life facts. Rarely changes - only update for major life events.'
  WHEN 'other_instructions' THEN
    'Communication preferences, formatting requests, recurring instructions. Update when user expresses preferences.'
END;
```

**Updated Extraction Prompt:**

```typescript
const extractionPrompt = `
Extract memories into these categories. Follow the guidance for each:

${categories.map(c => `
### ${c.label.toUpperCase()}
Guidance: ${c.extraction_guidance}
Current entries: ${c.entries.length}
`).join('\n')}

For each extraction, determine:
1. Which category it belongs to (use guidance)
2. Confidence level (0.9-1.0 stated, 0.7-0.8 implied, 0.5-0.6 inferred)
3. Whether it updates, replaces, or adds to existing entries
`;
```

**Effort:** 3 hours
**Dependencies:** None (can start immediately)

---

### 3. Async Memory Processing Pipeline (MEDIUM PRIORITY)

**Backlog Item:** M3.5-4

**What:** Move memory extraction to background job.

**Why:**
- Current extraction blocks chat API response
- Extraction latency adds to response time
- Background processing enables larger extraction windows

**Implementation:**

```typescript
// In /api/chat/route.ts
export async function POST(req: Request) {
  // ... generate response ...

  // Fire-and-forget memory extraction (don't await)
  if (shouldExtract && !skipMemoryExtraction) {
    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/memory/extract-background`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, messages }),
    }).catch(console.error); // Log but don't block
  }

  return response; // Return immediately
}

// New: /api/memory/extract-background/route.ts
export const runtime = 'edge';
export const maxDuration = 60; // seconds

export async function POST(req: Request) {
  const { chatId, messages } = await req.json();

  try {
    await extractMemories(messages);
    return Response.json({ success: true });
  } catch (error) {
    console.error('Background extraction failed:', error);
    return Response.json({ success: false, error: String(error) }, { status: 500 });
  }
}
```

**Benefits:**
- Response time improvement (removes extraction latency)
- Better UX (user doesn't wait for extraction)
- Enables longer extraction windows without blocking
- Can retry failed extractions

**Effort:** 4 hours
**Dependencies:** None

---

## Implementation Specifications

### Database Schema Changes

```sql
-- M3-31: Add extraction guidance
ALTER TABLE memory_entries ADD COLUMN IF NOT EXISTS extraction_guidance TEXT;
ALTER TABLE memory_entries ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'auto_extracted';

-- Add source enum constraint
ALTER TABLE memory_entries ADD CONSTRAINT memory_source_check
  CHECK (source IN ('auto_extracted', 'agent_extracted', 'user_created', 'imported'));

-- Index for filtering by source
CREATE INDEX IF NOT EXISTS idx_memory_entries_source ON memory_entries(source);
```

### New API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/memory/extract-background` | POST | Async extraction trigger |
| `/api/memory/[id]` | PATCH | Update single memory (for agent tool) |
| `/api/memory/[id]` | DELETE | Soft delete memory (for agent tool) |

### Agent Tool Registration

```typescript
// lib/agent-sdk/tool-config.ts
import { memoryTools } from './memory-tools';

export const TOOL_TIERS = {
  DEFAULT: [...existingTools],
  FULL: [...existingTools, ...Object.values(memoryTools)],
  READONLY: [...readonlyTools],
  MEMORY: Object.values(memoryTools), // New tier for memory-only operations
};
```

### Testing Requirements

| Test Case | Type | Priority |
|-----------|------|----------|
| remember_fact creates memory with correct category | Unit | HIGH |
| update_memory modifies existing memory | Unit | HIGH |
| forget_memory soft-deletes memory | Unit | HIGH |
| Async extraction doesn't block response | Integration | HIGH |
| Extraction guidance improves categorization | Manual | MEDIUM |
| Agent calls memory tools appropriately | E2E | MEDIUM |

---

## What NOT to Adopt

### 1. Subject Isolation Model

**What Letta Does:** Each subject (user/project) has completely isolated memory.

**Why Skip:** Bobo's cross-project RAG (Loop B) is a key differentiator. It enables learning patterns across projects without data pollution through explicit source typing.

### 2. Pure Vector Search

**What Letta Does:** Cosine similarity only.

**Why Skip:** Bobo's hybrid search (70% vector + 30% BM25 via RRF) catches keyword matches that pure semantic misses. This is a significant retrieval quality advantage.

### 3. Opaque Token Management

**What Letta Does:** Token tracking is server-side and not exposed to clients.

**Why Skip:** Bobo's transparent token tracking (safe/warning/critical states, segment breakdown) is a major developer experience advantage.

### 4. Vercel AI SDK Provider Wrapper

**What Letta Does:** Provides `@letta-ai/vercel-ai-sdk-provider` for seamless integration.

**Why Skip:** Bobo's direct AI Gateway integration is simpler and doesn't add dependency. Consider only if Letta adds unique features.

### 5. Single Perpetual History

**What Letta Does:** All interactions form one continuous memory stream without sessions.

**Why Skip:** Bobo's project-based organization provides better structure. Users can still have continuous memory within projects.

---

## References

### Primary Sources

1. **Letta AI Memory SDK Repository**
   - URL: https://github.com/letta-ai/ai-memory-sdk
   - Analyzed: November 27, 2025

2. **Letta Documentation**
   - URL: https://docs.letta.com
   - Topics: Memory architecture, API reference, integration guides

3. **MemGPT Research Paper**
   - arXiv: 2310.08560
   - Title: "MemGPT: Towards LLMs as Operating Systems"
   - Relevance: Foundational concepts for Letta's memory hierarchy

### Bobo Reference Files

| File | Purpose |
|------|---------|
| `lib/memory-manager.ts` | Current compression implementation |
| `lib/context-tracker.ts` | Token tracking with model limits |
| `lib/ai/embedding.ts` | Embedding generation |
| `lib/db/queries.ts` | Hybrid search RPC |
| `lib/agent-sdk/` | Agent tool definitions |
| `docs/context-memory-vision.md` | Bobo's memory architecture vision |

### Related Backlog Items

| ID | Title | Status |
|----|-------|--------|
| M3-31 | Description-driven extraction guidance | 📝 Planned |
| M3.5-1 | `remember_fact` agent tool | 📝 Planned |
| M3.5-2 | `update_memory` agent tool | 📝 Planned |
| M3.5-3 | `forget_memory` agent tool | 📝 Planned |
| M3.5-4 | Async extraction pipeline | 📝 Planned |

---

## Appendix A: Letta SDK File Structure

```
ai-memory-sdk/
├── src/
│   ├── python/
│   │   ├── ai_memory_sdk.py      # Core Memory class
│   │   ├── schemas.py            # Pydantic data models
│   │   ├── prompt_formatter.py   # Memory injection utilities
│   │   └── tests/
│   │
│   └── typescript/
│       ├── src/
│       │   ├── memory.ts         # Core Memory class
│       │   ├── schemas.ts        # TypeScript types
│       │   └── prompt-formatter.ts
│       └── tests/
│
├── examples/
│   ├── python/
│   │   ├── chat.py               # Basic integration
│   │   ├── customer_support.py   # Multi-block pattern
│   │   └── chat_with_compaction.py
│   │
│   └── typescript/
│       └── chat.ts
│
└── docs/
    └── tutorial.md
```

---

## Appendix B: Memory Block Configuration Examples

### Customer Support Pattern (from Letta examples)

```python
memory.initialize_memory(
    label="customer_profile",
    description="Basic customer information including name, account type, and contact preferences. Update when customer provides new details.",
    value="Premium subscriber since 2023",
    char_limit=5000
)

memory.initialize_memory(
    label="support_history",
    description="Running summary of past support interactions. Update after resolving issues. Include resolution status and customer satisfaction.",
    value="",
    char_limit=8000
)

memory.initialize_memory(
    label="policies",
    description="Company policies for reference (read-only). Agent should cite specific policies when relevant.",
    value=POLICY_TEXT,
    char_limit=10000
)
```

### Bobo Equivalent (Proposed)

```typescript
// memory_entries with extraction_guidance
const categories = [
  {
    category: 'work_context',
    extraction_guidance: 'Current role, company, expertise areas, active projects. Update when user mentions job changes.',
    char_limit: 5000,
  },
  {
    category: 'personal_context',
    extraction_guidance: 'Location, family, hobbies, identity. Be conservative - only store clearly stated facts.',
    char_limit: 5000,
  },
  // ... etc
];
```

---

**Document Version:** 1.0
**Created:** November 27, 2025
**Author:** Claude Code (Opus 4)
**Review Status:** Ready for sprint planning
