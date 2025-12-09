# Sprint M40-01 Execution Guide

**Sprint:** M40-01 - Refactor & Optimization
**Duration:** December 9-11, 2025
**Prepared:** December 9, 2025

---

## TL;DR (Plain English Summary)

This sprint cleans up technical debt identified in the comprehensive codebase audit. We're doing four things:

1. **Deleting dead code** - Two orphan sidebar files and a debug API route that shouldn't be in production. Also removing unused npm packages to slim down the bundle.

2. **Fixing a major performance bug** - The memory consolidation cron job runs 400+ database queries when it could run 2-3. We batch the queries instead of looping.

3. **Consolidating duplicates** - We have 2 icon libraries doing the same thing. We're picking lucide-react and migrating the 11 files that use @tabler. We also have duplicate sidebar implementations to clean up.

4. **Improving code quality** - The chat-interface.tsx is 1400 lines with 22 hooks. We extract 3 custom hooks to make it manageable. We also add proper TypeScript types to remove 8 `as any` assertions.

Success looks like: cleaner codebase, faster cron job, smaller bundle, type-safe code.

---

## Architecture Overview

### Before vs After

```
BEFORE:                              AFTER:
─────────────────────────────────    ─────────────────────────────────
components/ui/                       components/ui/
├── sidebar.tsx (727 lines)          ├── sidebar.tsx (727 lines)
├── app-sidebar.tsx (600 lines)      ├── app-sidebar.tsx (600 lines)
├── bobo-sidebar.tsx (338 lines) ❌  └── collapsible-sidebar.tsx
├── bobo-sidebar-option-a.tsx (696)❌
└── collapsible-sidebar.tsx

components/chat/                     components/chat/
├── chat-interface.tsx (1400 lines)  ├── chat-interface.tsx (~1100 lines)
                                     └── hooks/
                                         ├── use-chat-session.ts (NEW)
                                         ├── use-chat-history.ts (NEW)
                                         ├── use-tool-state.ts (NEW)
                                         └── index.ts

Icon Libraries:                      Icon Libraries:
├── lucide-react (51 files)          └── lucide-react (62 files)
└── @tabler/icons-react (11 files) ❌
```

### N+1 Query Fix

```
BEFORE (lines 59-87):
┌─────────────────────────────────────────────────────────────┐
│ for (pair of duplicates) {                                  │
│   await getMemory(pair.id1)  ← Query 1                      │
│   await getMemory(pair.id2)  ← Query 2                      │
│   await merge(...)           ← Query 3                      │
│   await delete(...)          ← Query 4                      │
│ }                                                           │
│ Total: N × 4 queries = 400+ for 100 pairs                   │
└─────────────────────────────────────────────────────────────┘

AFTER:
┌─────────────────────────────────────────────────────────────┐
│ const allIds = duplicates.flatMap(p => [p.id1, p.id2])      │
│ const memories = await supabase                             │
│   .from('memory_entries')                                   │
│   .select('*')                                              │
│   .in('id', allIds)           ← 1 batch query               │
│ const map = new Map(memories.map(m => [m.id, m]))           │
│                                                             │
│ for (pair of duplicates) {                                  │
│   const m1 = map.get(pair.id1)  ← Map lookup (O(1))         │
│   const m2 = map.get(pair.id2)  ← Map lookup (O(1))         │
│   // ... process                                            │
│ }                                                           │
│ Total: 2-3 queries regardless of pair count                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Quick Start (5 minutes)

```bash
# Verify current state
cd "/Users/sacheeperera/VibeCoding Projects/bobo-vercel-clone"
npm run build           # Should pass
wc -l components/chat/chat-interface.tsx  # ~1400 lines
grep -r "@tabler/icons-react" --include="*.tsx" | wc -l  # ~11 files

# After sprint
npm run build           # Should pass
wc -l components/chat/chat-interface.tsx  # ~1100 lines
grep -r "@tabler/icons-react" --include="*.tsx" | wc -l  # 0 files
```

---

## Tasks

### Phase 1: Quick Wins (~1.1h) - Run in Parallel

| Task | What to Do | Hours |
|------|------------|-------|
| M40-01 | Delete `components/ui/bobo-sidebar.tsx` | 21m |
| M40-02 | Delete `app/api/debug/projects/` directory | 11m |
| M40-03 | Add `shiki`, `lucide-react`, `motion` to optimizePackageImports in next.config.ts | 14m |
| M40-04 | Remove `posthog-node`, `tw-animate-css` from package.json, run npm install | 21m |

### Phase 2: Performance (~2.5h) - Run in Parallel

| Task | What to Do | Hours |
|------|------------|-------|
| M40-05 | Refactor consolidate-memories cron to batch queries | 1.4h |
| M40-06 | Change Shiki import to dynamic `await import('shiki')` in code-block.tsx | 1.05h |

### Phase 3: Type Safety & Consolidation (~4.55h)

| Task | What to Do | Hours |
|------|------------|-------|
| M40-07 | Add MessageContinuation type to lib/db/types.ts, remove 8 `as any` in queries.ts | 1.05h |
| M40-08 | Replace @tabler icons with lucide-react in 11 files, remove package | 2.1h |
| M40-09 | Delete `components/ui/bobo-sidebar-option-a.tsx` | 1.4h |

### Phase 4: Hook Extraction (~2.8h)

| Task | What to Do | Hours |
|------|------------|-------|
| M40-10 | Extract useChatSession, useChatHistory, useToolState from chat-interface.tsx | 2.8h |

**Total: ~11h** (+ 2.75h testing + 1.4h buffer)

---

## Files to Create

```
components/chat/hooks/
├── use-chat-session.ts    # chatId, URL sync, auto-generate
├── use-chat-history.ts    # history loading, chat metadata
├── use-tool-state.ts      # toolSteps, handleStreamData
└── index.ts               # barrel export
```

---

## Implementation Details

### M40-01: Delete bobo-sidebar.tsx

**File:** `components/ui/bobo-sidebar.tsx`

**Action:** Delete file

**Verification:**
```bash
grep -r "bobo-sidebar" --include="*.tsx" --include="*.ts"
# Should return NO matches after deletion
npm run build
```

---

### M40-03: Add optimizePackageImports

**File:** `next.config.ts`

**Change:**
```typescript
experimental: {
  optimizePackageImports: ['streamdown', 'shiki', 'lucide-react', 'motion'],
},
```

---

### M40-05: Fix N+1 Query

**File:** `app/api/cron/consolidate-memories/route.ts`

**Current code (lines 59-87):**
```typescript
for (const pair of duplicates) {
  const m1 = await getMemory(pair.id1);
  const m2 = await getMemory(pair.id2);
  // ...
}
```

**Replace with:**
```typescript
// Batch fetch all memories
const allIds = [...new Set(duplicates.flatMap(p => [p.id1, p.id2]))];
const { data: memories, error } = await supabase
  .from('memory_entries')
  .select('*')
  .in('id', allIds);

if (error) {
  memoryLogger.error('Failed to batch fetch memories:', error);
  return;
}

const memoryMap = new Map(memories?.map(m => [m.id, m]) ?? []);

for (const pair of duplicates) {
  const m1 = memoryMap.get(pair.id1);
  const m2 = memoryMap.get(pair.id2);

  if (!m1 || !m2) {
    memoryLogger.warn(`Missing memory for pair: ${pair.id1}, ${pair.id2}`);
    continue;
  }

  // Rest of merge logic unchanged
}
```

---

### M40-06: Lazy Load Shiki

**File:** `components/ai-elements/code-block.tsx`

**Current (line 15):**
```typescript
import { type BundledLanguage, codeToHtml, type ShikiTransformer } from "shiki";
```

**Change to:**
```typescript
import type { BundledLanguage, ShikiTransformer } from "shiki";

// Inside highlightCode function:
export async function highlightCode(code: string, language: BundledLanguage, showLineNumbers = false) {
  const { codeToHtml } = await import('shiki');
  // ... rest unchanged
}
```

---

### M40-07: Add MessageContinuation Type

**File:** `lib/db/types.ts`

**Add after line 85 (after Message type):**
```typescript
export type MessageContinuation = {
  id: string;
  chat_id: string;
  message_id: string | null;
  accumulated_text: string;
  accumulated_parts: MessagePart[];
  continuation_token: string;
  iteration_state: Record<string, unknown>;
  expires_at: string;
  used_at: string | null;
  created_at: string;
};

export type MessageContinuationInsert = Omit<MessageContinuation, 'id' | 'created_at'> & {
  id?: string;
};

export type MessageContinuationUpdate = Partial<Omit<MessageContinuation, 'id'>>;
```

**Add to Database type (after messages table ~line 384):**
```typescript
message_continuations: {
  Row: MessageContinuation;
  Insert: MessageContinuationInsert;
  Update: MessageContinuationUpdate;
  Relationships: [
    {
      foreignKeyName: 'message_continuations_chat_id_fkey';
      columns: ['chat_id'];
      referencedRelation: 'chats';
      referencedColumns: ['id'];
    }
  ];
};
```

**Then in `lib/db/queries.ts`:**
Remove `as any` at lines 1340, 1369, 1392, 1423, 1452, 1484, 1511, 1531

---

### M40-08: Icon Migration Map

| File | @tabler Icon | lucide-react Replacement |
|------|--------------|--------------------------|
| app-sidebar.tsx | IconMessagePlus | MessageSquarePlus |
| app-sidebar.tsx | IconFolder | Folder |
| app-sidebar.tsx | IconFolderPlus | FolderPlus |
| app-sidebar.tsx | IconSearch | Search |
| app-sidebar.tsx | IconClock | Clock |
| app-sidebar.tsx | IconDots | MoreHorizontal |
| collapsible-sidebar.tsx | IconMenu2 | Menu |
| collapsible-sidebar.tsx | IconBrain | Brain |
| collapsible-sidebar.tsx | IconHome | Home |
| chat-header.tsx | IconEdit | Pencil |
| chat-header.tsx | IconTrash | Trash2 |
| chat-context-menu.tsx | IconArchive | Archive |
| project-header.tsx | IconChevronDown | ChevronDown |

**After migration, remove from package.json:**
```json
"@tabler/icons-react": "^3.35.0",  // DELETE THIS LINE
```

---

### M40-10: Hook Extraction

**Create `components/chat/hooks/use-chat-session.ts`:**
```typescript
import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface UseChatSessionOptions {
  projectId?: string;
}

interface UseChatSessionReturn {
  chatId: string | null;
  setChatId: (id: string | null) => void;
  chatIdSynced: boolean;
  isAutoGenerating: boolean;
}

export function useChatSession({ projectId }: UseChatSessionOptions = {}): UseChatSessionReturn {
  const router = useRouter();
  const searchParams = useSearchParams();
  const chatIdFromUrl = searchParams.get('chatId');

  const [chatId, setChatId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return chatIdFromUrl || null;
    }
    return null;
  });
  const [chatIdSynced, setChatIdSynced] = useState(false);
  const isAutoGeneratingRef = useRef(false);

  // Auto-generate chatId effect
  useEffect(() => {
    if (chatId || chatIdFromUrl) {
      if (chatIdFromUrl && isAutoGeneratingRef.current) {
        isAutoGeneratingRef.current = false;
      }
      return;
    }

    isAutoGeneratingRef.current = true;
    const newChatId = crypto.randomUUID();
    setChatId(newChatId);

    const params = new URLSearchParams(searchParams.toString());
    params.set('chatId', newChatId);
    if (projectId) {
      params.set('projectId', projectId);
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [chatId, chatIdFromUrl, router, searchParams, projectId]);

  // Sync chatId from URL effect
  useEffect(() => {
    if (!chatIdSynced) {
      setChatIdSynced(true);
    }

    if (chatIdFromUrl !== chatId && chatIdFromUrl) {
      setChatId(chatIdFromUrl);
    }
  }, [chatIdFromUrl, chatId, chatIdSynced]);

  return {
    chatId,
    setChatId,
    chatIdSynced,
    isAutoGenerating: isAutoGeneratingRef.current,
  };
}
```

**Create `components/chat/hooks/use-tool-state.ts`:**
```typescript
import { useState, useCallback } from 'react';

export interface ToolStep {
  toolName: string;
  toolCallId: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  input?: Record<string, unknown>;
  output?: string;
  startTime?: number;
  endTime?: number;
}

interface UseToolStateReturn {
  toolSteps: ToolStep[];
  setToolSteps: React.Dispatch<React.SetStateAction<ToolStep[]>>;
  continuationToken: string | null;
  setContinuationToken: (token: string | null) => void;
  timeoutOccurred: boolean;
  setTimeoutOccurred: (occurred: boolean) => void;
  isContinuing: boolean;
  setIsContinuing: (continuing: boolean) => void;
  resetToolState: () => void;
}

export function useToolState(): UseToolStateReturn {
  const [toolSteps, setToolSteps] = useState<ToolStep[]>([]);
  const [continuationToken, setContinuationToken] = useState<string | null>(null);
  const [timeoutOccurred, setTimeoutOccurred] = useState(false);
  const [isContinuing, setIsContinuing] = useState(false);

  const resetToolState = useCallback(() => {
    setToolSteps([]);
    setContinuationToken(null);
    setTimeoutOccurred(false);
    setIsContinuing(false);
  }, []);

  return {
    toolSteps,
    setToolSteps,
    continuationToken,
    setContinuationToken,
    timeoutOccurred,
    setTimeoutOccurred,
    isContinuing,
    setIsContinuing,
    resetToolState,
  };
}
```

**Create `components/chat/hooks/index.ts`:**
```typescript
export { useChatSession } from './use-chat-session';
export { useChatHistory } from './use-chat-history';
export { useToolState, type ToolStep } from './use-tool-state';
```

---

## Reuse Existing Code

**Supabase client:**
```typescript
// lib/db/client.ts
import { supabase } from '@/lib/db/client';
```

**Logger:**
```typescript
// lib/logger.ts
import { memoryLogger, chatLogger, dbLogger } from '@/lib/logger';
```

**Existing types:**
```typescript
// lib/db/types.ts
import type { MessagePart, Message, MemoryEntry } from '@/lib/db/types';
```

---

## Known Gotchas

| Issue | Why It Happens | Solution |
|-------|----------------|----------|
| Icon size differences | Tabler uses 24px default, Lucide uses 24px | Set explicit size prop |
| Shiki dynamic import in SSR | codeToHtml needs to be client-only | Already async, works fine |
| Hook dependency arrays | Extracting hooks may change re-render behavior | Test thoroughly |
| Type assertion removal | Some queries may have runtime issues | Test continuation flow |

---

## Testing Checklist

**After each task:**
- [ ] `npm run build` passes
- [ ] `npm run dev` starts
- [ ] No console errors

**Phase 1 verification:**
- [ ] No `bobo-sidebar` imports found
- [ ] /api/debug/projects returns 404
- [ ] Build time same or faster

**Phase 2 verification:**
- [ ] Code blocks still highlight
- [ ] Cron endpoint works (manual test)

**Phase 3 verification:**
- [ ] All icons render correctly
- [ ] No TypeScript errors
- [ ] Sidebar navigation works

**Phase 4 verification:**
- [ ] New chat creation works
- [ ] History loading works
- [ ] Tool steps display correctly
- [ ] URL sync works

**Final demo:**
- [ ] Full chat flow works
- [ ] Agent mode with tools works
- [ ] Build passes with no warnings

---

## Success Criteria

- [ ] Build passes
- [ ] 0 orphan files
- [ ] 0 `as any` in continuation code
- [ ] 1 icon library
- [ ] Bundle size reduced
- [ ] Cron queries reduced
- [ ] chat-interface.tsx reduced ~300 lines

---

## Resources

**Lucide React:**
- https://lucide.dev/icons/

**Project Files:**
- Sprint tracking: `docs/sprints/active/M40-01/sprint-m40-01.md`
- Architecture: `CLAUDE.md`
- Audit: `codebase-audit-9dec/`

---

*Prepared by Claude Opus 4.5 - December 9, 2025*
