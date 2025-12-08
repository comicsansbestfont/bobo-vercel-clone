# Quick Start: Sidebar Navigation Testing

## TL;DR

```bash
# 1. Start Chrome with debugging
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-debug

# 2. Navigate to bobo.lovabo.com in that Chrome window

# 3. Run the test
npm run test:sidebar
```

## What This Tests

- Clicking sidebar chats navigates correctly
- Chat history loads after clicking
- No 404/500 errors on `/api/chats/[id]` endpoints
- No race condition console logs ("Skipping history load")

## Expected Output (Success)

```
🧪 Sidebar Navigation Test
======================================================================

🌐 Step 1: Connecting to Chrome DevTools...
   ✅ Connected to page

📊 Step 2: Taking initial snapshot...

📸 Taking snapshot: Initial state
   URL: https://bobo.lovabo.com/?chatId=abc123
   Current Chat ID: abc123
   Sidebar Chats: 15
   First 5 sidebar chats:
     1. "what was my last chat with nathan?" (uid: 4_15)
     2. "SwiftCheckin meeting prep" (uid: 3_12)
     ...

🧪 Step 3: Testing first sidebar chat click...

🖱️  Clicking sidebar chat at index 0...
   ✅ Clicked: "what was my last chat with nathan?"
   Chat ID: abc123xyz
   URL: /?chatId=abc123xyz

⏳ Waiting 3 seconds for page to load...

📸 Taking snapshot: After clicking first chat
   URL: https://bobo.lovabo.com/?chatId=abc123xyz
   Current Chat ID: abc123xyz
   Message Count: 24
   Has Messages: true

🔍 Console Messages (since 10:30:45 AM):
   ✅ No race condition or error logs detected

🌐 Network Requests (since 10:30:45 AM):
   Found 1 chat API requests:
      ✅ 200 OK - /api/chats/abc123xyz

[... repeats for second chat ...]

📊 Test Summary

Total /api/chats/ requests: 2
  ✅ Successful (2xx): 2
  ❌ Failed (4xx/5xx): 0

Race Condition Logs: 0
  ✅ No race conditions detected

======================================================================

✅ ALL CHECKS PASSED - Sidebar navigation working correctly!
```

## Common Issues

### 404 Errors on Chat Load
**Symptom:** `/api/chats/[id]` returns 404

**Possible Causes:**
- Chat deleted from database but still in sidebar cache
- Chat ID malformed in URL
- Database migration issue

**Solution:** Check database for chat existence

### Race Condition Logs
**Symptom:** Console shows "Skipping history load - already loading"

**Possible Causes:**
- Multiple rapid clicks
- Slow network causing overlapping requests
- useEffect dependencies causing re-runs

**Solution:** Review chat loading logic in `/app/page.tsx`

### No Messages After Click
**Symptom:** Chat navigates but shows empty state

**Possible Causes:**
- API returned empty array
- Messages failed to render
- Loading state stuck

**Solution:** Check network response and React component state

## Files Created

1. `/tests/e2e/sidebar-navigation-test.ts` - Main test script
2. `/tests/e2e/SIDEBAR_NAVIGATION_TEST.md` - Detailed documentation
3. `/tests/e2e/run-sidebar-test.sh` - Helper shell script
4. `/tests/e2e/QUICK_START.md` - This file

## Next Steps

After identifying issues, you can:

1. **Debug in Chrome DevTools** - Console tab to see errors
2. **Check Network Tab** - See actual API responses
3. **Review Code** - Check `/app/page.tsx` for chat loading logic
4. **Add Logging** - Insert console.logs in suspect areas
5. **Write Fix** - Address the root cause
6. **Re-test** - Run this test again to verify

## Advanced Usage

### Test Specific Chat Index
Edit `sidebar-navigation-test.ts` and change the indices:

```typescript
await clickSidebarChat(ws, 5); // Test 6th chat instead of 1st
```

### Test All Sidebar Chats
Add a loop to test every chat:

```typescript
for (let i = 0; i < 10; i++) {
  await clickSidebarChat(ws, i);
  await new Promise(r => setTimeout(r, 3000));
  // ... check results
}
```

### Increase Wait Time
If your network is slow:

```typescript
await new Promise(r => setTimeout(r, 5000)); // 5 seconds instead of 3
```
