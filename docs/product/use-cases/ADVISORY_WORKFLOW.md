# Advisory Workflow: Deals & Clients Brain

**Version:** 2.0
**Created:** December 6, 2025
**Author:** Sachee Perera (with Claude)
**Type:** Use Case Documentation
**Status:** Active - Primary Dogfooding Use Case

**Parent Document:** [PLATFORM_BRIEF.md](../PLATFORM_BRIEF.md)
**Implementation:** [REPOSITORY_CONSOLIDATION.md](../roadmaps/REPOSITORY_CONSOLIDATION.md)

---

## Vision Statement

**Bobo is "Brain as a Service"** - an AI companion that holds Sachee's GTM advisory context, enabling instant recall of deals, clients, patterns, and insights across the entire practice.

Unlike ChatGPT or Claude Desktop (which start every conversation cold), Bobo maintains persistent memory of:
- Active deals and their current stage
- Client relationships and health indicators
- Strategic insights and red flags
- Historical patterns across the advisory portfolio

**This use case transforms Bobo from a generic chatbot into a purpose-built advisory command center.**

---

## The Problem

### Current Pain Points

1. **Context Fragmentation**: Deal/client knowledge lives in markdown files, scattered across folders
2. **Cold Start Problem**: Every new conversation with LLMs requires re-explaining context
3. **Manual Briefings**: "Where am I with MyTab?" requires opening files and scanning
4. **Cross-Entity Insights**: Hard to see patterns across deals (e.g., "which deals have similar red flags?")
5. **Temporal Awareness**: Recent activity should surface naturally, not require explicit lookup

### Why Existing Tools Fail

| Tool | Limitation |
|------|------------|
| **ChatGPT/Claude** | No persistent memory across sessions. Context resets with each conversation. |
| **Claude Code** | Great for file operations, but focused on code editing, not advisory context |
| **Notion AI** | Good for docs, but doesn't understand deal lifecycle or GTM semantics |
| **CRMs** | Structured but rigid. Don't support natural language querying. |

### Validation Finding (December 6, 2025)

During dogfooding validation with 22 seeded memories, we discovered:

> **Memories provide high-level context, but users need granular file access for real work.**

Example queries that failed with memories alone:
- "What was my last email to Mikaela?" → Requires actual Communications Log
- "Prep me for the MyTab call tomorrow" → Requires meeting history + research docs
- "What did we discuss in the Dec 2 pitch practice?" → Requires meeting transcript

**Conclusion:** Bobo needs access to actual files, not just memory summaries. This insight led to the Repository Consolidation approach.

---

## The Solution: Repository Consolidation

Rather than building complex sync mechanisms between Blog Migration and Bobo repositories, we consolidate everything into a single repository where:
- Files live in Git (version controlled, editable via Claude Code)
- Files are indexed to Supabase at build time (searchable via RAG)
- Agent Mode can access both memories AND files
- Single source of truth, single workflow

### Architecture Evolution

**Before (Two-Repository Architecture):**
```
Blog Migration Repository          Bobo Repository
├── Deals/                         ├── app/
├── Clients/                       ├── lib/
├── Content-Workspace/             ├── components/
└── [knowledge files]              └── supabase/

        ↕ No automated connection
```

**After (Unified Architecture):**
```
Bobo Repository (Consolidated)
├── app/                  # Application code
├── lib/                  # Shared libraries
├── components/           # React components
├── advisory/             # MIGRATED from Blog Migration
│   ├── deals/            # Sales pipeline
│   └── clients/          # Active engagements
├── content/              # Content creation system (NEXT phase)
├── knowledge/            # Reference materials (LATER phase)
└── supabase/             # Database (indexes everything)
```

### Migration Phases

| Phase | Scope | Timeline | Status |
|-------|-------|----------|--------|
| **NOW** | Advisory Core (Deals + Clients) | Week 1 | In Progress |
| **NEXT** | Content System (Workspace + Workbench) | Week 2-3 | Planned |
| **LATER** | Full Knowledge Base (Inspiration + Reference) | Week 4+ | Planned |

---

## How It Works (After Consolidation)

### User Query Flow

```
┌─────────────────────────────────────────────────────────────┐
│              USER QUERY                                      │
│   "Brief me on MyTab for tomorrow's call"                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  BOBO AGENT MODE                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  1. search_memory("MyTab")                            │  │
│  │     → Returns: "MyTab is in Relationship Development" │  │
│  │     → Returns: "Red flag: Valuation mismatch"         │  │
│  │                                                        │  │
│  │  2. search_advisory("MyTab meetings recent")          │  │
│  │     → Returns: advisory/deals/MyTab/Meetings/         │  │
│  │                2025-12-02.md                           │  │
│  │     → Returns: advisory/deals/MyTab/master-doc.md     │  │
│  │                                                        │  │
│  │  3. Read(advisory/deals/MyTab/master-doc.md)          │  │
│  │     → Returns: Full master doc with Communications    │  │
│  │                Log, research, strategic observations  │  │
│  │                                                        │  │
│  │  4. Synthesize response                               │  │
│  │     → Combines memory context + file details          │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    RESPONSE                                  │
│  "MyTab is in Relationship Development stage. Key context:   │
│   - Last meeting: Dec 2 pitch practice with Mikaela         │
│   - Red flag: Valuation expectations ($6M) may be high      │
│     for $24K ARR                                            │
│   - Recent email: Dec 2 follow-up on pitch deck feedback   │
│   - Next steps: Review updated pitch deck, prep VC intro   │
│     list                                                    │
│                                                             │
│   Suggested talking points for tomorrow:                    │
│   1. Pitch deck improvements since last session            │
│   2. Timeline for next funding round                       │
│   3. Address valuation expectation alignment"              │
└─────────────────────────────────────────────────────────────┘
```

### Two-Layer Search Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    UNIFIED SEARCH                            │
│                                                              │
│  User Query: "What deals have valuation concerns?"          │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  LAYER 1: Memory Search (Fast Facts)                 │   │
│  │                                                       │   │
│  │  search_memory("valuation concerns")                 │   │
│  │  → "MyTab: Valuation mismatch - $24K ARR ask $6M"   │   │
│  │  → "ArcheloLab: Pre-revenue, valuation TBD"         │   │
│  └──────────────────────────────────────────────────────┘   │
│                           +                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  LAYER 2: File Search (Deep Context)                 │   │
│  │                                                       │   │
│  │  search_advisory("valuation", file_type="master-doc")│   │
│  │  → advisory/deals/MyTab/master-doc.md                │   │
│  │     (Valuation Snapshot section)                     │   │
│  │  → advisory/deals/ArcheloLab/master-doc.md           │   │
│  │     (Valuation section)                              │   │
│  └──────────────────────────────────────────────────────┘   │
│                           =                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  SYNTHESIZED RESPONSE                                │   │
│  │                                                       │   │
│  │  "Two deals have valuation-related concerns:         │   │
│  │                                                       │   │
│  │  1. MyTab - Red flag: Expecting $6M valuation        │   │
│  │     on $24K ARR                                      │   │
│  │     - Founder Engine Score: 3.8/5.0                  │   │
│  │     - Recommendation: Align expectations before      │   │
│  │       intro to VCs                                   │   │
│  │                                                       │   │
│  │  2. ArcheloLab - Pre-revenue, valuation not yet      │   │
│  │     established                                      │   │
│  │     - Currently in Phase 1a                          │   │
│  │     - Recommendation: Focus on first customer"       │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Daily Dogfooding Workflows

### Monday Morning Briefing
**Query:** "Brief me on my week ahead"

**Expected Response:**
- Deals requiring attention (red flags, pending actions)
- Scheduled calls/meetings
- Stalled deals needing follow-up
- Recent activity summary

**Powered by:**
- `search_memory` for top-of-mind priorities
- `search_advisory` for scheduled meetings
- Temporal weighting (recent = more relevant)

---

### Pre-Call Prep
**Query:** "Prep me for my call with Mikaela from MyTab"

**Expected Response:**
- Current stage and context
- Last touchpoint summary
- Outstanding action items
- Red flags to address
- Key talking points

**Powered by:**
- `search_memory` for quick context
- `search_advisory` for Communications Log
- `Read` for meeting transcripts

---

### Post-Meeting Capture
**Query:** "Update MyTab with today's call notes: [notes]"

**Expected Behavior (Phase 2+):**
- Extract key facts
- Update memory entries via `remember_fact`
- Flag action items
- Detect changes in deal stage

**Powered by:**
- `remember_fact` for new insights
- `update_memory` for changed status
- Eventually: Write to master-doc.md

---

### Cross-Entity Analysis
**Query:** "Which deals are stuck in Relationship Development?"

**Expected Response:**
- List of deals in that stage
- Time in stage
- Suggested next actions

**Powered by:**
- `search_memory` for stage metadata
- `search_advisory` for master docs
- Pattern detection across entities

---

### Research Recall
**Query:** "What was my last email to Mikaela?"

**Expected Response:**
- Specific email from Communications Log
- Date and context
- Follow-up status

**Powered by:**
- `search_advisory` for master-doc
- `Read` to extract Communications Log
- Content parsing for email entries

---

## Claude Code vs Bobo: Division of Labor

| Task | Best Tool | Why |
|------|-----------|-----|
| **Processing inbox** | Claude Code | File operations, complex transformations |
| **Creating deals** | Claude Code | Template copying, folder creation |
| **Quick briefing** | Bobo | Instant recall, no file navigation |
| **Pattern analysis** | Bobo | Cross-entity context in memory |
| **Meeting notes** | Either | Claude Code for files, Bobo for memory |
| **Research synthesis** | Claude Code | Multi-file reading, doc generation |
| **Strategic questions** | Bobo | Contextual reasoning with memory |
| **Pre-call prep** | Bobo | Synthesize recent context and details |
| **Weekly planning** | Bobo | Surface priorities across all deals |

**Key Insight:** Bobo is the brain (context/recall), Claude Code is the hands (file operations). They complement each other.

---

## Technical Architecture

### Current State (M3.6 Complete)
```
┌─────────────────────────────────────────┐
│            Bobo Application             │
├─────────────────────────────────────────┤
│  Chat Interface  │  Memory Panel        │
├──────────────────┼──────────────────────┤
│  Agent SDK       │  Memory Tools        │
│  - Chat handler  │  - search_memory     │
│  - Tool routing  │  - remember_fact     │
│                  │  - update_memory     │
│                  │  - forget_memory     │
├──────────────────┴──────────────────────┤
│           Supabase Database             │
│  - memory_entries (with embeddings)     │
│  - chats / messages                     │
│  - hybrid_memory_search RPC             │
│  - find_memories_by_embedding RPC       │
└─────────────────────────────────────────┘
```

### Target State (M3.7 - After Consolidation)
```
┌─────────────────────────────────────────────────────────┐
│                  Bobo Application                        │
├─────────────────────────────────────────────────────────┤
│        Chat Interface  │  Memory Panel                  │
├────────────────────────┼────────────────────────────────┤
│        Agent SDK       │  Agent Tools                   │
│        - Chat handler  │  - search_memory               │
│        - Tool routing  │  - search_advisory  [NEW]      │
│                        │  - remember_fact               │
│                        │  - update_memory               │
│                        │  - Read                        │
│                        │  - Glob                        │
│                        │  - Grep                        │
├────────────────────────┴────────────────────────────────┤
│              GIT REPOSITORY (Consolidated)              │
│                                                          │
│  advisory/                                               │
│  ├── deals/                                              │
│  │   ├── _TEMPLATE/                                     │
│  │   ├── MyTab/                                         │
│  │   │   ├── master-doc.md                              │
│  │   │   ├── Meetings/                                  │
│  │   │   ├── Docs/                                      │
│  │   │   └── _Inbox/                                    │
│  │   ├── ControlShiftAI/                                │
│  │   ├── Talvin/                                        │
│  │   ├── ArcheloLab/                                    │
│  │   └── [other deals]                                  │
│  └── clients/                                            │
│      ├── _TEMPLATE/                                      │
│      └── SwiftCheckin/                                   │
│          ├── client-profile.md                           │
│          ├── Engagements/                                │
│          └── Meetings/                                   │
│                                                          │
├─────────────────────────────────────────────────────────┤
│            Supabase Database (Indexed)                   │
│  - memory_entries (facts, patterns, preferences)        │
│  - files (indexed advisory files + embeddings)  [NEW]   │
│  - chats / messages                                     │
│  - hybrid_memory_search RPC                             │
│  - search_advisory_files RPC  [NEW]                     │
└─────────────────────────────────────────────────────────┘
```

### Build-Time Indexing Flow
```
┌─────────────────────────────────────────────────────────┐
│                  GIT REPOSITORY                          │
│                                                          │
│  advisory/deals/MyTab/master-doc.md                     │
│  advisory/clients/SwiftCheckin/client-profile.md        │
└─────────────────────────────────────────────────────────┘
                            │
                            │ Build Time (npm run build)
                            │ scripts/index-advisory.ts
                            ▼
┌─────────────────────────────────────────────────────────┐
│               SUPABASE (files table)                     │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │  id: uuid                                        │    │
│  │  project_id: 'advisory-knowledge-base'          │    │
│  │  filename: 'advisory/deals/MyTab/master-doc.md' │    │
│  │  content_text: '---\ncompany: MyTab\n...'       │    │
│  │  embedding: vector(1536)                         │    │
│  │  file_type: 'markdown'                          │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                            │
                            │ Runtime (Agent Mode)
                            │ search_advisory_files()
                            ▼
┌─────────────────────────────────────────────────────────┐
│                  BOBO AGENT MODE                         │
│                                                          │
│  Tools:                                                  │
│  ├── search_memory      → Query memory_entries table    │
│  ├── search_advisory    → Query files table             │
│  ├── Read               → Read file from Git repo       │
│  ├── Glob               → Find files by pattern         │
│  └── Grep               → Search file contents          │
└─────────────────────────────────────────────────────────┘
```

---

## Memory Categories for Advisory

| Category | Purpose | Examples |
|----------|---------|----------|
| `work_context` | Active deal/client summaries | "MyTab is a hospitality SaaS..." |
| `top_of_mind` | Red flags, urgent items | "MyTab: Valuation mismatch concern" |
| `brief_history` | Recent activity | "Dec 2: Pitch practice with Mikaela" |
| `long_term_background` | Methodology, frameworks | "SPICED: Situation, Pain, Impact..." |
| `other_instructions` | Preferences, behavior guides | "Always include red flags in briefings" |

**Note:** After M3.7 consolidation, these categories will be supplemented by file-based context from `advisory/` directory.

---

## Implementation Roadmap

### NOW Phase: Advisory Core (Week 1)

**Goal:** Enable Bobo to answer advisory questions with full file context.

**Success Criteria:**
- [ ] "Brief me on MyTab" returns accurate, detailed context
- [ ] "What was my last email to Mikaela?" finds Communications Log
- [ ] "What deals have red flags?" searches across all deals
- [ ] "Prep me for tomorrow's call" synthesizes relevant context

**Key Tasks:**
1. Create `advisory/` directory structure
2. Move Deals/ and Clients/ from Blog Migration
3. Build `scripts/index-advisory.ts` for build-time indexing
4. Create `search_advisory` agent tool
5. Add `search_advisory_files` database function
6. Test validation queries
7. Deploy to production

**See:** [REPOSITORY_CONSOLIDATION_ROADMAP.md](../roadmaps/REPOSITORY_CONSOLIDATION_ROADMAP.md) for detailed implementation steps.

---

### NEXT Phase: Content System (Week 2-3)

**Goal:** Bring content creation workflow into Bobo.

**Migration Scope:**
- `Content-Workspace/` → `content/workspace/`
- `02_Workbench/` → `content/workbench/`

**New Capabilities:**
- "Find my SPICED framework content" → Returns GTM Framework docs
- "What LinkedIn posts are ready to publish?" → Lists ready-to-publish queue
- "Show me the Claude conversation about pricing" → Finds relevant chat
- "What content ideas do I have about founder-led sales?" → Searches ideas

---

### LATER Phase: Full Knowledge Base (Week 4+)

**Goal:** Complete consolidation with research corpus and reference materials.

**Migration Scope:**
- `01_Inspiration/` → `knowledge/inspiration/` (493 blog posts)
- `04_Reference/` → `knowledge/reference/` (playbooks, slides, identity)

**New Capabilities:**
- "Find blog posts about pricing psychology" → Searches 493 posts
- "What did I write about SPICED at CorePlan?" → Returns reference materials
- "Show me my bio for speaking engagements" → Returns identity docs

**Special Considerations:**
- Large corpus indexing (493 posts)
- Chunking strategy for long posts
- PDF/slide deck extraction
- Embedding cost optimization

---

## Success Metrics

### Phase 1: Advisory Core (NOW)
- [ ] Entity recall accuracy: 95%+ for seeded deals/clients
- [ ] Cross-entity queries work ("deals with red flags")
- [ ] Temporal awareness ("recent activity" surfaces correctly)
- [ ] Daily dogfooding: Using Bobo for briefings instead of file navigation
- [ ] Query success rate: 80%+ useful responses
- [ ] Time to answer vs file browsing: 50% faster

### Phase 2: Content System (NEXT)
- [ ] Content workflow queries functional
- [ ] AI conversation search working
- [ ] Framework/template retrieval accurate

### Phase 3: Full Knowledge Base (LATER)
- [ ] Blog post corpus searchable
- [ ] Reference material retrieval working
- [ ] Cross-domain pattern detection

### Qualitative Indicators
- "Brief me on X" feels natural and complete
- No longer opening master docs manually for context
- Confident in Bobo's answers (not second-guessing)
- Discovering cross-deal patterns through conversation

---

## Validation Status

### What Works Today (M3.6)
✅ Memory-based queries:
- "What do you know about MyTab?"
- "What deals are in my pipeline?"
- "What are my top priorities?"

### What Will Work After M3.7 (Consolidation)
🎯 File-based queries:
- "What was my last email to Mikaela?" (Communications Log)
- "Show me the Dec 2 meeting notes" (Meeting transcript)
- "What research have I done on MyTab?" (Docs folder)
- "What's the valuation snapshot for ArcheloLab?" (Master doc section)

### What Will Work After Phase 2+ (Content/Knowledge)
🔮 Full knowledge queries:
- "Find my SPICED framework content" (Reference materials)
- "What have I written about pricing?" (Blog corpus)
- "Show me LinkedIn posts about founder-led sales" (Content workspace)

---

## Key Design Decisions

1. **Repository Consolidation over Sync**: Files move to Bobo repo instead of building sync layer
2. **Build-Time Indexing**: Index at build, not runtime, for consistency
3. **Phased Migration**: Prove value with advisory core before expanding
4. **Dual Search Strategy**: Memory for fast facts, files for deep context
5. **Shadow Strategy**: Bobo as brain, Claude Code as hands (not replacement)
6. **Single User Focus**: Optimize for Sachee's workflow, not generic CRM
7. **Git as Source of Truth**: Files in Git, indexed to database (not vice versa)

---

## Benefits of This Approach

| Benefit | Description |
|---------|-------------|
| **Single Source of Truth** | All knowledge in one Git repository |
| **Unified Search** | One RAG system (Supabase pgvector) searches everything |
| **No Sync Required** | Files ARE the source, indexed at build time |
| **Same Workflow** | Claude Code edits files in Bobo repo (identical UX) |
| **Production Access** | Vercel deployment includes all files |
| **Version Control** | Git history for all advisory + content files |
| **Simplified Tooling** | Replace ChromaDB with existing Supabase infrastructure |
| **Zero Context Switching** | All knowledge accessible from one chat interface |

---

## References

### Related Documents
- [REPOSITORY_CONSOLIDATION_ROADMAP.md](../roadmaps/REPOSITORY_CONSOLIDATION_ROADMAP.md) - Implementation details
- [KNOWLEDGE_MIGRATION_STRATEGY.md](../../product-vision/KNOWLEDGE_MIGRATION_STRATEGY.md) - Original sync-based approach
- [SEEDING_STRATEGY.md](../../product-vision/SEEDING_STRATEGY.md) - Memory seeding approach
- [PROJECT_BRIEF.md](../../PROJECT_BRIEF.md) - Overall platform vision
- [PRODUCT_BACKLOG.md](../../PRODUCT_BACKLOG.md) - Current development backlog

### Blog Migration Documentation
- `/Users/sacheeperera/VibeCoding Projects/Blog Migration/CLAUDE.md` - Full workspace guide
- `Blog Migration/Deals/_TEMPLATE/DEAL_SOP.md` - Deal management SOPs
- `Blog Migration/Clients/_TEMPLATE/CLIENT_SOP.md` - Client management SOPs

---

## Appendix: Discussion Context

This document evolved from PRODUCT_VISION_BOBO_CRM.md through strategic discussions between Sachee and Claude on December 6, 2025.

**Key evolution points:**

1. **Initial Vision (v1.0)**: Bobo as Deal/Client Brain with three phases:
   - Phase 1: Read-only brain (seeded memories)
   - Phase 2: Memory writer (learning from conversations)
   - Phase 3: File system integration (MCP or sync layer)

2. **Validation Finding**: Dogfooding revealed that memories alone weren't sufficient. Users need access to actual file content (meeting transcripts, emails, master docs) for real work.

3. **Strategic Pivot (v2.0)**: Repository consolidation approach:
   - Move files from Blog Migration to Bobo repository
   - Index files to Supabase at build time
   - Expose via `search_advisory` agent tool
   - Single source of truth, zero sync complexity

**Key insights from the discussion:**
- Multiple LLMs (ChatGPT, Gemini, Claude) all recommended "use what you have" vs. building more features
- The "pick ONE use case where Bobo wins" advice led to deal/client context as the focus
- File access through consolidation is simpler than MCP server or sync layer
- Dogfooding reveals real requirements better than feature planning

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-06 | Sachee & Claude | Initial vision as PRODUCT_VISION_BOBO_CRM.md |
| 2.0 | 2025-12-06 | Sachee & Claude | Evolved to use case doc with consolidation approach |

---

*This use case document describes how Bobo's platform capabilities (memory system, Agent Mode, RAG search) are applied to the specific workflow of managing a GTM advisory practice. It demonstrates Bobo's value through a concrete, dogfooded implementation rather than abstract features.*
