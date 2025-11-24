# Sprint M3-02 Handover Document

**Sprint:** M3-02 - Hierarchical Memory Extraction
**Duration:** December 1-7, 2025 (7 days, 16 hours capacity)
**Handover Date:** November 24, 2025
**Developer:** TBD
**Sprint Owner:** Sachee Perera (CTO)

---

## 📋 Quick Start Checklist

Before you begin, ensure you have:

- [ ] Read this handover document completely
- [ ] Reviewed [memory-schema.md](../../memory-schema.md) v2.0 (architecture overview)
- [ ] Reviewed [MEMORY_EXTRACTION_SYSTEM_SPEC.md](../../specs/MEMORY_EXTRACTION_SYSTEM_SPEC.md) (technical spec)
- [ ] Reviewed [sprint-m3-02.md](./sprint-m3-02.md) (sprint plan)
- [ ] Access to Supabase database
- [ ] OpenAI API key configured (for GPT-4o-mini)
- [ ] Development environment running (`npm run dev`)
- [ ] Completed Sprint M3-01 code reviewed (reference implementation)

---

## 🎯 Sprint Goal

**Build automatic Claude-style memory extraction with 6 hierarchical categories using GPT-4o-mini.**

You're implementing the automatic memory extraction pipeline that analyzes completed chats and extracts user facts into a hierarchical memory structure. This builds upon the manual profile foundation from M3-01.

### Success Criteria
✅ Database schema created with 6 hierarchical categories
✅ GPT-4o-mini extraction pipeline working end-to-end
✅ Background job extracts memories from completed chats
✅ Deduplication prevents duplicate memories
✅ Extracted memories appear in system prompts
✅ Weekly consolidation process runs successfully
✅ Cost per extraction < $0.001 (target: $0.00075)

---

## 📚 Context: What Was Done Before

### Sprint M3-01 (✅ Complete)
**Status:** All tasks complete, 4.5 hours actual (55% under estimate!)

**Deliverables:**
1. ✅ `user_profiles` table with RLS policies
2. ✅ `/settings/profile` page with 4 text fields (bio, background, preferences, technical_context)
3. ✅ GET/POST `/api/user/profile` endpoints
4. ✅ System prompt injection: "### ABOUT THE USER"
5. ✅ Memory schema v2.0 documentation

**Key Files to Reference:**
- `supabase/migrations/20251124000000_m3_phase1_user_profiles.sql` - Database schema example
- `app/settings/profile/page.tsx` - React form example
- `app/api/user/profile/route.ts` - API route example
- `app/api/chat/route.ts` (lines 280-295) - System prompt injection example
- `lib/db/queries.ts` (lines 56-87) - Database query functions example

**Test Report:** See `docs/reports/M3-01_TEST_REPORT.md` for testing approach

---

## 🗺️ Sprint M3-02 Architecture Overview

### System Flow

```
User completes chat
       ↓
Check: Auto-extraction enabled?
       ↓ (yes)
Trigger: POST /api/memory/extract
       ↓
Fetch last 20 messages from chat
       ↓
Call GPT-4o-mini with extraction prompt
       ↓
Parse JSON response → MemoryEntry[]
       ↓
Validate each extracted fact
       ↓
For each fact:
  - Calculate content_hash
  - Check for exact duplicates (hash match)
  - Check for fuzzy duplicates (>90% similarity)
  - Merge or create new entry
       ↓
Insert into memory_entries table
       ↓
Return success
```

### Weekly Consolidation Flow (Cron)

```
Every Sunday 3am (Vercel Cron)
       ↓
/api/cron/consolidate-memories
       ↓
Find duplicate memories (>90% similarity)
       ↓
Merge high-confidence duplicates
       ↓
Archive low-relevance memories (score < 0.2)
       ↓
Update time_period classifications
       ↓
Recalculate relevance scores (apply decay)
       ↓
Log consolidation event
```

---

## 📋 Task Breakdown (6 Tasks, 16 Hours)

### Task M3-17: Database Schema (2 hours)
**File:** `supabase/migrations/20251201000000_m3_phase2_memory_entries.sql`

**What to build:**
- `memory_entries` table with all columns (see spec)
- `memory_consolidation_log` table
- Indexes for performance (user_id, category, content_hash, content_trgm)
- Enable pg_trgm extension for fuzzy matching
- Row Level Security policies (users can CRUD own memories)

**Complete SQL:** See sprint-m3-02.md lines 92-148

**Testing:**
```sql
-- Test insert
INSERT INTO memory_entries (user_id, category, content, confidence, content_hash)
VALUES ('test-user-id', 'work_context', 'Software engineer', 0.95, 'hash123');

-- Test fuzzy search
SELECT id, content, similarity(content, 'Software engineer at Google') as sim
FROM memory_entries
WHERE similarity(content, 'Software engineer at Google') > 0.9;
```

**TypeScript types:** Update `lib/db/types.ts`:
```typescript
export interface MemoryEntry {
  id: string;
  user_id: string;
  category: MemoryCategory;
  subcategory: string | null;
  content: string;
  summary: string | null;
  confidence: number;
  source_type: 'manual' | 'extracted' | 'suggested';
  source_chat_ids: string[];
  source_project_ids: string[];
  source_message_count: number;
  time_period: 'current' | 'recent' | 'past' | 'long_ago';
  relevance_score: number;
  last_updated: Date;
  last_mentioned: Date;
  created_at: Date;
  content_hash: string;
}

export type MemoryCategory =
  | 'work_context'
  | 'personal_context'
  | 'top_of_mind'
  | 'brief_history'
  | 'long_term_background'
  | 'other_instructions';
```

---

### Task M3-18: GPT-4o-mini Extraction Pipeline (4 hours)
**File:** `lib/memory/extractor.ts`

**What to build:**
Main extraction function that takes a chat_id and returns extracted memories.

**Implementation outline:**
```typescript
// lib/memory/extractor.ts

import { openai } from '@/lib/openai';

export async function extractMemoriesFromChat(
  chatId: string
): Promise<MemoryEntry[]> {
  try {
    // 1. Fetch recent messages (last 20)
    const messages = await getChatMessages(chatId, { limit: 20 });

    // 2. Format for GPT-4o-mini
    const formattedMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      id: msg.id,
    }));

    // 3. Call GPT-4o-mini
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
        { role: 'user', content: JSON.stringify(formattedMessages) },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1, // Low for consistency
    });

    // 4. Parse response
    const extracted = JSON.parse(completion.choices[0].message.content);

    // 5. Validate
    const validated = extracted.facts.filter(validateFact);

    // 6. Deduplicate
    const deduplicated = await deduplicateFacts(validated);

    // 7. Store
    const stored = await storeMemories(deduplicated, chatId);

    return stored;
  } catch (error) {
    console.error('Memory extraction failed:', error);
    return []; // Graceful degradation
  }
}
```

**System prompt:** Full prompt is in MEMORY_EXTRACTION_SYSTEM_SPEC.md lines 30-260.

**Copy the entire system prompt from the spec** - it's critical for quality extraction.

**Validation function:**
```typescript
const validateFact = (fact: ExtractedFact): boolean => {
  if (!fact.category || !fact.content || !fact.confidence) return false;
  if (fact.confidence < 0.5 || fact.confidence > 1.0) return false;
  if (fact.content.length < 10 || fact.content.length > 500) return false;

  const validCategories = [
    'work_context', 'personal_context', 'top_of_mind',
    'brief_history', 'long_term_background', 'other_instructions'
  ];
  if (!validCategories.includes(fact.category)) return false;

  return true;
};
```

**Testing:**
```typescript
// Test with sample messages
const testMessages = [
  { role: 'user', content: 'I am a software engineer at Google' }
];

const memories = await extractMemoriesFromChat('test-chat-id');
console.log(memories); // Should extract work_context memory
```

---

### Task M3-19: Background Job Trigger (3 hours)
**File:** `app/api/memory/extract/route.ts`

**What to build:**
API endpoint that triggers extraction after chat completes.

**Implementation:**
```typescript
// app/api/memory/extract/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { extractMemoriesFromChat } from '@/lib/memory/extractor';
import { getUserMemorySettings } from '@/lib/db/queries';

export async function POST(req: NextRequest) {
  try {
    const { chat_id } = await req.json();

    // 1. Check if auto-extraction enabled
    const settings = await getUserMemorySettings();
    if (!settings.auto_extraction_enabled) {
      return NextResponse.json({ skipped: true, reason: 'disabled' });
    }

    // 2. Check debounce (last extraction > 5 min ago)
    const lastExtraction = await getLastExtraction(chat_id);
    if (lastExtraction && Date.now() - lastExtraction.created_at < 5 * 60 * 1000) {
      return NextResponse.json({ skipped: true, reason: 'debounce' });
    }

    // 3. Extract memories
    const memories = await extractMemoriesFromChat(chat_id);

    // 4. Return result
    return NextResponse.json({
      success: true,
      extracted: memories.length,
      memories: memories.map(m => ({ id: m.id, content: m.content })),
    });
  } catch (error) {
    console.error('Extraction API error:', error);
    return NextResponse.json(
      { error: 'Extraction failed' },
      { status: 500 }
    );
  }
}
```

**Trigger from chat API:**
Modify `app/api/chat/route.ts` after streaming completes:

```typescript
// In /app/api/chat/route.ts
// After streaming completes and message is saved

// Queue memory extraction (non-blocking)
fetch('/api/memory/extract', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ chat_id: currentChatId }),
}).catch(err => console.error('Failed to queue extraction:', err));
```

**Memory settings table:**
```sql
CREATE TABLE memory_settings (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  auto_extraction_enabled BOOLEAN DEFAULT false,
  extraction_frequency TEXT DEFAULT 'realtime'
    CHECK (extraction_frequency IN ('realtime', 'daily', 'weekly', 'manual')),
  enabled_categories TEXT[] DEFAULT ARRAY[
    'work_context', 'personal_context', 'top_of_mind',
    'brief_history', 'long_term_background', 'other_instructions'
  ],
  token_budget INT DEFAULT 500,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Testing:**
1. Enable auto-extraction in settings
2. Complete a chat with factual statements
3. Check POST /api/memory/extract is called
4. Verify memories inserted into database

---

### Task M3-20: Deduplication Logic (2 hours)
**File:** `lib/memory/deduplicator.ts`

**What to build:**
Functions to detect and merge duplicate memories.

**Implementation:**
```typescript
// lib/memory/deduplicator.ts

import crypto from 'crypto';
import { supabase } from '@/lib/supabase';

export const generateContentHash = (content: string): string => {
  return crypto
    .createHash('sha256')
    .update(content.toLowerCase().trim())
    .digest('hex');
};

export async function findExactDuplicate(
  userId: string,
  category: string,
  contentHash: string
): Promise<MemoryEntry | null> {
  const { data } = await supabase
    .from('memory_entries')
    .select('*')
    .eq('user_id', userId)
    .eq('category', category)
    .eq('content_hash', contentHash)
    .single();

  return data;
}

export async function findFuzzyDuplicates(
  userId: string,
  category: string,
  content: string,
  threshold = 0.9
): Promise<MemoryEntry[]> {
  const { data } = await supabase.rpc('find_similar_memories', {
    p_user_id: userId,
    p_category: category,
    p_content: content,
    p_threshold: threshold,
  });

  return data || [];
}

export async function mergeDuplicateMemories(
  existing: MemoryEntry,
  newMemory: Partial<MemoryEntry>
): Promise<MemoryEntry> {
  if (newMemory.confidence > existing.confidence) {
    // New is more confident, replace content but keep sources
    return await supabase
      .from('memory_entries')
      .update({
        content: newMemory.content,
        confidence: newMemory.confidence,
        source_chat_ids: [
          ...existing.source_chat_ids,
          ...newMemory.source_chat_ids,
        ],
        source_message_count: existing.source_message_count + 1,
        last_mentioned: new Date(),
        last_updated: new Date(),
      })
      .eq('id', existing.id)
      .select()
      .single();
  } else {
    // Existing is more confident, just add source
    return await supabase
      .from('memory_entries')
      .update({
        source_chat_ids: [
          ...existing.source_chat_ids,
          ...newMemory.source_chat_ids,
        ],
        source_message_count: existing.source_message_count + 1,
        last_mentioned: new Date(),
      })
      .eq('id', existing.id)
      .select()
      .single();
  }
}

export async function deduplicateFacts(
  facts: ExtractedFact[]
): Promise<MemoryEntry[]> {
  const results: MemoryEntry[] = [];

  for (const fact of facts) {
    const contentHash = generateContentHash(fact.content);

    // Check exact duplicate
    const exactDupe = await findExactDuplicate(
      userId,
      fact.category,
      contentHash
    );

    if (exactDupe) {
      // Merge with existing
      const merged = await mergeDuplicateMemories(exactDupe, {
        ...fact,
        content_hash: contentHash,
      });
      results.push(merged);
      continue;
    }

    // Check fuzzy duplicates
    const fuzzyDupes = await findFuzzyDuplicates(
      userId,
      fact.category,
      fact.content
    );

    if (fuzzyDupes.length > 0) {
      // Merge with best match
      const bestMatch = fuzzyDupes[0];
      const merged = await mergeDuplicateMemories(bestMatch, {
        ...fact,
        content_hash: contentHash,
      });
      results.push(merged);
      continue;
    }

    // No duplicate, create new
    const newMemory = await createMemory({
      ...fact,
      content_hash: contentHash,
    });
    results.push(newMemory);
  }

  return results;
}
```

**PostgreSQL function for fuzzy search:**
```sql
-- Create RPC function for fuzzy matching
CREATE OR REPLACE FUNCTION find_similar_memories(
  p_user_id UUID,
  p_category TEXT,
  p_content TEXT,
  p_threshold FLOAT DEFAULT 0.9
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  similarity_score FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.content,
    similarity(m.content, p_content) as similarity_score
  FROM memory_entries m
  WHERE m.user_id = p_user_id
    AND m.category = p_category
    AND similarity(m.content, p_content) > p_threshold
  ORDER BY similarity_score DESC;
END;
$$ LANGUAGE plpgsql;
```

**Testing:**
```typescript
// Test exact duplicate
const hash1 = generateContentHash('Software engineer at Google');
const hash2 = generateContentHash('software engineer at google'); // same hash
assert(hash1 === hash2);

// Test fuzzy match
const similar = await findFuzzyDuplicates(userId, 'work_context', 'Senior SWE at Google');
// Should find "Senior software engineer at Google" (>90% similar)
```

---

### Task M3-21: System Prompt Injection (2 hours)
**File:** `app/api/chat/route.ts`

**What to modify:**
Update the existing prompt injection logic to include automatic memories.

**Current code (M3-01):** Lines 280-295
```typescript
// Fetch user profile (M3-01)
let userProfileContext = '';
try {
  const profile = await getUserProfile();
  if (profile) {
    const parts = [];
    if (profile.bio) parts.push(`BIO:\n${profile.bio}`);
    if (profile.background) parts.push(`BACKGROUND:\n${profile.background}`);
    if (profile.preferences) parts.push(`PREFERENCES:\n${profile.preferences}`);
    if (profile.technical_context) parts.push(`TECHNICAL CONTEXT:\n${profile.technical_context}`);

    if (parts.length > 0) {
      userProfileContext = `\n\n### ABOUT THE USER\n${parts.join('\n\n')}`;
    }
  }
} catch (err) {
  // Silent fail
}
```

**Add after this (M3-02):**
```typescript
// Fetch automatic memories (M3-02)
let userMemoryContext = '';
try {
  const memories = await getUserMemories({ relevance_threshold: 0.2 });

  if (memories.length > 0) {
    const sections: Record<string, string[]> = {
      work_context: [],
      personal_context: [],
      top_of_mind: [],
      brief_history: [],
      long_term_background: [],
      other_instructions: [],
    };

    // Group by category
    for (const memory of memories) {
      sections[memory.category].push(`- ${memory.content}`);
    }

    const parts = [];
    if (sections.work_context.length > 0) {
      parts.push(`WORK CONTEXT:\n${sections.work_context.slice(0, 5).join('\n')}`);
    }
    if (sections.personal_context.length > 0) {
      parts.push(`PERSONAL CONTEXT:\n${sections.personal_context.slice(0, 5).join('\n')}`);
    }
    if (sections.top_of_mind.length > 0) {
      parts.push(`TOP OF MIND:\n${sections.top_of_mind.slice(0, 5).join('\n')}`);
    }
    // ... repeat for other categories

    if (parts.length > 0) {
      userMemoryContext = `\n\n### USER MEMORY (Automatic)\n${parts.join('\n\n')}`;
    }
  }
} catch (err) {
  console.error('Failed to fetch user memories:', err);
}

// Combine manual profile + automatic memory
const fullUserContext = userProfileContext + userMemoryContext;

// Inject into system prompt (existing logic)
const systemPrompt = `${baseSystemPrompt}${fullUserContext}\n\n${projectContext}${inspirationContext}`;
```

**Database query:**
```typescript
// lib/db/queries.ts

export async function getUserMemories({
  relevance_threshold = 0.2,
  limit = 50,
}: {
  relevance_threshold?: number;
  limit?: number;
} = {}): Promise<MemoryEntry[]> {
  const { data, error } = await supabase
    .from('memory_entries')
    .select('*')
    .eq('user_id', DEFAULT_USER_ID)
    .gte('relevance_score', relevance_threshold)
    .order('relevance_score', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching memories:', error);
    return [];
  }

  return data;
}
```

**Token budget check:**
```typescript
// Ensure total doesn't exceed 500 tokens
const estimatedTokens = Math.ceil(fullUserContext.length / 4);
if (estimatedTokens > 500) {
  console.warn(`User context exceeds budget: ${estimatedTokens} tokens`);
  // Truncate or filter memories by relevance
}
```

**Testing:**
1. Create some extracted memories in database
2. Start new chat
3. Inspect POST /api/chat request → system prompt
4. Verify "### USER MEMORY" section present
5. Ask AI "What do you know about me?" → Should mention extracted facts

---

### Task M3-22: Weekly Consolidation (3 hours)
**File:** `app/api/cron/consolidate-memories/route.ts`

**What to build:**
Vercel Cron job that runs weekly to clean up memories.

**Implementation:**
```typescript
// app/api/cron/consolidate-memories/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const users = await getAllUsersWithMemories();

    let totalDuplicatesMerged = 0;
    let totalArchived = 0;

    for (const user of users) {
      const result = await consolidateUserMemories(user.id);
      totalDuplicatesMerged += result.duplicates_merged;
      totalArchived += result.memories_archived;
    }

    return NextResponse.json({
      success: true,
      users_processed: users.length,
      duplicates_merged: totalDuplicatesMerged,
      memories_archived: totalArchived,
    });
  } catch (error) {
    console.error('Consolidation failed:', error);
    return NextResponse.json(
      { error: 'Consolidation failed' },
      { status: 500 }
    );
  }
}

async function consolidateUserMemories(userId: string) {
  console.log(`[Consolidation] Starting for user ${userId}`);

  // 1. Find duplicates
  const duplicates = await findAllDuplicates(userId);
  console.log(`[Consolidation] Found ${duplicates.length} duplicate pairs`);

  let mergedCount = 0;
  for (const [mem1, mem2] of duplicates) {
    if (mem1.confidence > 0.7 && mem2.confidence > 0.7) {
      await mergeDuplicateMemories(mem1, mem2);
      mergedCount++;
    }
  }

  // 2. Archive low-relevance
  const lowRelevance = await supabase
    .from('memory_entries')
    .select('*')
    .eq('user_id', userId)
    .lt('relevance_score', 0.2);

  const archivedCount = lowRelevance.data?.length || 0;
  if (archivedCount > 0) {
    await supabase
      .from('memory_entries')
      .delete()
      .eq('user_id', userId)
      .lt('relevance_score', 0.2);
  }

  // 3. Update time periods
  await updateTimePeriods(userId);

  // 4. Recalculate relevance scores
  await recalculateRelevanceScores(userId);

  // 5. Log consolidation
  await supabase.from('memory_consolidation_log').insert({
    user_id: userId,
    duplicates_merged: mergedCount,
    memories_archived: archivedCount,
  });

  return {
    duplicates_merged: mergedCount,
    memories_archived: archivedCount,
  };
}

async function recalculateRelevanceScores(userId: string) {
  const memories = await supabase
    .from('memory_entries')
    .select('*')
    .eq('user_id', userId);

  for (const memory of memories.data || []) {
    const daysSince = getDaysSince(memory.last_mentioned);
    const newScore = decayConfidence(
      memory.confidence,
      daysSince,
      memory.category
    );

    await supabase
      .from('memory_entries')
      .update({ relevance_score: newScore })
      .eq('id', memory.id);
  }
}

function decayConfidence(
  originalConfidence: number,
  daysSinceLastMentioned: number,
  category: MemoryCategory
): number {
  const decayRates = {
    top_of_mind: 0.05,        // 50% after 10 days
    work_context: 0.01,       // 50% after 50 days
    personal_context: 0.005,  // 50% after 100 days
    brief_history: 0.002,     // Minimal decay
    long_term_background: 0,  // No decay
    other_instructions: 0.01,
  };

  const rate = decayRates[category];
  const decayFactor = Math.pow(0.5, daysSinceLastMentioned * rate);

  return originalConfidence * decayFactor;
}
```

**Vercel Cron Configuration:**
Create `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/consolidate-memories",
      "schedule": "0 3 * * 0"
    }
  ]
}
```

**Testing:**
```bash
# Test locally
curl -X GET http://localhost:3000/api/cron/consolidate-memories \
  -H "Authorization: Bearer ${CRON_SECRET}"

# Check logs
SELECT * FROM memory_consolidation_log ORDER BY created_at DESC LIMIT 5;
```

---

## 🔍 Key Implementation Details

### OpenAI API Setup

**Environment variable:**
```bash
# .env.local
OPENAI_API_KEY=sk-...
```

**Client initialization:** Already exists in `lib/openai.ts`, use it.

**Model:** `gpt-4o-mini`
**Cost:** ~$0.00075 per extraction (very cheap!)

### Database Queries Best Practices

**Always use RLS-aware queries:**
```typescript
// ✅ Good (uses RLS)
const { data } = await supabase
  .from('memory_entries')
  .select('*')
  .eq('user_id', userId);

// ❌ Bad (bypasses RLS)
const { data } = await supabase
  .from('memory_entries')
  .select('*');
```

**Use transactions for deduplication:**
```typescript
const { data, error } = await supabase.rpc('deduplicate_and_store', {
  p_memories: JSON.stringify(memories)
});
```

### Error Handling Philosophy

**Graceful degradation:**
- If extraction fails, log error but don't crash chat
- If consolidation fails, retry next week
- If GPT-4o-mini times out, return empty array

**Never block user-facing features:**
```typescript
// ✅ Good (non-blocking)
fetch('/api/memory/extract', { ... }).catch(err => console.error(err));

// ❌ Bad (blocks)
await fetch('/api/memory/extract', { ... });
```

### Performance Considerations

**Indexes are critical:**
```sql
-- Without these, queries will be SLOW
CREATE INDEX idx_memory_entries_user_id ON memory_entries(user_id);
CREATE INDEX idx_memory_entries_content_trgm ON memory_entries USING gin(content gin_trgm_ops);
```

**Limit memory fetches:**
```typescript
// Only fetch relevant memories (score > 0.2)
// Limit to 50 max per category
```

**Use caching (React Query) in UI:**
```typescript
const { data: memories } = useQuery({
  queryKey: ['memories'],
  queryFn: fetchMemories,
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

---

## 🧪 Testing Strategy

### Unit Tests (Required)

**Test extraction validation:**
```typescript
describe('validateFact', () => {
  it('should accept valid fact', () => {
    const fact = {
      category: 'work_context',
      content: 'Software engineer at Google',
      confidence: 0.95,
    };
    expect(validateFact(fact)).toBe(true);
  });

  it('should reject low confidence', () => {
    const fact = { confidence: 0.3, ... };
    expect(validateFact(fact)).toBe(false);
  });
});
```

**Test deduplication:**
```typescript
describe('deduplicateFacts', () => {
  it('should merge exact duplicates', async () => {
    // Create existing memory
    const existing = await createMemory({ content: 'SWE at Google' });

    // Try to add duplicate
    const result = await deduplicateFacts([
      { content: 'SWE at Google', ... }
    ]);

    // Should not create new, should merge
    expect(result.length).toBe(1);
    expect(result[0].source_message_count).toBe(2);
  });
});
```

### Integration Tests (Required)

**Test full extraction pipeline:**
```typescript
it('should extract memories from chat', async () => {
  const chat = await createTestChat([
    { role: 'user', content: 'I work at Google as a software engineer' }
  ]);

  const memories = await extractMemoriesFromChat(chat.id);

  expect(memories.length).toBeGreaterThan(0);
  expect(memories[0].category).toBe('work_context');
  expect(memories[0].content).toContain('Google');
});
```

### Manual Testing (Required)

**End-to-end flow:**
1. ✅ Enable auto-extraction in settings (create settings table entry)
2. ✅ Create chat with factual statements about yourself
3. ✅ Complete chat (assistant finishes responding)
4. ✅ Check database: `SELECT * FROM memory_entries ORDER BY created_at DESC LIMIT 5;`
5. ✅ Verify memories extracted correctly
6. ✅ Start new chat → Ask "What do you know about me?"
7. ✅ Verify AI responds with extracted facts
8. ✅ Create another chat with similar info → Verify no duplicates created

**Test consolidation:**
1. ✅ Run cron manually: `curl /api/cron/consolidate-memories`
2. ✅ Check consolidation log: `SELECT * FROM memory_consolidation_log;`
3. ✅ Verify duplicates merged, low-relevance archived

---

## 📊 Success Metrics

Track these during development:

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Extraction success rate | > 95% | Logs: successful extractions / total attempts |
| Avg memories per chat | 1-3 | Database: AVG(extracted_count) |
| Confidence distribution | Most > 0.7 | Database: Histogram of confidence scores |
| Deduplication rate | 20-30% | Logs: merged / (merged + created) |
| Processing time | < 5s | Logs: Time from trigger to completion |
| Cost per extraction | < $0.001 | OpenAI API usage |

**Add logging:**
```typescript
logger.info('memory_extraction_completed', {
  chat_id: chatId,
  memories_extracted: result.length,
  processing_time_ms: Date.now() - startTime,
  cost_usd: calculateCost(inputTokens, outputTokens),
});
```

---

## ⚠️ Common Pitfalls to Avoid

### 1. Don't Extract Third-Party Facts
```typescript
// ❌ Bad: "My friend John is a designer" → Extracts "User is a designer"
// ✅ Good: Prompt explicitly says "ONLY extract facts about the USER"
```

### 2. Don't Extract Ephemeral Statements
```typescript
// ❌ Bad: "I'm tired today" → Extracts as personal_context
// ✅ Good: Prompt says "Focus on persistent facts, not temporary states"
```

### 3. Don't Block Chat on Extraction Failure
```typescript
// ❌ Bad:
const memories = await extractMemoriesFromChat(chatId);
// If this throws, chat API crashes

// ✅ Good:
fetch('/api/memory/extract', { ... }).catch(err => console.error(err));
// Fire and forget, chat continues even if extraction fails
```

### 4. Don't Forget Indexes
```sql
-- Without pg_trgm index, fuzzy search will be VERY slow
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_memory_entries_content_trgm ON memory_entries USING gin(content gin_trgm_ops);
```

### 5. Don't Exceed Token Budget
```typescript
// ✅ Always check and truncate if needed
if (estimatedTokens > 500) {
  memories = memories.slice(0, calculateMaxMemories(500));
}
```

---

## 🎬 Demo Preparation

At the end of the sprint, you'll demo:

1. **Settings Toggle** - Enable auto-extraction
2. **Create Test Chat** - With factual statements
3. **Show Database** - Query memory_entries table
4. **Show Extraction** - POST /api/memory/extract in Network tab
5. **Show System Prompt** - Memories injected correctly
6. **Test AI Awareness** - Ask "What do you know about me?"
7. **Show Deduplication** - Create similar fact, verify merge
8. **Show Consolidation** - Run cron, check log

**Prepare demo environment:**
- Clean database (delete test memories)
- Have sample chat messages ready
- Record demo (optional)

---

## 📞 Support & Questions

**Technical questions:**
- Review specs first: MEMORY_EXTRACTION_SYSTEM_SPEC.md (1,609 lines!)
- Check M3-01 completed code for patterns
- Refer to OpenAI GPT-4o-mini docs

**Sprint questions:**
- Review sprint-m3-02.md
- Check Definition of Done for each task

**Blocked?**
- Document blocker in sprint-m3-02.md (Blockers section)
- Reach out to sprint owner (Sachee)

---

## 📝 Daily Updates (Required)

Update `sprint-m3-02.md` daily:

```markdown
### Day 1 - Dec 1, 2025
**Hours Worked:** 3h
**Completed:**
- ✅ M3-17: Database migration created and applied
- ✅ M3-18: Started extraction pipeline (50% done)

**In Progress:**
- 🚧 M3-18: Finishing GPT-4o-mini prompt integration

**Blockers:**
- None

**Notes:**
- pg_trgm setup was straightforward
- GPT-4o-mini responding well, quality looks good
```

---

## ✅ Sprint Completion Checklist

Before marking sprint complete:

- [ ] All 6 tasks done (status: ✅ Done)
- [ ] All tests passing (unit + integration)
- [ ] Manual demo successful (all 8 steps)
- [ ] Code reviewed (self-review minimum)
- [ ] Documentation updated (API docs, inline comments)
- [ ] Performance acceptable (< 5s extraction)
- [ ] Cost verified (< $0.001 per extraction)
- [ ] Sprint retrospective completed
- [ ] Handover to M3-03 prepared (next sprint)

---

## 🔗 Quick Reference Links

**Must-read documents:**
1. [memory-schema.md](../../memory-schema.md) - Architecture (615 lines)
2. [MEMORY_EXTRACTION_SYSTEM_SPEC.md](../../specs/MEMORY_EXTRACTION_SYSTEM_SPEC.md) - Full spec (1,609 lines)
3. [sprint-m3-02.md](./sprint-m3-02.md) - Sprint plan (690 lines)
4. [PRODUCT_BACKLOG.md](../../PRODUCT_BACKLOG.md#32-phase-2-hierarchical-memory-extraction-planned) - M3-02 tasks

**Completed work (reference):**
1. [sprint-m3-01.md](../completed/sprint-m3-01.md) - Previous sprint
2. [M3-01_TEST_REPORT.md](../../reports/M3-01_TEST_REPORT.md) - Testing approach

**Next sprint:**
1. [sprint-m3-03.md](./sprint-m3-03.md) - Memory UI (next)
2. [MEMORY_PAGE_UI_SPEC.md](../../specs/MEMORY_PAGE_UI_SPEC.md) - UI spec (992 lines)

---

**Good luck with the sprint! 🚀**

**Remember:** The goal is automatic memory extraction that's transparent, controllable, and respects user privacy. Quality over speed - better to miss a fact than extract incorrectly.

**Questions?** Review the 3,200+ lines of specifications first. Everything you need is documented.

---

**Handover Date:** November 24, 2025
**Sprint Start:** December 1, 2025
**Sprint Owner:** Sachee Perera
**Status:** Ready for Development
