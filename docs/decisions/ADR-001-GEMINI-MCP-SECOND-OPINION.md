# ADR-001: Gemini MCP Integration for Second Opinion Workflow

**Status:** Proposed
**Date:** 2025-12-06
**Deciders:** Sachee Perera

## Context

When working with Claude Code on complex technical decisions, there's value in getting a second opinion from a different AI model. This provides:

1. **Fresh perspective** when stuck on a problem
2. **Parallel analysis** for faster exploration
3. **Consensus building** — when both models agree, higher confidence
4. **Arbitration** — when approaches conflict, forces deeper thinking

The question: Can we create a sub-agent in Claude Code that uses Google's Gemini API?

## Decision

**Use MCP (Model Context Protocol) integration, not sub-agents.**

Claude Code sub-agents are locked to Claude models only (`sonnet`, `opus`, `haiku`). However, MCP provides a better solution for this use case.

### Implementation Strategy

#### Phase 1: Quick Start (MCP Server)

Install an existing Gemini MCP server:

```bash
claude mcp add gemini -- npx -y @anthropic-ai/gemini-mcp
```

Set the API key:
```bash
export GEMINI_API_KEY="your-key"
```

**Recommended MCP Servers:**

| Server | Best For |
|--------|----------|
| `gemini-mcp` (RLabs-Inc) | Collaborative brainstorming, code analysis |
| `gemini-cli-orchestrator` | Multi-step analysis, parallel work |
| `claude-gemini-mcp-slim` | Large context (1M tokens), code analysis |
| `gemini-mcp-tool` | Lightweight, simple queries |

#### Phase 2: Custom Arbiter Skill

Create `.claude/skills/arbiter/SKILL.md`:

```markdown
---
name: arbiter
description: Get Gemini's perspective, then synthesize both viewpoints
---

When invoked:
1. Query Gemini with the current technical question
2. Present Gemini's response verbatim
3. Compare with Claude's perspective
4. Identify: agreements, disagreements, blind spots
5. Synthesize a recommendation with confidence level

Output format:
## Gemini Says
[Their perspective]

## Claude Says
[My perspective]

## Synthesis
- **Agree on:** ...
- **Disagree on:** ...
- **Recommendation:** ...
- **Confidence:** High/Medium/Low
```

#### Phase 3 (Optional): Custom MCP Server

If Phase 1+2 prove valuable, build a custom MCP server that:
- Routes through existing AI Gateway infrastructure
- Adds custom system prompts for "reviewer" mode
- Returns structured JSON for easier synthesis

## Alternatives Considered

### Alternative 1: Claude Code Sub-Agents with Gemini

**Rejected.** Sub-agents only support Claude models. The `model` field accepts:
- Model aliases: `sonnet`, `opus`, `haiku`
- `'inherit'` — uses parent conversation's model
- Omitted — defaults to configured subagent model

All resolve to Claude models only.

### Alternative 2: Build Custom MCP Server First

**Deferred.** Adds development overhead before validating the workflow. Better to start with existing servers, then customize if needed.

### Alternative 3: Use AI Gateway Directly

**Considered for Phase 3.** Since the project already has AI Gateway integration for multiple providers (OpenAI, Anthropic, Google, Deepseek), a custom MCP server could route through existing infrastructure. However, this requires development effort that should wait until the pattern is validated.

## Comparison: MCP vs Sub-Agents

| Aspect | Sub-Agents | MCP Integration |
|--------|-----------|-----------------|
| Model Support | Claude only | Any provider |
| Configuration | YAML in `.claude/agents/` | `.mcp.json` or CLI |
| Use Case Fit | Task delegation | Tool access & collaboration |
| Parallel Execution | Sequential | True parallel possible |
| Context Sharing | Full separation | Flexible data flow |
| **This Use Case** | Not suitable | Perfect fit |

## Usage Patterns

Once implemented, invoke via natural language:

```
> I'm thinking of using Redis for caching here. Use arbiter to get Gemini's take.

> This auth flow feels overcomplicated. Query Gemini and compare approaches.

> I'm stuck on this TypeScript error. Get a fresh perspective from Gemini.
```

## Key Insight

The real value isn't just "what does Gemini think" — it's the **disagreement signal**:

- **Both agree** → High confidence in the approach
- **Both disagree** → Likely a genuinely hard problem
- **They diverge** → Invest more thought here

## Consequences

### Positive

- Get second opinions without leaving Claude Code
- Leverage Gemini's 1M token context for large codebase analysis
- Faster exploration through parallel model queries
- Higher confidence when models agree

### Negative

- Requires Gemini API key and associated costs
- MCP server maintenance/updates
- Potential context synchronization issues between models

### Neutral

- Adds another tool to the workflow
- Requires learning MCP server configuration

## References

- [Claude Code MCP Documentation](https://code.claude.com/docs/en/mcp.md)
- [Claude Code Sub-Agents Documentation](https://code.claude.com/docs/en/sub-agents.md)
- [gemini-mcp on GitHub](https://github.com/RLabs-Inc/gemini-mcp)
- [gemini-cli-orchestrator on GitHub](https://github.com/dnnyngyen/gemini-cli-orchestrator)
