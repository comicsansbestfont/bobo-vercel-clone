# Sprint M3-03 Handover Document

**Sprint:** M3-03 - Claude-Style Memory UI
**Duration:** December 8-14, 2025 (7 days, 15 hours capacity)
**Handover Date:** December 7, 2025
**Developer:** TBD
**Sprint Owner:** Sachee Perera (CTO)

---

## 📋 Quick Start Checklist

Before you begin, ensure you have:

- [ ] Read this handover document completely
- [ ] Reviewed [MEMORY_PAGE_UI_SPEC.md](../../specs/MEMORY_PAGE_UI_SPEC.md) (992 lines, complete UI specification)
- [ ] Reviewed [sprint-m3-03.md](./sprint-m3-03.md) (sprint plan with demo script)
- [ ] Reviewed [memory-schema.md](../../memory-schema.md) v2.0 (data architecture)
- [ ] Access to Supabase database (M3-02 completed)
- [ ] Development environment running (`npm run dev`)
- [ ] Completed Sprint M3-02 code reviewed (backend implementation)
- [ ] Familiarity with shadcn/ui components (Radix UI + Tailwind)
- [ ] React Query knowledge (for data fetching)

---

## 🎯 Sprint Goal

**Build the `/memory` page with hierarchical UI, edit/delete capabilities, and privacy controls inspired by Claude's memory system.**

You're implementing the user-facing memory management interface that gives users complete transparency and control over what the AI knows about them. This sprint builds upon the automatic extraction pipeline from M3-02 by providing a beautiful, intuitive UI.

### Success Criteria
✅ `/memory` page accessible from main navigation
✅ All 6 memory categories displayed in hierarchical sections
✅ Users can expand/collapse each section
✅ Users can add, edit, and delete memories
✅ Memory suggestions appear and can be accepted/dismissed
✅ Settings modal controls auto-extraction and privacy
✅ Responsive design works on desktop and mobile
✅ Page loads in < 2 seconds with 100+ memories

---

## 📚 Context: What Was Done Before

### Sprint M3-01 (✅ Complete)
**Status:** All 4 tasks complete, 4.5 hours actual (55% under estimate!)

**Deliverables:**
1. ✅ `user_profiles` table with manual profile fields
2. ✅ `/settings/profile` page for manual entry
3. ✅ GET/POST `/api/user/profile` endpoints
4. ✅ System prompt injection: "### ABOUT THE USER"

**Key Learnings:**
- shadcn/ui components work well for forms
- React Hook Form + Zod validation pattern established
- Database queries use Supabase client

---

### Sprint M3-02 (✅ Complete)
**Status:** All 6 tasks complete, 16 hours actual (0% variance, on target!)
**Quality:** A rating (2 minor bugs fixed during testing)

**Deliverables:**
1. ✅ `memory_entries` table with 6 hierarchical categories
2. ✅ GPT-4o-mini extraction pipeline
3. ✅ Background job trigger (POST /api/memory/extract)
4. ✅ Deduplication logic (exact hash + fuzzy matching)
5. ✅ Memory injection into system prompts
6. ✅ Weekly consolidation cron job

**Key Files to Reference:**
- `supabase/migrations/20251201000000_m3_phase2_memory_entries.sql` - Database schema
- `lib/memory/extractor.ts` - Extraction pipeline (221 lines)
- `lib/memory/deduplicator.ts` - Deduplication logic (168 lines)
- `app/api/memory/extract/route.ts` - Background job endpoint
- `app/api/chat/route.ts` (memory injection section) - How memories are used
- `lib/db/queries.ts` - Memory CRUD functions

**Test Report:** See `docs/reports/M3-02_TEST_REPORT.md` for backend testing approach

**Data Available:**
- All memory entries stored in `memory_entries` table
- 6 categories: work_context, personal_context, top_of_mind, brief_history, long_term_background, other_instructions
- Each memory has: content, confidence, relevance_score, source_chat_ids, etc.
- Settings stored in `memory_settings` table

---

## 🗺️ Sprint M3-03 Architecture Overview

### Component Hierarchy

```
app/memory/page.tsx (Main Memory Page)
├── MemoryHeader
│   ├── Search Input
│   ├── Settings Button
│   └── Export Button
│
├── MemorySummary
│   ├── Total Count
│   ├── Token Usage (with progress bar)
│   └── Last Updated
│
├── MemorySuggestions (conditional)
│   └── SuggestionCard[]
│       ├── Accept Button
│       └── Dismiss Button
│
└── Memory Sections (6 categories)
    ├── MemorySection (Work Context)
    │   ├── Collapsible Header
    │   │   ├── Chevron Icon
    │   │   ├── Title + Badge (count)
    │   │   └── "+ Add Memory" Button
    │   └── Collapsible Content
    │       └── MemoryCard[]
    │           ├── Content Display
    │           ├── Confidence Badge
    │           ├── Provenance Link
    │           ├── Edit Button
    │           └── Delete Button
    │
    ├── MemorySection (Personal Context)
    ├── MemorySection (Top of Mind)
    ├── MemorySection (Brief History)
    │   ├── Subsection (Recent Months)
    │   ├── Subsection (Earlier)
    │   └── Subsection (Long Term)
    ├── MemorySection (Long-Term Background)
    └── MemorySection (Other Instructions)

Modals (conditional rendering):
├── AddMemoryModal
├── EditMemoryModal
├── DeleteConfirmDialog
├── ProvenanceModal
└── MemorySettingsModal
```

### Data Flow

```
1. PAGE LOAD
   ↓
GET /api/memory/entries → React Query cache
   ↓
GET /api/memory/settings → React Query cache
   ↓
GET /api/memory/suggestions → React Query cache
   ↓
Render page with data

2. USER ADDS MEMORY
   ↓
Open AddMemoryModal
   ↓
User fills form → Validate with Zod
   ↓
POST /api/memory/entries
   ↓
React Query optimistic update
   ↓
Close modal + toast notification
   ↓
Refetch data (automatic via React Query)

3. USER EDITS MEMORY
   ↓
Open EditMemoryModal with pre-filled data
   ↓
User modifies content → Validate
   ↓
PATCH /api/memory/entries/:id
   ↓
Optimistic update
   ↓
Close modal + toast

4. USER DELETES MEMORY
   ↓
Show AlertDialog confirmation
   ↓
User confirms
   ↓
DELETE /api/memory/entries/:id
   ↓
Optimistic remove from UI
   ↓
Toast notification

5. USER ACCEPTS SUGGESTION
   ↓
POST /api/memory/suggestions/:id/accept
   ↓
Backend: Create memory + delete suggestion
   ↓
Refetch memories and suggestions
   ↓
Toast notification
```

---

## 📋 Task Breakdown (6 Tasks, 15 Hours)

### Task M3-5: Memory Management Page (4 hours)
**File:** `app/memory/page.tsx`

**What to build:**
Main memory page with routing, layout, and all section components.

**Implementation:**
```typescript
// app/memory/page.tsx

'use client';

import { useState } from 'react';
import { useMemories, useMemorySettings, useMemorySuggestions } from '@/lib/memory/queries';
import { MemoryHeader } from '@/components/memory/memory-header';
import { MemorySummary } from '@/components/memory/memory-summary';
import { MemorySuggestions } from '@/components/memory/memory-suggestions';
import { MemorySection } from '@/components/memory/memory-section';
import { MemorySettingsModal } from '@/components/memory/memory-settings-modal';
import { calculateTokenUsage, filterByCategory } from '@/lib/memory/utils';

export default function MemoryPage() {
  const { data: memories, isLoading } = useMemories();
  const { data: settings } = useMemorySettings();
  const { data: suggestions } = useMemorySuggestions();

  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  if (isLoading) {
    return <div>Loading memories...</div>;
  }

  const filteredMemories = searchQuery
    ? memories?.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : memories;

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <MemoryHeader
        onSearch={setSearchQuery}
        onSettingsClick={() => setShowSettings(true)}
        onExport={() => exportMemories(memories)}
      />

      <MemorySummary
        totalCount={memories?.length || 0}
        tokenUsage={calculateTokenUsage(memories)}
        tokenBudget={settings?.token_budget || 500}
        lastUpdated={getLastUpdated(memories)}
      />

      {suggestions && suggestions.length > 0 && (
        <MemorySuggestions suggestions={suggestions} />
      )}

      <div className="space-y-4 mt-6">
        <MemorySection
          category="work_context"
          title="Work Context"
          description="Your current role, skills, projects, and work preferences"
          memories={filterByCategory(filteredMemories, 'work_context')}
          icon="💼"
        />

        <MemorySection
          category="personal_context"
          title="Personal Context"
          description="Your location, hobbies, family, and personal background"
          memories={filterByCategory(filteredMemories, 'personal_context')}
          icon="👤"
        />

        <MemorySection
          category="top_of_mind"
          title="Top of Mind"
          description="Current priorities, recent activities, and short-term focus"
          memories={filterByCategory(filteredMemories, 'top_of_mind')}
          icon="🎯"
          decayBadge={true}
        />

        <MemorySection
          category="brief_history"
          title="Brief History"
          description="Past experiences, projects, and timeline events"
          memories={filterByCategory(filteredMemories, 'brief_history')}
          icon="📅"
          hasSubcategories={true}
        />

        <MemorySection
          category="long_term_background"
          title="Long-Term Background"
          description="Education, career history, languages, and foundational facts"
          memories={filterByCategory(filteredMemories, 'long_term_background')}
          icon="🎓"
        />

        <MemorySection
          category="other_instructions"
          title="Other Instructions"
          description="Communication preferences, format preferences, and interaction patterns"
          memories={filterByCategory(filteredMemories, 'other_instructions')}
          icon="⚙️"
        />
      </div>

      {showSettings && (
        <MemorySettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
```

**Routing:** Add link to sidebar navigation (`components/layout/sidebar.tsx`):
```tsx
<NavLink href="/memory" icon={Brain}>
  Memory
</NavLink>
```

**Testing:**
- Navigate to `/memory` → Page loads
- Check all 6 sections render
- Verify search filters correctly
- Test settings modal opens

**Definition of Done:**
- [ ] `/memory` route accessible from sidebar
- [ ] Page loads in < 2 seconds with 100+ memories
- [ ] All 6 category sections render correctly
- [ ] Summary stats display accurately
- [ ] Search bar functional
- [ ] Empty state shown when no memories
- [ ] Responsive design works on mobile
- [ ] No console errors

---

### Task M3-23: Collapsible Sections (3 hours)
**Files:**
- `components/memory/memory-section.tsx`
- `components/memory/memory-card.tsx`

**What to build:**
Collapsible section components with smooth animations and localStorage persistence.

**Implementation:**
```typescript
// components/memory/memory-section.tsx

'use client';

import { useState, useEffect } from 'react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { MemoryCard } from './memory-card';
import { MemoryEntry, MemoryCategory } from '@/lib/db/types';

interface MemorySectionProps {
  category: MemoryCategory;
  title: string;
  description: string;
  memories: MemoryEntry[];
  icon: string;
  hasSubcategories?: boolean;
  decayBadge?: boolean;
}

export function MemorySection({
  category,
  title,
  description,
  memories,
  icon,
  hasSubcategories = false,
  decayBadge = false,
}: MemorySectionProps) {
  // Load initial state from localStorage
  const [isExpanded, setIsExpanded] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`memory-section-${category}`);
      return stored ? JSON.parse(stored) : false;
    }
    return false;
  });

  const [showAddModal, setShowAddModal] = useState(false);

  // Persist state to localStorage
  useEffect(() => {
    localStorage.setItem(`memory-section-${category}`, JSON.stringify(isExpanded));
  }, [isExpanded, category]);

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent section toggle
    setShowAddModal(true);
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className="border border-border rounded-lg overflow-hidden">
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between p-4 bg-card hover:bg-accent transition-colors">
            <div className="flex items-center gap-3">
              {isExpanded ? (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              )}
              <span className="text-2xl">{icon}</span>
              <div className="text-left">
                <h2 className="text-lg font-semibold">{title}</h2>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
              <Badge variant="secondary" className="ml-2">
                {memories.length} {memories.length === 1 ? 'memory' : 'memories'}
              </Badge>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleAddClick}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Memory
            </Button>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent className="border-t border-border">
          <div className="p-4 space-y-2">
            {memories.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No memories in this category yet. Click "+ Add Memory" to create one.
              </p>
            ) : hasSubcategories ? (
              <BriefHistorySubsections memories={memories} decayBadge={decayBadge} />
            ) : (
              memories.map(memory => (
                <MemoryCard
                  key={memory.id}
                  memory={memory}
                  decayBadge={decayBadge}
                />
              ))
            )}
          </div>
        </CollapsibleContent>
      </div>

      {showAddModal && (
        <AddMemoryModal
          category={category}
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </Collapsible>
  );
}

// Brief History subsections component
function BriefHistorySubsections({ memories, decayBadge }: { memories: MemoryEntry[], decayBadge: boolean }) {
  const recentMonths = memories.filter(m => m.subcategory === 'recent_months');
  const earlier = memories.filter(m => m.subcategory === 'earlier');
  const longTerm = memories.filter(m => m.subcategory === 'long_term');

  return (
    <div className="space-y-4">
      {recentMonths.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Recent Months (0-3 months ago)</h3>
          <div className="space-y-2">
            {recentMonths.map(memory => (
              <MemoryCard key={memory.id} memory={memory} decayBadge={decayBadge} />
            ))}
          </div>
        </div>
      )}

      {earlier.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Earlier (3-12 months ago)</h3>
          <div className="space-y-2">
            {earlier.map(memory => (
              <MemoryCard key={memory.id} memory={memory} decayBadge={decayBadge} />
            ))}
          </div>
        </div>
      )}

      {longTerm.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Long Term (1+ year ago)</h3>
          <div className="space-y-2">
            {longTerm.map(memory => (
              <MemoryCard key={memory.id} memory={memory} decayBadge={decayBadge} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

**Memory Card Component:**
```typescript
// components/memory/memory-card.tsx

'use client';

import { useState } from 'react';
import { MemoryEntry } from '@/lib/db/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, Link as LinkIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface MemoryCardProps {
  memory: MemoryEntry;
  decayBadge?: boolean;
}

export function MemoryCard({ memory, decayBadge }: MemoryCardProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showProvenance, setShowProvenance] = useState(false);

  const confidenceBadge = getConfidenceBadge(memory.confidence);
  const isRecent = new Date().getTime() - new Date(memory.last_mentioned).getTime() < 7 * 24 * 60 * 60 * 1000; // 7 days

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm leading-relaxed">{memory.content}</p>

            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {/* Confidence Badge */}
              <Badge variant={confidenceBadge.variant} className="text-xs">
                {confidenceBadge.label}
              </Badge>

              {/* Decay Indicator (for Top of Mind) */}
              {decayBadge && isRecent && (
                <Badge variant="outline" className="text-xs border-green-500 text-green-600">
                  Active
                </Badge>
              )}

              {/* Source Count */}
              {memory.source_message_count > 1 && (
                <Badge variant="secondary" className="text-xs">
                  {memory.source_message_count} sources
                </Badge>
              )}

              {/* Last Mentioned */}
              <span className="text-xs text-muted-foreground">
                Updated {formatDistanceToNow(new Date(memory.last_mentioned), { addSuffix: true })}
              </span>
            </div>
          </div>

          {/* Action Buttons (visible on hover) */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {memory.source_chat_ids.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowProvenance(true)}
                title="View source chats"
              >
                <LinkIcon className="w-4 h-4" />
              </Button>
            )}

            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowEditModal(true)}
              title="Edit memory"
            >
              <Edit2 className="w-4 h-4" />
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowDeleteDialog(true)}
              title="Delete memory"
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Modals (implement in later tasks) */}
      {showEditModal && <EditMemoryModal memory={memory} onClose={() => setShowEditModal(false)} />}
      {showDeleteDialog && <DeleteConfirmDialog memory={memory} onClose={() => setShowDeleteDialog(false)} />}
      {showProvenance && <ProvenanceModal memory={memory} onClose={() => setShowProvenance(false)} />}
    </Card>
  );
}

function getConfidenceBadge(confidence: number) {
  if (confidence >= 0.9) return { label: 'Very High', variant: 'default' as const };
  if (confidence >= 0.7) return { label: 'High', variant: 'secondary' as const };
  if (confidence >= 0.5) return { label: 'Medium', variant: 'outline' as const };
  return { label: 'Low', variant: 'destructive' as const };
}
```

**shadcn/ui Components Needed:**
```bash
npx shadcn@latest add collapsible
npx shadcn@latest add card
npx shadcn@latest add badge
npx shadcn@latest add button
```

**Testing:**
- Click section headers → Expand/collapse animation smooth
- Refresh page → Section states persist
- Click "+ Add Memory" → Modal opens (stub for now)
- Hover memory cards → Action buttons appear

**Definition of Done:**
- [ ] All 6 sections collapsible (smooth animation)
- [ ] Chevron icon rotates on expand/collapse
- [ ] Section state persisted to localStorage
- [ ] Memory count badge accurate
- [ ] "+ Add Memory" button functional
- [ ] Brief History has 3 nested subcategories
- [ ] Keyboard navigation works (Enter/Space to toggle)

---

### Task M3-6: Edit/Delete Specific Memory Entries (2 hours)
**Files:**
- `components/memory/add-memory-modal.tsx`
- `components/memory/edit-memory-modal.tsx` (can reuse AddMemoryModal)
- `lib/memory/api.ts`

**What to build:**
CRUD modals for adding, editing, and deleting memories.

**API Client:**
```typescript
// lib/memory/api.ts

export const memoryApi = {
  // CREATE
  async createMemory(data: CreateMemoryData) {
    const response = await fetch('/api/memory/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create memory');
    return response.json();
  },

  // UPDATE
  async updateMemory(id: string, data: Partial<MemoryEntry>) {
    const response = await fetch(`/api/memory/entries/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update memory');
    return response.json();
  },

  // DELETE
  async deleteMemory(id: string) {
    const response = await fetch(`/api/memory/entries/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete memory');
    return response.json();
  },

  // GET ALL
  async getMemories() {
    const response = await fetch('/api/memory/entries');
    if (!response.ok) throw new Error('Failed to fetch memories');
    return response.json();
  },
};
```

**React Query Hooks:**
```typescript
// lib/memory/queries.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { memoryApi } from './api';
import { toast } from 'sonner';

export function useMemories() {
  return useQuery({
    queryKey: ['memories'],
    queryFn: memoryApi.getMemories,
  });
}

export function useCreateMemory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: memoryApi.createMemory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
      toast.success('Memory added successfully');
    },
    onError: (error) => {
      toast.error('Failed to create memory');
      console.error(error);
    },
  });
}

export function useUpdateMemory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MemoryEntry> }) =>
      memoryApi.updateMemory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
      toast.success('Memory updated');
    },
    onError: () => {
      toast.error('Failed to update memory');
    },
  });
}

export function useDeleteMemory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: memoryApi.deleteMemory,
    onMutate: async (id) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['memories'] });
      const previousMemories = queryClient.getQueryData(['memories']);

      queryClient.setQueryData(['memories'], (old: MemoryEntry[]) =>
        old.filter(m => m.id !== id)
      );

      return { previousMemories };
    },
    onError: (err, id, context) => {
      // Rollback on error
      queryClient.setQueryData(['memories'], context?.previousMemories);
      toast.error('Failed to delete memory');
    },
    onSuccess: () => {
      toast.success('Memory deleted');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
    },
  });
}
```

**Add/Edit Modal (shared component):**
```typescript
// components/memory/add-memory-modal.tsx

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useCreateMemory, useUpdateMemory } from '@/lib/memory/queries';
import { MemoryCategory, MemoryEntry } from '@/lib/db/types';

const memorySchema = z.object({
  category: z.string(),
  subcategory: z.string().optional(),
  content: z.string().min(10, 'Content must be at least 10 characters').max(500, 'Content must be less than 500 characters'),
  summary: z.string().optional(),
  confidence: z.number().min(0.5).max(1.0),
  notes: z.string().optional(),
});

type MemoryFormData = z.infer<typeof memorySchema>;

interface AddMemoryModalProps {
  category: MemoryCategory;
  isOpen: boolean;
  onClose: () => void;
  memory?: MemoryEntry; // If editing
}

export function AddMemoryModal({ category, isOpen, onClose, memory }: AddMemoryModalProps) {
  const isEditing = !!memory;
  const createMemory = useCreateMemory();
  const updateMemory = useUpdateMemory();

  const form = useForm<MemoryFormData>({
    resolver: zodResolver(memorySchema),
    defaultValues: memory ? {
      category: memory.category,
      subcategory: memory.subcategory || undefined,
      content: memory.content,
      summary: memory.summary || undefined,
      confidence: memory.confidence,
      notes: '',
    } : {
      category,
      content: '',
      confidence: 0.95,
      notes: '',
    },
  });

  const onSubmit = async (data: MemoryFormData) => {
    if (isEditing) {
      await updateMemory.mutateAsync({ id: memory.id, data });
    } else {
      await createMemory.mutateAsync({
        ...data,
        source_type: 'manual',
        source_chat_ids: [],
        source_project_ids: [],
      });
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Memory' : `Add Memory to ${getCategoryLabel(category)}`}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="content">Content *</Label>
            <Textarea
              id="content"
              placeholder="Enter memory content... (e.g., 'Senior software engineer at Google')"
              rows={3}
              {...form.register('content')}
            />
            {form.formState.errors.content && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.content.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="summary">Summary (optional)</Label>
            <Textarea
              id="summary"
              placeholder="Optional one-sentence summary..."
              rows={2}
              {...form.register('summary')}
            />
          </div>

          <div>
            <Label htmlFor="confidence">Confidence Level</Label>
            <Select
              value={form.watch('confidence').toString()}
              onValueChange={(value) => form.setValue('confidence', parseFloat(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0.95">Very High (0.95)</SelectItem>
                <SelectItem value="0.8">High (0.8)</SelectItem>
                <SelectItem value="0.6">Medium (0.6)</SelectItem>
                <SelectItem value="0.5">Low (0.5)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {category === 'brief_history' && (
            <div>
              <Label htmlFor="subcategory">Time Period</Label>
              <Select {...form.register('subcategory')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent_months">Recent Months (0-3 months ago)</SelectItem>
                  <SelectItem value="earlier">Earlier (3-12 months ago)</SelectItem>
                  <SelectItem value="long_term">Long Term (1+ year ago)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="notes">Internal Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Optional notes for yourself (not shown to AI)..."
              rows={2}
              {...form.register('notes')}
            />
            <p className="text-xs text-muted-foreground mt-1">
              These notes are for your reference only and won't be included in the AI's context.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function getCategoryLabel(category: MemoryCategory): string {
  const labels: Record<MemoryCategory, string> = {
    work_context: 'Work Context',
    personal_context: 'Personal Context',
    top_of_mind: 'Top of Mind',
    brief_history: 'Brief History',
    long_term_background: 'Long-Term Background',
    other_instructions: 'Other Instructions',
  };
  return labels[category];
}
```

**Delete Confirmation Dialog:**
```typescript
// Use within MemoryCard component

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

function DeleteConfirmDialog({ memory, onClose }: { memory: MemoryEntry, onClose: () => void }) {
  const deleteMemory = useDeleteMemory();

  const handleDelete = async () => {
    await deleteMemory.mutateAsync(memory.id);
    onClose();
  };

  return (
    <AlertDialog open={true} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Memory?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this memory?
            <br />
            <br />
            <strong>"{memory.content}"</strong>
            <br />
            <br />
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

**API Routes (Backend):**
```typescript
// app/api/memory/entries/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabase, DEFAULT_USER_ID } from '@/lib/db/client';
import { createMemory, getUserMemories } from '@/lib/db/queries';

export async function GET() {
  try {
    const memories = await getUserMemories({ relevance_threshold: 0 }); // Get all
    return NextResponse.json(memories);
  } catch (error) {
    console.error('GET /api/memory/entries error:', error);
    return NextResponse.json({ error: 'Failed to fetch memories' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const memory = await createMemory({
      ...data,
      user_id: DEFAULT_USER_ID,
    });
    return NextResponse.json(memory);
  } catch (error) {
    console.error('POST /api/memory/entries error:', error);
    return NextResponse.json({ error: 'Failed to create memory' }, { status: 500 });
  }
}

// app/api/memory/entries/[id]/route.ts

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const updates = await req.json();
    const { data, error } = await supabase
      .from('memory_entries')
      .update(updates)
      .eq('id', params.id)
      .eq('user_id', DEFAULT_USER_ID)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error('PATCH /api/memory/entries/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update memory' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await supabase
      .from('memory_entries')
      .delete()
      .eq('id', params.id)
      .eq('user_id', DEFAULT_USER_ID);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/memory/entries/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete memory' }, { status: 500 });
  }
}
```

**shadcn/ui Components Needed:**
```bash
npx shadcn@latest add dialog
npx shadcn@latest add alert-dialog
npx shadcn@latest add select
npx shadcn@latest add textarea
npx shadcn@latest add label
npx shadcn@latest add toast
```

**Install sonner for toasts:**
```bash
npm install sonner
```

**Testing:**
- Click "+ Add Memory" → Modal opens, form validates
- Submit valid data → Memory appears in list
- Click "Edit" on memory → Modal pre-fills
- Submit edit → Memory updates
- Click "Delete" → Confirmation dialog appears
- Confirm delete → Memory removes from list
- All actions show toast notifications

**Definition of Done:**
- [ ] Add memory modal opens and submits correctly
- [ ] Edit memory modal pre-fills with existing data
- [ ] Delete confirmation dialog shows before deletion
- [ ] All CRUD operations update UI optimistically
- [ ] Toast notifications appear for all actions
- [ ] Errors handled gracefully with error toasts
- [ ] Form validation works (min length, max length)

---

### Task M3-24: Memory Suggestions UI (2 hours)
**Files:**
- `components/memory/memory-suggestions.tsx`
- `app/api/memory/suggestions/route.ts`

**What to build:**
Floating suggestions card that displays AI-suggested memories for user approval.

**Component:**
```typescript
// components/memory/memory-suggestions.tsx

'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Sparkles } from 'lucide-react';
import { useAcceptSuggestion, useDismissSuggestion } from '@/lib/memory/queries';
import { MemorySuggestion } from '@/lib/db/types';

interface MemorySuggestionsProps {
  suggestions: MemorySuggestion[];
}

export function MemorySuggestions({ suggestions }: MemorySuggestionsProps) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <Card className="border-2 border-primary/20 bg-primary/5 mb-6">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <CardTitle>Memory Suggestions</CardTitle>
        </div>
        <CardDescription>
          We think these might be relevant memories about you. Accept or dismiss them.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions.slice(0, 3).map(suggestion => (
          <SuggestionCard key={suggestion.id} suggestion={suggestion} />
        ))}
      </CardContent>
    </Card>
  );
}

function SuggestionCard({ suggestion }: { suggestion: MemorySuggestion }) {
  const acceptSuggestion = useAcceptSuggestion();
  const dismissSuggestion = useDismissSuggestion();

  const handleAccept = async () => {
    await acceptSuggestion.mutateAsync(suggestion.id);
  };

  const handleDismiss = async () => {
    await dismissSuggestion.mutateAsync(suggestion.id);
  };

  return (
    <div className="flex items-start justify-between gap-3 p-3 bg-card rounded-md border">
      <div className="flex-1">
        <p className="text-sm font-medium">{suggestion.content}</p>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="secondary" className="text-xs">
            {getCategoryLabel(suggestion.category)}
          </Badge>
          {suggestion.source_chat_id && (
            <span className="text-xs text-muted-foreground">
              From chat "{suggestion.source_chat_name || 'Untitled'}"
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="ghost"
          className="h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
          onClick={handleAccept}
          disabled={acceptSuggestion.isPending}
        >
          <Check className="w-4 h-4 mr-1" />
          Add
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleDismiss}
          disabled={dismissSuggestion.isPending}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function getCategoryLabel(category: string): string {
  // Same as before...
}
```

**React Query Hooks:**
```typescript
// lib/memory/queries.ts (add to existing file)

export function useMemorySuggestions() {
  return useQuery({
    queryKey: ['memory-suggestions'],
    queryFn: async () => {
      const response = await fetch('/api/memory/suggestions');
      if (!response.ok) throw new Error('Failed to fetch suggestions');
      return response.json();
    },
  });
}

export function useAcceptSuggestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (suggestionId: string) => {
      const response = await fetch(`/api/memory/suggestions/${suggestionId}/accept`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to accept suggestion');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
      queryClient.invalidateQueries({ queryKey: ['memory-suggestions'] });
      toast.success('Suggestion added to memories');
    },
  });
}

export function useDismissSuggestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (suggestionId: string) => {
      const response = await fetch(`/api/memory/suggestions/${suggestionId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to dismiss suggestion');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memory-suggestions'] });
      toast.success('Suggestion dismissed');
    },
  });
}
```

**API Routes:**
```typescript
// app/api/memory/suggestions/route.ts

import { NextResponse } from 'next/server';
import { supabase, DEFAULT_USER_ID } from '@/lib/db/client';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('memory_suggestions')
      .select('*')
      .eq('user_id', DEFAULT_USER_ID)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('GET /api/memory/suggestions error:', error);
    return NextResponse.json({ error: 'Failed to fetch suggestions' }, { status: 500 });
  }
}

// app/api/memory/suggestions/[id]/accept/route.ts

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 1. Get suggestion
    const { data: suggestion, error: fetchError } = await supabase
      .from('memory_suggestions')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', DEFAULT_USER_ID)
      .single();

    if (fetchError || !suggestion) {
      return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 });
    }

    // 2. Create memory from suggestion
    const { data: memory, error: createError } = await supabase
      .from('memory_entries')
      .insert({
        user_id: DEFAULT_USER_ID,
        category: suggestion.category,
        subcategory: suggestion.subcategory,
        content: suggestion.content,
        summary: suggestion.summary,
        confidence: suggestion.confidence,
        source_type: 'suggested',
        source_chat_ids: suggestion.source_chat_id ? [suggestion.source_chat_id] : [],
        source_project_ids: [],
        source_message_count: 1,
        time_period: suggestion.time_period,
        relevance_score: 1.0,
        content_hash: generateContentHash(suggestion.content),
      })
      .select()
      .single();

    if (createError) throw createError;

    // 3. Delete suggestion
    await supabase
      .from('memory_suggestions')
      .delete()
      .eq('id', params.id);

    return NextResponse.json(memory);
  } catch (error) {
    console.error('POST /api/memory/suggestions/[id]/accept error:', error);
    return NextResponse.json({ error: 'Failed to accept suggestion' }, { status: 500 });
  }
}

// app/api/memory/suggestions/[id]/route.ts

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await supabase
      .from('memory_suggestions')
      .delete()
      .eq('id', params.id)
      .eq('user_id', DEFAULT_USER_ID);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/memory/suggestions/[id] error:', error);
    return NextResponse.json({ error: 'Failed to dismiss suggestion' }, { status: 500 });
  }
}
```

**Database Migration (if table doesn't exist):**
```sql
-- Add to existing migration or create new one

CREATE TABLE IF NOT EXISTS memory_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  subcategory TEXT,
  content TEXT NOT NULL,
  summary TEXT,
  confidence FLOAT NOT NULL DEFAULT 0.8,
  source_chat_id UUID REFERENCES chats(id),
  source_chat_name TEXT,
  time_period TEXT DEFAULT 'current',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_memory_suggestions_user_id ON memory_suggestions(user_id, status);
```

**Testing:**
- Manually insert test suggestion into database
- Page loads → Suggestion card appears
- Click "Add" → Memory created, suggestion removed
- Click "Dismiss" → Suggestion removed
- No suggestions → Card doesn't render

**Definition of Done:**
- [ ] Suggestions card appears when suggestions exist
- [ ] "Add to [Category]" button creates memory
- [ ] "Dismiss" button removes suggestion
- [ ] Card disappears when all suggestions handled
- [ ] Real-time updates via React Query
- [ ] Source chat link functional (if applicable)

---

### Task M3-7: Settings Page (2 hours)
**Files:**
- `components/memory/memory-settings-modal.tsx`
- `app/api/memory/settings/route.ts`

**What to build:**
Settings modal for controlling auto-extraction, privacy, and token budget.

**Component:**
```typescript
// components/memory/memory-settings-modal.tsx

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useMemorySettings, useUpdateMemorySettings, useClearAllMemories } from '@/lib/memory/queries';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useState } from 'react';

const settingsSchema = z.object({
  auto_extraction_enabled: z.boolean(),
  extraction_frequency: z.enum(['realtime', 'daily', 'weekly', 'manual']),
  enabled_categories: z.array(z.string()),
  token_budget: z.number().min(100).max(2000),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

interface MemorySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MemorySettingsModal({ isOpen, onClose }: MemorySettingsModalProps) {
  const { data: settings, isLoading } = useMemorySettings();
  const updateSettings = useUpdateMemorySettings();
  const [showClearDialog, setShowClearDialog] = useState(false);

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: settings || {
      auto_extraction_enabled: false,
      extraction_frequency: 'realtime',
      enabled_categories: [
        'work_context',
        'personal_context',
        'top_of_mind',
        'brief_history',
        'long_term_background',
        'other_instructions',
      ],
      token_budget: 500,
    },
  });

  const onSubmit = async (data: SettingsFormData) => {
    await updateSettings.mutateAsync(data);
    onClose();
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <p>Loading settings...</p>
        </DialogContent>
      </Dialog>
    );
  }

  const categories = [
    { id: 'work_context', label: 'Work Context' },
    { id: 'personal_context', label: 'Personal Context' },
    { id: 'top_of_mind', label: 'Top of Mind' },
    { id: 'brief_history', label: 'Brief History' },
    { id: 'long_term_background', label: 'Long-Term Background' },
    { id: 'other_instructions', label: 'Other Instructions' },
  ];

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Memory Settings</DialogTitle>
            <DialogDescription>
              Control how Bobo extracts and uses memories about you
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Automatic Extraction */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-extraction" className="text-base font-semibold">
                    Automatic Memory Extraction
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically extract memories from your conversations
                  </p>
                </div>
                <Switch
                  id="auto-extraction"
                  checked={form.watch('auto_extraction_enabled')}
                  onCheckedChange={(checked) => form.setValue('auto_extraction_enabled', checked)}
                />
              </div>

              {form.watch('auto_extraction_enabled') && (
                <div>
                  <Label htmlFor="frequency">Extraction Frequency</Label>
                  <Select
                    value={form.watch('extraction_frequency')}
                    onValueChange={(value: any) => form.setValue('extraction_frequency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="realtime">After every chat (recommended)</SelectItem>
                      <SelectItem value="daily">Daily batch processing</SelectItem>
                      <SelectItem value="weekly">Weekly batch processing</SelectItem>
                      <SelectItem value="manual">Manual only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <Separator />

            {/* Privacy Controls */}
            <div className="space-y-4">
              <div>
                <Label className="text-base font-semibold">Privacy Controls</Label>
                <p className="text-sm text-muted-foreground">
                  Choose which categories to include in memory extraction
                </p>
              </div>

              <div className="space-y-2">
                {categories.map(category => (
                  <div key={category.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={category.id}
                      checked={form.watch('enabled_categories').includes(category.id)}
                      onChange={(e) => {
                        const current = form.watch('enabled_categories');
                        if (e.target.checked) {
                          form.setValue('enabled_categories', [...current, category.id]);
                        } else {
                          form.setValue('enabled_categories', current.filter(c => c !== category.id));
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor={category.id} className="text-sm font-normal cursor-pointer">
                      {category.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Token Budget */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="token-budget" className="text-base font-semibold">
                  Token Budget
                </Label>
                <p className="text-sm text-muted-foreground">
                  Maximum tokens to use for memory in AI context (100-2000)
                </p>
              </div>

              <Input
                id="token-budget"
                type="number"
                min={100}
                max={2000}
                {...form.register('token_budget', { valueAsNumber: true })}
              />
              {form.formState.errors.token_budget && (
                <p className="text-sm text-destructive">
                  Token budget must be between 100 and 2000
                </p>
              )}
            </div>

            <Separator />

            {/* Danger Zone */}
            <div className="space-y-4 border border-destructive/50 rounded-lg p-4 bg-destructive/5">
              <div>
                <Label className="text-base font-semibold text-destructive">Danger Zone</Label>
                <p className="text-sm text-muted-foreground">
                  Irreversible actions that affect all your memories
                </p>
              </div>

              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowClearDialog(true)}
              >
                Clear All Extracted Memories
              </Button>
              <p className="text-xs text-muted-foreground">
                This will delete all automatically extracted memories. Your manual profile will be preserved.
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving...' : 'Save Settings'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Clear All Confirmation Dialog */}
      {showClearDialog && (
        <ClearAllConfirmDialog
          isOpen={showClearDialog}
          onClose={() => setShowClearDialog(false)}
        />
      )}
    </>
  );
}

function ClearAllConfirmDialog({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [confirmText, setConfirmText] = useState('');
  const clearAllMemories = useClearAllMemories();

  const handleClear = async () => {
    if (confirmText === 'DELETE') {
      await clearAllMemories.mutateAsync();
      onClose();
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Clear All Extracted Memories?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete all automatically extracted memories.
            <br />
            <br />
            Your manual profile will be preserved.
            <br />
            <br />
            Type <strong>DELETE</strong> to confirm.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Input
          placeholder="Type DELETE to confirm"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
        />

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleClear}
            disabled={confirmText !== 'DELETE'}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Clear All Memories
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

**React Query Hooks:**
```typescript
// lib/memory/queries.ts (add to existing file)

export function useMemorySettings() {
  return useQuery({
    queryKey: ['memory-settings'],
    queryFn: async () => {
      const response = await fetch('/api/memory/settings');
      if (!response.ok) throw new Error('Failed to fetch settings');
      return response.json();
    },
  });
}

export function useUpdateMemorySettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SettingsFormData) => {
      const response = await fetch('/api/memory/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update settings');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memory-settings'] });
      toast.success('Settings saved');
    },
  });
}

export function useClearAllMemories() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/memory/clear-all', {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to clear memories');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
      toast.success(`Deleted ${data.deleted} extracted memories`);
    },
  });
}
```

**API Routes:**
```typescript
// app/api/memory/settings/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabase, DEFAULT_USER_ID } from '@/lib/db/client';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('memory_settings')
      .select('*')
      .eq('user_id', DEFAULT_USER_ID)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows

    // Return default settings if none exist
    const defaultSettings = {
      user_id: DEFAULT_USER_ID,
      auto_extraction_enabled: false,
      extraction_frequency: 'realtime',
      enabled_categories: [
        'work_context', 'personal_context', 'top_of_mind',
        'brief_history', 'long_term_background', 'other_instructions'
      ],
      token_budget: 500,
    };

    return NextResponse.json(data || defaultSettings);
  } catch (error) {
    console.error('GET /api/memory/settings error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const updates = await req.json();

    const { data, error } = await supabase
      .from('memory_settings')
      .upsert({
        user_id: DEFAULT_USER_ID,
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error('PATCH /api/memory/settings error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}

// app/api/memory/clear-all/route.ts

export async function DELETE() {
  try {
    const { data, error } = await supabase
      .from('memory_entries')
      .delete()
      .eq('user_id', DEFAULT_USER_ID)
      .eq('source_type', 'extracted') // Only delete extracted, not manual
      .select();

    if (error) throw error;

    return NextResponse.json({
      deleted: data.length,
      message: `Deleted ${data.length} extracted memories`,
    });
  } catch (error) {
    console.error('DELETE /api/memory/clear-all error:', error);
    return NextResponse.json({ error: 'Failed to clear memories' }, { status: 500 });
  }
}
```

**Testing:**
- Click "⚙ Settings" → Modal opens
- Toggle auto-extraction → State changes
- Change frequency → Updates
- Uncheck categories → Updates
- Change token budget → Validates range
- Click "Clear All" → Confirmation dialog appears
- Type "DELETE" → Button enables
- Confirm → Extracted memories deleted, manual profile preserved

**Definition of Done:**
- [ ] Settings modal opens from header button
- [ ] All settings fields functional (toggle, dropdown, checkboxes)
- [ ] Settings persist to database
- [ ] Settings load on page refresh
- [ ] Token budget validation (100-2000 range)
- [ ] "Clear All" requires "DELETE" confirmation
- [ ] Only extracted memories deleted (manual profile preserved)

---

### Task M3-25: Privacy Controls (integrated into M3-7)

This task is largely covered by the settings modal above. The main deliverable is ensuring the privacy controls actually work:

**Implementation Notes:**
1. When `enabled_categories` is updated, the extraction pipeline should respect it
2. Update `lib/memory/extractor.ts` to check settings before extracting:

```typescript
// lib/memory/extractor.ts (update existing file)

export async function extractMemoriesFromChat(chatId: string): Promise<MemoryEntry[]> {
  try {
    // 1. Get user settings
    const settings = await getUserMemorySettings();
    if (!settings?.auto_extraction_enabled) {
      return [];
    }

    // 2. Fetch and extract (existing code)
    const messages = await getMessages(chatId);
    const extracted = await callGPT4oMini(messages);

    // 3. Filter by enabled categories
    const filtered = extracted.filter(fact =>
      settings.enabled_categories.includes(fact.category)
    );

    // 4. Continue with deduplication and storage
    const stored = await deduplicateFacts(filtered, chatId);
    return stored;
  } catch (error) {
    console.error('Memory extraction failed:', error);
    return [];
  }
}
```

**Testing:**
- Disable a category (e.g., "Personal Context") in settings
- Start new chat and mention personal info
- Verify extraction skips that category
- Re-enable category → Extraction resumes

**Definition of Done:**
- [ ] Per-category toggles work in settings
- [ ] Disabled categories don't extract new memories
- [ ] "Clear All Memories" deletes only extracted (not manual)
- [ ] Confirmation dialog shows count
- [ ] Success toast after clearing
- [ ] Manual profile preserved after clear

---

## 🎬 Testing Strategy

### Unit Tests (Optional but Recommended)
```typescript
// __tests__/memory/memory-card.test.tsx

import { render, screen } from '@testing-library/react';
import { MemoryCard } from '@/components/memory/memory-card';

describe('MemoryCard', () => {
  it('renders memory content', () => {
    const memory = {
      id: '1',
      content: 'Software engineer at Google',
      confidence: 0.95,
      // ... other fields
    };

    render(<MemoryCard memory={memory} />);
    expect(screen.getByText('Software engineer at Google')).toBeInTheDocument();
  });

  it('shows confidence badge', () => {
    // ... test confidence badge rendering
  });

  it('shows action buttons on hover', () => {
    // ... test hover state
  });
});
```

### Manual Testing Checklist
```
[ ] Page Load
    [ ] Navigate to /memory → Page loads in < 2s
    [ ] All 6 sections render
    [ ] Summary stats accurate

[ ] Expand/Collapse
    [ ] Click section header → Smooth animation
    [ ] State persists after page refresh

[ ] Add Memory
    [ ] Click "+ Add Memory" → Modal opens
    [ ] Fill form → Validates correctly
    [ ] Submit → Memory appears
    [ ] Toast notification shown

[ ] Edit Memory
    [ ] Click "Edit" → Modal pre-fills
    [ ] Change content → Updates
    [ ] Toast notification shown

[ ] Delete Memory
    [ ] Click "Delete" → Confirmation dialog
    [ ] Confirm → Memory removed
    [ ] Toast notification shown

[ ] Search
    [ ] Type in search bar → Filters results
    [ ] Clear search → Shows all

[ ] Suggestions
    [ ] Create test suggestion → Card appears
    [ ] Click "Add" → Memory created
    [ ] Click "Dismiss" → Suggestion removed

[ ] Settings
    [ ] Click "Settings" → Modal opens
    [ ] Toggle auto-extraction → Saves
    [ ] Change frequency → Saves
    [ ] Uncheck category → Saves
    [ ] Click "Clear All" → Requires "DELETE"
    [ ] Confirm → Extracted memories deleted

[ ] Responsive
    [ ] Resize to mobile → Layout adapts
    [ ] All interactions work on mobile

[ ] Accessibility
    [ ] Tab navigation works
    [ ] Screen reader announces elements
    [ ] Color contrast passes WCAG 2.1 AA
```

---

## 🚀 Deployment Checklist

Before marking sprint as complete:

- [ ] All 6 tasks completed
- [ ] Build passes (`npm run build`)
- [ ] No TypeScript errors
- [ ] No console errors on page load
- [ ] Page loads in < 2 seconds with 100+ memories
- [ ] All CRUD operations work
- [ ] Settings persist
- [ ] Responsive design tested
- [ ] Accessibility audit passes
- [ ] Demo script executed successfully
- [ ] Retrospective filled out
- [ ] Test report created

---

## 📚 Key Resources

**Required Reading:**
1. [MEMORY_PAGE_UI_SPEC.md](../../specs/MEMORY_PAGE_UI_SPEC.md) (992 lines) - Complete UI specification
2. [sprint-m3-03.md](./sprint-m3-03.md) - Sprint plan with demo script

**Reference Docs:**
- [shadcn/ui Documentation](https://ui.shadcn.com/) - Component library
- [React Query Documentation](https://tanstack.com/query/latest) - Data fetching
- [React Hook Form](https://react-hook-form.com/) - Form handling
- [Zod](https://zod.dev/) - Schema validation

**M3-02 Backend Reference:**
- `lib/memory/extractor.ts` - How extraction works
- `lib/db/queries.ts` - Database query functions
- `app/api/memory/extract/route.ts` - API endpoint example

---

## 💡 Tips & Common Pitfalls

### Tips
1. **Use shadcn/ui components** - They're pre-styled and accessible
2. **React Query optimistic updates** - Make UI feel instant
3. **localStorage for UI state** - Persist section expand/collapse
4. **Toast notifications** - Always provide user feedback
5. **Form validation** - Use Zod schemas for type safety
6. **Progressive enhancement** - Build mobile-first, then desktop

### Common Pitfalls
1. **Don't fetch data in components** - Use React Query hooks
2. **Don't forget error handling** - All API calls can fail
3. **Don't hardcode user_id** - Use DEFAULT_USER_ID constant
4. **Don't skip accessibility** - Add ARIA labels
5. **Don't forget loading states** - Show spinners/skeletons
6. **Don't nest modals** - Close parent before opening child

---

## 🎯 Success Criteria Summary

Your sprint is complete when:

✅ `/memory` page loads in < 2 seconds with 100+ memories
✅ All 6 category sections expand/collapse smoothly
✅ Users can add, edit, delete memories with toast feedback
✅ Memory suggestions appear and can be accepted/dismissed
✅ Settings modal controls auto-extraction and privacy
✅ Responsive design works on desktop (1920px) and mobile (375px)
✅ Accessibility audit passes WCAG 2.1 AA
✅ No console errors or TypeScript warnings
✅ Build passes (`npm run build`)
✅ Demo script executes successfully

---

**Good luck! 🚀**

If you get blocked, refer to:
1. This handover document
2. MEMORY_PAGE_UI_SPEC.md (complete UI spec)
3. M3-02 test report (backend reference)
4. Sprint plan (sprint-m3-03.md)

**Remember:** Focus on user experience. This UI should feel delightful to use!

---

**Document Created:** December 7, 2025
**Sprint Start:** December 8, 2025
**Sprint Owner:** Sachee Perera (CTO)
