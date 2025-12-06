# Knowledge Migration Strategy: File-Based Advisory System to Bobo

**Version:** 1.0
**Created:** 2025-12-06
**Authors:** Sachee Perera & Claude
**Purpose:** Comprehensive strategy document for PM review - migrating advisory knowledge system to Bobo

---

## Executive Summary

This document captures the complete strategic discussion and technical analysis for integrating Sachee's file-based GTM advisory workflow with the Bobo chat application. The goal is to enable Bobo to serve as an "Advisory Command Center" - a conversational interface that can answer questions about deals, clients, and advisory work while preserving the existing workflow that has been carefully developed over time.

The recommended approach is a **Hybrid "Read Layer + Memory"** architecture that maintains the current file system as the source of truth while enabling Bobo to read and remember context from those files. This approach was chosen specifically because, as Sachee stated:

> "I don't want to break my current workflow so option B kind of sounds like it's the way to go in the short term."

This document is intended to provide the PM with complete context on: (1) how the current system works, (2) what Bobo's current capabilities are, (3) what the vision looks like, and (4) a phased implementation roadmap.

---

## Part 1: Understanding the Current System

### 1.1 What Problem Does the Current System Solve?

Sachee runs a B2B SaaS GTM advisory practice. This involves:
- Managing multiple **deals** (potential client engagements) through a defined sales pipeline
- Maintaining ongoing relationships with **clients** (active engagements)
- Creating **content** (LinkedIn posts, blog articles, frameworks) to attract and educate clients

Each of these requires tracking significant amounts of context: meeting notes, research, communications, valuations, deliverables, and strategic observations. The current system solves this through a structured file-based approach.

### 1.2 Repository Architecture (Two Separate Repos)

A critical architectural detail: there are **two separate Git repositories** involved in this system:

**Repository 1: Blog Migration (Advisory File System)**
```
Location: /Users/sacheeperera/VibeCoding Projects/Blog Migration/
Purpose:  Source of truth for all advisory knowledge
Contains: Deals/, Clients/, Content-Workspace/, SOPs, templates
Git:      Own repository, pushed to GitHub
Used by:  Claude Code (local), Claude Code Mobile, Claude Web + GitHub integration
```

**Repository 2: Bobo (Chat Application)**
```
Location: /Users/sacheeperera/VibeCoding Projects/bobo-vercel-clone/
Purpose:  Chat application with memory and context
Contains: Next.js app, API routes, Supabase integration, product docs
Git:      Own repository, pushed to GitHub
Used by:  Web browser, mobile browser
```

These repositories are **completely separate** - they don't share files or Git history. This separation is intentional:
- **Blog Migration** is the working file system for advisory practice
- **Bobo** is the application codebase for the chat tool

The sync script will need to **bridge these two repositories** - reading from Blog Migration and writing to Bobo's API. This has implications for where the script lives and how it's invoked, which we address in Part 7.

### 1.3 File System Architecture

The advisory workflow is organized as a directory structure that mirrors the business entities:

```
/Blog Migration/
├── Deals/                          # Sales pipeline (pre-engagement)
│   ├── _TEMPLATE/                  # Standard templates
│   │   ├── master-doc-template.md  # Deal tracking document
│   │   └── DEAL_SOP.md            # Standard operating procedures
│   ├── MyTab/                      # Example deal
│   │   ├── master-doc.md          # Main tracking document
│   │   ├── Docs/                  # Research, analysis
│   │   ├── Meetings/              # Meeting notes
│   │   └── _Inbox/                # Unprocessed materials
│   ├── ControlShiftAI/
│   └── [other deals...]
│
├── Clients/                        # Active engagements (post-engagement)
│   ├── _TEMPLATE/
│   │   ├── client-profile-template.md
│   │   └── CLIENT_SOP.md
│   └── SwiftCheckin/              # Example client
│       ├── client-profile.md
│       ├── Engagements/           # Engagement-specific work
│       └── Meetings/
│
└── Content-Workspace/             # Content production pipeline
    ├── 01-Ideas/                  # Raw ideas
    ├── 02-In-Development/         # Active content with BRIEF.md
    ├── 03-Ready-to-Publish/       # Scheduled queue
    └── 04-Published/              # Archive with PERFORMANCE.md
```

This structure is not arbitrary - it represents a carefully designed workflow where the folder structure itself encodes business logic:

1. **Deals folder** = Pre-engagement pipeline (potential work)
2. **Clients folder** = Active engagements (paying clients)
3. **Moving a deal to Clients** = Deal closed won (state transition)

### 1.3 The Master Document Pattern

Each deal has a `master-doc.md` that serves as the single source of truth. This document follows a specific structure:

**YAML Frontmatter (Machine-Readable Metadata):**
```yaml
---
company: "MyTab"
website: "mytab.com.au"
founder: "Mikaela Smith"
deal_stage: "Relationship Development"
engagement_type: "Advisory"
arr_estimate: "$150K"
valuation_range: "$1.5M - $2.5M"
founder_engine_score: "3.8/5.0"
last_updated: "2025-12-06"
---
```

**Markdown Body (Human-Readable Content):**
- Company Snapshot
- Deep Research (background, market, product, business model)
- GTM Assessment (current state, pain points, goals)
- Meeting Notes (chronological, most recent first)
- Communications Log
- Strategic Observations (hypotheses, red flags, opportunities)
- Engagement Tracker (stage history, deliverables, next steps)
- Valuation Snapshot

This dual structure is critical: the YAML frontmatter enables programmatic access to key fields, while the markdown body provides rich narrative context that's essential for advisory work.

### 1.4 Standard Operating Procedures (SOPs)

The system includes comprehensive SOPs that define exactly how to handle various scenarios:

**Deal SOPs (7 procedures):**
- SOP 1: New inbound lead handling
- SOP 2: Cal.com submission review
- SOP 3: Deep research and discovery
- SOP 4: Discovery call preparation and follow-up
- SOP 5: Relationship development activities
- SOP 6: Proposal and contract handling
- SOP 7: Inbox processing

**Client SOPs (8 procedures):**
- Engagement onboarding
- Weekly rhythm management
- Engagement wrap-up
- Health check process
- Expansion/extension handling
- Alumni relationship nurturing
- Valuation tracking

These SOPs are not just documentation - they're the operational backbone that ensures consistent, high-quality advisory delivery.

### 1.5 Current Workflow for AI Assistance

Currently, Sachee uses AI assistance in a somewhat fragmented way:

> "How I'm currently doing this is I am pushing all of the file system into Git and when I need to have a chat session to brainstorm or talk about particular information, I use either Claude Code mobile to access the Git repository or Claude web app and use the GitHub integration to add the relevant files and then have a chat -- so it's not really sophisticated. It's quite rudimentary but it currently works for now."

This workflow has several friction points:
1. **Cold start problem**: Each AI conversation starts fresh without context
2. **Manual file selection**: Must explicitly choose which files to include
3. **No persistent memory**: Insights from conversations are lost unless manually captured
4. **Platform fragmentation**: Different tools for different contexts (Claude Code local, mobile, web)

Despite these limitations, the workflow is functional and has been refined over time. Any new solution must improve on these pain points without disrupting what works.

---

## Part 2: Bobo's Current Architecture

### 2.1 What Is Bobo?

Bobo is a Next.js chat application that Sachee is building. Unlike generic chat interfaces, Bobo has been designed with two key differentiators:

1. **Persistent Memory**: Bobo remembers facts, preferences, and context across conversations
2. **Project-Based Context**: Conversations can be scoped to specific projects with their own context

The vision is for Bobo to evolve from a generic chatbot into a purpose-built "Advisory Brain" - an AI companion that understands Sachee's deals, clients, and advisory practice.

### 2.2 Double-Loop RAG Architecture

Bobo uses a sophisticated retrieval system called "Double-Loop RAG":

```
┌─────────────────────────────────────────────────────────────┐
│                    User Message                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  LOOP A: Project Context (If project selected)              │
│  ─────────────────────────────────────────────────────────  │
│  • Retrieves project-specific documents                     │
│  • Scoped to current project only                          │
│  • Fast, focused retrieval                                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  LOOP B: Global Memory Search                               │
│  ─────────────────────────────────────────────────────────  │
│  • Searches ALL memories across the system                  │
│  • Hybrid search: 70% vector + 30% BM25                    │
│  • Temporal weighting favors recent memories               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Combined Context → Claude API → Response                   │
└─────────────────────────────────────────────────────────────┘
```

**Why This Matters:** This architecture means Bobo can answer questions by combining:
- Specific project context (e.g., "the MyTab deal")
- Global knowledge (e.g., "patterns across all deals")

This is exactly what's needed for advisory work where questions often span both specific deals and cross-deal patterns.

### 2.3 Memory System (M3.5/M3.6)

Bobo's memory system stores facts in six categories:

| Category | Purpose | Example |
|----------|---------|---------|
| `work_context` | Active deals, clients, projects | "MyTab is a hospitality SaaS in Relationship Development stage" |
| `personal_context` | User preferences, style | "Sachee prefers direct communication" |
| `top_of_mind` | Urgent items, red flags | "MyTab: Valuation expectation mismatch is a concern" |
| `brief_history` | Recent events (7-30 days) | "Dec 2: Pitch practice session with Mikaela" |
| `long_term_background` | Stable knowledge | "SPICED framework: Situation, Pain, Impact, Critical Event, Decision" |
| `other_instructions` | Behavioral preferences | "Always include red flags when briefing on deals" |

Each memory entry includes:
- **Content**: The actual fact or information
- **Embedding**: Vector representation for semantic search
- **Metadata**: Category, source, confidence, access frequency, timestamps

### 2.4 Enhanced Memory Search (M3.6-02)

The latest enhancement (completed December 6, 2025) adds sophisticated temporal weighting to memory search:

```
Score = (0.45 × vector_similarity) +
        (0.15 × text_match) +
        (0.20 × recency_score) +
        (0.10 × access_frequency) +
        (0.10 × confidence)
```

This means:
- **Semantic similarity** (45%): Finds conceptually related memories even without exact keyword matches
- **Text matching** (15%): Rewards exact or partial keyword matches
- **Recency** (20%): Recent memories score higher (time-decayed)
- **Frequency** (10%): Often-accessed memories are likely more important
- **Confidence** (10%): Higher confidence memories rank higher

### 2.5 Agent Mode

Bobo includes an "Agent Mode" that provides Claude with access to tools:

**Current Agent Tools:**
- `Read` - Read file contents
- `Write` - Create/update files
- `Edit` - Make targeted edits
- `Bash` - Execute shell commands
- `Glob` - Find files by pattern
- `Grep` - Search file contents
- `WebSearch` - Search the web
- `WebFetch` - Fetch web pages
- `search_memory` - Search Bobo's memories
- `remember_fact` - Store new memories
- `update_memory` - Update existing memories
- `forget_memory` - Remove memories

**Important Limitation:** Agent Mode currently operates in a sandboxed environment. It cannot directly access Sachee's local file system where the Deals/Clients/Content-Workspace folders live.

### 2.6 Current Database Schema

Bobo uses Supabase (PostgreSQL + pgvector) with this structure:

```sql
-- Core tables
users              -- User accounts
projects           -- Project containers (e.g., "MyTab Deal")
documents          -- Project-scoped documents
chats              -- Conversation sessions
messages           -- Individual messages

-- Memory system
memory_entries (
  id, user_id, content, embedding,
  category, source, confidence,
  access_count, last_accessed,
  created_at, updated_at
)

-- Key RPC functions
hybrid_memory_search()     -- Vector + BM25 search
enhanced_memory_search()   -- With temporal weighting
find_memories_by_embedding()
```

### 2.7 What's Already Been Done

As of December 6, 2025:
- M3.6-02 (Enhanced Search + Bulk API) is complete
- `enhanced_memory_search` RPC with 5-component temporal weighting is deployed
- Bulk seeding API (`POST /api/memory/bulk`) is available
- **22 deal/client memories have been seeded** as an initial test

The seeded memories include summaries of active deals (MyTab, ControlShiftAI, Talvin, etc.) and the SwiftCheckin client relationship. This was a proof-of-concept to validate that the memory system can handle advisory context.

---

## Part 3: The Vision

### 3.1 Bobo as "Advisory Command Center"

The vision is to transform Bobo from a generic chat application into a purpose-built advisory assistant. In this vision, Bobo becomes:

> "Brain as a Service" - an AI companion that holds Sachee's GTM advisory context, enabling instant recall of deals, clients, patterns, and insights across the entire practice.

**Current State vs. Future State:**

```
CURRENT STATE                          FUTURE STATE
─────────────────                      ─────────────────

┌─────────────┐                        ┌─────────────────────────────────┐
│  Git Repo   │                        │           BOBO                  │
│  (Files)    │                        │   "Advisory Command Center"     │
└──────┬──────┘                        ├─────────────────────────────────┤
       │                               │ "Brief me on MyTab"             │
       │ Manual                        │ "What deals have red flags?"    │
       │ Selection                     │ "Prep me for Mikaela call"      │
       ▼                               │ "Which deals are stuck?"        │
┌─────────────┐                        └───────────────┬─────────────────┘
│ Claude Code │                                        │
│    Mobile   │                                        │ Automatic
├─────────────┤                                        │ Context
│ Claude Web  │                                        ▼
│  + GitHub   │                        ┌─────────────────────────────────┐
└─────────────┘                        │      File System (Git)          │
       │                               │  ┌─────────┬─────────┬────────┐ │
       │ Cold Start                    │  │  Deals  │ Clients │Content │ │
       │ Each Time                     │  │ (active)│ (active)│(active)│ │
       ▼                               │  └─────────┴─────────┴────────┘ │
┌─────────────┐                        │         ↑                       │
│  AI Chat    │                        │    One-Way Sync                 │
│ (No Memory) │                        │    (Read Only)                  │
└─────────────┘                        └─────────────────────────────────┘
```

The key insight is that Bobo provides **persistent context** that eliminates the cold-start problem, while the file system remains the source of truth for all advisory data.

### 3.2 What "Winning" Looks Like

As Sachee described it:

> "If I can chat with the context within Bobo and then retain that context based on actual files, that would be a win."

Concretely, this means:

1. **"Brief me on MyTab"** → Bobo returns accurate summary without file navigation
2. **"What deals have red flags?"** → Bobo identifies deals with concerns across the portfolio
3. **"Prep me for my call with Mikaela"** → Bobo provides deal context, recent activity, talking points
4. **"Which deals are stuck in Relationship Development?"** → Bobo analyzes deal stages across portfolio

These are queries that currently require manually opening files, scanning content, and synthesizing information. Bobo should handle them instantly through memory recall.

### 3.3 Why Not Full Migration?

Early in the discussion, we considered a full migration where all files would be moved into a database. This was rejected because:

1. **Workflow disruption**: The file-based system works and has been refined
2. **Claude Code integration**: Claude Code excels at file operations (the "hands")
3. **Flexibility**: Markdown files are portable, version-controlled, and human-readable
4. **Incremental validation**: Better to validate the read-layer before building write-layer

As Sachee stated:

> "This workflow is still kind of mature and it will evolve"

The hybrid approach allows the workflow to continue evolving without forcing a premature architectural commitment.

---

## Part 4: Stakeholder Requirements

### 4.1 Direct Requirements (From Sachee)

These requirements come directly from Sachee's statements during the discussion:

**REQ-1: Preserve Current Workflow**
> "I don't want to break my current workflow so option B kind of sounds like it's the way to go in the short term."

- File-based system remains source of truth
- SOPs continue to work as-is
- Claude Code continues to handle file operations
- No forced migration of existing content

**REQ-2: Gradual Adoption Through Dogfooding**
> "I'm happy to use my current workflow for doing the processing aspect of it like the meeting transcripts, creating the deals, and things like that until I dog food the Bobo workflow."

- Start with read-only capabilities
- Prove value before expanding scope
- Real usage reveals real requirements
- Don't over-engineer upfront

**REQ-3: Chat with File Context**
> "If I can chat with the context within Bobo and then retain that context based on actual files, that would be a win."

- Bobo should understand deal/client context
- Context should come from actual files (source of truth)
- Memory should persist across conversations
- No manual file selection required

**REQ-4: Acknowledge System Maturity**
> "This workflow is still kind of mature and it will evolve"

- Architecture should accommodate change
- Don't lock into rigid structures
- Sync mechanism should be adjustable
- Memory categories can evolve

### 4.2 Derived Requirements

Based on analysis of the current system and Bobo's architecture:

**REQ-5: Entity Recognition**
- Bobo should recognize deals, clients, and content as distinct entity types
- Queries like "my deals" vs "my clients" should return appropriate entities
- Cross-entity queries should work ("deals with this client")

**REQ-6: Temporal Awareness**
- Recent activity should surface naturally
- "What happened with MyTab last week?" should work
- Stage transitions should be tracked over time
- Activity frequency should influence relevance

**REQ-7: Red Flag Surfacing**
- Concerns, risks, and red flags should be prominently tracked
- "What should I be worried about?" should return actionable list
- Red flags should be linked to specific entities

**REQ-8: Stage-Based Filtering**
- Filter by deal stage (New Opportunity, Relationship Development, etc.)
- Filter by engagement type (Health Check, Diagnostic, Advisory, etc.)
- Understand the semantic meaning of stages

### 4.3 Non-Requirements (Explicitly Out of Scope for Now)

**NOT-REQ-1: Two-Way File Sync**
- Bobo will not write back to files in Phase 1
- File creation/modification stays with Claude Code
- Database-to-file sync is a later consideration

**NOT-REQ-2: Full CRM Replacement**
- Bobo is not replacing a CRM
- It's an intelligence layer, not a record system
- File system remains authoritative

**NOT-REQ-3: Real-Time Sync**
- Initial sync is manual/scheduled, not real-time
- File system changes require re-sync
- This is acceptable for current usage patterns

---

## Part 5: Recommended Architecture

### 5.1 Hybrid "Read Layer + Memory" Approach

The recommended architecture adds a sync layer between the file system and Bobo:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        FILE SYSTEM (Source of Truth)                     │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐       │
│  │      Deals/      │  │     Clients/     │  │ Content-Workspace│       │
│  │  ┌────────────┐  │  │  ┌────────────┐  │  │  ┌────────────┐  │       │
│  │  │master-doc  │  │  │  │client-     │  │  │  │01-Ideas    │  │       │
│  │  │   .md      │  │  │  │profile.md  │  │  │  │02-InDev    │  │       │
│  │  │(YAML+Body) │  │  │  │(YAML+Body) │  │  │  │03-Ready    │  │       │
│  │  └────────────┘  │  │  └────────────┘  │  │  └────────────┘  │       │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ One-Way Sync
                                    │ (Python Script)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           SYNC LAYER                                     │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  sync_advisory_knowledge.py                                     │     │
│  │  ─────────────────────────────────────────────────────────────  │     │
│  │  1. Parse YAML frontmatter (structured data)                    │     │
│  │  2. Extract key sections from markdown body                     │     │
│  │  3. Identify red flags, action items, recent activity          │     │
│  │  4. Transform into memory entries                               │     │
│  │  5. Call Bobo bulk API to seed memories                        │     │
│  └────────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ POST /api/memory/bulk
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              BOBO                                        │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                      Memory System                                │   │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐      │   │
│  │  │  work_context  │  │  top_of_mind   │  │ brief_history  │      │   │
│  │  │  (deal/client  │  │  (red flags,   │  │  (recent       │      │   │
│  │  │   summaries)   │  │   urgent)      │  │   activity)    │      │   │
│  │  └────────────────┘  └────────────────┘  └────────────────┘      │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                     Chat Interface                                │   │
│  │  "Brief me on MyTab" → Searches memories → Returns context        │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Why This Architecture?

This architecture directly addresses each requirement:

| Requirement | How Architecture Addresses It |
|-------------|------------------------------|
| REQ-1: Preserve workflow | Files remain source of truth, sync is additive |
| REQ-2: Gradual adoption | Start with manual sync, automate later |
| REQ-3: Chat with context | Memories seeded from files enable queries |
| REQ-4: System maturity | Sync script can evolve as workflow evolves |
| REQ-5: Entity recognition | Memory entries tagged by entity type |
| REQ-6: Temporal awareness | Timestamps and recency weighting |
| REQ-7: Red flag surfacing | Dedicated `top_of_mind` category |
| REQ-8: Stage filtering | Stage stored in memory metadata |

### 5.3 Memory Mapping Strategy

The sync script will transform file content into memories using this mapping:

**From YAML Frontmatter:**
```yaml
company: "MyTab"           → work_context: "MyTab is an active deal"
deal_stage: "Relationship  → work_context: "MyTab is in Relationship
             Development"                    Development stage"
valuation_range: "$1.5M-   → work_context: "MyTab valuation range:
                 $2.5M"                      $1.5M-$2.5M"
```

**From Markdown Sections:**
```markdown
### Red Flags              → top_of_mind: "MyTab: [extracted red flag]"
> Valuation expectations
  seem high for stage

### Recent Activity        → brief_history: "MyTab: [recent event]"
- Dec 2: Pitch practice
  with Mikaela

### Next Steps             → work_context: "MyTab next steps:
- [ ] Review pitch deck      [extracted items]"
- [ ] Intro to VC network
```

### 5.4 Data Flow Summary

1. **Files Updated** → Sachee works in Claude Code, updates master-docs
2. **Manual Sync Triggered** → Run `sync_advisory_knowledge.py`
3. **Files Parsed** → YAML frontmatter and key sections extracted
4. **Memories Generated** → Structured memory entries created
5. **Bulk API Called** → Memories upserted to Supabase via Bobo API
6. **Bobo Ready** → Chat queries now have fresh context

---

## Part 6: Implementation Roadmap

### 6.1 Phase Overview

The implementation follows a NOW / NEXT / LATER structure:

```
NOW (Week 1-2)              NEXT (Week 3-4)           LATER (Month 2+)
─────────────────           ──────────────────        ─────────────────
Sync Script MVP             Enhanced Queries          Bidirectional
  │                           │                         │
  ├─ Parse master-docs        ├─ Cross-entity          ├─ Bobo → Files
  ├─ Extract YAML             ├─ Pattern detection     ├─ Meeting capture
  ├─ Generate memories        ├─ Timeline queries      ├─ Auto-sync
  └─ Bulk seed                └─ Dashboard             └─ Notifications
```

### 6.2 NOW Phase: Sync Script MVP

**Goal:** Enable basic deal/client briefings through Bobo

**Deliverables:**
1. `sync_advisory_knowledge.py` - Python script that:
   - Scans `Deals/` and `Clients/` directories
   - Parses YAML frontmatter from master-docs
   - Extracts key markdown sections
   - Generates memory entries
   - Calls Bobo bulk API

2. Memory entries for each deal/client:
   - Summary (work_context)
   - Current stage (work_context)
   - Red flags if any (top_of_mind)
   - Recent activity (brief_history)
   - Next steps (work_context)

**Success Criteria:**
- "Brief me on MyTab" returns accurate context
- "What deals are in Relationship Development?" returns correct list
- "What red flags should I be aware of?" surfaces concerns

**Estimated Effort:** 2-3 days development + 1 day testing

### 6.3 NEXT Phase: Enhanced Queries

**Goal:** Enable cross-entity insights and pattern detection

**Deliverables:**
1. Cross-entity memory linking
   - SwiftCheckin appears in both Deals and Clients
   - "Tell me about my relationship with Boney" spans both

2. Pattern detection prompts
   - "Which deals are stuck?" (time-in-stage analysis)
   - "What patterns do I see across deals?" (cross-deal synthesis)

3. Timeline queries
   - "What happened this week across all deals?"
   - "Show me activity since November"

**Success Criteria:**
- Cross-entity queries work accurately
- Time-based queries return correct results
- Patterns surface naturally in responses

**Estimated Effort:** 1-2 weeks

### 6.4 LATER Phase: Bidirectional Integration

**Goal:** Enable Bobo to write back to the file system

**Potential Deliverables:**
1. Meeting note capture via Bobo
2. Auto-generated communications log updates
3. Stage transition triggers
4. Inbox processing assistance

**Why Later:**
- Requires careful design to maintain file-as-truth principle
- Need to prove read-layer value first
- Risk of data inconsistency higher
- Sachee explicitly wants to "dogfood" before expanding

---

## Part 7: Sync Script Specification

### 7.1 Cross-Repository Architecture

As noted in Part 1.2, there are two separate Git repositories involved. The sync script must bridge them:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    BLOG MIGRATION REPO                                   │
│         /Users/sacheeperera/VibeCoding Projects/Blog Migration/         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  Deals/           Clients/          Content-Workspace/          │    │
│  │  ├── MyTab/       ├── SwiftCheckin/ ├── 01-Ideas/               │    │
│  │  ├── Talvin/      └── ...           └── ...                     │    │
│  │  └── ...                                                        │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                               │                                          │
│                               │ Script reads files                       │
│                               ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  Utilities/sync_advisory_knowledge.py  ◄── RECOMMENDED LOCATION │    │
│  │  (Lives alongside other utilities like rag_pipeline.py)         │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
                                │
                                │ HTTPS API call
                                │ POST /api/memory/bulk
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         BOBO REPO                                        │
│       /Users/sacheeperera/VibeCoding Projects/bobo-vercel-clone/        │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  app/api/memory/bulk/route.ts  ◄── Receives memory entries      │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                               │                                          │
│                               ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  Supabase: memory_entries table                                 │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

**Where Should the Script Live?**

| Option | Location | Pros | Cons |
|--------|----------|------|------|
| **Option A (Recommended)** | Blog Migration `Utilities/` | Lives with source files, consistent with existing utilities (rag_pipeline.py, content_pipeline.py) | Bobo API URL must be configured |
| Option B | Bobo repo | Closer to API code | Needs Blog Migration path config, separate from source files |
| Option C | Separate tools repo | Clean separation | Another repo to maintain, overkill for one script |

**Recommendation: Option A** - Place the script in `Blog Migration/Utilities/sync_advisory_knowledge.py`. This is consistent with the existing pattern where utilities that process local files live in that repo. The script calls Bobo's API over HTTPS, so it doesn't need to be in the Bobo repo.

### 7.2 Script Overview

```
sync_advisory_knowledge.py
├── Location: Blog Migration/Utilities/
├── Input:    Local file system (../Deals/, ../Clients/)
├── Output:   Memory entries via Bobo API (HTTPS)
├── Mode:     Manual invocation (initially)
└── Scope:    Active deals and clients only
```

### 7.3 Configuration

```python
import os

# Paths are relative to Blog Migration repo root
CONFIG = {
    # Local paths (same repo)
    "base_path": os.path.dirname(os.path.dirname(os.path.abspath(__file__))),  # Blog Migration root
    "deals_path": "Deals",
    "clients_path": "Clients",

    # Remote Bobo API (different repo/deployment)
    "bobo_api_url": os.getenv("BOBO_API_URL", "http://localhost:3000/api/memory/bulk"),
    "bobo_api_key": os.getenv("BOBO_API_KEY"),  # For authentication

    # Filters
    "excluded_dirs": ["_TEMPLATE", "_Archive", "_raw"],
    "file_patterns": ["master-doc.md", "client-profile.md"]
}
```

**Environment Variables:**
```bash
# For local development (Bobo running on localhost)
export BOBO_API_URL="http://localhost:3000/api/memory/bulk"

# For production (Bobo deployed)
export BOBO_API_URL="https://your-bobo-domain.vercel.app/api/memory/bulk"
export BOBO_API_KEY="your-api-key"
```

### 7.4 Processing Pipeline

```python
def sync_advisory_knowledge():
    """Main sync pipeline."""

    # 1. Discover files
    deal_files = find_master_docs(CONFIG["deals_path"])
    client_files = find_client_profiles(CONFIG["clients_path"])

    # 2. Parse each file
    memories = []
    for file in deal_files:
        parsed = parse_master_doc(file)
        memories.extend(generate_deal_memories(parsed))

    for file in client_files:
        parsed = parse_client_profile(file)
        memories.extend(generate_client_memories(parsed))

    # 3. Deduplicate and validate
    memories = deduplicate_memories(memories)
    validate_memories(memories)

    # 4. Bulk upload
    response = upload_to_bobo(memories)

    # 5. Report results
    print(f"Synced {len(memories)} memories")
    return response
```

### 7.5 Memory Generation Logic

**For Deals:**
```python
def generate_deal_memories(parsed):
    """Generate memory entries from parsed deal data."""
    memories = []
    company = parsed["frontmatter"]["company"]

    # Core summary (work_context)
    memories.append({
        "content": f"{company} is an active deal. {generate_summary(parsed)}",
        "category": "work_context",
        "source": f"deals/{company}/master-doc.md",
        "metadata": {
            "entity_type": "deal",
            "entity_name": company,
            "deal_stage": parsed["frontmatter"].get("deal_stage"),
            "last_synced": datetime.now().isoformat()
        }
    })

    # Red flags (top_of_mind) - if present
    red_flags = extract_section(parsed, "Red Flags")
    if red_flags:
        memories.append({
            "content": f"{company} red flags: {red_flags}",
            "category": "top_of_mind",
            "source": f"deals/{company}/master-doc.md",
            "metadata": {"entity_type": "deal", "entity_name": company}
        })

    # Recent activity (brief_history)
    recent = extract_recent_activity(parsed)
    if recent:
        memories.append({
            "content": f"{company} recent activity: {recent}",
            "category": "brief_history",
            "source": f"deals/{company}/master-doc.md",
            "metadata": {"entity_type": "deal", "entity_name": company}
        })

    return memories
```

### 7.6 YAML Frontmatter Parsing

```python
def parse_master_doc(file_path):
    """Parse YAML frontmatter and markdown body."""
    with open(file_path) as f:
        content = f.read()

    # Extract YAML frontmatter
    if content.startswith("---"):
        parts = content.split("---", 2)
        frontmatter = yaml.safe_load(parts[1])
        body = parts[2]
    else:
        frontmatter = {}
        body = content

    return {
        "frontmatter": frontmatter,
        "body": body,
        "file_path": file_path
    }
```

### 7.7 Section Extraction

```python
def extract_section(parsed, section_name):
    """Extract content from a markdown section."""
    body = parsed["body"]

    # Find section header
    pattern = rf"###?\s*{section_name}\s*\n(.*?)(?=\n###?|\Z)"
    match = re.search(pattern, body, re.DOTALL | re.IGNORECASE)

    if match:
        content = match.group(1).strip()
        # Clean up markdown formatting
        content = re.sub(r"^>\s*", "", content, flags=re.MULTILINE)
        return content if content else None

    return None
```

### 7.8 Invocation

```bash
# Manual sync (MVP)
python sync_advisory_knowledge.py

# With dry-run (show what would be synced)
python sync_advisory_knowledge.py --dry-run

# Sync specific entity type
python sync_advisory_knowledge.py --deals-only
python sync_advisory_knowledge.py --clients-only

# With verbose output
python sync_advisory_knowledge.py --verbose
```

---

## Part 8: Alignment with Product Backlog

### 8.1 Completed Milestones (Relevant)

The following completed work directly enables this integration:

**M3.6-02: Enhanced Memory Search + Bulk Seeding API** (Complete)
- `enhanced_memory_search` RPC with 5-component temporal weighting
- `POST /api/memory/bulk` endpoint for batch operations
- 22 deal/client memories already seeded as proof-of-concept

This means the Bobo infrastructure is ready to receive synced memories.

### 8.2 Proposed Backlog Items

**NEW: M3.7-01 - Advisory Knowledge Sync MVP**
- Priority: High
- Dependencies: M3.6-02 (complete)
- Deliverables:
  - `sync_advisory_knowledge.py` script
  - Memory mapping for deals and clients
  - Documentation and usage guide
- Success Criteria:
  - "Brief me on [deal]" works accurately
  - "What deals have red flags?" works
  - All active deals/clients synced

**NEW: M3.7-02 - Cross-Entity Memory Enhancement**
- Priority: Medium
- Dependencies: M3.7-01
- Deliverables:
  - Entity linking in memory metadata
  - Cross-entity query examples
  - Pattern detection prompts

**NEW: M3.8-01 - File System MCP Server** (Later)
- Priority: Low (future consideration)
- Deliverables:
  - MCP server for file system access
  - Bobo Agent tools for file operations
- Note: Deferred pending read-layer validation

---

## Part 9: Division of Labor

### 9.1 Bobo vs Claude Code

A key architectural principle is that Bobo and Claude Code serve different purposes:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            BOBO                                          │
│                        "The Brain"                                       │
├─────────────────────────────────────────────────────────────────────────┤
│  STRENGTHS                        │  USE FOR                            │
│  • Persistent memory              │  • Quick briefings                  │
│  • Cross-entity context           │  • Pattern analysis                 │
│  • Instant recall                 │  • Pre-call prep                    │
│  • Temporal awareness             │  • Cross-deal insights              │
│  • No cold start                  │  • Strategic questions              │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                         CLAUDE CODE                                      │
│                         "The Hands"                                      │
├─────────────────────────────────────────────────────────────────────────┤
│  STRENGTHS                        │  USE FOR                            │
│  • File system access             │  • Creating new deals               │
│  • Complex transformations        │  • Processing inbox                 │
│  • Multi-file operations          │  • Meeting note capture             │
│  • Code execution                 │  • Document generation              │
│  • Git operations                 │  • Research synthesis               │
└─────────────────────────────────────────────────────────────────────────┘
```

### 9.2 Task Routing Examples

| Task | Best Tool | Why |
|------|-----------|-----|
| "Brief me on MyTab" | **Bobo** | Instant memory recall |
| "What deals have red flags?" | **Bobo** | Cross-entity analysis |
| "Prep me for Mikaela call" | **Bobo** | Context synthesis |
| "Process the ControlShiftAI inbox" | **Claude Code** | File operations |
| "Create a new deal for [Company]" | **Claude Code** | Template + file creation |
| "Add these meeting notes to MyTab" | **Claude Code** | File writing |
| "Research [Company] and update master-doc" | **Claude Code** | Multi-step file ops |
| "What patterns across my deals?" | **Bobo** | Cross-entity memory |

### 9.3 Workflow Integration

```
                    ┌─────────────────────────────────────┐
                    │         SACHEE'S WORKFLOW           │
                    └─────────────────────────────────────┘
                                    │
            ┌───────────────────────┴───────────────────────┐
            │                                               │
            ▼                                               ▼
┌───────────────────────┐                     ┌───────────────────────┐
│   QUICK QUESTIONS     │                     │   FILE OPERATIONS     │
│   & BRIEFINGS         │                     │   & PROCESSING        │
│                       │                     │                       │
│   "What's happening   │                     │   "Process this       │
│    with MyTab?"       │                     │    inbox"             │
│                       │                     │                       │
│   "What should I      │                     │   "Create new deal"   │
│    focus on today?"   │                     │                       │
│                       │                     │   "Update meeting     │
│        ↓              │                     │    notes"             │
│       BOBO            │                     │        ↓              │
│  (instant recall)     │                     │    CLAUDE CODE        │
└───────────────────────┘                     │  (file operations)    │
                                              └───────────────────────┘
                                                        │
                                                        │ After changes
                                                        ▼
                                              ┌───────────────────────┐
                                              │   Re-sync to Bobo     │
                                              │   (when ready)        │
                                              └───────────────────────┘
```

---

## Part 10: Success Metrics

### 10.1 Phase 1 Success Criteria

| Metric | Target | Measurement |
|--------|--------|-------------|
| Entity recall accuracy | 95%+ | "Brief me on X" returns correct info |
| Stage query accuracy | 100% | "Deals in stage Y" returns correct list |
| Red flag surfacing | 100% | All documented red flags appear |
| Query response time | <3s | Time from question to answer |
| Sync reliability | 100% | All active entities synced |

### 10.2 Qualitative Indicators

- Sachee uses Bobo for briefings instead of opening files
- "Pre-call prep" becomes a standard Bobo interaction
- Cross-deal pattern questions become natural
- Reduced context-switching between tools

### 10.3 Anti-Patterns to Avoid

- Bobo returning outdated information (sync freshness issue)
- Missing entities (sync coverage issue)
- Wrong entity returned for query (retrieval accuracy issue)
- Having to re-explain context (memory persistence issue)

---

## Part 11: Risk Assessment

### 11.1 Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Sync script misses edge cases | Medium | Medium | Extensive testing with real data |
| Memory deduplication issues | Medium | Low | Implement update-or-create logic |
| Search returns irrelevant results | Low | Medium | Tune temporal weights, add filters |
| API rate limits on bulk sync | Low | Low | Implement batching and delays |

### 11.2 Workflow Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Files and memories drift apart | Medium | High | Clear sync triggers, freshness metadata |
| Over-reliance on Bobo before proven | Low | Medium | Maintain Claude Code as backup |
| Feature creep in sync script | Medium | Medium | Strict MVP scope, iterate based on use |

### 11.3 User Experience Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Bobo gives confidently wrong answers | Medium | High | Include source references in responses |
| User forgets to re-sync | High | Medium | Clear documentation, consider reminders |
| Context switching friction | Low | Low | Clear mental model of Bobo vs Claude Code |

---

## Part 12: Open Questions for PM Review

### 12.1 Architecture Questions

1. **Sync Trigger**: Should sync be manual-only, scheduled, or triggered by file changes?
   - Recommendation: Start manual, add automation after validation

2. **Memory Granularity**: One memory per entity vs. multiple memories per entity?
   - Recommendation: Multiple (summary, red flags, activity) for better retrieval

3. **Historical Data**: Should we sync archived/closed deals?
   - Recommendation: No initially, add later if cross-deal patterns need history

### 12.2 Product Questions

1. **Memory Visibility**: Should users see raw memory entries in Bobo UI?
   - Current: Yes, via Memory Panel
   - Question: Should synced memories be visually distinguished?

2. **Sync Status**: How should sync status be communicated?
   - Options: Log output, Bobo system message, dedicated UI

3. **Conflict Handling**: If user manually edits a memory that was synced, what happens on next sync?
   - Options: Overwrite, skip, merge, flag for review

### 12.3 Implementation Questions

1. **Script Location**: Where should `sync_advisory_knowledge.py` live?
   - **Recommendation**: Blog Migration repo (`Utilities/`) - see Part 7.1 for rationale
   - This keeps the script with the source files it reads, consistent with existing utilities
   - PM Decision: Confirm this approach or propose alternative

2. **Two-Repo Coordination**: How do we manage development across both repositories?
   - Blog Migration repo: Sync script, file structure, SOPs
   - Bobo repo: API endpoints, memory system, chat interface
   - Question: Should changes be coordinated, or can they evolve independently?

3. **Authentication**: How does script authenticate with Bobo API?
   - Options: API key, service account, user token
   - Recommendation: API key stored in environment variable for simplicity

4. **Testing Strategy**: How do we validate sync accuracy?
   - Recommendation: Side-by-side comparison with file content
   - Consider: Automated test that syncs, then queries Bobo, then compares

5. **Deployment Environments**: Script needs to work in multiple contexts
   - Local development: Bobo on localhost:3000
   - Production: Bobo deployed to Vercel
   - Question: How should environment switching work?

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| **Master Doc** | The primary tracking document for a deal (`master-doc.md`) |
| **Client Profile** | The primary document for a client (`client-profile.md`) |
| **YAML Frontmatter** | Structured metadata at the top of markdown files |
| **Double-Loop RAG** | Bobo's two-stage retrieval architecture |
| **Memory Entry** | A single fact/piece of knowledge stored in Bobo |
| **Temporal Weighting** | Score adjustment based on recency and frequency |
| **SOPs** | Standard Operating Procedures for advisory work |

---

## Appendix B: Related Documents

**In Bobo Repository** (`/bobo-vercel-clone/`):
- `docs/PRODUCT_BACKLOG.md` - Current Bobo development backlog
- `docs/product-vision/PRODUCT_VISION_BOBO_CRM.md` - CRM vision document
- `app/api/memory/bulk/route.ts` - Bulk memory API endpoint

**In Blog Migration Repository** (`/Blog Migration/`):
- `Deals/_TEMPLATE/DEAL_SOP.md` - Deal management SOPs
- `Clients/CLIENT_SOP.md` - Client management SOPs
- `Deals/_TEMPLATE/master-doc-template.md` - Deal document template
- `Clients/_TEMPLATE/client-profile-template.md` - Client profile template
- `Utilities/rag_pipeline.py` - Existing RAG search utility (pattern for sync script)
- `CLAUDE.md` - Workspace documentation and conventions

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-06 | Sachee & Claude | Initial comprehensive document |

