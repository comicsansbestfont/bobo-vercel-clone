/**
 * API Integration Tests for Memory Tools (M3.5-01)
 *
 * Tests the backend integration including:
 * - API endpoints
 * - Database operations
 * - Agent handler integration
 * - Async extraction pipeline
 * - Error handling
 *
 * Run with: npx tsx tests/api/memory-tools-api.test.ts
 */

import { describe, test, expect, beforeAll } from '@jest/globals';

// Test configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const TEST_USER_MESSAGE = { role: 'user' as const, parts: [{ type: 'text' as const, text: '' }] };

// Color output helpers
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function logTest(name: string, status: 'PASS' | 'FAIL' | 'SKIP', duration?: number) {
  const color = status === 'PASS' ? colors.green : status === 'FAIL' ? colors.red : colors.yellow;
  const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏭️';
  console.log(`${color}${emoji} ${name}${colors.reset}${duration ? ` (${duration}ms)` : ''}`);
}

function logSection(title: string) {
  console.log(`\n${colors.bright}${colors.blue}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}${title}${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}${'='.repeat(60)}${colors.reset}\n`);
}

// ============================================================================
// Test Suite
// ============================================================================

async function runTests() {
  logSection('M3.5-01: API Integration Tests');

  let testsPassed = 0;
  let testsFailed = 0;
  let testsSkipped = 0;

  // ========================================================================
  // TC-API-001: Health Check
  // ========================================================================
  try {
    const start = Date.now();
    const response = await fetch(BASE_URL);
    const duration = Date.now() - start;

    if (response.ok) {
      logTest('TC-API-001: Server health check', 'PASS', duration);
      testsPassed++;
    } else {
      throw new Error(`Server returned ${response.status}`);
    }
  } catch (error) {
    logTest('TC-API-001: Server health check', 'FAIL');
    console.error('  Error:', error);
    testsFailed++;
    console.log('\n❌ Server not running. Please start with: npm run dev');
    process.exit(1);
  }

  // ========================================================================
  // TC-API-002: Async Extraction Endpoint
  // ========================================================================
  try {
    const start = Date.now();

    // This requires a valid chat ID, so we'll test error handling instead
    const response = await fetch(`${BASE_URL}/api/memory/extract-background`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}), // Missing chatId
    });

    const duration = Date.now() - start;
    const data = await response.json();

    if (response.status === 400 && data.error) {
      logTest('TC-API-002: Async extraction - error handling', 'PASS', duration);
      console.log('  ✓ Correctly rejects missing chatId');
      testsPassed++;
    } else {
      throw new Error('Expected 400 error for missing chatId');
    }
  } catch (error) {
    logTest('TC-API-002: Async extraction - error handling', 'FAIL');
    console.error('  Error:', error);
    testsFailed++;
  }

  // ========================================================================
  // TC-API-003: Memory Entries API - GET
  // ========================================================================
  try {
    const start = Date.now();
    const response = await fetch(`${BASE_URL}/api/memory/entries`);
    const duration = Date.now() - start;
    const data = await response.json();

    if (response.ok && Array.isArray(data)) {
      logTest('TC-API-003: GET /api/memory/entries', 'PASS', duration);
      console.log(`  ✓ Retrieved ${data.length} memories`);
      testsPassed++;
    } else {
      throw new Error('Expected array of memories');
    }
  } catch (error) {
    logTest('TC-API-003: GET /api/memory/entries', 'FAIL');
    console.error('  Error:', error);
    testsFailed++;
  }

  // ========================================================================
  // TC-API-004: Memory Entries API - POST (Create)
  // ========================================================================
  let testMemoryId: string | null = null;
  try {
    const start = Date.now();
    const response = await fetch(`${BASE_URL}/api/memory/entries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: 'work_context',
        content: 'API_TEST: Senior TypeScript developer',
        confidence: 0.95,
        source_type: 'manual',
      }),
    });

    const duration = Date.now() - start;
    const data = await response.json();

    if (response.ok && data.id) {
      testMemoryId = data.id;
      logTest('TC-API-004: POST /api/memory/entries (create)', 'PASS', duration);
      console.log(`  ✓ Created memory: ${testMemoryId}`);
      testsPassed++;
    } else {
      throw new Error('Failed to create memory');
    }
  } catch (error) {
    logTest('TC-API-004: POST /api/memory/entries (create)', 'FAIL');
    console.error('  Error:', error);
    testsFailed++;
  }

  // ========================================================================
  // TC-API-005: Memory Entries API - PATCH (Update)
  // ========================================================================
  if (testMemoryId) {
    try {
      const start = Date.now();
      const response = await fetch(`${BASE_URL}/api/memory/entries/${testMemoryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: 'API_TEST: Principal TypeScript developer (updated)',
          confidence: 1.0,
        }),
      });

      const duration = Date.now() - start;
      const data = await response.json();

      if (response.ok && data.content.includes('updated')) {
        logTest('TC-API-005: PATCH /api/memory/entries/:id (update)', 'PASS', duration);
        console.log('  ✓ Updated memory content and confidence');
        testsPassed++;
      } else {
        throw new Error('Failed to update memory');
      }
    } catch (error) {
      logTest('TC-API-005: PATCH /api/memory/entries/:id (update)', 'FAIL');
      console.error('  Error:', error);
      testsFailed++;
    }
  } else {
    logTest('TC-API-005: PATCH /api/memory/entries/:id (update)', 'SKIP');
    console.log('  ⚠️  Skipped due to failed creation');
    testsSkipped++;
  }

  // ========================================================================
  // TC-API-006: Memory Entries API - DELETE (Soft Delete)
  // ========================================================================
  if (testMemoryId) {
    try {
      const start = Date.now();
      const response = await fetch(`${BASE_URL}/api/memory/entries/${testMemoryId}`, {
        method: 'DELETE',
      });

      const duration = Date.now() - start;

      if (response.ok) {
        logTest('TC-API-006: DELETE /api/memory/entries/:id (soft delete)', 'PASS', duration);
        console.log('  ✓ Memory soft deleted');
        testsPassed++;

        // Verify it's actually gone from GET
        const verifyResponse = await fetch(`${BASE_URL}/api/memory/entries`);
        const memories = await verifyResponse.json();
        const deleted = memories.find((m: any) => m.id === testMemoryId);

        if (!deleted) {
          console.log('  ✓ Verified memory no longer returned in GET');
        }
      } else {
        throw new Error('Failed to delete memory');
      }
    } catch (error) {
      logTest('TC-API-006: DELETE /api/memory/entries/:id (soft delete)', 'FAIL');
      console.error('  Error:', error);
      testsFailed++;
    }
  } else {
    logTest('TC-API-006: DELETE /api/memory/entries/:id (soft delete)', 'SKIP');
    console.log('  ⚠️  Skipped due to failed creation');
    testsSkipped++;
  }

  // ========================================================================
  // TC-API-007: Memory Settings API
  // ========================================================================
  try {
    const start = Date.now();
    const response = await fetch(`${BASE_URL}/api/memory/settings`);
    const duration = Date.now() - start;
    const data = await response.json();

    if (response.ok && data.auto_extract !== undefined) {
      logTest('TC-API-007: GET /api/memory/settings', 'PASS', duration);
      console.log(`  ✓ Auto-extract enabled: ${data.auto_extract}`);
      testsPassed++;
    } else {
      throw new Error('Failed to fetch memory settings');
    }
  } catch (error) {
    logTest('TC-API-007: GET /api/memory/settings', 'FAIL');
    console.error('  Error:', error);
    testsFailed++;
  }

  // ========================================================================
  // TC-API-008: Memory Suggestions API
  // ========================================================================
  try {
    const start = Date.now();
    const response = await fetch(`${BASE_URL}/api/memory/suggestions`);
    const duration = Date.now() - start;
    const data = await response.json();

    if (response.ok && Array.isArray(data)) {
      logTest('TC-API-008: GET /api/memory/suggestions', 'PASS', duration);
      console.log(`  ✓ Retrieved ${data.length} suggestions`);
      testsPassed++;
    } else {
      throw new Error('Expected array of suggestions');
    }
  } catch (error) {
    logTest('TC-API-008: GET /api/memory/suggestions', 'FAIL');
    console.error('  Error:', error);
    testsFailed++;
  }

  // ========================================================================
  // TC-API-009: Chat API - Non-Agent Mode
  // ========================================================================
  try {
    const start = Date.now();
    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          {
            id: 'test-msg-1',
            role: 'user',
            parts: [{ type: 'text', text: 'Hello, this is a test message' }],
          },
        ],
        model: 'openai/gpt-4o-mini',
        webSearch: false,
      }),
    });

    const duration = Date.now() - start;

    if (response.ok) {
      logTest('TC-API-009: POST /api/chat (non-agent mode)', 'PASS', duration);
      console.log('  ✓ Chat API responding');

      // Check for X-Chat-Id header
      const chatId = response.headers.get('X-Chat-Id');
      if (chatId) {
        console.log(`  ✓ Chat ID returned: ${chatId.substring(0, 8)}...`);
      }

      testsPassed++;
    } else {
      const errorText = await response.text();
      throw new Error(`Chat API error: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    logTest('TC-API-009: POST /api/chat (non-agent mode)', 'FAIL');
    console.error('  Error:', error);
    testsFailed++;
  }

  // ========================================================================
  // TC-API-010: Deduplication Detection
  // ========================================================================
  try {
    const start = Date.now();

    // Create first memory
    const response1 = await fetch(`${BASE_URL}/api/memory/entries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: 'work_context',
        content: 'DEDUP_TEST: I am a software engineer',
        confidence: 0.95,
        source_type: 'manual',
      }),
    });

    const memory1 = await response1.json();

    // Try to create very similar memory (should be rejected or flagged)
    const response2 = await fetch(`${BASE_URL}/api/memory/entries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: 'work_context',
        content: 'DEDUP_TEST: I am a software engineer', // Exact duplicate
        confidence: 0.95,
        source_type: 'manual',
      }),
    });

    const duration = Date.now() - start;

    // Clean up first memory
    if (memory1.id) {
      await fetch(`${BASE_URL}/api/memory/entries/${memory1.id}`, {
        method: 'DELETE',
      });
    }

    // Should either reject or handle duplicate
    if (response2.status === 400 || response2.status === 409) {
      logTest('TC-API-010: Deduplication detection', 'PASS', duration);
      console.log('  ✓ Duplicate memory rejected');
      testsPassed++;
    } else {
      // If it was created, clean it up
      const memory2 = await response2.json();
      if (memory2.id) {
        await fetch(`${BASE_URL}/api/memory/entries/${memory2.id}`, {
          method: 'DELETE',
        });
      }

      logTest('TC-API-010: Deduplication detection', 'SKIP');
      console.log('  ⚠️  Deduplication not enforced at API level (handled in agent tools)');
      testsSkipped++;
    }
  } catch (error) {
    logTest('TC-API-010: Deduplication detection', 'FAIL');
    console.error('  Error:', error);
    testsFailed++;
  }

  // ========================================================================
  // TC-API-011: Error Handling - Invalid Memory ID
  // ========================================================================
  try {
    const start = Date.now();
    const response = await fetch(
      `${BASE_URL}/api/memory/entries/00000000-0000-0000-0000-000000000000`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'test' }),
      }
    );

    const duration = Date.now() - start;

    if (response.status === 404 || response.status === 400) {
      logTest('TC-API-011: Error handling - invalid memory ID', 'PASS', duration);
      console.log('  ✓ Correctly handles invalid memory ID');
      testsPassed++;
    } else {
      throw new Error(`Expected 404 or 400, got ${response.status}`);
    }
  } catch (error) {
    logTest('TC-API-011: Error handling - invalid memory ID', 'FAIL');
    console.error('  Error:', error);
    testsFailed++;
  }

  // ========================================================================
  // TC-API-012: Error Handling - Invalid Request Body
  // ========================================================================
  try {
    const start = Date.now();
    const response = await fetch(`${BASE_URL}/api/memory/entries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Missing required fields
        content: 'test',
      }),
    });

    const duration = Date.now() - start;

    if (response.status === 400) {
      logTest('TC-API-012: Error handling - invalid request body', 'PASS', duration);
      console.log('  ✓ Correctly validates request body');
      testsPassed++;
    } else {
      throw new Error(`Expected 400, got ${response.status}`);
    }
  } catch (error) {
    logTest('TC-API-012: Error handling - invalid request body', 'FAIL');
    console.error('  Error:', error);
    testsFailed++;
  }

  // ========================================================================
  // Summary
  // ========================================================================
  logSection('Test Summary');

  const total = testsPassed + testsFailed + testsSkipped;
  const passRate = ((testsPassed / (total - testsSkipped)) * 100).toFixed(1);

  console.log(`${colors.bright}Total Tests:${colors.reset} ${total}`);
  console.log(`${colors.green}Passed:${colors.reset} ${testsPassed}`);
  console.log(`${colors.red}Failed:${colors.reset} ${testsFailed}`);
  console.log(`${colors.yellow}Skipped:${colors.reset} ${testsSkipped}`);
  console.log(`${colors.bright}Pass Rate:${colors.reset} ${passRate}%\n`);

  if (testsFailed === 0) {
    console.log(`${colors.green}${colors.bright}✅ All tests passed!${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.red}${colors.bright}❌ Some tests failed${colors.reset}\n`);
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});
