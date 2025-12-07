# M3.9: Claude SDK Migration Plan

**Status:** ✅ COMPLETE
**Started:** 2025-12-07
**Completed:** 2025-12-07
**Goal:** Migrate chat from Vercel AI SDK to Anthropic Claude SDK with native tool_use for advisory file search

---

## Executive Summary

Migrate `/api/chat/route.ts` from Vercel AI SDK (`ai` package) to Anthropic Claude SDK (`@anthropic-ai/sdk`) to enable:
- Native `tool_use` for advisory file search and reading
- Prompt caching for project context (cost/latency optimization)
- Extended thinking support
- Direct access to Claude API features

**Architecture Decision:** Claude SDK for chat, AI Gateway for backend functions (embeddings, summarization).

---

## Current vs Target Architecture

### Current State
```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (useChat hook)                                     │
│         │                                                    │
│         ▼                                                    │
│  /api/chat/route.ts                                          │
│  ├── Vercel AI SDK (streamText)                              │
│  ├── AI Gateway provider (getModel)                          │
│  └── toUIMessageStreamResponse()                             │
│                                                              │
│  Problems:                                                   │
│  • No native tool_use access                                 │
│  • Prompt caching not exposed                                │
│  • Abstraction limits Claude-specific features               │
└─────────────────────────────────────────────────────────────┘
```

### Target State
```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (useChat hook - unchanged)                         │
│         │                                                    │
│         ▼                                                    │
│  /api/chat/route.ts                                          │
│  ├── @anthropic-ai/sdk (Anthropic client)                    │
│  ├── Native messages.create() with streaming                 │
│  ├── Custom stream transformer (Claude → UI format)          │
│  └── Native tool_use for advisory files                      │
│                                                              │
│  Benefits:                                                   │
│  • Full tool_use support (search, read, list)                │
│  • Prompt caching for context                                │
│  • Extended thinking when needed                             │
│  • Direct API access                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Base Migration (No Tools)

### Step 1.1: Install Claude SDK

```bash
npm install @anthropic-ai/sdk
```

**Files affected:** `package.json`

### Step 1.2: Create Claude Client Module

**New file:** `lib/ai/claude-client.ts`

```typescript
import Anthropic from '@anthropic-ai/sdk';

// Singleton client instance
let client: Anthropic | null = null;

export function getClaudeClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.AI_GATEWAY_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY or AI_GATEWAY_API_KEY is required');
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

// Model ID mapping (strip provider prefix)
export function getClaudeModelId(model: string): string {
  // 'anthropic/claude-opus-4-5-20251101' → 'claude-opus-4-5-20251101'
  return model.replace('anthropic/', '');
}
```

### Step 1.3: Create Message Format Converter

**New file:** `lib/ai/claude-message-converter.ts`

```typescript
import type { UIMessage } from 'ai';
import type { MessageParam, ContentBlockParam } from '@anthropic-ai/sdk/resources/messages';

/**
 * Convert UIMessage[] to Claude MessageParam[]
 *
 * UIMessage format:
 * { id, role: 'user'|'assistant'|'system', parts: [{ type: 'text', text }] }
 *
 * Claude format:
 * { role: 'user'|'assistant', content: string | ContentBlockParam[] }
 */
export function convertToClaudeMessages(messages: UIMessage[]): {
  systemPrompt: string;
  messages: MessageParam[];
} {
  let systemPrompt = '';
  const claudeMessages: MessageParam[] = [];

  for (const msg of messages) {
    // Extract system messages for system parameter
    if (msg.role === 'system') {
      const text = msg.parts
        ?.filter(p => p.type === 'text')
        .map(p => (p as { text?: string }).text || '')
        .join('\n');
      systemPrompt += (systemPrompt ? '\n\n' : '') + text;
      continue;
    }

    // Convert user/assistant messages
    const content = msg.parts
      ?.filter(p => p.type === 'text')
      .map(p => (p as { text?: string }).text || '')
      .join('\n') || '';

    claudeMessages.push({
      role: msg.role as 'user' | 'assistant',
      content,
    });
  }

  return { systemPrompt, messages: claudeMessages };
}
```

### Step 1.4: Create Stream Transformer

**New file:** `lib/ai/claude-stream-transformer.ts`

This is the critical piece - transforms Claude's SSE format to the UI format expected by `useChat`.

```typescript
/**
 * Claude SSE events:
 * - message_start: { message: { id, model, ... } }
 * - content_block_start: { index, content_block: { type: 'text', text: '' } }
 * - content_block_delta: { index, delta: { type: 'text_delta', text: '...' } }
 * - content_block_stop: { index }
 * - message_delta: { delta: { stop_reason }, usage: { output_tokens } }
 * - message_stop: {}
 *
 * UI SSE events (what useChat expects):
 * - { type: 'start' }
 * - { type: 'text-delta', id: '0', delta: '...' }
 * - { type: 'finish', finishReason: 'stop' }
 */

import Anthropic from '@anthropic-ai/sdk';
import type { Stream } from '@anthropic-ai/sdk/streaming';
import type { RawMessageStreamEvent } from '@anthropic-ai/sdk/resources';

export async function* transformClaudeStream(
  stream: Stream<RawMessageStreamEvent>
): AsyncGenerator<string> {
  // Emit start
  yield `data: ${JSON.stringify({ type: 'start' })}\n\n`;
  yield `data: ${JSON.stringify({ type: 'start-step' })}\n\n`;
  yield `data: ${JSON.stringify({ type: 'text-start', id: '0' })}\n\n`;

  let hasContent = false;

  for await (const event of stream) {
    switch (event.type) {
      case 'content_block_delta':
        if (event.delta.type === 'text_delta') {
          hasContent = true;
          yield `data: ${JSON.stringify({
            type: 'text-delta',
            id: '0',
            delta: event.delta.text,
          })}\n\n`;
        }
        break;

      case 'message_stop':
        yield `data: ${JSON.stringify({ type: 'text-end', id: '0' })}\n\n`;
        yield `data: ${JSON.stringify({ type: 'finish-step' })}\n\n`;
        yield `data: ${JSON.stringify({ type: 'finish', finishReason: 'stop' })}\n\n`;
        break;

      case 'message_delta':
        // Could extract stop_reason here if needed
        break;
    }
  }

  yield `data: [DONE]\n\n`;
}

/**
 * Create a ReadableStream from Claude's stream
 */
export function createUIStreamFromClaude(
  stream: Stream<RawMessageStreamEvent>
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of transformClaudeStream(stream)) {
          controller.enqueue(encoder.encode(chunk));
        }
      } catch (error) {
        controller.error(error);
      } finally {
        controller.close();
      }
    },
  });
}
```

### Step 1.5: Update Chat Route

**File:** `app/api/chat/route.ts`

Replace the `streamText` call with Claude SDK:

```typescript
// NEW: Import Claude modules
import { getClaudeClient, getClaudeModelId } from '@/lib/ai/claude-client';
import { convertToClaudeMessages } from '@/lib/ai/claude-message-converter';
import { createUIStreamFromClaude } from '@/lib/ai/claude-stream-transformer';

// REPLACE: The streamText call (around line 932)
// OLD:
// const result = streamText({
//   model: getModel(webSearch ? 'perplexity/sonar' : model),
//   messages: modelMessages,
//   system: systemPrompt,
//   onFinish: async ({ text, usage }) => { ... }
// });

// NEW:
const client = getClaudeClient();
const { messages: claudeMessages } = convertToClaudeMessages(validatedMessages);

const stream = client.messages.stream({
  model: getClaudeModelId(model),
  max_tokens: 8192,
  system: systemPrompt,
  messages: claudeMessages,
});

// Handle message completion for persistence
stream.on('message', async (message) => {
  // Extract text from response
  const text = message.content
    .filter(block => block.type === 'text')
    .map(block => block.text)
    .join('');

  // ... existing persistence logic (save user message, assistant message, etc.)
});

// Return streaming response
return new Response(createUIStreamFromClaude(stream), {
  headers: {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Chat-Id': activeChatId || '',
  },
});
```

### Step 1.6: Environment Variable

Add `ANTHROPIC_API_KEY` to `.env.local`:

```bash
ANTHROPIC_API_KEY=sk-ant-...
```

Or reuse `AI_GATEWAY_API_KEY` if it works with Anthropic directly.

---

## Phase 2: Advisory Tool Use

### Step 2.1: Define Tools in Claude Format

**New file:** `lib/ai/claude-advisory-tools.ts`

```typescript
import type { Tool } from '@anthropic-ai/sdk/resources/messages';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync, readdirSync, statSync } from 'fs';
import { generateEmbedding } from '@/lib/ai/embedding';
import { supabase } from '@/lib/db/client';
import { ADVISORY_PROJECT_ID } from '@/lib/db/types';

/**
 * Tool definitions for Claude's tool_use
 */
export const advisoryTools: Tool[] = [
  {
    name: 'search_advisory',
    description: `Search advisory files (deals, clients, meetings, valuations).
Use when: User asks about a specific deal, client, or wants a briefing.
Examples: "Brief me on MyTab", "What's SwiftCheckin's valuation?", "Show me ControlShiftAI research"
Returns: Relevant file excerpts with similarity scores.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Search query - company name, topic, or natural language question',
        },
        entity_type: {
          type: 'string',
          enum: ['deal', 'client', 'all'],
          description: 'Filter by entity type',
        },
        entity_name: {
          type: 'string',
          description: 'Filter by specific company/entity name',
        },
        limit: {
          type: 'number',
          description: 'Max results to return (1-20)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'read_advisory_file',
    description: `Read the full contents of a specific advisory file.
Use when: User wants details from a specific file, or after search_advisory returns a relevant file.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        filename: {
          type: 'string',
          description: 'The filename path (e.g., "advisory/deals/MyTab/master-doc-mytab.md")',
        },
      },
      required: ['filename'],
    },
  },
  {
    name: 'list_advisory_folder',
    description: `List files and folders within an advisory entity's directory.
Use when: User wants to explore what documents are available for a deal/client.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        entity_type: {
          type: 'string',
          enum: ['deal', 'client'],
          description: 'Type of entity',
        },
        entity_name: {
          type: 'string',
          description: 'Entity name (e.g., "MyTab", "SwiftCheckin")',
        },
        subfolder: {
          type: 'string',
          description: 'Optional subfolder path',
        },
      },
      required: ['entity_type', 'entity_name'],
    },
  },
  {
    name: 'glob_advisory',
    description: `Find files by FILENAME pattern (like Unix find/glob).
Use when: User asks to find files by name pattern, date, or file type.
Examples: "*email*" matches email files, "*2025-12*" matches December files.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        pattern: {
          type: 'string',
          description: 'Glob pattern (e.g., "*email*", "*2025-12*")',
        },
        entity_type: { type: 'string', enum: ['deal', 'client', 'all'] },
        entity_name: { type: 'string' },
      },
      required: ['pattern'],
    },
  },
  {
    name: 'grep_advisory',
    description: `Search file CONTENTS for text (like Unix grep).
Use when: User asks to find specific text, names, dates, or phrases in files.
Examples: Find mentions of "Mikaela", "$5M", or "Series A".`,
    input_schema: {
      type: 'object' as const,
      properties: {
        pattern: { type: 'string', description: 'Text to search for' },
        entity_type: { type: 'string', enum: ['deal', 'client', 'all'] },
        entity_name: { type: 'string' },
        subfolder: { type: 'string' },
      },
      required: ['pattern'],
    },
  },
];

/**
 * Execute a tool and return the result
 */
export async function executeAdvisoryTool(
  name: string,
  input: Record<string, unknown>
): Promise<string> {
  switch (name) {
    case 'search_advisory':
      return await searchAdvisory(input);
    case 'read_advisory_file':
      return await readAdvisoryFile(input);
    case 'list_advisory_folder':
      return await listAdvisoryFolder(input);
    case 'glob_advisory':
      return await globAdvisory(input);
    case 'grep_advisory':
      return await grepAdvisory(input);
    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` });
  }
}

// Tool implementations (from existing advisory-chat-tools.ts)
async function searchAdvisory(input: Record<string, unknown>): Promise<string> {
  const { query, entity_type = 'all', entity_name, limit = 5 } = input as {
    query: string;
    entity_type?: string;
    entity_name?: string;
    limit?: number;
  };

  const embedding = await generateEmbedding(query);

  const { data: results, error } = await supabase.rpc('search_advisory_files', {
    query_embedding: embedding,
    query_text: query,
    p_project_id: ADVISORY_PROJECT_ID,
    entity_type_filter: entity_type === 'all' ? null : entity_type,
    entity_name_filter: entity_name || null,
    match_count: limit,
    vector_weight: 0.7,
    text_weight: 0.3,
    min_similarity: 0.25,
  });

  if (error) {
    return JSON.stringify({ success: false, error: error.message });
  }

  if (!results || results.length === 0) {
    return JSON.stringify({
      success: true,
      message: 'No matching advisory files found.',
      results: []
    });
  }

  const formatted = results.map((r: any, i: number) => ({
    index: i + 1,
    entity_name: r.entity_name,
    entity_type: r.entity_type,
    filename: r.filename,
    score: Math.round(r.combined_score * 100) / 100,
    content: r.content_text.length > 1000
      ? r.content_text.substring(0, 1000) + '...'
      : r.content_text,
  }));

  return JSON.stringify({
    success: true,
    message: `Found ${results.length} advisory files`,
    results: formatted,
  });
}

async function readAdvisoryFile(input: Record<string, unknown>): Promise<string> {
  const { filename } = input as { filename: string };

  const normalizedPath = filename.startsWith('advisory/') ? filename : `advisory/${filename}`;

  if (normalizedPath.includes('..')) {
    return JSON.stringify({ success: false, error: 'Invalid file path' });
  }

  const fullPath = join(process.cwd(), normalizedPath);

  if (!existsSync(fullPath)) {
    return JSON.stringify({ success: false, error: `File not found: ${normalizedPath}` });
  }

  const content = await readFile(fullPath, 'utf-8');
  const truncated = content.length > 8000
    ? content.substring(0, 8000) + '\n\n... [Content truncated]'
    : content;

  return JSON.stringify({
    success: true,
    filename: normalizedPath,
    content: truncated,
  });
}

async function listAdvisoryFolder(input: Record<string, unknown>): Promise<string> {
  const { entity_type, entity_name, subfolder } = input as {
    entity_type: 'deal' | 'client';
    entity_name: string;
    subfolder?: string;
  };

  const typeFolder = entity_type === 'deal' ? 'deals' : 'clients';
  let targetPath = join(process.cwd(), 'advisory', typeFolder, entity_name);

  if (subfolder) {
    targetPath = join(targetPath, subfolder);
  }

  if (!existsSync(targetPath)) {
    return JSON.stringify({ success: false, error: 'Folder not found' });
  }

  const entries = readdirSync(targetPath);
  const files = entries
    .filter(e => !e.startsWith('.'))
    .map(entry => {
      const entryPath = join(targetPath, entry);
      const stat = statSync(entryPath);
      return {
        name: entry,
        type: stat.isDirectory() ? 'directory' : 'file',
        size: stat.isFile() ? stat.size : undefined,
      };
    })
    .sort((a, b) => {
      if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

  return JSON.stringify({
    success: true,
    path: `advisory/${typeFolder}/${entity_name}${subfolder ? '/' + subfolder : ''}`,
    files,
  });
}
```

### Step 2.2: Update Stream Transformer for Tool Use

Update `lib/ai/claude-stream-transformer.ts` to handle tool_use blocks:

```typescript
// Add tool_use handling to the stream transformer
case 'content_block_start':
  if (event.content_block.type === 'tool_use') {
    // Emit tool start event
    yield `data: ${JSON.stringify({
      type: 'tool-start',
      toolCallId: event.content_block.id,
      toolName: event.content_block.name,
    })}\n\n`;
  }
  break;

case 'content_block_stop':
  // Check if this was a tool_use block that needs execution
  // (handled in the main route after stream completes)
  break;
```

### Step 2.3: Implement Agentic Loop in Chat Route

When Claude returns a `tool_use` block, execute it and continue:

```typescript
// In route.ts
async function handleChatWithTools(
  client: Anthropic,
  model: string,
  systemPrompt: string,
  messages: MessageParam[],
  maxIterations = 5
): Promise<{ stream: ReadableStream; finalText: string }> {
  let currentMessages = [...messages];
  let iteration = 0;
  let allText = '';

  while (iteration < maxIterations) {
    const response = await client.messages.create({
      model: getClaudeModelId(model),
      max_tokens: 8192,
      system: systemPrompt,
      messages: currentMessages,
      tools: advisoryTools,
    });

    // Check for tool_use
    const toolUseBlocks = response.content.filter(b => b.type === 'tool_use');

    if (toolUseBlocks.length === 0) {
      // No tools, extract text and return
      allText = response.content
        .filter(b => b.type === 'text')
        .map(b => b.text)
        .join('');
      break;
    }

    // Execute tools
    const toolResults = await Promise.all(
      toolUseBlocks.map(async (block) => ({
        type: 'tool_result' as const,
        tool_use_id: block.id,
        content: await executeAdvisoryTool(block.name, block.input as Record<string, unknown>),
      }))
    );

    // Add assistant response and tool results to messages
    currentMessages.push({ role: 'assistant', content: response.content });
    currentMessages.push({ role: 'user', content: toolResults });

    iteration++;
  }

  // Create final streaming response (or just return the text)
  // ...
}
```

---

## Phase 3: UI Updates

### Step 3.1: Add Tool Invocation Part Handling

Update `components/chat/chat-interface.tsx` to render tool invocations:

```typescript
// Add to TOOL_ICON_MAP
const TOOL_ICON_MAP: Record<string, LucideIcon> = {
  // ... existing icons
  search_advisory: FolderSearchIcon,
  read_advisory_file: FileTextIcon,
  list_advisory_folder: FolderSearchIcon,
};

// Add tool-invocation handling in the parts loop
if (partType === 'tool-invocation') {
  // Render ChainOfThought component showing tool execution
}
```

### Step 3.2: Stream Tool Events to UI

The stream transformer should emit tool events so the UI can show:
- "Searching advisory files..."
- "Reading MyTab master doc..."
- Tool results (collapsed by default)

---

## Phase 4: Optimizations

### Step 4.1: Prompt Caching

Add cache control headers to system prompt:

```typescript
const response = await client.messages.create({
  model: getClaudeModelId(model),
  max_tokens: 8192,
  system: [
    {
      type: 'text',
      text: systemPrompt,
      cache_control: { type: 'ephemeral' }, // Cache for 5 minutes
    },
  ],
  messages: claudeMessages,
  tools: advisoryTools,
});
```

### Step 4.2: Extended Thinking (Optional)

For complex advisory analysis:

```typescript
const response = await client.messages.create({
  model: 'claude-opus-4-5-20251101',
  max_tokens: 16000,
  thinking: {
    type: 'enabled',
    budget_tokens: 10000,
  },
  // ...
});
```

---

## Testing Checklist

### Phase 1 Tests
- [ ] Basic chat works (no tools)
- [ ] Streaming displays correctly
- [ ] Messages persist to database
- [ ] Embeddings generate for messages
- [ ] Context tracking works
- [ ] Memory extraction triggers

### Phase 2 Tests
- [x] "Brief me on MyTab" triggers search_advisory
- [ ] Tool results display in UI
- [x] Multi-step tool use works (search → read)
- [x] Error handling for missing files
- [x] Tool execution doesn't block streaming
- [x] glob_advisory finds files by pattern (e.g., "*email*")
- [x] grep_advisory finds text in file contents
- [x] Complex workflow: "last email to Mikaela" uses grep → read

### Phase 3 Tests
- [ ] UI shows tool invocation status
- [ ] Tool results are collapsible
- [ ] Citations from tools work

---

## Rollback Plan

If issues arise:

1. **Immediate:** Revert `route.ts` changes, keep Vercel AI SDK
2. **Partial:** Keep Claude SDK but disable tools
3. **Full:** `git revert` the entire migration

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `lib/ai/claude-client.ts` | CREATE | Anthropic client singleton |
| `lib/ai/claude-message-converter.ts` | CREATE | UIMessage → Claude format |
| `lib/ai/claude-stream-transformer.ts` | CREATE | Claude SSE → UI SSE |
| `lib/ai/claude-advisory-tools.ts` | CREATE | 5 tools: search, read, list, glob, grep |
| `app/api/chat/route.ts` | MODIFY | Use Claude SDK instead of Vercel |
| `components/chat/chat-interface.tsx` | MODIFY | Render tool invocations |
| `package.json` | MODIFY | Add @anthropic-ai/sdk |
| `.env.local` | MODIFY | Add ANTHROPIC_API_KEY |

---

## Estimated Effort

| Phase | Scope | Complexity |
|-------|-------|------------|
| Phase 1 | Base migration | Medium (3-4 hours) |
| Phase 2 | Tool use | Medium (2-3 hours) |
| Phase 3 | UI updates | Low (1-2 hours) |
| Phase 4 | Optimizations | Low (1 hour) |

**Total:** ~8-10 hours

---

## Success Criteria

1. All existing chat functionality works identically
2. "Brief me on MyTab" returns detailed info from advisory files
3. Tool invocations show in UI with status
4. No regressions in message persistence, embeddings, or memory
5. Streaming feels as fast or faster than current implementation
