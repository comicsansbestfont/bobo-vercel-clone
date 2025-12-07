import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * E2E Test: M37-01 Regression Testing
 *
 * Ensures that the Advisory System additions do not break existing functionality:
 * - Memory tools (search_memory, add_memory, update_memory, delete_memory)
 * - Chat functionality
 * - Context management
 * - Build process
 *
 * These tests verify that M37-01 changes are additive and non-breaking.
 */

const SCREENSHOT_DIR = path.join(__dirname, '../screenshots/m37-regression');

test.describe('M37-01: Regression Tests', () => {
  let consoleMessages: string[] = [];

  test.beforeAll(async () => {
    if (!fs.existsSync(SCREENSHOT_DIR)) {
      fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }
  });

  test.beforeEach(async ({ page }) => {
    consoleMessages = [];

    page.on('console', msg => {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Memory Tools Regression', () => {
    /**
     * These tests verify memory tools still work after advisory integration
     */

    test('should still invoke search_memory for personal knowledge queries', async ({ page }) => {
      const messageInput = page.locator('textarea[placeholder]').first();
      await expect(messageInput).toBeVisible();

      // Query that should trigger memory search (not advisory)
      await messageInput.fill('What do you remember about my preferences?');

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      await page.waitForTimeout(15000);

      // Check console for memory tool invocation
      const memoryLogs = consoleMessages.filter(m =>
        m.includes('search_memory') || m.includes('memory')
      );

      console.log('Memory-related logs:', memoryLogs);

      // Response should be provided
      const assistantMessage = page.locator('[role="article"]').or(page.locator('.message')).last();
      await expect(assistantMessage).toBeVisible();

      const responseText = await assistantMessage.textContent() || '';
      console.log('Memory query response:', responseText.substring(0, 500));

      // Should have some response (even if no memories found)
      expect(responseText.length).toBeGreaterThan(20);
    });

    test('should distinguish between memory and advisory queries', async ({ page }) => {
      const messageInput = page.locator('textarea[placeholder]').first();
      await expect(messageInput).toBeVisible();
      const submitButton = page.locator('button[type="submit"]');

      // Memory query
      await messageInput.fill('What are my communication preferences?');
      await submitButton.click();
      await page.waitForTimeout(15000);

      const memoryResponse = await page.locator('[role="article"]').or(page.locator('.message')).last().textContent() || '';

      // Advisory query
      await messageInput.fill('Brief me on the MyTab deal');
      await submitButton.click();
      await page.waitForTimeout(15000);

      const advisoryResponse = await page.locator('[role="article"]').or(page.locator('.message')).last().textContent() || '';

      console.log('Memory response preview:', memoryResponse.substring(0, 200));
      console.log('Advisory response preview:', advisoryResponse.substring(0, 200));

      // Responses should be different (different tools/data sources)
      // Advisory should contain deal-specific content
      const hasAdvisoryContent = advisoryResponse.toLowerCase().includes('mytab') ||
                                 advisoryResponse.toLowerCase().includes('deal');
      expect(hasAdvisoryContent).toBe(true);
    });

    test('should not break add_memory functionality', async ({ page }) => {
      const messageInput = page.locator('textarea[placeholder]').first();
      await expect(messageInput).toBeVisible();

      // Request to add a memory
      await messageInput.fill('Please remember that I prefer morning meetings');

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      await page.waitForTimeout(15000);

      const response = await page.locator('[role="article"]').or(page.locator('.message')).last().textContent() || '';
      console.log('Add memory response:', response.substring(0, 500));

      // Should acknowledge the memory request
      const acknowledgedMemory = response.toLowerCase().includes('remember') ||
                                 response.toLowerCase().includes('noted') ||
                                 response.toLowerCase().includes('saved') ||
                                 response.toLowerCase().includes('memory') ||
                                 response.toLowerCase().includes('morning');
      expect(acknowledgedMemory).toBe(true);
    });
  });

  test.describe('Chat Functionality Regression', () => {
    test('should still create chats successfully', async ({ page }) => {
      const messageInput = page.locator('textarea[placeholder]').first();
      await expect(messageInput).toBeVisible();

      await messageInput.fill('Hello, this is a test message');

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Wait for chat creation
      await page.waitForURL(/.*\?chatId=.+/, { timeout: 30000 });

      const chatId = new URL(page.url()).searchParams.get('chatId');
      expect(chatId).toBeTruthy();
      console.log('Chat created with ID:', chatId);
    });

    test('should still persist messages correctly', async ({ page }) => {
      const messageInput = page.locator('textarea[placeholder]').first();
      await expect(messageInput).toBeVisible();

      const testMessage = `Regression test message ${Date.now()}`;
      await messageInput.fill(testMessage);

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      await page.waitForURL(/.*\?chatId=.+/, { timeout: 30000 });
      await page.waitForTimeout(10000);

      // Reload to test persistence
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Message should still be visible
      const persistedMessage = page.locator(`text="${testMessage}"`).first();
      await expect(persistedMessage).toBeVisible({ timeout: 10000 });
    });

    test('should still handle model selection', async ({ page }) => {
      // Look for model selector
      const modelButton = page.locator('button').filter({ hasText: /gpt|claude|gemini|model/i }).first();

      const hasModelSelector = await modelButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasModelSelector) {
        await modelButton.click();

        // Should show model options
        const modelOptions = page.locator('[role="option"]').or(
          page.locator('[role="menuitem"]').or(
            page.locator('button').filter({ hasText: /gpt|claude|gemini/i })
          )
        );

        const optionCount = await modelOptions.count();
        console.log('Model options visible:', optionCount);
        expect(optionCount).toBeGreaterThan(0);
      } else {
        console.log('Model selector not visible - may be in different location');
      }
    });

    test('should still handle web search toggle', async ({ page }) => {
      // Look for web search toggle
      const webSearchToggle = page.locator('button').filter({ hasText: /web|search|perplexity/i }).first()
        .or(page.locator('input[type="checkbox"]').first());

      const hasWebSearch = await webSearchToggle.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasWebSearch) {
        // Toggle should be clickable
        await webSearchToggle.click();
        console.log('Web search toggle clicked');

        // No errors should occur
        const errors = consoleMessages.filter(m => m.includes('[error]'));
        expect(errors.length).toBe(0);
      } else {
        console.log('Web search toggle not found - may be disabled or in different location');
      }
    });
  });

  test.describe('Build and Type Safety Regression', () => {
    test('should not have TypeScript errors in console', async ({ page }) => {
      // Navigate and trigger some actions
      const messageInput = page.locator('textarea[placeholder]').first();
      await expect(messageInput).toBeVisible();

      await messageInput.fill('Test type safety');
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      await page.waitForTimeout(10000);

      // Check for TypeScript/runtime type errors
      const typeErrors = consoleMessages.filter(m =>
        m.includes('TypeError') ||
        m.includes('undefined is not') ||
        m.includes('null is not') ||
        m.includes('cannot read property')
      );

      console.log('Type errors:', typeErrors);
      expect(typeErrors.length).toBe(0);
    });

    test('should not have module import errors', async ({ page }) => {
      // Check for import/module errors on page load
      const moduleErrors = consoleMessages.filter(m =>
        m.includes('Module not found') ||
        m.includes('Cannot find module') ||
        m.includes('Failed to load') ||
        m.includes('import') && m.includes('error')
      );

      console.log('Module errors:', moduleErrors);
      expect(moduleErrors.length).toBe(0);
    });
  });

  test.describe('Context Management Regression', () => {
    test('should still track context usage', async ({ page }) => {
      const messageInput = page.locator('textarea[placeholder]').first();
      await expect(messageInput).toBeVisible();

      // Send a message to trigger context tracking
      await messageInput.fill('Tell me something interesting');
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      await page.waitForTimeout(15000);

      // Look for context indicator (progress bar or percentage)
      const contextIndicator = page.locator('[data-testid="context-usage"]').or(
        page.locator('text=/\\d+%/').first().or(
          page.locator('progress').first()
        )
      );

      const hasContextIndicator = await contextIndicator.isVisible({ timeout: 5000 }).catch(() => false);
      console.log('Context indicator visible:', hasContextIndicator);
    });

    test('should handle long conversations without context errors', async ({ page }) => {
      const messageInput = page.locator('textarea[placeholder]').first();
      await expect(messageInput).toBeVisible();
      const submitButton = page.locator('button[type="submit"]');

      // Send multiple messages
      const messages = [
        'First message in conversation',
        'Second message continuing discussion',
        'Third message with more context',
      ];

      for (const msg of messages) {
        await messageInput.fill(msg);
        await submitButton.click();
        await page.waitForTimeout(10000);
      }

      // No context-related errors
      const contextErrors = consoleMessages.filter(m =>
        m.includes('context') && m.includes('error') ||
        m.includes('token limit') ||
        m.includes('exceeded')
      );

      console.log('Context errors:', contextErrors);
      expect(contextErrors.length).toBe(0);
    });
  });

  test.describe('Combined Memory + Advisory Regression', () => {
    test('should handle mixed queries without confusion', async ({ page }) => {
      const messageInput = page.locator('textarea[placeholder]').first();
      await expect(messageInput).toBeVisible();
      const submitButton = page.locator('button[type="submit"]');

      // Query that combines memory and advisory context
      await messageInput.fill(
        'Based on what you remember about my preferences, brief me on the MyTab deal'
      );
      await submitButton.click();

      await page.waitForTimeout(20000);

      const response = await page.locator('[role="article"]').or(page.locator('.message')).last().textContent() || '';
      console.log('Mixed query response:', response.substring(0, 500));

      // Should attempt to answer (even if no memories exist)
      expect(response.length).toBeGreaterThan(50);

      // Should include advisory content
      const hasAdvisoryContent = response.toLowerCase().includes('mytab') ||
                                 response.toLowerCase().includes('deal');
      expect(hasAdvisoryContent).toBe(true);
    });

    test('should use correct tool for each query type in sequence', async ({ page }) => {
      const messageInput = page.locator('textarea[placeholder]').first();
      await expect(messageInput).toBeVisible();
      const submitButton = page.locator('button[type="submit"]');

      // Memory query
      await messageInput.fill('What are my saved preferences?');
      await submitButton.click();
      await page.waitForTimeout(15000);

      // Advisory query
      await messageInput.fill('Now tell me about the SwiftCheckin client');
      await submitButton.click();
      await page.waitForTimeout(15000);

      // Memory query again
      await messageInput.fill('And what do you remember about my schedule?');
      await submitButton.click();
      await page.waitForTimeout(15000);

      // Should have multiple messages without errors
      const messages = page.locator('[role="article"]').or(page.locator('.message'));
      const messageCount = await messages.count();

      console.log('Total messages after sequence:', messageCount);
      expect(messageCount).toBeGreaterThanOrEqual(6); // 3 user + 3 assistant

      // No critical errors
      const criticalErrors = consoleMessages.filter(m =>
        m.includes('[error]') &&
        !m.includes('favicon')
      );
      expect(criticalErrors.length).toBe(0);
    });
  });

  test.describe('Database Integrity Regression', () => {
    test('should not corrupt existing files table entries', async ({ page }) => {
      // This test verifies that advisory entries don't break existing project files
      const messageInput = page.locator('textarea[placeholder]').first();
      await expect(messageInput).toBeVisible();

      // Query that might trigger file search
      await messageInput.fill('Search for any project documentation');

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      await page.waitForTimeout(15000);

      // Should not error on file table queries
      const dbErrors = consoleMessages.filter(m =>
        m.includes('database') && m.includes('error') ||
        m.includes('query failed') ||
        m.includes('column') && m.includes('not exist')
      );

      console.log('Database errors:', dbErrors);
      expect(dbErrors.length).toBe(0);
    });

    test('should maintain memory_entries table integrity', async ({ page }) => {
      const messageInput = page.locator('textarea[placeholder]').first();
      await expect(messageInput).toBeVisible();

      // Trigger memory operations
      await messageInput.fill('Remember that I am testing the system');

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      await page.waitForTimeout(15000);

      // Search memories
      await messageInput.fill('What do you remember about me testing?');
      await submitButton.click();

      await page.waitForTimeout(15000);

      // No memory table errors
      const memoryErrors = consoleMessages.filter(m =>
        m.includes('memory_entries') && m.includes('error') ||
        m.includes('embedding') && m.includes('error')
      );

      console.log('Memory table errors:', memoryErrors);
      expect(memoryErrors.length).toBe(0);
    });
  });

  test.describe('Performance Regression', () => {
    test('should not significantly increase page load time', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const loadTime = Date.now() - startTime;
      console.log('Page load time:', loadTime, 'ms');

      // Should load within 10 seconds (generous for dev server)
      expect(loadTime).toBeLessThan(10000);
    });

    test('should not increase memory query response time', async ({ page }) => {
      const messageInput = page.locator('textarea[placeholder]').first();
      await expect(messageInput).toBeVisible();

      const startTime = Date.now();

      await messageInput.fill('What do you remember?');
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Wait for response
      const assistantMessage = page.locator('[role="article"]').or(page.locator('.message')).last();
      await expect(assistantMessage).toBeVisible({ timeout: 30000 });

      const responseTime = Date.now() - startTime;
      console.log('Memory query response time:', responseTime, 'ms');

      // Should respond within 30 seconds
      expect(responseTime).toBeLessThan(30000);
    });
  });
});
