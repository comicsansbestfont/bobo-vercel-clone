# Similar Questions Context Injection (M3.13-08)

## Overview

Automatically surfaces similar questions the user has asked in previous conversations when they ask a new question. This helps the AI:
- Maintain consistency across answers
- Build on previous explanations
- Reference past discussions
- Avoid unnecessary repetition

## Architecture

### Question Detection (`isQuestion()`)

Located in: `/lib/ai/similar-questions.ts`

**Detection criteria:**
1. Contains '?' character
2. Starts with question words (case-insensitive):
   - What, Why, How, When, Where, Who, Which
   - Can, Should, Would, Could, Will, Shall
   - Is, Are, Am, Was, Were
   - Do, Does, Did, Have, Has, Had

**Examples:**
```typescript
isQuestion("What is AI?") // true
isQuestion("How does this work") // true (no ? needed if starts with question word)
isQuestion("This is a statement.") // false
```

### Similar Questions Search (`getSimilarQuestions()`)

Located in: `/lib/ai/similar-questions.ts`

**Process:**
1. Generate embedding for user's question
2. Call `enhanced_memory_search` RPC with `p_memory_type='question'` filter
3. Returns top 3 similar questions from `memory_entries` table
4. Uses same temporal weighting as general memory search:
   - 45% vector similarity
   - 15% text (BM25)
   - 20% recency
   - 10% frequency
   - 10% importance

**Function signature:**
```typescript
async function getSimilarQuestions(
  query: string,
  limit: number = 3
): Promise<SimilarQuestion[]>
```

**Return type:**
```typescript
interface SimilarQuestion {
  id: string;
  content: string;
  context?: string; // Category info
  similarity: number; // Combined score
  created_at: string;
}
```

### Context Injection

Located in: `/lib/ai/chat/context-builder.ts`

**Integration points:**
1. After identity context detection (line ~98)
2. Before project context loading (line ~132)
3. Injected into system prompt as markdown section

**Context format:**
```markdown
## Similar Questions You've Asked Before

1. How do I optimize React performance?
   Context: Category: work_context
2. What are best practices for state management?
   Context: Category: work_context
3. When should I use useMemo vs useCallback?
   Context: Category: brief_history

**NOTE:** These are questions you've asked in past conversations. Use them to:
- Maintain consistency in your answers
- Build on previous explanations
- Reference past discussions if relevant
- Avoid repeating yourself unnecessarily
```

## Error Handling

**Graceful degradation:**
- If `getSimilarQuestions()` throws error → Logs error, returns empty array
- If no similar questions found → No context added to prompt
- If RPC fails → Logs error, chat continues normally

**Key principle:** Similar questions feature is **additive only** - failures never break chat functionality.

## Database Requirements

### Schema
- `memory_entries.memory_type` column (TEXT, CHECK constraint)
- Values: 'fact' | 'question' | 'decision' | 'insight'
- Migration: `20251210000001_add_memory_type_tag_filters.sql`

### RPC Function
- `enhanced_memory_search()` with `p_memory_type` parameter
- Filters results where `memory_type = 'question'`
- Returns same structure as general memory search

## Usage Example

**User input:**
```
"How do I improve my TypeScript skills?"
```

**Detection:**
- `isQuestion()` returns `true` (starts with "How")

**Search:**
- Embedding generated for question
- RPC called with `p_memory_type='question'`
- Returns similar questions like:
  - "What are best practices for TypeScript?"
  - "How can I learn advanced TypeScript features?"

**Context injection:**
- Markdown section added to system prompt
- AI sees past questions and can reference them
- Provides consistent, progressive answers

## Testing

### Unit Tests
Location: `/tests/similar-questions.test.ts`

**Test coverage:**
- Question detection with '?'
- Question words (what, how, why, etc.)
- Modal verbs (can, should, would)
- To-be verbs (is, are, was)
- Do/have verbs (do, does, have)
- Non-questions (statements)
- Edge cases (empty, whitespace, case-insensitivity)

### Integration Testing

**Prerequisites:**
1. Database with `memory_type` column
2. Sample question entries in `memory_entries`
3. Enhanced search RPC function deployed

**Test scenario:**
```typescript
// 1. Insert test questions
await createMemory({
  content: "How do I deploy to Vercel?",
  memory_type: "question",
  category: "work_context",
  // ... other fields
});

// 2. Ask similar question
const similarQuestions = await getSimilarQuestions(
  "What's the best way to deploy on Vercel?",
  3
);

// 3. Verify results
expect(similarQuestions.length).toBeGreaterThan(0);
expect(similarQuestions[0].content).toContain("Vercel");
```

## Performance Considerations

**Embedding generation:**
- Cached by Vercel AI Gateway
- ~100-200ms for first-time queries
- Minimal latency for repeat queries

**RPC call:**
- pgvector index on `memory_entries.embedding`
- Typically <50ms for hybrid search
- Parallel with other context fetches (not blocking)

**Context size:**
- Max 3 questions returned
- ~200-500 tokens added to prompt
- Negligible impact on total context

## Monitoring

**Log points:**
```typescript
chatLogger.info('[SimilarQuestions] Question detected, fetching similar questions');
chatLogger.info('[SimilarQuestions] Added similar questions to context', { count: 3 });
chatLogger.info('[SimilarQuestions] No similar questions found');
chatLogger.error('[SimilarQuestions] Error fetching similar questions:', error);
```

**Metrics to track:**
- Question detection rate (% of messages that are questions)
- Similar question hit rate (% with matches)
- Average similarity scores
- Context injection latency

## Future Enhancements

1. **Time-based filtering:** Only show questions from last 30/60/90 days
2. **Thread awareness:** Prioritize questions from same thought thread
3. **Tag filtering:** Match questions with same tags
4. **User control:** Toggle feature on/off in settings
5. **Answer tracking:** Link to previous answers, not just questions
6. **Semantic clustering:** Group related questions before showing

## Related Documentation

- [M3.13 Sprint Plan](/docs/sprints/handover/HANDOVER_M313-01.md)
- [Memory Architecture](/docs/architecture/BRAIN_ARCHITECTURE.md)
- [Enhanced Memory Search](/docs/product/PRODUCT_BACKLOG.md#m36-02)
