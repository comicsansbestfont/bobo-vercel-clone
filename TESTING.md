# Testing Guide

This document provides comprehensive guidance on testing the AI Chatbot application.

## Table of Contents

- [Overview](#overview)
- [Test Types](#test-types)
- [Running Tests](#running-tests)
- [Test Coverage](#test-coverage)
- [Writing Tests](#writing-tests)
- [CI/CD](#cicd)
- [Troubleshooting](#troubleshooting)

## Overview

The project uses [Playwright](https://playwright.dev/) for end-to-end (E2E) testing. E2E tests verify critical user flows by simulating real user interactions with the application.

### Why E2E Testing?

- **Regression Prevention**: Catch breaking changes before they reach production (e.g., TD-8 viewport bug)
- **User Flow Validation**: Ensure critical paths work end-to-end
- **Cross-browser Compatibility**: Test across different browsers (currently Chromium)
- **Confidence in Deployments**: Automated checks before merging PRs

## Test Types

### E2E Tests (`tests/e2e/`)

End-to-end tests that run in a real browser environment:

1. **Chat Creation** (`chat-creation.spec.ts`)
   - Creating new chats
   - Viewport visibility during streaming (TD-8 regression check)
   - Stop button functionality
   - Chat persistence across refreshes

2. **Project Chat Creation** (`project-chat-creation.spec.ts`)
   - Creating chats within project context
   - Project association verification
   - Viewport visibility in project context

3. **Chat Persistence** (`chat-persistence.spec.ts`)
   - Multi-message conversation persistence
   - Scroll position maintenance
   - Chat settings restoration (model, webSearch)

4. **M2 Citations Flow** (`m2-citations.spec.ts`)
   - File upload to knowledge base
   - Inline citation generation [1], [2]
   - Source attribution (Loop A + Loop B RAG)
   - Custom instructions application

## Running Tests

### Prerequisites

```bash
# Install dependencies (including Playwright)
npm install

# Install Playwright browsers (first time only)
npx playwright install chromium
```

### Test Commands

```bash
# Run all tests (headless mode)
npm test

# Run tests with UI mode (recommended for development)
npm run test:ui

# Run tests in headed mode (see browser)
npm run test:headed

# Run tests in debug mode (step through)
npm run test:debug

# View last test report
npm run test:report
```

### Running Specific Tests

```bash
# Run a single test file
npx playwright test tests/e2e/chat-creation.spec.ts

# Run tests matching a pattern
npx playwright test --grep "viewport"

# Run a specific test by title
npx playwright test -g "should create chat and keep viewport visible"
```

### Environment Setup

Tests require the following environment variables in `.env.local`:

```env
AI_GATEWAY_API_KEY=your_gateway_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

The test suite will:
1. Start the Next.js dev server automatically (`npm run dev`)
2. Run tests against `http://localhost:3000`
3. Shut down the server after tests complete

## Test Coverage

### Current Coverage

✅ **Core Chat Functionality**
- New chat creation
- Message sending and receiving
- Streaming responses
- Chat persistence

✅ **Project Features**
- Project-based chats
- Custom instructions
- Knowledge base file uploads

✅ **M2 Features (Double-Loop RAG)**
- Loop A: Project context caching
- Loop B: Global hybrid search
- Inline citations
- Source attribution

✅ **Regression Tests**
- TD-8: Viewport disappearing during streaming

### Not Yet Covered

⚠️ **To Be Added**
- Web search functionality (Perplexity integration)
- Model switching during conversations
- File attachment in messages
- Memory compression behavior
- Error handling scenarios

## Writing Tests

### Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup code (navigate, authenticate, etc.)
    await page.goto('/');
  });

  test('should do something', async ({ page }) => {
    // Arrange: Set up test conditions
    const input = page.locator('textarea[placeholder*="Message"]');

    // Act: Perform actions
    await input.fill('Test message');
    await page.locator('button[type="submit"]').click();

    // Assert: Verify outcomes
    await expect(page.locator('text=Test message')).toBeVisible();
  });
});
```

### Best Practices

1. **Use Descriptive Test Names**
   ```typescript
   ✅ test('should persist multi-message conversation across refresh')
   ❌ test('test persistence')
   ```

2. **Prefer Accessible Selectors**
   ```typescript
   ✅ page.locator('textarea[placeholder*="Message"]')
   ✅ page.locator('button[type="submit"]')
   ❌ page.locator('.class-name-xyz')
   ```

3. **Use Explicit Waits**
   ```typescript
   ✅ await expect(element).toBeVisible({ timeout: 10000 })
   ❌ await page.waitForTimeout(5000) // Only for streaming delays
   ```

4. **Avoid Hard-Coded Values**
   ```typescript
   ✅ const testMessage = 'Unique test message for E2E';
   ✅ await expect(page.locator(`text=${testMessage}`)).toBeVisible();
   ```

5. **Clean Up Test Data**
   ```typescript
   test.afterEach(async () => {
     // Delete test chats, files, etc.
   });
   ```

6. **Handle Flakiness**
   - AI responses vary - test for presence, not exact content
   - Use `.or()` for alternative selectors
   - Add appropriate timeouts for streaming
   - Check multiple conditions when possible

### Example: Testing AI Citations

```typescript
test('should show citations after uploading file', async ({ page }) => {
  // Navigate to project settings
  await page.goto(`/project/${projectId}/settings`);

  // Upload file
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles('path/to/test-file.md');
  await page.locator('button:has-text("Upload")').click();

  // Wait for upload
  await expect(page.locator('text=File uploaded successfully')).toBeVisible();

  // Navigate back to chat
  await page.goto(`/project/${projectId}`);

  // Ask question that should trigger citation
  const input = page.locator('textarea[placeholder*="Message"]');
  await input.fill('What does the knowledge base say about X?');
  await page.locator('button[type="submit"]').click();

  // Verify citation markers appear (may take time for AI response)
  const citationMarker = page.locator('text=/\\[\\d+\\]/').first();
  await expect(citationMarker).toBeVisible({ timeout: 15000 });
});
```

## CI/CD

### GitHub Actions Workflow

The project includes a CI pipeline (`.github/workflows/ci.yml`) that runs on every push and pull request:

**Jobs:**
1. **Lint** - ESLint checks
2. **Build** - Next.js build verification
3. **E2E Tests** - Full Playwright test suite

### Secrets Required

Configure these in GitHub repository settings (`Settings > Secrets and variables > Actions`):

```
AI_GATEWAY_API_KEY
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### Viewing Test Results

- **Playwright HTML Report**: Uploaded as artifact after test runs
- **Test Screenshots**: Uploaded if tests fail
- **Retention**: Reports kept for 30 days, screenshots for 7 days

To download artifacts:
1. Go to Actions tab in GitHub
2. Click on the workflow run
3. Scroll to "Artifacts" section
4. Download `playwright-report` or `test-screenshots`

## Troubleshooting

### Common Issues

#### 1. "Error: page.goto: net::ERR_CONNECTION_REFUSED"

**Cause**: Dev server not running or port 3000 is blocked.

**Solution**:
```bash
# Check if port 3000 is available
lsof -ti:3000

# Kill process if needed
kill -9 $(lsof -ti:3000)

# Run tests again
npm test
```

#### 2. "Timeout waiting for element"

**Cause**: Element not appearing due to slow AI response or UI changes.

**Solution**:
- Increase timeout: `{ timeout: 30000 }`
- Check if selector changed in the UI
- Verify AI response is actually generated

#### 3. "Database errors during tests"

**Cause**: Test data conflicts or missing migrations.

**Solution**:
```bash
# Ensure local DB is up to date
npx supabase db reset  # If using Supabase CLI

# Or manually clear test data from Supabase dashboard
```

#### 4. "Flaky tests (pass/fail randomly)"

**Cause**: AI responses vary, timing issues, or race conditions.

**Solution**:
- Don't test exact AI response text
- Use `waitForLoadState('networkidle')`
- Add retry logic: `retries: 2` in playwright.config.ts
- Check for multiple indicators of success

#### 5. "Tests pass locally but fail in CI"

**Cause**: Environment differences, missing secrets, or resource constraints.

**Solution**:
- Verify all secrets are set in GitHub
- Check CI logs for specific error messages
- Use `DEBUG=pw:api` to see detailed Playwright logs
- Consider increasing timeouts in CI environment

### Debug Mode

For deep debugging:

```bash
# Run with Playwright Inspector
npm run test:debug

# Enable verbose logging
DEBUG=pw:api npm test

# Run tests in headed mode to see what's happening
npm run test:headed
```

### Test Data Management

**Best Practice**: Tests should create and clean up their own data.

```typescript
let testProjectId: string;

test.beforeEach(async ({ page }) => {
  // Create test project
  testProjectId = await createTestProject();
});

test.afterEach(async () => {
  // Clean up
  if (testProjectId) {
    await deleteProject(testProjectId);
  }
});
```

## Contributing

### Adding New Tests

1. Identify the user flow to test
2. Create a new `.spec.ts` file in `tests/e2e/`
3. Write descriptive test cases
4. Run tests locally: `npm run test:ui`
5. Ensure tests pass in CI before merging

### Test Maintenance

- Update tests when UI changes
- Add tests for bug fixes (regression tests)
- Keep test data realistic
- Document complex test scenarios

### Code Review Checklist

- [ ] Tests have descriptive names
- [ ] Selectors are stable (avoid brittle CSS classes)
- [ ] Appropriate timeouts for async operations
- [ ] Tests clean up after themselves
- [ ] Tests pass locally multiple times
- [ ] Tests pass in CI

## Cross-Chat Context Sharing Testing

### ✅ Automated Verification

The database implementation has been verified:
- ✅ `search_project_messages` SQL function exists and is callable
- ✅ TypeScript wrapper functions work correctly
- ✅ Build compiles without errors
- ✅ All code changes integrated successfully

Run verification: `npx tsx scripts/verify-search-function.ts`

### Manual E2E Testing Steps

**Objective**: Verify that chats within the same project can share context with each other.

#### Step 1: Create a Test Project
1. Navigate to http://localhost:3000
2. Create a project named "Mining Equipment"
3. Add description: "Testing cross-chat context"

#### Step 2: Create Chat A and Add Context
1. Inside "Mining Equipment" project, start a new chat
2. Rename to "Chat A - Equipment Details"
3. Send message:
   ```
   We use Caterpillar D11 bulldozers for our mining operations.
   They are very reliable for heavy earthmoving. We have 5 units operating 24/7.
   ```
4. Wait for AI response (embedding generated automatically)

#### Step 3: Create Chat B and Test Context Sharing
1. Create a NEW chat in the same project
2. Rename to "Chat B - Equipment Inquiry"
3. Send message: `What bulldozers do we use at the site?`

#### Step 4: Verify Context Sharing

**Expected Results:**

1. **Response Content**: AI mentions Caterpillar D11 bulldozers
2. **Citations Appear**:
   - Look for "Sources (N)" at bottom of response
   - Click to expand
   - Section: "📨 Referenced from Project Conversations"
   - Shows: "From: Chat A - Equipment Details"
   - Similarity percentage displayed

3. **System Prompt (in logs)**:
   ```
   ### RELATED CONVERSATIONS IN THIS PROJECT
   The following are relevant excerpts from your OTHER conversations...
   ```

#### Step 5: Test Threshold Lowering
Create a third chat with tangential question: `Tell me about our heavy equipment.`
- Should still find relevant context (threshold is 0.25)

#### Step 6: Test Cross-Project Isolation
1. Create a DIFFERENT project (e.g., "Restaurant Operations")
2. Ask about bulldozers
3. **Expected**: Should NOT reference Mining Equipment chats

### Troubleshooting

**Issue: No citations appear**
- Check messages have embeddings: `SELECT id FROM messages WHERE embedding IS NULL`
- Verify project has multiple chats
- Check console for errors

**Issue: Current chat appears in results**
- Check `app/api/chat/route.ts:424` excludes `p_current_chat_id`

**Issue: Citations from wrong project**
- Verify SQL function: `WHERE c.project_id = p_project_id`

### Database Verification Queries

```sql
-- Check projects with multiple chats
SELECT p.name, COUNT(c.id) as chat_count
FROM projects p
JOIN chats c ON c.project_id = p.id
GROUP BY p.id, p.name
HAVING COUNT(c.id) > 1;

-- Test search function directly
SELECT * FROM search_project_messages(
  'YOUR_PROJECT_ID'::uuid,
  'YOUR_CURRENT_CHAT_ID'::uuid,
  (SELECT embedding FROM messages WHERE embedding IS NOT NULL LIMIT 1),
  0.25,
  5
);
```

### Success Criteria

Implementation is successful if:
- [x] Database function exists and works
- [x] Build compiles without errors
- [ ] Chat B retrieves context from Chat A within same project
- [ ] Citations appear in "Referenced from Project Conversations" section
- [ ] Current chat excluded from search results
- [ ] Different projects don't leak context
- [ ] Threshold of 0.25 returns relevant results

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Testing Library Principles](https://testing-library.com/docs/guiding-principles/)
- [Project Documentation](./docs/)
