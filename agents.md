# AI Agent Guidelines

This document provides comprehensive guidelines for AI agents (like Claude, Cursor, or custom AI assistants) working on the Bobo Vercel Clone AI Chatbot project.

## Project Context

### What This Project Is
A production-grade AI chatbot application built with Next.js and Vercel AI SDK that:
- Supports multiple AI models (OpenAI, Anthropic, Google, Deepseek)
- Implements intelligent context management and compression
- Provides real-time token monitoring and visualization
- Handles long conversations without hitting token limits
- Displays reasoning/thinking for supported models

### Technology Stack
- **Frontend**: Next.js 16.0.3 (App Router), React 19.2.0, Tailwind CSS v4
- **AI Integration**: Vercel AI SDK, AI Elements, Vercel AI Gateway
- **Language**: TypeScript 5.x
- **Package Manager**: npm
- **Key Libraries**: gpt-tokenizer, @ai-sdk/react, lucide-react, zod

## Critical Project Knowledge

### 1. Architecture Patterns

#### Chat Flow
```
User → PromptInput → handleSubmit → Context Check → Compression? → /api/chat → AI Gateway → Model → Stream Response → UI Update
```

#### Context Management
```
Messages → Token Counter (gpt-tokenizer) → Context Monitor UI
                    ↓ (if > 90%)
            Compression Trigger → /api/memory/compress
                    ↓
            Summary Generation (GPT-4o-mini)
                    ↓
            [System, Summary, ...Recent 4 messages]
```

### 2. Key Files and Their Roles

#### Core Application
- `app/page.tsx`: Main chatbot UI with context monitor
- `app/api/chat/route.ts`: Streaming API endpoint with custom reasoning handler
- `app/api/memory/compress/route.ts`: Memory compression endpoint

#### Utilities
- `lib/context-tracker.ts`: Token counting, usage calculation, model limits
- `lib/memory-manager.ts`: Compression logic, summarization
- `lib/utils.ts`: General utilities (cn() for className merging)

#### Components
- `components/ai-elements/`: AI-specific components (Conversation, Message, Reasoning, etc.)
- `components/ui/`: Base UI components (Button, Progress, Tooltip, etc.)

### 3. Important Constants

#### Model Context Limits (lib/context-tracker.ts)
```typescript
'openai/gpt-4o': 128_000
'openai/gpt-5-pro': 200_000
'anthropic/claude-sonnet-4.5': 200_000
'google/gemini-3-pro-preview': 1_000_000
```

#### Compression Settings (lib/memory-manager.ts)
```typescript
RECENT_MESSAGE_COUNT = 4
COMPRESSION_THRESHOLD = 90% of context limit
SUMMARIZATION_MODEL = 'gpt-4o-mini'
```

## Development Workflows

### Adding a New AI Model

1. **Update Model List** (`app/page.tsx`):
```typescript
const models = [
  // ...existing models
  {
    name: 'New Model Name',
    value: 'provider/model-id',
  },
];
```

2. **Add Context Limit** (`lib/context-tracker.ts`):
```typescript
export const MODEL_CONTEXT_LIMITS: Record<string, number> = {
  // ...existing limits
  'provider/model-id': 128_000,
};
```

3. **Test**:
- Select the model in the UI
- Send messages and verify responses
- Check context monitor updates correctly
- Test reasoning display if applicable

### Modifying Compression Logic

1. **Adjust Threshold** (`lib/context-tracker.ts`):
```typescript
isWarning: percentage > 80,  // Change warning threshold
isDanger: percentage > 90,   // Change critical threshold
```

2. **Change Preserved Messages** (`lib/memory-manager.ts`):
```typescript
export const RECENT_MESSAGE_COUNT = 4; // Increase/decrease as needed
```

3. **Update Summarization Model**:
```typescript
model: 'gpt-4o-mini', // Or use a different model
```

### Fixing Type Errors

#### Common Issue: AI Elements Type Mismatches
AI Elements components may have broader state types than the SDK exports. Solutions:
- Extend types locally: `type ExtendedState = ToolUIPart["state"] | "custom-state"`
- Use type assertions: `(state as any) === "custom-state"`
- Add `@ts-ignore` comments sparingly

#### UIMessage Type Issues
Always import from 'ai':
```typescript
import type { UIMessage } from 'ai';
```

Messages have `parts` array, not `content`:
```typescript
message.parts.map(part => part.text) // ✓ Correct
message.content // ✗ Wrong
```

## Mandatory Practices

### 1. Progress Tracker Updates

**After completing significant work, update `docs/PROGRESS_TRACKER.md`.**

#### After a Session:
1. Open `docs/PROGRESS_TRACKER.md`
2. Add session highlights to the current milestone section
3. Update completion percentages and task statuses
4. Document major features added or bugs fixed
5. Include session date and key accomplishments

#### Example Session Entry:
```markdown
**Session 5 (January 24, 2025):**
- ✅ Implemented semantic search with pgvector
- ✅ Added RAG context injection to chat API
- ✅ Created source citation component
- 🐛 Fixed: Vector search returning duplicates
```

### 2. README and Backlog Updates

When adding features:
- Update `docs/README.md` if it affects setup/usage or adds user-facing functionality
- Add to `docs/product-backlog.md` if deferring enhancements or planning future work
- Update inline code comments for complex logic

### 3. Type Safety

- Never use `any` without justification
- Prefer type assertions over suppressions
- Document type workarounds with comments
- Import types explicitly from their packages

### 4. Testing Checklist

Before marking tasks complete:
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes (or new errors justified)
- [ ] UI renders without console errors
- [ ] Context monitor updates correctly
- [ ] Model switching works
- [ ] Reasoning displays for thinking models

## Common Pitfalls

### 1. SDK Reasoning Validation
**Problem**: AI SDK drops reasoning parts for non-OpenAI models.
**Solution**: Use custom stream handler in `/api/chat/route.ts` to bypass validation.

### 2. useChat API Configuration
**Problem**: `useChat({ api: '/api/chat' })` throws type error.
**Solution**: Remove `api` parameter; SDK uses default route.

### 3. Message Structure
**Problem**: Accessing `message.content` instead of `message.parts`.
**Solution**: Always use `message.parts.map(part => ...)` pattern.

### 4. Token Count Accuracy
**Problem**: Character-based heuristics are inaccurate.
**Solution**: Use `gpt-tokenizer` with model-specific encodings.

### 5. Compression State Management
**Problem**: React state updates during compression cause race conditions.
**Solution**: Use functional updates: `setMessages(prev => compressedMessages)`.

## AI Agent Behavior Guidelines

### When Working on This Project

1. **Check the PROGRESS_TRACKER** before starting work to understand recent changes
2. **Read the product backlog** to avoid implementing deferred features
3. **Consult this file** for architecture decisions and patterns
4. **Update relevant docs** (README, PROGRESS_TRACKER, agents.md) when making significant changes
5. **Test with multiple models** (OpenAI, Claude, Gemini) to ensure cross-compatibility

### Code Style Preferences

- Use TypeScript strict mode
- Prefer functional components and hooks
- Use async/await over .then()
- Keep functions small and focused
- Add JSDoc comments for exported functions
- Use meaningful variable names (no single letters except loop counters)

### Git Workflow

1. Make changes
2. Run `npm run build` and `npm run lint`
3. Fix any errors
4. Commit with descriptive message
5. After session: Update `docs/PROGRESS_TRACKER.md` with accomplishments

### Example Commit Message
```
feat: Add GPT-5.5 model support

- Added gpt-5.5 to model selector
- Updated context limits for new model
- Tested reasoning display functionality

Files modified:
- app/page.tsx (model selector)
- lib/context-tracker.ts (context limits)
```

## Context Compression Strategy

### Why It Exists
AI models have token limits. Long conversations exceed these limits, causing:
- API errors
- Truncated context
- Lost conversation history

### How It Works
1. **Monitor**: Track token usage in real-time
2. **Warn**: Alert user at 70% and 90% thresholds  
3. **Compress**: At 90%, automatically summarize old messages
4. **Preserve**: Keep system prompt + last 4 messages intact
5. **Continue**: User continues chatting seamlessly

### Implementation Details

**Token Counting** (`lib/context-tracker.ts`):
- Uses `gpt-tokenizer` for precise counts
- Handles text, reasoning, and tool parts
- Segments usage by System/History/Input

**Compression Logic** (`lib/memory-manager.ts`):
- Triggers at 90% usage
- Preserves system message + recent buffer
- Summarizes middle chunk using GPT-4o-mini
- Returns: `[System, Summary, ...Recent]`

**API Integration** (`app/api/memory/compress/route.ts`):
- Accepts messages array
- Calls OpenAI for summarization
- Returns compressed messages + summary text

## Reasoning Display Implementation

### The Problem
The AI SDK has validation that only allows reasoning parts for OpenAI models:
```typescript
// SDK internal logic (simplified)
if (chunk.type === 'reasoning-delta' && !isOpenAIModel(model)) {
  console.warn('Non-OpenAI reasoning parts not supported. Skipping...');
  return; // Drops the reasoning chunk
}
```

### The Solution
We bypass the SDK's `toUIMessageStreamResponse()` and use custom streaming:

```typescript
// app/api/chat/route.ts
const stream = new ReadableStream({
  async start(controller) {
    for await (const chunk of result.fullStream) {
      // Forward ALL chunks including reasoning
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
    }
  },
});
```

This ensures reasoning parts from Claude, Gemini, and Deepseek are sent to the UI.

### UI Rendering
The UI automatically handles reasoning parts:

```tsx
case 'reasoning':
  return (
    <Reasoning isStreaming={...}>
      <ReasoningTrigger />
      <ReasoningContent>{part.text}</ReasoningContent>
    </Reasoning>
  );
```

## SuperMemory.ai Integration (Future)

### Purpose
Long-term memory across multiple conversations and sessions.

### Difference from Context Compression
- **Context Compression**: Manages single conversation within token limits (session-scoped)
- **SuperMemory**: Remembers facts across all conversations forever (user-scoped)

### Planned Integration
- Store user preferences, project details, and decisions
- Retrieve relevant memories when starting new chats
- Inject context: "User is building Bobo with Next.js and prefers Tailwind"
- Reduce token usage by avoiding redundant context

See `product-backlog.md` for implementation timeline.

## Environment Variables

### Required
- `AI_GATEWAY_API_KEY`: Vercel AI Gateway API key

### Optional
- `AI_SDK_LOG_WARNINGS`: Set to `false` to disable SDK warnings (we do this in the API route)

## Performance Considerations

### Token Counting
- Client-side tokenization has ~1-2ms overhead per message
- Negligible for conversations < 100 messages
- Consider memoization for very long threads

### Compression Latency
- Summarization takes 1-3 seconds
- User sees "Compressing history..." indicator
- Happens at 90% to avoid blocking every message

### API Costs
- Summarization uses gpt-4o-mini ($0.15/1M input tokens, $0.60/1M output)
- Typical summary: 2k input, 200 output = ~$0.0005 per compression
- Negligible compared to main model costs

## Troubleshooting

### Build Fails
1. Check `npm run lint` for TypeScript errors
2. Clear `.next` folder: `rm -rf .next`
3. Reinstall dependencies: `rm -rf node_modules && npm install`

### Reasoning Not Showing
1. Verify model supports reasoning (check logs for reasoning-delta chunks)
2. Check custom stream handler in `/api/chat/route.ts`
3. Inspect browser DevTools Network tab for SSE stream
4. Ensure `<Reasoning>` component is imported and rendered

### Context Monitor Not Updating
1. Check `getContextUsage` is called after `useChat` hook
2. Verify `messages` and `input` are being tracked
3. Check `MODEL_CONTEXT_LIMITS` includes your selected model
4. Inspect component props in React DevTools

### Compression Not Triggering
1. Check token usage is actually > 90%
2. Verify `/api/memory/compress` route exists
3. Check for errors in browser console
4. Ensure `setMessages` is being called with compressed array

## Code Patterns to Follow

### Token Counting
```typescript
import { encodeChat } from 'gpt-tokenizer/model/gpt-4o';

const tokens = encodeChat(messages);
const count = tokens.length;
```

### State Updates During Compression
```typescript
// ✓ Correct - functional update
setMessages(prev => compressedMessages);

// ✗ Wrong - direct set during async
await compress();
setMessages(compressedMessages); // May cause race condition
```

### Error Handling
```typescript
try {
  // API call
} catch (error) {
  console.error('Descriptive context:', error);
  return { error: error instanceof Error ? error.message : 'Generic error' };
}
```

## Quick Reference

### File Locations
- Main UI: `app/page.tsx`
- Chat API: `app/api/chat/route.ts`
- Context logic: `lib/context-tracker.ts`
- Compression logic: `lib/memory-manager.ts`
- Progress: `docs/PROGRESS_TRACKER.md`
- Backlog: `docs/PRODUCT_BACKLOG.md`

### Common Commands
```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # Check for errors
npm install <pkg>    # Add dependency
```

### Key Components
- `<Conversation>`: Chat container
- `<Message>`: Individual message display
- `<PromptInput>`: User input with attachments/tools
- `<Reasoning>`: Collapsible thinking display
- `<Progress>`: Context usage bar

## Progress Tracking

### Session-Level Documentation

This project tracks progress at the **session level** rather than commit level.

#### After Completing Work:
1. Make code changes and commit as needed
2. **After your session**, open `docs/PROGRESS_TRACKER.md`
3. Add session entry with:
   - Date
   - Features added
   - Bugs fixed
   - Tasks completed
   - Milestone progress updates

#### Example Session Entry:
```markdown
**Session 5 (January 24, 2025):**
- ✅ Implemented semantic search with pgvector (M2-RAG-1, M2-RAG-2)
- ✅ Added RAG context injection to chat API
- ✅ Created source citation component
- 🐛 Fixed: Vector search returning duplicate chunks
- Progress: M2 now 56% complete (10/18 tasks)
```

#### Why This Approach:
- Solo developer workflow (not team collaboration)
- Focus on milestones and sessions, not individual commits
- Single source of truth for progress
- Cleaner than commit-by-commit changelog
- Better for tracking velocity and completion

**Update PROGRESS_TRACKER after each work session, not after every commit.**

## Version History Management

### Milestone-Based Versioning

This project uses milestone-based versioning tracked in PROGRESS_TRACKER:

#### V1.0 - Persistence Foundation
- Database integration
- Project CRUD
- Chat persistence
- Full data persistence (no mocks)

#### V1.1 - Bug Fixes & Polish
- Critical bug fixes
- UX improvements
- Documentation cleanup

#### M2 - Project Intelligence (In Progress)
- Custom instructions
- File upload & storage
- RAG pipeline with semantic search

### Release Process
1. Complete all milestone tasks
2. Update `docs/PROGRESS_TRACKER.md` with completion status
3. Update version in `package.json` if shipping
4. Tag release: `git tag v1.0.0`
5. Push with tags: `git push --tags`

## Debugging Guide

### Enable Verbose Logging
```typescript
// In app/api/chat/route.ts
console.log('Messages received:', messages.length);
console.log('Token count:', tokensUsed);
console.log('Model:', model);
```

### Inspect Stream Events
```typescript
// In browser console
// Monitor SSE events in Network tab → filter by 'chat' → Preview tab
```

### Check Context State
```typescript
// In app/page.tsx
useEffect(() => {
  console.log('Context usage:', contextUsage);
}, [contextUsage]);
```

## Best Practices for AI Agents

### When Making Changes
1. ✅ Read this file (`agents.md`) first for architecture context
2. ✅ Check `PROGRESS_TRACKER.md` for recent changes and patterns
3. ✅ Consult `PRODUCT_BACKLOG.md` for deferred features (don't duplicate work)
4. ✅ Make your code changes
5. ✅ Test with multiple models (GPT-4o, Claude, Gemini minimum)
6. ✅ Commit code changes
7. ✅ **After session: Update `docs/PROGRESS_TRACKER.md`** with accomplishments
8. ✅ **Update `docs/agents.md`** if architecture/patterns changed
9. ✅ Update `docs/README.md` if user-facing changes

### When Debugging
1. ✅ Check browser console for client errors
2. ✅ Check server logs for API errors
3. ✅ Inspect Network tab for failed requests
4. ✅ Verify environment variables are loaded
5. ✅ Test in both dev and production builds

### When Adding Features
1. ✅ Check if it's already in the backlog (don't duplicate)
2. ✅ Consider impact on token usage
3. ✅ Update context monitor if it affects tokens
4. ✅ Test compression with the new feature
5. ✅ Document in README if user-facing

### Communication Style
- Be concise and technical
- Provide code examples
- Reference file paths with line numbers
- Explain "why" not just "what"
- Ask for clarification when ambiguous

## Project Evolution

### V1 (Current)
- ✅ Multi-model support
- ✅ Context monitoring
- ✅ Automatic compression
- ✅ Reasoning display (all models)
- ✅ File attachments
- ✅ Web search

### V2 (Planned - See product-backlog.md)
- ⏳ SuperMemory.ai integration
- ⏳ Vector-based context retrieval (RAG)
- ⏳ Background async compression
- ⏳ Persistent conversation storage
- ⏳ Cost tracking and budgets
- ⏳ Multi-user support

## Contact & Support

### For AI Agents
- Primary reference: This file (`agents.md`)
- Technical details: `docs/README.md`
- Feature roadmap: `docs/PRODUCT_BACKLOG.md`
- History: `docs/PROGRESS_TRACKER.md`

### For Developers
- Issues: Track in project management tool
- Questions: Review documentation first
- Suggestions: Add to product backlog

---

---

## Documentation Update Policy

### What to Update in agents.md

When committing changes, update this file if you:

1. **Added new architecture patterns**
   - New API routes
   - New state management patterns
   - New data flow diagrams

2. **Modified key files or their roles**
   - Changed file organization
   - Moved logic between files
   - Added new utility modules

3. **Introduced new development workflows**
   - New model integration process
   - Changed compression strategy
   - Updated testing procedures

4. **Fixed recurring issues**
   - Add to "Common Pitfalls" section
   - Document the solution
   - Explain why it happened

5. **Changed dependencies or tools**
   - Updated "Technology Stack"
   - Document new libraries
   - Explain integration approach

6. **Modified mandatory practices**
   - Changed git workflow
   - Updated code style guidelines
   - Altered testing requirements

### What NOT to Update

- Minor bug fixes that don't change patterns
- Code refactoring without architectural impact
- Dependency version bumps
- Cosmetic UI changes

### Always Update
- **Last Updated** date (bottom of file)
- **Document Version** if major restructuring
- **Project Version** if releasing

---

**Last Updated**: 2024-11-21  
**Document Version**: 1.0  
**Project Version**: 0.1.0 (Unreleased)

**Reminder**: This file must be reviewed and updated with every commit that changes architecture, workflows, or adds new patterns. Treat it as a living document that evolves with the codebase.

