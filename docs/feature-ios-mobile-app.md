# Feature Project: iOS Mobile App (Expo + React Native)

**Project ID:** MOBILE-1
**Status:** 📝 Planned
**Priority:** 🟡 MEDIUM
**Target Start:** TBD
**Target End:** 6-8 weeks from start
**Estimated Effort:** 35-45 days (feature-complete)
**Owner:** TBD
**Last Updated:** November 24, 2025

---

## 📋 Executive Summary

Build a native iOS mobile application for the Bobo AI Chatbot using Expo + React Native. The app will provide a native mobile experience while reusing the existing Next.js backend APIs and shared business logic. This is an **internal tool** focused on iOS-only deployment (Android deferred to future milestone).

### Key Goals
1. Native mobile chat experience with full feature parity
2. Maximum code reuse from existing web application
3. Leverage Expo managed workflow for rapid development
4. Maintain existing backend APIs without modifications

### Strategic Fit
- **User Need:** Mobile access to AI chatbot for on-the-go conversations
- **Business Value:** Extended platform reach, better user engagement
- **Technical Value:** Validates architecture portability, establishes mobile patterns

---

## 🎯 Project Objectives

### Primary Objectives
1. ✅ **Functional Parity:** All core chat features work on iOS
2. ✅ **Native Experience:** App feels native, not like a web wrapper
3. ✅ **Code Reuse:** Share 70%+ of business logic with web app
4. ✅ **Performance:** Smooth 60fps interactions, instant response

### Success Metrics
- Chat message send/receive latency < 500ms
- App launch time < 3 seconds
- Memory usage < 200MB during normal operation
- Zero crash rate after stabilization period
- 90%+ code coverage for shared utilities

---

## 🏗 Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────┐
│           iOS App (Expo/React Native)        │
├─────────────────────────────────────────────┤
│                                              │
│  ┌──────────────────────────────────────┐  │
│  │    UI Layer (React Native)           │  │
│  │  - Navigation (React Navigation)      │  │
│  │  - Components (Paper/NativeBase)      │  │
│  │  - Animations (Reanimated)            │  │
│  └──────────────────────────────────────┘  │
│              ▼                               │
│  ┌──────────────────────────────────────┐  │
│  │    Business Logic (Shared)           │  │
│  │  - Context Tracker ✅                │  │
│  │  - Memory Manager ✅                 │  │
│  │  - DB Queries (Supabase) ✅          │  │
│  │  - AI SDK (@ai-sdk/react) ✅         │  │
│  └──────────────────────────────────────┘  │
│              ▼                               │
│  ┌──────────────────────────────────────┐  │
│  │    Data Layer                        │  │
│  │  - Supabase Client ✅                │  │
│  │  - React Query ✅                    │  │
│  │  - Local Storage (AsyncStorage)      │  │
│  └──────────────────────────────────────┘  │
│                                              │
└──────────────────┬──────────────────────────┘
                   │
                   │ HTTP/SSE
                   ▼
┌─────────────────────────────────────────────┐
│         Existing Backend (Next.js)           │
├─────────────────────────────────────────────┤
│  - /api/chat (streaming SSE)                 │
│  - /api/projects/* (CRUD)                    │
│  - /api/chats/* (CRUD)                       │
│  - /api/memory/* (extraction, CRUD)          │
│  - /api/user/profile                         │
│  - AI Gateway integration                    │
│  - Supabase database                         │
└─────────────────────────────────────────────┘
```

### Technology Stack

**Frontend Framework:**
- Expo SDK ~52.0.0 (managed workflow)
- React Native 0.76.0
- TypeScript 5.x

**Navigation:**
- @react-navigation/native (v6+)
- @react-navigation/native-stack
- react-native-screens
- react-native-safe-area-context

**UI Components:**
- react-native-paper (Material Design, recommended)
- OR native-base (alternative)
- @expo/vector-icons
- react-native-reanimated (animations)
- react-native-gesture-handler

**AI & Data:**
- ai (Vercel AI SDK - universal)
- @ai-sdk/react (useChat hook - works in RN!)
- @ai-sdk/openai
- gpt-tokenizer (token counting)
- @supabase/supabase-js (official RN support)

**State & Caching:**
- @tanstack/react-query (data fetching)
- jotai (global state)
- @react-native-async-storage/async-storage

**Forms & Validation:**
- react-hook-form (RN compatible)
- @hookform/resolvers
- zod (validation)

**File Handling:**
- expo-document-picker
- expo-image-picker
- react-native-fs (file system access)

**Content Rendering:**
- react-native-markdown-display (markdown)
- react-syntax-highlighter (code blocks)

**Utilities:**
- date-fns (date formatting)
- nanoid (ID generation)

---

## 📦 Feature Breakdown

### Phase 1: Setup & Core Libraries (Week 1)

**Goal:** Environment setup + backend connectivity verification

**Tasks:**
1. Create Expo project with TypeScript template
2. Install and configure core dependencies
3. Set up folder structure (screens, components, lib, hooks)
4. Configure environment variables for Supabase & API Gateway
5. Test API connectivity (fetch to /api/chat health check)
6. Port shared libraries:
   - `lib/context-tracker.ts` (✅ universal)
   - `lib/memory-manager.ts` (✅ universal)
   - `lib/db/queries.ts` (✅ universal)
   - `lib/db/types.ts` (✅ universal)
7. Set up React Navigation structure
8. **CRITICAL:** Test SSE streaming with useChat hook

**Deliverables:**
- ✅ Expo project initialized and running on iOS Simulator
- ✅ Backend APIs accessible via fetch
- ✅ Supabase connection verified
- ✅ Shared utilities imported and functional
- ✅ Navigation structure in place
- ✅ SSE streaming proof-of-concept working

**Estimated Effort:** 3-5 days

**Risk Mitigation:**
- Test SSE streaming **first** (highest technical risk)
- Use EventSource polyfill if needed
- Verify gpt-tokenizer works in React Native environment

---

### Phase 2: Basic Chat UI (Week 2)

**Goal:** Minimal working chat interface

**Features:**
1. **Message List Component**
   - FlatList with inverted scroll
   - Message bubbles (user vs assistant)
   - Basic text rendering
   - Timestamp display
   - Scroll to bottom button

2. **Input Component**
   - Auto-growing TextInput
   - Send button with loading state
   - Character count indicator
   - Keyboard avoiding view

3. **Streaming Handler**
   - useChat hook integration
   - Real-time message updates
   - Error handling & retry
   - Loading indicators

4. **Basic Screens**
   - Home screen (new chat)
   - Chat screen (active conversation)
   - Simple header with back button

**Technical Details:**
```typescript
// screens/ChatScreen.tsx
import { useChat } from '@ai-sdk/react';
import { FlatList, TextInput, View } from 'react-native';

export function ChatScreen() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: 'https://your-api.com/api/chat',
  });

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={messages}
        inverted
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MessageBubble message={item} />}
      />
      <InputBar
        value={input}
        onChange={handleInputChange}
        onSubmit={handleSubmit}
      />
    </View>
  );
}
```

**Deliverables:**
- ✅ Functional chat screen
- ✅ Can send and receive messages
- ✅ Streaming messages render in real-time
- ✅ Basic styling (messages, input, buttons)
- ✅ Keyboard behavior handled

**Estimated Effort:** 5-7 days

---

### Phase 3: Advanced Chat Features (Week 3)

**Goal:** Multi-modal input + model selection

**Features:**
1. **File Attachments**
   - Document picker integration (expo-document-picker)
   - Image picker (expo-image-picker)
   - File preview thumbnails
   - Upload progress indicators
   - File size validation

2. **Model Selector**
   - Modal with model list (10+ models)
   - Model description tooltips
   - Context limit display
   - Default model persistence

3. **Web Search Toggle**
   - Switch component
   - Perplexity integration indicator
   - Search mode badge in header

4. **Message Actions**
   - Long-press context menu
   - Copy message text
   - Retry generation
   - Delete message (future)

5. **Chat Management**
   - Pull-to-refresh for chat history
   - Chat list screen
   - Chat creation flow
   - Chat deletion with confirmation

**Technical Details:**
```typescript
// components/InputBar.tsx
import DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

export function InputBar({ onSubmit }) {
  const [attachments, setAttachments] = useState([]);

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'application/pdf', 'text/markdown'],
      copyToCacheDirectory: true,
    });

    if (result.type === 'success') {
      setAttachments([...attachments, result]);
    }
  };

  return (
    <View>
      {attachments.map(att => <AttachmentPreview key={att.uri} {...att} />)}
      <View style={{ flexDirection: 'row' }}>
        <IconButton icon="attachment" onPress={pickDocument} />
        <TextInput ... />
        <IconButton icon="send" onPress={onSubmit} />
      </View>
    </View>
  );
}
```

**Deliverables:**
- ✅ File upload working (images + documents)
- ✅ Model selector modal
- ✅ Web search toggle functional
- ✅ Message context menu (copy, retry)
- ✅ Chat history loading
- ✅ Pull-to-refresh implemented

**Estimated Effort:** 4-5 days

---

### Phase 4: Context Visualization (Week 4)

**Goal:** Real-time token tracking & auto-compression

**Features:**
1. **Token Counter Display**
   - Real-time counting on input change
   - Use existing `lib/context-tracker.ts`
   - Display format: "2,847 / 128,000 tokens (2%)"

2. **Segmented Progress Bar**
   - 3-segment visualization (system, history, draft)
   - Animated with Reanimated
   - Color coding: green (safe), yellow (warning), red (critical)

3. **Context Usage Modal**
   - Tap progress bar to expand
   - Detailed breakdown:
     - System prompts: X tokens
     - Conversation history: Y tokens
     - Current draft: Z tokens
     - Available: W tokens
   - Model-specific limits displayed

4. **Auto-Compression**
   - Trigger at 90% context usage
   - Show "Compressing history..." indicator
   - Use existing `lib/memory-manager.ts`
   - Success/error toasts

**Technical Details:**
```typescript
// components/ContextProgress.tsx
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

export function ContextProgress({ usage }) {
  const { systemTokens, historyTokens, draftTokens, limit } = usage;

  const systemWidth = (systemTokens / limit) * 100;
  const historyWidth = (historyTokens / limit) * 100;
  const draftWidth = (draftTokens / limit) * 100;

  return (
    <Animated.View style={styles.progressBar}>
      <Animated.View style={[styles.segment, { width: `${systemWidth}%`, backgroundColor: 'blue' }]} />
      <Animated.View style={[styles.segment, { width: `${historyWidth}%`, backgroundColor: 'green' }]} />
      <Animated.View style={[styles.segment, { width: `${draftWidth}%`, backgroundColor: 'orange' }]} />
    </Animated.View>
  );
}
```

**Deliverables:**
- ✅ Real-time token counting
- ✅ Animated progress bar (3 segments)
- ✅ Context modal with breakdown
- ✅ Auto-compression trigger
- ✅ Compression status feedback

**Estimated Effort:** 3-4 days

---

### Phase 5: Citations & Markdown (Week 5)

**Goal:** Rich content rendering with source citations

**Features:**
1. **Markdown Rendering**
   - react-native-markdown-display integration
   - Support for:
     - Headers (H1-H6)
     - Lists (ordered, unordered)
     - Code blocks (inline and fenced)
     - Links (open in browser)
     - Bold, italic, strikethrough
     - Blockquotes
     - Tables

2. **Code Syntax Highlighting**
   - react-syntax-highlighter integration
   - Language detection
   - Copy code button
   - Line numbers (optional)
   - Theme matching (light/dark)

3. **Inline Citations**
   - Perplexity-style [1], [2] markers
   - Custom Text component with superscript
   - Clickable citation markers
   - Tooltip on press (source preview)

4. **Expandable Source List**
   - Bottom sheet component
   - Two sections:
     - "Project Files" (Loop A sources)
     - "Global Inspiration" (Loop B sources)
   - Source metadata:
     - File name / URL
     - Project name
     - Relevance score
     - Snippet preview
   - Tap to open source details

5. **Reasoning Display**
   - Collapsible section for reasoning models
   - Animated expand/collapse
   - Monospace font
   - Dimmed styling (secondary content)

**Technical Details:**
```typescript
// components/MessageContent.tsx
import Markdown from 'react-native-markdown-display';

export function MessageContent({ parts }) {
  const textPart = parts.find(p => p.type === 'text');
  const sources = parts.filter(p => p.type === 'project-source' || p.type === 'global-source');
  const reasoning = parts.find(p => p.type === 'reasoning');

  return (
    <View>
      {textPart && (
        <Markdown style={markdownStyles}>
          {insertCitations(textPart.text, sources)}
        </Markdown>
      )}
      {reasoning && (
        <CollapsibleReasoning content={reasoning.text} />
      )}
      {sources.length > 0 && (
        <CitationsList sources={sources} />
      )}
    </View>
  );
}

// Inline citation rendering
function insertCitations(text, sources) {
  let result = text;
  sources.forEach((source, idx) => {
    const marker = `[${idx + 1}]`;
    // Insert marker after sentences that reference this source
    result = result.replace(
      new RegExp(`(${source.snippet}[.!?])`, 'gi'),
      `$1 ${marker}`
    );
  });
  return result;
}
```

**Deliverables:**
- ✅ Markdown rendering working
- ✅ Code blocks with syntax highlighting
- ✅ Inline citation markers [1], [2]
- ✅ Expandable source list (bottom sheet)
- ✅ Reasoning collapsible section
- ✅ Source detail view

**Estimated Effort:** 5-6 days

---

### Phase 6: Projects & Memory (Week 6)

**Goal:** Project management + memory system UI

**Features:**
1. **Project List Screen**
   - FlatList of user's projects
   - Project cards with:
     - Name, description
     - File count, chat count
     - Last updated timestamp
   - Pull-to-refresh
   - Search/filter functionality
   - Create new project button

2. **Project Detail Screen**
   - Project info header
   - Tabs: Chats | Files | Settings
   - File upload button
   - File list with:
     - File name, size
     - Upload date
     - Delete action
   - File viewer modal

3. **File Upload**
   - Document picker integration
   - Markdown file validation
   - Size limit check (10MB)
   - Upload progress
   - Success/error handling
   - Auto-refresh file list

4. **Memory Management Screen**
   - Hierarchical sections (collapsible):
     - Work Context
     - Personal Context
     - Top of Mind
     - Brief History (Recent, Earlier, Long-term)
     - Long-term Background
     - Other Instructions
   - Memory entry cards:
     - Content text
     - Confidence score badge
     - Source chat links
     - Edit/delete actions
   - Add new memory button
   - Memory suggestions section
   - Settings toggle (auto-extraction)

5. **User Profile Screen**
   - Form fields:
     - Bio
     - Background
     - Preferences
     - Technical Context
   - Save button
   - Character count per field
   - Auto-save (debounced)

6. **Settings Screen**
   - Memory settings:
     - Enable/disable auto-extraction
     - Extraction frequency
     - Privacy controls (per category)
     - Clear all memories
   - App settings:
     - Default model
     - Theme (light/dark)
     - Notifications
   - About section:
     - Version number
     - Terms & Privacy links

**Technical Details:**
```typescript
// screens/ProjectsScreen.tsx
import { FlatList } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getProjects } from '@/lib/db/queries';

export function ProjectsScreen() {
  const { data: projects, refetch } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
  });

  return (
    <FlatList
      data={projects}
      renderItem={({ item }) => <ProjectCard project={item} />}
      refreshing={isRefetching}
      onRefresh={refetch}
    />
  );
}

// screens/MemoryScreen.tsx
export function MemoryScreen() {
  const { data: memories } = useQuery({
    queryKey: ['memory-entries'],
    queryFn: getMemoryEntries,
  });

  const grouped = groupByCategory(memories);

  return (
    <ScrollView>
      {Object.entries(grouped).map(([category, entries]) => (
        <MemorySection
          key={category}
          category={category}
          entries={entries}
        />
      ))}
    </ScrollView>
  );
}
```

**Deliverables:**
- ✅ Project list screen
- ✅ Project detail with file management
- ✅ File upload working
- ✅ Memory management UI
- ✅ User profile editor
- ✅ Settings screen
- ✅ All CRUD operations functional

**Estimated Effort:** 6-8 days

---

### Phase 7: Polish & Testing (Week 7-8)

**Goal:** Production readiness

**Tasks:**
1. **Theme Implementation**
   - Light and dark mode support
   - Theme toggle in settings
   - Persist user preference
   - Apply to all components
   - Status bar styling

2. **Loading States & Skeletons**
   - Skeleton loaders for:
     - Message list
     - Project cards
     - Memory sections
     - File list
   - Loading spinners
   - Empty states with illustrations
   - Error states with retry

3. **Error Handling**
   - Network error handling
   - API error messages (user-friendly)
   - Toast notifications
   - Retry mechanisms
   - Offline mode detection

4. **Performance Optimization**
   - Memoize expensive components
   - Use FlashList for long lists
   - Image caching
   - Lazy loading for heavy screens
   - Bundle size optimization

5. **User Experience Polish**
   - Haptic feedback on actions
   - Pull-to-refresh everywhere
   - Swipe gestures (delete, archive)
   - Smooth animations (60fps)
   - Accessibility labels
   - VoiceOver support

6. **Testing**
   - Unit tests for utilities
   - Integration tests for API calls
   - Component tests
   - E2E tests for critical flows:
     - Send message
     - Upload file
     - Create project
     - Edit memory
   - Manual testing on real devices

7. **TestFlight Setup**
   - Apple Developer account setup
   - Provisioning profiles
   - App icon & splash screen
   - Build configuration
   - Upload to TestFlight
   - Internal testing

**Deliverables:**
- ✅ Dark mode fully implemented
- ✅ All loading states polished
- ✅ Error handling comprehensive
- ✅ Performance targets met
- ✅ Haptic feedback added
- ✅ Accessibility audit passed
- ✅ Test suite passing (80%+ coverage)
- ✅ TestFlight build deployed
- ✅ Internal testing complete

**Estimated Effort:** 8-10 days

---

## 🔧 Technical Implementation Details

### Folder Structure

```
mobile/
├── app/                          # Root app entry
│   ├── _layout.tsx               # Root layout
│   ├── index.tsx                 # Home screen
│   └── (tabs)/                   # Tab navigation
│       ├── chat.tsx
│       ├── projects.tsx
│       ├── memory.tsx
│       └── profile.tsx
├── components/
│   ├── chat/
│   │   ├── MessageList.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── InputBar.tsx
│   │   ├── ModelSelector.tsx
│   │   ├── ContextProgress.tsx
│   │   └── CitationsList.tsx
│   ├── project/
│   │   ├── ProjectCard.tsx
│   │   ├── ProjectHeader.tsx
│   │   ├── FileList.tsx
│   │   └── FileUploader.tsx
│   ├── memory/
│   │   ├── MemorySection.tsx
│   │   ├── MemoryCard.tsx
│   │   └── MemorySuggestions.tsx
│   └── ui/                       # React Native Paper components
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Modal.tsx
│       └── ...
├── lib/                          # Shared with web (symlink or copy)
│   ├── context-tracker.ts        # ✅ Universal
│   ├── memory-manager.ts         # ✅ Universal
│   ├── db/
│   │   ├── queries.ts            # ✅ Universal
│   │   └── types.ts              # ✅ Universal
│   └── utils.ts                  # Replace cn() with StyleSheet
├── hooks/
│   ├── useChat.ts                # Wrapper for @ai-sdk/react
│   ├── useProjects.ts            # React Query hooks
│   ├── useMemory.ts
│   └── useTheme.ts
├── constants/
│   ├── models.ts                 # Model configs
│   └── theme.ts                  # Design tokens
├── assets/
│   ├── images/
│   └── fonts/
├── app.json                      # Expo config
├── package.json
├── tsconfig.json
└── README.md
```

### Environment Variables

```typescript
// .env.local (Expo)
EXPO_PUBLIC_API_URL=https://your-api.com
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
EXPO_PUBLIC_AI_GATEWAY_API_KEY=sk-xxx...
```

### Key Dependencies

```json
{
  "dependencies": {
    "@react-navigation/native": "^6.1.0",
    "@react-navigation/native-stack": "^6.9.0",
    "expo": "~52.0.0",
    "react": "19.0.0",
    "react-native": "0.76.0",
    "react-native-screens": "~4.0.0",
    "react-native-safe-area-context": "~4.8.0",
    "ai": "^5.0.98",
    "@ai-sdk/react": "^2.0.98",
    "@ai-sdk/openai": "^2.0.71",
    "gpt-tokenizer": "^3.4.0",
    "@supabase/supabase-js": "^2.84.0",
    "@tanstack/react-query": "^5.90.10",
    "jotai": "^2.15.1",
    "react-native-paper": "^5.12.0",
    "react-native-reanimated": "~3.16.0",
    "react-native-gesture-handler": "~2.20.0",
    "expo-document-picker": "~12.0.0",
    "expo-image-picker": "~15.0.0",
    "react-native-fs": "^2.20.0",
    "react-native-markdown-display": "^7.0.0",
    "react-syntax-highlighter": "^15.5.0",
    "react-hook-form": "^7.66.1",
    "@hookform/resolvers": "^5.2.2",
    "zod": "^4.1.12",
    "date-fns": "^4.1.0",
    "nanoid": "^5.1.6",
    "@expo/vector-icons": "^14.0.0",
    "@react-native-async-storage/async-storage": "~2.0.0"
  },
  "devDependencies": {
    "@types/react": "~19.0.0",
    "@types/react-native": "~0.76.0",
    "typescript": "~5.3.0",
    "eslint": "^8.57.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "jest": "^29.7.0",
    "@testing-library/react-native": "^12.4.0"
  }
}
```

---

## 🎨 Design Considerations

### UI/UX Principles

1. **Native Feel**
   - Use native navigation patterns (stack, tabs)
   - Follow iOS Human Interface Guidelines
   - Native gestures (swipe back, pull-to-refresh)
   - Platform-specific components where appropriate

2. **Consistency with Web**
   - Match color scheme and branding
   - Similar component hierarchy
   - Familiar interaction patterns for existing users

3. **Mobile-First**
   - Touch-friendly targets (44x44pt minimum)
   - Thumb-zone optimization
   - Vertical scrolling primary navigation
   - Bottom tab bar for main sections

4. **Performance**
   - Instant feedback on all interactions
   - Optimistic UI updates
   - Background loading with spinners
   - Smooth animations (avoid jank)

### Screen Designs

**Chat Screen:**
```
┌─────────────────────────────────┐
│ ← | Model: GPT-4o        [⋮]   │ Header
├─────────────────────────────────┤
│                                 │
│  ┌──────────────────────────┐  │
│  │ User message here...     │  │
│  │ 2:34 PM                  │  │
│  └──────────────────────────┘  │
│                                 │
│ ┌──────────────────────────┐   │
│ │ AI response here...      │   │
│ │ Used: file.md [1]        │   │
│ │ 2:34 PM                  │   │
│ └──────────────────────────┘   │
│                                 │
│ [=======  2.8K / 128K  ] 2%    │ Context bar
│                                 │
├─────────────────────────────────┤
│ [📎] [...type message...]  [▲] │ Input
└─────────────────────────────────┘
```

**Projects Screen:**
```
┌─────────────────────────────────┐
│ Projects                  [+]   │ Header
├─────────────────────────────────┤
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 📁 My Project              │ │
│ │ 5 chats • 3 files          │ │
│ │ Updated 2h ago             │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 📁 Work Project            │ │
│ │ 12 chats • 8 files         │ │
│ │ Updated yesterday          │ │
│ └─────────────────────────────┘ │
│                                 │
└─────────────────────────────────┘
```

**Memory Screen:**
```
┌─────────────────────────────────┐
│ Your Memory            [⚙️]     │ Header
├─────────────────────────────────┤
│                                 │
│ ▼ Work Context (3)              │
│   • Current role: Developer...  │
│   • Expertise: TypeScript...    │
│   • Working on: Mobile app...   │
│                                 │
│ ▶ Personal Context (5)          │
│                                 │
│ ▶ Top of Mind (2)               │
│                                 │
│ ▶ Brief History                 │
│   ▶ Recent Months (4)           │
│   ▶ Earlier (6)                 │
│   ▶ Long Term (3)               │
│                                 │
│ [+ Add Memory]                  │
│                                 │
└─────────────────────────────────┘
```

---

## ⚠️ Risks & Mitigation

### High Risk Items

| Risk | Impact | Likelihood | Mitigation Strategy |
|------|--------|------------|---------------------|
| SSE streaming incompatibility | 🔴 CRITICAL | 🟡 MEDIUM | Test early in Phase 1; use EventSource polyfill if needed; fallback to long-polling |
| Complex markdown rendering performance | 🟡 HIGH | 🟡 MEDIUM | Use memoization; lazy render code blocks; limit markdown complexity; consider simpler renderer |
| File upload reliability on mobile | 🟡 HIGH | 🟢 LOW | Implement retry logic; use chunks for large files; validate before upload; show clear progress |
| Token counting accuracy in RN | 🟠 MEDIUM | 🟢 LOW | Extensive testing; fallback to heuristic if needed; validate against known inputs |

### Medium Risk Items

| Risk | Impact | Likelihood | Mitigation Strategy |
|------|--------|------------|---------------------|
| Citation rendering complexity | 🟠 MEDIUM | 🟡 MEDIUM | Start simple (bottom list only); add inline markers later; custom Text component |
| Memory management performance | 🟠 MEDIUM | 🟢 LOW | Pagination; lazy loading; index by category; cache queries |
| Deep linking complexity | 🟠 MEDIUM | 🟡 MEDIUM | Start without deep links; add in polish phase; use Expo Linking API |
| Animation performance on older devices | 🟠 MEDIUM | 🟡 MEDIUM | Test on low-end devices; disable animations if FPS drops; use native driver |

### Low Risk Items

| Risk | Impact | Likelihood | Mitigation Strategy |
|------|--------|------------|---------------------|
| UI component library limitations | 🟢 LOW | 🟡 MEDIUM | Choose battle-tested library (Paper); build custom if needed; reuse patterns from web |
| Theme switching complexity | 🟢 LOW | 🟢 LOW | Use context + AsyncStorage; follow Paper theming guide; test both modes |
| Navigation state persistence | 🟢 LOW | 🟢 LOW | Use React Navigation persistence; test common flows; handle edge cases |

---

## 📊 Success Criteria

### MVP Success (End of Week 6)
- ✅ Can send/receive chat messages with streaming
- ✅ File attachments work (images + docs)
- ✅ Model selection functional
- ✅ Context tracking accurate
- ✅ Project management working
- ✅ Memory system accessible
- ✅ Core features work offline (cached)
- ✅ Zero critical bugs

### Production Ready (End of Week 8)
- ✅ All MVP criteria met
- ✅ Dark mode fully implemented
- ✅ Performance: 60fps interactions, <3s launch
- ✅ Test coverage >80%
- ✅ TestFlight build deployed
- ✅ Internal testing complete (10+ sessions)
- ✅ Crash-free sessions >95%
- ✅ User satisfaction >4/5

### Feature Parity Checklist

**Chat Interface:**
- [x] Send/receive messages
- [x] Streaming responses
- [x] Message history
- [x] Copy message
- [x] Retry generation
- [x] Model selection
- [x] Web search toggle
- [x] Context usage display
- [x] Auto-compression

**Attachments:**
- [x] Image upload
- [x] Document upload
- [x] File preview
- [x] Multiple attachments

**Context & Memory:**
- [x] Real-time token counting
- [x] 3-segment progress bar
- [x] Context modal
- [x] Memory management
- [x] User profile editor
- [x] Auto-extraction toggle

**Projects:**
- [x] Project list
- [x] Project creation
- [x] File upload to project
- [x] File listing
- [x] Chat association

**Citations:**
- [x] Markdown rendering
- [x] Code syntax highlighting
- [x] Inline citations [1], [2]
- [x] Expandable source list
- [x] Reasoning display

**Settings:**
- [x] Theme toggle
- [x] Default model
- [x] Memory settings
- [x] Privacy controls

---

## 📅 Timeline & Milestones

### Week-by-Week Breakdown

| Week | Phase | Key Deliverables | Confidence |
|------|-------|------------------|------------|
| 1 | Setup | Environment ready, APIs connected, SSE tested | 95% ✅ |
| 2 | Basic Chat | Message list, input, streaming working | 90% ✅ |
| 3 | Advanced Input | Attachments, model selector, actions | 85% 🟡 |
| 4 | Context | Token tracking, progress bar, compression | 90% ✅ |
| 5 | Markdown | Rich rendering, citations, reasoning | 70% 🟡 |
| 6 | Projects/Memory | Full CRUD, file upload, memory UI | 80% 🟡 |
| 7-8 | Polish | Testing, optimization, TestFlight | 75% 🟡 |

**Total Estimate:** 6-8 weeks for feature-complete internal tool

### Critical Path
1. **Phase 1 (Week 1)** → Blocks everything
2. **Phase 2 (Week 2)** → Blocks Phase 3-7
3. **SSE Streaming Test (Day 2)** → Highest risk, earliest test

### Buffer Time
- 1 week built into Phase 7-8 for unforeseen issues
- 2 days per phase for code review & refactoring
- 1 week after Phase 7 for stabilization if needed

---

## 🔄 Future Enhancements (Post-MVP)

### Phase 8+: Advanced Features (Future)

1. **Offline Mode**
   - Cache recent chats locally
   - Queue messages for send
   - Sync when online
   - Conflict resolution

2. **Push Notifications**
   - Chat response ready
   - Memory extraction complete
   - Project shared with you
   - Weekly summary

3. **Siri Integration**
   - "Hey Siri, ask Bobo..."
   - Voice input support
   - Read responses aloud

4. **Widgets**
   - Quick chat widget
   - Context usage widget
   - Recent chats widget

5. **Share Extension**
   - Share URLs to Bobo
   - Share images for analysis
   - Share text for processing

6. **Android Support**
   - Same codebase, different platform
   - Platform-specific optimizations
   - Material Design components

7. **iPad Optimization**
   - Split-view support
   - Keyboard shortcuts
   - Multi-window

---

## 📚 Resources & References

### Documentation
- [Expo Documentation](https://docs.expo.dev/)
- [React Native Paper](https://callstack.github.io/react-native-paper/)
- [React Navigation](https://reactnavigation.org/docs/getting-started)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [Supabase React Native](https://supabase.com/docs/guides/getting-started/tutorials/with-react-native)

### Design References
- iOS Human Interface Guidelines
- Material Design 3
- ChatGPT iOS app
- Perplexity iOS app
- Claude mobile (when available)

### Tools & Services
- Expo EAS Build (for TestFlight)
- Expo EAS Update (OTA updates)
- Sentry (error tracking)
- Mixpanel/Amplitude (analytics)

---

## 👥 Team & Responsibilities

### Development Team (Proposed)

**Lead Developer** (1 person)
- Overall architecture
- Phase 1-4 implementation
- Code review

**UI/UX Developer** (1 person, optional)
- Phase 5-6 implementation
- Design system setup
- Animations & polish

**QA/Testing** (0.5 person, optional)
- Manual testing
- E2E test writing
- TestFlight coordination

**Estimated Team Size:** 1-2 developers

**With Claude Code Assistance:**
- 1 developer can complete solo in 8 weeks
- Component conversions accelerated significantly
- AI assistance for React Native patterns

---

## 💰 Cost Considerations

### Development Costs
- **Labor:** 1 dev × 8 weeks @ $X/hour
- **Tools:** Expo EAS Pro ($29/month for builds)
- **Apple Developer:** $99/year

### Ongoing Costs
- Backend API costs (no change)
- Supabase costs (no change)
- App Store distribution ($99/year)
- Push notifications (free with Expo)

**Total Project Cost:** Primarily labor, minimal additional infrastructure

---

## 🎯 Next Steps

### Immediate Actions (Pre-Development)
1. ✅ Get stakeholder approval for 6-8 week timeline
2. ✅ Allocate developer resources
3. ✅ Set up Apple Developer account
4. ✅ Create project in Expo
5. ✅ Schedule kickoff meeting

### Phase 1 Kickoff (Week 1 Day 1)
1. Initialize Expo project
2. Install core dependencies
3. Test backend API connectivity
4. **Critical:** Verify SSE streaming works
5. Set up CI/CD (optional but recommended)

### Success Checkpoints
- **Week 2:** Demo basic chat to stakeholders
- **Week 4:** Demo context tracking to stakeholders
- **Week 6:** Internal dogfooding begins
- **Week 8:** TestFlight release to team

---

## 📝 Document Control

**Document Version:** 1.0
**Created:** November 24, 2025
**Last Updated:** November 24, 2025
**Owner:** Product Team
**Status:** 📝 Approved for Planning

**Approval Sign-off:**
- [ ] Product Owner
- [ ] Technical Lead
- [ ] CTO/Engineering Manager

**Change Log:**
| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-11-24 | 1.0 | Initial document creation | Claude Code |

---

**End of Document**
