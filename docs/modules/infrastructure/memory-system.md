# INF-002: Memory System

**Status:** Production

## Purpose

Automatic context compression and memory extraction system that monitors token usage, triggers compression when context limits are approached, and manages conversation history to stay within model constraints.

## Key Components

### Context Tracking
- **Token Counting:** Primary via `gpt-tokenizer` with heuristic fallback (text.length / 4)
- **Three-Segment Tracking:**
  - System prompts (project context, custom instructions)
  - Conversation history (past messages)
  - Draft input (current user message)
- **Model-Specific Limits:** Supports OpenAI, Anthropic, Google, Deepseek context windows

### Usage States
- **Safe:** < 70% of context limit (green)
- **Warning:** 70-90% of context limit (yellow)
- **Critical:** > 90% of context limit (red) - triggers auto-compression

### Compression Strategy
- Keeps most recent 4 messages intact
- Summarizes older messages using `gpt-4o-mini`
- Preserves system prompts
- Inserts summary as system message
- Maintains conversation continuity

### Memory Extraction
- Hybrid search (70% vector + 30% BM25)
- Semantic memory storage with embeddings
- Memory entries can be created, searched, and retrieved via tools

## Entry Points

- `lib/context-tracker.ts` - Token counting and usage state calculation
- `lib/memory-manager.ts` - Automatic compression logic
- `lib/memory/` - Memory extraction and storage utilities
- `app/api/memory/compress/route.ts` - Compression API endpoint
- `app/api/memory/entries/route.ts` - Memory CRUD operations

## Dependencies

- `gpt-tokenizer` package for accurate token counting
- Chat Engine (INF-001) for message format compatibility
- Retrieval System (INF-003) for memory search

## Related Documentation

- [Module Registry](../REGISTRY.md)
- [Context Management Flow](../../../CLAUDE.md#context-management-flow)
