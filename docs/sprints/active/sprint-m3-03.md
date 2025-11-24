# Sprint M3-03: Claude-Style Memory UI

**Sprint Duration:** December 8-14, 2025 (Week 3 of 4)
**Milestone:** M3 - User Profile & Bio Memory
**Sprint Goal:** Build the `/memory` page with hierarchical UI, edit/delete capabilities, and privacy controls
**Team Capacity:** 15 hours

---

## 🎯 Sprint Goal

Create a beautiful, user-friendly memory management interface inspired by Claude's hierarchical memory system. Users should be able to view all their memories organized into collapsible sections (Work Context, Personal Context, Top of Mind, Brief History), edit or delete individual memories, accept suggested memories, and control privacy settings. This sprint focuses on giving users complete transparency and control over what the AI knows about them.

### Success Criteria
- [ ] `/memory` page accessible from main navigation
- [ ] All 6 memory categories displayed in hierarchical sections
- [ ] Users can expand/collapse each section
- [ ] Users can add, edit, and delete memories
- [ ] Memory suggestions appear and can be accepted/dismissed
- [ ] Settings modal controls auto-extraction and privacy
- [ ] Responsive design works on desktop and mobile
- [ ] Page loads in < 2 seconds with 100+ memories

---

## 📋 Sprint Backlog

| ID | Task | Estimate | Status | Actual | Notes |
|----|------|----------|--------|--------|-------|
| M3-5 | Memory management page (`/memory`) with hierarchical UI | 4h | ⏳ | - | Main page component + routing |
| M3-23 | Collapsible sections: Work Context, Personal Context, Top of Mind, Brief History | 3h | ⏳ | - | Section components + animations |
| M3-6 | Edit/delete specific memory entries | 2h | ⏳ | - | Modal + API integration |
| M3-24 | Memory suggestions UI ("We think you might be...") | 2h | ⏳ | - | Suggestions card component |
| M3-7 | Settings page: toggle auto-memory, set extraction frequency | 2h | ⏳ | - | Settings modal + API |
| M3-25 | Privacy controls (per-category toggle, clear all) | 2h | ⏳ | - | Privacy section in settings |

**Status Legend:**
- ⏳ Pending - Not started
- 🚧 In Progress - Currently working
- ✅ Done - Completed and verified
- 🚫 Blocked - Cannot proceed
- 📝 Deferred - Moved to future sprint

**Total Estimated:** 15 hours
**Total Actual:** - hours
**Variance:** -

---

## 📅 Daily Progress Log

### Day 1 - Dec 8, 2025
**Hours Worked:**
**Completed:**

**In Progress:**

**Blockers:**

**Notes:**

---

### Day 2 - Dec 9, 2025
**Hours Worked:**
**Completed:**

**In Progress:**

**Blockers:**

**Notes:**

---

### Day 3 - Dec 10, 2025
**Hours Worked:**
**Completed:**

**In Progress:**

**Blockers:**

**Notes:**

---

### Day 4 - Dec 11, 2025
**Hours Worked:**
**Completed:**

**In Progress:**

**Blockers:**

**Notes:**

---

### Day 5 - Dec 12, 2025
**Hours Worked:**
**Completed:**

**In Progress:**

**Blockers:**

**Notes:**

---

### Day 6 - Dec 13, 2025
**Hours Worked:**
**Completed:**

**In Progress:**

**Blockers:**

**Notes:**

---

### Day 7 - Dec 14, 2025 (Sprint End)
**Hours Worked:**
**Completed:**

**Sprint Demo Prep:**

**Retrospective Notes:**

---

## 🚧 Blockers & Risks

| Blocker | Impact | Status | Resolution |
|---------|--------|--------|------------|
| - | - | - | - |

**Potential Risks:**
- UI complexity may require more time than estimated (mitigation: use shadcn/ui components)
- Performance with 100+ memories (mitigation: pagination, lazy loading)
- Mobile responsive design edge cases (mitigation: test on multiple devices)

---

## 📦 Deliverables

### Code Artifacts
- [ ] Main page: `/app/memory/page.tsx`
- [ ] Memory header: `/components/memory/memory-header.tsx`
- [ ] Memory summary: `/components/memory/memory-summary.tsx`
- [ ] Memory section: `/components/memory/memory-section.tsx`
- [ ] Memory card: `/components/memory/memory-card.tsx`
- [ ] Memory settings modal: `/components/memory/memory-settings-modal.tsx`
- [ ] Add/Edit memory modal: `/components/memory/add-memory-modal.tsx`
- [ ] Provenance modal: `/components/memory/provenance-modal.tsx`
- [ ] Memory suggestions: `/components/memory/memory-suggestions.tsx`
- [ ] API routes:
  - [ ] GET/POST/PATCH/DELETE `/api/memory/entries`
  - [ ] GET/PATCH `/api/memory/settings`
  - [ ] GET/POST/DELETE `/api/memory/suggestions`
  - [ ] POST `/api/memory/export`
- [ ] React Query hooks: `/lib/memory/queries.ts`
- [ ] API client: `/lib/memory/api.ts`
- [ ] Helper functions: `/lib/memory/utils.ts`

### UI Component Structure
```
app/
  memory/
    page.tsx                    // Main memory page

components/
  memory/
    memory-header.tsx           // Header with search + quick actions
    memory-summary.tsx          // Summary stats (count, tokens, last updated)
    memory-section.tsx          // Collapsible section wrapper
    memory-card.tsx             // Individual memory card
    memory-settings-modal.tsx   // Settings modal
    add-memory-modal.tsx        // Add/edit modal
    provenance-modal.tsx        // Provenance modal (source chats)
    memory-suggestions.tsx      // Suggestions card
    empty-state.tsx             // Empty state component

lib/
  memory/
    queries.ts                  // React Query hooks
    api.ts                      // API client functions
    utils.ts                    // Helper functions (token calc, etc.)
    types.ts                    // TypeScript types
```

### Documentation
- [ ] MEMORY_PAGE_UI_SPEC.md (✅ Already created)
- [ ] API documentation for memory endpoints
- [ ] Component storybook (optional)
- [ ] Updated PRODUCT_BACKLOG.md with M3-03 status

### Tests
- [ ] Component tests: Memory card CRUD operations
- [ ] Component tests: Search and filter
- [ ] E2E test: Full memory management flow
- [ ] Accessibility audit (WCAG 2.1 AA)

---

## 🎬 Sprint Demo (Planned for Dec 14)

**Demo Date:** December 14, 2025
**Attendees:** Solo project (self-review)

### Demo Script (Planned)

#### 1. Show Memory Page Overview
- Navigate to `/memory` from sidebar
- Show hierarchical sections (6 categories)
- Show summary stats:
  - Total: 23 memories across 6 categories
  - Token usage: 287 / 500 (57%)
  - Last updated: 2 hours ago

#### 2. Expand and Explore Sections
- Click "Work Context" → expands to show 5 memories
  - "Senior software engineer at Google"
  - "Works on YouTube's recommendation algorithm"
  - "Primary languages: Python, Go, TensorFlow"
  - etc.
- Click "Personal Context" → expands
  - "Lives in San Francisco"
  - "Married with two children"
- Click "Top of Mind" → expands
  - "Currently learning Rust programming language" (with fast decay badge)
  - Last mentioned: 3 days ago (green indicator)
- Click "Brief History" → expands with 3 subcategories
  - Recent Months (4 memories)
  - Earlier (6 memories)
  - Long Term (3 memories)

#### 3. Add New Memory Manually
- Click "+ Add Memory" in Work Context section
- Modal opens with form:
  - Content: "Expert in distributed systems architecture"
  - Confidence: Very High (0.95)
  - Internal Notes: "From recent projects"
- Submit → Memory appears in Work Context section ✓
- Toast notification: "Memory added successfully"

#### 4. Edit Existing Memory
- Hover over memory card → Edit button appears
- Click "✏️ Edit" on "Lives in San Francisco"
- Modal opens with pre-filled content
- Change to: "Lives in San Francisco, California"
- Submit → Memory updated ✓
- Toast notification: "Memory updated"

#### 5. View Memory Provenance
- Click "🔗 Source: 2 chats" on a memory
- Provenance modal opens showing:
  - Memory: "Senior software engineer at Google"
  - Extracted from 2 sources:
    1. Chat: "Planning my portfolio website" (Nov 15, 2025)
       Context: "I work as a full-stack developer at..."
       [View Chat →]
    2. Chat: "Help with React best practices" (Nov 12, 2025)
       Context: "At Google, we use React and TypeScript..."
       [View Chat →]
  - Extraction details:
    - Confidence: 0.95 (Very High)
    - Method: GPT-4o-mini automatic extraction
    - Created: Nov 15, 2025

#### 6. Delete Memory
- Click "🗑️ Delete" on a memory
- Confirmation dialog: "Delete this memory? This cannot be undone."
- Confirm → Memory removed ✓
- Toast notification: "Memory deleted"
- Summary stats update (22 memories, token count decreases)

#### 7. Memory Suggestions
- Show floating "Memory Suggestions" card at top of page
- Display 2 pending suggestions:
  1. "You might be located in San Francisco"
     From: Chat "Local restaurants"
     [✓ Add to Personal Context] [✕ Dismiss]
  2. "You're learning Rust"
     From: Chat "Help with ownership concept"
     [✓ Add to Top of Mind] [✕ Dismiss]
- Click "✓ Add to Personal Context" on first suggestion
- Suggestion removed, memory added to Personal Context ✓

#### 8. Search Memories
- Type "rust" in search bar
- Results: "1 result in 1 category"
- Top of Mind section auto-expands
- Matching text highlighted: "<mark>Rust</mark> programming language"
- Clear search → all sections visible again

#### 9. Memory Settings
- Click "⚙ Settings" button in header
- Modal opens with settings:
  - Automatic Memory Extraction: [Toggle] Currently: Disabled
  - Extraction Frequency: [Dropdown] After every chat
  - Privacy Controls:
    - Categories to Include: [All 6 checked]
  - Token Budget: [Input] 500 (Current: 287)
  - Danger Zone: [Clear All Memories] button
- Enable auto-extraction → Toggle ON
- Save settings ✓
- Toast notification: "Settings saved"

#### 10. Export Memories
- Click "📥 Export" button in header
- Download starts: `bobo-memories-2025-12-14.json`
- Open file → verify JSON structure with all memories

#### 11. Responsive Design Test
- Resize browser to mobile width (375px)
- Verify:
  - Sidebar collapses to hamburger menu ✓
  - Memory cards stack vertically ✓
  - Search bar responsive ✓
  - Modals adapt to small screen ✓
  - Floating action button for "+ Add Memory" ✓

#### 12. Accessibility Test
- Navigate using keyboard only (Tab, Enter, Escape)
- Verify all interactive elements are accessible ✓
- Test with screen reader (NVDA/VoiceOver)
- Check color contrast (4.5:1 minimum) ✓
- Verify ARIA labels on all components ✓

### Success Metrics for Demo
- Page loads in < 2 seconds with 23 memories
- All CRUD operations work smoothly
- Search filters correctly
- Settings persist after page refresh
- Responsive design works on mobile
- Accessibility audit passes (WCAG 2.1 AA)
- No console errors

---

## 🔄 Sprint Retrospective (To be filled at end of sprint)

### What Went Well ✅
-

### What Didn't Go Well ❌
-

### What We Learned 📚
-

### Action Items for Next Sprint 🎯
- [ ]

---

## 📊 Sprint Metrics

| Metric | Target | Actual | Variance |
|--------|--------|--------|----------|
| Story Points Completed | 6 | - | - |
| Hours Estimated | 15h | - | - |
| Tasks Completed | 6 | - | - |
| Bugs Found | 0 | - | - |
| Tests Added | 4 | - | - |
| Accessibility Score | WCAG 2.1 AA | - | - |
| Page Load Time | < 2s | - | - |

**Velocity:** (to be calculated)
**Completion Rate:** (to be calculated)

---

## 🔗 Related Links

- **Product Backlog:** [PRODUCT_BACKLOG.md](../../PRODUCT_BACKLOG.md#33-phase-3-claude-style-memory-ui-planned)
- **Previous Sprint:** [Sprint M3-02](./sprint-m3-02.md)
- **Next Sprint:** Sprint M3-04 (Advanced Memory Features) - Planned for Dec 15-21
- **Milestone Overview:** M3 - User Profile & Bio Memory
- **UI Spec:** [MEMORY_PAGE_UI_SPEC.md](../../specs/MEMORY_PAGE_UI_SPEC.md)
- **Architecture Doc:** [memory-schema.md](../../memory-schema.md)
- **Sprint Index:** [Sprint README](../README.md)

---

## 📌 Implementation Notes

### M3-5: Memory Page Architecture

**Route:** `/memory`
**Layout:** Full-page with sidebar navigation

**Page Component Structure:**
```tsx
// app/memory/page.tsx

export default function MemoryPage() {
  const { data: memories, isLoading } = useMemories();
  const { data: settings } = useMemorySettings();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="container mx-auto p-6">
      <MemoryHeader
        onSearch={setSearchQuery}
        onSettingsClick={() => setShowSettings(true)}
      />

      <MemorySummary
        totalCount={memories?.length}
        tokenUsage={calculateTokenUsage(memories)}
        lastUpdated={getLastUpdated(memories)}
      />

      {suggestions.length > 0 && (
        <MemorySuggestions suggestions={suggestions} />
      )}

      <div className="space-y-4">
        <MemorySection
          category="work_context"
          title="Work Context"
          memories={filterByCategory(memories, 'work_context')}
        />
        <MemorySection
          category="personal_context"
          title="Personal Context"
          memories={filterByCategory(memories, 'personal_context')}
        />
        <MemorySection
          category="top_of_mind"
          title="Top of Mind"
          memories={filterByCategory(memories, 'top_of_mind')}
        />
        <MemorySection
          category="brief_history"
          title="Brief History"
          memories={filterByCategory(memories, 'brief_history')}
          hasSubcategories={true}
        />
        <MemorySection
          category="long_term_background"
          title="Long-Term Background"
          memories={filterByCategory(memories, 'long_term_background')}
        />
        <MemorySection
          category="other_instructions"
          title="Other Instructions"
          memories={filterByCategory(memories, 'other_instructions')}
        />
      </div>
    </div>
  );
}
```

**State Management:** React Query for server state, useState for UI state

**Performance:** Virtualized lists for categories with > 50 memories

---

### M3-23: Collapsible Sections

**Component:** `MemorySection`

**Features:**
- Collapsible header (chevron icon > / ∨)
- Memory count badge
- "+ Add Memory" button
- Smooth animations (200ms ease-in-out)
- Persisted state (localStorage)

**Implementation:**
```tsx
// components/memory/memory-section.tsx

export function MemorySection({
  category,
  title,
  memories,
  hasSubcategories = false
}: MemorySectionProps) {
  const [isExpanded, setIsExpanded] = useLocalStorage(
    `memory-section-${category}`,
    false
  );

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center justify-between p-4 bg-card rounded-lg hover:bg-accent">
          <div className="flex items-center gap-2">
            {isExpanded ? <ChevronDown /> : <ChevronRight />}
            <h2 className="text-xl font-semibold">{title}</h2>
            <Badge variant="secondary">{memories.length} memories</Badge>
          </div>
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              openAddMemoryModal(category);
            }}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Memory
          </Button>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-2 space-y-2 px-4">
        {hasSubcategories ? (
          <BriefHistorySubsections memories={memories} />
        ) : (
          memories.map(memory => (
            <MemoryCard key={memory.id} memory={memory} />
          ))
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
```

**Using shadcn/ui:** `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent`

---

### M3-6: Edit/Delete Memory

**Add Memory Modal:**
```tsx
// components/memory/add-memory-modal.tsx

export function AddMemoryModal({ category, isOpen, onClose }: Props) {
  const form = useForm<MemoryFormData>({
    resolver: zodResolver(memorySchema),
    defaultValues: {
      category,
      content: '',
      confidence: 0.95,
      notes: '',
    },
  });

  const { mutate: createMemory } = useCreateMemory();

  const onSubmit = (data: MemoryFormData) => {
    createMemory(data, {
      onSuccess: () => {
        toast.success('Memory added successfully');
        onClose();
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Memory to {categoryLabels[category]}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Label htmlFor="content">Content *</Label>
          <Textarea
            id="content"
            placeholder="Enter memory content..."
            {...form.register('content')}
          />

          <Label htmlFor="confidence">Confidence Level</Label>
          <Select {...form.register('confidence')}>
            <SelectItem value="0.95">Very High (0.95)</SelectItem>
            <SelectItem value="0.8">High (0.8)</SelectItem>
            <SelectItem value="0.6">Medium (0.6)</SelectItem>
            <SelectItem value="0.4">Low (0.4)</SelectItem>
          </Select>

          <Label htmlFor="notes">Internal Notes (optional)</Label>
          <Textarea
            id="notes"
            placeholder="Optional notes for yourself..."
            {...form.register('notes')}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Add</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

**Delete Confirmation:**
```tsx
// Use shadcn/ui AlertDialog for confirmation

<AlertDialog open={showDeleteDialog}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete Memory?</AlertDialogTitle>
      <AlertDialogDescription>
        Are you sure you want to delete: "{memory.content}"?
        This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete}>
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

### M3-24: Memory Suggestions

**Component:** `MemorySuggestions`

**Features:**
- Floating card at top of page
- Up to 3 pending suggestions
- "Add to [Category]" button
- "Dismiss" button
- Dismisses entire card when all suggestions handled

**API Endpoint:**
```typescript
// /app/api/memory/suggestions/route.ts

export async function GET() {
  // Fetch pending suggestions from database
  const suggestions = await db
    .select()
    .from(memory_suggestions)
    .where(eq(memory_suggestions.user_id, userId))
    .orderBy(desc(memory_suggestions.created_at))
    .limit(3);

  return Response.json(suggestions);
}

export async function POST(req: Request) {
  // Accept a suggestion (convert to memory)
  const { suggestion_id } = await req.json();

  const suggestion = await getSuggestion(suggestion_id);

  // Create memory from suggestion
  await createMemory({
    category: suggestion.category,
    content: suggestion.content,
    confidence: suggestion.confidence,
    source_type: 'suggested',
    source_chat_ids: [suggestion.source_chat_id],
  });

  // Delete suggestion
  await deleteSuggestion(suggestion_id);

  return Response.json({ success: true });
}
```

---

### M3-7: Memory Settings

**Settings Modal Fields:**
1. **Automatic Memory Extraction** - Toggle (default: OFF)
2. **Extraction Frequency** - Dropdown:
   - After every chat (real-time)
   - Daily (batch processing)
   - Weekly (batch processing)
   - Manual only
3. **Privacy Controls** - Per-category checkboxes:
   - ☑ Work Context
   - ☑ Personal Context
   - ☑ Top of Mind
   - ☑ Brief History
   - ☑ Long-Term Background
   - ☑ Other Instructions
4. **Token Budget** - Number input (min: 100, max: 2000, default: 500)
5. **Danger Zone** - "Clear All Memories" button (destructive)

**API Endpoint:**
```typescript
// /app/api/memory/settings/route.ts

export async function GET() {
  const settings = await db
    .select()
    .from(memory_settings)
    .where(eq(memory_settings.user_id, userId))
    .get();

  return Response.json(settings || defaultSettings);
}

export async function PATCH(req: Request) {
  const updates = await req.json();

  const settings = await db
    .update(memory_settings)
    .set(updates)
    .where(eq(memory_settings.user_id, userId))
    .returning();

  return Response.json(settings[0]);
}
```

---

### M3-25: Privacy Controls

**Features:**
1. **Per-Category Toggle** - Disable extraction for specific categories
   - Example: User disables "Personal Context" for work account
2. **Clear All Memories** - Delete all extracted memories (manual profile preserved)
   - Requires typing "DELETE" to confirm
   - Shows count: "This will delete all 23 extracted memories"

**Clear All Implementation:**
```typescript
// /app/api/memory/clear-all/route.ts

export async function DELETE() {
  // Only delete extracted memories, not manual profile
  const deleted = await db
    .delete(memory_entries)
    .where(
      and(
        eq(memory_entries.user_id, userId),
        eq(memory_entries.source_type, 'extracted')
      )
    )
    .returning();

  return Response.json({
    deleted: deleted.length,
    message: `Deleted ${deleted.length} extracted memories`,
  });
}
```

---

## 🎯 Definition of Done for Each Task

### M3-5 (Memory Page) ✅ Done When:
- [ ] `/memory` route accessible from sidebar
- [ ] Page loads in < 2 seconds with 100+ memories
- [ ] All 6 category sections render correctly
- [ ] Summary stats display (count, tokens, last updated)
- [ ] Search bar functional
- [ ] Empty state shown when no memories
- [ ] Responsive design works on mobile
- [ ] No console errors

### M3-23 (Collapsible Sections) ✅ Done When:
- [ ] All 6 sections collapsible (smooth animation)
- [ ] Chevron icon rotates on expand/collapse
- [ ] Section state persisted to localStorage
- [ ] Memory count badge accurate
- [ ] "+ Add Memory" button functional
- [ ] Brief History has 3 nested subcategories
- [ ] Keyboard navigation works (Enter/Space to toggle)

### M3-6 (Edit/Delete) ✅ Done When:
- [ ] Add memory modal opens and submits correctly
- [ ] Edit memory modal pre-fills with existing data
- [ ] Delete confirmation dialog shows before deletion
- [ ] All CRUD operations update UI optimistically
- [ ] Toast notifications appear for all actions
- [ ] Errors handled gracefully with error toasts
- [ ] Form validation works (min length, max length)

### M3-24 (Suggestions) ✅ Done When:
- [ ] Suggestions card appears when suggestions exist
- [ ] "Add to [Category]" button creates memory
- [ ] "Dismiss" button removes suggestion
- [ ] Card disappears when all suggestions handled
- [ ] Real-time updates via React Query
- [ ] Source chat link functional

### M3-7 (Settings) ✅ Done When:
- [ ] Settings modal opens from header button
- [ ] All settings fields functional (toggle, dropdown, checkboxes)
- [ ] Settings persist to database
- [ ] Settings load on page refresh
- [ ] Token budget validation (100-2000 range)
- [ ] "Clear All" requires "DELETE" confirmation

### M3-25 (Privacy Controls) ✅ Done When:
- [ ] Per-category toggles work in settings
- [ ] Disabled categories don't extract new memories
- [ ] "Clear All Memories" deletes only extracted (not manual)
- [ ] Confirmation dialog shows count
- [ ] Success toast after clearing
- [ ] Manual profile preserved after clear

---

## 💡 Open Questions

1. **Search Scope:** Should search also search metadata (source, date)?
   - Decision: Content only for v1, add advanced filters in M3-04
   - Rationale: Keep simple initially

2. **Pagination:** Show all memories or paginate?
   - Decision: Show first 5 per section, "Show more" button
   - Rationale: Better performance, cleaner UI

3. **Real-time Updates:** Should memory page update when extraction happens?
   - Decision: Yes, using React Query polling (30s interval)
   - Alternative: WebSocket (defer to future)

4. **Mobile UX:** Separate mobile view or responsive?
   - Decision: Responsive design (single codebase)
   - Mobile optimizations: Stacked layout, floating FAB

5. **Confidence Badge Colors:** What color scheme?
   - Decision:
     - 0.9-1.0: Green (Very High)
     - 0.7-0.8: Blue (High)
     - 0.5-0.6: Yellow (Medium)
     - < 0.5: Red (Low) - should never appear

---

**Sprint Created:** November 24, 2025
**Sprint Owner:** Sachee Perera (CTO)
**Status:** 📝 Planned - Not Started
**Next Update:** Dec 8, 2025 (Sprint Start)
