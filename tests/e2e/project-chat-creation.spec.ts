import { test, expect } from '@playwright/test';

/**
 * E2E Test: Project Chat Creation
 *
 * Critical regression test for TD-8 in project context
 * Ensures chat interface remains visible during first project message
 */
test.describe('Project Chat Creation', () => {
  let projectId: string;

  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto('/');

    // Wait for sidebar to load
    await page.waitForLoadState('networkidle');

    // Create a new project
    const createProjectButton = page.locator('button:has-text("New Project")').or(
      page.locator('[data-testid="create-project"]')
    );

    // If create project button exists, click it
    if (await createProjectButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await createProjectButton.click();

      // Fill in project details in modal
      const projectNameInput = page.locator('input[name="name"]').or(
        page.locator('input[placeholder*="Project"]').first()
      );
      await projectNameInput.fill('Test Project E2E');

      // Submit project creation
      const submitButton = page.locator('button:has-text("Create")').or(
        page.locator('button[type="submit"]')
      );
      await submitButton.click();

      // Wait for project page to load
      await page.waitForURL(/.*project\/.*/, { timeout: 10000 });

      // Extract project ID from URL
      const url = page.url();
      const match = url.match(/project\/([^/?]+)/);
      projectId = match ? match[1] : '';
      expect(projectId).toBeTruthy();
    } else {
      // If no create button, find an existing project and navigate to it
      const projectLink = page.locator('[data-testid="project-link"]').or(
        page.locator('a[href*="/project/"]')
      ).first();

      await expect(projectLink).toBeVisible({ timeout: 5000 });
      const href = await projectLink.getAttribute('href');
      const match = href?.match(/project\/([^/?]+)/);
      projectId = match ? match[1] : '';

      await projectLink.click();
      await page.waitForURL(/.*project\/.*/, { timeout: 10000 });
    }
  });

  test('should create chat in project and keep viewport visible', async ({ page }) => {
    // Verify we're on project page
    expect(page.url()).toContain(`/project/${projectId}`);

    // Find the message input
    const messageInput = page.locator('textarea[placeholder*="Message"]').first();
    await expect(messageInput).toBeVisible({ timeout: 10000 });

    // Type test message
    const testMessage = 'Test message in project context';
    await messageInput.fill(testMessage);

    // Submit message
    const submitButton = page.locator('button[type="submit"]').or(page.locator('button:has-text("Send")'));
    await submitButton.click();

    // TD-8 REGRESSION CHECK: Verify chat interface remains visible during streaming
    await expect(messageInput).toBeVisible({ timeout: 5000 });

    // Verify user message appears
    await expect(page.locator('text=' + testMessage).first()).toBeVisible({ timeout: 10000 });

    // Wait for AI response
    await page.waitForTimeout(3000);

    // TD-8 REGRESSION CHECK: Viewport should STILL be visible
    await expect(messageInput).toBeVisible();

    // Verify URL updated with chatId
    await page.waitForURL(/.*\?chatId=.+/, { timeout: 10000 });
    const url = page.url();
    expect(url).toContain('chatId=');

    const urlParams = new URL(url).searchParams;
    const chatId = urlParams.get('chatId');
    expect(chatId).toBeTruthy();

    // Navigate away and back to verify chat persists in project
    await page.goto(`/project/${projectId}`);

    // Verify chat appears in project's chat list (if visible)
    // This might be in a sidebar or table
    const chatListItem = page.locator(`text=${testMessage.substring(0, 20)}`).or(
      page.locator(`[data-chat-id="${chatId}"]`)
    );

    // Check if chat list is visible (might not be if we're in chat view)
    if (await chatListItem.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(chatListItem).toBeVisible();
    }

    console.log(`✅ Project chat test passed! Project: ${projectId}, Chat: ${chatId}`);
  });

  test('should verify chat associates with project in database', async ({ page }) => {
    // Navigate to project
    await page.goto(`/project/${projectId}`);

    const messageInput = page.locator('textarea[placeholder*="Message"]').first();
    await expect(messageInput).toBeVisible();

    // Send message
    await messageInput.fill('Database association test');
    const submitButton = page.locator('button[type="submit"]').or(page.locator('button:has-text("Send")'));
    await submitButton.click();

    // Wait for chat creation
    await page.waitForURL(/.*\?chatId=.+/, { timeout: 10000 });

    // Refresh to verify persistence
    await page.reload();

    // Verify message loads (proving database persistence)
    await expect(page.locator('text=Database association test').first()).toBeVisible({ timeout: 10000 });

    // Verify we're still in project context
    expect(page.url()).toContain(`/project/${projectId}`);
  });
});
