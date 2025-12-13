# INF-004: Agent Infrastructure

**Status:** Production

## Purpose

Tool execution framework enabling agentic workflows through native Claude `tool_use` capabilities. Provides 11 specialized tools for file search, memory management, library access, and cross-model queries with automatic approval for read-only operations.

## Key Components

### Tool Categories

**Advisory Tools (5):**
- `search_advisory` - Hybrid search in advisory files
- `read_advisory_file` - Full file content retrieval
- `list_advisory_files` - Directory listing
- `glob_advisory_files` - Pattern-based file search
- `grep_advisory_files` - Content-based file search

**Memory Tools (2):**
- `create_memory` - Store conversation insights
- `search_memory` - Semantic memory retrieval

**Library Tools (4):**
- `search_inspiration` - Search inspiration library (blogs, videos, LinkedIn)
- `read_inspiration_file` - Read inspiration file from DB
- `search_reference` - Search reference library (identity, playbooks, LinkedIn)
- `read_reference_file` - Read reference file from DB

**Cross-Model Query Tools (2):**
- `ask_chatgpt` - Query GPT-5.2 with full context (parallel answer or second opinion)
- `ask_gemini` - Query Gemini 3 Pro with full context (parallel answer or second opinion)

### Agentic Loop
- **Max Iterations:** 5 per request
- **Auto-Approval:** All read-only tools (search, read, list, glob, grep)
- **Context Injection:** Full conversation + project context passed to cross-model tools
- **Tool Result Streaming:** Real-time tool execution results in UI

### Tool Definition Location
**CRITICAL:** ALL tools MUST be defined in `lib/ai/claude-advisory-tools.ts`
- Tool definitions in `advisoryTools` array
- Execution logic in `executeAdvisoryTool()` switch statement
- No separate tool files allowed

## Entry Points

- `lib/ai/claude-advisory-tools.ts` - **SINGLE SOURCE OF TRUTH** for all chat tools
- `lib/ai/chat/handlers/claude-handler.ts` - Tool execution orchestration
- `app/api/chat/route.ts` - Agentic loop implementation

## Dependencies

- Anthropic Claude SDK for native `tool_use`
- Retrieval System (INF-003) for file search and library access
- Memory System (INF-002) for memory operations
- Chat Engine (INF-001) for conversation context

## Related Documentation

- [Module Registry](../REGISTRY.md)
- [Where to Add New Tools](../../../CLAUDE.md#critical-where-to-add-new-tools)
- [M3.7: Advisory File Search](../../../CLAUDE.md#m37-advisory-file-search)
