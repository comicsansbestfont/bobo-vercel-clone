# Bobo Brain Architecture

**The Cognitive Memory & Context System**

---

## High-Level Brain Model

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              BOBO'S BRAIN                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        PREFRONTAL CORTEX                                 │   │
│  │                     (Working Memory / Attention)                         │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │  │  Current Chat Context (last N messages)                          │   │   │
│  │  │  • User's current query                                          │   │   │
│  │  │  • Recent conversation turns                                     │   │   │
│  │  │  • Active reasoning/draft                                        │   │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│                                      ▼                                          │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐  │
│  │   HIPPOCAMPUS        │  │   NEOCORTEX          │  │   CEREBELLUM         │  │
│  │   (Episodic Memory)  │  │   (Semantic Memory)  │  │   (Procedural)       │  │
│  │                      │  │                      │  │                      │  │
│  │  Past Conversations  │  │  Facts & Knowledge   │  │  User Preferences    │  │
│  │  • messages table    │  │  • memory_entries    │  │  • user_profiles     │  │
│  │  • Chat history      │  │  • Learned facts     │  │  • memory_settings   │  │
│  │  • Context summaries │  │  • Relationships     │  │  • custom_instruct.  │  │
│  │                      │  │  • Confidence scores │  │                      │  │
│  └──────────────────────┘  └──────────────────────┘  └──────────────────────┘  │
│                                      │                                          │
│                                      ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        EXTERNAL KNOWLEDGE                                │   │
│  │                     (Advisory Repository)                                │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │  │  advisory/                                                       │   │   │
│  │  │  ├── deals/           (MyTab, ArcheloLab, ControlShiftAI, ...)  │   │   │
│  │  │  │   └── master-doc, meetings, comms, valuations                │   │   │
│  │  │  └── clients/         (SwiftCheckin, ...)                       │   │   │
│  │  │      └── client-profile, engagements, meetings                  │   │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Memory Timeline

```
                    SHORT-TERM                         LONG-TERM
              ◄─────────────────────►    ◄────────────────────────────────────►

    NOW       │ Current Chat │ Recent │ This Week │ This Month │ Older
    ──────────┼──────────────┼────────┼───────────┼────────────┼──────────────►
              │              │        │           │            │
              │  WORKING     │        │   EPISODIC MEMORY      │
              │  MEMORY      │        │   (messages table)     │
              │              │        │                        │
              │  In-context  │◄──────►│  Searchable via        │
              │  messages    │ saved  │  vector embeddings     │
              │              │        │                        │
              │              │        │                        │
              └──────────────┴────────┴────────────────────────┘
                                              │
                                              │ extraction
                                              ▼
              ┌────────────────────────────────────────────────┐
              │            SEMANTIC MEMORY                      │
              │            (memory_entries table)               │
              │                                                 │
              │  Distilled facts with:                         │
              │  • Temporal decay (Ebbinghaus 45-day half-life)│
              │  • Access frequency scoring                     │
              │  • Hebbian reinforcement                        │
              │  • Importance weighting                         │
              └────────────────────────────────────────────────┘
```

---

## Context Assembly Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         CONTEXT ASSEMBLY PIPELINE                                │
│                                                                                  │
│   USER INPUT                                                                     │
│       │                                                                          │
│       ▼                                                                          │
│   ┌───────────────────────────────────────────────────────────────────────┐    │
│   │ 1. INTENT CLASSIFICATION (M3.8)                                        │    │
│   │    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │    │
│   │    │ advisory    │  │ memory      │  │ hybrid      │                  │    │
│   │    │ "Brief me   │  │ "What do I  │  │ "What did   │                  │    │
│   │    │ on MyTab"   │  │ prefer?"    │  │ we discuss  │                  │    │
│   │    │             │  │             │  │ about X?"   │                  │    │
│   │    └─────────────┘  └─────────────┘  └─────────────┘                  │    │
│   └───────────────────────────────────────────────────────────────────────┘    │
│       │                                                                          │
│       ▼                                                                          │
│   ┌───────────────────────────────────────────────────────────────────────┐    │
│   │ 2. PRE-FLIGHT KNOWLEDGE SEARCH                                         │    │
│   │                                                                         │    │
│   │    ┌─────────────────────┐      ┌─────────────────────┐               │    │
│   │    │ ADVISORY SEARCH     │      │ MEMORY SEARCH       │               │    │
│   │    │ (file system)       │      │ (memory_entries)    │               │    │
│   │    │                     │      │                     │               │    │
│   │    │ • Entity extraction │      │ • Vector similarity │               │    │
│   │    │ • Folder matching   │      │ • Temporal decay    │               │    │
│   │    │ • Master doc read   │      │ • Hebbian weight    │               │    │
│   │    └─────────────────────┘      └─────────────────────┘               │    │
│   │              │                            │                            │    │
│   │              └────────────┬───────────────┘                            │    │
│   │                           ▼                                            │    │
│   │                  ┌─────────────────┐                                   │    │
│   │                  │ MERGED CONTEXT  │                                   │    │
│   │                  │ (injected into  │                                   │    │
│   │                  │  system prompt) │                                   │    │
│   │                  └─────────────────┘                                   │    │
│   └───────────────────────────────────────────────────────────────────────┘    │
│       │                                                                          │
│       ▼                                                                          │
│   ┌───────────────────────────────────────────────────────────────────────┐    │
│   │ 3. SYSTEM PROMPT ASSEMBLY                                              │    │
│   │                                                                         │    │
│   │   ┌─────────────────────────────────────────────────────────────────┐ │    │
│   │   │ BASE SYSTEM PROMPT                                               │ │    │
│   │   │ (AI persona, capabilities, tool descriptions)                    │ │    │
│   │   └─────────────────────────────────────────────────────────────────┘ │    │
│   │                              +                                         │    │
│   │   ┌─────────────────────────────────────────────────────────────────┐ │    │
│   │   │ USER PROFILE CONTEXT                                             │ │    │
│   │   │ (bio, background, preferences, technical_context)               │ │    │
│   │   └─────────────────────────────────────────────────────────────────┘ │    │
│   │                              +                                         │    │
│   │   ┌─────────────────────────────────────────────────────────────────┐ │    │
│   │   │ LOOP A: PROJECT CONTEXT                                          │ │    │
│   │   │ If advisory project: Read master-doc from disk                   │ │    │
│   │   │ If regular project: Read from files table                        │ │    │
│   │   └─────────────────────────────────────────────────────────────────┘ │    │
│   │                              +                                         │    │
│   │   ┌─────────────────────────────────────────────────────────────────┐ │    │
│   │   │ LOOP B: CROSS-PROJECT CONTEXT                                    │ │    │
│   │   │ Hybrid search (vector + text) across all other projects          │ │    │
│   │   └─────────────────────────────────────────────────────────────────┘ │    │
│   │                              +                                         │    │
│   │   ┌─────────────────────────────────────────────────────────────────┐ │    │
│   │   │ COGNITIVE MEMORY CONTEXT                                         │ │    │
│   │   │ Top-k relevant memories (enhanced_memory_search)                 │ │    │
│   │   └─────────────────────────────────────────────────────────────────┘ │    │
│   │                              +                                         │    │
│   │   ┌─────────────────────────────────────────────────────────────────┐ │    │
│   │   │ PRE-FLIGHT ADVISORY CONTEXT (if applicable)                      │ │    │
│   │   │ Injected knowledge from intent classification                    │ │    │
│   │   └─────────────────────────────────────────────────────────────────┘ │    │
│   │                                                                         │    │
│   └───────────────────────────────────────────────────────────────────────┘    │
│       │                                                                          │
│       ▼                                                                          │
│   ┌───────────────────────────────────────────────────────────────────────┐    │
│   │ 4. LLM PROCESSING                                                      │    │
│   │                                                                         │    │
│   │   [System Prompt] + [Conversation History] + [User Message]           │    │
│   │                              │                                         │    │
│   │                              ▼                                         │    │
│   │                      ┌──────────────┐                                  │    │
│   │                      │   Claude /   │                                  │    │
│   │                      │   GPT / etc  │                                  │    │
│   │                      └──────────────┘                                  │    │
│   │                              │                                         │    │
│   │                              ▼                                         │    │
│   │                      [Response Stream]                                 │    │
│   │                                                                         │    │
│   └───────────────────────────────────────────────────────────────────────┘    │
│       │                                                                          │
│       ▼                                                                          │
│   ┌───────────────────────────────────────────────────────────────────────┐    │
│   │ 5. POST-PROCESSING                                                     │    │
│   │                                                                         │    │
│   │   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      │    │
│   │   │ Save to         │  │ Memory          │  │ Access          │      │    │
│   │   │ messages table  │  │ Extraction      │  │ Tracking        │      │    │
│   │   │                 │  │ (if enabled)    │  │ (update stats)  │      │    │
│   │   └─────────────────┘  └─────────────────┘  └─────────────────┘      │    │
│   │                                                                         │    │
│   └───────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Memory Scoring Algorithm (Cognitive Search)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    ENHANCED MEMORY SEARCH SCORING                                │
│                    (enhanced_memory_search RPC)                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   FINAL SCORE = Σ (component × weight)                                          │
│                                                                                  │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                                                                          │   │
│   │   ┌────────────────┐                                                    │   │
│   │   │ VECTOR         │  45%   ←── Semantic similarity (cosine distance)   │   │
│   │   │ SIMILARITY     │            "How related is this to the query?"     │   │
│   │   └────────────────┘                                                    │   │
│   │            +                                                             │   │
│   │   ┌────────────────┐                                                    │   │
│   │   │ TEXT MATCH     │  15%   ←── BM25 full-text search                   │   │
│   │   │ (BM25)         │            "Do the exact words match?"             │   │
│   │   └────────────────┘                                                    │   │
│   │            +                                                             │   │
│   │   ┌────────────────┐                                                    │   │
│   │   │ RECENCY        │  20%   ←── Ebbinghaus decay (45-day half-life)     │   │
│   │   │ (Temporal)     │            "How recently was this accessed?"       │   │
│   │   └────────────────┘                                                    │   │
│   │            +                                                             │   │
│   │   ┌────────────────┐                                                    │   │
│   │   │ FREQUENCY      │  10%   ←── log(access_count + 1)                   │   │
│   │   │ (Access Count) │            "How often is this retrieved?"          │   │
│   │   └────────────────┘                                                    │   │
│   │            +                                                             │   │
│   │   ┌────────────────┐                                                    │   │
│   │   │ IMPORTANCE     │  10%   ←── Salience weight (0-1)                   │   │
│   │   │ (Salience)     │            "How critical is this information?"     │   │
│   │   └────────────────┘            Red flags = 0.9, routine = 0.5          │   │
│   │                                                                          │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│   RECENCY FORMULA (Ebbinghaus Decay):                                           │
│   ────────────────────────────────────                                          │
│                                                                                  │
│       recency_score = 0.5 ^ (days_since_access / 45)                            │
│                                                                                  │
│       │ Days │ Score │                                                          │
│       │──────│───────│                                                          │
│       │  0   │ 1.00  │  ← Just accessed                                         │
│       │  45  │ 0.50  │  ← Half-life                                             │
│       │  90  │ 0.25  │                                                          │
│       │ 135  │ 0.125 │                                                          │
│       │ 180  │ 0.063 │  ← Fading but not forgotten                              │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Hebbian Learning (Memory Reinforcement)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         HEBBIAN REINFORCEMENT                                    │
│                   "Neurons that fire together wire together"                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   When user tells Bobo something it already knows...                            │
│                                                                                  │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                                                                          │   │
│   │   User: "I prefer TypeScript over JavaScript"                           │   │
│   │                        │                                                 │   │
│   │                        ▼                                                 │   │
│   │   ┌────────────────────────────────────────┐                            │   │
│   │   │ Check similarity against existing      │                            │   │
│   │   │ memories (threshold: 0.80)             │                            │   │
│   │   └────────────────────────────────────────┘                            │   │
│   │                        │                                                 │   │
│   │           ┌────────────┴────────────┐                                   │   │
│   │           ▼                         ▼                                   │   │
│   │   ┌──────────────┐          ┌──────────────┐                           │   │
│   │   │ NO MATCH     │          │ MATCH FOUND  │                           │   │
│   │   │ (< 0.80)     │          │ (≥ 0.80)     │                           │   │
│   │   └──────────────┘          └──────────────┘                           │   │
│   │           │                         │                                   │   │
│   │           ▼                         ▼                                   │   │
│   │   ┌──────────────┐          ┌──────────────────────────────────┐       │   │
│   │   │ CREATE NEW   │          │ REINFORCE EXISTING               │       │   │
│   │   │ MEMORY       │          │                                  │       │   │
│   │   │              │          │ • confidence += 0.05 (cap 1.0)   │       │   │
│   │   │              │          │ • access_count += 1              │       │   │
│   │   │              │          │ • last_accessed = NOW            │       │   │
│   │   │              │          │ • importance = max(old, 0.8)     │       │   │
│   │   └──────────────┘          └──────────────────────────────────┘       │   │
│   │                                                                          │   │
│   │   Response:                 Response:                                    │   │
│   │   "Remembered: ..."         "Reinforced existing memory:                │   │
│   │                              confidence 0.80 → 0.85"                     │   │
│   │                                                                          │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Advisory Project Architecture (M3.8)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      ADVISORY PROJECT SYSTEM (M3.8)                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   FILE SYSTEM (Source of Truth)          DATABASE (Metadata)                    │
│   ─────────────────────────────          ─────────────────────                  │
│                                                                                  │
│   advisory/                               projects table                         │
│   ├── deals/                              ┌────────────────────────────────┐    │
│   │   ├── MyTab/                          │ id: uuid                       │    │
│   │   │   ├── master-doc-mytab.md ◄──────►│ name: "MyTab"                  │    │
│   │   │   ├── Meetings/                   │ entity_type: "deal"            │    │
│   │   │   ├── Communications/             │ advisory_folder_path:          │    │
│   │   │   └── Valuation/                  │   "advisory/deals/MyTab"       │    │
│   │   │                                   │ custom_instructions: AI summary│    │
│   │   ├── ArcheloLab/                     └────────────────────────────────┘    │
│   │   ├── ControlShiftAI/                                                       │
│   │   ├── Talvin/                                                               │
│   │   ├── Tandm/                                                                │
│   │   └── SwiftCheckin/                                                         │
│   │                                                                              │
│   └── clients/                                                                   │
│       └── SwiftCheckin/                   ┌────────────────────────────────┐    │
│           ├── client-profile.md ◄────────►│ name: "SwiftCheckin"           │    │
│           ├── Engagements/                │ entity_type: "client"          │    │
│           ├── Meetings/                   │ advisory_folder_path:          │    │
│           └── Comms/                      │   "advisory/clients/SwiftCheck"│    │
│                                           └────────────────────────────────┘    │
│                                                                                  │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                         CONTEXT INJECTION FLOW                           │   │
│   │                                                                          │   │
│   │   User opens MyTab project                                               │   │
│   │            │                                                             │   │
│   │            ▼                                                             │   │
│   │   ┌─────────────────────────────────────────────────────────┐           │   │
│   │   │ context-manager.ts                                       │           │   │
│   │   │                                                          │           │   │
│   │   │ if (project.advisory_folder_path) {                      │           │   │
│   │   │   // Read DIRECTLY from file system (always current)     │           │   │
│   │   │   masterDoc = await readMasterDoc(folderPath);           │           │   │
│   │   │   keySections = extractKeySections(masterDoc);           │           │   │
│   │   │ }                                                        │           │   │
│   │   └─────────────────────────────────────────────────────────┘           │   │
│   │            │                                                             │   │
│   │            ▼                                                             │   │
│   │   System prompt now includes:                                            │   │
│   │   • Company: MyTab                                                       │   │
│   │   • Founder: Mikaela Greene                                              │   │
│   │   • Stage: Phase 1a                                                      │   │
│   │   • ARR: $24K                                                            │   │
│   │   • Red Flags: [from master doc]                                         │   │
│   │   • Recent meetings: [extracted]                                         │   │
│   │                                                                          │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           COMPLETE DATA FLOW                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│                              ┌──────────────┐                                   │
│                              │    USER      │                                   │
│                              └──────┬───────┘                                   │
│                                     │                                            │
│                                     ▼                                            │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                           CHAT INTERFACE                                  │   │
│  │                          (app/page.tsx)                                   │   │
│  └──────────────────────────────────┬───────────────────────────────────────┘   │
│                                     │                                            │
│                    ┌────────────────┼────────────────┐                          │
│                    ▼                ▼                ▼                          │
│           ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │
│           │ Standard     │  │ Agent Mode   │  │ Web Search   │                 │
│           │ Chat API     │  │ (tools)      │  │ (Perplexity) │                 │
│           └──────┬───────┘  └──────┬───────┘  └──────────────┘                 │
│                  │                 │                                             │
│                  └────────┬────────┘                                             │
│                           │                                                      │
│                           ▼                                                      │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                      CONTEXT ASSEMBLY                                     │   │
│  │                                                                           │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐            │   │
│  │  │ User    │ │ Project │ │ Cross-  │ │ Memory  │ │Advisory │            │   │
│  │  │ Profile │ │ Context │ │ Project │ │ Context │ │ Pre-    │            │   │
│  │  │         │ │ Loop A  │ │ Loop B  │ │         │ │ flight  │            │   │
│  │  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘            │   │
│  │       │           │           │           │           │                  │   │
│  │       └───────────┴───────────┴───────────┴───────────┘                  │   │
│  │                               │                                           │   │
│  │                               ▼                                           │   │
│  │                    ┌─────────────────────┐                               │   │
│  │                    │  SYSTEM PROMPT      │                               │   │
│  │                    │  (assembled)        │                               │   │
│  │                    └─────────────────────┘                               │   │
│  └──────────────────────────────────┬───────────────────────────────────────┘   │
│                                     │                                            │
│                                     ▼                                            │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                           LLM INFERENCE                                   │   │
│  │                                                                           │   │
│  │   ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐        │   │
│  │   │ Claude     │  │ GPT-4o     │  │ Gemini     │  │ Deepseek   │        │   │
│  │   │ (Anthropic)│  │ (OpenAI)   │  │ (Google)   │  │            │        │   │
│  │   └────────────┘  └────────────┘  └────────────┘  └────────────┘        │   │
│  │                                                                           │   │
│  └──────────────────────────────────┬───────────────────────────────────────┘   │
│                                     │                                            │
│                                     ▼                                            │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                        POST-PROCESSING                                    │   │
│  │                                                                           │   │
│  │   ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐     │   │
│  │   │ Save Message    │    │ Extract         │    │ Update Access   │     │   │
│  │   │                 │    │ Memories        │    │ Stats           │     │   │
│  │   │ → messages      │    │ → memory_entries│    │ → last_accessed │     │   │
│  │   │   table         │    │   table         │    │ → access_count  │     │   │
│  │   └─────────────────┘    └─────────────────┘    └─────────────────┘     │   │
│  │                                                                           │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│                                     │                                            │
│                                     ▼                                            │
│                              ┌──────────────┐                                   │
│                              │   RESPONSE   │                                   │
│                              │   TO USER    │                                   │
│                              └──────────────┘                                   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema Summary

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           DATABASE TABLES                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   IDENTITY & PREFERENCES                                                        │
│   ──────────────────────                                                        │
│   ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐          │
│   │ users           │────►│ user_profiles   │     │ memory_settings │          │
│   │                 │     │                 │     │                 │          │
│   │ • id            │     │ • bio           │     │ • auto_extract  │          │
│   │ • email         │     │ • background    │     │ • frequency     │          │
│   │ • name          │     │ • preferences   │     │ • categories    │          │
│   │                 │     │ • tech_context  │     │ • token_budget  │          │
│   └─────────────────┘     └─────────────────┘     └─────────────────┘          │
│                                                                                  │
│   PROJECTS & CONTENT                                                            │
│   ──────────────────                                                            │
│   ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐          │
│   │ projects        │────►│ chats           │────►│ messages        │          │
│   │                 │     │                 │     │                 │          │
│   │ • id            │     │ • id            │     │ • id            │          │
│   │ • name          │     │ • project_id    │     │ • chat_id       │          │
│   │ • entity_type   │     │ • title         │     │ • role          │          │
│   │ • advisory_path │     │ • model         │     │ • content       │          │
│   │ • custom_instr  │     │ • web_search    │     │ • embedding     │          │
│   └─────────────────┘     └─────────────────┘     └─────────────────┘          │
│          │                                                                       │
│          ▼                                                                       │
│   ┌─────────────────┐                                                           │
│   │ files           │  (for non-advisory projects only)                         │
│   │                 │                                                            │
│   │ • project_id    │                                                            │
│   │ • filename      │                                                            │
│   │ • content_text  │                                                            │
│   │ • embedding     │                                                            │
│   └─────────────────┘                                                           │
│                                                                                  │
│   COGNITIVE MEMORY                                                              │
│   ────────────────                                                              │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │ memory_entries                                                           │   │
│   │                                                                          │   │
│   │ CORE:           │ COGNITIVE:         │ TRACKING:          │ META:       │   │
│   │ • id            │ • confidence       │ • last_accessed    │ • category  │   │
│   │ • content       │ • importance       │ • access_count     │ • source    │   │
│   │ • embedding     │ • relevance_score  │ • last_mentioned   │ • is_active │   │
│   │ • content_hash  │ • time_period      │ • created_at       │             │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Neuroscience Concepts Implemented

| Concept | Implementation | Purpose |
|---------|----------------|---------|
| **Working Memory** | Current chat context window | Hold active information |
| **Episodic Memory** | Messages table with embeddings | Recall specific conversations |
| **Semantic Memory** | memory_entries with facts | Store distilled knowledge |
| **Procedural Memory** | User profile + custom instructions | Remember preferences |
| **Temporal Decay** | Ebbinghaus formula (45-day half-life) | Prioritize recent info |
| **Hebbian Learning** | Reinforcement on similarity match | Strengthen repeated knowledge |
| **Spreading Activation** | Cross-project search (Loop B) | Find related concepts |
| **Salience/Importance** | Importance weighting (0-1) | Prioritize critical info |

---

*Architecture Document - December 7, 2025*
*Milestone: M3.6 Cognitive Memory + M3.7 Advisory + M3.8 Advisory Projects*
