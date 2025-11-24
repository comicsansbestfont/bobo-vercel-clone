# Memory Page UI Specification

**Version:** 1.0
**Created:** November 24, 2025
**Status:** Draft
**Owner:** Product / Engineering
**Related:** M3-03 Sprint (Memory UI)

---

## Overview

The `/memory` page is Bobo's central interface for managing user memory - both manually created profile data and automatically extracted facts. Inspired by Claude's hierarchical memory system and Gemini's personal context, this page gives users full transparency and control over what the AI knows about them.

### Goals

1. **Transparency** - Users see exactly what memories the AI has about them
2. **Control** - Users can edit, delete, and manage all memories
3. **Organization** - Hierarchical categories make memories easy to navigate
4. **Trust** - Clear provenance shows where each memory came from
5. **Privacy** - Granular controls for memory collection and usage

---

## Page Architecture

### Route
`/memory` - Top-level route, accessible from main navigation

### Layout
Full-page layout with sidebar navigation (consistent with rest of app)

### Components Hierarchy
```
MemoryPage
├── MemoryHeader
│   ├── PageTitle
│   ├── SearchBar
│   └── QuickActions (Settings, Export, Clear All)
├── MemorySummary
│   ├── TotalMemoriesCount
│   ├── TokenUsageBar
│   └── LastUpdatedTimestamp
├── MemorySections
│   ├── WorkContextSection (collapsible)
│   ├── PersonalContextSection (collapsible)
│   ├── TopOfMindSection (collapsible)
│   ├── BriefHistorySection (collapsible)
│   │   ├── RecentMonthsSubsection
│   │   ├── EarlierSubsection
│   │   └── LongTermSubsection
│   ├── LongTermBackgroundSection (collapsible)
│   └── OtherInstructionsSection (collapsible)
└── MemoryFooter
    ├── PrivacyNote
    └── LearnMoreLink
```

---

## Detailed Component Specifications

### 1. MemoryHeader

**Visual Design:**
```
┌───────────────────────────────────────────────────────────────┐
│ Your Memory                                     [⚙ Settings]  │
│                                                                 │
│ [🔍 Search memories...]              [📥 Export] [🗑️ Clear All] │
└───────────────────────────────────────────────────────────────┘
```

**Elements:**

1. **Page Title** - "Your Memory"
   - Typography: text-3xl font-bold
   - Color: text-foreground

2. **Search Bar**
   - Placeholder: "Search memories..."
   - Icon: 🔍 (Lucide Search)
   - Real-time filtering across all categories
   - Shows count: "5 results" when searching

3. **Quick Actions**
   - **Settings Button** - Opens memory settings modal
   - **Export Button** - Download all memories as JSON/Markdown
   - **Clear All Button** - Destructive action with confirmation dialog

**Behavior:**
- Search debounced (300ms delay)
- Filters highlight matching text in memory cards
- Empty state shown when no results

---

### 2. MemorySummary

**Visual Design:**
```
┌───────────────────────────────────────────────────────────────┐
│ 📊 Summary                                                     │
│                                                                 │
│ Total Memories: 23 across 6 categories                        │
│ Token Usage: 287 / 500 (57%)                                   │
│ ████████████████░░░░░░░░░░░░░░░                               │
│                                                                 │
│ Last updated: 2 hours ago • Next consolidation: 5 days        │
└───────────────────────────────────────────────────────────────┘
```

**Elements:**

1. **Total Memories Count**
   - Format: "23 across 6 categories"
   - Updates in real-time as memories are added/removed

2. **Token Usage Bar**
   - Visual progress bar (shadcn/ui Progress component)
   - Color-coded:
     - Green (< 70%): Safe
     - Yellow (70-90%): Warning
     - Red (> 90%): Critical
   - Shows: current/max (percentage)

3. **Timestamps**
   - Last updated: Relative time (e.g., "2 hours ago")
   - Next consolidation: Days remaining (e.g., "5 days")

**Data Source:**
- Aggregate count from `memory_entries` table
- Token count calculated from all memory content
- Last updated from most recent `updated_at` timestamp

---

### 3. MemorySections

Each section follows the same pattern with hierarchical organization.

#### Section Template

**Visual Design (Collapsed):**
```
┌───────────────────────────────────────────────────────────────┐
│ > Work Context (5 memories)                    [+ Add Memory] │
└───────────────────────────────────────────────────────────────┘
```

**Visual Design (Expanded):**
```
┌───────────────────────────────────────────────────────────────┐
│ ∨ Work Context (5 memories)                    [+ Add Memory] │
├───────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Current role: Full-stack developer at TechCorp           │ │
│  │                                                            │ │
│  │ 📅 Added: Nov 15, 2025                                    │ │
│  │ 📊 Confidence: High (0.95)                                │ │
│  │ 🔗 Source: 2 chats                          [✏️ Edit] [🗑️] │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Expertise: React, TypeScript, Next.js, PostgreSQL        │ │
│  │                                                            │ │
│  │ 📅 Added: Nov 12, 2025                                    │ │
│  │ 📊 Confidence: Very High (0.98)                           │ │
│  │ 🔗 Source: Manual profile                   [✏️ Edit] [🗑️] │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
│  [Show 3 more memories...]                                     │
│                                                                 │
└───────────────────────────────────────────────────────────────┘
```

**Section States:**
1. **Collapsed** (default) - Shows only header with count
2. **Expanded** - Shows all memory cards in category
3. **Empty** - Special state with "No memories yet" message

**Section Header:**
- Chevron icon (> collapsed, ∨ expanded)
- Category name with memory count
- "Add Memory" button (right-aligned)

**Memory Card Structure:**

Each memory displayed as a card with:

1. **Content** (main text)
   - Font: text-base
   - Max 3 lines before truncation
   - "Read more" link if truncated

2. **Metadata Row**
   - **Added date** - Relative time (e.g., "Nov 15, 2025")
   - **Confidence level** - Badge with color:
     - 0.9-1.0: Green badge "Very High"
     - 0.7-0.8: Yellow badge "High"
     - 0.5-0.6: Orange badge "Medium"
     - < 0.5: Red badge "Low"
   - **Source** - Link to source chat(s) or "Manual profile"

3. **Actions**
   - **Edit** button (✏️) - Opens inline editor or modal
   - **Delete** button (🗑️) - Confirmation dialog

**Pagination:**
- Show first 5 memories per section
- "Show X more memories..." button if > 5
- Lazy loading for performance

---

### 4. Specific Section Implementations

#### 4.1 Work Context Section

**Category:** `work_context`

**Example Memories:**
- Current role: Full-stack developer at TechCorp
- Expertise: React, TypeScript, Next.js, PostgreSQL
- Active projects: Building AI chatbot, migrating to serverless
- Work preferences: Prefer TypeScript, TDD approach, async communication

**Add Memory Flow:**
1. Click "+ Add Memory"
2. Modal opens with:
   - **Content** (required) - Textarea
   - **Confidence** (optional) - Dropdown (Very High, High, Medium, Low)
   - **Notes** (optional) - Internal notes
3. Submit → POST to `/api/memory/entries`

**Edit Memory Flow:**
1. Click "✏️ Edit"
2. Inline editor or modal with pre-filled content
3. Save → PATCH to `/api/memory/entries/[id]`

**Delete Memory Flow:**
1. Click "🗑️ Delete"
2. Confirmation dialog: "Delete this memory? This cannot be undone."
3. Confirm → DELETE to `/api/memory/entries/[id]`

---

#### 4.2 Personal Context Section

**Category:** `personal_context`

**Example Memories:**
- Location: San Francisco, CA
- Family: Married, 2 kids (ages 5 and 8)
- Hobbies: Rock climbing, reading sci-fi
- Background: Grew up in Seattle, studied CS at UW

**Same CRUD flows as Work Context**

---

#### 4.3 Top of Mind Section

**Category:** `top_of_mind`

**Special Features:**
- **Fast Decay Warning** - Badge: "🔥 Decays quickly"
- **Relevance Indicator** - Shows days since last mentioned
  - Example: "Last mentioned: 3 days ago"
  - Color: Green (< 7 days), Yellow (7-14 days), Red (> 14 days)

**Example Memories:**
- Learning Rust (started 2 weeks ago)
- Building AI chatbot for personal project
- Planning vacation to Japan in March

**Auto-Pruning:**
- Memories automatically archived after 30 days of inactivity
- User can manually "pin" to prevent pruning

---

#### 4.4 Brief History Section (Hierarchical)

**Category:** `brief_history`

**Special Structure:** 3-level hierarchy with subcategories

**Visual Design (Expanded):**
```
┌───────────────────────────────────────────────────────────────┐
│ ∨ Brief History (13 memories)                  [+ Add Memory] │
├───────────────────────────────────────────────────────────────┤
│                                                                 │
│  > Recent Months (4 memories)                                  │
│                                                                 │
│  > Earlier (6 memories)                                        │
│                                                                 │
│  > Long Term (3 memories)                                      │
│                                                                 │
└───────────────────────────────────────────────────────────────┘
```

**Subcategories:**
1. **Recent Months** - Last 3 months
2. **Earlier** - 3-12 months ago
3. **Long Term** - > 1 year ago

**Auto-Categorization:**
- Based on `time_period` field in database
- Algorithm:
  ```javascript
  const daysSince = (new Date() - memory.last_mentioned) / (1000 * 60 * 60 * 24);

  if (daysSince < 90) return 'recent_months';
  else if (daysSince < 365) return 'earlier';
  else return 'long_term';
  ```

**Example Memories:**

**Recent Months:**
- Completed bootcamp for advanced React patterns (Oct 2025)
- Started new job at TechCorp (Sep 2025)

**Earlier:**
- Built e-commerce site for local business (Feb 2025)
- Learned Docker and Kubernetes (Jan 2025)

**Long Term:**
- Graduated from University of Washington (2015)
- First software job at StartupXYZ (2016)

---

#### 4.5 Long-Term Background Section

**Category:** `long_term_background`

**Special Features:**
- **Archival Badge** - "📚 Permanent"
- **No Decay** - These memories never decay

**Example Memories:**
- Education: Bachelor's in Computer Science, UW (2015)
- Career: 10 years in software development
- Languages: English (native), Spanish (conversational)

---

#### 4.6 Other Instructions Section

**Category:** `other_instructions`

**Example Memories:**
- Communication style: Explain like I'm 5, avoid jargon
- Preferences: Use TypeScript examples, avoid Python
- Methodology: Prefer functional programming over OOP

---

### 5. Memory Settings Modal

**Trigger:** Click "⚙ Settings" button in header

**Visual Design:**
```
┌───────────────────────────────────────────────────────────────┐
│ Memory Settings                                          [✕]  │
├───────────────────────────────────────────────────────────────┤
│                                                                 │
│ Automatic Memory Extraction                                    │
│ ○ Enabled   ● Disabled (Default)                              │
│                                                                 │
│ When enabled, Bobo will automatically extract facts from      │
│ your conversations to build a personalized memory.            │
│                                                                 │
│ ────────────────────────────────────────────────────────────  │
│                                                                 │
│ Extraction Frequency                                           │
│ [▼ After every chat      ]                                    │
│                                                                 │
│ Options:                                                       │
│ - After every chat (real-time)                                │
│ - Daily (batch processing)                                     │
│ - Weekly (minimal processing)                                  │
│ - Manual only (no automation)                                  │
│                                                                 │
│ ────────────────────────────────────────────────────────────  │
│                                                                 │
│ Privacy Controls                                               │
│                                                                 │
│ Categories to Include:                                         │
│ ☑ Work Context                                                │
│ ☑ Personal Context                                            │
│ ☑ Top of Mind                                                 │
│ ☑ Brief History                                               │
│ ☑ Long-Term Background                                        │
│ ☑ Other Instructions                                          │
│                                                                 │
│ ────────────────────────────────────────────────────────────  │
│                                                                 │
│ Token Budget                                                   │
│ Maximum tokens for memory: [500  ] (Current: 287)             │
│                                                                 │
│ ────────────────────────────────────────────────────────────  │
│                                                                 │
│ Danger Zone                                                    │
│ [Clear All Memories] - Delete all extracted memories          │
│ (Manual profile is preserved)                                  │
│                                                                 │
│ ────────────────────────────────────────────────────────────  │
│                                                                 │
│                                          [Cancel]  [Save]      │
└───────────────────────────────────────────────────────────────┘
```

**Settings:**

1. **Automatic Memory Extraction**
   - Toggle: Enabled / Disabled
   - Default: **Disabled** (privacy-first)
   - When disabled: Only manual profile is used

2. **Extraction Frequency**
   - Dropdown options:
     - After every chat (real-time)
     - Daily (batch processing at midnight)
     - Weekly (batch processing on Sundays)
     - Manual only
   - Default: **Weekly**

3. **Privacy Controls**
   - Per-category toggles
   - All enabled by default
   - Use case: User might disable "Personal Context" for work account

4. **Token Budget**
   - Number input (min: 100, max: 2000)
   - Default: **500**
   - Shows current usage

5. **Danger Zone**
   - "Clear All Memories" button (destructive)
   - Confirmation dialog required
   - Only clears extracted memories, not manual profile

**API Endpoints:**
- GET `/api/memory/settings` - Fetch user settings
- PATCH `/api/memory/settings` - Update settings

---

### 6. Add/Edit Memory Modal

**Trigger:**
- Click "+ Add Memory" in section header
- Click "✏️ Edit" on memory card

**Visual Design (Add Mode):**
```
┌───────────────────────────────────────────────────────────────┐
│ Add Memory to Work Context                              [✕]  │
├───────────────────────────────────────────────────────────────┤
│                                                                 │
│ Content *                                                      │
│ ┌─────────────────────────────────────────────────────────┐  │
│ │ Expert in React, TypeScript, and Next.js                │  │
│ │                                                           │  │
│ │                                                           │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│ Confidence Level                                               │
│ [▼ Very High (0.9-1.0)    ]                                   │
│                                                                 │
│ Internal Notes (optional)                                      │
│ ┌─────────────────────────────────────────────────────────┐  │
│ │ From recent work projects and portfolio                 │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│                                          [Cancel]  [Add]       │
└───────────────────────────────────────────────────────────────┘
```

**Fields:**

1. **Content** (required)
   - Textarea
   - Min: 10 characters
   - Max: 500 characters
   - Placeholder: "Enter memory content..."

2. **Confidence Level** (optional)
   - Dropdown:
     - Very High (0.95)
     - High (0.8)
     - Medium (0.6)
     - Low (0.4)
   - Default: Very High (manual entries are trusted)

3. **Internal Notes** (optional)
   - Textarea for user's own notes
   - Not shown to AI
   - Placeholder: "Optional notes for yourself..."

**Validation:**
- Content is required
- Content must be at least 10 characters
- Show error states inline

**API Calls:**
- **Add:** POST `/api/memory/entries`
- **Edit:** PATCH `/api/memory/entries/[id]`

---

### 7. Memory Provenance Modal

**Trigger:** Click "🔗 Source: 2 chats" link on memory card

**Visual Design:**
```
┌───────────────────────────────────────────────────────────────┐
│ Memory Provenance                                        [✕]  │
├───────────────────────────────────────────────────────────────┤
│                                                                 │
│ Memory: "Current role: Full-stack developer at TechCorp"     │
│                                                                 │
│ ────────────────────────────────────────────────────────────  │
│                                                                 │
│ Extracted from 2 sources:                                      │
│                                                                 │
│ 1. Chat: "Planning my portfolio website"                      │
│    Date: Nov 15, 2025 at 3:42 PM                              │
│    Context: "I work as a full-stack developer at..."          │
│    [View Chat →]                                              │
│                                                                 │
│ 2. Chat: "Help with React best practices"                     │
│    Date: Nov 12, 2025 at 10:21 AM                             │
│    Context: "At TechCorp, we use React and TypeScript..."     │
│    [View Chat →]                                              │
│                                                                 │
│ ────────────────────────────────────────────────────────────  │
│                                                                 │
│ Extraction Details:                                            │
│ - Confidence: 0.95 (Very High)                                │
│ - Method: GPT-4o-mini automatic extraction                    │
│ - Created: Nov 15, 2025 at 3:45 PM                            │
│ - Last updated: Nov 15, 2025 at 3:45 PM                       │
│                                                                 │
│                                                   [Close]      │
└───────────────────────────────────────────────────────────────┘
```

**Information Shown:**

1. **Memory Content** - Full text of the memory

2. **Source Chats** - List of originating chats
   - Chat title
   - Date/time
   - Relevant excerpt (context snippet)
   - Link to view full chat

3. **Extraction Details**
   - Confidence score
   - Extraction method (auto vs manual)
   - Timestamps

**API Call:**
- GET `/api/memory/entries/[id]/provenance`

---

### 8. Memory Suggestions Card

**Location:** Floating card at top of page (if suggestions exist)

**Visual Design:**
```
┌───────────────────────────────────────────────────────────────┐
│ 💡 Memory Suggestions                                    [✕]  │
├───────────────────────────────────────────────────────────────┤
│                                                                 │
│ Based on recent conversations, we think:                      │
│                                                                 │
│ 1. You might be located in San Francisco                      │
│    From: Chat "Local restaurants"                             │
│    [✓ Add to Personal Context]  [✕ Dismiss]                  │
│                                                                 │
│ 2. You're learning Rust                                       │
│    From: Chat "Help with ownership concept"                   │
│    [✓ Add to Top of Mind]  [✕ Dismiss]                       │
│                                                                 │
└───────────────────────────────────────────────────────────────┘
```

**Features:**
- Shows up to 3 pending suggestions
- Each suggestion has:
  - Proposed memory text
  - Source chat
  - "Add to [Category]" button
  - "Dismiss" button
- Suggestions come from extraction pipeline
- User can dismiss individually or entire card

**API Calls:**
- GET `/api/memory/suggestions`
- POST `/api/memory/suggestions/[id]/accept`
- DELETE `/api/memory/suggestions/[id]/dismiss`

---

### 9. Empty States

#### Empty Category State
```
┌───────────────────────────────────────────────────────────────┐
│ ∨ Work Context (0 memories)                    [+ Add Memory] │
├───────────────────────────────────────────────────────────────┤
│                                                                 │
│               🎯                                               │
│                                                                 │
│         No work memories yet                                   │
│                                                                 │
│   Add your current role, expertise, and work preferences      │
│   to help Bobo understand your professional context.          │
│                                                                 │
│                   [+ Add Memory]                               │
│                                                                 │
└───────────────────────────────────────────────────────────────┘
```

#### Completely Empty State (No Memories at All)
```
┌───────────────────────────────────────────────────────────────┐
│               🧠                                               │
│                                                                 │
│         No memories yet                                        │
│                                                                 │
│   Your memory helps Bobo personalize every conversation.      │
│   Get started by adding your first memory or enabling         │
│   automatic extraction.                                        │
│                                                                 │
│   [+ Add Memory Manually]  [⚙ Enable Auto-Extraction]         │
│                                                                 │
└───────────────────────────────────────────────────────────────┘
```

#### Search No Results State
```
┌───────────────────────────────────────────────────────────────┐
│               🔍                                               │
│                                                                 │
│      No memories match "rust programming"                     │
│                                                                 │
│   Try different keywords or add a new memory.                 │
│                                                                 │
│                   [Clear Search]                               │
│                                                                 │
└───────────────────────────────────────────────────────────────┘
```

---

## Interactions & Behaviors

### 1. Collapsible Sections

**Default State:** All sections collapsed (chevron pointing right >)

**Click Behavior:**
- Click anywhere on section header → Toggle expand/collapse
- Smooth animation (200ms ease-in-out)
- Chevron rotates: > (collapsed) → ∨ (expanded)

**Persistence:**
- Save expanded/collapsed state to localStorage
- Restore state on page reload
- Key: `memory-sections-state`

### 2. Memory Card Hover

**Default State:** Neutral background

**Hover State:**
- Background: hover:bg-accent
- Show edit/delete buttons (hidden by default)
- Smooth transition (150ms)

### 3. Search Filtering

**Behavior:**
- Debounced input (300ms delay)
- Case-insensitive search
- Searches across:
  - Memory content
  - Category names
  - Subcategory names
- Highlights matching text with `<mark>` tags

**Results Display:**
- Shows count: "5 results in 3 categories"
- Auto-expands sections with matches
- Collapses sections without matches
- "Clear Search" button when active

### 4. Token Usage Bar

**Real-time Updates:**
- Recalculates on every add/edit/delete
- Smooth animation when value changes
- Color transitions:
  - Green → Yellow at 70%
  - Yellow → Red at 90%

**Warning States:**
- Yellow (70-90%): Shows info tooltip "Approaching token limit"
- Red (> 90%): Shows warning tooltip "Memory limit reached. Consider removing old memories."

### 5. Confirmation Dialogs

**Delete Memory:**
```
┌───────────────────────────────────────┐
│ Delete Memory?                        │
├───────────────────────────────────────┤
│                                       │
│ Are you sure you want to delete:     │
│                                       │
│ "Current role: Full-stack developer  │
│  at TechCorp"                        │
│                                       │
│ This action cannot be undone.        │
│                                       │
│             [Cancel]  [Delete]       │
└───────────────────────────────────────┘
```

**Clear All Memories:**
```
┌───────────────────────────────────────┐
│ Clear All Memories?                   │
├───────────────────────────────────────┤
│                                       │
│ This will delete all 23 extracted    │
│ memories across all categories.      │
│                                       │
│ Your manual profile will be preserved.│
│                                       │
│ This action cannot be undone.        │
│                                       │
│ Type "DELETE" to confirm:            │
│ [____________]                        │
│                                       │
│             [Cancel]  [Delete All]   │
└───────────────────────────────────────┘
```

---

## Responsive Design

### Desktop (> 1024px)
- Full sidebar visible
- 2-column layout possible for Brief History subcategories
- Memory cards full width

### Tablet (768px - 1024px)
- Collapsible sidebar
- Single column layout
- Memory cards full width

### Mobile (< 768px)
- Hidden sidebar (hamburger menu)
- Stacked layout
- Compact memory cards
- Floating action button for "+ Add Memory"
- Search bar collapses to icon

---

## Accessibility (WCAG 2.1 AA Compliance)

### Keyboard Navigation
- Tab order: Header → Search → Sections → Memory Cards → Modals
- Enter/Space: Toggle sections, activate buttons
- Escape: Close modals, clear search
- Arrow keys: Navigate between memory cards

### Screen Readers
- ARIA labels on all interactive elements
- ARIA-expanded on collapsible sections
- ARIA-live regions for search results count
- Semantic HTML (header, nav, main, section, article)

### Color Contrast
- Text: 4.5:1 minimum contrast ratio
- Interactive elements: 3:1 minimum
- Focus indicators: 3:1 against background

### Focus Management
- Visible focus rings on all interactive elements
- Focus trap in modals
- Return focus to trigger element on modal close

---

## Performance Considerations

### Lazy Loading
- Initial render: Show first 5 memories per section
- "Show more" loads next 10 on demand
- Virtualized list for categories with > 50 memories

### Optimistic Updates
- Add/edit/delete operations update UI immediately
- Revert on API failure with error toast
- Loading spinners on slow operations (> 500ms)

### Caching
- Cache memory data in React Query
- Stale time: 5 minutes
- Refetch on window focus
- Invalidate cache on mutations

### Debouncing
- Search input: 300ms debounce
- Token calculation: 500ms debounce after content changes

---

## API Endpoints

### Memory CRUD
```typescript
GET    /api/memory/entries              // List all memories
GET    /api/memory/entries/:id          // Get single memory
POST   /api/memory/entries              // Create memory
PATCH  /api/memory/entries/:id          // Update memory
DELETE /api/memory/entries/:id          // Delete memory

// Query params for GET /api/memory/entries:
?category=work_context                  // Filter by category
?search=react                           // Search memories
?limit=50                               // Pagination
?offset=0                               // Pagination
```

### Memory Settings
```typescript
GET   /api/memory/settings               // Get user settings
PATCH /api/memory/settings               // Update settings
```

### Memory Suggestions
```typescript
GET    /api/memory/suggestions           // Get pending suggestions
POST   /api/memory/suggestions/:id/accept
DELETE /api/memory/suggestions/:id/dismiss
```

### Memory Provenance
```typescript
GET /api/memory/entries/:id/provenance   // Get source chats
```

### Bulk Operations
```typescript
POST   /api/memory/export                // Export all memories
DELETE /api/memory/clear-all             // Clear all extracted memories
```

---

## Data Models

### Memory Entry
```typescript
interface MemoryEntry {
  id: string;
  user_id: string;
  category: MemoryCategory;
  subcategory?: string;
  content: string;
  summary?: string;
  confidence: number;           // 0.0 - 1.0
  source_type: 'manual' | 'extracted' | 'suggested';
  source_chat_ids: string[];
  source_project_ids: string[];
  source_message_count: number;
  time_period: 'current' | 'recent' | 'past' | 'long_ago';
  relevance_score: number;      // Temporal decay
  last_updated: Date;
  last_mentioned: Date;
  created_at: Date;
  content_hash: string;
}

type MemoryCategory =
  | 'work_context'
  | 'personal_context'
  | 'top_of_mind'
  | 'brief_history'
  | 'long_term_background'
  | 'other_instructions';
```

### Memory Settings
```typescript
interface MemorySettings {
  user_id: string;
  auto_extraction_enabled: boolean;
  extraction_frequency: 'realtime' | 'daily' | 'weekly' | 'manual';
  enabled_categories: MemoryCategory[];
  token_budget: number;
  updated_at: Date;
}
```

### Memory Suggestion
```typescript
interface MemorySuggestion {
  id: string;
  user_id: string;
  category: MemoryCategory;
  content: string;
  confidence: number;
  source_chat_id: string;
  source_excerpt: string;
  created_at: Date;
}
```

---

## Future Enhancements (Post-M3)

### Phase 2 Features
1. **Memory Search Filters**
   - Filter by category
   - Filter by confidence level
   - Filter by source type (manual vs extracted)
   - Filter by date range

2. **Memory Analytics**
   - Chart: Memories added over time
   - Chart: Category distribution
   - Chart: Confidence score distribution

3. **Memory Relationships**
   - Link related memories
   - Visual graph view
   - "See also" suggestions

4. **Import/Export**
   - Import from resume (PDF parsing)
   - Import from LinkedIn profile
   - Export formats: JSON, Markdown, CSV

5. **Memory Templates**
   - Pre-filled templates for common categories
   - Example: "Software Engineer" template with standard fields

### Advanced Features
1. **Memory Timeline**
   - Visual timeline of all memories
   - Filter by time period
   - Zoom in/out

2. **Memory Insights**
   - AI-generated summary of your memory
   - Patterns and trends
   - Suggestions for completeness

3. **Memory Sharing**
   - Share specific memories with team
   - Privacy controls per memory
   - Audit log of who viewed what

---

## Implementation Notes

### Tech Stack
- **Framework:** Next.js 16 (App Router)
- **UI Library:** shadcn/ui (Radix UI primitives)
- **Styling:** Tailwind CSS v4
- **State Management:** React Query (TanStack Query)
- **Forms:** React Hook Form + Zod validation
- **Icons:** Lucide React
- **Animations:** Motion (Framer Motion)

### Component Library
Use existing shadcn/ui components:
- `Card` - Memory cards
- `Collapsible` - Sections
- `Dialog` - Modals
- `Button` - All buttons
- `Input` - Search bar
- `Textarea` - Memory content
- `Select` - Dropdowns
- `Switch` - Toggles
- `Progress` - Token usage bar
- `Badge` - Confidence levels, categories
- `Separator` - Section dividers
- `ScrollArea` - Long lists
- `Tooltip` - Hover information

### File Structure
```
app/
  memory/
    page.tsx                    // Main memory page
    layout.tsx                  // Memory page layout

components/
  memory/
    memory-header.tsx           // Header with search
    memory-summary.tsx          // Summary stats
    memory-section.tsx          // Collapsible section
    memory-card.tsx             // Individual memory card
    memory-settings-modal.tsx   // Settings modal
    add-memory-modal.tsx        // Add/edit modal
    provenance-modal.tsx        // Provenance modal
    memory-suggestions.tsx      // Suggestions card

lib/
  memory/
    queries.ts                  // React Query hooks
    api.ts                      // API client functions
    utils.ts                    // Helper functions
    types.ts                    // TypeScript types
```

### Testing Strategy
1. **Unit Tests** - Individual components (Vitest + React Testing Library)
2. **Integration Tests** - API routes (Vitest)
3. **E2E Tests** - Full user flows (Playwright)

**Critical Test Cases:**
- Add memory to each category
- Edit existing memory
- Delete memory with confirmation
- Search and filter memories
- Toggle auto-extraction settings
- Export all memories
- Clear all memories
- Memory provenance modal

---

## Open Questions

1. **Token Calculation:** Should we use exact tokenization or heuristic (length / 4)?
   - Recommendation: Heuristic for UI, exact for backend enforcement

2. **Memory Deduplication:** How aggressive should fuzzy matching be?
   - Recommendation: 90% similarity threshold, manual review for edge cases

3. **Consolidation Schedule:** Weekly or user-triggered?
   - Recommendation: Weekly automatic + manual "Consolidate Now" button

4. **Mobile UX:** Should we have a separate mobile-optimized view?
   - Recommendation: Responsive design first, consider native app later

5. **Real-time Updates:** Should memory page update in real-time as new chats happen?
   - Recommendation: Yes, using WebSocket or polling every 30s when page is open

---

## Success Metrics

### User Engagement
- % of users who visit /memory page within first week
- Average time spent on memory page
- % of users who add manual memories
- % of users who enable auto-extraction

### Memory Quality
- Average confidence score across all memories
- % of memories with sources (provenance)
- Average memories per user
- % of memories edited after creation

### System Health
- Memory page load time (< 2s target)
- API response time (< 500ms target)
- Token usage distribution
- Memory consolidation success rate

---

**Document Version:** 1.0
**Last Updated:** November 24, 2025
**Next Review:** After M3-03 Sprint
**Status:** Ready for Implementation
