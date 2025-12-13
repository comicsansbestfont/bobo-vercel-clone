# Bobo Platform - Module Registry

## Overview

This document serves as the canonical source of truth for all modules in the Bobo platform. Each module is assigned a unique identifier and tracked with its current status.

**Last Updated**: December 13, 2025

---

## Infrastructure Modules

Core technical capabilities that power the platform.

| Module ID | Name | Status | Purpose | Entry Point |
|-----------|------|--------|---------|-------------|
| INF-001 | Chat Engine | Production | Multi-model streaming chat with tool use | `lib/ai/chat/`, `app/api/chat/route.ts` |
| INF-002 | Memory System | Production | Context compression and memory extraction | `lib/memory/`, `app/api/memory/` |
| INF-003 | Retrieval/RAG | Production | Double-loop hybrid search (project + global) | `lib/ai/embedding.ts`, `lib/ai/context-manager.ts` |
| INF-004 | Agent SDK | Production | Tool execution framework for Claude SDK | `lib/ai/claude-advisory-tools.ts` |

### Module Details

#### INF-001: Chat Engine
- **SDK**: Anthropic Claude SDK (`@anthropic-ai/sdk`)
- **Models Supported**: Claude, GPT, Gemini, Deepseek
- **Capabilities**: Streaming, tool use, prompt caching, extended thinking
- **Documentation**: [chat-engine.md](./infrastructure/chat-engine.md)

#### INF-002: Memory System
- **Components**: Context tracking, compression, extraction
- **Token Counting**: `gpt-tokenizer` with heuristic fallback
- **Usage States**: Safe (<70%), Warning (70-90%), Critical (>90%)
- **Documentation**: [memory-system.md](./infrastructure/memory-system.md)

#### INF-003: Retrieval/RAG
- **Architecture**: Double-loop (Loop A: Project Context, Loop B: Global Search)
- **Search Algorithm**: Hybrid (70% vector + 30% BM25 full-text)
- **Caching**: Model-specific (Anthropic prompt caching, Gemini context caching)
- **Documentation**: [retrieval-system.md](./infrastructure/retrieval-system.md)

#### INF-004: Agent SDK
- **Tool Count**: 11 tools (5 advisory, 4 library search, 2 cross-model)
- **Execution**: Agentic loop (up to 5 iterations per request)
- **Auto-approval**: Read-only tools auto-approved
- **Documentation**: [agent-infrastructure.md](./infrastructure/agent-infrastructure.md)

---

## Knowledge Modules

Organized repositories of domain-specific information with fixed project IDs.

| Module ID | Name | Project UUID | File Count | Directory | Status |
|-----------|------|--------------|------------|-----------|--------|
| KNO-001 | Advisory Library | `11111111-1111-1111-1111-111111111111` | 43 | `advisory/` | Production |
| KNO-002 | Inspiration Library | `22222222-2222-2222-2222-222222222222` | 741 | `01_Inspiration/` | Production |
| KNO-003 | Reference Library | `33333333-3333-3333-3333-333333333333` | 213 | `04_Reference/` | Production |

### Module Details

#### KNO-001: Advisory Library
- **Purpose**: Deal and client context for GTM advisory work
- **Content Types**:
  - Deals: MyTab, SwiftCheckin, ArcheloLab, ControlShiftAI, Talvin, Tandm
  - Clients: SwiftCheckin
- **Mode**: File-reference (reads from disk, not database)
- **Tools**: `search_advisory`, `read_advisory_file`
- **Indexing**: `npm run index-advisory`
- **Documentation**: [advisory-library.md](./knowledge/advisory-library.md)

#### KNO-002: Inspiration Library
- **Purpose**: Industry thought leadership and content patterns
- **Content Types**:
  - Blog posts (T2D3, MRR Unlocked, BasicArts, Fluint, The Venture Crew)
  - Video transcripts
  - LinkedIn archives (Brett Jansen: 391 posts, Alex Estner: 626 posts)
- **Tools**: `search_inspiration`, `read_inspiration_file`
- **Indexing**: `npm run index-inspiration`
- **Documentation**: [inspiration-library.md](./knowledge/inspiration-library.md)

#### KNO-003: Reference Library
- **Purpose**: Personal identity, playbooks, and internal patterns
- **Content Types**:
  - Identity documents (personal brand, writing voice)
  - Medium posts
  - Personal LinkedIn export
  - Internal playbooks (CorePlan, SwiftCheckin - pattern library only)
- **Tools**: `search_reference`, `read_reference_file`
- **Guardrail**: Playbooks for patterns only (no verbatim by default)
- **Indexing**: `npm run index-reference`
- **Documentation**: [reference-library.md](./knowledge/reference-library.md)

---

## Use Case Modules

End-user workflows that orchestrate infrastructure and knowledge modules.

| Module ID | Name | Status | Dependencies | Purpose |
|-----------|------|--------|--------------|---------|
| USE-001 | Advisory Workflow | Live | INF-001, INF-004, KNO-001 | GTM advisory consulting with deal context |
| USE-002 | Deal Workspace | Designed | INF-001, INF-002, INF-004, KNO-001 | Multi-deal management with HubSpot-style UI |
| USE-003 | Content Studio | Planned | INF-001, INF-004, KNO-002, KNO-003 | LinkedIn content creation with inspiration |

### Module Details

#### USE-001: Advisory Workflow
- **Status**: Live (Primary use case)
- **User**: GTM advisory consultants
- **Workflow**:
  1. Select deal/client project
  2. Chat with deal context injected
  3. Use advisory search tools for deep dives
  4. Memory extraction for decision tracking
- **Dependencies**:
  - Chat Engine (INF-001) - Conversation interface
  - Agent SDK (INF-004) - Advisory search tools
  - Advisory Library (KNO-001) - Deal/client context
- **Documentation**: [advisory-workflow.md](./use-cases/advisory-workflow.md)

#### USE-002: Deal Workspace
- **Status**: Designed (Architecture complete, implementation pending)
- **User**: Advisory teams managing multiple deals
- **Architecture**: HubSpot-style 3-column layout
  - Left: Deal properties, contacts, files
  - Middle: Activity timeline
  - Right: AI chat panel with suggestions
- **Dependencies**:
  - Chat Engine (INF-001) - Multi-deal conversations
  - Memory System (INF-002) - Workspace-level compression
  - Agent SDK (INF-004) - Cross-deal search
  - Advisory Library (KNO-001) - Deal context
- **Key Files** (planned):
  - `components/deals/` - UI components
  - `lib/deals/` - Types and queries
- **Documentation**: [deal-workspace.md](./use-cases/deal-workspace.md) (full architecture spec)

#### USE-003: Content Studio
- **Status**: Planned (Concept stage)
- **User**: Content creators (LinkedIn posts, articles)
- **Workflow**:
  1. Select content type/format
  2. Chat with inspiration and reference context
  3. Draft generation with style matching
  4. Iterative refinement with pattern library
- **Dependencies**:
  - Chat Engine (INF-001) - Content conversation
  - Agent SDK (INF-004) - Inspiration/reference search
  - Inspiration Library (KNO-002) - Thought leadership patterns
  - Reference Library (KNO-003) - Personal voice/style
- **Documentation**: [content-studio.md](./use-cases/content-studio.md)

---

## Cross-Module Tools

Tools defined in `lib/ai/claude-advisory-tools.ts`.

### Advisory Tools
| Tool Name | Target Module | Auto-Approved | Purpose |
|-----------|---------------|---------------|---------|
| `search_advisory` | KNO-001 | Yes | Hybrid search across deal/client files |
| `read_advisory_file` | KNO-001 | Yes | Full file read from advisory library |
| `list_advisory_files` | KNO-001 | Yes | List all indexed advisory files |
| `glob_advisory` | KNO-001 | Yes | Pattern-based file search |
| `grep_advisory` | KNO-001 | Yes | Content-based file search |

### Knowledge Library Tools
| Tool Name | Target Module | Auto-Approved | Purpose |
|-----------|---------------|---------------|---------|
| `search_inspiration` | KNO-002 | Yes | Semantic search in inspiration library |
| `read_inspiration_file` | KNO-002 | Yes | Full file read from inspiration library |
| `search_reference` | KNO-003 | Yes | Semantic search in reference library |
| `read_reference_file` | KNO-003 | Yes | Full file read from reference library |

### Cross-Model Query Tools
| Tool Name | Target Model | Query Modes | Purpose |
|-----------|--------------|-------------|---------|
| `ask_chatgpt` | `gpt-5.2` | parallel_answer, second_opinion | Cross-model query via Vercel AI Gateway |
| `ask_gemini` | `gemini-3-pro-preview` | parallel_answer, second_opinion | Cross-model query via Vercel AI Gateway |

---

## Module Status Definitions

| Status | Description |
|--------|-------------|
| **Production** | Fully implemented, tested, actively used |
| **Live** | Production-ready primary use case |
| **Designed** | Architecture complete, implementation pending |
| **Planned** | Concept stage, requirements gathering |
| **Deprecated** | Marked for retirement |
| **Archived** | Removed from active codebase |

---

## Version History

| Date | Change | Author |
|------|--------|--------|
| 2025-12-13 | Documentation reorganization - consolidated use-cases into docs/modules/ | System |
| 2025-12-13 | Initial module registry created | System |
| 2025-12-02 | Advisory Library (M3.7) completed | System |
| 2025-12-02 | Advisory Project Integration (M3.8) completed | System |
| 2025-11-29 | Embedding blocker resolved | System |

---

## References

- [Module Architecture Overview](./README.md)
- [CLAUDE.md](../../CLAUDE.md) - Project development guide
