# INF-001: Chat Engine

**Status:** Production

## Purpose

Multi-model streaming chat engine with native tool use, prompt caching, and extended thinking capabilities. Powers all conversational interactions in the application using the Anthropic Claude SDK for maximum flexibility and performance.

## Key Components

### SDK Architecture
- **Primary:** Anthropic Claude SDK (`@anthropic-ai/sdk`) for ALL chat functionality
- **Fallback:** Vercel AI SDK for web search (Perplexity) only
- **Stream Transformer:** Custom SSE transformer (Claude format → UI format)

### Supported Models
- **Anthropic:** Claude Sonnet 4.5, Opus 4
- **OpenAI:** GPT-4o, GPT-5 variants
- **Google:** Gemini 2.5/3 Pro/Flash
- **Deepseek:** R1 and V3

### Core Capabilities
- **Streaming:** Real-time response streaming with reasoning chunks
- **Tool Use:** Native `tool_use` for advisory search, memory management, cross-model queries
- **Prompt Caching:** Cost/latency optimization for project context (Anthropic)
- **Extended Thinking:** Full access to Claude's reasoning capabilities
- **Agentic Loop:** Up to 5 iterations of tool use per request

## Entry Points

- `app/api/chat/route.ts` - Main chat API endpoint
- `lib/ai/chat/handlers/claude-handler.ts` - Claude-specific streaming handler
- `lib/ai/claude-client.ts` - Anthropic client singleton
- `lib/ai/claude-stream-transformer.ts` - SSE format conversion
- `lib/ai/claude-message-converter.ts` - UIMessage → Claude format

## Dependencies

- Anthropic Claude SDK for chat
- Context Manager (INF-003) for project context injection
- Memory System (INF-002) for token tracking and compression
- Agent Infrastructure (INF-004) for tool execution

## Related Documentation

- [Module Registry](../REGISTRY.md)
- [SDK Architecture Decision](../../../CLAUDE.md#m39-sdk-architecture-decision)
