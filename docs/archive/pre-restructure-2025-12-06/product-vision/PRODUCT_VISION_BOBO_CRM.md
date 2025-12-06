# Product Vision: Bobo as Deal/Client Brain

**Version:** 1.0
**Created:** 2025-12-06
**Author:** Sachee Perera (with Claude)

---

## Vision Statement

**Bobo is "Brain as a Service"** - an AI companion that holds Sachee's GTM advisory context, enabling instant recall of deals, clients, patterns, and insights across the entire practice.

Unlike ChatGPT or Claude Desktop (which start every conversation cold), Bobo maintains persistent memory of:
- Active deals and their current stage
- Client relationships and health indicators
- Strategic insights and red flags
- Historical patterns across the advisory portfolio

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

---

## The Solution: Phased Approach

### Phase 1: Read-Only Brain (NOW)
**Goal:** Bobo knows everything about deals/clients via seeded context

**Capabilities:**
- Answer questions like "Brief me on MyTab" or "What deals have red flags?"
- Recall recent activity ("What happened with SwiftCheckin last week?")
- Surface cross-entity insights ("Which deals are in Relationship Development?")

**How:**
- Seed memory_entries with deal/client facts
- Hybrid search (70% vector + 30% BM25) for retrieval
- Temporal weighting (recent = more relevant)

**Success Criteria:**
- "Tell me about MyTab" returns accurate summary
- "What are my top priorities this week?" returns actionable list
- Zero cold-start friction for deal context

### Phase 2: Memory Writer (NEXT)
**Goal:** Bobo learns and updates from conversations

**Capabilities:**
- `remember_fact` tool captures new insights from chat
- `update_memory` corrects outdated information
- `forget_memory` removes stale context
- Hebbian reinforcement strengthens frequently-accessed memories

**How:**
- Agent tools already implemented (M3.5)
- Enhance with temporal decay and reinforcement (M3.6)

### Phase 3: File System Integration (LATER)
**Goal:** Bobo reads/writes to the deal/client file system

**Architecture Options:**

| Option | Pros | Cons |
|--------|------|------|
| **MCP Server** | Standard protocol, works with Claude Desktop | Adds complexity, another process |
| **Local Bobo Mode** | Direct fs access via Node.js | Needs separate build, security considerations |
| **Sync Layer** | Markdown <-> Database sync | Bidirectional sync is complex |

**Capabilities (Future):**
- Process inbox: "Process the ControlShiftAI inbox"
- Create deal: "Create a new deal for [Company]"
- Update master doc: "Add today's meeting notes to MyTab"
- Generate reports: "Show me deal velocity this month"

---

## Workflow: Daily Dogfooding

### Monday Morning Briefing
**Query:** "Brief me on my week ahead"

**Expected Response:**
- Deals requiring attention (red flags, pending actions)
- Scheduled calls/meetings
- Stalled deals needing follow-up
- Recent activity summary

### Pre-Call Prep
**Query:** "Prep me for my call with Mikaela from MyTab"

**Expected Response:**
- Current stage and context
- Last touchpoint summary
- Outstanding action items
- Red flags to address
- Key talking points

### Post-Meeting Capture
**Query:** "Update MyTab with today's call notes: [notes]"

**Expected Behavior (Phase 2+):**
- Extract key facts
- Update memory entries
- Flag action items
- Detect changes in deal stage

### Cross-Entity Analysis
**Query:** "Which deals are stuck in Relationship Development?"

**Expected Response:**
- List of deals in that stage
- Time in stage
- Suggested next actions

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

**Key Insight:** Bobo is the brain (context/recall), Claude Code is the hands (file operations). They complement each other.

---

## Technical Architecture

### Current State (M3.5-M3.6 Complete)
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

### Future State (Phase 3)
```
┌─────────────────────────────────────────┐
│            Bobo Application             │
├─────────────────────────────────────────┤
│  Chat Interface  │  Memory Panel        │
├──────────────────┼──────────────────────┤
│  Agent SDK       │  Memory Tools        │
├──────────────────┴──────────────────────┤
│           Supabase Database             │
├─────────────────────────────────────────┤
│      File System Integration Layer      │
│  ┌─────────────────────────────────┐   │
│  │  MCP Server OR Local fs Tools   │   │
│  └─────────────────────────────────┘   │
├─────────────────────────────────────────┤
│  /Blog Migration/                       │
│  ├── Deals/                             │
│  │   ├── MyTab/master-doc.md           │
│  │   ├── SwiftCheckin/master-doc.md    │
│  │   └── ...                            │
│  └── Clients/                           │
│      └── SwiftCheckin/client-profile.md │
└─────────────────────────────────────────┘
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

---

## Success Metrics

### Phase 1 (Read-Only Brain)
- [ ] Entity recall accuracy: 95%+ for seeded deals/clients
- [ ] Cross-entity queries work ("deals with red flags")
- [ ] Temporal awareness ("recent activity" surfaces correctly)
- [ ] Daily dogfooding: Using Bobo for briefings instead of file navigation

### Phase 2 (Memory Writer)
- [ ] New insights captured without manual seeding
- [ ] Memory deduplication working (no duplicate facts)
- [ ] Hebbian reinforcement: frequently-accessed memories rank higher

### Phase 3 (File Integration)
- [ ] Inbox processing works via Bobo
- [ ] Deal creation workflow functional
- [ ] Bidirectional sync maintains consistency

---

## Key Design Decisions

1. **Seeding before building**: Validate recall works before adding more features
2. **Phased approach**: Each phase proves value before next begins
3. **Shadow strategy**: Bobo as brain, Claude Code as hands (not replacement)
4. **Single user focus**: Optimize for Sachee's workflow, not generic CRM
5. **File system as source of truth**: Database mirrors files, not vice versa

---

## Appendix: Discussion Context

This document captures the strategic discussion between Sachee and Claude on 2025-12-06 about transforming Bobo from a generic chatbot into a purpose-built "Deal/Client Brain" for GTM advisory practice.

Key insights from the discussion:
- Multiple LLMs (ChatGPT, Gemini, Claude) all recommended "use what you have" vs. building more features
- The "pick ONE use case where Bobo wins" advice led to deal/client context as the focus
- File system integration is a later phase, not immediate priority
- Dogfooding reveals real requirements better than feature planning
