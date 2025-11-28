# Active Sprints

This folder contains sprints currently in progress, organized by milestone ID.

**Last Updated:** November 28, 2025

---

## Organization Structure

Each sprint gets its own folder with a consistent structure:

```
active/
├── M##-##/                      # Sprint-specific folder
│   ├── sprint-m##-##.md         # Sprint plan (main tracking doc)
│   ├── POST_MORTEM.md           # Analysis if issues found
│   ├── COMPLETION_REPORT.md     # Summary of deliverables
│   ├── testing/
│   │   ├── QA_REPORT.md
│   │   ├── TEST_PLAN.md
│   │   └── TEST_EXECUTION_SUMMARY.md
│   └── reports/
│       ├── API_INTEGRATION_REPORT.md
│       └── other reports...
└── README.md
```

**Key principle:** All sprint artifacts stay organized in the sprint's folder while in progress. When complete, the entire folder moves to `docs/sprints/completed/M##-##/`.

---

## Handover Documents

Handover documents (execution guides) are NOT stored in sprint folders. They live in the shared folder:
- **Location:** `docs/sprints/handover/HANDOVER_M##-##.md`
- **Purpose:** Execution guides stay in one place for reference by all sprints
- **Lifecycle:** Created during planning, used during execution, archived after sprint

---

## Current Active Sprints

| Sprint | Status | Plan | Handover |
|--------|--------|------|----------|
| None | All M3.5 sprints complete | - | - |

**Note:** M3.5 milestone fully complete as of November 29, 2025. All sprint files moved to `completed/` folder.

### Recently Completed (Awaiting Next Sprint Planning)
- M35-01: Agent Memory Tools Implementation - ✅ Complete
- M35-02: Quality Hardening & Gap Fixes - ✅ Complete (100% Ship Ready)
- M4-01: Agent Mode Foundation - ✅ Complete

---

## Sprint Lifecycle

### 1. Planning Phase
```bash
# Create sprint folder with subfolders
mkdir -p M##-##/{testing,reports}
cp ../../templates/sprint-template.md M##-##/sprint-m##-##.md
```

### 2. Execution Phase
- Update sprint plan daily with progress
- Generate testing and reports artifacts
- Place artifacts in appropriate subfolders (testing/ or reports/)

### 3. Completion Phase
```bash
# Fill in retrospective
# Then move to completed
mv M##-##/ ../completed/M##-##/
```

---

## Quick Access

**To track a sprint's progress:**
- Open `M##-##/sprint-m##-##.md` - Daily log, backlog, metrics

**To execute a sprint:**
- Open `../handover/HANDOVER_M##-##.md` - Setup, code patterns, testing

**To review testing:**
- Check `M##-##/testing/` folder for QA reports and test results

**To view completion status:**
- Check `M##-##/reports/` folder for completion and integration reports
