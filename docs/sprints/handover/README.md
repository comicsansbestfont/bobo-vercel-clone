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
| Recommended Sub-Agents | Which agents to use per phase |

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

## Sub-Agent Selection Guide

**Repository Location:** `~/VibeCoding Projects/awesome-claude-code-subagents-main/`

### Selection Matrix

| Sprint Type | Primary Agents | Support Agents |
|-------------|----------------|----------------|
| New Feature (Full-stack) | `fullstack-developer`, `nextjs-developer` | `code-reviewer`, `qa-expert` |
| Database/Schema | `postgres-pro`, `database-administrator` | `performance-engineer` |
| AI/ML Feature | `ai-engineer`, `llm-architect` | `prompt-engineer` |
| Infrastructure | `devops-engineer`, `terraform-engineer` | `security-engineer` |
| Refactoring | `refactoring-specialist`, `architect-reviewer` | `code-reviewer` |
| Bug Fix | `debugger`, `error-detective` | `qa-expert` |
| Documentation | `documentation-engineer`, `technical-writer` | - |
| API Design | `api-designer`, `api-documenter` | `security-auditor` |

### Available Categories (115 agents)

| Category | Count | Key Agents |
|----------|-------|------------|
| Core Development | 11 | `fullstack-developer`, `frontend-developer`, `backend-developer` |
| Language Specialists | 24 | `typescript-pro`, `nextjs-developer`, `react-specialist`, `python-pro` |
| Infrastructure | 12 | `devops-engineer`, `kubernetes-specialist`, `terraform-engineer` |
| Quality & Security | 12 | `code-reviewer`, `qa-expert`, `security-auditor`, `debugger` |
| Data & AI | 12 | `postgres-pro`, `ai-engineer`, `llm-architect` |
| Developer Experience | 10 | `refactoring-specialist`, `documentation-engineer` |
| Specialized Domains | 11 | `fintech-engineer`, `blockchain-developer` |
| Business & Product | 10 | `product-manager`, `technical-writer` |
| Meta & Orchestration | 8 | `agent-organizer`, `workflow-orchestrator` |
| Research & Analysis | 6 | `research-analyst`, `competitive-analyst` |

### Setup

```bash
# Option 1: Symlink for all projects (recommended)
ln -s ~/VibeCoding\ Projects/awesome-claude-code-subagents-main/agents ~/.claude/agents

# Option 2: Copy specific agents to project
cp ~/VibeCoding\ Projects/awesome-claude-code-subagents-main/agents/{agent-name}.md .claude/agents/
```

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
