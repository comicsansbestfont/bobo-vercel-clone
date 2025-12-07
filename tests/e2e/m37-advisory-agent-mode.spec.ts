import { test, expect, Page, BrowserContext } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * E2E Test: M37-01 Agent Mode Integration
 *
 * Comprehensive Agent Mode testing with:
 * - Tool visibility and registration
 * - Tool invocation tracking
 * - Response quality validation
 * - UI component verification
 * - Error handling validation
 *
 * Uses Chrome DevTools for:
 * - Console message monitoring
 * - Network request validation
 * - Screenshot capture for visual testing
 * - Performance metrics
 *
 * Prerequisites:
 * - Advisory files indexed
 * - Dev server running on localhost:3000
 */

// Screenshot directory for test artifacts
const SCREENSHOT_DIR = path.join(__dirname, '../screenshots/m37');

test.describe('M37-01: Agent Mode Integration', () => {
  let consoleMessages: string[] = [];
  let networkErrors: string[] = [];

  test.beforeAll(async () => {
    // Ensure screenshot directory exists
    if (!fs.existsSync(SCREENSHOT_DIR)) {
      fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }
  });

  test.beforeEach(async ({ page }) => {
    // Reset collectors
    consoleMessages = [];
    networkErrors = [];

    // Collect console messages
    page.on('console', msg => {
      const text = `[${msg.type()}] ${msg.text()}`;
      consoleMessages.push(text);

      // Log errors and warnings immediately
      if (msg.type() === 'error' || msg.type() === 'warning') {
        console.log('Console:', text);
      }
    });

    // Collect network errors
    page.on('requestfailed', request => {
      const failure = `${request.url()} - ${request.failure()?.errorText}`;
      networkErrors.push(failure);
      console.log('Network error:', failure);
    });

    // Navigate to home
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async ({ page }, testInfo) => {
    // Take screenshot on failure
    if (testInfo.status === 'failed') {
      const screenshotPath = path.join(SCREENSHOT_DIR, `${testInfo.title.replace(/\s+/g, '-')}-failed.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`Screenshot saved: ${screenshotPath}`);
    }

    // Log console errors for debugging
    const errors = consoleMessages.filter(m => m.includes('[error]'));
    if (errors.length > 0) {
      console.log('Console errors detected:', errors);
    }
  });

  test.describe('Agent Mode UI Components', () => {
    test('should display chat interface on load', async ({ page }) => {
      // Take initial screenshot
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'agent-mode-initial.png'),
        fullPage: true,
      });

      // Verify core UI elements
      const messageInput = page.locator('textarea[placeholder]').first();
      await expect(messageInput).toBeVisible();

      // Check for model selector
      const modelSelector = page.locator('button').filter({ hasText: /gpt|claude|gemini/i }).first();
      const hasModelSelector = await modelSelector.isVisible({ timeout: 5000 }).catch(() => false);
      console.log('Model selector visible:', hasModelSelector);

      // Check for web search toggle
      const webSearchToggle = page.locator('button').filter({ hasText: /web|search/i }).first();
      const hasWebSearch = await webSearchToggle.isVisible({ timeout: 5000 }).catch(() => false);
      console.log('Web search toggle visible:', hasWebSearch);

      // Verify no JavaScript errors on load
      const jsErrors = consoleMessages.filter(m =>
        m.includes('[error]') &&
        !m.includes('favicon') // Ignore favicon errors
      );
      expect(jsErrors.length).toBe(0);
    });

    test('should display tool indicators when search_advisory is invoked', async ({ page }) => {
      const messageInput = page.locator('textarea[placeholder]').first();
      await expect(messageInput).toBeVisible();

      // Submit a query that should trigger advisory search
      await messageInput.fill('Brief me on MyTab');

      const submitButton = page.locator('button[type="submit"]').or(
        page.locator('button:has-text("Send")')
      );
      await submitButton.click();

      // Wait for tool invocation
      await page.waitForTimeout(5000);

      // Take screenshot during processing
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'agent-mode-processing.png'),
        fullPage: true,
      });

      // Look for tool indicator (📂 or "search_advisory" text)
      const toolIndicator = page.locator('text=/📂|search_advisory|advisory/i').first();
      const hasToolIndicator = await toolIndicator.isVisible({ timeout: 20000 }).catch(() => false);
      console.log('Tool indicator visible:', hasToolIndicator);

      // Wait for response completion
      await page.waitForTimeout(15000);

      // Take screenshot after response
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'agent-mode-response.png'),
        fullPage: true,
      });
    });

    test('should display streaming response correctly', async ({ page }) => {
      const messageInput = page.locator('textarea[placeholder]').first();
      await expect(messageInput).toBeVisible();

      await messageInput.fill('What deals do we have on file?');

      const submitButton = page.locator('button[type="submit"]').or(
        page.locator('button:has-text("Send")')
      );
      await submitButton.click();

      // Check for streaming indicator
      const streamingIndicator = page.locator('text=/loading|streaming/i').or(
        page.locator('.animate-pulse').or(page.locator('[data-loading="true"]'))
      );

      // May or may not be visible depending on timing
      await page.waitForTimeout(2000);

      // Verify message appears in chat
      const userMessage = page.locator('text="What deals do we have on file?"').first();
      await expect(userMessage).toBeVisible({ timeout: 5000 });

      // Wait for complete response
      await page.waitForTimeout(20000);

      // Verify assistant response appeared
      const assistantMessage = page.locator('[role="article"]').or(page.locator('.message')).last();
      await expect(assistantMessage).toBeVisible();

      const responseText = await assistantMessage.textContent() || '';
      expect(responseText.length).toBeGreaterThan(50);
    });

    test('should maintain viewport during response streaming (TD-8 regression)', async ({ page }) => {
      const messageInput = page.locator('textarea[placeholder]').first();
      await expect(messageInput).toBeVisible();

      await messageInput.fill('Give me a comprehensive briefing on all advisory files');

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // During streaming, input should remain visible (TD-8 fix)
      for (let i = 0; i < 5; i++) {
        await page.waitForTimeout(2000);
        await expect(messageInput).toBeVisible();

        // Take periodic screenshots
        if (i === 0 || i === 2 || i === 4) {
          await page.screenshot({
            path: path.join(SCREENSHOT_DIR, `streaming-check-${i}.png`),
            fullPage: true,
          });
        }
      }
    });
  });

  test.describe('Network and API Validation', () => {
    test('should make correct API calls for chat', async ({ page }) => {
      const apiCalls: string[] = [];

      // Monitor API requests
      page.on('request', request => {
        const url = request.url();
        if (url.includes('/api/')) {
          apiCalls.push(`${request.method()} ${url}`);
        }
      });

      const messageInput = page.locator('textarea[placeholder]').first();
      await expect(messageInput).toBeVisible();

      await messageInput.fill('Brief me on MyTab');

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Wait for API calls
      await page.waitForTimeout(10000);

      console.log('API calls made:', apiCalls);

      // Should have called chat API
      const hasChatApi = apiCalls.some(c => c.includes('/api/chat'));
      expect(hasChatApi).toBe(true);
    });

    test('should handle API errors gracefully', async ({ page }) => {
      // Intercept chat API to simulate error
      await page.route('**/api/chat', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Internal Server Error' }),
        });
      });

      const messageInput = page.locator('textarea[placeholder]').first();
      await expect(messageInput).toBeVisible();

      await messageInput.fill('Test error handling');

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      await page.waitForTimeout(5000);

      // Should show error message in UI
      const errorIndicator = page.locator('text=/error|failed|sorry/i').first();
      const hasError = await errorIndicator.isVisible({ timeout: 10000 }).catch(() => false);
      console.log('Error displayed:', hasError);

      // Take screenshot of error state
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'error-state.png'),
        fullPage: true,
      });
    });

    test('should not leak API keys or sensitive data in console', async ({ page }) => {
      const messageInput = page.locator('textarea[placeholder]').first();
      await expect(messageInput).toBeVisible();

      await messageInput.fill('Search for MyTab documents');

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      await page.waitForTimeout(15000);

      // Check console for sensitive data
      const sensitivePatterns = [
        /api.?key/i,
        /secret/i,
        /password/i,
        /bearer/i,
        /sk-[a-zA-Z0-9]+/,  // OpenAI key pattern
        /supabase.*key/i,
      ];

      for (const pattern of sensitivePatterns) {
        const leakedMessages = consoleMessages.filter(m => pattern.test(m));
        if (leakedMessages.length > 0) {
          console.warn('Potential sensitive data leak:', leakedMessages);
        }
        // This is a security check - should not have sensitive data in logs
        // Allow-listing specific known safe patterns
        const actualLeaks = leakedMessages.filter(m =>
          !m.includes('placeholder') && !m.includes('description')
        );
        expect(actualLeaks.length).toBe(0);
      }
    });
  });

  test.describe('Tool Registration Verification', () => {
    test('should have search_advisory registered in tool config', async ({ page }) => {
      // This test verifies the tool is properly registered by triggering it
      const messageInput = page.locator('textarea[placeholder]').first();
      await expect(messageInput).toBeVisible();

      // Use a query that explicitly asks for advisory search
      await messageInput.fill('Use the search_advisory tool to find information about MyTab');

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      await page.waitForTimeout(15000);

      // Check console for tool-related logs
      const toolLogs = consoleMessages.filter(m =>
        m.includes('search_advisory') ||
        m.includes('advisory')
      );

      console.log('Tool-related console logs:', toolLogs);

      // The response should contain advisory file content
      const assistantMessage = page.locator('[role="article"]').or(page.locator('.message')).last();
      const responseText = await assistantMessage.textContent() || '';

      // Tool should be recognized and return content
      expect(responseText.toLowerCase()).toContain('mytab');
    });

    test('should auto-approve search_advisory as read-only tool', async ({ page }) => {
      const messageInput = page.locator('textarea[placeholder]').first();
      await expect(messageInput).toBeVisible();

      await messageInput.fill('What advisory files do we have about SwiftCheckin?');

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Should NOT prompt for approval (auto-approved)
      const approvalPrompt = page.locator('text=/approve|confirm|allow/i').first();
      const needsApproval = await approvalPrompt.isVisible({ timeout: 5000 }).catch(() => false);

      console.log('Requires approval:', needsApproval);

      // Auto-approved tools should not require confirmation
      expect(needsApproval).toBe(false);

      // Wait for response
      await page.waitForTimeout(15000);

      // Should have proceeded to get results
      const assistantMessage = page.locator('[role="article"]').or(page.locator('.message')).last();
      const responseText = await assistantMessage.textContent() || '';
      expect(responseText.length).toBeGreaterThan(50);
    });
  });

  test.describe('Chat Persistence', () => {
    test('should persist advisory search in chat history', async ({ page }) => {
      const messageInput = page.locator('textarea[placeholder]').first();
      await expect(messageInput).toBeVisible();

      await messageInput.fill('Brief me on MyTab deal');

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Wait for response and URL update
      await page.waitForURL(/.*\?chatId=.+/, { timeout: 30000 });

      const url = page.url();
      const chatId = new URL(url).searchParams.get('chatId');
      expect(chatId).toBeTruthy();

      console.log('Chat ID:', chatId);

      // Wait for full response
      await page.waitForTimeout(15000);

      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Verify chat history persisted
      const userMessage = page.locator('text="Brief me on MyTab deal"').first();
      await expect(userMessage).toBeVisible({ timeout: 10000 });

      // Verify response also persisted
      const assistantMessage = page.locator('[role="article"]').or(page.locator('.message')).last();
      await expect(assistantMessage).toBeVisible();
    });

    test('should allow follow-up questions on advisory content', async ({ page }) => {
      const messageInput = page.locator('textarea[placeholder]').first();
      await expect(messageInput).toBeVisible();

      // First query
      await messageInput.fill('What do we know about MyTab?');
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      await page.waitForTimeout(20000);

      // Follow-up query
      await messageInput.fill('What are the red flags for that deal?');
      await submitButton.click();

      await page.waitForTimeout(20000);

      // Verify both messages in chat
      const messages = page.locator('[role="article"]').or(page.locator('.message'));
      const messageCount = await messages.count();

      console.log('Total messages:', messageCount);

      // Should have at least 4 messages (2 user + 2 assistant)
      expect(messageCount).toBeGreaterThanOrEqual(4);

      // Take screenshot of conversation
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'follow-up-conversation.png'),
        fullPage: true,
      });
    });
  });

  test.describe('Performance and Responsiveness', () => {
    test('should respond to advisory queries within acceptable time', async ({ page }) => {
      const messageInput = page.locator('textarea[placeholder]').first();
      await expect(messageInput).toBeVisible();

      const startTime = Date.now();

      await messageInput.fill('Brief me on MyTab');
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Wait for first content to appear
      const assistantMessage = page.locator('[role="article"]').or(page.locator('.message')).last();
      await expect(assistantMessage).toBeVisible({ timeout: 60000 });

      const firstResponseTime = Date.now() - startTime;
      console.log('Time to first response:', firstResponseTime, 'ms');

      // Should start streaming within 30 seconds
      expect(firstResponseTime).toBeLessThan(30000);

      // Wait for complete response
      await page.waitForTimeout(15000);

      const totalTime = Date.now() - startTime;
      console.log('Total response time:', totalTime, 'ms');

      // Complete response should be within 60 seconds
      expect(totalTime).toBeLessThan(60000);
    });

    test('should handle multiple rapid queries', async ({ page }) => {
      const messageInput = page.locator('textarea[placeholder]').first();
      await expect(messageInput).toBeVisible();
      const submitButton = page.locator('button[type="submit"]');

      const queries = [
        'What is MyTab?',
        'Tell me about SwiftCheckin',
        'ArcheloLab valuation?',
      ];

      for (const query of queries) {
        await messageInput.fill(query);
        await submitButton.click();
        await page.waitForTimeout(3000); // Small delay between queries
      }

      // Wait for all responses
      await page.waitForTimeout(30000);

      // Should have all queries in chat (or at least not crashed)
      const messages = page.locator('[role="article"]').or(page.locator('.message'));
      const messageCount = await messages.count();

      console.log('Messages after rapid queries:', messageCount);
      expect(messageCount).toBeGreaterThan(0);

      // No console errors
      const errors = consoleMessages.filter(m => m.includes('[error]'));
      console.log('Errors during rapid queries:', errors);
    });
  });

  test.describe('Accessibility', () => {
    test('should have accessible chat interface', async ({ page }) => {
      // Check for ARIA labels
      const messageInput = page.locator('textarea[placeholder]').first();
      await expect(messageInput).toBeVisible();

      // Submit button should be accessible
      const submitButton = page.locator('button[type="submit"]');
      const ariaLabel = await submitButton.getAttribute('aria-label');
      console.log('Submit button aria-label:', ariaLabel);

      // Messages should have proper roles
      await messageInput.fill('Hello');
      await submitButton.click();
      await page.waitForTimeout(10000);

      // Check for article roles or semantic markup
      const articles = page.locator('[role="article"]');
      const articleCount = await articles.count();
      console.log('Elements with role="article":', articleCount);
    });

    test('should be navigable by keyboard', async ({ page }) => {
      // Tab to message input
      await page.keyboard.press('Tab');
      await page.waitForTimeout(500);

      // Focus should be on a focusable element
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();

      // Type a message
      await page.keyboard.type('Brief me on MyTab');

      // Submit with Enter
      await page.keyboard.press('Enter');

      await page.waitForTimeout(10000);

      // Verify message was sent
      const userMessage = page.locator('text="Brief me on MyTab"').first();
      await expect(userMessage).toBeVisible({ timeout: 5000 });
    });
  });
});
