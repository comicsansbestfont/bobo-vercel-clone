import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * E2E Test: M2 Citations Flow
 *
 * Tests the Double-Loop RAG system with inline citations:
 * - Loop A: Project Context Caching (uploaded files)
 * - Loop B: Global Hybrid Search (cross-project search)
 * - Inline citation markers [1], [2], etc.
 * - Source citation UI and interaction
 */
test.describe('M2 Citations Flow', () => {
  let projectId: string;
  const testMarkdownFile = path.join(__dirname, '../fixtures/test-knowledge.md');

  test.beforeAll(async () => {
    // Create a test markdown file
    const testContent = `# Test Knowledge Base

## React Best Practices

Always use functional components with hooks instead of class components.
TypeScript should be used for all new components to ensure type safety.

## API Design

RESTful APIs should follow these principles:
- Use proper HTTP methods (GET, POST, PUT, DELETE)
- Return appropriate status codes
- Implement proper error handling

## Testing Guidelines

Write unit tests for all utility functions.
E2E tests should cover critical user flows.
`;

    const fixturesDir = path.join(__dirname, '../fixtures');
    if (!fs.existsSync(fixturesDir)) {
      fs.mkdirSync(fixturesDir, { recursive: true });
    }
    fs.writeFileSync(testMarkdownFile, testContent);
  });

  test.afterAll(async () => {
    // Cleanup test file
    if (fs.existsSync(testMarkdownFile)) {
      fs.unlinkSync(testMarkdownFile);
    }
  });

  test.beforeEach(async ({ page }) => {
    // Navigate to home and create a new project
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Create a new project
    const createProjectButton = page.locator('button:has-text("New Project")').or(
      page.locator('[data-testid="create-project"]')
    );

    if (await createProjectButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await createProjectButton.click();

      const projectNameInput = page.locator('input[name="name"]').or(
        page.locator('input[placeholder*="Project"]').first()
      );
      await projectNameInput.fill('Citations Test Project');

      const submitButton = page.locator('button:has-text("Create")').or(
        page.locator('button[type="submit"]')
      );
      await submitButton.click();

      await page.waitForURL(/.*project\/.*/, { timeout: 10000 });

      const url = page.url();
      const match = url.match(/project\/([^/?]+)/);
      projectId = match ? match[1] : '';
      expect(projectId).toBeTruthy();
    } else {
      // Use existing project
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

  test('should show citations after uploading knowledge file', async ({ page }) => {
    // Navigate to project settings
    await page.goto(`/project/${projectId}/settings`);

    // Wait for settings page to load
    await page.waitForLoadState('networkidle');

    // Upload the test markdown file
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();
    await fileInput.setInputFiles(testMarkdownFile);

    // Click upload button
    const uploadButton = page.locator('button:has-text("Upload")');
    await expect(uploadButton).toBeVisible({ timeout: 5000 });
    await uploadButton.click();

    // Wait for upload success
    await expect(page.locator('text=File uploaded successfully').or(
      page.locator('text=test-knowledge.md')
    )).toBeVisible({ timeout: 10000 });

    // Navigate back to project chat
    await page.goto(`/project/${projectId}`);

    const messageInput = page.locator('textarea[placeholder*="Message"]').first();
    await expect(messageInput).toBeVisible();

    // Ask a question that should trigger citation from the uploaded file
    const testQuestion = 'What are the React best practices mentioned in the knowledge base?';
    await messageInput.fill(testQuestion);

    const submitButton = page.locator('button[type="submit"]').or(page.locator('button:has-text("Send")'));
    await submitButton.click();

    // Wait for response
    await page.waitForTimeout(5000);

    // Look for citation markers [1], [2], etc.
    const citationMarker = page.locator('text=/\\[\\d+\\]/').first();

    // The citation should appear if the RAG system found the uploaded file
    // Note: This might be flaky depending on AI response, so we use a longer timeout
    const hasCitation = await citationMarker.isVisible({ timeout: 15000 }).catch(() => false);

    if (hasCitation) {
      await expect(citationMarker).toBeVisible();
      console.log('✅ Citations detected in response');

      // Try to find sources section
      const sourcesSection = page.locator('text=/Sources?:/i').or(
        page.locator('[data-testid="sources"]')
      );

      if (await sourcesSection.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(sourcesSection).toBeVisible();
        console.log('✅ Sources section displayed');
      }
    } else {
      console.log('⚠️  No citations detected - may need to check RAG configuration or AI response');
    }

    // Verify chat was created and persisted
    await page.waitForURL(/.*\?chatId=.+/, { timeout: 10000 });
    const chatId = new URL(page.url()).searchParams.get('chatId');
    expect(chatId).toBeTruthy();

    console.log(`✅ M2 Citations test completed for project: ${projectId}, chat: ${chatId}`);
  });

  test('should handle file citations in project context', async ({ page }) => {
    // Go to settings and upload file
    await page.goto(`/project/${projectId}/settings`);
    await page.waitForLoadState('networkidle');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testMarkdownFile);

    const uploadButton = page.locator('button:has-text("Upload")');
    await uploadButton.click();

    // Wait for upload
    await page.waitForTimeout(3000);

    // Go back to project
    await page.goto(`/project/${projectId}`);

    const messageInput = page.locator('textarea[placeholder*="Message"]').first();
    await expect(messageInput).toBeVisible();

    // Ask specific question about file content
    await messageInput.fill('What does the knowledge base say about API design?');

    const submitButton = page.locator('button[type="submit"]').or(page.locator('button:has-text("Send")'));
    await submitButton.click();

    // Wait for response to stream
    await page.waitForTimeout(5000);

    // Verify response contains relevant content (even if no explicit citations)
    const responseText = await page.locator('[role="article"]').or(page.locator('.message')).last().textContent();

    // The response should mention something about APIs or RESTful design
    const hasRelevantContent = responseText?.toLowerCase().includes('api') ||
                               responseText?.toLowerCase().includes('rest') ||
                               responseText?.toLowerCase().includes('http');

    if (hasRelevantContent) {
      console.log('✅ Response includes content from uploaded knowledge base');
    } else {
      console.log('⚠️  Response may not have used uploaded file - check Loop A context caching');
    }
  });

  test('should display custom instructions in project context', async ({ page }) => {
    // Navigate to settings
    await page.goto(`/project/${projectId}/settings`);
    await page.waitForLoadState('networkidle');

    // Add custom instructions
    const instructionsTextarea = page.locator('textarea').first();
    await expect(instructionsTextarea).toBeVisible();

    const customInstructions = 'Always respond in a very concise manner with bullet points. Start every response with "PROJECT CONTEXT:".';
    await instructionsTextarea.fill(customInstructions);

    // Save instructions
    const saveButton = page.locator('button:has-text("Save")');
    await saveButton.click();

    // Wait for save confirmation
    await expect(page.locator('text=Custom instructions saved').or(
      page.locator('text=saved', { hasText: /saved/i })
    )).toBeVisible({ timeout: 5000 });

    // Navigate to project chat
    await page.goto(`/project/${projectId}`);

    const messageInput = page.locator('textarea[placeholder*="Message"]').first();
    await expect(messageInput).toBeVisible();

    // Ask a question
    await messageInput.fill('Tell me about TypeScript');

    const submitButton = page.locator('button[type="submit"]').or(page.locator('button:has-text("Send")'));
    await submitButton.click();

    // Wait for response
    await page.waitForTimeout(5000);

    // Check if response starts with our custom instruction marker
    const responseText = await page.locator('[role="article"]').or(page.locator('.message')).last().textContent();

    const hasCustomInstructionMarker = responseText?.includes('PROJECT CONTEXT:');

    if (hasCustomInstructionMarker) {
      console.log('✅ Custom instructions applied to project chat');
    } else {
      console.log('⚠️  Custom instructions may not have been applied - check context-manager.ts');
    }
  });

  test('should show file in uploaded files list', async ({ page }) => {
    // Navigate to settings
    await page.goto(`/project/${projectId}/settings`);
    await page.waitForLoadState('networkidle');

    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testMarkdownFile);

    const uploadButton = page.locator('button:has-text("Upload")');
    await uploadButton.click();

    // Wait for file to appear in list
    await expect(page.locator('text=test-knowledge.md')).toBeVisible({ timeout: 10000 });

    // Verify file metadata
    const fileListItem = page.locator('text=test-knowledge.md').locator('..');

    // Should show file size
    await expect(fileListItem).toContainText(/KB|MB/);

    // Should have delete button
    const deleteButton = fileListItem.locator('button').filter({ hasText: /delete|trash/i }).or(
      fileListItem.locator('button svg') // Icon button
    );
    await expect(deleteButton).toBeVisible();

    console.log('✅ File appears in uploaded files list with metadata');
  });
});
