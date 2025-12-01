# Sprint M3.6-02: Wire Access Tracking

**Duration:** December 1-3, 2025
**Milestone:** M3.6 - Cognitive Memory
**Goal:** Make `search_memory` update access metrics when memories are retrieved
**Capacity:** 5 hours (4.5h estimated + 0.5h buffer)
**Execution Guide:** [HANDOVER_M36-02.md](../handover/HANDOVER_M36-02.md)

---

## Sprint Backlog

| ID | Task | Est | Status | Actual | Notes |
|----|------|-----|--------|--------|-------|
| S2-01 | Add `updateMemoryAccess()` wrapper to queries.ts | 1h | ⏳ | - | Calls update_memory_access RPC |
| S2-02 | Update TypeScript types for new columns | 0.5h | ⏳ | - | Add last_accessed, access_count to MemoryEntry |
| S2-03 | Call wrapper in `searchMemoryTool.execute` after retrieval | 1h | ⏳ | - | Fire-and-forget pattern |
| S2-04 | Add non-throwing safety wrapper | 0.5h | ⏳ | - | Never crash search |
| S2-05 | Write API tests for access tracking | 1h | ⏳ | - | Verify DB updates after search |
| S2-06 | Manual E2E test with agent | 0.5h | ⏳ | - | Search twice, verify access_count |

**Legend:** ⏳ Pending | 🚧 In Progress | ✅ Done | 🚫 Blocked

**Estimated:** 4.5h | **Actual:** - | **Variance:** -

---

## Dependencies

### From Sprint M3.6-01 (COMPLETE)
- [x] `last_accessed` TIMESTAMPTZ column exists
- [x] `access_count` INT column exists
- [x] `update_memory_access(UUID[])` RPC function exists
- [x] All 50 rows backfilled (0 nulls)
- [x] Indexes created for performance

### Pre-Sprint Verification
Before starting, verify Sprint 1 infrastructure:
```sql
-- Run in Supabase SQL Editor
SELECT update_memory_access(ARRAY[]::uuid[]);
-- Should return void (no error)
```

---

## Daily Progress

### Day 1 - Dec 1
**Hours:** -
**Done:** -
**Blockers:** -
**Notes:** Sprint starts

### Day 2 - Dec 2
**Hours:** -
**Done:** -
**Blockers:** -

### Day 3 - Dec 3
**Hours:** -
**Done:** -
**Blockers:** -

---

## Blockers

| Issue | Impact | Status | Resolution |
|-------|--------|--------|------------|
| - | - | - | - |

---

## Demo (Dec 3)

### Script
1. Show `updateMemoryAccess()` function in queries.ts
2. Show integration in searchMemoryTool.execute
3. Run search_memory via agent: "Search for my preferences"
4. Query DB: Verify `access_count` incremented for returned memories
5. Verify console logs show non-blocking update
6. Run `npm run build` → passes
7. Run API tests → all pass

### Feedback
- (To be filled)

---

## Retrospective

### What Went Well
- (To be filled)

### What Didn't Go Well
- (To be filled)

### Learnings
- (To be filled)

### Next Sprint Actions
- [ ] Proceed to Sprint 3: Hebbian Reinforcement

---

## Metrics

| Metric | Target | Actual |
|--------|--------|--------|
| Tasks Completed | 6 | - |
| Hours | 4.5h | - |
| Build Status | ✅ | - |
| Test Pass Rate | 100% | - |

**Velocity:** - tasks/sprint
**Completion:** -%

---

## Quality Gates

### GATE 1: TypeScript Wrapper Works
- [ ] `updateMemoryAccess()` function exists in queries.ts
- [ ] Function exported from lib/db/index.ts
- [ ] TypeScript types include `last_accessed`, `access_count`

### GATE 2: Integration Complete
- [ ] searchMemoryTool.execute calls wrapper after successful search
- [ ] Wrapper is fire-and-forget (async, no await blocking response)
- [ ] Failures are logged but don't throw

### GATE 3: No Regression
- [ ] `npm run build` passes
- [ ] Existing search_memory functionality unchanged
- [ ] Search response time not impacted (< 50ms overhead)

### GATE 4: Verified in Production
- [ ] Manual test: search twice, access_count = 2
- [ ] API tests pass
- [ ] No errors in console

---

## Definition of Done

- [ ] `updateMemoryAccess(memoryIds: string[])` function in lib/db/queries.ts
- [ ] Function exported from lib/db/index.ts
- [ ] MemoryEntry type updated with `last_accessed`, `access_count`
- [ ] searchMemoryTool.execute calls wrapper after successful retrieval
- [ ] Wrapper catches all errors (never throws)
- [ ] Failure logs to console but doesn't break search
- [ ] API test: search returns results AND increments access_count
- [ ] Manual test: search twice, verify access_count = 2
- [ ] `npm run build` passes
- [ ] No TypeScript errors

---

## Files to Create/Modify

### Create
- `tests/api/m36-access-tracking-api.test.ts` - API integration tests

### Modify
- `lib/db/types.ts` - Add `last_accessed`, `access_count` to MemoryEntry
- `lib/db/queries.ts` - Add `updateMemoryAccess()` wrapper
- `lib/db/index.ts` - Export new function
- `lib/agent-sdk/memory-tools.ts` - Integrate wrapper into searchMemoryTool

---

## Links

- **Execution Guide:** [HANDOVER_M36-02.md](../handover/HANDOVER_M36-02.md)
- **Previous Sprint:** [sprint-m36-01.md](./sprint-m36-01.md)
- **Backlog:** [PRODUCT_BACKLOG.md](../../PRODUCT_BACKLOG.md)
- **Plan File:** [glittery-launching-wall.md](~/.claude/plans/glittery-launching-wall.md)
- **Requirements:** [COGNITIVE_MEMORY_REQUIREMENTS.md](../../COGNITIVE_MEMORY_REQUIREMENTS.md)

---

## Carry-Over (if any)

| Task | Reason | Next Sprint |
|------|--------|-------------|
| - | - | - |

---

**Created:** December 1, 2025
**Status:** Ready to Start
**Branch:** `feature/m36-cognitive-memory`
