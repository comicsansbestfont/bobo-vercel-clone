# Bug Report: Message Text Rendered as Individual Words

**Status:** ✅ Fixed (new messages only)
**Date Reported:** 2025-01-23
**Severity:** Critical
**Reporter:** User Testing
**Fixed By:** Claude Code

---

## Summary

Assistant messages in the chat interface are rendered with each word appearing on a separate line instead of flowing as continuous paragraphs. This makes responses completely unreadable and breaks core chat functionality.

## Environment

- **Application:** Bobo AI Chat Interface
- **Affected Routes:**
  - Home page (`/`)
  - Project pages (`/project/[projectId]`)
- **Affected Models:** OpenAI models using direct gateway streaming
  - GPT-5.1 Thinking
  - GPT-5.1 Instant
  - GPT-5 Pro
  - GPT-5 Mini
  - GPT-4o
- **Not Affected:** Non-OpenAI models using AI SDK `streamText`
  - Anthropic Claude models
  - Google Gemini models
  - Deepseek models

## Steps to Reproduce

1. Navigate to any chat interface (home or project page)
2. Select an OpenAI model (e.g., GPT 5.1 Thinking)
3. Send any message to the assistant
4. Wait for the streaming response to complete
5. Observe the rendered message

## Expected Behavior

Assistant responses should render as continuous paragraphs:

```
This message was received and identified as coming from the
QA E2E Test Project. End-to-end communication path appears
to be functioning correctly based on this interaction.
```

## Actual Behavior

Each word appears on its own line with vertical spacing:

```
and
identified
as
coming
from
the
**
QA
E
2
E
Test
Project
**
.
End
-to
-end
communication
path
appears
to
be
functioning
correctly
based
on
this
interaction
.
```

## Visual Evidence

Example chat demonstrating the bug:
- URL: `http://localhost:3000/project/adc4ed0a-5b64-4e5d-bb46-b5ea3421312b?chatId=aa4eae6f-72ea-461b-ba87-ab2d4c6dac70`
- ChatId: `aa4eae6f-72ea-461b-ba87-ab2d4c6dac70`
- Screenshot: Shows text split across 50+ lines

## Root Cause Analysis

### Data Layer Investigation

Database inspection revealed the issue:

```javascript
// Broken message structure
{
  "role": "assistant",
  "partsCount": 49,
  "parts": [
    {"type": "text", "text": "TEST"},
    {"type": "text", "text": " MODE"},
    {"type": "text", "text": " ACTIVE"},
    {"type": "text", "text": ":\n"},
    {"type": "text", "text": "-"},
    // ... 44 more separate parts
  ]
}

// Expected structure
{
  "role": "assistant",
  "partsCount": 1,
  "parts": [
    {"type": "text", "text": "TEST MODE ACTIVE:\n- Confirmed: This message..."}
  ]
}
```

### Code Issue

**File:** `app/api/chat/route.ts`
**Lines:** 264-297 (before fix)

The OpenAI streaming handler was **pushing each streaming delta as a new part**:

```typescript
// ❌ BEFORE (Broken)
if (typeof delta === 'string' && delta.length > 0) {
  assistantParts.push({ type: 'text', text: delta });
  // Every streaming chunk creates a new part
}
```

The streaming process:
1. OpenAI sends response in small chunks (deltas)
2. Each delta (word/phrase) pushed as separate part to `assistantParts` array
3. Array with 40-50 parts saved to database
4. Frontend renders each part as separate `Message` component

### Rendering Issue

**File:** `components/chat/chat-interface.tsx`
**Lines:** 393-422

Each message part creates a separate `Message` component:

```typescript
{message.parts.map((part, i) => {
  // Each part becomes its own Message component
  return (
    <Message key={`${message.id}-${i}`} from={message.role}>
      <MessageContent>
        <MessageResponse>{part.text}</MessageResponse>
      </MessageContent>
    </Message>
  );
})}
```

Since `Message` components have `flex-col gap-2` styling (vertical spacing), 49 separate messages appear stacked vertically.

## Solution Implemented

### Code Changes

**File:** `app/api/chat/route.ts`
**Lines:** 261-316 (modified)

Modified streaming handler to **concatenate deltas** into a single text part:

```typescript
// ✅ AFTER (Fixed)
if (typeof delta === 'string' && delta.length > 0) {
  const lastPart = assistantParts[assistantParts.length - 1];
  if (lastPart && lastPart.type === 'text') {
    lastPart.text += delta;  // Concatenate to existing part
  } else {
    assistantParts.push({ type: 'text', text: delta });
  }
}
```

Applied same logic to:
1. **String deltas** (lines 264-271)
2. **Array content parts - text** (lines 280-287)
3. **Array content parts - reasoning** (lines 293-300)

### Files Modified

1. `app/api/chat/route.ts`
   - Modified OpenAI streaming delta handling
   - Added concatenation logic for text parts
   - Added concatenation logic for reasoning parts
   - Lines: 261-316

## Testing Performed

### Test 1: New Message Creation

**Setup:**
- Created new chat
- Model: GPT 5.1 Thinking
- Message: "This is a test message to verify that text rendering works correctly after the fix..."

**Results:**
```javascript
// Database verification
{
  "messagesCount": 2,
  "messages": [
    {"role": "user", "partsCount": 1},
    {"role": "assistant", "partsCount": 1}  // ✅ Was 49, now 1
  ]
}
```

**Status:** ✅ PASS - Message stored with single part

### Test 2: UI Rendering

**Observed:**
- ✅ Text renders as continuous paragraph
- ✅ Proper message bubble formatting
- ✅ Retry and Copy buttons functional
- ✅ No vertical word splitting

**Status:** ✅ PASS

### Test 3: Existing Messages

**Observed:**
- ❌ Old messages with split parts still broken
- ✅ New messages render correctly

**Status:** ⚠️ PARTIAL - Fix is forward-compatible only

## Impact Assessment

### Users Affected
- **All users** who received OpenAI model responses before fix
- Estimated: All production users (100%)

### Data Integrity
- **Existing messages:** Remain broken with split parts
- **New messages:** Work correctly with single parts
- **Database:** No corruption, just sub-optimal structure

### User Experience
- **Before fix:** Responses completely unreadable
- **After fix:** New responses display normally
- **Old chats:** Still show broken formatting

## Recommendations

### Immediate Actions
- [x] Deploy fix to production
- [x] Update changelog
- [x] Create bug report documentation
- [ ] Monitor error logs for related issues

### Short-term Actions
- [ ] Consider database migration to fix existing messages
  - Consolidate multi-part messages into single parts
  - Preserve message content and timestamps
  - Test migration on staging first
- [ ] Add integration tests for streaming concatenation
- [ ] Add visual regression tests for message rendering

### Long-term Actions
- [ ] Add monitoring/alerts for message part count anomalies
- [ ] Consider adding database constraints on part count
- [ ] Document expected message structure in schema

## Migration Script (Proposed)

```sql
-- Example migration to consolidate message parts
-- WARNING: Test thoroughly before running in production

UPDATE messages
SET content = jsonb_build_object(
  'parts', jsonb_build_array(
    jsonb_build_object(
      'type', 'text',
      'text', (
        SELECT string_agg(part->>'text', '')
        FROM jsonb_array_elements(content->'parts') AS part
        WHERE part->>'type' = 'text'
      )
    )
  )
)
WHERE role = 'assistant'
  AND jsonb_array_length(content->'parts') > 5  -- Only fix multi-part messages
  AND (
    SELECT COUNT(*)
    FROM jsonb_array_elements(content->'parts') AS part
    WHERE part->>'type' = 'text'
  ) > 1;
```

## Related Issues

- None - This was a unique bug specific to OpenAI streaming implementation
- Non-OpenAI models were not affected due to using AI SDK's `onFinish` callback

## Technical Notes

### Why Non-OpenAI Models Weren't Affected

The non-OpenAI path uses Vercel AI SDK's `streamText` function with `onFinish` callback:

```typescript
// app/api/chat/route.ts (line 372-413)
onFinish: async ({ text, usage }) => {
  // Receives complete text, creates single part
  const assistantParts: MessagePart[] = [{ type: 'text', text: text }];

  await createMessage({
    chat_id: activeChatId!,
    role: 'assistant',
    content: { parts: assistantParts },
    token_count: usage?.totalTokens || getTokenCount(assistantParts),
  });
}
```

The `onFinish` callback receives the **complete text** after streaming completes, naturally creating a single part.

### Why OpenAI Path Was Different

OpenAI models use direct gateway streaming to preserve reasoning deltas:

```typescript
// app/api/chat/route.ts (line 202-221)
const upstream = await fetch('https://ai-gateway.vercel.sh/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.AI_GATEWAY_API_KEY}`,
  },
  body: JSON.stringify(payload),
});
```

This manual streaming required manual part accumulation, which was incorrectly implemented.

---

## Timeline

- **2025-01-23 14:00** - Bug discovered during QA testing
- **2025-01-23 14:15** - Root cause identified (streaming delta handling)
- **2025-01-23 14:30** - Fix implemented and tested
- **2025-01-23 14:45** - Fix verified with new test messages
- **2025-01-23 15:00** - Documentation updated

## Conclusion

The bug was successfully fixed for all new messages. Existing messages with split parts remain affected but can be fixed via database migration if needed. The fix is minimal, focused, and doesn't introduce breaking changes.

**Status:** ✅ Resolved (new messages)
**Next Steps:** Monitor production, consider migration for existing messages
