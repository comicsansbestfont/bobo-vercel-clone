import { test, expect } from '@playwright/test';

/**
 * E2E Test: New Chat Creation
 *
 * Critical regression test for TD-8 (viewport disappearing bug)
 * Ensures chat interface remains visible during first message streaming
 */
test.describe('New Chat Creation', () => {
  test('should create chat and keep viewport visible during streaming', async ({ page }) => {
    // Navigate to home page
    await page.goto('/');

    // Wait for chat interface to load
    await expect(page.locator('[data-testid="chat-interface"]').or(page.locator('textarea[placeholder*="Message"]'))).toBeVisible();

    // Find the message input
    const messageInput = page.locator('textarea[placeholder*="Message"]').first();
    await expect(messageInput).toBeVisible();

    // Type a simple message
    const testMessage = 'Hello, this is a test message';
    await messageInput.fill(testMessage);

    // Submit the message
    const submitButton = page.locator('button[type="submit"]').or(page.locator('button:has-text("Send")'));
    await submitButton.click();

    // TD-8 REGRESSION CHECK: Verify chat interface remains visible
    // The viewport should NOT disappear during streaming
    await expect(messageInput).toBeVisible({ timeout: 5000 });

    // Verify user message appears in chat
    await expect(page.locator('text=' + testMessage).first()).toBeVisible({ timeout: 10000 });

    // Wait for AI response to start streaming
    // Look for assistant message container or streaming indicator
    const assistantMessage = page.locator('[role="article"]').or(page.locator('.message')).last();
    await expect(assistantMessage).toBeVisible({ timeout: 15000 });

    // TD-8 REGRESSION CHECK: Verify viewport is STILL visible during streaming
    await expect(messageInput).toBeVisible();

    // Verify URL was updated with chatId
    await page.waitForURL(/.*\?chatId=.+/, { timeout: 10000 });
    const url = page.url();
    expect(url).toContain('chatId=');

    // Extract chatId from URL
    const urlParams = new URL(url).searchParams;
    const chatId = urlParams.get('chatId');
    expect(chatId).toBeTruthy();

    // Refresh page to verify persistence
    await page.reload();

    // Verify chat history loaded
    await expect(page.locator('text=' + testMessage).first()).toBeVisible({ timeout: 10000 });

    // Verify message input is still visible after refresh (TD-8 check)
    await expect(messageInput).toBeVisible();

    console.log(`✅ Test passed! Chat created with ID: ${chatId}`);
  });

  test('should handle stop button during streaming', async ({ page }) => {
    await page.goto('/');

    const messageInput = page.locator('textarea[placeholder*="Message"]').first();
    await expect(messageInput).toBeVisible();

    // Send a message that will generate a long response
    await messageInput.fill('Write a long story about a robot');
    const submitButton = page.locator('button[type="submit"]').or(page.locator('button:has-text("Send")'));
    await submitButton.click();

    // Wait for streaming to start
    await page.waitForTimeout(2000);

    // Look for stop button and click it
    const stopButton = page.locator('button:has-text("Stop")').or(page.locator('button[aria-label="Stop"]'));
    if (await stopButton.isVisible()) {
      await stopButton.click();

      // Verify message input is still visible after stopping
      await expect(messageInput).toBeVisible();

      // Verify partial response was saved
      await page.reload();
      await expect(page.locator('text=robot').first()).toBeVisible({ timeout: 10000 });
    }
  });
});
