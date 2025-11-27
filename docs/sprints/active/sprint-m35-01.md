# Sprint M3.5-01: Agent Memory Tools

**Duration:** November 28 - December 8, 2025 (10 days)
**Milestone:** M3.5 - Agent Memory (Letta-Inspired)
**Goal:** Enable agent to self-edit memory in real-time, closing the trust gap where "I'll remember that" actually works
**Capacity:** 35 hours (28h estimated + 7h buffer)
**Execution Guide:** [HANDOVER_M35-01.md](../handover/HANDOVER_M35-01.md)

---

## Sprint Backlog

| ID | Task | Est | Status | Actual | Notes |
|----|------|-----|--------|--------|-------|
| M3.5-0 | `search_memory` agent tool | 3h | ⏳ | - | Prerequisite for update/forget |
| M3.5-1 | `remember_fact` agent tool | 3h | ⏳ | - | Real-time memory capture |
| M3.5-2 | `update_memory` agent tool | 5h | ⏳ | - | User corrections + search integration |
| M3.5-3 | `forget_memory` agent tool | 3h | ⏳ | - | Graceful memory deletion |
| M3.5-4 | Async extraction pipeline | 6h | ⏳ | - | Non-blocking background processing |
| M3.5-5 | Memory tool error handling | 2h | ⏳ | - | Graceful failure recovery |
| M3.5-6 | Memory tool safety permissions | 2h | ⏳ | - | Confirmation dialogs |

**Legend:** ⏳ Pending | 🚧 In Progress | ✅ Done | 🚫 Blocked

**Estimated:** 28h | **Actual:** 0h | **Variance:** -

---

## Team Composition

This sprint requires a mix of backend and frontend expertise:

| Role | Responsibilities | Tasks |
|------|------------------|-------|
| **Backend Engineer (Senior)** | Agent SDK integration, memory tools core logic, database queries | M3.5-0, M3.5-1, M3.5-2, M3.5-3, M3.5-4 |
| **Backend Engineer (Mid)** | Error handling, edge cases, testing | M3.5-5, M3.5-4 (testing) |
| **Frontend Engineer** | Confirmation dialogs, memory update previews, toast notifications | M3.5-6 |
| **Full-Stack Integration** | Tool registration, streaming, chat API routing | All tasks (integration) |

### Sub-Agent Mapping for Execution

| Agent Type | Focus Area | Primary Tasks |
|------------|------------|---------------|
| `general-purpose` (Opus) | Core tool implementation, complex logic | M3.5-0, M3.5-1, M3.5-2 |
| `general-purpose` (Sonnet) | Error handling, safety, testing | M3.5-3, M3.5-5, M3.5-6 |
| `general-purpose` (Haiku) | Edge function, simple integrations | M3.5-4 (edge function only) |

---

## Task Dependencies

```
M3.5-0 (search_memory) ──┬──▶ M3.5-2 (update_memory)
                         └──▶ M3.5-3 (forget_memory)

M3.5-1 (remember_fact) ──────▶ M3.5-5 (error handling)
                         ──────▶ M3.5-6 (safety permissions)

M3.5-4 (async extraction) ────▶ Independent (can run in parallel)
```

### Recommended Execution Order

**Phase 1: Foundation (Day 1-3)** - 9h
1. M3.5-0: search_memory (3h) - Enables all other tools
2. M3.5-1: remember_fact (3h) - Core additive tool
3. M3.5-6: safety permissions (3h) - Framework for confirmations

**Phase 2: Corrections (Day 4-6)** - 8h
4. M3.5-2: update_memory (5h) - Depends on search
5. M3.5-3: forget_memory (3h) - Depends on search

**Phase 3: Polish (Day 7-8)** - 8h
6. M3.5-4: async extraction (6h) - Independent
7. M3.5-5: error handling (2h) - Wrap all tools

**Phase 4: Integration Testing (Day 9-10)** - 3h
- End-to-end testing
- Build verification
- Demo preparation

---

## Daily Progress

### Day 1 - Nov 28
**Hours:** -
**Done:** -
**Blockers:** -
**Notes:** Sprint starts

### Day 2 - Nov 29
**Hours:** -
**Done:** -
**Blockers:** -

### Day 3 - Nov 30
**Hours:** -
**Done:** -
**Blockers:** -

### Day 4 - Dec 1
**Hours:** -
**Done:** -
**Blockers:** -

### Day 5 - Dec 2
**Hours:** -
**Done:** -
**Blockers:** -

### Day 6 - Dec 3
**Hours:** -
**Done:** -
**Blockers:** -

### Day 7 - Dec 4
**Hours:** -
**Done:** -
**Blockers:** -

### Day 8 - Dec 5
**Hours:** -
**Done:** -
**Blockers:** -

### Day 9 - Dec 6
**Hours:** -
**Done:** -
**Blockers:** -

### Day 10 - Dec 7
**Hours:** -
**Done:** -
**Blockers:** -

---

## Blockers

| Issue | Impact | Status | Resolution |
|-------|--------|--------|------------|
| - | - | - | - |

---

## Demo (Dec 8)

### Script
1. Start chat with Agent Mode enabled
2. Say "I'm moving to London next month, remember that"
3. Agent calls `remember_fact` → Memory instantly appears
4. Say "Actually, I'm staying in Sydney"
5. Agent calls `update_memory` → Shows diff preview → User approves
6. Say "Forget that I mentioned Tokyo earlier"
7. Agent calls `search_memory` → finds memory → calls `forget_memory` → User confirms
8. Show Memory UI with new entries marked as "Agent Created"

### Success Criteria
- [ ] "I'll remember that" actually stores a memory
- [ ] User corrections captured in real-time
- [ ] Destructive operations require user confirmation
- [ ] Memory tool failures don't crash chat
- [ ] Async extraction doesn't block chat response

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
- [ ] (To be filled)

---

## Metrics

| Metric | Target | Actual |
|--------|--------|--------|
| Tasks Completed | 7 | - |
| Hours | 28h | - |
| Build Status | ✅ | - |

**Velocity:** - tasks/sprint
**Completion:** -%

---

## Links

- **Execution Guide:** [HANDOVER_M35-01.md](../handover/HANDOVER_M35-01.md)
- **Letta SDK Analysis:** [Letta-SDK-Analysis.md](../../Research/Letta-SDK-Analysis.md)
- **Backlog:** [PRODUCT_BACKLOG.md](../../PRODUCT_BACKLOG.md)
- **Previous:** [sprint-m4-01.md](../completed/sprint-m4-01.md)

---

## Carry-Over (if any)

| Task | Reason | Next Sprint |
|------|--------|-------------|
| - | - | - |

---

**Created:** November 27, 2025
**Status:** Ready to Start
