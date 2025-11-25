# Bobo AI Chatbot – Product Roadmap

> ⚠️ **DEPRECATED - DO NOT USE**
>
> **This document is no longer maintained as of November 25, 2025.**
>
> The product roadmap has been consolidated into the **Product Backlog** document.
>
> **Please refer to:** `docs/PRODUCT_BACKLOG.md`
> - Section: "Card Groups & Overall State" for milestone overview
> - Individual milestone sections (M3, M4, M5) for detailed planning
> - "Backlog Metrics" section for timeline and effort estimates
>
> This file is kept for historical reference only.

---

~~**Last Updated:** November 23, 2025~~
~~**Scope:** High-level timeline from initial prototype to future milestones. For granular status, see `docs/PROGRESS_TRACKER.md` and `docs/PRODUCT_BACKLOG.md`.~~

---

## 1. Timeline Overview (Phases)

| Phase ID | Name                              | Status      | Approx Start | Approx End   |
|---------:|-----------------------------------|-------------|-------------:|--------------|
| M0       | Core Chat Interface (MVP)         | ✅ Shipped  | 2025 Q1      | 2025 Q2      |
| M1       | Persistence Foundation            | ✅ Shipped  | 2025 Q3      | 2025 Q3      |
| V1.1     | Bug Fixes & Polish                | ✅ Shipped  | 2025 Q3      | 2025 Q4      |
| M2       | Project Intelligence (Double-Loop)| ✅ Shipped  | 2025 Q4      | 2025 Q4      |
| M3       | User Profile & Bio (Global Memory)| 📝 Planned  | 2026 Q1      | 2026 Q1–Q2   |
| M4       | Production & Scale                | 📝 Backlog  | 2026 Q2      | 2026 Q3–Q4   |
| M5       | Cognitive Layer & Living Docs     | 📝 Backlog  | 2026 Q3+     | Ongoing      |

> Note: Quarters are approximate and meant for sequencing, not exact scheduling. See the tracker and backlog for detailed dates and tasks.

---

## 2. Simple Gantt View (Approximate)

```text
Time Axis →         2025                          2026
                    Q1     Q2     Q3     Q4       Q1     Q2     Q3+
-----------------------------------------------------------------------
M0  Core Chat       █████████

M1  Persistence                   █████

V1.1 Bugfix & Polish              █████████

M2  Project Intelligence                        ███████

M3  User Profile & Bio                                 ███████

M4  Production & Scale                                         █████████████

M5  Cognitive Layer & Living Docs                                     ███████…
```

Legend:
- Each `█` block ≈ a few weeks of focused work.
- Overlaps indicate phases that can share calendar time (e.g., polish and intelligence work).

---

## 3. Phase Summaries

### M0 – Core Chat Interface (MVP)
- **Focus:** Streaming chat UI, model selector, context tracking, in-memory compression, basic projects UI.
- **Outcome:** A fully usable local MVP without persistence, suitable for early dogfooding.

### M1 – Persistence Foundation
- **Focus:** Supabase schema, project/chat/message tables, streaming persistence, sidebar + project pages backed by real data, error boundaries, skeleton loading.
- **Outcome:** V1 “real app” where chats and projects survive refresh and basic flows are production-ready.

### V1.1 – Bug Fixes & Polish
- **Focus:** Viewport disappearing bug, router issues, E2E tests for creation flows, background compression, CI/CD, UX cleanup.
- **Outcome:** Stable daily driver with fewer sharp edges; ready for sustained personal use.

### M2 – Project Intelligence (Double-Loop)
- **Focus:** File upload & storage, pgvector + hybrid search, Loop A (project context), Loop B (global inspiration), inline citations.
- **Outcome:** True “project brain” per workspace, with explainable RAG and source attribution.

### M3 – User Profile & Bio (Global Memory)
- **Focus:** Supermemory integration, bio extraction jobs, `/memory` UI, edit/delete controls, auto-memory toggle, plus memory schema, injection rules, and a memory debugger.
- **Outcome:** Bobo behaves like a personal AI that remembers who you are and how you like to work across projects.

### M4 – Production & Scale
- **Focus:** Auth, multi-user, teams, RLS, analytics (usage, cost, token history), error tracking, performance monitoring, staging/CI/CD hardening.
- **Outcome:** Multi-user, team-ready deployment with observability and guardrails for real-world usage.

### M5 – Cognitive Layer & Living Documentation
- **Focus:** Per-project living docs, hierarchical summaries (session → daily → weekly), fact extraction and lightweight knowledge graph, executive weekly briefs.
- **Outcome:** Bobo becomes a “Memory Palace” with project brains, trend views, and cross-project decision intelligence built on top of the existing chat + RAG foundation.

---

## 4. Usage vs. Development Cadence

To prevent endless building without shipping to yourself:

- After each shipped phase (M0, M1, V1.1, M2, …), reserve **1–2 weeks** for using Bobo as your primary assistant, fixing only bugs and papercuts.
- Start **M3** only once you consistently feel the pain of re-stating your identity and preferences.
- Start **M4** when you genuinely want to invite additional users/teams.
- Start **M5** after you have months of real conversations and feel the need for weekly reviews and project “brains”.

This roadmap is deliberately high-level; adjust quarter allocations as you learn from actual usage.

