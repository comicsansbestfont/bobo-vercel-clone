# Sprint Templates

This folder contains reusable templates for creating new sprints.

**Last Updated:** November 28, 2025

---

## Sprint Planning Process

Before using these templates, use the Sprint Planning Agent:

```
@sprint-planning-agent let's plan {sprint name}
```

The agent will guide you through comprehensive planning and quality gates.

---

## Templates

### 1. Sprint Plan Template
**File:** `sprint-template.md`

**Purpose:** Main tracking document for the sprint
- Backlog with task estimates
- Daily progress log
- Blockers and risks
- Demo script
- Retrospective (filled at end)
- Metrics

**How to use:**
```bash
# When creating a new sprint
cp sprint-template.md ../active/M##-##/sprint-m##-##.md
# Then fill in the placeholders
```

### 2. Handover Template
**File:** `../handover/HANDOVER_TEMPLATE.md`

**Purpose:** Execution guide for sub-agents and team
- TL;DR summary
- Architecture diagrams
- Quick start setup
- Detailed task breakdown with code examples
- Files to create/modify
- Known gotchas
- Testing checklist
- Success criteria

**How to use:**
```bash
# When creating a new sprint's execution guide
cp ../handover/HANDOVER_TEMPLATE.md ../handover/HANDOVER_M##-##.md
# Then fill in the specific details
```

### 3. Folder Structure Template
This README shows the recommended folder structure:

```bash
# Create sprint folders
mkdir -p ../active/M##-##/{testing,reports}
cp sprint-template.md ../active/M##-##/sprint-m##-##.md
```

---

## Sprint Lifecycle Reference

### Phase 1: Planning (Before sprint starts)
1. Run `@sprint-planning-agent let's plan {sprint name}`
2. Agent guides through scoping, task definition, capacity planning, quality gates
3. Create sprint folder structure
4. Copy `sprint-template.md` and fill in sprint plan
5. Copy `HANDOVER_TEMPLATE.md` and fill in execution guide
6. Get human approval

### Phase 2: Execution (During sprint)
1. Follow handover document
2. Update sprint plan daily with progress
3. Generate testing and reports as completed
4. Place artifacts in appropriate subfolders:
   - `testing/` for QA reports, test plans, execution summaries
   - `reports/` for API integration reports, completion reports, post-mortems

### Phase 3: Completion (When sprint is done)
1. Fill in sprint retrospective in sprint plan
2. Create POST_MORTEM.md if issues occurred
3. Move entire folder to completed:
   ```bash
   mv ../active/M##-##/ ../completed/M##-##/
   ```

---

## Definition of Done Templates

See `.claude/skills/sprint-planning/SKILL.md` for reusable DoD templates:
- Feature Task DoD
- Bug Fix Task DoD
- Refactoring Task DoD
- API Endpoint Task DoD
- UI Component Task DoD
- Database Migration Task DoD

---

## Key Files Reference

| File | Purpose | Location |
|------|---------|----------|
| Sprint Plan | Track progress | `active/M##-##/sprint-m##-##.md` |
| Handover | Execute sprint | `handover/HANDOVER_M##-##.md` |
| QA Report | Testing results | `active/M##-##/testing/` |
| Completion Report | Deliverables summary | `active/M##-##/reports/` |
| Post-Mortem | Issue analysis | `active/M##-##/POST_MORTEM.md` |

---

## Best Practices

1. **Use templates consistently** - Standardized format makes sprints easier to track
2. **Organize artifacts early** - Place testing/reports in correct subfolders as generated
3. **Update sprint plan daily** - Don't wait until end to record progress
4. **Archive immediately** - Move completed sprint to `completed/` right after finishing
5. **Reference handovers** - Keep old HANDOVER_*.md files for patterns and learning
