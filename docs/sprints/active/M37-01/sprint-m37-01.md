# Sprint M37-01: Repository Consolidation (Advisory Core)

**Duration:** December 7, 2025 - December 10, 2025
**Milestone:** M3.7 - Repository Consolidation
**Goal:** Enable Bobo to search advisory files (Deals/Clients) via Agent Mode
**Capacity:** 14 hours (0.7x velocity multiplier applied)
**Execution Guide:** [HANDOVER_M37-01.md](../handover/HANDOVER_M37-01.md)

---

## Sprint Backlog

| ID | Task | Est | Status | Actual | Notes |
|----|------|-----|--------|--------|-------|
| 1.1 | Create directory structure + copy files | 1.5h | ⏳ | - | Copy Blog Migration Deals/Clients |
| 1.2 | Database migration - search RPC | 1.5h | ⏳ | - | `search_advisory_files` function |
| 1.3 | TypeScript type definitions | 0.5h | ⏳ | - | `AdvisorySearchResult` type |
| 2.1 | Build indexing script | 2.5h | ⏳ | - | `scripts/index-advisory.ts` |
| 2.2 | Package.json integration | 0.5h | ⏳ | - | `npm run index-advisory` |
| 3.1 | Create advisory tools module | 2.0h | ⏳ | - | `lib/agent-sdk/advisory-tools.ts` |
| 3.2 | Register tool in configuration | 1.0h | ⏳ | - | Tool config, utils, server export |
| 4.1 | Verification script | 1.0h | ⏳ | - | `scripts/verify-advisory-indexing.ts` |
| 4.2 | Manual validation queries | 1.5h | ⏳ | - | 6 test queries in Agent Mode |
| 5.1 | Update CLAUDE.md | 0.5h | ⏳ | - | Document advisory system |
| 5.2 | Sprint completion | 0.5h | ⏳ | - | Update backlog, archive sprint |

**Legend:** ⏳ Pending | 🚧 In Progress | ✅ Done | 🚫 Blocked

**Estimated:** 13h | **Actual:** 0h | **Variance:** -

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Indexing approach | Manual only (`npm run index-advisory`) | Control costs, not in prebuild |
| Scope | All files (~101) | Complete Deals + Clients migration |
| Branch | Continue on `feature/m36-cognitive-memory` | Avoids merge complexity |

---

## Daily Progress

### Day 1 - December 7, 2025
**Hours:** -
**Done:** -
**Blockers:** -
**Notes:** Sprint starts

### Day 2 - December 8, 2025
**Hours:** -
**Done:** -
**Blockers:** -

### Day 3 - December 9, 2025
**Hours:** -
**Done:** -
**Blockers:** -

### Day 4 - December 10, 2025
**Hours:** -
**Done:** -
**Blockers:** -
**Notes:** Sprint ends

---

## Blockers

| Issue | Impact | Status | Resolution |
|-------|--------|--------|------------|
| - | - | - | - |

---

## Demo (December 10, 2025)

### Script
1. Show advisory file structure in codebase
2. Run `npm run index-advisory` - verify file count
3. Query: "Brief me on MyTab" - should return master doc content
4. Query: "What deals have red flags?" - should return multiple deals
5. Query: "Prep me for SwiftCheckin call" - should return client profile
6. Show combined search: memory + advisory files

### Feedback
- (To be filled)

---

## Validation Queries

| Query | Expected Result | Pass? |
|-------|-----------------|-------|
| "Brief me on MyTab" | Master-doc summary with stage, contacts, red flags | ⏳ |
| "What was my last email to Mikaela?" | Communications Log from MyTab | ⏳ |
| "What deals have red flags?" | Multiple deals with Strategic Observations | ⏳ |
| "Prep me for SwiftCheckin call" | Client profile + touchpoints | ⏳ |
| "What's the valuation for ArcheloLab?" | Valuation Snapshot section | ⏳ |
| "Show me Dec 2 meeting notes for MyTab" | Specific meeting file | ⏳ |

**Target:** 5/6 queries pass

---

## Retrospective

### What Went Well
- (To be filled)

### What Didn't Go Well
- (To be filled)

### Learnings
- (To be filled)

### Next Sprint Actions
- [ ] (To be filled)

---

## Metrics

| Metric | Target | Actual |
|--------|--------|--------|
| Tasks Completed | 11 | - |
| Hours | 13h | - |
| Files Indexed | ~70 | - |
| Embedding Coverage | 100% | - |
| Validation Queries | 5/6 | - |
| Build Status | ✅ | - |

**Velocity:** - tasks/sprint
**Completion:** -%

---

## Success Criteria

- [ ] ~70 advisory files in `advisory/` directory
- [ ] 100% files indexed with embeddings
- [ ] `search_advisory` tool functional in Agent Mode
- [ ] 5/6 validation queries pass
- [ ] No regression in existing memory tools
- [ ] Build passes, deploys to Vercel
- [ ] 3+ days successful dogfooding

---

## Links

- **Execution Guide:** [HANDOVER_M37-01.md](../handover/HANDOVER_M37-01.md)
- **Backlog:** [PRODUCT_BACKLOG.md](../../../product/PRODUCT_BACKLOG.md)
- **Roadmap:** [REPOSITORY_CONSOLIDATION.md](../../../product/roadmaps/REPOSITORY_CONSOLIDATION.md)
- **Previous:** [sprint-m36-02.md](../completed/sprint-m36-02.md)

---

## Carry-Over (if any)

| Task | Reason | Next Sprint |
|------|--------|-------------|
| - | - | - |

---

**Created:** December 7, 2025
**Status:** Ready to Start
