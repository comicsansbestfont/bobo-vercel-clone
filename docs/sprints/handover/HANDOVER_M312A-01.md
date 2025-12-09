# Handover Guide: M3.12A-01 Chat UX Critical Features

**Sprint:** M3.12A-01
**Duration:** December 10-12, 2025
**Goal:** Enable message editing, document upload, and advisory folder browsing

---

## Executive Summary

This sprint adds three critical UX features to the chat interface: message editing with response regeneration, document upload with text extraction, and a folder browser for advisory files. These are standalone features with no dependencies on each other or M3.13.

---

## Pre-Sprint Checklist

- [ ] Review existing `components/ai-elements/message.tsx`
- [ ] Review existing `components/chat/chat-interface.tsx`
- [ ] Review existing `lib/advisory/file-reader.ts`
- [ ] Run `npm run build` to confirm clean starting state
- [ ] Install pdf-parse: `npm install pdf-parse @types/pdf-parse`

---

## Day 1: Message Editing (3.5h)

### Task M3.12A-01: Message Edit UI (2h)

**Objective:** Add edit functionality to user messages

**Files to Modify:**
- `components/ai-elements/message.tsx`

**Implementation:**

1. **Add edit icon to user messages:**
```typescript
// In message.tsx, add state and handler
const [isEditing, setIsEditing] = useState(false);
const [editContent, setEditContent] = useState('');

// Add edit button to user message actions
{message.role === 'user' && (
  <button
    onClick={() => {
      setIsEditing(true);
      setEditContent(getMessageText(message));
    }}
    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-accent rounded"
    title="Edit message"
  >
    <Pencil className="h-4 w-4" />
  </button>
)}
```

2. **Add inline editing textarea:**
```typescript
{isEditing ? (
  <div className="flex flex-col gap-2 w-full">
    <textarea
      value={editContent}
      onChange={(e) => setEditContent(e.target.value)}
      className="w-full p-2 border rounded resize-none min-h-[80px]"
      autoFocus
    />
    <div className="flex gap-2 justify-end">
      <button
        onClick={() => setIsEditing(false)}
        className="px-3 py-1 text-sm border rounded"
      >
        Cancel
      </button>
      <button
        onClick={() => onEdit?.(message.id, editContent)}
        className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded"
      >
        Save & Regenerate
      </button>
    </div>
  </div>
) : (
  // Existing message content rendering
)}
```

3. **Add onEdit prop:**
```typescript
interface MessageProps {
  message: UIMessage;
  onEdit?: (messageId: string, newContent: string) => void;
  // ... existing props
}
```

**Verification:**
- Edit icon appears on hover for user messages only
- Clicking edit shows textarea with current content
- Cancel reverts without changes
- Save triggers onEdit callback

**Done When:**
- User messages show edit icon on hover
- Inline editing textarea works
- Save and Cancel buttons function correctly

---

### Task M3.12A-02: useMessageEdit Hook (1.5h)

**Objective:** Handle message editing and response regeneration

**File to Create:** `hooks/useMessageEdit.ts`

**Implementation:**
```typescript
import { useCallback } from 'react';
import { UIMessage } from '@ai-sdk/react';

interface UseMessageEditOptions {
  messages: UIMessage[];
  setMessages: (messages: UIMessage[]) => void;
  reload: () => void;
}

export function useMessageEdit({ messages, setMessages, reload }: UseMessageEditOptions) {
  const handleEdit = useCallback((messageId: string, newContent: string) => {
    // Find the message index
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;

    // Get messages up to and including the edited message
    const messagesUpToEdit = messages.slice(0, messageIndex);

    // Create updated message
    const editedMessage: UIMessage = {
      ...messages[messageIndex],
      parts: [{ type: 'text', text: newContent }],
    };

    // Set messages (removes all messages after edited one)
    setMessages([...messagesUpToEdit, editedMessage]);

    // Trigger regeneration (uses last user message)
    // Small delay to ensure state is updated
    setTimeout(() => reload(), 100);
  }, [messages, setMessages, reload]);

  return { handleEdit };
}
```

**Integration in chat-interface.tsx:**
```typescript
import { useMessageEdit } from '@/hooks/useMessageEdit';

// In component
const { handleEdit } = useMessageEdit({
  messages,
  setMessages,
  reload,
});

// Pass to Message component
<Message
  message={message}
  onEdit={handleEdit}
  // ... other props
/>
```

**Verification:**
- Editing a message removes subsequent messages
- Response is regenerated after edit
- Conversation continues from edited point

**Done When:**
- Hook is created and exported
- Integration in chat-interface works
- Full edit → regenerate flow functions

---

## Day 2: Document Upload (3.5h)

### Task M3.12A-03: Document Processor (2h)

**Objective:** Extract text from PDF, TXT, and MD files

**File to Create:** `lib/documents/processor.ts`

**Dependencies:**
```bash
npm install pdf-parse @types/pdf-parse
```

**Implementation:**
```typescript
import pdfParse from 'pdf-parse';
import matter from 'gray-matter';

export interface ProcessedDocument {
  filename: string;
  type: 'pdf' | 'txt' | 'md' | 'image';
  content: string;
  metadata?: Record<string, unknown>;
  pageCount?: number;
}

export async function processDocument(file: File): Promise<ProcessedDocument> {
  const filename = file.name;
  const extension = filename.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'pdf':
      return processPdf(file);
    case 'txt':
      return processTxt(file);
    case 'md':
    case 'markdown':
      return processMarkdown(file);
    default:
      throw new Error(`Unsupported file type: ${extension}`);
  }
}

async function processPdf(file: File): Promise<ProcessedDocument> {
  const buffer = await file.arrayBuffer();
  const data = await pdfParse(Buffer.from(buffer));

  return {
    filename: file.name,
    type: 'pdf',
    content: data.text,
    pageCount: data.numpages,
    metadata: {
      info: data.info,
    },
  };
}

async function processTxt(file: File): Promise<ProcessedDocument> {
  const content = await file.text();
  return {
    filename: file.name,
    type: 'txt',
    content,
  };
}

async function processMarkdown(file: File): Promise<ProcessedDocument> {
  const raw = await file.text();
  const { data, content } = matter(raw);

  return {
    filename: file.name,
    type: 'md',
    content,
    metadata: data,
  };
}

// Utility to truncate for context
export function truncateForContext(doc: ProcessedDocument, maxChars: number = 10000): string {
  if (doc.content.length <= maxChars) {
    return doc.content;
  }
  return doc.content.slice(0, maxChars) + '\n\n[... truncated for context ...]';
}
```

**Verification:**
- PDF text extraction works
- TXT files read correctly
- MD files parse frontmatter

**Done When:**
- All 3 file types process correctly
- Error handling for unsupported types
- Truncation utility works

---

### Task M3.12A-04: DocumentUploadModal Component (1.5h)

**Objective:** Create UI for uploading and previewing documents

**File to Create:** `components/documents/upload-modal.tsx`

**Implementation:**
```typescript
'use client';

import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { processDocument, ProcessedDocument, truncateForContext } from '@/lib/documents/processor';
import { Upload, FileText, X } from 'lucide-react';

interface DocumentUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDocumentProcessed: (doc: ProcessedDocument) => void;
}

export function DocumentUploadModal({
  open,
  onOpenChange,
  onDocumentProcessed,
}: DocumentUploadModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [preview, setPreview] = useState<ProcessedDocument | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (!file) return;

    await processFile(file);
  }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await processFile(file);
  }, []);

  const processFile = async (file: File) => {
    setProcessing(true);
    setError(null);

    try {
      const doc = await processDocument(file);
      setPreview(doc);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file');
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirm = () => {
    if (preview) {
      onDocumentProcessed(preview);
      setPreview(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
        </DialogHeader>

        {!preview ? (
          <div
            className={`
              border-2 border-dashed rounded-lg p-8 text-center
              ${isDragging ? 'border-primary bg-primary/5' : 'border-muted'}
            `}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium">Drop a file here</p>
            <p className="text-sm text-muted-foreground mb-4">
              Supports PDF, TXT, MD files
            </p>
            <label className="cursor-pointer">
              <span className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">
                Select File
              </span>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.txt,.md,.markdown"
                onChange={handleFileSelect}
              />
            </label>
            {error && <p className="text-destructive mt-4">{error}</p>}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <span className="font-medium">{preview.filename}</span>
              <span className="text-muted-foreground text-sm">
                ({preview.type.toUpperCase()})
              </span>
              <button
                onClick={() => setPreview(null)}
                className="ml-auto p-1 hover:bg-accent rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[300px] overflow-auto bg-muted/50 rounded p-4 text-sm font-mono">
              {truncateForContext(preview, 2000)}
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 bg-primary text-primary-foreground rounded"
              >
                Add to Context
              </button>
            </div>
          </div>
        )}

        {processing && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <p>Processing...</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

**Integration:**
- Add button to prompt-input.tsx to trigger modal
- Pass processed document content to chat context

**Done When:**
- Drag-drop upload works
- File picker works
- Preview shows extracted text
- "Add to Context" injects into chat

---

## Day 3: Advisory Browser (3.5h)

### Task M3.12A-05: Advisory Folder Browser Tree View (2h)

**Objective:** Create tree view for browsing advisory folders

**File to Create:** `components/advisory/folder-browser.tsx`

**Extend:** `lib/advisory/file-reader.ts`

**Add to file-reader.ts:**
```typescript
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

export interface FolderNode {
  name: string;
  path: string;
  type: 'folder' | 'file';
  children?: FolderNode[];
}

export function getAdvisoryFolderTree(basePath: string = 'advisory'): FolderNode {
  const rootPath = join(process.cwd(), basePath);

  function buildTree(dirPath: string, name: string): FolderNode {
    const entries = readdirSync(dirPath);
    const children: FolderNode[] = [];

    for (const entry of entries) {
      const entryPath = join(dirPath, entry);
      const stat = statSync(entryPath);

      if (stat.isDirectory()) {
        children.push(buildTree(entryPath, entry));
      } else if (entry.endsWith('.md')) {
        children.push({
          name: entry,
          path: entryPath.replace(process.cwd() + '/', ''),
          type: 'file',
        });
      }
    }

    return {
      name,
      path: dirPath.replace(process.cwd() + '/', ''),
      type: 'folder',
      children: children.sort((a, b) => {
        // Folders first, then files
        if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
        return a.name.localeCompare(b.name);
      }),
    };
  }

  return buildTree(rootPath, basePath);
}
```

**folder-browser.tsx:**
```typescript
'use client';

import { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FileText } from 'lucide-react';
import type { FolderNode } from '@/lib/advisory/file-reader';

interface FolderBrowserProps {
  tree: FolderNode;
  onFileSelect: (path: string) => void;
  selectedPath?: string;
}

export function FolderBrowser({ tree, onFileSelect, selectedPath }: FolderBrowserProps) {
  return (
    <div className="text-sm">
      <TreeNode
        node={tree}
        depth={0}
        onFileSelect={onFileSelect}
        selectedPath={selectedPath}
      />
    </div>
  );
}

function TreeNode({
  node,
  depth,
  onFileSelect,
  selectedPath,
}: {
  node: FolderNode;
  depth: number;
  onFileSelect: (path: string) => void;
  selectedPath?: string;
}) {
  const [isExpanded, setIsExpanded] = useState(depth < 2);

  const isSelected = selectedPath === node.path;
  const paddingLeft = depth * 16;

  if (node.type === 'file') {
    return (
      <button
        onClick={() => onFileSelect(node.path)}
        className={`
          w-full flex items-center gap-2 py-1 px-2 hover:bg-accent rounded
          ${isSelected ? 'bg-accent' : ''}
        `}
        style={{ paddingLeft }}
      >
        <FileText className="h-4 w-4 text-muted-foreground" />
        <span className="truncate">{node.name}</span>
      </button>
    );
  }

  return (
    <div>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-1 py-1 px-2 hover:bg-accent rounded"
        style={{ paddingLeft }}
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        <Folder className="h-4 w-4 text-muted-foreground" />
        <span className="truncate">{node.name}</span>
      </button>
      {isExpanded && node.children?.map((child) => (
        <TreeNode
          key={child.path}
          node={child}
          depth={depth + 1}
          onFileSelect={onFileSelect}
          selectedPath={selectedPath}
        />
      ))}
    </div>
  );
}
```

**Verification:**
- Folders expand/collapse correctly
- Files are selectable
- Selected file is highlighted

**Done When:**
- Tree view renders advisory folder structure
- Folders expand/collapse
- File selection triggers callback

---

### Task M3.12A-06: File Preview Panel (1.5h)

**Objective:** Add preview panel to show selected file content

**File to Modify:** Add to `folder-browser.tsx` or create separate component

**Implementation:**
```typescript
'use client';

import { useState, useEffect } from 'react';
import { FolderBrowser } from './folder-browser';
import type { FolderNode } from '@/lib/advisory/file-reader';

interface AdvisoryBrowserWithPreviewProps {
  tree: FolderNode;
}

export function AdvisoryBrowserWithPreview({ tree }: AdvisoryBrowserWithPreviewProps) {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedPath) {
      setContent(null);
      return;
    }

    setLoading(true);
    // Fetch file content via API
    fetch(`/api/advisory/file?path=${encodeURIComponent(selectedPath)}`)
      .then(res => res.json())
      .then(data => setContent(data.content))
      .catch(() => setContent('Failed to load file'))
      .finally(() => setLoading(false));
  }, [selectedPath]);

  return (
    <div className="flex h-full">
      {/* Tree panel */}
      <div className="w-1/3 border-r overflow-auto p-2">
        <FolderBrowser
          tree={tree}
          onFileSelect={setSelectedPath}
          selectedPath={selectedPath ?? undefined}
        />
      </div>

      {/* Preview panel */}
      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : content ? (
          <div className="prose dark:prose-invert max-w-none">
            <pre className="whitespace-pre-wrap text-sm">{content}</pre>
          </div>
        ) : (
          <p className="text-muted-foreground">
            Select a file to preview
          </p>
        )}
      </div>
    </div>
  );
}
```

**API Endpoint:** `app/api/advisory/file/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get('path');

  if (!path || !path.startsWith('advisory/')) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  try {
    const content = readFileSync(join(process.cwd(), path), 'utf-8');
    return NextResponse.json({ content });
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}
```

**Verification:**
- Split pane layout works
- File content loads on selection
- Preview updates when selection changes

**Done When:**
- Split pane browser with preview works
- API endpoint serves file content
- Markdown renders in preview

---

## Definition of Done

- [ ] User can edit messages and get new responses
- [ ] PDFs can be uploaded and text extracted
- [ ] TXT and MD files can be uploaded
- [ ] Advisory folders browsable with tree view
- [ ] File preview panel shows selected content
- [ ] Build passes (`npm run build`)
- [ ] No regressions in existing chat functionality

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `components/ai-elements/message.tsx` | Edit UI for user messages |
| `hooks/useMessageEdit.ts` | NEW: Edit + regenerate logic |
| `lib/documents/processor.ts` | NEW: PDF/TXT/MD extraction |
| `components/documents/upload-modal.tsx` | NEW: Upload UI |
| `components/advisory/folder-browser.tsx` | NEW: Tree view |
| `lib/advisory/file-reader.ts` | Extend for folder listing |
| `app/api/advisory/file/route.ts` | NEW: File content API |

---

## Dependencies

```bash
npm install pdf-parse @types/pdf-parse
```

Note: pdf-parse is a server-side only library. Ensure document processing happens in API routes or server components.

---

## Rollback Plan

If issues arise:
1. Remove edit functionality by reverting message.tsx changes
2. Remove upload modal from imports
3. Delete new files in lib/documents/ and components/documents/
4. Revert changes to file-reader.ts

---

## Notes for Executor

- Message editing is client-side only (no DB changes)
- PDF processing must be server-side (Node.js Buffer)
- Advisory browser can be added to sidebar or as modal
- All features are independent - can ship partially if needed

---

**Created:** December 10, 2025
**Sprint Tracker:** [sprint-m312a-01.md](../active/M312A-01/sprint-m312a-01.md)
