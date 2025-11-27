# Sprint Planning Skill

**Purpose:** Reusable templates and checklists for sprint planning quality
**Used by:** Sprint Planning Agent, any agent doing sprint work

---

## Definition of Done Templates

### Feature Task DoD
```markdown
DoD for {Task ID}: {Task Name}
- [ ] Implementation complete
- [ ] Unit tests written and passing (min 80% coverage)
- [ ] Integration test passes
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] Build passes (`npm run build`)
- [ ] Manual smoke test done
- [ ] No console errors
- [ ] Performance impact assessed
```

### Bug Fix Task DoD
```markdown
DoD for {Task ID}: {Task Name}
- [ ] Root cause documented
- [ ] Fix implemented
- [ ] Regression test added
- [ ] Original bug scenario now passes
- [ ] No new test failures
- [ ] Related code areas checked for similar issues
- [ ] Build passes
- [ ] Code reviewed
```

### Refactoring Task DoD
```markdown
DoD for {Task ID}: {Task Name}
- [ ] All existing tests still pass
- [ ] No behavioral changes (verified)
- [ ] Code complexity reduced (measurable)
- [ ] Performance not degraded
- [ ] Documentation updated
- [ ] Code reviewed
- [ ] Before/after comparison documented
```

### API Endpoint Task DoD
```markdown
DoD for {Task ID}: {Task Name}
- [ ] Endpoint implemented
- [ ] Request validation (Zod schema)
- [ ] Proper HTTP status codes (200, 400, 404, 500)
- [ ] Error messages are user-friendly
- [ ] Unit tests for happy path
- [ ] Unit tests for error cases
- [ ] Integration test with database
- [ ] API documentation updated
- [ ] Build passes
```

### UI Component Task DoD
```markdown
DoD for {Task ID}: {Task Name}
- [ ] Component renders correctly
- [ ] Props are typed (TypeScript)
- [ ] Responsive design verified
- [ ] Accessibility checked (keyboard nav, aria labels)
- [ ] Loading states handled
- [ ] Error states handled
- [ ] Unit tests written
- [ ] Visual regression test (if applicable)
- [ ] Build passes
```

### Database Migration Task DoD
```markdown
DoD for {Task ID}: {Task Name}
- [ ] Migration file created
- [ ] Migration applies successfully
- [ ] Migration rolls back successfully
- [ ] Existing data preserved
- [ ] Indexes added (if needed for queries)
- [ ] RLS policies updated (if applicable)
- [ ] TypeScript types regenerated
- [ ] Dependent code updated
- [ ] Build passes
```

---

## Testing Task Templates

### Unit Test Task
```markdown
Task: Unit test {component/function name}
Time: {X}h
DoD:
- [ ] Happy path tests written
- [ ] Error case tests written
- [ ] Edge case tests written
- [ ] Coverage > 80%
- [ ] All tests passing
- [ ] No flaky tests
```

### Integration Test Task
```markdown
Task: Integration test {feature/flow name}
Time: {X}h
DoD:
- [ ] Test setup documented
- [ ] Database seeded correctly
- [ ] API endpoints tested end-to-end
- [ ] Error responses verified
- [ ] All tests passing
- [ ] Cleanup after tests
```

### E2E Test Task
```markdown
Task: E2E test {user flow name}
Time: {X}h
DoD:
- [ ] User flow documented step-by-step
- [ ] Test runs in CI environment
- [ ] Screenshots captured on failure
- [ ] Test is not flaky (run 3x)
- [ ] All assertions meaningful
```

### Manual Test Task
```markdown
Task: Manual smoke test {feature name}
Time: {X}h
DoD:
- [ ] Test scenarios documented
- [ ] Each scenario executed
- [ ] Results recorded (pass/fail)
- [ ] Bugs filed for failures
- [ ] Sign-off from tester
```

---

## Pre-Sprint Audit Checklist

```markdown
## Pre-Sprint Audit: {Sprint Name}

### 1. Integration Surface Map
- [ ] APIs affected: {list}
- [ ] UI components affected: {list}
- [ ] Database tables affected: {list}
- [ ] External services affected: {list}

### 2. Reusable Code Validation
| Code Item | File Path | Verified Works | Has Tests | Notes |
|-----------|-----------|----------------|-----------|-------|
| {function} | {path} | [ ] | [ ] | {notes} |

### 3. Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| {risk} | Low/Med/High | Low/Med/High | {plan} |

### 4. Unknowns
| Unknown | Research Task | Assigned To | Resolution |
|---------|--------------|-------------|------------|
| {unknown} | {task} | {person} | {status} |

### 5. Dependencies
| Dependency | Status | Blocker? |
|------------|--------|----------|
| {dep} | Ready/Pending | Yes/No |
```

---

## Sub-Agent Instruction Template

```markdown
## Task: {Task ID} - {Task Name}

**Assigned to:** {Agent Type} ({Model})
**Estimated time:** {X}h

### Deliverables
1. {Primary deliverable}
2. {Secondary deliverable}

### Files to Create/Modify
- `{file path}` - {purpose}
- `{file path}` - {purpose}

### Implementation Steps
1. {Step 1}
2. {Step 2}
3. {Step 3}

### Verification Steps (REQUIRED)
After implementation, verify:
- [ ] `npm run build` passes
- [ ] `npm run dev` starts without errors
- [ ] {Feature} works when tested manually: {how to test}
- [ ] No console errors in browser/terminal
- [ ] Related existing tests still pass

### Side Effects to Check
- [ ] {Existing feature X} still works
- [ ] {Database query Y} still performs well
- [ ] {UI component Z} renders correctly

### When to Ask for Help
- If {condition}, stop and ask
- If {error type}, report before proceeding
- If estimate exceeds {X}h, check in first

### When to Make Your Own Decision
- Code style choices within project conventions
- Variable naming within existing patterns
- Minor refactoring that improves clarity
```

---

## Sprint Capacity Calculator

```markdown
## Sprint Capacity: {Sprint Name}

**Total Hours:** {X}h
**Buffer (10%):** {Y}h
**Available:** {X-Y}h

### Allocation
| Category | Target % | Hours | Actual Tasks |
|----------|----------|-------|--------------|
| Implementation | 65% | {h} | {task list} |
| Testing | 20% | {h} | {task list} |
| Documentation | 10% | {h} | {task list} |
| Buffer | 5% | {h} | (reserve) |

### Validation
- [ ] Testing >= 15% of capacity
- [ ] Buffer >= 5% of capacity
- [ ] No single task > 8h (break down if needed)
- [ ] Total matches available hours
```

---

## Sprint Quality Gates

### Gate 1: Pre-Sprint Ready
- [ ] Goal is SMART (Specific, Measurable, Achievable, Relevant, Time-bound)
- [ ] Integration surface documented
- [ ] All reusable code validated
- [ ] Risks assessed and mitigated
- [ ] Dependencies identified and ready

### Gate 2: Task Quality
- [ ] Every task has explicit DoD
- [ ] Every task is atomic (2-6h)
- [ ] Testing tasks are specific scenarios
- [ ] Estimates based on historical velocity
- [ ] Sub-agent instructions include verification

### Gate 3: Documentation Ready
- [ ] Sprint plan created
- [ ] Handover created with code patterns
- [ ] Success criteria defined
- [ ] Demo script written

### Gate 4: Human Approval
- [ ] Human reviewed sprint plan
- [ ] Human reviewed handover
- [ ] Human approved to start
- [ ] Human understands risks

---

## Common Gotchas (Bobo-Specific)

| Gotcha | Why It Happens | Prevention |
|--------|----------------|------------|
| REST API missing fields | API route doesn't call correct helper | Validate API routes in pre-sprint audit |
| Chat requires chatId | New chats have no ID until first message | Test new chat flow explicitly |
| content_hash not generated | Direct insert bypasses helper function | Always use createMemory() helper |
| Embedding errors | Missing OPENAI_API_KEY or rate limits | Check env vars in setup |
| Build passes but runtime fails | TypeScript checks types, not behavior | Add runtime verification steps |
| "95% tests pass" misleading | Tests check config, not functionality | Write functional tests, not just existence checks |

---

## Historical Velocity Reference

| Sprint | Estimated | Actual | Velocity |
|--------|-----------|--------|----------|
| M3.5-01 | 28h | 25h | 1.12x |
| M4-01 | 25.5h | 10h | 2.55x |
| M3-03 | ~10h | ~8h | 1.25x |

**Average Velocity:** 1.5x faster than estimates
**Recommendation:** Apply 0.7x multiplier to initial estimates (account for over-optimism)

---

*Last Updated: November 28, 2025*
*Based on: 6 completed sprints, 1 post-mortem analysis*
