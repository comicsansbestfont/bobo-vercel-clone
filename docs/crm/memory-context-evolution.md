# Memory & Context Evolution with CRM

> **Status**: Architecture Design Document
> **Created**: December 13, 2025
> **Related**: [schema-reference.md](./schema-reference.md), [README.md](./README.md)

This document outlines how the memory and context management systems should evolve to integrate with the new CRM capabilities.

---

## Table of Contents

1. [Current State Summary](#current-state-summary)
2. [CRM-to-Memory Evolution](#crm-to-memory-evolution)
3. [CRM-to-Context Evolution](#crm-to-context-evolution)
4. [CRM-Specific Claude Tools](#crm-specific-claude-tools)
5. [Unified Relationship Graph](#unified-relationship-graph)
6. [Triple-Loop RAG Architecture](#triple-loop-rag-architecture)
7. [Implementation Priorities](#implementation-priorities)
8. [Schema Additions](#schema-additions)

---

## Current State Summary

### CRM Database (41 migrations)

| Component | Tables | Key Features |
|-----------|--------|--------------|
| Core Entities | `companies`, `contacts`, `activities` | Unified lead/deal/client model |
| Content Tables | `activity_threads`, `activity_messages`, `activity_meetings`, `activity_notes` | Full content storage |
| Search | All tables have `search_vector` (tsvector) | Full-text search ready |
| Stage Tracking | `account_stage`, `sub_stage`, `stage_history` | Complete audit trail |

### Memory System

| Component | Details |
|-----------|---------|
| Storage | 120+ entries in `memory_entries` with 6 categories |
| Search | Hybrid (70% vector + 30% BM25) with 5-component temporal weighting |
| Tools | `search_memory`, `record_question`, `record_decision`, `record_insight` |
| Learning | Hebbian reinforcement via `access_count` and `last_accessed` |

### Context System

| Component | Details |
|-----------|---------|
| Architecture | Double-Loop RAG (Loop A: project files, Loop B: global search) |
| Advisory Files | Loaded via `advisory_folder_path` on projects |
| Token Management | Auto-compression at >90% context usage |

---

## CRM-to-Memory Evolution

### Current Gap

Memory and CRM are disconnected systems. Memories are extracted from chat conversations but have no awareness of CRM entities (companies, contacts, deals).

### Evolution Pathway A: Entity-Linked Memories

Add entity references to memory entries:

```sql
memory_entries
├── company_id (NEW) → links memory to specific company/deal
├── contact_id (NEW) → links memory to specific contact
└── context_entity_type: 'global' | 'company' | 'contact' | 'deal'
```

**Example Use Cases**:

| Memory Content | Linked Entity | Type |
|---------------|---------------|------|
| "MyTab founder mentioned they're open to a pricing conversation in Q1" | MyTab company | insight |
| "John prefers WhatsApp over email" | John contact | fact |
| "SwiftCheckin has strong unit economics but weak brand positioning" | SwiftCheckin company | observation |

**Benefits**:
- When chatting about MyTab, Claude retrieves MyTab-specific insights
- Memories become contextual rather than global
- Enables "Deal Memory" concept (what I've learned about each deal over time)

### Evolution Pathway B: Activity-Extracted Memories

Auto-extract insights from CRM activities into memory:

```
activity_meetings (transcript, key_points)
        ↓ [extraction pipeline]
memory_entries (source_type: 'activity', source_activity_id)
```

**Extraction Triggers**:

| Trigger | Action |
|---------|--------|
| New meeting with transcript | Extract decisions, insights, action items |
| New note with `note_type: 'observation'` | Convert to memory entry |
| Stage change | Record as decision with rationale |

### Evolution Pathway C: Cross-Deal Pattern Memories

When similar insights occur across multiple deals, consolidate into patterns:

```
Memory: "Founders with technical backgrounds tend to undervalue sales support"
├── source_companies: [MyTab, ArcheloLab, ControlShiftAI]
├── memory_type: 'insight'
└── tags: ['founder-pattern', 'sales-coaching']
```

This creates a **pattern library** from deal experience.

---

## CRM-to-Context Evolution

### Current State

Advisory projects load from `advisory/` folder via `advisory_folder_path`. The Double-Loop reads markdown files only.

### Evolution: CRM as First-Class Context Source

```typescript
// Current flow
buildChatContext() {
  projectFiles = getAdvisoryFilesByPath(project.advisory_folder_path)
  return systemPrompt + projectFiles
}

// Evolved flow
buildChatContext() {
  projectFiles = getAdvisoryFilesByPath(project.advisory_folder_path)

  if (project.entity_type === 'deal' || project.entity_type === 'client') {
    company = await getCRMCompanyByProject(project.id)
    contacts = await getCRMContacts(company.id)
    recentActivities = await getRecentActivities(company.id, limit: 10)
    stageHistory = await getStageHistory(company.id)
    entityMemories = await getEntityMemories(company.id)

    crmContext = buildCRMContext({company, contacts, recentActivities, stageHistory, entityMemories})
  }

  return systemPrompt + projectFiles + crmContext
}
```

### Structured CRM Context Block

```xml
<crm_context entity_type="deal" entity_name="MyTab">
  <company>
    <name>MyTab</name>
    <account_stage>deal</account_stage>
    <sub_stage>proposal_presented</sub_stage>
    <arr_estimate>$50K</arr_estimate>
    <current_gtm_stage>Phase 1b</current_gtm_stage>
    <fit_assessment>strong_fit</fit_assessment>
    <coachability>high</coachability>
  </company>

  <contacts count="2">
    <contact is_primary="true">
      <name>Hans Van de Ven</name>
      <role>Co-founder & CEO</role>
      <linkedin_url>...</linkedin_url>
    </contact>
    <contact>
      <name>Sarah Chen</name>
      <role>Co-founder & CTO</role>
    </contact>
  </contacts>

  <recent_activities limit="5">
    <activity type="meeting" date="2025-12-10">
      <title>Discovery Call #3</title>
      <summary>Discussed pricing model and timeline...</summary>
      <outcome>positive</outcome>
      <next_steps>Send proposal by Dec 15</next_steps>
    </activity>
  </recent_activities>

  <stage_history>
    <transition date="2025-11-15">lead → deal (initial_discussion)</transition>
    <transition date="2025-12-01">deal (initial_discussion) → deal (discovery)</transition>
    <transition date="2025-12-10">deal (discovery) → deal (proposal_presented)</transition>
  </stage_history>

  <entity_memories>
    <memory type="insight" confidence="0.9">
      Hans is highly coachable and responsive to direct feedback
    </memory>
    <memory type="decision" confidence="0.95">
      Decided to focus on B2B enterprise pricing model over consumer freemium
    </memory>
  </entity_memories>
</crm_context>
```

### Token Budget Allocation

| Allocation | Current | Evolved |
|------------|---------|---------|
| Advisory Files | 100% | 60% |
| CRM Context | 0% | 25% |
| Entity Memories | 0% | 15% |

**Smart Summarization Strategy**:
- **Full context**: Recent activities (< 7 days)
- **Summarized**: Older activities (key points only)
- **Omitted**: Archived/deleted items

---

## CRM-Specific Claude Tools

### Phase 1: Basic CRM Search

```typescript
// search_crm_activities - Search across all CRM activity content
{
  name: "search_crm_activities",
  description: "Search meetings, messages, notes across CRM activities",
  input_schema: {
    query: string,           // Natural language search
    company_id?: string,     // Filter to specific company
    activity_type?: 'meeting' | 'message' | 'note' | 'all',
    date_range?: { from: string, to: string },
    limit?: number           // Default 10
  }
}

// get_company_timeline - Unified timeline view
{
  name: "get_company_timeline",
  description: "Get chronological activity timeline for a company",
  input_schema: {
    company_id: string,
    limit?: number,
    activity_types?: string[]
  }
}
```

### Phase 2: Deep Content Access

```typescript
// read_meeting - Full meeting content with transcript
{
  name: "read_meeting",
  description: "Read full meeting details including transcript, key points, action items",
  input_schema: {
    meeting_id: string
  }
}

// read_thread - Full message thread content
{
  name: "read_thread",
  description: "Read complete message thread (LinkedIn, WhatsApp, email)",
  input_schema: {
    thread_id: string,
    include_messages: boolean  // Default true
  }
}

// search_company_context - Deep search within one company/deal
{
  name: "search_company_context",
  description: "Search all context for a specific company",
  input_schema: {
    company_id: string,
    query: string,
    include: ['meetings', 'messages', 'notes', 'files', 'memories']
  }
}
```

### Phase 3: Agentic Learning

```typescript
// record_activity_insight - Extract insight from activity
{
  name: "record_activity_insight",
  description: "Record an insight discovered from CRM activity into entity-linked memory",
  input_schema: {
    company_id: string,
    insight: string,
    source_activity_id?: string,
    confidence: number,
    tags?: string[]
  }
}

// suggest_next_action - AI-suggested follow-up
{
  name: "suggest_next_action",
  description: "Suggest and optionally create a follow-up action item",
  input_schema: {
    company_id: string,
    title: string,
    description: string,
    due_date?: string,
    priority?: 'high' | 'medium' | 'low',
    auto_create: boolean
  }
}
```

### Phase 4: Cross-Deal Intelligence

```typescript
// find_similar_deals - Pattern matching across deals
{
  name: "find_similar_deals",
  description: "Find deals with similar characteristics or patterns",
  input_schema: {
    reference_company_id?: string,
    criteria?: {
      industry?: string,
      gtm_stage?: string,
      arr_range?: { min: number, max: number },
      fit_assessment?: string
    },
    query?: string  // Natural language similarity
  }
}

// get_deal_patterns - Cross-deal insights
{
  name: "get_deal_patterns",
  description: "Retrieve patterns and insights learned across multiple deals",
  input_schema: {
    pattern_type?: 'pricing' | 'objection_handling' | 'founder_behavior' | 'all',
    tags?: string[]
  }
}
```

### Tool Implementation Location

**All tools go in**: `lib/ai/claude-advisory-tools.ts`

```typescript
// Add to advisoryTools array
export const advisoryTools: Anthropic.Tool[] = [
  // ... existing advisory tools

  // CRM Phase 1
  { name: 'search_crm_activities', ... },
  { name: 'get_company_timeline', ... },

  // CRM Phase 2
  { name: 'read_meeting', ... },
  { name: 'read_thread', ... },

  // etc.
];

// Add to executeAdvisoryTool switch
export async function executeAdvisoryTool(name: string, input: unknown) {
  switch (name) {
    // ... existing cases

    case 'search_crm_activities':
      return await searchCRMActivities(input);
    case 'get_company_timeline':
      return await getCompanyTimeline(input);
    // etc.
  }
}
```

---

## Unified Relationship Graph

### Current Architecture (Isolated Silos)

```
Projects ← → Chats ← → Messages ← → Memory
    ↓
Advisory Files (via advisory_folder_path)

CRM Tables (completely separate)
```

### Evolved Architecture (Unified Entity Graph)

```
                    ┌─────────────────────────────────────┐
                    │           USER                       │
                    └─────────────────────────────────────┘
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         │                          │                          │
         ▼                          ▼                          ▼
    ┌─────────┐              ┌─────────────┐             ┌──────────┐
    │ Projects│──────────────│   Memory    │─────────────│   CRM    │
    └─────────┘              │   System    │             │  System  │
         │                   └─────────────┘             └──────────┘
         │                          │                          │
         │    ┌─────────────────────┼─────────────────────┐    │
         │    │                     │                     │    │
         ▼    ▼                     ▼                     ▼    ▼
    ┌─────────────────────────────────────────────────────────────┐
    │                    UNIFIED CONTEXT LAYER                     │
    │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │
    │  │ Advisory │  │  Entity  │  │ Activity │  │   Memory     │ │
    │  │  Files   │  │ Profile  │  │ Timeline │  │   Context    │ │
    │  └──────────┘  └──────────┘  └──────────┘  └──────────────┘ │
    └─────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                    ┌─────────────────────────────────────┐
                    │           CHAT / AI LAYER           │
                    │   (Context Builder + Tool Use)      │
                    └─────────────────────────────────────┘
```

### Key Relationships

| Link | Purpose |
|------|---------|
| `projects.company_id → companies.id` | Links deal projects to CRM companies |
| `memory_entries.company_id → companies.id` | Entity-scoped memories |
| `memory_entries.contact_id → contacts.id` | Contact-specific memories |
| `memory_entries.source_activity_id → activities.id` | Activity-extracted memories |

---

## Triple-Loop RAG Architecture

### Evolution from Double-Loop

| Loop | Scope | Source | Trigger |
|------|-------|--------|---------|
| **Loop A** | Project Context | Advisory files + CRM profile | Always (active project) |
| **Loop B** | Global Search | Cross-project files + messages | User query similarity |
| **Loop C** (NEW) | Entity Search | Entity memories + similar deals | Entity-specific context |

### Implementation

```typescript
// lib/ai/chat/search-coordinator.ts (evolved)

async function runTripleLoopSearch(
  query: string,
  projectId: string,
  companyId?: string
) {
  return Promise.all([
    // Loop A: Project files (existing)
    getProjectContext(projectId),

    // Loop B: Global cross-project (existing)
    hybridSearch(query, { excludeProject: projectId }),

    // Loop C: Entity-specific (NEW)
    companyId ? getEntityContext(companyId, query) : null
  ]);
}

async function getEntityContext(companyId: string, query: string) {
  const [entityMemories, similarDeals, recentInsights] = await Promise.all([
    searchEntityMemories(companyId, query),       // Memories linked to this company
    findSimilarDeals(companyId),                  // Pattern matching
    getRecentEntityInsights(companyId, limit: 5) // Last 5 insights
  ]);

  return { entityMemories, similarDeals, recentInsights };
}
```

---

## Implementation Priorities

### Phase 1: Foundation (Schema + Linking)

**Priority**: CRITICAL

```sql
-- 1. Link projects to CRM companies
ALTER TABLE projects ADD COLUMN company_id UUID REFERENCES companies(id);
CREATE INDEX idx_projects_company ON projects(company_id) WHERE company_id IS NOT NULL;

-- 2. Link memories to CRM entities
ALTER TABLE memory_entries
  ADD COLUMN company_id UUID REFERENCES companies(id),
  ADD COLUMN contact_id UUID REFERENCES contacts(id),
  ADD COLUMN source_activity_id UUID REFERENCES activities(id);

CREATE INDEX idx_memory_company ON memory_entries(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX idx_memory_contact ON memory_entries(contact_id) WHERE contact_id IS NOT NULL;
```

### Phase 2: Context Enhancement

**Priority**: HIGH

1. Update `lib/ai/chat/context-builder.ts` to load CRM context
2. Implement `buildCRMContext()` function
3. Add token budget allocation for CRM context (25%)
4. Create structured CRM context XML block

### Phase 3: Basic CRM Tools

**Priority**: HIGH

1. Implement `search_crm_activities` tool
2. Implement `get_company_timeline` tool
3. Add to `claude-advisory-tools.ts`
4. Test with existing deal projects

### Phase 4: Deep Content Tools

**Priority**: MEDIUM

1. Implement `read_meeting` tool
2. Implement `read_thread` tool
3. Implement `search_company_context` tool

### Phase 5: Agentic Learning

**Priority**: MEDIUM

1. Implement `record_activity_insight` tool
2. Create activity-to-memory extraction pipeline
3. Add extraction triggers for meetings and notes

### Phase 6: Cross-Deal Intelligence

**Priority**: LOW (Future)

1. Implement `find_similar_deals` tool
2. Implement `get_deal_patterns` tool
3. Create pattern consolidation logic

---

## Schema Additions

### Migration: Link Projects to Companies

```sql
-- Migration: add_project_company_link

ALTER TABLE projects
  ADD COLUMN company_id UUID REFERENCES companies(id);

CREATE INDEX idx_projects_company
  ON projects(company_id)
  WHERE company_id IS NOT NULL;

COMMENT ON COLUMN projects.company_id IS
  'Links project to CRM company for deal/client projects. NULL for personal projects.';
```

### Migration: Link Memories to Entities

```sql
-- Migration: add_memory_entity_links

ALTER TABLE memory_entries
  ADD COLUMN company_id UUID REFERENCES companies(id),
  ADD COLUMN contact_id UUID REFERENCES contacts(id),
  ADD COLUMN source_activity_id UUID REFERENCES activities(id);

CREATE INDEX idx_memory_company
  ON memory_entries(company_id)
  WHERE company_id IS NOT NULL AND is_active = true;

CREATE INDEX idx_memory_contact
  ON memory_entries(contact_id)
  WHERE contact_id IS NOT NULL AND is_active = true;

CREATE INDEX idx_memory_activity
  ON memory_entries(source_activity_id)
  WHERE source_activity_id IS NOT NULL;

COMMENT ON COLUMN memory_entries.company_id IS
  'Links memory to specific company/deal. NULL = global memory.';

COMMENT ON COLUMN memory_entries.contact_id IS
  'Links memory to specific contact. NULL = not contact-specific.';

COMMENT ON COLUMN memory_entries.source_activity_id IS
  'Activity from which this memory was extracted. NULL = extracted from chat.';
```

### RPC Function: Entity Memory Search

```sql
-- Migration: add_entity_memory_search_rpc

CREATE OR REPLACE FUNCTION search_entity_memories(
  p_user_id UUID,
  p_company_id UUID,
  p_query TEXT,
  p_query_embedding vector(1536),
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  category TEXT,
  content TEXT,
  confidence FLOAT,
  memory_type TEXT,
  last_updated TIMESTAMPTZ,
  combined_score FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH vector_scores AS (
    SELECT
      m.id,
      1 - (m.embedding <=> p_query_embedding) AS vector_sim
    FROM memory_entries m
    WHERE m.user_id = p_user_id
      AND m.company_id = p_company_id
      AND m.is_active = true
      AND m.embedding IS NOT NULL
  ),
  text_scores AS (
    SELECT
      m.id,
      ts_rank(to_tsvector('english', m.content), plainto_tsquery('english', p_query)) AS text_rank
    FROM memory_entries m
    WHERE m.user_id = p_user_id
      AND m.company_id = p_company_id
      AND m.is_active = true
  )
  SELECT
    m.id,
    m.category,
    m.content,
    m.confidence,
    m.memory_type,
    m.last_updated,
    (COALESCE(v.vector_sim, 0) * 0.7 + COALESCE(t.text_rank, 0) * 0.3) AS combined_score
  FROM memory_entries m
  LEFT JOIN vector_scores v ON m.id = v.id
  LEFT JOIN text_scores t ON m.id = t.id
  WHERE m.user_id = p_user_id
    AND m.company_id = p_company_id
    AND m.is_active = true
  ORDER BY combined_score DESC
  LIMIT p_limit;
END;
$$;
```

---

## Key Takeaways

1. **Memory becomes entity-aware**: Memories linked to companies/contacts enable contextual recall per deal

2. **Context adds CRM layer**: Structured CRM data (profile, contacts, activities) injected alongside advisory files

3. **Triple-Loop RAG**: New Loop C for entity-specific search across memories and similar deals

4. **New Claude tools**: 8+ CRM-specific tools for search, read, and agentic learning

5. **Activity-to-Memory pipeline**: Auto-extract insights from meetings/messages into entity-linked memories

6. **Cross-deal intelligence**: Pattern detection across deals creates a learning system

---

## Related Documentation

- [CRM Schema Reference](./schema-reference.md) - Complete column-level documentation
- [CRM README](./README.md) - Architecture overview and naming conventions
- [Migration SOP](./migration-sop.md) - Data migration procedures
- [Terminology Guide](./terminology-guide.md) - Unified entity model terms
