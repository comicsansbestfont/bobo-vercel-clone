# Sprint Management

**Purpose:** Track sprint planning, execution, and retrospectives for the Bobo AI Chatbot project
**Last Updated:** November 24, 2025
**Current Sprint:** [Sprint M3-02](active/sprint-m3-02.md) (Week 2 of M3) - Ready to Start Dec 1

---

## 🚀 Active Sprints

| Sprint | Milestone | Duration | Goal | Status | Progress |
|--------|-----------|----------|------|--------|----------|
| [M3-02](active/sprint-m3-02.md) | M3 - User Profile & Bio | Dec 1-7, 2025 | Hierarchical Memory Extraction | 📝 Ready | [Handover Doc](active/SPRINT_M3-02_HANDOVER.md) |

**Next Sprint:** [M3-03](active/sprint-m3-03.md) (Dec 8-14) - Claude-Style Memory UI

---

## 📅 Sprint Calendar

### Q4 2024
- **Nov 1-15, 2024:** Sprint V1-01 - Critical Path (Persistence Layer) ✅
- **Nov 16-22, 2024:** Sprint V1-02 - Polish & Testing ✅

### Q1 2025
- **Jan 15-23, 2025:** Sprint M2-01 - Double-Loop RAG Architecture ✅
- **Nov 24-30, 2025:** Sprint M3-01 - Personal Context Foundation ✅
- **Dec 1-7, 2025:** Sprint M3-02 - Hierarchical Memory Extraction 📝 Ready
- **Dec 8-14, 2025:** Sprint M3-03 - Claude-Style Memory UI 📝 Planned
- **Dec 15-21, 2025:** Sprint M3-04 - Advanced Memory Features 📝 Planned

### Q2 2025
- **TBD:** Sprint M4-01 - Authentication & Multi-User (Planned)

---

## 📊 Upcoming Sprints

| Sprint | Milestone | Planned Start | Goal | Estimated Hours |
|--------|-----------|---------------|------|-----------------|
| M3-02 | M3 - User Profile & Bio | Dec 1, 2025 | GPT-4o-mini extraction pipeline | 16h |
| M3-03 | M3 - User Profile & Bio | Dec 8, 2025 | /memory page with hierarchical UI | 15h |
| M3-04 | M3 - User Profile & Bio | Dec 15, 2025 | Provenance, debugging, token limits | 13h |
| M4-01 | M4 - Production & Scale | TBD | Authentication & Multi-User | TBD |

---

## ✅ Completed Sprints

### Milestone 3: User Profile & Bio Memory (In Progress)

| Sprint | Duration | Goal | Completion | Velocity | Highlights |
|--------|----------|------|------------|----------|------------|
| [M3-01](completed/sprint-m3-01.md) | Nov 24-30, 2025 | Personal Context Foundation | 100% | 4 tasks | Manual profile, system prompt injection, memory schema v2.0 |

**M3 Sprint 1:** 4.5 actual hours (55% under 10h estimate - excellent efficiency!)

### Milestone 2: Project Intelligence (Double-Loop RAG)

| Sprint | Duration | Goal | Completion | Velocity | Highlights |
|--------|----------|------|------------|----------|------------|
| [M2-01](completed/sprint-m2-01.md) | Jan 15-23, 2025 | Implement Double-Loop RAG with citations | 100% | 18 tasks | Loop A+B, pgvector, inline citations |

**M2 Total:** 1 sprint, 3 weeks, 18 tasks completed

### Milestone 1: Critical Path & Polish

| Sprint | Duration | Goal | Completion | Velocity | Highlights |
|--------|----------|------|------------|----------|------------|
| [V1-02](completed/sprint-v1-02.md) | Nov 16-22, 2024 | Polish, E2E tests, CI/CD | 100% | 10 tasks | Viewport bug fix, Playwright tests, GitHub Actions |
| [V1-01](completed/sprint-v1-01.md) | Nov 1-15, 2024 | Replace all mock data | 100% | 6 tasks | Full persistence layer, database integration |

**V1 Total:** 2 sprints, ~3 weeks, 16 tasks completed

---

## 📈 Sprint Metrics & Velocity

### Overall Project Health

| Metric | Value | Trend |
|--------|-------|-------|
| **Total Sprints Completed** | 4 | ⬆️ |
| **Total Story Points Delivered** | ~39 tasks | ⬆️ |
| **Average Sprint Velocity** | 0.89 tasks/hour | ⬆️ |
| **Sprint Success Rate** | 100% | ✅ |
| **On-Time Delivery Rate** | 100% | ✅ |

### Velocity by Milestone

```
V1:  16 tasks / 2 sprints = 8 tasks/sprint  (0.75 tasks/hour)
M2:  18 tasks / 1 sprint  = 18 tasks/sprint (0.61 tasks/hour)
M3:  4 tasks  / 1 sprint  = 4 tasks/sprint  (0.89 tasks/hour) ⭐ BEST!
```

**Observation:** M3-01 achieved exceptional velocity (0.89 tasks/hour) and came in 55% under estimate. This suggests strong familiarity with codebase and well-scoped tasks.

### Estimation Accuracy

| Sprint | Estimated Hours | Actual Hours | Variance |
|--------|----------------|--------------|----------|
| V1-01 | 6-8h | ~8h | ✅ On target |
| V1-02 | ~10h | ~12h | +20% (E2E tests took longer) |
| M2-01 | ~30h | ~28h | -7% (efficient) |
| M3-01 | 10h | 4.5h | -55% ⭐ (exceptional!) |

**Average Estimation Accuracy:** ±20% (M3-01 significantly improved this)

---

## 🎯 Milestone Progress

### Current Focus: M3 - User Profile & Bio Memory

```
Progress: [▓▓░░░░░░░░] 4/22 tasks (18%)
Estimated Completion: Dec 21, 2025
```

**Sprint Breakdown:**
- ✅ Sprint M3-01 (Nov 24-30): Personal Context Foundation - 4/4 tasks ✅ COMPLETE
- 📝 Sprint M3-02 (Dec 1-7): Hierarchical Memory Extraction - 0/6 tasks (Ready)
- 📝 Sprint M3-03 (Dec 8-14): Claude-Style Memory UI - 0/6 tasks (Planned)
- 📝 Sprint M3-04 (Dec 15-21): Advanced Memory Features - 0/6 tasks (Planned)

**What Changed:**
- Replaced Supermemory.ai integration with custom GPT-4o-mini extraction (95% cost savings)
- Enhanced memory architecture with Claude-style hierarchical categories
- Added 4th sprint for advanced features (provenance, debugging)

### Future Milestones

**M4 - Production & Scale** (Q2 2025)
- Status: 📝 Backlog
- Scope: 25 tasks (authentication, teams, analytics)
- Estimated Duration: 4-6 weeks

**M5 - Cognitive Layer** (Q3 2025+)
- Status: 📝 Backlog
- Scope: TBD (living docs, knowledge graph, hierarchical summaries)
- Dependencies: Requires M3 data accumulation

---

## 🏆 Sprint Best Practices

### Definition of Ready (for sprint planning)
- [ ] Clear user story or acceptance criteria
- [ ] Effort estimated (hours or story points)
- [ ] Dependencies identified
- [ ] Design mockups (if UI work)
- [ ] Technical approach agreed upon

### Definition of Done (for sprint completion)
- [ ] Code written and peer reviewed
- [ ] Tests passing (manual or automated)
- [ ] Documentation updated (README, CLAUDE.md, etc.)
- [ ] No regressions introduced
- [ ] Demo-ready (can be shown to stakeholders)

### Sprint Cadence
- **Duration:** 1 week (Monday - Sunday)
- **Planning:** Sunday evening or Monday morning
- **Daily Standup:** Optional (solo project)
- **Demo:** Friday afternoon
- **Retrospective:** Sunday evening

---

## 📋 Sprint Template

Use the [sprint template](templates/sprint-template.md) to create new sprint documents.

**Steps to create a new sprint:**
1. Copy `templates/sprint-template.md`
2. Rename to `sprint-{milestone}-{number}.md`
3. Place in `active/` folder
4. Fill in sprint goal, backlog, and dates
5. Update this README with active sprint link
6. Start daily progress logging

---

## 🔄 Sprint Review Process

### Weekly Sprint Flow

**Sunday Evening:**
1. Review completed sprint (if any)
2. Fill out retrospective section
3. Calculate metrics (velocity, completion rate)
4. Move completed sprint to `completed/` folder
5. Plan next sprint (review backlog, select tasks)
6. Create new sprint doc in `active/` folder
7. Update this README

**During Sprint (Monday-Friday):**
1. Update daily progress log each day
2. Track blockers as they arise
3. Update task statuses in sprint backlog table

**Friday Afternoon:**
1. Prepare sprint demo
2. Document demo notes and feedback
3. Identify carry-over items (if any)

---

## 🧭 Navigation

### Key Documents
- [Product Backlog](../PRODUCT_BACKLOG.md) - All planned work across milestones
- [Project Brief](../PROJECT_BRIEF.md) - Product vision and strategy
- [Changelog](../CHANGELOG.md) - Release notes and version history
- [Context-Memory-Vision](../context-memory-vision.md) - Architecture philosophy

### Sprint Archives
- [Completed Sprints](completed/) - Historical sprint records
- [Active Sprints](active/) - Current sprint work
- [Sprint Template](templates/sprint-template.md) - Template for new sprints

---

## 📞 Contact & Ownership

**Sprint Master:** Sachee Perera (CTO/Product Owner)
**Maintained By:** Product Team
**Review Frequency:** Weekly (end of each sprint)

---

## 📝 Changelog

| Date | Change | By |
|------|--------|-----|
| 2025-11-24 | Created sprint management system with templates | Claude Code |
| 2025-11-24 | Backfilled V1 and M2 sprint history | Claude Code |
| 2025-11-24 | Initiated Sprint M3-01 (Personal Context Foundation) | Claude Code |
