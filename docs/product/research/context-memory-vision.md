# Bobo Context & Memory Vision

**Last Updated:** November 23, 2025  
**Owner:** Product Owner / CTO  
**Scope:** End‑to‑end vision for how Bobo represents, stores, retrieves, and reasons over user knowledge and memories across chats, projects, and time.

This document defines the conceptual “brain” of Bobo: how the **Knowledge Layer**, **Context Layer**, and **Cognitive Layer** work together, and how user‑submitted profiles (“About You” docs) and learned memories interact. It is the north star for M3 (User Profile & Bio) and M5 (Cognitive Layer & Living Docs).

---

## 1. High‑Level Mental Model

We model Bobo’s memory system loosely on the human brain:

- **Knowledge Layer** ≈ sensory + long‑term stores (files, chats, raw facts).  
- **Context Layer** ≈ working memory / active thought (what’s in the prompt right now).  
- **Cognitive Layer** ≈ cortex + prefrontal integration (concepts, narratives, decisions, self‑model).

```text
                          ┌─────────────────────────────┐
                          │       Cognitive Layer       │
                          │  (Cortex / Executive Self)  │
                          │  - Living docs & briefs     │
                          │  - Knowledge graph (facts)  │
                          │  - Strategies & decisions   │
                          └─────────────▲───────────────┘
                                        │
                                        │ derives from, updates
                                        │
                          ┌─────────────┴───────────────┐
                          │        Context Layer        │
                          │   (Working Memory / Prompt) │
                          │  - Active project context   │
                          │  - User Bio & preferences   │
                          │  - Recent chat messages     │
                          │  - Retrieved memories (RAG) │
                          └─────────────▲───────────────┘
                                        │
                                        │ reads/writes
                                        │
                          ┌─────────────┴───────────────┐
                          │       Knowledge Layer       │
                          │  (Stored Knowledge & Logs)  │
                          │  - Files, chats, messages   │
                          │  - Embeddings, summaries    │
                          │  - Personal profile (“About │
                          │    You”), global memory     │
                          └─────────────────────────────┘
```

---

## 2. Core Entities & Relationships

At a data level, we distinguish several entities:

- **User** – the person Bobo serves (currently single‑user, later multi‑user).
- **Project** – a workspace (e.g. “Bobo Vercel Clone”, “Personal Knowledge Garden”).
- **Chat** – a conversation thread within or outside a project.
- **Message** – individual turns inside a chat.
- **File** – uploaded .md (later PDF, code, URLs) attached to a project.
- **Summary** – compressed representation of many messages or files.
- **Memory Item** – structured fact or preference (e.g. “User prefers Tailwind”, “Project uses Supabase”).
- **Personal Profile (“About You” doc)** – user‑authored or uploaded context about themselves and their work.

Conceptual relationship diagram:

```text
User
 ├─ PersonalProfile ("About You")
 │    └─ seed facts, preferences
 ├─ GlobalMemory (Supermemory / memory_items)
 │    └─ learned facts, habits, decisions
 └─ Projects *
      ├─ ProjectFiles *
      ├─ Chats *
      │    └─ Messages *
      ├─ ProjectSummaries (session/daily/weekly)  [M5]
      └─ ProjectFacts / Decisions                 [M5]
```

---

## 3. Layers in Detail

### 3.1 Knowledge Layer (Storage & Representation)

The Knowledge Layer is everything Bobo **knows or has seen**, regardless of whether it’s currently relevant.

Components:

- **Raw artifacts**
  - Chat messages (per‑chat, per‑project).
  - Project files (markdown; later PDFs, repos, URLs).
  - “About You” doc(s) – stable personal context.
- **Derived artifacts**
  - **Embeddings** for messages and file chunks (pgvector; Loop B).
  - **Summaries** (per‑chat compression, then session/daily/weekly) [M5].
  - **Fact triples** (subject / predicate / object) extracted from chats and docs [M5].
  - **Global Memory records** (via Supermemory, or local fallback).

Think of this layer as a structured, queryable “memory palace basement”:

```text
               Knowledge Layer (Basement Storage)
┌─────────────────────────────────────────────────────────┐
│ Raw Logs: Chats, Messages, Files                        │
│  - Per-project text                                     │
│  - Cross-project logs                                   │
│                                                         │
│ Derived: Embeddings, Summaries, Facts, Global Memory    │
│  - Vector index (files + messages)                      │
│  - Hierarchical summaries (session → weekly) [M5]       │
│  - Fact store (decisions, tech choices, preferences)    │
│  - User Bio & About-You documents                       │
└─────────────────────────────────────────────────────────┘
```

Principles:

- **Separation of concerns** – store raw logs cheaply; derive higher‑order artifacts asynchronously (embeddings, summaries, facts).
- **Non‑destructive compression** – when compressing chats for context, archive original logs (cold storage) and store summaries, rather than deleting outright (M5).
- **Typed knowledge** – distinguish between:
  - Episodic events (chat sessions, conversations).
  - Semantic facts (project decisions, preferences).
  - Personal identity traits (Bio).
  - Procedural knowledge (how user likes to work).

### 3.2 Context Layer (Working Memory / Active Prompt)

The Context Layer is the **small, curated subset** of the Knowledge Layer used to answer the **current** user query. It is constrained by model context windows and token budgets.

Today (already implemented):

- **Loop A – Project Context**
  - Pulls project files & custom instructions.
  - Uses Anthropic / Gemini prompt caching when available.
- **Loop B – Global Context**
  - Hybrid pgvector search across all projects.
  - Returns “inspiration” snippets plus project names.
- **Chat History + Compression**
  - Recent messages + system/compression summaries (RECENT_MESSAGE_COUNT).

Planned (M3/M5):

- **User Profile Injection (Bio / About You)**
  - Stable traits (role, skill level, preferences) from personal profile.
  - Dynamic traits from global memory (recent preferences, decisions).
- **Context Governance**
  - Rules for what can enter the prompt, how conflicts are resolved, and how to avoid bloat.

Context assembly pipeline:

```text
User Query
    │
    ▼
┌───────────────┐
│ Context Layer │
├───────────────┤
│ 1. System base prompt                        │
│ 2. User Bio & About-You                      │
│ 3. Project custom instructions               │
│ 4. Project files (Loop A)                    │
│ 5. Global inspiration (Loop B)               │
│ 6. Recent chat messages + summaries          │
│ 7. Retrieved Global Memory facts (M3)        │
└───────────────┘
    │
    ▼
LLM Call → Response → Persist back to Knowledge Layer
```

Design goals:

- **Relevance‑first** – only include material that directly helps answer the current question.
- **Layered priority** – e.g.:
  1. Safety / alignment instructions.
  2. User Bio (who you are).
  3. Active project ground truth (files, instructions).
  4. Global inspiration.
  5. Recent local history.
- **Token budgeting** – a configurable token budget manager decides:
  - Maximum tokens for each context slice (Bio, project, global, history).
  - When to compress history or drop older global context.

### 3.3 Cognitive Layer (Cortex / Executive)

The Cognitive Layer is where Bobo transforms scattered memories into **coherent narratives and concepts**:

- **Per‑project Living Docs** (“Project Brain”) – status, architecture, open questions, risks [M5‑1].
- **Hierarchical Summaries** – session, daily, weekly, monthly [M5‑2, M5‑4].
- **Knowledge Graph / Facts** – structured facts, relationships, and trends [M5‑5…M5‑7].
- **Executive Briefs** – weekly/periodic summaries per user and project [M5‑8].

```text
                      Cognitive Layer
┌────────────────────────────────────────────────┐
│ Project Brains                                 │
│  - Current status                              │
│  - Key decisions & constraints                 │
│  - Open questions                              │
│                                                │
│ Hierarchical Summaries                         │
│  - Session → Daily → Weekly → Monthly          │
│                                                │
│ Knowledge Graph                                │
│  - (Project) --(uses)--> (Tech)                │
│  - (User)   --(prefers)--> (Tool)              │
│  - (Date)   --(decision)--> (Architecture)     │
│                                                │
│ Executive Briefs                               │
│  - “What did I focus on this week?”            │
│  - “What changed across all projects?”         │
└────────────────────────────────────────────────┘
```

This layer:

- **Reads** from the Knowledge Layer (logs, summaries, facts).  
- **Informs** the Context Layer (e.g. injecting “this project’s architecture” or “user’s global constraints” when relevant).  
- **Surfaces** insights to the user in human‑readable forms (briefs, dashboards, living docs).

---

## 4. Flows: From Conversation to Memory and Back

### 4.1 Write Path (New Message Arrives)

```text
User Message
    │
    ▼
Chat API
    │
    ├─► Persist raw Message (Knowledge Layer)
    │
    ├─► Generate embedding (pgvector) → store
    │
    ├─► Update per-chat & per-project stats
    │
    └─► Enqueue background jobs:
           - Compression (if history large)
           - Summary updates (session/daily) [M5]
           - Fact extraction [M5]
           - Global memory extraction (M3)
```

Over time:

- Chats become **summaries + key facts** (episodic → semantic).
- High‑value patterns are promoted to:
  - Project Brain (Cognitive Layer).
  - Global Memory (preferences, consistent decisions).

### 4.2 Read Path (Answering a Question)

```text
User Question
    │
    ▼
Determine scope:
  - Is there an active project?
  - Is this cross-project / global?
    │
    ▼
Retrieve:
  - Project files & instructions (Loop A)
  - Global hybrid search results (Loop B)
  - Relevant summaries (session/daily/weekly) [M5]
  - Global memory facts (M3)
  - User Bio & About-You
    │
    ▼
Assemble Context Layer (prompt)
    │
    ▼
LLM → Response
    │
    ▼
Persist assistant message + any new facts/insights
```

### 4.3 Inter‑Project vs Intra‑Project Context

We differentiate **intra‑project** and **inter‑project** behaviors:

- **Intra‑project** (within a project)
  - Loop A: treat project files + instructions as primary ground truth.
  - Use project‑scoped facts and summaries preferentially.
  - Only pull cross‑project inspiration when explicitly helpful.

- **Inter‑project / global** (across projects)
  - Loop B: hybrid search across all projects (pgvector + text).
  - Project Brain summaries feed into cross‑project insights.
  - Knowledge graph answers meta‑questions (“Which projects use Supabase?”, “When did I switch to Tailwind?”).

ASCII view:

```text
                [Project A]        [Project B]        [Project C]
                 Files, Chats      Files, Chats      Files, Chats
                     │                │                │
                     ▼                ▼                ▼
                 Summaries         Summaries         Summaries
                 Facts (A)         Facts (B)         Facts (C)
                     │                │                │
                     └─────► Global Knowledge Graph ◄──┘
                                 (Inter-project)
```

---

## 5. Personal Context: Bio, “About You” Docs, and Learned Memory

Personal context has **two sources**:

1. **User‑submitted profile (“About You” doc)**
   - Stable information: background, role, long‑term projects, values, preferences.
   - Created/edited via M3‑12 settings UI; optionally uploaded as a markdown doc.
   - Treated as **authoritative** until the user edits it.

2. **Learned global memory (M3)**
   - Extracted automatically from chats (every N messages, or daily).
   - Stored in Supermemory or local `memory_items`.
   - Includes:
     - Persistent preferences (editor, stack, style).
     - Long‑term goals (“building Bobo as personal OS”).
     - Repeated decisions and patterns.

Relationship:

```text
User
 ├─ About-You Profile  (manual, authoritative)
 └─ Global Memory      (automatic, probabilistic)
```

### 5.1 How They Interact

- **Seeding** – On first run of M3:
  - Initialize global memory from the About‑You profile.
  - Mark these seeds as high‑confidence facts.

- **Reconciliation**
  - If learned memory contradicts the profile (e.g. “prefers Remix now”), Bobo:
    - Lowers confidence on the older fact.
    - Surfaces a prompt in `/memory` or settings: “You used to prefer Next.js; you now often choose Remix. Update your profile?”

- **Injection into Context**
  - The Context Layer pulls:
    - From About‑You for stable identity fields (role, domain).
    - From Global Memory for dynamic, behavioral patterns (current stack, recent decisions, active themes).
  - Injection rules (M3‑9) govern:
    - What goes into **every** prompt (e.g. role, broad preferences).
    - What is injected **conditionally** (only when relevant to the project or question).

ASCII:

```text
          Personal Context Sources

        ┌─────────────────────────────┐
        │ About-You Profile (UI Doc) │  ◄────── user edits
        └─────────────▲──────────────┘
                      │ seeds
                      │
        ┌─────────────┴──────────────┐
        │   Global Memory Store      │  ◄────── extracted from chats
        │ (Supermemory / memory_items│
        └─────────────▲──────────────┘
                      │
                      │ selected facts
                      ▼
               Context Layer (Prompt)
```

---

## 6. Neuroscience & Psychology Inspirations

The design borrows from how human memory works:

### 6.1 Hippocampus vs Cortex

- **Hippocampus (Bobo: Knowledge Layer + compression path)**
  - Stores episodic memories (entire conversations).
  - Bobo mirrors this with raw chat logs and project events.
  - Compression (summaries) approximates overnight consolidation: many experiences → stable summary.

- **Neocortex (Bobo: Cognitive Layer)**
  - Stores semantic knowledge and concepts (facts, schemas).
  - Bobo’s fact store and Project Brains are the cortical representation of past chats/files.

### 6.2 Working Memory (Context Layer)

- Human working memory holds a few items at once; Bobo’s equivalent is the **prompt window**.
- Token budgeting and context selection mirror:
  - **Attention** – highlight items most relevant to the current task.
  - **Priming** – adding Bio/Project context influences what the model “thinks of first”.

### 6.3 Consolidation & Forgetting

- In humans, not every experience survives; significance, repetition, and emotion matter.
- In Bobo:
  - Frequent patterns get promoted into Global Memory or the knowledge graph.
  - Low‑signal details live only in raw logs and/or short‑lived summaries.
  - Compression thresholds and relevance filters implement an intentional “forgetting” mechanism to prevent overload.

### 6.4 Self‑Model & Identity

- People maintain a narrative identity (“I’m a developer who prefers X, is working on Y”).  
- Bobo:
  - Uses the About‑You doc as the **explicit self‑narrative**.
  - Uses Global Memory to refine and extend that narrative over time.
  - The Cognitive Layer can surface narrative summaries (“You’ve been focusing heavily on RAG and memory systems this month”).

---

## 7. Roadmap Alignment

Mapping this vision to existing milestones and backlog items:

- **M2 – Project Intelligence**
  - Fully implements the core of the Knowledge + Context Layers for project‑scoped knowledge:
    - File upload, hybrid search, Loop A & Loop B.
    - Inline citations (explainable RAG).

- **M3 – User Profile & Bio**
  - Builds personal context into the architecture:
    - M3‑1…M3‑4: Supermemory integration and Bio extraction.
    - M3‑5…M3‑7: `/memory` UI, edit/delete, auto‑memory toggle.
    - M3‑8…M3‑10: Memory schema, injection rules, memory debugger.
    - M3‑11…M3‑13: About‑You profile schema + UI + injection (personal context seed).

- **M4 – Production & Scale**
  - Extends everything to multiple users and teams:
    - Per‑user Bio and Global Memory.
    - RLS and auth to isolate each user’s memory palace.

- **M5 – Cognitive Layer & Living Documentation**
  - Realizes the Cognitive Layer:
    - Per‑project living docs and Project Brains.
    - Hierarchical summaries (session, daily, weekly).
    - Fact extraction and graph queries.
    - Executive weekly briefs.

---

## 8. Implementation Guardrails

To keep this system reliable and user‑friendly:

- **Transparency & Control**
  - `/memory` and settings UIs must let the user:
    - Inspect what Bobo “believes” about them.
    - Edit or delete any memory.
    - See when personal context was used in a response (M3‑10 debugger).

- **Token Discipline**
  - Context assembly should enforce budgets per layer (Bio, project, global, history).
  - Avoid unbounded growth of prompt size as memory increases.

- **Safety & Privacy**
  - Personal Bio and memories must be treated as sensitive.
  - For multi‑user, enforce per‑user scoping and RLS; no cross‑leaks.

- **Observability**
  - Log which memories and context slices contributed to a response (for debugging).
  - Provide developer tools to inspect context construction for a given answer.

This document should be revisited at every major memory‑related milestone (end of M3 and M5) to ensure the vision matches reality and to capture new patterns learned from actual usage. 

