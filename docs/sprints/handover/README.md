# Handover Documents

**Purpose:** Execution guides for developers starting a sprint

---

## What's a Handover?

A handover is a **quick-start guide** that lets a developer begin coding within 15 minutes. It contains everything needed to DO the sprint, not TRACK it.

---

## Contents of a Handover

| Section | Purpose |
|---------|---------|
| Quick Start | Setup commands to run immediately |
| What We're Building | 1-2 sentence + ASCII diagram |
| Tasks | Simple table of what to do |
| Files to Create | Folder structure with purposes |
| Code Patterns | Key snippets to copy |
| Reuse Existing Code | What already exists |
| Known Gotchas | Pitfalls to avoid |
| Testing Checklist | How to verify |
| Success Criteria | Definition of done |
| Resources | External docs |

---

## Handover Organization

Handover documents live in this shared folder (NOT in sprint folders) so they can be:
- Referenced across multiple sprint executions
- Reused for future similar sprints
- Archived for process learning

**Naming:** `HANDOVER_{MILESTONE}-{NUMBER}.md`
**Example:** `HANDOVER_M35-01.md`, `HANDOVER_M4-01.md`

---

## Active Handovers

| Sprint | Handover | Status |
|--------|----------|--------|
| M35-02 | [HANDOVER_M35-02.md](./HANDOVER_M35-02.md) | 🟡 In Progress |
| M35-01 | [HANDOVER_M35-01.md](./HANDOVER_M35-01.md) | ✅ Completed |
| M4-01 | [HANDOVER_M4-01.md](./HANDOVER_M4-01.md) | 🟢 Ready |

---

## Creating a New Handover

```bash
cp HANDOVER_TEMPLATE.md HANDOVER_M##-##.md
# Then fill in all sections specific to your sprint
```

**Key sections to fill:**
1. TL;DR - What we're building (plain English)
2. Architecture diagrams - Visual system overview
3. Quick Start - Setup commands (15 min to start coding)
4. Tasks - What to do (organized by phase)
5. Files to Create - Folder structure with purposes
6. Implementation Details - Code patterns and examples
7. Reuse Existing Code - What's already available (with verification)
8. Known Gotchas - Common pitfalls
9. Testing Checklist - How to verify the implementation
10. Success Criteria - Definition of done

---

## Template

[HANDOVER_TEMPLATE.md](./HANDOVER_TEMPLATE.md)

---

## Handover vs Sprint Plan

| | Sprint Plan | Handover |
|-|-------------|----------|
| **Purpose** | Track progress | Guide execution |
| **Audience** | PM/Reviewer | Developer |
| **Updates** | Daily | Once (at planning) |
| **Contains** | Backlog, log, metrics | Code, setup, gotchas |
| **Location** | `active/M##-##/` | `handover/` (shared) |
| **Archive** | Moved to `completed/M##-##/` | Stays in `handover/` |

**Rule:** Code patterns and architecture go in Handover. Progress and metrics go in Sprint Plan.

---

## Lifecycle of a Handover

1. **Created** - During sprint planning phase
2. **Used** - During sprint execution
3. **Maintained** - Updated if issues found during execution (gotchas section)
4. **Archived** - Stays in `handover/` folder for reference
5. **Referenced** - Used for future similar sprints to reference patterns and lessons

---

**Last Updated:** November 28, 2025
