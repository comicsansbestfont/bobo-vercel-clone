/**
 * M37-01 Advisory System E2E Test Helpers
 *
 * Shared utilities for advisory system E2E tests:
 * - Page navigation helpers
 * - Query submission helpers
 * - Result validation helpers
 * - Screenshot utilities
 * - Console monitoring
 */

import { Page, expect, TestInfo } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Constants
// ============================================================================

export const ADVISORY_PROJECT_ID = '11111111-1111-1111-1111-111111111111';
export const DEFAULT_WAIT_TIME = 15000; // 15 seconds for AI responses
export const MAX_RESPONSE_TIME = 60000; // 60 seconds max

export const EXPECTED_DEALS = [
  'MyTab',
  'SwiftCheckin',
  'ArcheloLab',
  'ControlShiftAI',
  'Talvin',
  'Tandm',
];

export const EXPECTED_CLIENTS = ['SwiftCheckin'];

// Validation queries from sprint document
export const VALIDATION_QUERIES = {
  briefMyTab: 'Brief me on MyTab',
  emailMikaela: 'What was my last email to Mikaela?',
  redFlags: 'What deals have red flags?',
  prepSwiftCheckin: 'Prep me for SwiftCheckin call',
  valuationArcheloLab: 'What\'s the valuation for ArcheloLab?',
  dec2MeetingMyTab: 'Show me Dec 2 meeting notes for MyTab',
};

// ============================================================================
// Page Navigation
// ============================================================================

/**
 * Navigate to Agent Mode (home page)
 */
export async function navigateToAgentMode(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Wait for chat interface
  const messageInput = page.locator('textarea[placeholder]').first();
  await expect(messageInput).toBeVisible({ timeout: 10000 });
}

/**
 * Navigate to a specific project
 */
export async function navigateToProject(page: Page, projectId: string): Promise<void> {
  await page.goto(`/project/${projectId}`);
  await page.waitForLoadState('networkidle');
}

// ============================================================================
// Query Helpers
// ============================================================================

/**
 * Submit a query and wait for response
 */
export async function submitQuery(
  page: Page,
  query: string,
  options: {
    waitTime?: number;
    takeScreenshot?: boolean;
    screenshotName?: string;
  } = {}
): Promise<string> {
  const { waitTime = DEFAULT_WAIT_TIME, takeScreenshot = false, screenshotName = 'query-result' } = options;

  const messageInput = page.locator('textarea[placeholder]').first();
  await expect(messageInput).toBeVisible();

  await messageInput.fill(query);

  const submitButton = page.locator('button[type="submit"]').or(
    page.locator('button:has-text("Send")')
  );
  await submitButton.click();

  // Wait for response
  await page.waitForTimeout(waitTime);

  // Get response text
  const assistantMessage = page.locator('[role="article"]').or(page.locator('.message')).last();
  await expect(assistantMessage).toBeVisible({ timeout: MAX_RESPONSE_TIME });

  const responseText = await assistantMessage.textContent() || '';

  if (takeScreenshot) {
    await saveScreenshot(page, screenshotName);
  }

  return responseText;
}

/**
 * Submit multiple queries in sequence
 */
export async function submitQuerySequence(
  page: Page,
  queries: string[],
  delayBetween: number = 5000
): Promise<string[]> {
  const responses: string[] = [];

  for (const query of queries) {
    const response = await submitQuery(page, query);
    responses.push(response);
    await page.waitForTimeout(delayBetween);
  }

  return responses;
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Check if response contains expected advisory content
 */
export function validateAdvisoryContent(
  response: string,
  expectedTerms: string[]
): {
  passed: boolean;
  matches: string[];
  missing: string[];
} {
  const lowerResponse = response.toLowerCase();
  const matches: string[] = [];
  const missing: string[] = [];

  for (const term of expectedTerms) {
    if (lowerResponse.includes(term.toLowerCase())) {
      matches.push(term);
    } else {
      missing.push(term);
    }
  }

  return {
    passed: matches.length > 0,
    matches,
    missing,
  };
}

/**
 * Validate validation query response
 */
export function validateQueryResponse(
  queryName: string,
  response: string
): {
  passed: boolean;
  score: number;
  details: Record<string, boolean>;
} {
  const details: Record<string, boolean> = {};

  switch (queryName) {
    case 'briefMyTab':
      details.hasMyTab = response.toLowerCase().includes('mytab');
      details.hasStage = response.toLowerCase().includes('stage') || response.toLowerCase().includes('phase');
      details.hasContact = response.toLowerCase().includes('mikaela') || response.toLowerCase().includes('founder');
      details.hasFlags = response.toLowerCase().includes('flag') || response.toLowerCase().includes('concern');
      break;

    case 'emailMikaela':
      details.hasEmail = response.toLowerCase().includes('email');
      details.hasMikaela = response.toLowerCase().includes('mikaela');
      details.hasComms = response.toLowerCase().includes('communication') || response.toLowerCase().includes('message');
      break;

    case 'redFlags':
      details.hasRedFlag = response.toLowerCase().includes('flag') || response.toLowerCase().includes('red');
      details.hasStrategic = response.toLowerCase().includes('strategic') || response.toLowerCase().includes('concern');
      details.hasMultipleDeals = (response.match(/mytab|swiftcheckin|archelolab|controlshiftai|talvin|tandm/gi) || []).length >= 2;
      break;

    case 'prepSwiftCheckin':
      details.hasSwiftCheckin = response.toLowerCase().includes('swiftcheckin');
      details.hasClient = response.toLowerCase().includes('client') || response.toLowerCase().includes('profile');
      details.hasEngagement = response.toLowerCase().includes('engagement') || response.toLowerCase().includes('gtm');
      break;

    case 'valuationArcheloLab':
      details.hasArcheloLab = response.toLowerCase().includes('archelolab');
      details.hasValuation = response.toLowerCase().includes('valuation');
      details.hasFinancial = response.toLowerCase().includes('arr') || response.includes('$');
      break;

    case 'dec2MeetingMyTab':
      details.hasMyTab = response.toLowerCase().includes('mytab');
      details.hasMeeting = response.toLowerCase().includes('meeting') || response.toLowerCase().includes('session');
      details.hasDecember = response.toLowerCase().includes('dec') || response.includes('12-02');
      break;
  }

  const passedCount = Object.values(details).filter(Boolean).length;
  const totalCount = Object.keys(details).length;
  const score = totalCount > 0 ? passedCount / totalCount : 0;

  return {
    passed: score >= 0.5, // Pass if at least 50% of criteria met
    score,
    details,
  };
}

// ============================================================================
// Console Monitoring
// ============================================================================

/**
 * Console message collector class
 */
export class ConsoleCollector {
  private messages: Array<{ type: string; text: string; timestamp: number }> = [];

  attach(page: Page): void {
    page.on('console', msg => {
      this.messages.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: Date.now(),
      });
    });
  }

  getAll(): typeof this.messages {
    return [...this.messages];
  }

  getErrors(): string[] {
    return this.messages
      .filter(m => m.type === 'error')
      .map(m => m.text);
  }

  getWarnings(): string[] {
    return this.messages
      .filter(m => m.type === 'warning')
      .map(m => m.text);
  }

  getByPattern(pattern: RegExp): string[] {
    return this.messages
      .filter(m => pattern.test(m.text))
      .map(m => `[${m.type}] ${m.text}`);
  }

  hasToolInvocation(toolName: string): boolean {
    return this.messages.some(m =>
      m.text.includes(toolName) ||
      m.text.includes(`[${toolName}]`)
    );
  }

  clear(): void {
    this.messages = [];
  }
}

// ============================================================================
// Network Monitoring
// ============================================================================

/**
 * Network request collector class
 */
export class NetworkCollector {
  private requests: Array<{ method: string; url: string; status?: number }> = [];
  private errors: string[] = [];

  attach(page: Page): void {
    page.on('request', request => {
      this.requests.push({
        method: request.method(),
        url: request.url(),
      });
    });

    page.on('response', response => {
      const idx = this.requests.findIndex(r => r.url === response.url());
      if (idx !== -1) {
        this.requests[idx].status = response.status();
      }
    });

    page.on('requestfailed', request => {
      this.errors.push(`${request.url()} - ${request.failure()?.errorText}`);
    });
  }

  getApiCalls(): typeof this.requests {
    return this.requests.filter(r => r.url.includes('/api/'));
  }

  getErrors(): string[] {
    return [...this.errors];
  }

  hasApiCall(path: string): boolean {
    return this.requests.some(r => r.url.includes(path));
  }

  clear(): void {
    this.requests = [];
    this.errors = [];
  }
}

// ============================================================================
// Screenshot Utilities
// ============================================================================

const SCREENSHOT_BASE_DIR = path.join(__dirname, '../../screenshots');

/**
 * Ensure screenshot directory exists
 */
export function ensureScreenshotDir(subDir: string = ''): string {
  const dir = path.join(SCREENSHOT_BASE_DIR, subDir);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/**
 * Save a screenshot with timestamp
 */
export async function saveScreenshot(
  page: Page,
  name: string,
  subDir: string = 'm37'
): Promise<string> {
  const dir = ensureScreenshotDir(subDir);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${name}-${timestamp}.png`;
  const filepath = path.join(dir, filename);

  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`Screenshot saved: ${filepath}`);

  return filepath;
}

/**
 * Save screenshot on test failure
 */
export async function saveFailureScreenshot(
  page: Page,
  testInfo: TestInfo
): Promise<void> {
  if (testInfo.status === 'failed') {
    const name = testInfo.title.replace(/\s+/g, '-').toLowerCase();
    await saveScreenshot(page, `${name}-failed`, 'failures');
  }
}

// ============================================================================
// Test Fixtures
// ============================================================================

/**
 * Create a test markdown file for advisory testing
 */
export async function createTestAdvisoryFile(): Promise<string> {
  const fixtureDir = path.join(__dirname, '../fixtures');
  if (!fs.existsSync(fixtureDir)) {
    fs.mkdirSync(fixtureDir, { recursive: true });
  }

  const filename = 'test-advisory-doc.md';
  const filepath = path.join(fixtureDir, filename);
  const content = `# Test Advisory Document

## Deal Overview
This is a test deal document for E2E testing.

## Key Contacts
- Test Contact: test@example.com

## Red Flags
- Test red flag for validation

## Valuation
- ARR: $100K (test value)
- Stage: Phase 1a

## Meeting Notes
### December 2, 2025
- Test meeting notes for validation queries
`;

  fs.writeFileSync(filepath, content, 'utf-8');
  return filepath;
}

/**
 * Clean up test fixtures
 */
export function cleanupTestFixtures(): void {
  const fixtureDir = path.join(__dirname, '../fixtures');
  if (fs.existsSync(fixtureDir)) {
    const files = fs.readdirSync(fixtureDir);
    for (const file of files) {
      if (file.startsWith('test-')) {
        fs.unlinkSync(path.join(fixtureDir, file));
      }
    }
  }
}

// ============================================================================
// Assertion Helpers
// ============================================================================

/**
 * Assert response contains at least n of the expected terms
 */
export function assertContainsAtLeast(
  response: string,
  terms: string[],
  minCount: number
): void {
  const matches = terms.filter(term =>
    response.toLowerCase().includes(term.toLowerCase())
  );

  expect(
    matches.length,
    `Expected at least ${minCount} of [${terms.join(', ')}], found [${matches.join(', ')}]`
  ).toBeGreaterThanOrEqual(minCount);
}

/**
 * Assert no console errors
 */
export function assertNoConsoleErrors(
  collector: ConsoleCollector,
  allowPatterns: RegExp[] = [/favicon/]
): void {
  const errors = collector.getErrors().filter(e =>
    !allowPatterns.some(pattern => pattern.test(e))
  );

  expect(errors, `Console errors: ${errors.join(', ')}`).toHaveLength(0);
}

/**
 * Assert no network errors
 */
export function assertNoNetworkErrors(
  collector: NetworkCollector,
  allowPatterns: RegExp[] = []
): void {
  const errors = collector.getErrors().filter(e =>
    !allowPatterns.some(pattern => pattern.test(e))
  );

  expect(errors, `Network errors: ${errors.join(', ')}`).toHaveLength(0);
}
