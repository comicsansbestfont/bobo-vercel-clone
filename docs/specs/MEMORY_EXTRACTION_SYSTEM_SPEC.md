# Memory Extraction System Specification

**Version:** 1.0
**Created:** November 24, 2025
**Status:** Draft
**Owner:** Engineering
**Related:** M3-02 Sprint (Memory Extraction)

---

## Overview

The Memory Extraction System automatically identifies and extracts user facts from conversations using GPT-4o-mini. This system builds a hierarchical personal memory that persists across all chats, enabling Bobo to provide increasingly personalized responses over time.

### Design Philosophy

1. **Privacy-First** - Default OFF, explicit opt-in required
2. **Transparent** - User sees exactly what was extracted and from where
3. **Correctable** - User can edit or delete any extracted memory
4. **Conservative** - Better to miss a fact than extract incorrectly
5. **Cost-Effective** - Use GPT-4o-mini ($0.15/1M input tokens)

---

## System Architecture

### Pipeline Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     EXTRACTION PIPELINE                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. TRIGGER                                                 │
│     ├─ User completes chat (assistant stops streaming)     │
│     ├─ Check: Auto-extraction enabled?                     │
│     ├─ Check: Enough new messages? (min 5)                 │
│     └─ Check: Not recently processed? (debounce 5min)      │
│                                                              │
│  2. EXTRACTION                                              │
│     ├─ Fetch recent messages (last 20)                     │
│     ├─ Send to GPT-4o-mini with extraction prompt          │
│     ├─ Parse JSON response                                 │
│     └─ Validate extracted facts                            │
│                                                              │
│  3. DEDUPLICATION                                           │
│     ├─ Calculate content hash                              │
│     ├─ Check for exact duplicates                          │
│     ├─ Fuzzy match against existing memories (> 90% sim)   │
│     └─ Merge or create new entry                           │
│                                                              │
│  4. STORAGE                                                 │
│     ├─ Insert into memory_entries table                    │
│     ├─ Link source_chat_id and source_project_id           │
│     ├─ Calculate initial relevance_score                   │
│     └─ Trigger UI notification (optional)                  │
│                                                              │
│  5. CONSOLIDATION (Weekly)                                  │
│     ├─ Find duplicate/similar memories                     │
│     ├─ Merge high-confidence duplicates                    │
│     ├─ Archive low-relevance memories (score < 0.2)        │
│     └─ Update time_period classifications                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Component Overview

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Trigger | Next.js API Route | Detect when to extract |
| Extractor | GPT-4o-mini | Identify facts from conversation |
| Deduplicator | PostgreSQL + Levenshtein | Prevent duplicate memories |
| Storage | Supabase (PostgreSQL) | Persist memory entries |
| Consolidator | Cron Job (Vercel Cron) | Weekly cleanup and merging |

---

## Extraction Prompts

### System Prompt (Base)

**Purpose:** Define the extraction task and rules for GPT-4o-mini

```
You are a memory extraction assistant for Bobo AI Chatbot. Your job is to analyze conversations and extract facts about the user that would help personalize future interactions.

EXTRACTION RULES:

1. ONLY extract facts about the USER (not the assistant, not third parties)
2. Focus on persistent facts (not ephemeral statements like "I'm tired")
3. Be conservative: when in doubt, don't extract
4. Assign appropriate confidence levels based on evidence
5. Categorize each fact into the correct memory category
6. Include the source message ID for provenance

CONFIDENCE LEVELS:
- 0.9-1.0 (Very High): User explicitly stated the fact
  Example: "I'm a software engineer" → confidence: 0.95

- 0.7-0.8 (High): Strongly implied from context
  Example: "I use React at work" → confidence: 0.8 → [work_context: uses React]

- 0.5-0.6 (Medium): Inferred from multiple clues
  Example: "I love hiking and camping" → confidence: 0.6 → [personal_context: enjoys outdoor activities]

- < 0.5: DO NOT EXTRACT (too uncertain)

CATEGORIES:

1. work_context
   - Current role, job title, company
   - Technical expertise, skills, languages
   - Work projects, responsibilities
   - Work preferences, methodologies

2. personal_context
   - Location (city, country)
   - Family, relationships
   - Hobbies, interests
   - Background, education, identity

3. top_of_mind
   - Current priorities, immediate focus
   - Recent events or activities
   - Short-term goals or plans
   - Active learning topics

4. brief_history
   - Past experiences, jobs, projects
   - Timeline events (graduated, started job, etc.)
   - Skills or knowledge gained in the past
   - Subcategories: recent_months, earlier, long_term

5. long_term_background
   - Education (degrees, schools)
   - Career history (long-term patterns)
   - Languages spoken
   - Foundational facts unlikely to change

6. other_instructions
   - Communication preferences
   - Explanation style preferences
   - Format preferences (code style, etc.)
   - Interaction patterns

OUTPUT FORMAT:

Return a JSON array of extracted facts. Each fact must have:
{
  "category": "work_context" | "personal_context" | "top_of_mind" | "brief_history" | "long_term_background" | "other_instructions",
  "subcategory": string | null,  // Only for brief_history: "recent_months" | "earlier" | "long_term"
  "content": string,              // The fact itself (50-200 chars)
  "summary": string | null,       // Optional 1-sentence summary
  "confidence": number,           // 0.5 - 1.0
  "source_message_id": string,    // ID of the message this came from
  "time_period": "current" | "recent" | "past" | "long_ago",
  "reasoning": string             // Why you extracted this (for debugging, not stored)
}

If no facts should be extracted, return an empty array: []

EXAMPLES OF GOOD EXTRACTIONS:

User: "I'm a senior software engineer at Google, working on YouTube's recommendation algorithm."
Output: [
  {
    "category": "work_context",
    "subcategory": null,
    "content": "Senior software engineer at Google",
    "summary": "Works as a senior SWE at Google on YouTube",
    "confidence": 0.95,
    "source_message_id": "msg_123",
    "time_period": "current",
    "reasoning": "User explicitly stated their role and company"
  },
  {
    "category": "work_context",
    "subcategory": null,
    "content": "Works on YouTube's recommendation algorithm",
    "summary": "Specializes in recommendation systems",
    "confidence": 0.95,
    "source_message_id": "msg_123",
    "time_period": "current",
    "reasoning": "User explicitly stated their project area"
  }
]

User: "I live in San Francisco with my wife and two kids."
Output: [
  {
    "category": "personal_context",
    "subcategory": null,
    "content": "Lives in San Francisco",
    "summary": "Location: San Francisco, CA",
    "confidence": 0.95,
    "source_message_id": "msg_456",
    "time_period": "current",
    "reasoning": "User explicitly stated their location"
  },
  {
    "category": "personal_context",
    "subcategory": null,
    "content": "Married with two children",
    "summary": "Family: Married, 2 kids",
    "confidence": 0.95,
    "source_message_id": "msg_456",
    "time_period": "current",
    "reasoning": "User explicitly mentioned family structure"
  }
]

User: "I'm learning Rust right now, it's been challenging but fun."
Output: [
  {
    "category": "top_of_mind",
    "subcategory": null,
    "content": "Currently learning Rust programming language",
    "summary": "Learning Rust (finds it challenging but enjoyable)",
    "confidence": 0.95,
    "source_message_id": "msg_789",
    "time_period": "current",
    "reasoning": "User explicitly stated current learning activity"
  }
]

EXAMPLES OF BAD EXTRACTIONS (DO NOT DO THIS):

User: "Can you help me debug this React component?"
Bad Output: [
  {
    "category": "work_context",
    "content": "Uses React",
    "confidence": 0.4  // Too low! Don't extract
  }
]
Why bad: Asking about React doesn't mean they use it professionally. Need more evidence.

User: "I'm so tired today."
Bad Output: [
  {
    "category": "personal_context",
    "content": "Often tired",
    "confidence": 0.5
  }
]
Why bad: Ephemeral statement, not a persistent fact. Don't extract.

User: "My friend John loves hiking."
Bad Output: [
  {
    "category": "personal_context",
    "content": "Loves hiking",
    "confidence": 0.7
  }
]
Why bad: This is about the user's FRIEND, not the user. Never extract facts about third parties.

NOW, analyze the following conversation and extract relevant facts about the user.
```

---

### Category-Specific Prompts

Each category has additional guidance to improve extraction quality:

#### Work Context Extraction

```
ADDITIONAL GUIDANCE FOR work_context:

Extract:
- Job titles: "Software Engineer", "Product Manager", "Designer"
- Company names: "Google", "Amazon", "Startup XYZ"
- Tech stack: "Expert in React and TypeScript"
- Work style: "Prefer remote work", "TDD approach"
- Team info: "Leading team of 5 engineers"
- Industry: "Fintech", "Healthcare", "E-commerce"

Do NOT extract:
- Temporary projects: "Working on a weekend hackathon"
- Aspirations: "I want to become a manager"
- Opinions: "I think React is better than Vue"
- One-time events: "I had a meeting today"

Examples:
✓ "I'm a full-stack developer specializing in Next.js"
✓ "I work at Stripe on the payments team"
✓ "I prefer TypeScript over JavaScript for production code"
✗ "I'm thinking about learning Python" (aspiration, not current fact)
✗ "My coworker is difficult to work with" (about third party)
```

#### Personal Context Extraction

```
ADDITIONAL GUIDANCE FOR personal_context:

Extract:
- Location: "Lives in Seattle", "From India originally"
- Family: "Married", "Two kids (ages 5 and 8)", "Single"
- Hobbies: "Plays guitar", "Enjoys rock climbing", "Reads sci-fi"
- Lifestyle: "Vegetarian", "Night owl", "Early riser"
- Pets: "Has a golden retriever named Max"
- Physical: "Left-handed" (only if relevant/mentioned)

Do NOT extract:
- Temporary moods: "Feeling stressed today"
- Opinions on topics: "I love pizza" (too trivial)
- One-time events: "Went to a concert last week"
- Private medical info: Never extract health conditions

Examples:
✓ "I live in Austin, Texas"
✓ "I have two kids in elementary school"
✓ "I'm an avid mountain biker"
✗ "I'm hungry right now" (temporary state)
✗ "I went to the gym yesterday" (one-time event)
```

#### Top of Mind Extraction

```
ADDITIONAL GUIDANCE FOR top_of_mind:

This category is for CURRENT, SHORT-TERM priorities and focus areas.

Extract:
- Current learning: "Learning Rust", "Taking a course on ML"
- Immediate projects: "Building a side project chatbot"
- Near-term goals: "Planning to launch my portfolio next month"
- Active interests: "Researching AI agents right now"
- Recent changes: "Just started a new job last week"

Do NOT extract:
- Long-term goals: "I want to retire early" → long_term_background
- Past activities: "I learned Python last year" → brief_history
- Permanent interests: "I've always loved programming" → personal_context

Time decay: These memories should have fast decay (50% after 10 days).

Examples:
✓ "I'm currently learning about RAG systems"
✓ "Building a Next.js app for a client this month"
✓ "Preparing for AWS certification exam next week"
✗ "I learned React in 2020" (past → brief_history)
✗ "I want to learn AI eventually" (vague aspiration, skip)
```

#### Brief History Extraction

```
ADDITIONAL GUIDANCE FOR brief_history:

This category captures PAST experiences with time context.

Subcategories:
- recent_months: 0-3 months ago
- earlier: 3-12 months ago
- long_term: > 1 year ago

Extract:
- Past jobs: "Worked at Microsoft from 2015-2020"
- Completed projects: "Built an e-commerce site last year"
- Education: "Graduated from Stanford in 2018"
- Skills learned: "Learned Docker last summer"
- Life events: "Moved to NYC in 2019"

Include temporal markers when possible:
- Explicit dates: "Started at Google in Jan 2023"
- Relative time: "Graduated 5 years ago"
- Approximate: "Worked there for about 3 years"

Examples:
✓ {
    "category": "brief_history",
    "subcategory": "recent_months",
    "content": "Completed Next.js bootcamp in October 2025",
    "time_period": "recent",
    ...
  }
✓ {
    "category": "brief_history",
    "subcategory": "long_term",
    "content": "Graduated from UC Berkeley with CS degree in 2015",
    "time_period": "long_ago",
    ...
  }
✗ "I've always been interested in tech" (too vague, no timeline)
```

#### Long-Term Background Extraction

```
ADDITIONAL GUIDANCE FOR long_term_background:

This category is for FOUNDATIONAL facts unlikely to change.

Extract:
- Education: "Bachelor's in Computer Science from MIT"
- Native language: "Native English speaker"
- Other languages: "Fluent in Spanish and French"
- Career domain: "10+ years in software development"
- Certifications: "AWS Certified Solutions Architect"
- Foundational skills: "Strong background in mathematics"

These memories should have NO decay (permanent).

Examples:
✓ "Bachelor's degree in Computer Science from Stanford (2015)"
✓ "Native English speaker, fluent in Mandarin"
✓ "15 years of experience in software engineering"
✗ "Currently studying for AWS cert" (top_of_mind, not background)
```

#### Other Instructions Extraction

```
ADDITIONAL GUIDANCE FOR other_instructions:

This category captures HOW the user prefers to interact.

Extract:
- Communication style: "Explain like I'm 5", "Prefer detailed explanations"
- Format preferences: "Use TypeScript examples", "Show me the code first"
- Methodology: "TDD approach", "Agile mindset"
- Interaction patterns: "Ask clarifying questions first"
- Tone: "Keep it casual", "Be formal and precise"

Examples:
✓ "Prefer concise answers over long explanations"
✓ "Always show TypeScript examples, not JavaScript"
✓ "Use functional programming patterns when possible"
✗ "Don't use Python" (too restrictive, might be context-specific)
```

---

## Confidence Scoring Algorithm

### Explicit Statement Detection

Patterns that indicate Very High Confidence (0.9-1.0):

```typescript
const EXPLICIT_PATTERNS = [
  /^I am (a|an)/i,              // "I am a software engineer"
  /^I work (at|as|for)/i,       // "I work at Google"
  /^I live in/i,                // "I live in Seattle"
  /^I have/i,                   // "I have two kids"
  /^My (job|role|position) is/i,// "My job is product manager"
  /^I'm currently/i,            // "I'm currently learning Rust"
  /^I specialize in/i,          // "I specialize in React"
];

// If user message matches these patterns → confidence: 0.95
```

### Implied Statement Detection

Patterns that indicate High Confidence (0.7-0.8):

```typescript
const IMPLIED_PATTERNS = [
  /I use .* (at work|professionally)/i,  // "I use React at work"
  /we (use|have) .* (at|in) (my|our) (company|team)/i,
  /I've been .* for \d+ (years|months)/i, // "I've been coding for 5 years"
  /I prefer .* (over|to)/i,              // "I prefer TypeScript over JS"
];

// Confidence: 0.75-0.85 depending on context
```

### Inference Scoring

Multiple weak signals can combine into medium confidence (0.5-0.6):

```typescript
// Example: User asks 3+ React questions → infer they use React
const inferenceScore = (signals: Signal[]): number => {
  const baseConfidence = 0.3;
  const perSignal = 0.1;
  const maxConfidence = 0.6;

  return Math.min(
    baseConfidence + (signals.length * perSignal),
    maxConfidence
  );
};
```

### Confidence Decay Over Time

Confidence should decrease if facts are not re-mentioned:

```typescript
const decayConfidence = (
  originalConfidence: number,
  daysSinceLastMentioned: number,
  category: MemoryCategory
): number => {
  const decayRates = {
    top_of_mind: 0.05,        // Fast decay
    work_context: 0.01,       // Slow decay
    personal_context: 0.005,  // Very slow
    brief_history: 0.002,     // Minimal
    long_term_background: 0,  // No decay
    other_instructions: 0.01,
  };

  const rate = decayRates[category];
  const decayFactor = Math.pow(0.5, daysSinceLastMentioned * rate);

  return originalConfidence * decayFactor;
};
```

---

## Deduplication Logic

### Exact Duplicate Detection

```sql
-- Check for exact duplicates using content hash
SELECT * FROM memory_entries
WHERE user_id = $1
  AND category = $2
  AND content_hash = $3;
```

```typescript
// Generate content hash
import crypto from 'crypto';

const generateContentHash = (content: string): string => {
  return crypto
    .createHash('sha256')
    .update(content.toLowerCase().trim())
    .digest('hex');
};
```

### Fuzzy Matching

Use Levenshtein distance for similarity detection:

```sql
-- Install pg_trgm extension for fuzzy matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Find similar memories (> 90% similar)
SELECT
  id,
  content,
  similarity(content, $1) as sim_score
FROM memory_entries
WHERE user_id = $2
  AND category = $3
  AND similarity(content, $1) > 0.9
ORDER BY sim_score DESC;
```

### Merge Strategy

When duplicates are found:

```typescript
interface DuplicateMergeStrategy {
  // If new memory has higher confidence → replace
  // If existing has higher confidence → update sources only
  // If equal → merge sources, keep higher timestamp
}

const mergeMemories = (
  existing: MemoryEntry,
  new: MemoryEntry
): MemoryEntry => {
  if (new.confidence > existing.confidence) {
    // New is more confident, replace but preserve sources
    return {
      ...new,
      source_chat_ids: [
        ...existing.source_chat_ids,
        ...new.source_chat_ids
      ],
      source_message_count:
        existing.source_message_count +
        new.source_message_count,
      last_updated: new Date(),
    };
  } else {
    // Existing is more confident, just add new sources
    return {
      ...existing,
      source_chat_ids: [
        ...existing.source_chat_ids,
        ...new.source_chat_ids
      ],
      source_message_count:
        existing.source_message_count +
        new.source_message_count,
      last_mentioned: new Date(),
    };
  }
};
```

---

## Background Job Implementation

### Trigger Points

**Option 1: Post-Chat Extraction (Preferred)**
```typescript
// In /api/chat/route.ts after assistant finishes streaming

if (userSettings.auto_extraction_enabled) {
  // Queue background job (non-blocking)
  await queueMemoryExtraction({
    chat_id: currentChatId,
    user_id: userId,
    message_count: newMessagesCount,
  });
}
```

**Option 2: Scheduled Batch Processing**
```typescript
// Vercel Cron: /api/cron/extract-memories (runs daily at 2am)

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Get all users with auto-extraction enabled
  const users = await getUsersWithAutoExtraction();

  for (const user of users) {
    // Find chats updated in last 24h that haven't been processed
    const unprocessedChats = await getUnprocessedChats(user.id);

    for (const chat of unprocessedChats) {
      await extractMemoriesFromChat(chat.id);
    }
  }

  return Response.json({ processed: users.length });
}
```

### Extraction Function

```typescript
// lib/memory/extractor.ts

export async function extractMemoriesFromChat(
  chatId: string
): Promise<MemoryEntry[]> {
  try {
    // 1. Fetch recent messages (last 20)
    const messages = await getChatMessages(chatId, { limit: 20 });

    // 2. Format messages for GPT-4o-mini
    const formattedMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      id: msg.id,
    }));

    // 3. Call GPT-4o-mini with extraction prompt
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
        { role: 'user', content: JSON.stringify(formattedMessages) },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1, // Low temp for consistency
    });

    // 4. Parse response
    const extracted = JSON.parse(completion.choices[0].message.content);

    // 5. Validate extracted facts
    const validated = extracted.facts.filter(validateFact);

    // 6. Deduplicate
    const deduplicated = await deduplicateFacts(validated);

    // 7. Store in database
    const stored = await storeMemories(deduplicated, chatId);

    // 8. Mark chat as processed
    await markChatProcessed(chatId);

    return stored;
  } catch (error) {
    console.error('Memory extraction failed:', error);
    // Log error but don't throw (graceful degradation)
    return [];
  }
}
```

### Validation Function

```typescript
const validateFact = (fact: ExtractedFact): boolean => {
  // Required fields
  if (!fact.category || !fact.content || !fact.confidence) {
    return false;
  }

  // Confidence range
  if (fact.confidence < 0.5 || fact.confidence > 1.0) {
    return false;
  }

  // Content length
  if (fact.content.length < 10 || fact.content.length > 500) {
    return false;
  }

  // Valid category
  const validCategories = [
    'work_context',
    'personal_context',
    'top_of_mind',
    'brief_history',
    'long_term_background',
    'other_instructions',
  ];
  if (!validCategories.includes(fact.category)) {
    return false;
  }

  // Subcategory validation
  if (fact.category === 'brief_history') {
    const validSubcategories = ['recent_months', 'earlier', 'long_term'];
    if (fact.subcategory && !validSubcategories.includes(fact.subcategory)) {
      return false;
    }
  }

  return true;
};
```

---

## Weekly Consolidation Process

### Consolidation Job

```typescript
// /api/cron/consolidate-memories (runs weekly on Sundays at 3am)

export async function consolidateMemories(userId: string) {
  console.log(`[Consolidation] Starting for user ${userId}`);

  // 1. Find duplicate memories (> 90% similarity)
  const duplicates = await findDuplicateMemories(userId);
  console.log(`[Consolidation] Found ${duplicates.length} duplicate pairs`);

  // 2. Merge high-confidence duplicates
  for (const [mem1, mem2] of duplicates) {
    if (mem1.confidence > 0.7 && mem2.confidence > 0.7) {
      await mergeDuplicateMemories(mem1.id, mem2.id);
    }
  }

  // 3. Archive low-relevance memories (score < 0.2)
  const lowRelevance = await findLowRelevanceMemories(userId);
  console.log(`[Consolidation] Archiving ${lowRelevance.length} low-relevance memories`);

  for (const memory of lowRelevance) {
    await archiveMemory(memory.id);
  }

  // 4. Update time_period classifications
  await updateTimePeriods(userId);

  // 5. Recalculate relevance scores
  await recalculateRelevanceScores(userId);

  // 6. Log consolidation event
  await logConsolidation(userId, {
    duplicates_merged: duplicates.length,
    memories_archived: lowRelevance.length,
    timestamp: new Date(),
  });

  console.log(`[Consolidation] Complete for user ${userId}`);
}
```

### Relevance Score Calculation

```typescript
const calculateRelevanceScore = (memory: MemoryEntry): number => {
  const baseConfidence = memory.confidence;
  const daysSinceLastMentioned = getDaysSince(memory.last_mentioned);
  const sourceCount = memory.source_message_count;

  // Apply temporal decay
  const decayedConfidence = decayConfidence(
    baseConfidence,
    daysSinceLastMentioned,
    memory.category
  );

  // Boost from multiple sources
  const sourceBoost = Math.min(sourceCount * 0.05, 0.2);

  // Final score
  const score = Math.min(decayedConfidence + sourceBoost, 1.0);

  return score;
};
```

---

## Cost Analysis

### GPT-4o-mini Pricing (as of Nov 2024)
- **Input:** $0.15 per 1M tokens
- **Output:** $0.60 per 1M tokens

### Typical Extraction Costs

**Per Chat Extraction:**
- System prompt: ~1,000 tokens
- Recent messages (20): ~2,000 tokens
- Total input: ~3,000 tokens
- Expected output: ~500 tokens

**Cost per extraction:**
- Input: 3,000 × $0.15 / 1M = $0.00045
- Output: 500 × $0.60 / 1M = $0.0003
- **Total: ~$0.00075 per chat**

**Monthly Cost (per user):**
- Average: 100 chats/month
- Cost: 100 × $0.00075 = **$0.075/month/user**
- For 1,000 users: **$75/month**

**Comparison to Supermemory.ai:**
- Supermemory.ai: ~$5-10/month/user (estimated)
- Custom solution: **~95% cost savings**

---

## Error Handling

### Extraction Failures

```typescript
try {
  const memories = await extractMemoriesFromChat(chatId);
} catch (error) {
  if (error instanceof OpenAIError) {
    // API error (rate limit, quota, etc.)
    console.error('[Extraction] OpenAI API error:', error);
    // Retry with exponential backoff
    await retryWithBackoff(() => extractMemoriesFromChat(chatId));
  } else if (error instanceof ValidationError) {
    // Invalid extraction output
    console.error('[Extraction] Validation failed:', error);
    // Log for debugging, continue gracefully
    logExtractionFailure(chatId, error);
  } else {
    // Unknown error
    console.error('[Extraction] Unknown error:', error);
    // Send to error tracking (Sentry)
    Sentry.captureException(error);
  }
}
```

### Fallback Strategies

1. **Rate Limiting** - If OpenAI rate limits, queue for retry in 1 hour
2. **Invalid JSON** - Log error, skip this chat, continue with others
3. **Database Errors** - Retry 3 times with exponential backoff
4. **Timeout** - Set 30s timeout for extraction, abort if exceeded

---

## Testing Strategy

### Unit Tests

```typescript
// tests/memory-extraction.test.ts

describe('Memory Extraction', () => {
  it('should extract work context from explicit statement', async () => {
    const messages = [
      { role: 'user', content: 'I am a software engineer at Google' }
    ];

    const extracted = await extractMemories(messages);

    expect(extracted).toHaveLength(1);
    expect(extracted[0].category).toBe('work_context');
    expect(extracted[0].content).toContain('software engineer');
    expect(extracted[0].confidence).toBeGreaterThan(0.9);
  });

  it('should not extract third-party facts', async () => {
    const messages = [
      { role: 'user', content: 'My friend John is a designer' }
    ];

    const extracted = await extractMemories(messages);

    expect(extracted).toHaveLength(0);
  });

  it('should assign correct time_period for brief_history', async () => {
    const messages = [
      { role: 'user', content: 'I graduated from Stanford in 2015' }
    ];

    const extracted = await extractMemories(messages);

    expect(extracted[0].category).toBe('brief_history');
    expect(extracted[0].subcategory).toBe('long_term');
    expect(extracted[0].time_period).toBe('long_ago');
  });
});
```

### Integration Tests

```typescript
describe('Deduplication', () => {
  it('should merge exact duplicates', async () => {
    const existing = await createMemory({
      category: 'work_context',
      content: 'Software engineer at Google',
      confidence: 0.95,
    });

    const duplicate = {
      category: 'work_context',
      content: 'Software engineer at Google',
      confidence: 0.9,
    };

    const result = await deduplicateAndStore([duplicate]);

    // Should not create new memory
    expect(result.created).toBe(0);
    expect(result.merged).toBe(1);

    // Should update source count
    const updated = await getMemory(existing.id);
    expect(updated.source_message_count).toBe(2);
  });

  it('should merge fuzzy duplicates (> 90% similar)', async () => {
    const existing = await createMemory({
      category: 'work_context',
      content: 'Senior software engineer at Google',
      confidence: 0.95,
    });

    const similar = {
      category: 'work_context',
      content: 'Senior SWE at Google',
      confidence: 0.9,
    };

    const result = await deduplicateAndStore([similar]);

    expect(result.merged).toBe(1);
  });
});
```

### End-to-End Tests

```typescript
describe('Full Extraction Pipeline', () => {
  it('should extract, deduplicate, and store memories from chat', async () => {
    // Create test chat with messages
    const chat = await createTestChat([
      { role: 'user', content: 'I work at Google as a software engineer' },
      { role: 'assistant', content: 'Great! How can I help with your work?' },
      { role: 'user', content: 'I specialize in React and TypeScript' },
    ]);

    // Run extraction
    const result = await extractMemoriesFromChat(chat.id);

    // Verify memories created
    expect(result).toHaveLength(2);
    expect(result[0].category).toBe('work_context');
    expect(result[1].category).toBe('work_context');

    // Verify provenance
    expect(result[0].source_chat_ids).toContain(chat.id);

    // Verify deduplication
    const memories = await getUserMemories(testUserId);
    expect(memories).toHaveLength(2); // Should not create duplicates
  });
});
```

---

## Monitoring & Observability

### Metrics to Track

1. **Extraction Success Rate**
   - % of chats successfully processed
   - Target: > 95%

2. **Average Memories per Chat**
   - Typical: 1-3 memories
   - Alert if > 10 (over-extraction)

3. **Confidence Score Distribution**
   - Track histogram of confidence levels
   - Ensure most are > 0.7

4. **Deduplication Rate**
   - % of extracted facts that are duplicates
   - Target: 20-30% (indicates good coverage)

5. **Processing Time**
   - p50, p95, p99 latency
   - Target: < 5s for extraction

6. **Cost per User**
   - Track monthly GPT-4o-mini costs
   - Alert if > $0.10/user/month

### Logging

```typescript
// Structured logging for extraction events

logger.info('memory_extraction_started', {
  chat_id: chatId,
  user_id: userId,
  message_count: messages.length,
});

logger.info('memory_extraction_completed', {
  chat_id: chatId,
  user_id: userId,
  memories_extracted: result.length,
  memories_stored: stored.length,
  duplicates_merged: merged.length,
  processing_time_ms: Date.now() - startTime,
  cost_usd: calculateCost(inputTokens, outputTokens),
});

logger.error('memory_extraction_failed', {
  chat_id: chatId,
  user_id: userId,
  error: error.message,
  stack: error.stack,
});
```

---

## Privacy & Security

### Data Handling

1. **Consent Required**
   - Auto-extraction OFF by default
   - Explicit opt-in with clear explanation
   - Easy to disable anytime

2. **Data Retention**
   - Memories stored indefinitely (unless user deletes)
   - Source chats can be deleted without affecting memories
   - Export available in JSON/Markdown

3. **PII Protection**
   - Never extract sensitive PII (SSN, passwords, etc.)
   - Medical information explicitly excluded
   - Financial info requires high confidence

4. **User Control**
   - Users can view all extracted memories
   - Users can edit or delete any memory
   - Users can disable extraction per-category
   - "Clear All" option available

### Compliance

- **GDPR:** Full data export, right to deletion
- **CCPA:** Transparency, opt-out available
- **SOC 2:** Audit logs for all memory operations

---

## Future Enhancements

### Phase 2 (Post-M3)

1. **Multi-Modal Extraction**
   - Extract from images (OCR, vision models)
   - Extract from voice transcripts
   - Extract from uploaded documents

2. **Relationship Mapping**
   - Link related memories
   - Build knowledge graph
   - Identify contradictions

3. **Proactive Suggestions**
   - "Did you mean to update this memory?"
   - "This seems related to [other memory]"
   - "We noticed a potential contradiction..."

4. **Advanced Analytics**
   - Memory growth over time
   - Category distribution charts
   - Confidence trend analysis

5. **Collaborative Memories**
   - Share memories with team
   - Team-wide knowledge base
   - Permission controls

---

## Appendix: Example Prompts

### Full Extraction Example

**Input Messages:**
```json
[
  {
    "id": "msg_001",
    "role": "user",
    "content": "I'm a senior software engineer at Google, working on YouTube's recommendation algorithm. I've been with the team for 3 years now."
  },
  {
    "id": "msg_002",
    "role": "assistant",
    "content": "That's impressive! What languages and frameworks do you primarily work with?"
  },
  {
    "id": "msg_003",
    "role": "user",
    "content": "Mostly Python and Go for backend services, and some JavaScript for frontend tooling. I also use TensorFlow for our ML models."
  },
  {
    "id": "msg_004",
    "role": "assistant",
    "content": "Sounds like a great tech stack. How can I help you today?"
  },
  {
    "id": "msg_005",
    "role": "user",
    "content": "I'm learning Rust in my spare time and want to build a CLI tool."
  }
]
```

**Expected Output:**
```json
{
  "facts": [
    {
      "category": "work_context",
      "subcategory": null,
      "content": "Senior software engineer at Google",
      "summary": "Works as a senior SWE at Google on YouTube",
      "confidence": 0.95,
      "source_message_id": "msg_001",
      "time_period": "current",
      "reasoning": "User explicitly stated their role and company"
    },
    {
      "category": "work_context",
      "subcategory": null,
      "content": "Works on YouTube's recommendation algorithm",
      "summary": "Specializes in recommendation systems for YouTube",
      "confidence": 0.95,
      "source_message_id": "msg_001",
      "time_period": "current",
      "reasoning": "User explicitly stated their project area"
    },
    {
      "category": "brief_history",
      "subcategory": "recent_months",
      "content": "Has been with YouTube team for 3 years",
      "summary": "3 years tenure at YouTube (started ~2022)",
      "confidence": 0.95,
      "source_message_id": "msg_001",
      "time_period": "recent",
      "reasoning": "User provided specific timeline"
    },
    {
      "category": "work_context",
      "subcategory": null,
      "content": "Primary languages: Python and Go for backend",
      "summary": "Backend specialist using Python and Go",
      "confidence": 0.9,
      "source_message_id": "msg_003",
      "time_period": "current",
      "reasoning": "User stated primary tech stack"
    },
    {
      "category": "work_context",
      "subcategory": null,
      "content": "Uses TensorFlow for ML models",
      "summary": "ML engineer with TensorFlow experience",
      "confidence": 0.9,
      "source_message_id": "msg_003",
      "time_period": "current",
      "reasoning": "User mentioned using TensorFlow for work ML models"
    },
    {
      "category": "top_of_mind",
      "subcategory": null,
      "content": "Currently learning Rust programming language",
      "summary": "Learning Rust in spare time",
      "confidence": 0.95,
      "source_message_id": "msg_005",
      "time_period": "current",
      "reasoning": "User explicitly stated current learning activity"
    },
    {
      "category": "top_of_mind",
      "subcategory": null,
      "content": "Planning to build a CLI tool",
      "summary": "Working on CLI tool project",
      "confidence": 0.85,
      "source_message_id": "msg_005",
      "time_period": "current",
      "reasoning": "User expressed immediate intent to build something"
    }
  ]
}
```

---

**Document Version:** 1.0
**Last Updated:** November 24, 2025
**Next Review:** After M3-02 Sprint
**Status:** Ready for Implementation
