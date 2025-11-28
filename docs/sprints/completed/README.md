# Completed Sprints

This folder archives sprints that have been completed and shipped, organized by milestone ID.

**Last Updated:** November 28, 2025

---

## Organization Structure

Each completed sprint is archived with its full history:

```
completed/
├── M##-##/                      # Completed sprint folder
│   ├── sprint-m##-##.md         # Sprint plan + retrospective
│   ├── POST_MORTEM.md           # Any issues found and lessons learned
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

**Key principle:** Entire sprint folder (including all artifacts) is moved here when sprint is complete.

---

## Handover Documents

Handover documents remain in `docs/sprints/handover/` for reference and future planning:
- `handover/HANDOVER_M##-##.md`

These are NOT archived with the sprint because they may be useful for future similar sprints.

---

## Accessing Completed Sprint Information

**To review a completed sprint:**
1. Open `M##-##/sprint-m##-##.md` - Full sprint history including retrospective
2. Check `M##-##/POST_MORTEM.md` - Any issues and lessons learned
3. Review `M##-##/testing/` - Full test coverage and results
4. Check `M##-##/reports/` - Completion and integration reports

**To reference a sprint's execution:**
1. Open `../handover/HANDOVER_M##-##.md` - How the sprint was executed

---

## Sprint Archive

| Sprint | Milestone | Duration | Tasks | Status | Folder |
|--------|-----------|----------|-------|--------|--------|
| **M35-02** | Agent Memory (Quality) | Nov 28-29 | 8 | ✅ 100% Ship Ready | `sprint-m35-02.md` |
| **M35-01** | Agent Memory (Impl) | Nov 27-28 | 7 | ✅ Complete | `sprint-m35-01.md` |
| **M4-01** | Agent Mode Foundation | Nov 26-27 | 5 | ✅ Complete | `sprint-m4-01.md` |
| M3-03 | Memory CRUD | Nov 24 | 7 | ✅ Complete | `sprint-m3-03.md` |
| M3-02 | Gemini Extraction | Nov 24 | 12 | ✅ Complete | `sprint-m3-02.md` |
| M3-01 | Profile System | Nov 24 | 4 | ✅ Complete | `sprint-m3-01.md` |
| M2-01 | Double-Loop RAG | Jan 15-23 | 18 | ✅ Complete | `sprint-m2-01.md` |
| V1-02 | E2E Tests | Nov 16-22 | 10 | ✅ Complete | `sprint-v1-02.md` |
| V1-01 | Persistence | Nov 1-15 | 6 | ✅ Complete | `sprint-v1-01.md` |

**Last Updated:** November 29, 2025

**Note:** M3.5 milestone (Agent Memory Tools) fully completed on Nov 29, 2025 after resolving all embedding blockers.

---

## Learning from Completed Sprints

Each completed sprint provides value:

1. **Retrospectives** - What went well, what didn't, lessons learned
2. **Post-mortems** - If issues occurred, how they were handled
3. **Test reports** - Coverage and quality metrics for reference
4. **Handovers** - Reusable patterns and processes from execution

Reference these when planning future sprints to avoid repeating mistakes and reinforce successful patterns.
