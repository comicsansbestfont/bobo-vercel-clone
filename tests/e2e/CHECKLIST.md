# Sidebar Navigation Test - Pre-Flight Checklist

Use this checklist before running the sidebar navigation test to ensure everything is properly configured.

## Pre-Test Setup

### 1. Chrome Setup
- [ ] Chrome is installed on your system
- [ ] You can access `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` (macOS)
- [ ] Or you know the correct Chrome executable path for your OS

### 2. Start Chrome with Remote Debugging
- [ ] Close all existing Chrome instances
- [ ] Run the remote debugging command for your OS:

**macOS:**
```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-debug
```

**Linux:**
```bash
google-chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-debug
```

**Windows:**
```bash
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir=C:\temp\chrome-debug
```

- [ ] Chrome opens with a new window
- [ ] You see a message about remote debugging (optional)

### 3. Verify DevTools Protocol
- [ ] Open http://localhost:9222/json in a browser (or curl)
- [ ] You see JSON array of targets
- [ ] At least one target shows `"type": "page"`

### 4. Navigate to Production Site
- [ ] In the Chrome instance you just opened, navigate to https://bobo.lovabo.com
- [ ] Page loads successfully
- [ ] You are logged in (or log in if needed)
- [ ] Sidebar is visible with chat history

### 5. Verify Test Prerequisites
- [ ] Sidebar shows at least 2 chat items
- [ ] You can manually click a sidebar chat and it loads
- [ ] Network tab shows successful `/api/chats/[id]` requests

### 6. Verify Test Script
- [ ] You're in the project root directory
- [ ] Run `npm run test:sidebar --help` or check package.json
- [ ] Dependencies are installed (`ws` package)

## Running the Test

### Option A: npm script (recommended)
```bash
npm run test:sidebar
```

### Option B: Direct execution
```bash
npx tsx tests/e2e/sidebar-navigation-test.ts
```

### Option C: Helper script
```bash
./tests/e2e/run-sidebar-test.sh
```

## During Test Execution

Watch for:
- [ ] "✅ Connected to page" message
- [ ] Snapshot showing your sidebar chats
- [ ] Click confirmations with chat titles
- [ ] Network request monitoring
- [ ] Console message capture

## After Test Completion

Review the output:
- [ ] Test summary shows total requests
- [ ] Success/failure counts are displayed
- [ ] Race condition log count is shown
- [ ] Final verdict (PASSED or ISSUES DETECTED)

## Interpreting Results

### ✅ All Good
- All `/api/chats/[id]` requests return 200
- No race condition logs
- No console errors
- Messages load after clicking

**Action:** No issues found, navigation working correctly!

### ⚠️ Minor Issues
- Some race condition logs but chats still load
- Slow loading times (> 3 seconds)
- Minor console warnings (not errors)

**Action:** Review logs, consider optimizing loading logic

### ❌ Critical Issues
- 404 errors on `/api/chats/[id]`
- 500 server errors
- Messages don't load after clicking
- Console shows JavaScript errors

**Action:** Debug immediately, check server logs, review code

## Troubleshooting Steps

If the test fails to connect:

1. **Check Chrome Process**
   ```bash
   ps aux | grep chrome | grep 9222
   ```
   - [ ] Chrome process is running with port 9222

2. **Check Port Availability**
   ```bash
   curl http://localhost:9222/json
   ```
   - [ ] Returns JSON (not connection refused)

3. **Check Target Page**
   ```bash
   curl -s http://localhost:9222/json | grep bobo.lovabo.com
   ```
   - [ ] bobo.lovabo.com appears in output

4. **Restart Chrome**
   - [ ] Kill all Chrome processes
   - [ ] Run debugging command again
   - [ ] Navigate to bobo.lovabo.com

5. **Check Firewall**
   - [ ] Port 9222 not blocked by firewall
   - [ ] localhost access is allowed

## Post-Test Cleanup

- [ ] Close the Chrome instance with remote debugging
- [ ] Review test output for any actionable items
- [ ] Document any issues found
- [ ] Create tickets for bugs if needed
- [ ] Share results with team

## Common Issues Reference

| Issue | Cause | Solution |
|-------|-------|----------|
| "No page found" | Chrome not running on 9222 | Restart Chrome with debugging flag |
| "CDP command timed out" | Slow network/page | Increase timeout, check network |
| "Item not found" | Sidebar selectors changed | Update selectors in test script |
| 404 on chat API | Chat deleted from DB | Clean up sidebar cache |
| Race condition logs | Multiple rapid loads | Review useEffect dependencies |
| No messages after click | API returned empty | Check database, API logs |

## Environment Notes

**Testing Environment:**
- URL: https://bobo.lovabo.com (production)
- Chrome Version: Check `chrome://version`
- Test Script: `/tests/e2e/sidebar-navigation-test.ts`
- Dependencies: ws, @types/ws

**Important:**
- This test runs against PRODUCTION data
- Don't run destructive operations
- Monitor carefully for side effects
- Test during low-traffic periods if possible

## Success Criteria

Test is considered successful if:
- [x] Connects to Chrome DevTools Protocol
- [x] Detects sidebar chat items
- [x] Successfully clicks 2+ sidebar chats
- [x] All chat API requests return 200 status
- [x] No race condition logs detected
- [x] Messages load after each click
- [x] No console errors

## Next Steps After Testing

1. **If All Tests Pass:**
   - Document baseline performance
   - Set up monitoring for regressions
   - Consider adding to CI/CD (if feasible)

2. **If Issues Found:**
   - Create detailed bug report with test output
   - Review relevant code in `/app/page.tsx`
   - Check API logs for server-side errors
   - Test locally to reproduce
   - Implement fix and re-test

3. **For Ongoing Monitoring:**
   - Run weekly on production
   - Compare results over time
   - Track trends in loading times
   - Monitor for new race conditions

---

**Ready to Test?**

Once all checkboxes above are complete, run:
```bash
npm run test:sidebar
```

Good luck! 🚀
