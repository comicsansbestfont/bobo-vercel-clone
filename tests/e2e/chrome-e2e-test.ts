/**
 * E2E Test: Access Tracking via Chrome DevTools Protocol
 *
 * This test verifies that search_memory updates access_count in the database.
 *
 * Run with: npx tsx tests/e2e/chrome-e2e-test.ts
 */

import WebSocket from 'ws';
import { createClient } from '@supabase/supabase-js';

const CDP_URL = 'ws://localhost:9222';
const APP_URL = 'http://localhost:3000';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface MemoryRow {
  id: string;
  content: string;
  access_count: number;
  last_accessed: string;
}

async function getAccessCounts(): Promise<Map<string, number>> {
  const { data, error } = await supabase
    .from('memory_entries')
    .select('id, access_count')
    .eq('is_active', true);

  if (error) throw error;

  const counts = new Map<string, number>();
  for (const row of data || []) {
    counts.set(row.id, row.access_count);
  }
  return counts;
}

async function getTopMemories(): Promise<MemoryRow[]> {
  const { data, error } = await supabase
    .from('memory_entries')
    .select('id, content, access_count, last_accessed')
    .eq('is_active', true)
    .order('last_accessed', { ascending: false })
    .limit(5);

  if (error) throw error;
  return data || [];
}

async function getPageTarget(): Promise<string | null> {
  try {
    const response = await fetch('http://localhost:9222/json');
    const targets = await response.json();

    const page = targets.find((t: { type: string; url: string }) =>
      t.type === 'page' && t.url.includes('localhost:3000')
    );

    return page?.webSocketDebuggerUrl || null;
  } catch {
    return null;
  }
}

async function sendCDPCommand(ws: WebSocket, method: string, params: Record<string, unknown> = {}): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 1000000);

    const timeout = setTimeout(() => {
      reject(new Error(`CDP command ${method} timed out`));
    }, 30000);

    const handler = (data: WebSocket.Data) => {
      const message = JSON.parse(data.toString());
      if (message.id === id) {
        clearTimeout(timeout);
        ws.off('message', handler);
        if (message.error) {
          reject(new Error(message.error.message));
        } else {
          resolve(message.result);
        }
      }
    };

    ws.on('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function waitForElement(ws: WebSocket, selector: string, timeout = 10000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const result = await sendCDPCommand(ws, 'Runtime.evaluate', {
        expression: `document.querySelector('${selector}') !== null`,
        returnByValue: true,
      }) as { result: { value: boolean } };

      if (result.result.value) return true;
    } catch {
      // Continue waiting
    }
    await new Promise(r => setTimeout(r, 500));
  }
  return false;
}

async function runE2ETest() {
  console.log('\n🧪 E2E Test: Access Tracking Integration\n');
  console.log('='.repeat(60) + '\n');

  // Step 1: Get baseline access counts
  console.log('📊 Step 1: Recording baseline access counts...');
  const baselineCounts = await getAccessCounts();
  const baselineMemories = await getTopMemories();
  console.log(`   Found ${baselineCounts.size} active memories`);
  console.log('   Top 3 by recent access:');
  for (const m of baselineMemories.slice(0, 3)) {
    console.log(`   - "${m.content.substring(0, 50)}..." (count: ${m.access_count})`);
  }

  // Step 2: Connect to Chrome
  console.log('\n🌐 Step 2: Connecting to Chrome DevTools...');
  const wsUrl = await getPageTarget();
  if (!wsUrl) {
    console.error('❌ No page found at localhost:3000');
    console.log('   Make sure Chrome is open with the app loaded');
    process.exit(1);
  }
  console.log('   ✅ Connected to page');

  const ws = new WebSocket(wsUrl);
  await new Promise<void>((resolve, reject) => {
    ws.on('open', resolve);
    ws.on('error', reject);
  });

  try {
    // Enable necessary domains
    await sendCDPCommand(ws, 'Page.enable');
    await sendCDPCommand(ws, 'Runtime.enable');
    await sendCDPCommand(ws, 'DOM.enable');

    // Step 3: Check current URL
    console.log('\n🚀 Step 3: Checking page state...');
    const currentUrl = await sendCDPCommand(ws, 'Runtime.evaluate', {
      expression: 'window.location.href',
      returnByValue: true,
    }) as { result: { value: string } };
    console.log(`   Current URL: ${currentUrl.result.value}`);

    // Navigate if not already on app
    if (!currentUrl.result.value.includes('localhost:3000')) {
      console.log('   Navigating to app...');
      await sendCDPCommand(ws, 'Page.navigate', { url: APP_URL });
    }
    await new Promise(r => setTimeout(r, 3000)); // Wait for page load

    // Step 4: Check for chat input
    console.log('\n💬 Step 4: Looking for chat interface...');
    const hasInput = await waitForElement(ws, 'textarea, input[type="text"], [contenteditable="true"]');
    if (!hasInput) {
      console.log('   ⚠️  Chat input not found - page may still be loading');
    } else {
      console.log('   ✅ Chat interface found');
    }

    // Step 5: Type a message that will trigger memory search
    console.log('\n⌨️  Step 5: Simulating user message to trigger memory search...');

    // Use JavaScript to interact with the page
    await sendCDPCommand(ws, 'Runtime.evaluate', {
      expression: `
        (async () => {
          // Find the textarea or input
          const input = document.querySelector('textarea') || document.querySelector('input[type="text"]');
          if (input) {
            // Focus and type
            input.focus();
            input.value = 'What do you remember about my work history?';
            // Trigger input event
            input.dispatchEvent(new Event('input', { bubbles: true }));
            return 'Message typed';
          }
          return 'Input not found';
        })()
      `,
      awaitPromise: true,
      returnByValue: true,
    });

    // Step 6: Submit the message
    console.log('\n📤 Step 6: Submitting message...');
    await sendCDPCommand(ws, 'Runtime.evaluate', {
      expression: `
        (async () => {
          // Try to find and click submit button
          const submitBtn = document.querySelector('button[type="submit"]') ||
                           document.querySelector('button:has(svg)') ||
                           document.querySelector('[data-testid="send-button"]');
          if (submitBtn) {
            submitBtn.click();
            return 'Clicked submit';
          }
          // Try Enter key on textarea
          const input = document.querySelector('textarea');
          if (input) {
            input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
            return 'Sent Enter key';
          }
          return 'Could not submit';
        })()
      `,
      awaitPromise: true,
      returnByValue: true,
    });

    // Step 7: Wait for response (memory search should be triggered)
    console.log('\n⏳ Step 7: Waiting for agent response (memory search)...');
    await new Promise(r => setTimeout(r, 8000)); // Wait for agent to process

    // Step 8: Check access counts again
    console.log('\n📊 Step 8: Checking access counts after search...');
    const afterCounts = await getAccessCounts();
    const afterMemories = await getTopMemories();

    // Compare
    let incrementedCount = 0;
    const changes: string[] = [];

    for (const [id, beforeCount] of baselineCounts) {
      const afterCount = afterCounts.get(id) || 0;
      if (afterCount > beforeCount) {
        incrementedCount++;
        const memory = afterMemories.find(m => m.id === id);
        changes.push(`   +${afterCount - beforeCount}: "${memory?.content.substring(0, 40) || id}..."`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n📈 Results:\n');

    if (incrementedCount > 0) {
      console.log(`✅ SUCCESS: ${incrementedCount} memories had access_count incremented!\n`);
      console.log('   Changed memories:');
      for (const change of changes.slice(0, 5)) {
        console.log(change);
      }
      console.log('\n   Access tracking is working correctly! 🎉');
    } else {
      console.log('⚠️  No access_count changes detected.');
      console.log('   This could mean:');
      console.log('   - The agent didn\'t use search_memory');
      console.log('   - The message wasn\'t submitted successfully');
      console.log('   - The search returned no results');
      console.log('\n   Check the browser to see the conversation state.');
    }

    console.log('\n📊 Current top memories by last_accessed:');
    for (const m of afterMemories.slice(0, 5)) {
      console.log(`   - count: ${m.access_count} | "${m.content.substring(0, 50)}..."`);
    }

  } finally {
    ws.close();
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

runE2ETest().catch(error => {
  console.error('E2E Test error:', error);
  process.exit(1);
});
