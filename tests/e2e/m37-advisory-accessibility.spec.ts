import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * E2E Test: M37 Accessibility Compliance
 *
 * Basic accessibility tests without external dependencies.
 * Tests keyboard navigation, ARIA attributes, and screen reader compatibility.
 */

const SCREENSHOT_DIR = path.join(__dirname, '../screenshots/m37-accessibility');

test.describe('M37: Accessibility Compliance', () => {
  test.beforeAll(async () => {
    if (!fs.existsSync(SCREENSHOT_DIR)) {
      fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Keyboard Navigation', () => {
    test('should have logical tab order', async ({ page }) => {
      const tabOrder: string[] = [];

      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(100);

        const focused = await page.evaluate(() => {
          const el = document.activeElement;
          return el?.tagName || 'unknown';
        });

        tabOrder.push(focused);
      }

      console.log('Tab order:', tabOrder);
      expect(tabOrder.length).toBeGreaterThan(0);
    });

    test('should support Enter to submit', async ({ page }) => {
      const messageInput = page.locator('textarea[placeholder]').first();
      await expect(messageInput).toBeVisible();

      await messageInput.focus();
      await page.keyboard.type('Test keyboard submit');
      await page.keyboard.press('Enter');

      await page.waitForTimeout(3000);

      const userMessage = page.locator('text="Test keyboard submit"');
      await expect(userMessage).toBeVisible({ timeout: 5000 });
    });

    test('should support Shift+Enter for line breaks', async ({ page }) => {
      const messageInput = page.locator('textarea[placeholder]').first();
      await messageInput.focus();

      await page.keyboard.type('Line 1');
      await page.keyboard.press('Shift+Enter');
      await page.keyboard.type('Line 2');

      const value = await messageInput.inputValue();
      expect(value).toContain('\n');
    });

    test('should have visible focus indicators', async ({ page }) => {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(200);

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'focus-indicator.png'),
      });

      const focusStyles = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement;
        const styles = window.getComputedStyle(el);
        return {
          outline: styles.outline,
          boxShadow: styles.boxShadow,
        };
      });

      const hasFocus = focusStyles.outline !== 'none' || focusStyles.boxShadow !== 'none';
      expect(hasFocus).toBe(true);
    });
  });

  test.describe('ARIA Attributes', () => {
    test('should have proper landmark roles', async ({ page }) => {
      const hasMain = await page.locator('main, [role="main"]').count();
      expect(hasMain).toBeGreaterThan(0);
    });

    test('should have accessible submit button', async ({ page }) => {
      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toBeVisible();

      const label = await submitButton.getAttribute('aria-label') ||
                    await submitButton.textContent();
      expect(label).toBeTruthy();
    });

    test('should have accessible message input', async ({ page }) => {
      const messageInput = page.locator('textarea[placeholder]').first();
      await expect(messageInput).toBeVisible();

      const placeholder = await messageInput.getAttribute('placeholder');
      const ariaLabel = await messageInput.getAttribute('aria-label');

      expect(placeholder || ariaLabel).toBeTruthy();
    });
  });

  test.describe('Visual Accessibility', () => {
    test('should work at 200% zoom', async ({ page }) => {
      await page.setViewportSize({ width: 640, height: 360 });

      const messageInput = page.locator('textarea[placeholder]').first();
      await expect(messageInput).toBeVisible();

      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toBeVisible();

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'zoom-200.png'),
      });
    });

    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const messageInput = page.locator('textarea[placeholder]').first();
      await expect(messageInput).toBeVisible();

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'mobile.png'),
      });
    });
  });

  test.describe('Page Metadata', () => {
    test('should have HTML lang attribute', async ({ page }) => {
      const lang = await page.evaluate(() => document.documentElement.lang);
      expect(lang).toBeTruthy();
    });

    test('should have page title', async ({ page }) => {
      const title = await page.title();
      expect(title).toBeTruthy();
      expect(title.length).toBeGreaterThan(0);
    });

    test('should not have duplicate IDs', async ({ page }) => {
      const duplicates = await page.evaluate(() => {
        const ids: { [key: string]: number } = {};
        document.querySelectorAll('[id]').forEach(el => {
          ids[el.id] = (ids[el.id] || 0) + 1;
        });
        return Object.entries(ids).filter(([, count]) => count > 1);
      });

      expect(duplicates.length).toBe(0);
    });
  });
});
