# PostHog Analytics Implementation Guide

**Purpose:** Quick reference for instrumenting memory tool tracking
**Effort:** 2-3 hours for full implementation
**Priority:** Optional but recommended for product insights

---

## Quick Start: 3-Step Implementation

### Step 1: Create Analytics Wrapper (30 minutes)

Create file: `/lib/analytics/memory-events.ts`

```typescript
'use client';

import posthog from 'posthog-js';

export type MemoryToolName = 'search_memory' | 'remember_fact' | 'update_memory' | 'forget_memory';

export interface MemoryToolEvent {
  tool_name: MemoryToolName;
  tool_status: 'success' | 'failure';
  execution_time_ms: number;
  error_message?: string;
  [key: string]: unknown;
}

/**
 * Track memory tool execution with standard properties
 * Gracefully handles PostHog unavailability
 */
export function trackMemoryToolExecution(event: MemoryToolEvent) {
  if (typeof window === 'undefined') return; // Server-side guard

  try {
    posthog.capture('agent_tool_called', {
      tool_category: 'memory',
      timestamp: new Date().toISOString(),
      ...event,
    });
  } catch (error) {
    // Fail silently - analytics should never break the app
    console.debug('[Analytics] Failed to track event:', error);
  }
}

/**
 * Track confirmation dialog interactions
 */
export function trackConfirmationDialog(data: {
  tool_name: MemoryToolName;
  action: 'shown' | 'approved' | 'denied';
  execution_time_ms?: number;
}) {
  if (typeof window === 'undefined') return;

  try {
    const eventName =
      data.action === 'shown'
        ? 'tool_confirmation_shown'
        : data.action === 'approved'
          ? 'tool_confirmation_approved'
          : 'tool_confirmation_denied';

    posthog.capture(eventName, {
      tool_name: data.tool_name,
      confirmation_required: true,
      execution_time_ms: data.execution_time_ms,
    });
  } catch (error) {
    console.debug('[Analytics] Failed to track confirmation:', error);
  }
}
```

---

### Step 2: Update Memory Tools (60-90 minutes)

Edit: `/lib/agent-sdk/memory-tools.ts`

Add import at top:
```typescript
import { trackMemoryToolExecution, MemoryToolName } from '@/lib/analytics/memory-events';
```

Update each tool's execute function with timing:

**For `searchMemoryTool.execute()`:**
```typescript
execute: async ({
  query,
  category,
  limit = 5,
}: {
  query: string;
  category?: MemoryCategory;
  limit?: number;
}): Promise<string> => {
  const startTime = Date.now();
  try {
    memoryLogger.info(`[search_memory] Searching for: "${query}"`, {
      category,
      limit,
    });

    const embedding = await generateEmbedding(query);

    const { data: memories, error } = await supabase.rpc(
      'hybrid_memory_search',
      {
        query_embedding: embedding,
        query_text: query,
        match_count: limit,
        vector_weight: 0.7,
        text_weight: 0.3,
        p_user_id: DEFAULT_USER_ID,
        p_category: category ?? undefined,
      }
    );

    if (error) {
      memoryLogger.error('[search_memory] RPC error:', error);

      // Track failure
      trackMemoryToolExecution({
        tool_name: 'search_memory',
        tool_status: 'failure',
        execution_time_ms: Date.now() - startTime,
        error_message: error.message,
      });

      throw new Error(`Memory search failed: ${error.message}`);
    }

    if (!memories || memories.length === 0) {
      memoryLogger.info('[search_memory] No results found');

      // Track success (empty results)
      trackMemoryToolExecution({
        tool_name: 'search_memory',
        tool_status: 'success',
        execution_time_ms: Date.now() - startTime,
        results_count: 0,
        category_filter: category || null,
      });

      return 'No matching memories found.';
    }

    const results = (memories as MemorySearchResult[])
      .map(
        (m, i) =>
          `[${i + 1}] ${m.category}: "${m.content}" (id: ${m.id})`
      )
      .join('\n');

    memoryLogger.info(
      `[search_memory] Found ${memories.length} memories`
    );

    // Track success with result count
    trackMemoryToolExecution({
      tool_name: 'search_memory',
      tool_status: 'success',
      execution_time_ms: Date.now() - startTime,
      results_count: memories.length,
      category_filter: category || null,
      query_length: query.length,
    });

    return `Found ${memories.length} memories:\n${results}`;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    memoryLogger.error('[search_memory] Failed:', error);

    // Track failure
    trackMemoryToolExecution({
      tool_name: 'search_memory',
      tool_status: 'failure',
      execution_time_ms: Date.now() - startTime,
      error_message: errorMessage,
    });

    return `Memory search failed: ${errorMessage}. You can try again or suggest the user visit their Memory settings at /memory.`;
  }
},
```

**For `rememberFactTool.execute()`:**
```typescript
execute: async ({
  category,
  content,
  confidence = 0.8,
}: {
  category: MemoryCategory;
  content: string;
  confidence?: number;
}): Promise<string> => {
  const startTime = Date.now();
  try {
    memoryLogger.info(`[remember_fact] Storing: "${content}"`, {
      category,
      confidence,
    });

    const duplicates = await findSimilarMemories(content, 0.85);

    if (duplicates.length > 0) {
      const existing = duplicates[0];
      memoryLogger.info('[remember_fact] Duplicate found:', existing);

      // Track duplicate detection (success)
      trackMemoryToolExecution({
        tool_name: 'remember_fact',
        tool_status: 'success',
        execution_time_ms: Date.now() - startTime,
        memory_category: category,
        duplicate_detected: true,
        content_length: content.length,
      });

      return `Similar memory already exists in ${existing.category}: "${existing.content}". Use update_memory if you need to modify it. (id: ${existing.id})`;
    }

    const embedding = await generateEmbedding(content);
    const contentHash = generateContentHash(content);

    const memory = await createMemory({
      category,
      subcategory: null,
      content,
      summary: null,
      confidence,
      source_type: 'agent_tool',
      content_hash: contentHash,
      embedding,
      relevance_score: 1.0,
      source_chat_ids: [],
      source_project_ids: [],
      source_message_count: 1,
      time_period: 'current',
    });

    if (!memory) {
      throw new Error('Failed to create memory entry');
    }

    memoryLogger.info('[remember_fact] Memory created:', memory.id);

    // Track success
    trackMemoryToolExecution({
      tool_name: 'remember_fact',
      tool_status: 'success',
      execution_time_ms: Date.now() - startTime,
      memory_category: category,
      duplicate_detected: false,
      content_length: content.length,
      confidence: confidence,
    });

    return `Remembered: "${content}" in ${category} (id: ${memory.id})`;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    memoryLogger.error('[remember_fact] Failed:', error);

    // Track failure
    trackMemoryToolExecution({
      tool_name: 'remember_fact',
      tool_status: 'failure',
      execution_time_ms: Date.now() - startTime,
      error_message: errorMessage,
      memory_category: category,
    });

    return `Memory operation failed: ${errorMessage}. You can try again or suggest the user visit their Memory settings at /memory.`;
  }
},
```

**For `updateMemoryTool.execute()`:**
```typescript
execute: async ({
  memoryId,
  newContent,
  reason,
}: {
  memoryId: string;
  newContent: string;
  reason: string;
}): Promise<string> => {
  const startTime = Date.now();
  try {
    memoryLogger.info(`[update_memory] Updating memory: ${memoryId}`, {
      newContent,
      reason,
    });

    const existing = await getMemoryById(memoryId);

    if (!existing) {
      memoryLogger.warn('[update_memory] Memory not found:', memoryId);

      // Track not found error
      trackMemoryToolExecution({
        tool_name: 'update_memory',
        tool_status: 'failure',
        execution_time_ms: Date.now() - startTime,
        error_message: 'Memory not found',
      });

      return `Memory not found with ID: ${memoryId}. Use search_memory to find the correct ID first.`;
    }

    if (existing.source_type === 'manual') {
      memoryLogger.warn('[update_memory] Attempted to modify manual entry:', memoryId);

      // Track protected memory error
      trackMemoryToolExecution({
        tool_name: 'update_memory',
        tool_status: 'failure',
        execution_time_ms: Date.now() - startTime,
        error_message: 'Cannot modify manual entries',
        memory_category: existing.category,
      });

      return `Cannot modify manual memory entries. The user set this directly in their profile. They should update it via the Memory settings at /memory.`;
    }

    const oldContent = existing.content;

    await updateMemoryEntry(memoryId, {
      content: newContent,
      confidence: 1.0,
      updated_reason: reason,
    });

    memoryLogger.info('[update_memory] Memory updated successfully:', {
      memoryId,
      oldContent,
      newContent,
    });

    // Track success
    trackMemoryToolExecution({
      tool_name: 'update_memory',
      tool_status: 'success',
      execution_time_ms: Date.now() - startTime,
      memory_category: existing.category,
      content_length_old: oldContent.length,
      content_length_new: newContent.length,
    });

    return `Memory updated successfully.\n\nOld: "${oldContent}"\nNew: "${newContent}"\n\nReason: ${reason}`;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    memoryLogger.error('[update_memory] Failed:', error);

    // Track failure
    trackMemoryToolExecution({
      tool_name: 'update_memory',
      tool_status: 'failure',
      execution_time_ms: Date.now() - startTime,
      error_message: errorMessage,
    });

    return `Memory update failed: ${errorMessage}. You can try again or suggest the user visit their Memory settings at /memory.`;
  }
},
```

**For `forgetMemoryTool.execute()`:**
```typescript
execute: async ({
  memoryId,
  reason,
}: {
  memoryId: string;
  reason: string;
}): Promise<string> => {
  const startTime = Date.now();
  try {
    memoryLogger.info(`[forget_memory] Forgetting memory: ${memoryId}`, {
      reason,
    });

    const existing = await getMemoryById(memoryId);

    if (!existing) {
      memoryLogger.warn('[forget_memory] Memory not found:', memoryId);

      // Track not found error
      trackMemoryToolExecution({
        tool_name: 'forget_memory',
        tool_status: 'failure',
        execution_time_ms: Date.now() - startTime,
        error_message: 'Memory not found',
      });

      return `Memory not found with ID: ${memoryId}. Use search_memory to find the correct ID first.`;
    }

    if (existing.source_type === 'manual') {
      memoryLogger.warn('[forget_memory] Attempted to delete manual entry:', memoryId);

      // Track protected memory error
      trackMemoryToolExecution({
        tool_name: 'forget_memory',
        tool_status: 'failure',
        execution_time_ms: Date.now() - startTime,
        error_message: 'Cannot delete manual entries',
        memory_category: existing.category,
      });

      return `Cannot delete manual memory entries. The user set this directly in their profile. They should remove it via the Memory settings at /memory.`;
    }

    const deletedContent = existing.content;
    const deletedCategory = existing.category;

    const success = await softDeleteMemory(memoryId, reason);

    if (!success) {
      throw new Error('Soft delete operation failed');
    }

    memoryLogger.info('[forget_memory] Memory forgotten successfully:', {
      memoryId,
      content: deletedContent,
      reason,
    });

    // Track success
    trackMemoryToolExecution({
      tool_name: 'forget_memory',
      tool_status: 'success',
      execution_time_ms: Date.now() - startTime,
      memory_category: deletedCategory,
      content_length: deletedContent.length,
    });

    return `Memory forgotten: "${deletedContent}" (from ${deletedCategory})\n\nReason: ${reason}`;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    memoryLogger.error('[forget_memory] Failed:', error);

    // Track failure
    trackMemoryToolExecution({
      tool_name: 'forget_memory',
      tool_status: 'failure',
      execution_time_ms: Date.now() - startTime,
      error_message: errorMessage,
    });

    return `Memory deletion failed: ${errorMessage}. You can try again or suggest the user visit their Memory settings at /memory.`;
  }
},
```

---

### Step 3: Create Basic PostHog Insight (30 minutes)

Once events are flowing, create this insight in PostHog UI:

**Insight 1: Memory Tool Usage Trend**
- **Type:** Trend
- **Event:** agent_tool_called
- **Filter:** properties.tool_category = "memory"
- **Breakdown:** by properties.tool_name
- **Display:** Line chart with 30-day trend

**SQL Query (if needed):**
```sql
SELECT
  formatDateTime(timestamp, '%Y-%m-%d') as date,
  properties.tool_name as tool,
  count() as count
FROM events
WHERE event = 'agent_tool_called'
  AND properties.tool_category = 'memory'
GROUP BY date, tool
ORDER BY date DESC
```

---

## Testing Checklist

After implementing, verify:

- [ ] `memory-events.ts` created with no TypeScript errors
- [ ] `memory-tools.ts` imports tracking utility successfully
- [ ] All 4 memory tool functions have `trackMemoryToolExecution()` calls
- [ ] Error handling includes tracking for both success and failure
- [ ] Execution timing is captured with `Date.now() - startTime`
- [ ] PostHog library is initialized in dev environment
- [ ] Manual test: Search memory, check browser console for tracking calls
- [ ] Manual test: Create new memory, verify event in PostHog dashboard
- [ ] Verify no PostHog errors appear in browser console

---

## Verification Steps

### 1. Frontend Testing
```typescript
// In browser console after implementing:
posthog.capture('test_event', { test: true });
posthog.get_queue_length(); // Should be 0 if events sent
```

### 2. PostHog Dashboard
1. Login to PostHog
2. Go to "Events" view
3. Search for "agent_tool_called"
4. Verify recent events from your testing
5. Check properties include tool_name, tool_status, execution_time_ms

### 3. Create Test Insight
1. Create new Insight > Trend
2. Event: agent_tool_called
3. Filter: properties.tool_name = "search_memory"
4. Should show usage over past 7 days

---

## Performance Considerations

- Tracking adds ~1-2ms per tool execution
- PostHog client batches events (no per-event overhead)
- Graceful degradation if PostHog unavailable
- No blocking on analytics - async capture calls

---

## Rollback Plan

If tracking causes issues:
1. Remove tracking calls from memory-tools.ts
2. Keep `/lib/analytics/memory-events.ts` for future use
3. Memory tools continue working without events
4. No database migration required

---

## Common Issues & Solutions

### Issue: PostHog not capturing events
**Solution:** Verify posthog.init() called in provider, check API key

### Issue: TypeScript errors on imports
**Solution:** Ensure memory-events.ts has 'use client' directive

### Issue: Events not appearing in dashboard
**Solution:** Check PostHog project settings, wait 30-60 seconds for processing

### Issue: Tracking causing slow performance
**Solution:** Events are batched - should have minimal impact; profile with DevTools

---

## Next Steps

1. Implement this guide
2. Verify events flowing in PostHog
3. Create dashboards for product insights
4. Share metrics with team in sprint review
5. Iterate on tracking based on product questions

---

## Resources

- PostHog Docs: https://posthog.com/docs
- Event Capturing: https://posthog.com/docs/session-replay/web
- Insights & Analysis: https://posthog.com/docs/product-analytics/trends
- Project: `/lib/agent-sdk/memory-tools.ts`
