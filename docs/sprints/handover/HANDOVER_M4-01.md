# Sprint M4-01 Execution Guide

**Sprint:** M4-01 - Claude Agent SDK Integration
**Duration:** November 26 - December 10, 2025
**Prepared:** November 25, 2025

---

## TL;DR (Plain English Summary)

**What we're building:** We're adding "Agent Mode" to Bobo—a toggle that transforms the chatbot from a simple question-answerer into an AI that can actually read, write, and edit files, run bash commands, and search through codebases. Think of it like the difference between asking someone for directions versus having them drive you there. Currently, Bobo can only talk. With Agent Mode, Bobo can DO things.

**The core architecture:** When Agent Mode is ON, we bypass our normal multi-provider AI Gateway (GPT, Gemini, etc.) and route directly to Claude's Agent SDK. The SDK comes with 6 built-in tools (Read, Write, Edit, Bash, Glob, Grep) that Claude can use autonomously. We inject the user's personal memories (M3) and the active project's files (M2) into the agent's system prompt, so Claude has all the context it needs. The agent streams its work back to the UI, showing tool executions in real-time.

**The three phases:** Phase 1 is backend wiring—getting the SDK installed, adding the `agentMode` routing, and hooking up our existing memory/project systems. Phase 2 is the UI—building the toggle button, streaming messages, and components to display tool results beautifully. Phase 3 is safety—confirmation dialogs before writes, and hooks that block dangerous commands like `rm -rf /`.

**Key design decisions:** We're using a "permission tier" system: Read operations auto-approve (low risk), Write/Edit operations require user confirmation (medium risk), and dangerous patterns are hard-blocked (high risk). The SDK manages its own conversation context, so we might need to adjust our token tracker. We're downgrading Zod from v4 to v3.24.1 because the SDK requires it.

**What success looks like:** A user selects a Claude model, toggles "Agent Mode" ON, and asks "Find all TODO comments in this project." Claude uses Grep to search, displays the results in a nice terminal-style component, and the user never had to leave the chat. For writes, they get a confirmation dialog. For `rm -rf /`, they get an instant block.

---

## Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BOBO CHAT APPLICATION                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐     ┌──────────────────────────────────────────────────┐  │
│  │   Chat UI   │────▶│                 /api/chat                         │  │
│  │             │     │  ┌────────────────────┬─────────────────────┐    │  │
│  │ • Input     │     │  │   agentMode=false  │    agentMode=true   │    │  │
│  │ • Messages  │     │  │        ▼           │          ▼          │    │  │
│  │ • Toggle    │     │  │  ┌──────────────┐  │  ┌───────────────┐  │    │  │
│  │ • Tools     │     │  │  │ AI Gateway   │  │  │ Agent Handler │  │    │  │
│  └─────────────┘     │  │  │ (GPT/Gemini/ │  │  │               │  │    │  │
│        ▲             │  │  │  Claude/etc) │  │  │ Claude SDK    │  │    │  │
│        │             │  │  └──────────────┘  │  │ + 6 Tools     │  │    │  │
│        │             │  │                    │  └───────────────┘  │    │  │
│        │             │  └────────────────────┴─────────────────────┘    │  │
│        │             │                              │                    │  │
│        │             └──────────────────────────────┼────────────────────┘  │
│        │                                            │                       │
│        │              SSE Stream                    │ SDK Messages          │
│        │◀───────────────────────────────────────────┘                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
        ┌───────────────────┐           ┌───────────────────┐
        │   M3: Memory      │           │   M2: Project     │
        │   System          │           │   Context         │
        │                   │           │                   │
        │ • User memories   │           │ • Project files   │
        │ • Preferences     │           │ • Custom instrs   │
        │ • History         │           │ • Code context    │
        └───────────────────┘           └───────────────────┘
```

### Data Flow (Agent Mode Request)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ STEP 1: User Request                                                         │
│                                                                              │
│   User: "Find all TODO comments in this project"                             │
│   UI State: { agentMode: true, model: "claude-sonnet-4-5" }                  │
└──────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ STEP 2: Route to Agent Handler                                               │
│                                                                              │
│   POST /api/chat                                                             │
│   {                                                                          │
│     messages: [...],                                                         │
│     model: "claude-sonnet-4-5",                                              │
│     agentMode: true,              ◀─── This flag routes to agent handler    │
│     projectId: "abc-123"                                                     │
│   }                                                                          │
└──────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ STEP 3: Build Agent Context                                                  │
│                                                                              │
│   ┌────────────────────────────────────────────────────────────────────┐    │
│   │                        SYSTEM PROMPT                                │    │
│   ├────────────────────────────────────────────────────────────────────┤    │
│   │  BASE_PROMPT: "You are Bobo, a helpful AI assistant..."           │    │
│   │  +                                                                  │    │
│   │  M3_MEMORY: "User prefers TypeScript, last worked on auth..."     │    │
│   │  +                                                                  │    │
│   │  M2_PROJECT: "Project has 45 files, main entry is app/page.tsx..." │    │
│   └────────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ STEP 4: SDK Query with Tools                                                 │
│                                                                              │
│   query({                                                                    │
│     prompt: "Find all TODO comments...",                                     │
│     options: {                                                               │
│       model: "claude-sonnet-4-5",                                            │
│       systemPrompt: [BASE + M3 + M2],                                        │
│       allowedTools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],       │
│       hooks: { preToolUse: safetyHook }                                      │
│     }                                                                        │
│   })                                                                         │
└──────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ STEP 5: Claude Executes Tools Autonomously                                   │
│                                                                              │
│   Claude thinks: "I need to search for TODO patterns"                        │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │ Tool Call: Grep                                                      │   │
│   │ Input: { pattern: "TODO", path: ".", glob: "**/*.ts" }              │   │
│   │                                                                      │   │
│   │      ▼ PreToolUse Hook                                               │   │
│   │      ├── Is dangerous? NO                                            │   │
│   │      ├── Is read-only? YES                                           │   │
│   │      └── Decision: AUTO-APPROVE                                      │   │
│   │                                                                      │   │
│   │ Output: ["src/app.ts:45: // TODO: Add validation",                  │   │
│   │          "lib/utils.ts:12: // TODO: Optimize this"]                 │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ STEP 6: Stream to UI                                                         │
│                                                                              │
│   for await (const message of query(...)) {                                  │
│     // Convert SDK message to SSE format                                     │
│     stream.write(`data: ${JSON.stringify(adapted)}\n\n`);                    │
│   }                                                                          │
│                                                                              │
│   UI receives:                                                               │
│   • Text: "I found 2 TODO comments in your project:"                         │
│   • Tool Result: { tool: "Grep", output: [...] }                             │
│   • Text: "Would you like me to address any of these?"                       │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Permission/Decision Flow

```
                        ┌─────────────────────┐
                        │   Tool Request      │
                        │   from Claude       │
                        └──────────┬──────────┘
                                   │
                                   ▼
                        ┌─────────────────────┐
                        │  PreToolUse Hook    │
                        └──────────┬──────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
                    ▼              ▼              ▼
          ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
          │ DANGEROUS?  │  │ READ-ONLY?  │  │ WRITE/EXEC? │
          │             │  │             │  │             │
          │ • rm -rf /  │  │ • Read      │  │ • Write     │
          │ • sudo rm   │  │ • Glob      │  │ • Edit      │
          │ • fork bomb │  │ • Grep      │  │ • Bash      │
          │ • format    │  │ • ls, pwd   │  │             │
          └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
                 │                │                │
                 ▼                ▼                ▼
          ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
          │   🛑 DENY   │  │  ✅ ALLOW   │  │   ❓ ASK    │
          │             │  │             │  │             │
          │ Hard block, │  │ Auto-approve│  │ Show dialog │
          │ log attempt │  │ silently    │  │ to user     │
          └─────────────┘  └─────────────┘  └──────┬──────┘
                                                   │
                                    ┌──────────────┴──────────────┐
                                    │                             │
                                    ▼                             ▼
                          ┌─────────────────┐          ┌─────────────────┐
                          │ User: APPROVE   │          │ User: DENY      │
                          │                 │          │                 │
                          │ Execute tool,   │          │ Block tool,     │
                          │ return result   │          │ explain to user │
                          └─────────────────┘          └─────────────────┘


PERMISSION TIERS:

┌────────────────────────────────────────────────────────────────────────────┐
│  TIER 1: AUTO-DENY (Dangerous)                                              │
│  ─────────────────────────────                                              │
│  Pattern Match:                                                             │
│  • /rm\s+-rf\s+[\/~]/     → "rm -rf /" or "rm -rf ~"                       │
│  • /sudo\s+rm/            → Any sudo rm command                            │
│  • /:(){ :|:& };:/        → Fork bomb                                      │
│  • /mkfs\./               → Format commands                                │
│  • /dd\s+if=.*of=\/dev/   → Disk overwrite                                 │
├────────────────────────────────────────────────────────────────────────────┤
│  TIER 2: AUTO-APPROVE (Safe Reads)                                          │
│  ─────────────────────────────────                                          │
│  Tools: Read, Glob, Grep                                                    │
│  Commands: ls, pwd, cat, head, tail, npm list, git status, echo            │
├────────────────────────────────────────────────────────────────────────────┤
│  TIER 3: ASK USER (Writes & Unknown)                                        │
│  ───────────────────────────────────                                        │
│  Tools: Write, Edit                                                         │
│  Commands: Everything else (npm install, git commit, mkdir, touch, etc.)   │
└────────────────────────────────────────────────────────────────────────────┘
```

### UI Component Structure

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           CHAT PAGE (app/page.tsx)                           │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                        MESSAGE LIST                                     │ │
│  │  ┌──────────────────────────────────────────────────────────────────┐  │ │
│  │  │ User Message                                                      │  │ │
│  │  │ "Find all TODO comments and fix the first one"                   │  │ │
│  │  └──────────────────────────────────────────────────────────────────┘  │ │
│  │                                                                         │ │
│  │  ┌──────────────────────────────────────────────────────────────────┐  │ │
│  │  │ Assistant Message (Agent Mode)                                    │  │ │
│  │  │                                                                   │  │ │
│  │  │  "I'll search for TODO comments first."                          │  │ │
│  │  │                                                                   │  │ │
│  │  │  ┌────────────────────────────────────────────────────────────┐  │  │ │
│  │  │  │ 🔍 TOOL: Grep                                               │  │  │ │
│  │  │  │ Pattern: "TODO", Path: "**/*.ts"                           │  │  │ │
│  │  │  ├────────────────────────────────────────────────────────────┤  │  │ │
│  │  │  │ src/app.ts:45    // TODO: Add validation                   │  │  │ │
│  │  │  │ lib/utils.ts:12  // TODO: Optimize this                    │  │  │ │
│  │  │  └────────────────────────────────────────────────────────────┘  │  │ │
│  │  │                                                                   │  │ │
│  │  │  "Found 2 TODOs. I'll fix the first one now."                   │  │ │
│  │  │                                                                   │  │ │
│  │  │  ┌────────────────────────────────────────────────────────────┐  │  │ │
│  │  │  │ ✏️ TOOL: Edit                               [Waiting...]    │  │  │ │
│  │  │  │ File: src/app.ts                                           │  │  │ │
│  │  │  │ ┌────────────────────────────────────────────────────────┐ │  │  │ │
│  │  │  │ │ - // TODO: Add validation                              │ │  │  │ │
│  │  │  │ │ + if (!input) throw new Error("Input required");       │ │  │  │ │
│  │  │  │ └────────────────────────────────────────────────────────┘ │  │  │ │
│  │  │  │                                                            │  │  │ │
│  │  │  │         [ ✅ Approve ]    [ ❌ Deny ]                      │  │  │ │
│  │  │  └────────────────────────────────────────────────────────────┘  │  │ │
│  │  │                                                                   │  │ │
│  │  └──────────────────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         INPUT AREA                                      │ │
│  │  ┌────────────────────────────────────────────────────────────────┐   │ │
│  │  │ [Model: Claude Sonnet 4.5 ▼] [🤖 Agent Mode: ON] [Web Search]  │   │ │
│  │  ├────────────────────────────────────────────────────────────────┤   │ │
│  │  │ Type a message...                                      [Send]  │   │ │
│  │  └────────────────────────────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Quick Start (15 minutes)

```bash
# Step 1: Downgrade Zod (SDK requires v3.x, we have v4.x)
npm uninstall zod && npm install zod@^3.24.1

# Step 2: Install Claude Agent SDK
npm install @anthropic-ai/claude-agent-sdk

# Step 3: Verify build
npm run build

# Step 4: Start dev server
npm run dev
```

**Environment:** Ensure `ANTHROPIC_API_KEY` is in `.env.local`

---

## Tasks

### Phase 1: Backend Wiring (10.5h)

| Task | What to Do | Hours |
|------|------------|-------|
| M4-1 | Zod downgrade + SDK install | 0.5h |
| M4-2 | Add `agentMode` flag routing to `/api/chat` | 2h |
| M4-3 | Wire up M3 memory injection to agent | 2h |
| M4-4 | Wire up M2 project context to agent | 2h |
| M4-5 | Configure 6 built-in tools with SDK | 4h |

### Phase 2: UI Components (10h)

| Task | What to Do | Hours |
|------|------------|-------|
| M4-6 | Agent mode toggle in chat footer | 2h |
| M4-7 | Stream SDK messages to UI | 4h |
| M4-8 | Tool result display components | 4h |

### Phase 3: Safety Layer (5h)

| Task | What to Do | Hours |
|------|------------|-------|
| M4-9 | Confirmation dialogs for writes | 3h |
| M4-10 | Safety hooks (block dangerous commands) | 2h |

**Total: 25.5h** (+ 9.5h buffer)

---

## Files to Create

```
lib/agent-sdk/
├── index.ts                 # Main exports
├── agent-handler.ts         # Route handler for agentMode=true
├── stream-adapter.ts        # Convert SDK AsyncGenerator → SSE
├── memory-integration.ts    # Inject M3 memories into system prompt
├── project-integration.ts   # Inject M2 project context into system prompt
├── tool-config.ts           # Tool permissions and configuration
└── safety-hooks.ts          # PreToolUse security hooks

components/agent/
├── tool-execution.tsx       # Container for tool result display
├── tool-card.tsx            # Individual tool execution card
├── file-preview.tsx         # Syntax-highlighted file content
├── bash-output.tsx          # Terminal-style command output
└── tool-confirmation-dialog.tsx  # Approve/Deny dialog for writes
```

---

## Implementation Details

### M4-1: Zod Downgrade + SDK Install

**File:** Terminal commands

**What it does:** The Claude Agent SDK has a peer dependency on Zod v3.x, but we're using v4.x. This task downgrades Zod and installs the SDK.

```bash
# Check current Zod version
npm list zod
# Output: zod@4.0.0

# Uninstall v4, install v3
npm uninstall zod
npm install zod@^3.24.1

# Install SDK
npm install @anthropic-ai/claude-agent-sdk

# Verify no TypeScript errors
npm run build
```

**Key points:**
- Zod v3.24.1 is the latest stable v3 release
- May need to update some Zod imports if we use v4-only features
- Run build to catch any breaking changes immediately

---

### M4-2: agentMode Routing

**File:** `app/api/chat/route.ts`

**What it does:** Adds conditional routing so requests with `agentMode: true` bypass the AI Gateway and go to our new agent handler.

```typescript
// app/api/chat/route.ts
import { handleAgentMode } from '@/lib/agent-sdk/agent-handler';

export async function POST(req: Request) {
  const { messages, model, agentMode, projectId, webSearch } = await req.json();

  // NEW: Route to agent handler if agentMode is enabled
  if (agentMode) {
    return handleAgentMode({
      messages,
      model,
      projectId,
      userId: 'current-user', // TODO: Get from auth
    });
  }

  // Existing chat logic continues unchanged...
  if (webSearch) {
    return handleWebSearch(messages, model);
  }

  return handleStandardChat(messages, model);
}
```

**Key points:**
- Check `agentMode` FIRST before other routing
- Pass through `projectId` for M2 context
- Returns a streaming Response, same as existing handlers

---

### M4-3: Memory Integration (M3)

**File:** `lib/agent-sdk/memory-integration.ts`

**What it does:** Builds a memory context string from the user's stored memories to inject into the agent's system prompt.

```typescript
// lib/agent-sdk/memory-integration.ts
import { getMemoryEntries } from '@/lib/db/queries';
import { buildMemoryPrompt } from '@/lib/memory/inject';

export async function buildMemoryContext(userId: string): Promise<string> {
  // Fetch user's memories from database
  const memories = await getMemoryEntries(userId);

  if (!memories || memories.length === 0) {
    return '';
  }

  // Format memories into a prompt section
  const memoryPrompt = buildMemoryPrompt(memories);

  return `
## User Context (from memory)

The following information was remembered from previous conversations:

${memoryPrompt}

Use this context to provide personalized responses.
`;
}
```

**Key points:**
- Reuses existing `getMemoryEntries` and `buildMemoryPrompt` functions
- Returns empty string if no memories (graceful degradation)
- Wrapped in clear section header for prompt clarity

---

### M4-4: Project Context Integration (M2)

**File:** `lib/agent-sdk/project-integration.ts`

**What it does:** Fetches the active project's files and custom instructions to inject into the agent's system prompt.

```typescript
// lib/agent-sdk/project-integration.ts
import { getProjectWithContext } from '@/lib/ai/context-manager';

export async function buildProjectContext(projectId: string | null): Promise<string> {
  if (!projectId) {
    return '';
  }

  try {
    const project = await getProjectWithContext(projectId);

    if (!project) {
      return '';
    }

    const customInstructions = project.customInstructions
      ? `\n### Custom Instructions\n${project.customInstructions}`
      : '';

    const fileList = project.files
      .map(f => `- ${f.path} (${f.type})`)
      .join('\n');

    return `
## Active Project: ${project.name}

### Project Files
${fileList}

${customInstructions}

When working with files, prioritize files from this project.
`;
  } catch (error) {
    console.error('Failed to load project context:', error);
    return '';
  }
}
```

**Key points:**
- Reuses existing `getProjectWithContext` function
- Handles null projectId gracefully
- Includes custom instructions if present
- Lists files so agent knows what's available

---

### M4-5: Agent Handler with SDK

**File:** `lib/agent-sdk/agent-handler.ts`

**What it does:** The main handler that initializes the Claude Agent SDK with our context and streams responses back.

```typescript
// lib/agent-sdk/agent-handler.ts
import { query, type Options } from '@anthropic-ai/claude-agent-sdk';
import { buildMemoryContext } from './memory-integration';
import { buildProjectContext } from './project-integration';
import { SAFETY_HOOKS } from './safety-hooks';
import { adaptSDKStream } from './stream-adapter';

const BASE_PROMPT = `You are Bobo, a helpful AI assistant with the ability to read,
write, and edit files, run bash commands, and search through codebases.

When using tools:
- Prefer Glob/Grep for searching over manual file reading
- Show your reasoning before making changes
- Ask for confirmation before destructive operations
- Keep bash commands simple and safe
`;

interface AgentRequest {
  messages: any[];
  model: string;
  projectId: string | null;
  userId: string;
}

export async function handleAgentMode(request: AgentRequest): Promise<Response> {
  const { messages, model, projectId, userId } = request;

  // Build context from M3 (memory) and M2 (project)
  const memoryContext = await buildMemoryContext(userId);
  const projectContext = await buildProjectContext(projectId);

  // Compose full system prompt
  const systemPrompt = [BASE_PROMPT, memoryContext, projectContext]
    .filter(Boolean)
    .join('\n\n');

  // Get the user's latest message as the prompt
  const lastUserMessage = messages
    .filter(m => m.role === 'user')
    .pop();

  const prompt = lastUserMessage?.content || '';

  // Configure SDK options
  const options: Options = {
    model: mapToClaudeModel(model),
    systemPrompt,
    permissionMode: 'default',
    hooks: SAFETY_HOOKS,
    allowedTools: ['Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep'],
  };

  // Create streaming response
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Process SDK messages in background
  (async () => {
    try {
      for await (const message of query({ prompt, options })) {
        const adapted = adaptSDKStream(message);
        await writer.write(
          new TextEncoder().encode(`data: ${JSON.stringify(adapted)}\n\n`)
        );
      }
    } catch (error) {
      console.error('Agent error:', error);
      await writer.write(
        new TextEncoder().encode(`data: ${JSON.stringify({ error: String(error) })}\n\n`)
      );
    } finally {
      await writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

function mapToClaudeModel(model: string): string {
  // Map our model IDs to Claude model IDs
  const mapping: Record<string, string> = {
    'claude-sonnet-4-5': 'claude-sonnet-4-5-20250929',
    'claude-opus-4': 'claude-opus-4-20250514',
    // Add more as needed
  };
  return mapping[model] || 'claude-sonnet-4-5-20250929';
}
```

**Key points:**
- Combines BASE_PROMPT + M3 memory + M2 project into systemPrompt
- Uses AsyncGenerator pattern with `for await...of`
- Streams responses as Server-Sent Events (SSE)
- Maps our model IDs to official Claude model IDs

---

### M4-10: Safety Hooks

**File:** `lib/agent-sdk/safety-hooks.ts`

**What it does:** Implements PreToolUse hooks that block dangerous commands, auto-approve safe reads, and require confirmation for writes.

```typescript
// lib/agent-sdk/safety-hooks.ts
import type { Hooks, ToolInput, PermissionDecision } from '@anthropic-ai/claude-agent-sdk';

// TIER 1: Always block - these patterns are never allowed
const BLOCKED_PATTERNS = [
  /rm\s+-rf\s+[\/~]/,           // rm -rf / or rm -rf ~
  /rm\s+-r\s+[\/~]/,            // rm -r / or rm -r ~
  /sudo\s+rm/,                   // Any sudo rm
  /:(){ :|:& };:/,               // Fork bomb
  /mkfs\./,                      // Format filesystem
  /dd\s+if=.*of=\/dev/,          // Disk overwrite
  />\s*\/dev\/sd[a-z]/,          // Redirect to disk
  /chmod\s+-R\s+777\s+\//,       // Recursive 777 on root
];

// TIER 2: Always allow - safe read-only operations
const SAFE_COMMANDS = [
  'ls', 'pwd', 'cat', 'head', 'tail', 'less', 'more',
  'find', 'grep', 'wc', 'echo', 'which', 'type',
  'npm list', 'npm outdated', 'npm view',
  'git status', 'git log', 'git diff', 'git branch',
  'node --version', 'npm --version',
];

// TIER 2: Tools that are always safe
const SAFE_TOOLS = ['Read', 'Glob', 'Grep'];

// TIER 3: Tools that require confirmation
const ASK_TOOLS = ['Write', 'Edit'];

type PreToolUseResult = {
  permissionDecision: PermissionDecision;
  reason?: string;
};

async function preToolUseHook(toolName: string, input: ToolInput): Promise<PreToolUseResult> {
  // Handle Bash commands specially
  if (toolName === 'Bash') {
    const cmd = (input as any).command || '';

    // Check for dangerous patterns (TIER 1 - DENY)
    for (const pattern of BLOCKED_PATTERNS) {
      if (pattern.test(cmd)) {
        return {
          permissionDecision: 'deny',
          reason: `Blocked: This command matches a dangerous pattern and cannot be executed.`,
        };
      }
    }

    // Check for safe commands (TIER 2 - ALLOW)
    const isSafe = SAFE_COMMANDS.some(safe =>
      cmd.trim().startsWith(safe) || cmd.trim() === safe
    );

    if (isSafe) {
      return { permissionDecision: 'allow' };
    }

    // Everything else requires confirmation (TIER 3 - ASK)
    return { permissionDecision: 'ask' };
  }

  // Safe tools auto-approve (TIER 2)
  if (SAFE_TOOLS.includes(toolName)) {
    return { permissionDecision: 'allow' };
  }

  // Write/Edit tools require confirmation (TIER 3)
  if (ASK_TOOLS.includes(toolName)) {
    return { permissionDecision: 'ask' };
  }

  // Unknown tools - ask to be safe
  return { permissionDecision: 'ask' };
}

export const SAFETY_HOOKS: Hooks = {
  preToolUse: preToolUseHook,
};
```

**Key points:**
- Three-tier system: DENY (dangerous) → ALLOW (safe reads) → ASK (everything else)
- Regex patterns catch variations (rm -rf vs rm -r, etc.)
- Safe commands list covers common read operations
- Unknown tools default to 'ask' for safety

---

## Reuse Existing Code

**Memory (M3):**
```typescript
// lib/db/queries.ts - already exists
export async function getMemoryEntries(userId: string): Promise<MemoryEntry[]>

// lib/memory/inject.ts - already exists
export function buildMemoryPrompt(memories: MemoryEntry[]): string
```

**Project Context (M2):**
```typescript
// lib/ai/context-manager.ts - already exists
export async function getProjectWithContext(projectId: string): Promise<ProjectWithContext>
```

**UI Components:**
```typescript
// components/ui/dialog.tsx - for confirmation dialogs
// components/ai-elements/code-block.tsx - for file previews
// components/ai-elements/message.tsx - base for tool cards
```

---

## Known Gotchas

| Issue | Why It Happens | Solution |
|-------|----------------|----------|
| Zod peer dependency error | SDK requires v3.x, we have v4.x | Must downgrade to Zod 3.24.1 |
| SDK uses `SDKMessage` types | Different from our `UIMessage` | Create adapter in `stream-adapter.ts` |
| Agent toggle for non-Claude | Agent SDK only works with Claude | Disable toggle when GPT/Gemini selected |
| SDK manages own context | May conflict with our token tracker | Adjust tracker to skip agent mode |
| Tool permissions UI | SDK returns 'ask', we need to show dialog | Wire up confirmation component |

---

## Testing Checklist

**After each task:**
- [ ] `npm run build` passes
- [ ] Dev server starts without errors
- [ ] Feature works manually in browser

**Final demo:**
- [ ] Agent Mode toggle appears only when Claude model selected
- [ ] Toggle disabled/hidden for GPT and Gemini models
- [ ] Read file → displays content in code block
- [ ] Grep search → shows results in terminal style
- [ ] Glob pattern → lists matching files
- [ ] Edit file → shows confirmation dialog → file changes on approve
- [ ] Write file → shows confirmation dialog → file created on approve
- [ ] `rm -rf /` → immediately blocked, no dialog
- [ ] `ls -la` → auto-approved, no dialog
- [ ] Agent references user memories in responses
- [ ] Agent references project files in responses

---

## Success Criteria

- [x] Build passes with no TypeScript errors
- [x] Agent Mode toggle visible only for Claude models
- [x] Read, Grep, Glob work without user prompts
- [x] Write, Edit show confirmation before executing
- [x] Bash: safe commands auto-approve, others ask
- [x] Dangerous commands hard-blocked
- [x] M3 memory context integrated into agent
- [x] M2 project context integrated into agent
- [x] Tool results display with syntax highlighting
- [x] Streaming works smoothly without delays

**Status: ✅ ALL CRITERIA MET - Completed Nov 26, 2025**

---

## Resources

**External Docs:**
- [Agent SDK Overview](https://platform.claude.com/docs/en/agent-sdk/overview)
- [SDK TypeScript Reference](https://platform.claude.com/docs/en/agent-sdk/typescript)
- [Permissions & Hooks](https://platform.claude.com/docs/en/agent-sdk/permissions)

**Project Files:**
- Sprint tracking: `docs/sprints/active/sprint-m4-01.md`
- Architecture: `CLAUDE.md`
- Product Backlog: `docs/PRODUCT_BACKLOG.md`

---

*Prepared by Claude Code - November 25, 2025*
*Completed: November 26, 2025 (Day 1) - All 10 tasks in 10 hours*
