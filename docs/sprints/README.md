# Sprint Management

**Purpose:** Track sprint planning, execution, and retrospectives
**Last Updated:** November 25, 2025
**Current Sprint:** [M4-01](active/sprint-m4-01.md) - Claude Agent SDK

---

## Two-Document System

**Every sprint has exactly TWO documents:**

| Document | Purpose | Contains | Does NOT Contain |
|----------|---------|----------|------------------|
| **Sprint Plan** | Tracking | Backlog, daily log, blockers, metrics, retro | Code, architecture, gotchas |
| **Handover** | Execution | Setup, code patterns, files to create, testing | Daily log, metrics, retro |

**Rule:** If it helps you PLAN/TRACK, it goes in Sprint Plan. If it helps you DO/CODE, it goes in Handover.

---

## Sprint Process

### 1. Planning (create both docs)

```bash
# Copy templates
cp templates/sprint-template.md active/sprint-{milestone}-{number}.md
cp handover/HANDOVER_TEMPLATE.md handover/HANDOVER_{MILESTONE}-{NUMBER}.md
```

Fill in:
- **Sprint Plan:** Tasks, estimates, dates, demo script
- **Handover:** Setup commands, code patterns, gotchas, success criteria

### 2. Execution (update sprint plan daily)

```
Day 1: Update daily progress
Day 2: Update daily progress
...
Demo: Run demo script
```

### 3. Completion (fill in retrospective)

```
Sprint Plan → Fill retrospective, metrics
Sprint Plan → Move to completed/
```

---

## Current Sprint

| Sprint | Milestone | Duration | Status |
|--------|-----------|----------|--------|
| [M4-01](active/sprint-m4-01.md) | Agent SDK | Nov 26 - Dec 10 | 🟢 Ready |

**Execution Guide:** [HANDOVER_M4-01.md](handover/HANDOVER_M4-01.md)

---

## Completed Sprints

| Sprint | Duration | Tasks | Highlights |
|--------|----------|-------|------------|
| [M3-03](completed/sprint-m3-03.md) | Nov 24 | 7 | Memory UI, CRUD |
| [M3-02](completed/sprint-m3-02.md) | Nov 24 | 12 | Gemini extraction |
| [M3-01](completed/sprint-m3-01.md) | Nov 24 | 4 | Profile system |
| [M2-01](completed/sprint-m2-01.md) | Jan 15-23 | 18 | Double-Loop RAG |
| [V1-02](completed/sprint-v1-02.md) | Nov 16-22 | 10 | E2E tests |
| [V1-01](completed/sprint-v1-01.md) | Nov 1-15 | 6 | Persistence |

**Total:** 6 sprints, 57 tasks

---

## Metrics

| Metric | Value |
|--------|-------|
| Sprints Completed | 6 |
| Tasks Delivered | 57 |
| Success Rate | 100% |

---

## Folder Structure

```
docs/sprints/
├── README.md              # This file
├── active/                # Current sprint
│   └── sprint-m4-01.md    # Sprint plan (tracking)
├── handover/              # Execution guides
│   ├── HANDOVER_M4-01.md  # How to do M4-01
│   └── HANDOVER_TEMPLATE.md
├── completed/             # Archive
└── templates/
    └── sprint-template.md
```

---

## Templates

- **Sprint Plan:** [templates/sprint-template.md](templates/sprint-template.md)
- **Handover:** [handover/HANDOVER_TEMPLATE.md](handover/HANDOVER_TEMPLATE.md)

---

## Links

- [Product Backlog](../PRODUCT_BACKLOG.md)
- [Project Brief](../PROJECT_BRIEF.md)
- [CLAUDE.md](../../CLAUDE.md)

---

**Last Updated:** November 25, 2025
