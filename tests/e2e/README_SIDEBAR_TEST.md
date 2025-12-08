# Sidebar Navigation E2E Test Suite

## Overview

This test suite validates sidebar navigation functionality on the production site (bobo.lovabo.com) using Chrome DevTools Protocol. It helps identify issues with chat loading, API errors, and race conditions.

## Quick Start

```bash
# 1. Start Chrome with remote debugging
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-debug

# 2. Navigate to https://bobo.lovabo.com and log in

# 3. Run the test
npm run test:sidebar

# Or use the helper script
./tests/e2e/run-sidebar-test.sh
```

## What Gets Tested

| Test | Description | Success Criteria |
|------|-------------|------------------|
| Sidebar Detection | Lists all sidebar chat items | Finds chat items with text and UIDs |
| Click Navigation | Simulates clicking sidebar chats | URL updates with correct chatId |
| Page Loading | Waits for chat to load | Messages appear in viewport |
| Network Monitoring | Tracks `/api/chats/[id]` requests | All requests return 200 status |
| Error Detection | Looks for 404/500 errors | No failed API calls |
| Race Conditions | Detects "Skipping history load" logs | No race condition warnings |
| Console Messages | Captures all console output | No errors or warnings |

## Architecture

```
┌─────────────────┐
│  Test Script    │
│  (Node.js)      │
└────────┬────────┘
         │
         │ WebSocket
         │ Connection
         ▼
┌─────────────────┐
│ Chrome DevTools │
│   Protocol      │
│  (port 9222)    │
└────────┬────────┘
         │
         │ Controls
         ▼
┌─────────────────┐
│  Chrome Browser │
│  with page at   │
│ bobo.lovabo.com │
└─────────────────┘
```

The test connects to Chrome via CDP, executes JavaScript in the page context, and monitors network/console activity.

## Test Flow

```
1. Connect to Chrome DevTools Protocol
   └─> Find page target for bobo.lovabo.com

2. Enable monitoring domains
   └─> Page, Runtime, Network, Console

3. Take initial snapshot
   └─> Capture sidebar state, current chat, message count

4. Click first sidebar chat (index 0)
   └─> Verify click succeeded
   └─> Wait 3 seconds for loading

5. Take snapshot after first click
   └─> Verify URL changed
   └─> Verify messages loaded

6. Check console & network
   └─> Look for race condition logs
   └─> Check API request status codes

7. Click second sidebar chat (index 1)
   └─> Repeat steps 4-6

8. Generate summary report
   └─> Total requests, success rate, issues found
```

## Output Examples

### Successful Test Run
```
✅ ALL CHECKS PASSED - Sidebar navigation working correctly!

Total /api/chats/ requests: 2
  ✅ Successful (2xx): 2
  ❌ Failed (4xx/5xx): 0

Race Condition Logs: 0
  ✅ No race conditions detected
```

### Failed Test with Issues
```
⚠️  ISSUES DETECTED - See details above

Total /api/chats/ requests: 3
  ✅ Successful (2xx): 2
  ❌ Failed (4xx/5xx): 1

Failed Requests:
  404 - https://bobo.lovabo.com/api/chats/deleted-chat-id

Race Condition Logs: 2
  ⚠️  Race conditions detected!
```

## Troubleshooting

### Connection Issues

**Problem:** "No page found at bobo.lovabo.com"

**Solutions:**
1. Verify Chrome started with `--remote-debugging-port=9222`
2. Check http://localhost:9222/json shows your page
3. Ensure you navigated to bobo.lovabo.com (not localhost:3000)

### Selector Issues

**Problem:** "Item not found" when clicking

**Solutions:**
1. Check if sidebar HTML structure changed
2. Update selectors in `clickSidebarChat()` function
3. Use Chrome DevTools to inspect actual elements

### Timeout Issues

**Problem:** "CDP command timed out"

**Solutions:**
1. Increase timeout in `sendCDPCommand()` (default: 30s)
2. Check if page is still loading (wait longer)
3. Verify network connection is stable

### No Chat Items Found

**Problem:** Snapshot shows 0 sidebar chats

**Solutions:**
1. Ensure you're logged in
2. Check if sidebar is collapsed (expand it manually)
3. Verify you have chat history in your account

## Integration with Existing Tests

This test complements existing Playwright tests:

| Test Type | When to Use |
|-----------|-------------|
| **Playwright** (`*.spec.ts`) | Automated CI/CD, unit testing, new features |
| **CDP Test** (this) | Manual debugging, production site testing, race condition hunting |

## Customization

### Test More Chats
```typescript
// Test first 5 chats
for (let i = 0; i < 5; i++) {
  await clickSidebarChat(ws, i);
  await new Promise(r => setTimeout(r, 3000));
  await checkConsoleForErrors(Date.now() - 3000);
  await checkNetworkRequests(Date.now() - 3000);
}
```

### Test Specific Chat by UID
```typescript
const result = await sendCDPCommand(ws, 'Runtime.evaluate', {
  expression: `
    const targetChat = document.querySelector('[data-uid="4_15"]');
    if (targetChat) {
      targetChat.click();
      return { success: true };
    }
    return { success: false };
  `,
  returnByValue: true,
});
```

### Add Custom Assertions
```typescript
// After clicking, assert specific message exists
const hasExpectedMessage = await sendCDPCommand(ws, 'Runtime.evaluate', {
  expression: `
    document.body.textContent.includes('expected message text')
  `,
  returnByValue: true,
});
```

## Files in This Suite

```
tests/e2e/
├── sidebar-navigation-test.ts        # Main test script
├── run-sidebar-test.sh              # Helper script
├── SIDEBAR_NAVIGATION_TEST.md       # Detailed docs
├── QUICK_START.md                   # Quick reference
└── README_SIDEBAR_TEST.md           # This file
```

## Dependencies

- `ws` - WebSocket client for CDP connection
- `@types/ws` - TypeScript definitions
- Chrome with `--remote-debugging-port=9222`

## Contributing

To add new test scenarios:

1. Edit `sidebar-navigation-test.ts`
2. Add new test function (follow existing pattern)
3. Update documentation
4. Test on production site
5. Commit changes

## Support

If you encounter issues:

1. Check Chrome DevTools Console for JavaScript errors
2. Review Network tab for failed requests
3. Inspect HTML structure in Elements tab
4. Check test output for specific error messages
5. Refer to detailed docs in `SIDEBAR_NAVIGATION_TEST.md`

## Related Documentation

- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)
- [Playwright E2E Tests](../../playwright.config.ts)
- [Chat Persistence Tests](./chat-persistence.spec.ts)
