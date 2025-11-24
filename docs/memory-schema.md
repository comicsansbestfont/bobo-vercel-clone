# Memory Schema & Categories

**Version:** 2.0 (Claude-Inspired Hierarchical Memory)
**Last Updated:** November 24, 2025
**Status:** M3 Enhanced Architecture

This document defines the schema and categorization for Bobo's User Memory system. Bobo combines manual profile control (like Gemini) with automatic hierarchical memory (like Claude) to create a comprehensive understanding of the user across all conversations.

---

## Architecture Overview

### Three-Layer Memory System

```
┌──────────────────────────────────────────────────┐
│  Layer 1: Authoritative Profile (Manual)         │
│  - User-controlled "About You" fields            │
│  - Always takes precedence                       │
│  - Implemented: M3-01 ✅                          │
└──────────────────────────────────────────────────┘
              ↓
┌──────────────────────────────────────────────────┐
│  Layer 2: Global Memory (Automatic)              │
│  - Hierarchical organization (Claude-style)      │
│  - Extracted from all conversations              │
│  - Temporal awareness (recent vs historical)     │
│  - To Build: M3-02, M3-03 📝                     │
└──────────────────────────────────────────────────┘
              ↓
┌──────────────────────────────────────────────────┐
│  Layer 3: Project Memory (Contextual)            │
│  - Loop A: Project files & custom instructions   │
│  - Loop B: Cross-project patterns                │
│  - Implemented: M2 ✅                             │
└──────────────────────────────────────────────────┘
```

**Key Principle:** Manual > Automatic > Inferred

---

## 1. Database Schema

### 1.1 `user_profiles` Table (Layer 1 - Manual) ✅ DONE

**Purpose:** Authoritative "About You" profile, manually edited by the user.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary Key |
| `user_id` | UUID | Foreign Key -> `users(id)` |
| `bio` | TEXT | Short summary (e.g., "Fractional GTM advisor") |
| `background` | TEXT | Professional background and expertise |
| `preferences` | TEXT | Work style, communication preferences |
| `technical_context` | TEXT | Languages, frameworks, tools user knows |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

**Migration:** `20251124000000_m3_phase1_user_profiles.sql` ✅

**Token Budget:** ~200 tokens (always injected if populated)

---

### 1.2 `memory_entries` Table (Layer 2 - Automatic) 📝 TO BUILD

**Purpose:** Hierarchical memory storage with Claude-style organization.

```sql
CREATE TABLE memory_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Hierarchical Categories (Claude-style)
  category TEXT NOT NULL
    CHECK (category IN (
      'work_context',           -- Current work, career, expertise
      'personal_context',        -- Location, family, background
      'top_of_mind',            -- Current focus, immediate priorities
      'brief_history',          -- Past experiences, timeline
      'long_term_background',   -- Career history, foundational context
      'other_instructions'      -- Misc preferences
    )),

  -- Subcategory for brief_history temporal breakdown
  subcategory TEXT
    CHECK (subcategory IS NULL OR subcategory IN (
      'recent_months',   -- Last 3-6 months
      'earlier',         -- 6 months to 2 years ago
      'long_term'        -- 2+ years ago
    )),

  -- Content
  content TEXT NOT NULL,        -- Full description
  summary TEXT,                 -- Condensed version (token efficiency)

  -- Metadata
  confidence FLOAT DEFAULT 0.8
    CHECK (confidence >= 0.0 AND confidence <= 1.0),

  source_type TEXT DEFAULT 'extracted'
    CHECK (source_type IN ('extracted', 'inferred', 'user_confirmed')),

  -- Provenance (what contributed to this memory)
  source_chat_ids UUID[],       -- Which chats mentioned this
  source_project_ids UUID[],    -- Which projects this relates to
  source_message_count INT DEFAULT 1,  -- How many times mentioned

  -- Temporal Awareness
  time_period TEXT DEFAULT 'current'
    CHECK (time_period IN ('current', 'recent', 'earlier', 'historical')),

  relevance_score FLOAT DEFAULT 1.0,  -- Decays over time

  -- Timestamps
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_mentioned TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Prevent duplicate facts
  CONSTRAINT unique_memory_per_user
    UNIQUE (user_id, category, content_hash)
);

-- Indexes for fast retrieval
CREATE INDEX idx_memory_user_category
  ON memory_entries(user_id, category);

CREATE INDEX idx_memory_relevance
  ON memory_entries(user_id, relevance_score DESC, last_mentioned DESC);

CREATE INDEX idx_memory_temporal
  ON memory_entries(user_id, time_period, category);

-- Function to compute content hash
CREATE OR REPLACE FUNCTION compute_content_hash()
RETURNS TRIGGER AS $$
BEGIN
  NEW.content_hash = md5(lower(trim(NEW.content)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER memory_content_hash_trigger
  BEFORE INSERT OR UPDATE ON memory_entries
  FOR EACH ROW
  EXECUTE FUNCTION compute_content_hash();

-- Add content_hash column
ALTER TABLE memory_entries
  ADD COLUMN content_hash TEXT;
```

**Token Budget:** ~300 tokens total (selected memories only)

---

### 1.3 `memory_consolidation_log` Table (Audit Trail)

**Purpose:** Track weekly memory regenerations (like Claude's nightly updates).

```sql
CREATE TABLE memory_consolidation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  consolidation_type TEXT NOT NULL
    CHECK (consolidation_type IN ('weekly', 'manual', 'triggered')),

  -- Statistics
  memories_before INT,
  memories_after INT,
  memories_merged INT,
  memories_archived INT,

  -- Summary of changes
  changes_summary JSONB,

  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 2. Memory Categories (Hierarchical)

### 2.1 `work_context` (Current Work State)

**Purpose:** What the user does for work RIGHT NOW.

**Examples:**
- "Fractional CRO and GTM advisor helping Australian B2B SaaS founders"
- "Recently exited CorePlan (mining software company)"
- "Building advisory practice at sachee.com.au"
- "Specializes in founder-led sales, pre-revenue to $1M ARR"
- "18 years experience across mining, construction, industrial verticals"
- "Closed 300+ B2B deals, conducted 1,000+ recruitment interviews"

**Injection Priority:** HIGH (always included)
**Typical Size:** 100-150 tokens

---

### 2.2 `personal_context` (Personal Background)

**Purpose:** Who the user is as a person, personal circumstances.

**Examples:**
- "Bilingual in English and Sinhala"
- "Splits time between Australia and Sri Lanka"
- "Supports father's lighting business (JDN Online)"
- "Full-stack developer with AI tools experience"
- "Currently has runway until mid-2026"
- "Evaluating locations: Sydney, Bali, Sri Lanka"

**Injection Priority:** MEDIUM (include if relevant)
**Typical Size:** 50-100 tokens

---

### 2.3 `top_of_mind` (Current Focus)

**Purpose:** What the user is actively working on or thinking about THIS WEEK.

**Examples:**
- "Building GTM advisory using personal brand (not 'Lovable Labs')"
- "Researching West Tech Fest attendees for business development"
- "Creating LinkedIn-first content strategy"
- "Working with Swift Check-in on founder-led sales"
- "Developing order management system for JDN Online"

**Injection Priority:** VERY HIGH (most relevant for current conversation)
**Update Frequency:** Daily/Weekly
**Typical Size:** 75-100 tokens

**Decay Rate:** FAST (relevance drops after 2 weeks)

---

### 2.4 `brief_history` (Timeline Context)

**Purpose:** Past experiences organized temporally.

**Subcategories:**

#### 2.4.1 `recent_months` (Last 3-6 months)
- "Built advisory practice infrastructure (website, frameworks)"
- "Extensive work on Swift Check-in engagement"
- "Applied SPICED methodology to client work"
- "Heavy JDN Online technical development"
- "Researched Perth/Western Australia startup ecosystem"

#### 2.4.2 `earlier` (6 months to 2 years)
- "CorePlan exit with contractual restrictions"
- "Transitioned from quasi-founder role"
- "Built commercial engine from zero at CorePlan"
- "Defined product strategy and acquired first customers"

#### 2.4.3 `long_term` (2+ years ago)
- "Uber Eats launch in Perth (hospitality tech)"
- "Sidekicker (gig economy platform)"
- "Various B2B sales roles across industries"

**Injection Priority:** LOW (only if conversation is about past)
**Typical Size:** 50-75 tokens per subcategory

---

### 2.5 `long_term_background` (Foundational Context)

**Purpose:** Career foundation, core expertise that doesn't change.

**Examples:**
- "Career spans hospitality, marketplaces, SaaS, mining sectors"
- "Technical background: full-stack development"
- "Business experience: sales, marketing, operations, finance"
- "Diverse foundation across organizational scales"

**Injection Priority:** LOW (background context only)
**Typical Size:** 50 tokens

---

### 2.6 `other_instructions` (Miscellaneous Preferences)

**Purpose:** Preferences that don't fit other categories.

**Examples:**
- "Moving away from 'Lovable Labs' concept"
- "Focusing on personal brand for advisory"
- "Developing methodology organically through practice"
- "Used approaches intuitively at CorePlan, now formalizing"

**Injection Priority:** MEDIUM
**Typical Size:** 25-50 tokens

---

## 3. Injection Strategy

### 3.1 System Prompt Structure (Enhanced)

```
[Base System Prompt]

### ABOUT THE USER (Authoritative - Manual Profile)

BIO:
{user_profiles.bio}

BACKGROUND:
{user_profiles.background}

PREFERENCES:
{user_profiles.preferences}

TECHNICAL CONTEXT:
{user_profiles.technical_context}

---

### RELEVANT MEMORY (Automatically Learned)

**Work Context:**
{memory_entries WHERE category='work_context'
 ORDER BY relevance_score DESC LIMIT 3}

**Personal Context:**
{memory_entries WHERE category='personal_context'
 ORDER BY relevance_score DESC LIMIT 2}

**Top of Mind:**
{memory_entries WHERE category='top_of_mind'
 ORDER BY last_mentioned DESC LIMIT 2}

**Other Instructions:**
{memory_entries WHERE category='other_instructions'
 AND relevance_score > 0.7 LIMIT 1}

[Brief History and Long-term Background only included if conversation references past]

---

[Project Context - Loop A: Custom instructions + files]

---

[Global Inspiration - Loop B: Cross-project patterns]
```

### 3.2 Token Budget Allocation

| Section | Max Tokens | Priority |
|---------|-----------|----------|
| Manual Profile | 200 | CRITICAL |
| Work Context | 100 | HIGH |
| Personal Context | 50 | MEDIUM |
| Top of Mind | 100 | VERY HIGH |
| Brief History | 50 | LOW |
| Other Instructions | 25 | MEDIUM |
| **Total User Memory** | **~525** | **10% of 5K context** |

---

### 3.3 Conflict Resolution Rules

**Priority Order (Highest to Lowest):**
1. **Manual Profile** (user_profiles) - ALWAYS wins
2. **User-Confirmed Memories** (source_type='user_confirmed')
3. **High-Confidence Extracted** (confidence > 0.8, mentioned 3+ times)
4. **Recent Top of Mind** (last_mentioned < 7 days)
5. **Low-Confidence/Old** (archived after 90 days)

**Example Conflict:**
```
Manual Profile: "I prefer Python for backend work"
Extracted Memory: "User uses Node.js for APIs" (3 mentions)

Resolution: Manual profile wins → Inject "Prefer Python"
Action: Flag memory for user review → "You said you prefer Python,
        but I noticed you use Node.js. Update your profile?"
```

---

## 4. Extraction Pipeline

### 4.1 Trigger Points

**When to Extract:**
1. After every assistant response (lightweight check)
2. After chat reaches 5+ message pairs
3. When user explicitly says "remember this"
4. Weekly consolidation job

**When NOT to Extract:**
- Simple greetings/small talk
- Purely factual Q&A (no personal info shared)
- Error messages or debugging

---

### 4.2 Extraction Prompt (GPT-4o-mini)

```
You are a memory extraction assistant. Analyze this conversation and extract
facts about the user that would help personalize future conversations.

CONVERSATION:
{last_10_messages}

EXISTING MEMORIES (avoid duplicates):
{existing_memories_summary}

EXTRACT:
1. Work context (current role, expertise, projects)
2. Personal context (location, family, hobbies, background)
3. Top of mind (immediate focus, current priorities)
4. Brief history (past experiences, timeline)
5. Other preferences (communication style, methodologies)

RULES:
- Only extract facts explicitly stated or strongly implied
- Assign confidence: 0.9-1.0 (stated), 0.7-0.8 (implied), 0.5-0.6 (inferred)
- Categorize into: work_context, personal_context, top_of_mind, brief_history,
  long_term_background, other_instructions
- For brief_history, add subcategory: recent_months, earlier, long_term
- Assign time_period: current, recent, earlier, historical
- Note source_chat_id and message IDs

OUTPUT JSON:
{
  "facts": [
    {
      "content": "User is a fractional GTM advisor helping B2B SaaS founders",
      "category": "work_context",
      "subcategory": null,
      "confidence": 0.95,
      "time_period": "current",
      "reasoning": "User stated this directly in message #3"
    },
    {
      "content": "Recently exited CorePlan (mining software company)",
      "category": "brief_history",
      "subcategory": "recent_months",
      "confidence": 0.9,
      "time_period": "recent",
      "reasoning": "User mentioned exit happened 'recently'"
    }
  ],
  "should_extract": true,  // false if no personal info shared
  "extraction_quality": "high"  // high, medium, low
}
```

---

### 4.3 Deduplication Logic

```python
def should_merge_memory(new_fact, existing_memory):
    """
    Determine if new fact should merge with existing or create new entry
    """
    # Exact duplicate (high content similarity)
    if content_similarity(new_fact, existing_memory) > 0.95:
        return "increment_confidence"  # Increase confidence, update last_mentioned

    # Similar but different details (contradictory or additive)
    elif content_similarity(new_fact, existing_memory) > 0.7:
        if are_contradictory(new_fact, existing_memory):
            return "flag_for_user_review"
        else:
            return "merge_and_enrich"  # Combine both facts

    # Different fact
    else:
        return "create_new"
```

---

### 4.4 Relevance Decay Algorithm

```python
def calculate_relevance_score(memory_entry):
    """
    Decay relevance over time (like cache invalidation)
    """
    base_confidence = memory_entry.confidence
    days_since_mentioned = (now() - memory_entry.last_mentioned).days

    # Different decay rates by category
    decay_rates = {
        'top_of_mind': 0.05,        # Fast decay (50% after 10 days)
        'work_context': 0.01,       # Slow decay (50% after 50 days)
        'personal_context': 0.005,  # Very slow (50% after 100 days)
        'brief_history': 0.002,     # Minimal decay (archival)
    }

    decay = decay_rates.get(memory_entry.category, 0.01)
    relevance = base_confidence * (0.5 ** (days_since_mentioned * decay))

    return max(relevance, 0.1)  # Never fully zero out
```

---

## 5. Memory Consolidation (Weekly Job)

**Purpose:** Keep memory database clean and efficient (like Claude's nightly regeneration).

**Process:**
```
1. Aggregate similar memories
   - Merge duplicates (95%+ similarity)
   - Enrich with new details

2. Archive old, low-relevance memories
   - relevance_score < 0.3 AND last_mentioned > 90 days
   - Don't delete, just exclude from injection

3. Update relevance scores
   - Apply decay algorithm to all entries

4. Summarize verbose entries
   - If content > 200 tokens, create summary field
   - Inject summary, keep full content for reference

5. Generate consolidated "memory brief"
   - Per-category summaries for UI display
   - Token-efficient versions for injection

6. Log consolidation stats
   - Memories before/after
   - Merges, archives, new additions
```

**Schedule:** Every Sunday at 3 AM UTC

---

## 6. Memory Provenance (Unique to Bobo)

**Purpose:** Show users WHERE each memory came from.

**UI Feature:**
```
Memory: "User prefers TypeScript over JavaScript"

Sources:
• Project: Bobo Development (5 conversations)
• Project: JDN Online (2 conversations)
• Main Chat (1 conversation)

First mentioned: Oct 15, 2025
Last mentioned: Nov 20, 2025
Confidence: 95% (mentioned 8 times)
```

**Database Fields:**
- `source_chat_ids`: Array of chat UUIDs
- `source_project_ids`: Array of project UUIDs
- `source_message_count`: How many times mentioned

---

## 7. Future Enhancements

### Phase 2 (M3-04): Advanced Features
- Memory suggestions: "Should I remember this?"
- Project-scoped memories: "Remember for Project X only"
- Memory debugging: "What context was injected?"
- Memory export: Download as JSON/Markdown

### Phase 3 (M4+): Intelligence Layer
- Contradiction detection: Flag conflicting memories
- Memory Q&A: "What do you know about my work?"
- Memory analytics: Trends, growth over time
- Shared team memories: For team workspaces

---

## 8. Privacy & Security

### Data Minimization
- Only extract facts explicitly shared
- Never extract sensitive: passwords, API keys, financial data
- User can delete any memory instantly

### Transparency
- All memories visible in `/memory` page
- Provenance tracking (where it came from)
- Confidence scores (how certain AI is)

### Control
- Default: OFF (explicit opt-in)
- Granular controls: Disable per-category
- Bulk delete: "Clear all memories"
- Export: Download all memories as JSON

---

## Changelog

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-11-24 | Initial schema (flat categories) | Claude Code |
| 2.0 | 2025-11-24 | Hierarchical Claude-style architecture, provenance, temporal awareness | Claude Code |

---

**Maintained By:** Product Team
**Next Review:** After M3-02 implementation
