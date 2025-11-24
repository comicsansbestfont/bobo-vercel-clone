# Sprint Management

**Purpose:** Track sprint planning, execution, and retrospectives for the Bobo AI Chatbot project
**Last Updated:** November 24, 2025
**Current Sprint:** [Sprint M3-01](active/sprint-m3-01.md) (Week 1 of M3)

---

## 🚀 Active Sprints

| Sprint | Milestone | Duration | Goal | Status | Progress |
|--------|-----------|----------|------|--------|----------|
| [M3-01](active/sprint-m3-01.md) | M3 - User Profile & Bio | Nov 24-30, 2025 | Personal Context Foundation | 🚧 Active | 0% |

---

## 📅 Sprint Calendar

### Q4 2024
- **Nov 1-15, 2024:** Sprint V1-01 - Critical Path (Persistence Layer) ✅
- **Nov 16-22, 2024:** Sprint V1-02 - Polish & Testing ✅

### Q1 2025
- **Jan 15-23, 2025:** Sprint M2-01 - Double-Loop RAG Architecture ✅
- **Nov 24-30, 2025:** Sprint M3-01 - Personal Context Foundation 🚧
- **Dec 1-7, 2025:** Sprint M3-02 - Supermemory Integration (Planned)
- **Dec 8-14, 2025:** Sprint M3-03 - Governance & Runtime Context (Planned)

### Q2 2025
- **TBD:** Sprint M4-01 - Authentication & Multi-User (Planned)

---

## 📊 Upcoming Sprints

| Sprint | Milestone | Planned Start | Goal | Story Points |
|--------|-----------|---------------|------|--------------|
| M3-02 | M3 - User Profile & Bio | Dec 1, 2025 | Supermemory Integration & Memory UI | 9.5h |
| M3-03 | M3 - User Profile & Bio | Dec 8, 2025 | Governance, Debugging & Runtime Context | 12h |
| M4-01 | M4 - Production & Scale | TBD | Authentication & Multi-User | TBD |

---

## ✅ Completed Sprints

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
| **Total Sprints Completed** | 3 | ⬆️ |
| **Total Story Points Delivered** | ~35 tasks | ⬆️ |
| **Average Sprint Velocity** | ~11 tasks/sprint | ➡️ |
| **Sprint Success Rate** | 100% | ✅ |
| **On-Time Delivery Rate** | 100% | ✅ |

### Velocity by Milestone

```
V1:  16 tasks / 2 sprints = 8 tasks/sprint
M2:  18 tasks / 1 sprint  = 18 tasks/sprint
M3:  15 tasks / 3 sprints = 5 tasks/sprint (planned)
```

**Observation:** M2 had higher velocity due to focused scope. M3 is more exploratory (Supermemory integration) so conservative estimate.

### Estimation Accuracy

| Sprint | Estimated Hours | Actual Hours | Variance |
|--------|----------------|--------------|----------|
| V1-01 | 6-8h | ~8h | ✅ On target |
| V1-02 | ~10h | ~12h | +20% (E2E tests took longer) |
| M2-01 | ~30h | ~28h | -7% (efficient) |

**Average Estimation Accuracy:** ±15% (acceptable range)

---

## 🎯 Milestone Progress

### Current Focus: M3 - User Profile & Bio

```
Progress: [▓░░░░░░░░░] 0/15 tasks (0%)
Estimated Completion: Dec 14, 2025
```

**Sprint Breakdown:**
- Sprint M3-01 (Nov 24-30): Personal Context Foundation - 4 tasks
- Sprint M3-02 (Dec 1-7): Supermemory Integration & Memory UI - 6 tasks
- Sprint M3-03 (Dec 8-14): Governance, Debugging & Runtime Context - 5 tasks

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
