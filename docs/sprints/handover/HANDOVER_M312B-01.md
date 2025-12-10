# Sprint M3.12B-01 Execution Guide

**Sprint:** M3.12B-01 - Sidebar Drill-Down Navigation
**Duration:** December 10-13, 2025
**Prepared:** December 10, 2025

---

## TL;DR (Plain English Summary)

We're restructuring the sidebar to separate **deals/clients** (advisory entities) from **general projects** and adding a **drill-down navigation pattern**. Currently, all projects appear in a flat list which doesn't distinguish between active deal work and personal projects.

The new design shows DEALS and CLIENTS as prominent sections at the top of the sidebar. When you click into a deal (e.g., "MyTab"), instead of just selecting it, the sidebar **drills down** to show a detail view with: an info card (name, stage, last updated), associated chats, and a file browser for that deal's advisory folder.

We're using the **Kibo UI Tree component** (`@kibo-ui/tree`) for the file browser because it provides smooth animations and a clean API. File preview happens in a modal rather than a split pane.

Success looks like: clicking "MyTab" in the sidebar shows you everything about that deal (stage, chats, files) without leaving the sidebar. Clicking a file opens a preview modal. Back button returns to the main view.

---

## Architecture Overview

### System Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                        AppSidebar                           │
├─────────────────────────────────────────────────────────────┤
│  SidebarHeader (existing - logo, new chat, search)          │
├─────────────────────────────────────────────────────────────┤
│  SidebarContent                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  selectedEntity === null?                             │  │
│  │  ┌─────────────────┐    ┌──────────────────────────┐  │  │
│  │  │ SidebarMainView │ OR │ SidebarDetailView        │  │  │
│  │  │ - DealsSection  │    │ - BackButton             │  │  │
│  │  │ - ClientsSection│    │ - EntityInfoCard         │  │  │
│  │  │ - ProjectsSection    │ - SidebarChatList        │  │  │
│  │  │ - RecentSection │    │ - DealFileTree           │  │  │
│  │  └─────────────────┘    └──────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  SidebarFooter (existing)                                   │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow
```
User clicks deal row in MainView
         │
         ▼
useSidebarNavigation.setSelectedEntity({ type: 'deal', id, name, folderPath })
         │
         ▼
SidebarContent re-renders → shows DetailView
         │
         ├──▶ EntityInfoCard fetches master doc frontmatter
         │    GET /api/advisory/master-doc?folderPath={folderPath}
         │
         ├──▶ SidebarChatList filters chats by project_id
         │
         └──▶ DealFileTree fetches folder tree
              GET /api/advisory/tree?basePath={folderPath}
```

### Navigation State Flow
```
┌──────────────┐    setSelectedEntity()    ┌───────────────┐
│  MainView    │ ────────────────────────▶ │  DetailView   │
│              │                           │               │
│ selectedEntity                           │ selectedEntity│
│ = null       │ ◀──────────────────────── │ = { id, ... } │
└──────────────┘    setSelectedEntity(null)└───────────────┘
                         (Back button)
```

---

## Quick Start (15 minutes)

```bash
# 1. Install Kibo UI Tree component
npx shadcn add https://www.kibo-ui.com/r/tree.json

# 2. Verify existing dependencies
npm run build

# 3. Start dev server
npm run dev
```

**Environment:** No new env vars needed

---

## Tasks

### Phase 1: Infrastructure (2h)

| Task | What to Do | Hours |
|------|------------|-------|
| M312B-01 | Install Kibo UI Tree component | 0.25h |
| M312B-02 | Create `lib/sidebar/stage-config.ts` | 0.25h |
| M312B-03 | Create `hooks/use-sidebar-navigation.ts` | 0.5h |
| M312B-04 | Modify `/api/advisory/tree` - add basePath param | 0.5h |
| M312B-05 | Create `components/sidebar/file-preview-modal.tsx` | 0.5h |

### Phase 2: Detail View Components (3h)

| Task | What to Do | Hours |
|------|------------|-------|
| M312B-06 | Create `stage-indicator.tsx` | 0.25h |
| M312B-07 | Create `entity-info-card.tsx` | 0.75h |
| M312B-08 | Create `deal-file-tree.tsx` (Kibo wrapper) | 0.75h |
| M312B-09 | Create `sidebar-chat-list.tsx` | 0.5h |
| M312B-10 | Create `sidebar-detail-view.tsx` | 0.75h |

### Phase 3: Main View Restructure (2h)

| Task | What to Do | Hours |
|------|------------|-------|
| M312B-11 | Create `sidebar-main-view.tsx` | 1.5h |
| M312B-12 | Add entity rows with stage indicator | 0.5h |

### Phase 4: Integration (2h)

| Task | What to Do | Hours |
|------|------------|-------|
| M312B-13 | Modify `app-sidebar.tsx` - view switching | 1h |
| M312B-14 | Wire drill-down callbacks | 0.5h |
| M312B-15 | Test file selection → preview modal | 0.5h |

### Phase 5: Cleanup (0.5h)

| Task | What to Do | Hours |
|------|------------|-------|
| M312B-16 | Remove `app/advisory/page.tsx` | 0.1h |
| M312B-17 | Remove `browser-with-preview.tsx` | 0.1h |
| M312B-18 | Remove FileSearch icon from footer | 0.1h |
| M312B-19 | Update advisory index.ts | 0.2h |

### Phase 6: Polish (1h)

| Task | What to Do | Hours |
|------|------------|-------|
| M312B-20 | Loading states | 0.25h |
| M312B-21 | Empty states | 0.25h |
| M312B-22 | Mobile responsive testing | 0.25h |
| M312B-23 | Build verification | 0.25h |

**Total: 10.5h** (+ buffer)

---

## Files to Create

```
components/sidebar/
├── sidebar-main-view.tsx      # Main view with sections
├── sidebar-detail-view.tsx    # Detail view for drill-down
├── entity-info-card.tsx       # Info card (name, stage, date)
├── stage-indicator.tsx        # Colored dot component
├── deal-file-tree.tsx         # Kibo Tree wrapper
├── sidebar-chat-list.tsx      # Compact chat list
└── file-preview-modal.tsx     # Modal for file preview

hooks/
└── use-sidebar-navigation.ts  # Navigation state hook

lib/sidebar/
└── stage-config.ts            # Stage definitions
```

---

## Implementation Details

### M312B-02: Stage Configuration

**File:** `lib/sidebar/stage-config.ts`

**What it does:** Defines deal stages with colors and icons for consistent display

```typescript
// lib/sidebar/stage-config.ts
export const DEAL_STAGES = {
  'New Opportunity': { color: 'bg-gray-400', textColor: 'text-gray-400', label: 'New' },
  'Triage & Qualification': { color: 'bg-yellow-400', textColor: 'text-yellow-400', label: 'Triage' },
  'Deep Dive & Diagnosis': { color: 'bg-orange-400', textColor: 'text-orange-400', label: 'DD' },
  'Proposal Presented': { color: 'bg-blue-400', textColor: 'text-blue-400', label: 'Proposal' },
  'Closed Won': { color: 'bg-green-500', textColor: 'text-green-500', label: 'Won' },
  'Closed Lost': { color: 'bg-red-500', textColor: 'text-red-500', label: 'Lost' },
} as const;

export type DealStage = keyof typeof DEAL_STAGES;

export function getStageConfig(stage: string) {
  return DEAL_STAGES[stage as DealStage] || DEAL_STAGES['New Opportunity'];
}
```

---

### M312B-03: Navigation Hook

**File:** `hooks/use-sidebar-navigation.ts`

**What it does:** Manages drill-down state for sidebar navigation

```typescript
// hooks/use-sidebar-navigation.ts
'use client';

import { useState, useCallback } from 'react';

export interface SelectedEntity {
  type: 'deal' | 'client';
  id: string;
  name: string;
  folderPath: string; // e.g., 'advisory/deals/MyTab'
}

export function useSidebarNavigation() {
  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity | null>(null);

  const drillInto = useCallback((entity: SelectedEntity) => {
    setSelectedEntity(entity);
  }, []);

  const goBack = useCallback(() => {
    setSelectedEntity(null);
  }, []);

  return {
    selectedEntity,
    drillInto,
    goBack,
    isDetailView: selectedEntity !== null,
  };
}
```

---

### M312B-04: API Enhancement

**File:** `app/api/advisory/tree/route.ts`

**What it does:** Adds `basePath` query param to filter tree to specific folder

```typescript
// app/api/advisory/tree/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAdvisoryFolderTree } from '@/lib/advisory/file-reader';

export async function GET(request: NextRequest) {
  const basePath = request.nextUrl.searchParams.get('basePath') || 'advisory';

  // Security: ensure path starts with 'advisory'
  if (!basePath.startsWith('advisory')) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  try {
    const tree = getAdvisoryFolderTree(basePath);
    return NextResponse.json({ tree });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to read folder tree' },
      { status: 500 }
    );
  }
}
```

---

### M312B-06: Stage Indicator

**File:** `components/sidebar/stage-indicator.tsx`

**What it does:** Renders a colored dot indicating deal stage

```typescript
// components/sidebar/stage-indicator.tsx
'use client';

import { getStageConfig } from '@/lib/sidebar/stage-config';
import { cn } from '@/lib/utils';

interface StageIndicatorProps {
  stage: string;
  showLabel?: boolean;
  className?: string;
}

export function StageIndicator({ stage, showLabel, className }: StageIndicatorProps) {
  const config = getStageConfig(stage);

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <div className={cn('h-2 w-2 rounded-full', config.color)} />
      {showLabel && (
        <span className="text-xs text-muted-foreground">{config.label}</span>
      )}
    </div>
  );
}
```

---

### M312B-07: Entity Info Card

**File:** `components/sidebar/entity-info-card.tsx`

**What it does:** Displays deal/client info card with stage and last updated

```typescript
// components/sidebar/entity-info-card.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { StageIndicator } from './stage-indicator';
import { Briefcase, Users } from 'lucide-react';

interface EntityInfoCardProps {
  type: 'deal' | 'client';
  name: string;
  folderPath: string;
}

interface MasterDocMeta {
  stage?: string;
  lastUpdated?: string;
}

export function EntityInfoCard({ type, name, folderPath }: EntityInfoCardProps) {
  const [meta, setMeta] = useState<MasterDocMeta | null>(null);

  useEffect(() => {
    // Fetch master doc to get frontmatter
    fetch(`/api/advisory/master-doc?folderPath=${encodeURIComponent(folderPath)}`)
      .then(res => res.json())
      .then(data => setMeta(data.frontmatter || {}))
      .catch(() => setMeta({}));
  }, [folderPath]);

  const Icon = type === 'deal' ? Briefcase : Users;

  return (
    <Card className="p-3 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <span className="font-medium">{name}</span>
      </div>
      {meta && (
        <div className="flex items-center justify-between text-sm">
          {meta.stage && <StageIndicator stage={meta.stage} showLabel />}
          {meta.lastUpdated && (
            <span className="text-xs text-muted-foreground">
              Updated: {new Date(meta.lastUpdated).toLocaleDateString()}
            </span>
          )}
        </div>
      )}
    </Card>
  );
}
```

---

### M312B-08: Deal File Tree

**File:** `components/sidebar/deal-file-tree.tsx`

**What it does:** Wraps Kibo UI Tree for advisory file browsing

```typescript
// components/sidebar/deal-file-tree.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  TreeProvider,
  TreeView,
  TreeNode,
  TreeNodeTrigger,
  TreeNodeContent,
  TreeExpander,
  TreeIcon,
  TreeLabel,
} from '@/components/ui/tree';
import type { FolderNode } from '@/lib/advisory/file-reader';

interface DealFileTreeProps {
  folderPath: string;
  onFileSelect: (path: string) => void;
}

export function DealFileTree({ folderPath, onFileSelect }: DealFileTreeProps) {
  const [tree, setTree] = useState<FolderNode | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/advisory/tree?basePath=${encodeURIComponent(folderPath)}`)
      .then(res => res.json())
      .then(data => setTree(data.tree))
      .catch(() => setTree(null))
      .finally(() => setLoading(false));
  }, [folderPath]);

  if (loading) return <div className="text-sm text-muted-foreground p-2">Loading...</div>;
  if (!tree) return <div className="text-sm text-muted-foreground p-2">No files found</div>;

  return (
    <TreeProvider defaultExpandedIds={[tree.path]} showLines animateExpand>
      <TreeView>
        <RenderNode node={tree} onFileSelect={onFileSelect} />
      </TreeView>
    </TreeProvider>
  );
}

function RenderNode({
  node,
  onFileSelect,
}: {
  node: FolderNode;
  onFileSelect: (path: string) => void;
}) {
  const hasChildren = node.type === 'folder' && node.children && node.children.length > 0;

  return (
    <TreeNode nodeId={node.path}>
      <TreeNodeTrigger
        onClick={() => node.type === 'file' && onFileSelect(node.path)}
        className="cursor-pointer hover:bg-accent rounded px-1"
      >
        <TreeExpander hasChildren={hasChildren} />
        <TreeIcon hasChildren={hasChildren} />
        <TreeLabel>{node.name}</TreeLabel>
      </TreeNodeTrigger>
      {hasChildren && (
        <TreeNodeContent hasChildren>
          {node.children!.map(child => (
            <RenderNode key={child.path} node={child} onFileSelect={onFileSelect} />
          ))}
        </TreeNodeContent>
      )}
    </TreeNode>
  );
}
```

---

### M312B-05: File Preview Modal

**File:** `components/sidebar/file-preview-modal.tsx`

**What it does:** Modal to display file content when selected from tree

```typescript
// components/sidebar/file-preview-modal.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

interface FilePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filePath: string | null;
}

export function FilePreviewModal({ open, onOpenChange, filePath }: FilePreviewModalProps) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!filePath || !open) {
      setContent(null);
      return;
    }

    setLoading(true);
    fetch(`/api/advisory/file?path=${encodeURIComponent(filePath)}`)
      .then(res => res.json())
      .then(data => setContent(data.content))
      .catch(() => setContent('Failed to load file'))
      .finally(() => setLoading(false));
  }, [filePath, open]);

  const fileName = filePath?.split('/').pop() || 'File Preview';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{fileName}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <pre className="text-sm whitespace-pre-wrap p-4 bg-muted rounded">
              {content}
            </pre>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

### M312B-09: Sidebar Chat List

**File:** `components/sidebar/sidebar-chat-list.tsx`

**What it does:** Compact chat list for detail view, filtered by project

```typescript
// components/sidebar/sidebar-chat-list.tsx
'use client';

import Link from 'next/link';
import { MessageSquare, Plus } from 'lucide-react';
import type { ChatWithProject } from '@/lib/db/types';

interface SidebarChatListProps {
  chats: ChatWithProject[];
  projectId: string;
  onNewChat: () => void;
}

export function SidebarChatList({ chats, projectId, onNewChat }: SidebarChatListProps) {
  const projectChats = chats.filter(c => c.project_id === projectId);

  return (
    <div className="space-y-1">
      {projectChats.length === 0 ? (
        <p className="text-sm text-muted-foreground px-2 py-1">No chats yet</p>
      ) : (
        projectChats.map(chat => (
          <Link
            key={chat.id}
            href={`/chat/${chat.id}`}
            className="flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-accent"
          >
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <span className="truncate">{chat.title || 'Untitled'}</span>
          </Link>
        ))
      )}
      <button
        onClick={onNewChat}
        className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground w-full rounded hover:bg-accent"
      >
        <Plus className="h-4 w-4" />
        <span>New Chat</span>
      </button>
    </div>
  );
}
```

---

## Reuse Existing Code

**Database Types:**
```typescript
// lib/db/types.ts - already exists
import type { ProjectWithStats, ChatWithProject, EntityType } from '@/lib/db/types';
```

**Advisory File Reader:**
```typescript
// lib/advisory/file-reader.ts - already exists
import { getAdvisoryFolderTree, type FolderNode } from '@/lib/advisory/file-reader';
```

**Existing Advisory API:**
```typescript
// app/api/advisory/file/route.ts - already exists
// Used for fetching file content
```

---

## Known Gotchas

| Issue | Why It Happens | Solution |
|-------|----------------|----------|
| Kibo Tree imports | Component uses specific export names | Check exact exports after installation |
| `advisory_folder_path` missing | Some projects don't have it | Filter by `entity_type` and check path exists |
| Master doc naming | Different naming conventions | Search for `master-doc-*.md` pattern |

---

## Testing Checklist

**After each task:**
- [ ] `npm run build` passes
- [ ] Dev server starts
- [ ] Feature works manually

**Final demo:**
- [ ] Sidebar shows DEALS/CLIENTS at top
- [ ] Clicking deal drills into detail view
- [ ] Info card shows stage and date
- [ ] Chats list shows project's chats
- [ ] File tree loads with animations
- [ ] Clicking file opens preview modal
- [ ] Back button returns to main view
- [ ] Mobile sidebar works

---

## Success Criteria

- [ ] Build passes
- [ ] Drill-down navigation works for deals and clients
- [ ] File preview modal functions correctly
- [ ] Back navigation returns to main view
- [ ] Kibo UI Tree renders with animations
- [ ] No regressions in existing sidebar functionality

---

## Resources

**External Docs:**
- Kibo UI Tree: https://www.kibo-ui.com/docs/tree

**Project Files:**
- Sprint tracking: `docs/sprints/active/M312B-01/sprint-m312b-01.md`
- Architecture: `CLAUDE.md`

---

*Prepared by Claude Code - December 10, 2025*
