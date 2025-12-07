# Project Brief: The Cognitive Core (Bobo "Brain" Infrastructure)

**Version:** 1.0
**Date:** November 29, 2025
**Project Type:** Core Infrastructure / R&D
**Strategic Goal:** Build a proprietary "Second Brain" architecture to serve as the IP moat for future AI-Native products (CRM, Content Strategy).

---

## 1. Executive Summary

We are evolving the "Bobo" AI agent from a standard RAG-based chatbot into a **Cognitive Agent** with a biologically-inspired memory system.

Currently, LLMs are "stateless savants"—they have general intelligence but no continuity. Standard solutions (Vector Databases) act as static hard drives, accumulating noise and duplicates without synthesis.

**The Goal:** Build a **"Living Memory" system** that mimics biological processes:
1.  **Forgetting:** Information decays over time unless accessed (Ebbinghaus Curve).
2.  **Reinforcement:** Repetition strengthens memory rather than creating duplicates (Hebbian Learning).
3.  **Consolidation:** Raw episodes are synthesized into semantic wisdom during "sleep" cycles (CLS Theory).

**The Decision:** We will **BUILD** a custom architecture on Postgres/Supabase ("Pragmatic Neuroscience"), rejecting off-the-shelf wrappers (Zep/Mem0) to ensure we own the intellectual property and cognitive logic required for our long-term product vision.

---

## 2. Strategic Context & The "Moat"

### The Business Case
We are not just building a chatbot; we are building the infrastructure for a **Second Brain**. This infrastructure is the "wedge" into high-value B2B applications:
*   **AI-Native CRM:** Understanding client relationships over months, not just storing contact details.
*   **Strategy Platforms:** Synthesizing hundreds of conversations to find strategic patterns (e.g., "Founder A's pricing issues resemble Founder B's").

### The Product Vision: "The Brain API"
We are treating the memory system not as a feature of Bobo, but as a **standalone "Brain as a Service" platform**. 
*   **Bobo** is simply the first client application.
*   Future apps (CRM, Content Tool) will connect to this same "Brain API" to access shared user wisdom.
*   This decoupling ensures our architecture is robust, scalable, and reusable.

### The Verdict: Build
We will **BUILD** a custom architecture, rejecting off-the-shelf wrappers (Zep/Mem0). To build a moat, we must own the brain logic.

---

## 3. Theoretical Foundation (Neuroscience in Silicon)

Our architecture is grounded in three core neuroscientific principles validated by our research phase:

### 3.1 Complementary Learning Systems (CLS) Theory
The brain has two learning systems:
*   **Hippocampus (Fast Learning):** Rapidly captures specific episodes (e.g., "User mentioned a bug in the div tag today").
*   **Neocortex (Slow Learning):** Slowly integrates structured knowledge (e.g., "User struggles with CSS").
*   **Implementation:** We will use **Vectors** for the Hippocampus (Episodic) and **Consolidated Summaries** for the Neocortex (Semantic), linked via a background "Sleep" process.

### 3.2 The Ebbinghaus Forgetting Curve
Biological memory is efficient because it forgets. Information availability should decay exponentially over time unless reinforced.
*   **Implementation:** A mathematical decay function in our search query (`Recency * Relevance`).

### 3.3 Hebbian Learning
*"Neurons that fire together, wire together."*
When a user repeats a fact, the brain does not store a second copy; it strengthens the synaptic connection of the existing memory.
*   **Implementation:** Updating existing database rows (incrementing `confidence` and `access_count`) on near-matches instead of inserting duplicates.

---

## 4. Architecture: "Pragmatic Neuroscience"

We will avoid over-engineering (e.g., complex Graph Databases like Neo4j) in favor of **"Boring Technology"** pushed to its limit.

*   **Database:** Supabase (PostgreSQL)
*   **Vector Engine:** pgvector
*   **Compute:** Next.js (Real-time), Vercel Cron (Background Jobs)
*   **Cognitive Model:** Gemini Flash (High-volume, low-cost processing for consolidation)

### The Data Model
We move from a "Archive" model to a "Lifecycle" model:
1.  **Ingest (Sensory):** Raw user input.
2.  **Short-Term (Hippocampal):** Stored as vectors with high temporal weight.
3.  **Reinforcement (Hebbian):** Frequent access prevents decay.
4.  **Consolidation (Neocortical):** Background jobs summarize episodes into facts.
5.  **Decay (Pruning):** Unused memories fade into obscurity (low retrieval score) and are eventually archived.

### 4.1 Monolithic Architecture Strategy
**Decision:** We will build the Brain API **within the current repository** (`lib/brain/`), not as a separate microservice. 

**Reasoning:**
*   **Speed:** Avoids the "Distributed Monolith" trap (auth sync, dual deployment) during the critical experimental phase.
*   **Modularity:** We will enforce **strict logical separation**. `lib/brain` will function as an internal library that does *not* import from the UI layer.
*   **Future-Proofing:** This clean structure allows us to easily extract `lib/brain` into a standalone service/package when we actually launch the second client app (CRM).

**Directory Structure:**
```text
lib/
└── brain/               <-- The "Brain API" Module
    ├── index.ts         <-- Public Interface (remember, retrieve)
    ├── config.ts        <-- Neuro-Settings (decay rates, weights)
    ├── hippocampus/     <-- Fast Storage (Vectors, Recent Logs)
    ├── neocortex/       <-- Slow Storage (Consolidation jobs)
    └── types.ts         <-- Shared definitions
```

---

## 5. Implementation Roadmap

We will execute this in three distinct phases to manage complexity.

### Phase 1: The Pulse (Vital Signs)
**Goal:** Stop the bleeding. Prevent amnesia and duplication immediately. Make the memory feel "alive."
**Timeline:** Immediate (Sprint M3.5+)

*   **1.1 Schema Upgrade:**
    *   Add columns to `memory_entries`:
        *   `last_accessed` (Timestamp)
        *   `access_count` (Integer, default 1)
        *   `importance` (Float 0.0-1.0)
*   **1.2 Hebbian Write Tool (`remember_fact`):**
    *   *Current Logic:* Blind Insert.
    *   *New Logic:* Search first. If Similarity > 0.90, **UPDATE** existing row (increment count, refresh timestamp). Else, INSERT.
*   **1.3 Temporal Retrieval (`hybrid_memory_search`):**
    *   Update the SQL scoring function to include time decay.
    *   *Formula Concept:* `Final Score = (Vector Similarity * 0.7) + (Recency Boost * 0.2) + (Frequency Boost * 0.1)`
*   **1.4 Context-Aware Retrieval:**
    *   Inject the "Conversation Summary" (last 3 turns) into the embedding query, not just the user's last sentence.

### Phase 2: The Sleep (Consolidation)
**Goal:** Transform noise into wisdom. Enable the system to learn patterns over time.
**Timeline:** Medium Term (1 Month)

*   **2.1 The "Dream" Job:**
    *   A Vercel Cron job running nightly.
*   **2.2 Clustering & Synthesis:**
    *   Query memories created in the last 24h.
    *   Cluster by semantic similarity.
    *   LLM Prompt: "Synthesize these 5 related episodes into a single permanent fact."
*   **2.3 Semantic Promotion:**
    *   Write the new "Fact" to the database.
    *   Mark original episodes as `archived` (or soft-delete).

### Phase 3: The Graph (Association)
**Goal:** The "Second Brain." Enabling non-linear thinking and spreading activation.
**Timeline:** Long Term (Q2 2026)

*   **3.1 Graph Schema:**
    *   Simple `memory_edges` table (`source_id`, `target_id`, `type`).
*   **3.2 Associative Linking:**
    *   When the "Dream" job runs, identify relationships between new facts and old facts.
*   **3.3 Spreading Activation:**
    *   Update search to fetch not just direct matches, but "Neighbors" of matches.

---

## 6. Success Metrics

*   **Reduction in Duplicates:** Zero near-duplicate entries for repeated user facts.
*   **Retrieval Relevance:** "Recall @ K" improves for time-sensitive queries (e.g., "What was I working on *yesterday*?").
*   **Cognitive Persistence:** The agent references facts from 10+ turns ago without explicit prompting.
*   **System Efficiency:** Database size grows logarithmically (via consolidation), not linearly.

---

**Prepared for:** Development Team
**Approved by:** CTO / Architect
