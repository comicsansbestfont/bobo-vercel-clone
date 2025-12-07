# Sprint {Milestone}-{Number} Execution Guide

**Sprint:** {Milestone}-{Number} - {Sprint Name}
**Duration:** {Start Date} - {End Date}
**Prepared:** {Date}

---

## TL;DR (Plain English Summary)

{Write 3-5 paragraphs explaining in plain English:
- What we're building and why it matters
- The core idea/architecture in simple terms
- What each phase accomplishes
- Key design decisions made
- What success looks like}

---

## Architecture Overview

{Include comprehensive ASCII diagrams showing:}

### System Architecture
```
{Main system diagram showing how components connect}
```

### Data Flow
```
{Show how data moves through the system step by step}
```

### Permission/Decision Flow (if applicable)
```
{Show any decision trees, permission flows, or state machines}
```

---

## Quick Start (15 minutes)

```bash
# Required setup commands
{command 1}
{command 2}

# Verify
npm run build
npm run dev
```

**Environment:** {Any env vars needed}

---

## Tasks

### Phase 1: {Phase Name} ({X}h)

| Task | What to Do | Hours |
|------|------------|-------|
| {ID} | {Description} | {Xh} |

### Phase 2: {Phase Name} ({X}h)

| Task | What to Do | Hours |
|------|------------|-------|
| {ID} | {Description} | {Xh} |

### Phase 3: {Phase Name} ({X}h)

| Task | What to Do | Hours |
|------|------------|-------|
| {ID} | {Description} | {Xh} |

**Total: {X}h** (+ buffer)

---

## Files to Create

```
{folder}/
├── {file1}.ts         # {purpose}
├── {file2}.ts         # {purpose}
└── {file3}.tsx        # {purpose}

{another-folder}/
├── {file4}.tsx        # {purpose}
└── {file5}.tsx        # {purpose}
```

---

## Implementation Details

### {Task ID}: {Task Name}

**File:** `{file path}`

**What it does:** {Plain English explanation}

```typescript
// {file path}
{comprehensive code example - not just a snippet, but enough to understand the pattern}
```

**Key points:**
- {Important detail 1}
- {Important detail 2}

---

### {Task ID}: {Task Name}

**File:** `{file path}`

**What it does:** {Plain English explanation}

```typescript
// {file path}
{comprehensive code example}
```

---

{Continue for each major task...}

---

## Reuse Existing Code

**{System Name}:**
```typescript
// {file path} - already exists
{function signature or import to reuse}
```

**{Another System}:**
```typescript
// {file path} - already exists
{function signature or import to reuse}
```

---

## Known Gotchas

| Issue | Why It Happens | Solution |
|-------|----------------|----------|
| {Gotcha 1} | {Root cause} | {How to handle} |
| {Gotcha 2} | {Root cause} | {How to handle} |

---

## Testing Checklist

**After each task:**
- [ ] `npm run build` passes
- [ ] Dev server starts
- [ ] Feature works manually

**Final demo:**
- [ ] {Test case 1}
- [ ] {Test case 2}
- [ ] {Test case 3}

---

## Success Criteria

- [ ] Build passes
- [ ] {Criterion 1}
- [ ] {Criterion 2}
- [ ] {Criterion 3}

---

## Resources

**External Docs:**
- {Link 1}
- {Link 2}

**Project Files:**
- Sprint tracking: `docs/sprints/active/sprint-{milestone}-{number}.md`
- Architecture: `CLAUDE.md`

---

## Recommended Sub-Agents

**Repository:** `~/VibeCoding Projects/awesome-claude-code-subagents-main/`

{Select sub-agents based on sprint type. Reference the selection matrix in the handover README.}

| Phase | Sub-Agent | Purpose | Invocation |
|-------|-----------|---------|------------|
| {Phase 1} | `{agent-name}` | {What it helps with} | `@{agent-name} {task description}` |
| {Phase 2} | `{agent-name}` | {What it helps with} | `@{agent-name} {task description}` |
| {All} | `code-reviewer` | PR review before merge | `@code-reviewer review this PR` |

**How to use:**
1. Ensure agents are in your global `~/.claude/agents/` or project `.claude/agents/`
2. Invoke with `@agent-name` prefix in Claude Code
3. Agents are read-only by default (reviewers) or read-write (developers)

---

*Prepared by Claude Code - {Date}*
