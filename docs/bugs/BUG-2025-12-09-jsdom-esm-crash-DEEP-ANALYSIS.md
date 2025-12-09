# Deep Analysis: jsdom ESM Crash & Downstream Effects

**Report ID:** BUG-2025-12-09-001-DEEP
**Analysis Date:** 2025-12-09
**Status:** REQUIRES REVIEW - Fix may have unintended consequences

---

## Executive Summary

The quick fix (replacing jsdom with node-html-parser) resolved the immediate crash but introduced **significant functionality degradation**. Additionally, there are **multiple systemic issues** that remain unaddressed and could cause future incidents.

---

## Part 1: The Fix Was Over-Aggressive

### What We Removed

| Component | Purpose | Had ESM Issues? |
|-----------|---------|-----------------|
| `jsdom` | Full DOM emulation | YES - caused crash |
| `@mozilla/readability` | Content extraction algorithm | **NO** - has zero dependencies |

### Critical Discovery

**`@mozilla/readability` has NO dependencies** (confirmed via npm info: `deps: none`).

The crash was caused **only by jsdom**, not by Readability. We removed a perfectly working, sophisticated content extraction algorithm unnecessarily.

### Functionality Comparison

| Feature | Original (Readability) | Current (node-html-parser) |
|---------|----------------------|---------------------------|
| Content scoring | Yes - ML-like scoring | No - naive selector |
| Ad/sidebar detection | Yes - by content density | No - only by tag name |
| Comment section removal | Yes - by link density | No |
| Multi-column layouts | Yes | No |
| Lazy-loaded content | Partial | No |
| Algorithm | Mozilla's (Firefox Reader View) | Basic CSS selectors |

### Original Algorithm (Readability)
```javascript
const dom = new JSDOM(rawText, { url: response.url });
const reader = new Readability(dom.window.document);
const article = reader.parse();
// article.textContent = clean main content only
```

### Current Algorithm (node-html-parser)
```javascript
const root = parseHtml(rawText);
root.querySelectorAll('script, style, noscript, iframe, nav, footer, header, aside').forEach(el => el.remove());
const mainContent = root.querySelector('article') || root.querySelector('main') || root.querySelector('body');
extractedContent = mainContent.textContent;
// May include: sidebars, ads, comments, related articles, etc.
```

### Impact on fetch_url Tool

When users ask Bobo to read web pages:

| Page Type | Before | After |
|-----------|--------|-------|
| News articles | Clean article text | Article + sidebar + ads + comments |
| Documentation | Main content | May include nav menus |
| Blog posts | Post content only | Post + author bio + related posts |
| Landing pages | Main pitch | Everything including footers |

**Estimated quality degradation: 30-50% more noise in extracted content**

---

## Part 2: The jsdom Ghost Problem

### The Mystery

jsdom was in Vercel's `/var/task/node_modules/jsdom` but was **NOT** in:
- `package.json`
- `package-lock.json`
- Local `node_modules/`

### Possible Causes

1. **Vercel Build Cache**
   - Previous deployment had jsdom
   - Cache wasn't invalidated
   - New code tried to import it → crash

2. **Phantom Dependency**
   - Some package has jsdom as optional/peer dep
   - npm resolved it during Vercel's install
   - Different resolution than local

3. **Vercel Layer Injection**
   - Vercel's internal tooling may add certain packages
   - Unlikely but not impossible

### Why This Matters

**This could happen again.** Without understanding the root cause, any future package with similar ESM issues could appear mysteriously in production.

### Recommended Investigation

```bash
# On Vercel's build output, check:
vercel build --debug 2>&1 | grep -i "jsdom\|optional\|peer"

# Check if any package has jsdom as optional
npm ls jsdom --all 2>&1
```

---

## Part 3: Silent Failure Pattern (Critical)

### Current Failure Mode

```
User sends message
    ↓
Message saved to DB ✓
    ↓
API attempts to generate response
    ↓
API crashes ✗
    ↓
No response sent to client
    ↓
User sees: nothing (chat appears frozen)
```

### What User Experiences

1. Types message, hits send
2. Message appears in chat
3. Loading indicator shows briefly
4. Nothing happens
5. No error message
6. Chat appears "stuck"

### Required Fixes

#### A. Frontend Error Recovery

```typescript
// Detect orphaned messages (user message with no response after X seconds)
useEffect(() => {
  const lastMessage = messages[messages.length - 1];
  if (lastMessage?.role === 'user' && !isLoading) {
    // Check if we've been waiting too long
    const timeSinceMessage = Date.now() - lastMessage.timestamp;
    if (timeSinceMessage > 30000) { // 30 seconds
      setShowRetryButton(true);
    }
  }
}, [messages, isLoading]);
```

#### B. Server-Side Error Logging

```typescript
// In /api/chat
try {
  // ... existing code
} catch (error) {
  // Log to monitoring service
  await logFailedRequest({
    chatId,
    userId,
    error: error.message,
    stack: error.stack,
    timestamp: new Date(),
  });

  // Return error response (not silent failure)
  return new Response(
    JSON.stringify({ error: 'Chat failed', retryable: true }),
    { status: 500 }
  );
}
```

#### C. Monitoring & Alerting

- Set up Vercel Analytics error rate alerts
- Add Sentry or similar APM
- Create PagerDuty/Slack alerts for P0 errors

---

## Part 4: Recommended Better Fix

### Option A: Use Lightweight DOM + Keep Readability

```bash
npm uninstall node-html-parser
npm install linkedom @mozilla/readability
```

```typescript
import { parseHTML } from 'linkedom';
import { Readability } from '@mozilla/readability';

// In fetchUrl:
const { document } = parseHTML(rawText);
const reader = new Readability(document);
const article = reader.parse();
```

**Pros:**
- Restores Readability's quality
- linkedom is ESM-compatible
- ~100KB vs jsdom's 2MB

**Cons:**
- Another dependency to manage

### Option B: Use happy-dom + Readability

```bash
npm install happy-dom @mozilla/readability
```

**Similar to Option A, different DOM implementation.**

### Option C: Accept Degradation (Current State)

Keep node-html-parser, accept lower quality web scraping.

**Pros:**
- Already deployed, working
- Simpler dependency tree

**Cons:**
- 30-50% more noise in extracted content
- Worse user experience for web fetching

---

## Part 5: Other Potential ESM Time Bombs

### Current Dependencies to Watch

| Package | Risk Level | Reason |
|---------|------------|--------|
| `shiki` | Medium | Heavy, uses WASM |
| `@anthropic-ai/sdk` | Low | Well-maintained |
| `posthog-js` | Low | Browser-focused |
| `motion` | Low | Pure ESM |

### Prevention Strategy

1. **Pre-deploy Testing**
   ```bash
   # Run before every deployment
   vercel build --local
   npm run start # Test built output
   ```

2. **Dependency Auditing**
   ```bash
   # Check for mixed ESM/CJS
   npx are-you-es5 check . --with-node-modules
   ```

3. **Lock File Discipline**
   - Always commit `package-lock.json`
   - Review lock file changes in PRs
   - Use `npm ci` in CI/CD (not `npm install`)

---

## Part 6: Action Items (Prioritized)

### P0 - Immediate (This Week)

| # | Action | Owner | Status |
|---|--------|-------|--------|
| 1 | Add frontend retry button for failed messages | TBD | TODO |
| 2 | Add server-side error logging for chat failures | TBD | TODO |
| 3 | Set up Vercel error rate alerting | TBD | TODO |

### P1 - Short Term (Next 2 Weeks)

| # | Action | Owner | Status |
|---|--------|-------|--------|
| 4 | Evaluate linkedom + Readability restoration | TBD | TODO |
| 5 | Add integration test for fetch_url quality | TBD | TODO |
| 6 | Investigate Vercel build cache behavior | TBD | TODO |

### P2 - Medium Term (Next Month)

| # | Action | Owner | Status |
|---|--------|-------|--------|
| 7 | Document ESM compatibility requirements | TBD | TODO |
| 8 | Add pre-deploy build verification to CI | TBD | TODO |
| 9 | Create dependency audit script | TBD | TODO |

---

## Part 7: Risk Assessment

### If We Do Nothing

| Risk | Probability | Impact | Overall |
|------|-------------|--------|---------|
| Another ESM crash | Medium | High | **High** |
| Silent failures continue | Certain | Medium | **High** |
| Poor web scraping quality | Certain | Low | **Medium** |
| User trust erosion | Medium | High | **High** |

### If We Implement All Fixes

| Risk | Probability | Impact | Overall |
|------|-------------|--------|---------|
| ESM crashes | Low | High | **Medium** |
| Silent failures | Low | Medium | **Low** |
| Web scraping quality | Low | Low | **Low** |
| User trust | Low | Low | **Low** |

---

## Appendix: Test Plan for fetch_url Quality

```typescript
// tests/fetch-url-quality.test.ts
describe('fetch_url content extraction', () => {
  const testUrls = [
    'https://example.com/article', // Standard article
    'https://medium.com/...',      // Complex layout
    'https://docs.github.com/...', // Documentation
  ];

  test.each(testUrls)('extracts clean content from %s', async (url) => {
    const result = await fetchUrl({ url });
    const parsed = JSON.parse(result);

    // Check for common noise patterns
    expect(parsed.content).not.toContain('Subscribe to newsletter');
    expect(parsed.content).not.toContain('Related articles');
    expect(parsed.content).not.toContain('Cookie policy');

    // Check content ratio (signal vs noise)
    const wordCount = parsed.content.split(/\s+/).length;
    expect(wordCount).toBeGreaterThan(100); // Meaningful content
    expect(wordCount).toBeLessThan(10000);  // Not too much noise
  });
});
```

---

## Conclusion

The immediate fire is out, but we've:
1. Downgraded functionality (removed Readability)
2. Not addressed the silent failure UX
3. Not understood why jsdom appeared in production
4. Not set up monitoring to catch future issues

**Recommended next step:** Schedule a 1-hour incident review to prioritize and assign the P0 items.

---

*Deep analysis by Claude Code*
