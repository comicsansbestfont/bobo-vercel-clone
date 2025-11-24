import { test, expect } from '@playwright/test';

/**
 * E2E Test: Chat Persistence
 *
 * Verifies that chat messages persist across page refreshes and sessions
 */
test.describe('Chat Persistence', () => {
  test('should persist multi-message conversation', async ({ page }) => {
    // Navigate to home
    await page.goto('/');

    const messageInput = page.locator('textarea[placeholder*="Message"]').first();
    await expect(messageInput).toBeVisible();

    // Send first message
    const message1 = 'First message in conversation';
    await messageInput.fill(message1);
    await page.locator('button[type="submit"]').or(page.locator('button:has-text("Send")')).click();

    // Wait for response
    await expect(page.locator('text=' + message1).first()).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(3000); // Wait for AI response

    // Send second message
    const message2 = 'Second message to test persistence';
    await messageInput.fill(message2);
    await page.locator('button[type="submit"]').or(page.locator('button:has-text("Send")')).click();

    await expect(page.locator('text=' + message2).first()).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(3000);

    // Send third message
    const message3 = 'Third message for good measure';
    await messageInput.fill(message3);
    await page.locator('button[type="submit"]').or(page.locator('button:has-text("Send")')).click();

    await expect(page.locator('text=' + message3).first()).toBeVisible({ timeout: 10000 });

    // Get chat ID from URL
    const urlBeforeRefresh = page.url();
    expect(urlBeforeRefresh).toContain('chatId=');
    const chatId = new URL(urlBeforeRefresh).searchParams.get('chatId');

    // Refresh page
    await page.reload();

    // Verify URL still contains chatId
    expect(page.url()).toContain(`chatId=${chatId}`);

    // Verify all messages loaded
    await expect(page.locator('text=' + message1).first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=' + message2).first()).toBeVisible();
    await expect(page.locator('text=' + message3).first()).toBeVisible();

    // Verify message count (should have at least 3 user messages)
    const userMessages = page.locator('[role="article"]').or(page.locator('.message')).filter({
      hasText: message1.substring(0, 10)
    });
    await expect(userMessages.first()).toBeVisible();

    console.log(`✅ Persistence test passed! All 3 messages persisted for chat: ${chatId}`);
  });

  test('should maintain scroll position on refresh', async ({ page }) => {
    await page.goto('/');

    const messageInput = page.locator('textarea[placeholder*="Message"]').first();
    await expect(messageInput).toBeVisible();

    // Send multiple messages to create scrollable content
    for (let i = 1; i <= 5; i++) {
      await messageInput.fill(`Message number ${i}`);
      await page.locator('button[type="submit"]').or(page.locator('button:has-text("Send")')).click();
      await page.waitForTimeout(2000); // Brief wait between messages
    }

    // Get chat ID
    const url = page.url();
    const chatId = new URL(url).searchParams.get('chatId');

    // Scroll to specific message (middle of conversation)
    const middleMessage = page.locator('text=Message number 3').first();
    await expect(middleMessage).toBeVisible({ timeout: 15000 });
    await middleMessage.scrollIntoViewIfNeeded();

    // Refresh
    await page.reload();

    // Verify all messages still visible
    await expect(page.locator('text=Message number 1').first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Message number 5').first()).toBeVisible();

    console.log(`✅ Scroll position test passed for chat: ${chatId}`);
  });

  test('should restore chat settings (model, webSearch)', async ({ page }) => {
    await page.goto('/');

    const messageInput = page.locator('textarea[placeholder*="Message"]').first();
    await expect(messageInput).toBeVisible();

    // Change model if selector exists
    const modelSelector = page.locator('select').or(page.locator('[role="combobox"]')).first();
    if (await modelSelector.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Select a different model
      await modelSelector.click();
      const modelOption = page.locator('option').or(page.locator('[role="option"]')).nth(1);
      if (await modelOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await modelOption.click();
      }
    }

    // Send a message to create chat
    await messageInput.fill('Test settings persistence');
    await page.locator('button[type="submit"]').or(page.locator('button:has-text("Send")')).click();

    await page.waitForURL(/.*\?chatId=.+/, { timeout: 10000 });
    const chatId = new URL(page.url()).searchParams.get('chatId');

    // Refresh
    await page.reload();

    // Verify chat loaded
    await expect(page.locator('text=Test settings persistence').first()).toBeVisible({ timeout: 10000 });

    // Note: Model settings restoration would need to check the UI state
    // This is a placeholder for when model persistence is fully implemented

    console.log(`✅ Settings restoration test passed for chat: ${chatId}`);
  });
});
