# Sprint Management

**Purpose:** Track sprint planning, execution, and retrospectives
**Last Updated:** November 28, 2025
**Current Sprint:** [M3.5-02](active/sprint-m35-02.md) - Gap Fixes & Quality Hardening

---

## Sprint Planning Agent

**ALWAYS use the Sprint Planning Agent when starting a new sprint.**

```
@sprint-planning-agent let's plan the next sprint
```

The agent enforces quality gates learned from M3.5-01 post-mortem:
- Pre-sprint audit of integration surface
- Explicit testing tasks (not time buckets)
- Definition of Done per task
- Validation of "reuse existing code" assumptions
- Sub-agent instructions with verification steps

**Files:**
- Agent: `.claude/agents/sprint-planning-agent.md`
- Templates: `.claude/skills/sprint-planning/SKILL.md`

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

### 0. Invoke Sprint Planning Agent (REQUIRED)

```
@sprint-planning-agent let's plan {sprint name}
```

The agent will guide you through:
1. **Scoping** - Goal, integration surface, reusable code validation
2. **Task Definition** - Atomic tasks with DoD, explicit testing tasks
3. **Capacity Planning** - 65% impl, 20% testing, 10% docs, 5% buffer
4. **Quality Gates** - Pre-sprint checklist, human approval

### 1. Planning (create folder structure and documents)

```bash
# Create sprint-specific folder
mkdir -p active/{MILESTONE}-{NUMBER}/testing
mkdir -p active/{MILESTONE}-{NUMBER}/reports

# Copy sprint plan template
cp templates/sprint-template.md active/{MILESTONE}-{NUMBER}/sprint-{milestone}-{number}.md

# Copy and place handover in shared folder
cp handover/HANDOVER_TEMPLATE.md handover/HANDOVER_{MILESTONE}-{NUMBER}.md
```

Fill in:
- **Sprint Plan** (`active/M##-##/sprint-m##-##.md`): Tasks, estimates, dates, demo script
- **Handover** (`handover/HANDOVER_{MILESTONE}-{NUMBER}.md`): Setup, code patterns, gotchas
- **DoD per Task:** Use templates from `.claude/skills/sprint-planning/SKILL.md`

### 2. Execution (update and organize artifacts)

**During sprint:**
```
Day 1: Update sprint plan daily progress section
Day 2: Update sprint plan daily progress
...
Demo: Run demo script
```

**As testing/reports are generated, organize them:**
```
active/M##-##/testing/
├── QA_REPORT.md
├── TEST_PLAN.md
└── TEST_EXECUTION_SUMMARY.md

active/M##-##/reports/
├── API_INTEGRATION_REPORT.md
├── COMPLETION_REPORT.md
└── POST_MORTEM.md (if failures occurred)
```

### 3. Completion (archiving)

**When sprint is done:**

1. **Fill sprint retrospective:**
   - Update `active/M##-##/sprint-m##-##.md` with "What Went Well", "What Didn't Go Well", "Learnings"

2. **Move entire sprint folder to completed:**
   ```bash
   mv active/M##-##/ completed/M##-##/
   ```

3. **Handover document stays in `handover/`** (reference for future sprints)

**Result:**
```
completed/M##-##/
├── sprint-m##-##.md
├── POST_MORTEM.md
├── COMPLETION_REPORT.md
├── testing/
│   ├── QA_REPORT.md
│   ├── TEST_PLAN.md
│   └── TEST_EXECUTION_SUMMARY.md
└── reports/
    ├── API_INTEGRATION_REPORT.md
    └── other reports...
```

---

## Current Sprints

| Sprint | Milestone | Duration | Status | Folder |
|--------|-----------|----------|--------|--------|
| [M3.5-02](active/M35-02/sprint-m35-02.md) | Gap Fixes & Quality Hardening | Nov 28 - Dec 2 | 🟡 In Progress | `active/M35-02/` |
| [M4-01](active/M4-01/sprint-m4-01.md) | Agent SDK | Nov 26 - Dec 10 | 🟢 Ready | `active/M4-01/` |

**Execution Guides:**
- [HANDOVER_M35-02.md](handover/HANDOVER_M35-02.md)
- [HANDOVER_M4-01.md](handover/HANDOVER_M4-01.md)

---

## Completed Sprints

| Sprint | Duration | Tasks | Folder | Status |
|--------|----------|-------|--------|--------|
| [M3-03](completed/M3-03/sprint-m3-03.md) | Nov 24 | 7 | `completed/M3-03/` | ✅ Archived |
| [M3-02](completed/M3-02/sprint-m3-02.md) | Nov 24 | 12 | `completed/M3-02/` | ✅ Archived |
| [M3-01](completed/M3-01/sprint-m3-01.md) | Nov 24 | 4 | `completed/M3-01/` | ✅ Archived |
| [M2-01](completed/M2-01/sprint-m2-01.md) | Jan 15-23 | 18 | `completed/M2-01/` | ✅ Archived |
| [V1-02](completed/V1-02/sprint-v1-02.md) | Nov 16-22 | 10 | `completed/V1-02/` | ✅ Archived |
| [V1-01](completed/V1-01/sprint-v1-01.md) | Nov 1-15 | 6 | `completed/V1-01/` | ✅ Archived |

**Total:** 6 sprints, 57 tasks

**Note:** Older sprints (M3-03 and earlier) may not yet have the new folder structure. They will be reorganized as needed.

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
├── README.md                          # This file
├── active/                            # Current/in-progress sprints
│   ├── M35-01/                        # Sprint-specific folder
│   │   ├── sprint-m35-01.md           # Sprint plan (tracking)
│   │   ├── POST_MORTEM_M35-01.md      # Analysis of execution
│   │   ├── COMPLETION_REPORT.md       # Deliverables summary
│   │   ├── testing/
│   │   │   ├── QA_REPORT.md
│   │   │   ├── TEST_PLAN.md
│   │   │   └── TEST_EXECUTION_SUMMARY.md
│   │   └── reports/
│   │       ├── API_INTEGRATION_REPORT.md
│   │       └── other reports...
│   ├── M35-02/
│   │   ├── sprint-m35-02.md           # Sprint plan
│   │   ├── BACKEND_FIX_REPORT.md
│   │   └── testing/
│   └── README.md
├── handover/                          # Execution guides (shared)
│   ├── HANDOVER_M35-01.md             # How to do M35-01
│   ├── HANDOVER_M35-02.md             # How to do M35-02
│   ├── HANDOVER_TEMPLATE.md
│   └── README.md
├── completed/                         # Completed sprint archives
│   ├── M35-01/                        # Entire active/M35-01/ moved here
│   │   ├── sprint-m35-01.md
│   │   ├── POST_MORTEM_M35-01.md
│   │   ├── testing/
│   │   └── reports/
│   ├── M4-01/
│   │   └── sprint-m4-01.md
│   ├── M3-03/
│   │   └── sprint-m3-03.md
│   └── ...
├── templates/
│   ├── sprint-template.md             # Sprint plan template
│   ├── sprint-folder-structure.txt    # This structure
│   └── README.md
└── README.md (this file)
```

**Key principle:** Sprint artifacts stay organized by milestone ID in `active/` while in progress, then move en masse to `completed/` when finished.

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
