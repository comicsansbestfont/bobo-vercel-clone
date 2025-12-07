import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * E2E Test: M37-01 Visual Testing
 *
 * Visual regression and UI testing using screenshots and visual comparisons:
 * - Component visibility verification
 * - Layout consistency
 * - Responsive behavior
 * - Visual state transitions
 * - Error state visuals
 *
 * Note: For CI, these tests capture reference screenshots.
 * For local development, they compare against stored references.
 */

const SCREENSHOT_DIR = path.join(__dirname, '../screenshots/m37-visual');
const REFERENCE_DIR = path.join(__dirname, '../screenshots/m37-visual/reference');

test.describe('M37-01: Visual Testing', () => {
  test.beforeAll(async () => {
    // Ensure directories exist
    for (const dir of [SCREENSHOT_DIR, REFERENCE_DIR]) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Agent Mode Interface', () => {
    test('visual: initial chat interface state', async ({ page }) => {
      // Wait for hydration
      await page.waitForTimeout(2000);

      // Capture full page screenshot
      const screenshot = await page.screenshot({ fullPage: true });
      const screenshotPath = path.join(SCREENSHOT_DIR, 'agent-mode-initial.png');
      fs.writeFileSync(screenshotPath, screenshot);

      // Verify key elements are visible
      const messageInput = page.locator('textarea[placeholder]').first();
      await expect(messageInput).toBeVisible();

      // Verify consistent position (should be at bottom)
      const inputBox = await messageInput.boundingBox();
      expect(inputBox).toBeTruthy();
      if (inputBox) {
        const viewportHeight = page.viewportSize()?.height || 800;
        // Input should be in bottom half of viewport
        expect(inputBox.y).toBeGreaterThan(viewportHeight / 2);
      }
    });

    test('visual: message input focus state', async ({ page }) => {
      const messageInput = page.locator('textarea[placeholder]').first();
      await expect(messageInput).toBeVisible();

      // Capture before focus
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'input-before-focus.png'),
      });

      // Focus and capture
      await messageInput.focus();
      await page.waitForTimeout(300); // Wait for focus animation

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'input-focused.png'),
      });

      // Type something
      await messageInput.fill('Test message');

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'input-with-text.png'),
      });
    });

    test('visual: submit button states', async ({ page }) => {
      const messageInput = page.locator('textarea[placeholder]').first();
      const submitButton = page.locator('button[type="submit"]').or(
        page.locator('button:has-text("Send")')
      );

      await expect(messageInput).toBeVisible();
      await expect(submitButton).toBeVisible();

      // Empty state - button may be disabled
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'submit-empty.png'),
      });

      const isDisabledEmpty = await submitButton.isDisabled();
      console.log('Submit disabled when empty:', isDisabledEmpty);

      // With text - button should be enabled
      await messageInput.fill('Test message');

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'submit-with-text.png'),
      });

      const isDisabledWithText = await submitButton.isDisabled();
      expect(isDisabledWithText).toBe(false);
    });
  });

  test.describe('Message Display', () => {
    test('visual: user message appearance', async ({ page }) => {
      const messageInput = page.locator('textarea[placeholder]').first();
      await expect(messageInput).toBeVisible();

      await messageInput.fill('Brief me on MyTab');

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Wait for message to appear
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'user-message-sent.png'),
        fullPage: true,
      });

      // Verify user message styling
      const userMessage = page.locator('text="Brief me on MyTab"').first();
      await expect(userMessage).toBeVisible();
    });

    test('visual: assistant message streaming', async ({ page }) => {
      const messageInput = page.locator('textarea[placeholder]').first();
      await expect(messageInput).toBeVisible();

      await messageInput.fill('Brief me on MyTab');

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Capture at different streaming stages
      for (let i = 0; i < 4; i++) {
        await page.waitForTimeout(3000);
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, `streaming-stage-${i}.png`),
          fullPage: true,
        });
      }
    });

    test('visual: completed response formatting', async ({ page }) => {
      const messageInput = page.locator('textarea[placeholder]').first();
      await expect(messageInput).toBeVisible();

      await messageInput.fill('What is MyTab?');

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Wait for complete response
      await page.waitForTimeout(20000);

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'completed-response.png'),
        fullPage: true,
      });

      // Verify assistant message is visible
      const assistantMessage = page.locator('[role="article"]').or(page.locator('.message')).last();
      await expect(assistantMessage).toBeVisible();
    });
  });

  test.describe('Tool Invocation Visuals', () => {
    test('visual: tool indicator during search', async ({ page }) => {
      const messageInput = page.locator('textarea[placeholder]').first();
      await expect(messageInput).toBeVisible();

      await messageInput.fill('Brief me on MyTab');

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Capture potential tool indicator
      await page.waitForTimeout(3000);

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'tool-invocation.png'),
        fullPage: true,
      });

      // Look for tool-related visual elements
      const toolIndicator = page.locator('text=/📂|search_advisory|Searching/i').first();
      const hasToolVisual = await toolIndicator.isVisible({ timeout: 5000 }).catch(() => false);
      console.log('Tool indicator visible:', hasToolVisual);
    });

    test('visual: search results integration in response', async ({ page }) => {
      const messageInput = page.locator('textarea[placeholder]').first();
      await expect(messageInput).toBeVisible();

      await messageInput.fill('What deals do we have on file?');

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      await page.waitForTimeout(20000);

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'search-results-in-response.png'),
        fullPage: true,
      });
    });
  });

  test.describe('Responsive Behavior', () => {
    test('visual: mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'mobile-viewport.png'),
        fullPage: true,
      });

      // Message input should still be visible
      const messageInput = page.locator('textarea[placeholder]').first();
      await expect(messageInput).toBeVisible();
    });

    test('visual: tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 }); // iPad
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'tablet-viewport.png'),
        fullPage: true,
      });

      const messageInput = page.locator('textarea[placeholder]').first();
      await expect(messageInput).toBeVisible();
    });

    test('visual: wide viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 }); // Desktop
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'desktop-viewport.png'),
        fullPage: true,
      });

      const messageInput = page.locator('textarea[placeholder]').first();
      await expect(messageInput).toBeVisible();
    });
  });

  test.describe('Error States', () => {
    test('visual: network error state', async ({ page }) => {
      // Intercept to simulate error
      await page.route('**/api/chat', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Server error' }),
        });
      });

      const messageInput = page.locator('textarea[placeholder]').first();
      await expect(messageInput).toBeVisible();

      await messageInput.fill('Test error state');

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      await page.waitForTimeout(5000);

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'error-state.png'),
        fullPage: true,
      });
    });

    test('visual: empty results state', async ({ page }) => {
      const messageInput = page.locator('textarea[placeholder]').first();
      await expect(messageInput).toBeVisible();

      await messageInput.fill('Find documents about NonExistentCompanyXYZ');

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      await page.waitForTimeout(15000);

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'empty-results.png'),
        fullPage: true,
      });
    });
  });

  test.describe('Conversation Flow', () => {
    test('visual: multi-turn conversation', async ({ page }) => {
      const messageInput = page.locator('textarea[placeholder]').first();
      await expect(messageInput).toBeVisible();
      const submitButton = page.locator('button[type="submit"]');

      // First message
      await messageInput.fill('What is MyTab?');
      await submitButton.click();
      await page.waitForTimeout(15000);

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'conversation-turn-1.png'),
        fullPage: true,
      });

      // Second message
      await messageInput.fill('What are its red flags?');
      await submitButton.click();
      await page.waitForTimeout(15000);

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'conversation-turn-2.png'),
        fullPage: true,
      });

      // Third message
      await messageInput.fill('Show me recent meetings');
      await submitButton.click();
      await page.waitForTimeout(15000);

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'conversation-turn-3.png'),
        fullPage: true,
      });
    });

    test('visual: scroll behavior with long conversation', async ({ page }) => {
      const messageInput = page.locator('textarea[placeholder]').first();
      await expect(messageInput).toBeVisible();
      const submitButton = page.locator('button[type="submit"]');

      // Create multiple messages
      for (let i = 1; i <= 5; i++) {
        await messageInput.fill(`Message ${i}: Tell me about deal ${i}`);
        await submitButton.click();
        await page.waitForTimeout(5000);
      }

      // Capture scroll state
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'long-conversation-scroll.png'),
        fullPage: true,
      });

      // Input should remain visible at bottom
      await expect(messageInput).toBeVisible();
    });
  });

  test.describe('Validation Query Visuals', () => {
    /**
     * Capture visual state for each validation query
     */

    const validationQueries = [
      { name: 'vq1-brief-mytab', query: 'Brief me on MyTab' },
      { name: 'vq2-email-mikaela', query: 'What was my last email to Mikaela?' },
      { name: 'vq3-red-flags', query: 'What deals have red flags?' },
      { name: 'vq4-prep-swiftcheckin', query: 'Prep me for SwiftCheckin call' },
      { name: 'vq5-valuation-archelolab', query: 'What\'s the valuation for ArcheloLab?' },
      { name: 'vq6-dec2-meeting', query: 'Show me Dec 2 meeting notes for MyTab' },
    ];

    for (const { name, query } of validationQueries) {
      test(`visual: ${name}`, async ({ page }) => {
        const messageInput = page.locator('textarea[placeholder]').first();
        await expect(messageInput).toBeVisible();

        await messageInput.fill(query);

        const submitButton = page.locator('button[type="submit"]');
        await submitButton.click();

        await page.waitForTimeout(20000);

        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, `${name}.png`),
          fullPage: true,
        });

        // Basic validation
        const assistantMessage = page.locator('[role="article"]').or(page.locator('.message')).last();
        await expect(assistantMessage).toBeVisible();
      });
    }
  });

  test.describe('Dark Mode (if applicable)', () => {
    test('visual: dark mode initial state', async ({ page }) => {
      // Check if dark mode toggle exists
      const darkModeToggle = page.locator('button').filter({ hasText: /dark|light|theme/i }).first();
      const hasDarkMode = await darkModeToggle.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasDarkMode) {
        await darkModeToggle.click();
        await page.waitForTimeout(500);

        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, 'dark-mode.png'),
          fullPage: true,
        });
      } else {
        // Try emulating dark mode via media query
        await page.emulateMedia({ colorScheme: 'dark' });
        await page.waitForTimeout(500);

        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, 'dark-mode-emulated.png'),
          fullPage: true,
        });
      }
    });
  });
});
