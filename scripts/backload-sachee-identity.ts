/**
 * Identity Backload Script
 *
 * Parses Sachee's identity documentation and inserts structured memory entries
 * into the memory_entries table for immediate personalization.
 *
 * Run with: npx tsx scripts/backload-sachee-identity.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';

// Environment setup
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const DEFAULT_USER_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

type MemoryEntry = {
  user_id: string;
  category: 'work_context' | 'personal_context' | 'top_of_mind' | 'brief_history' | 'long_term_background' | 'other_instructions';
  subcategory: string | null;
  content: string;
  summary: string | null;
  confidence: number;
  source_type: 'manual' | 'extracted' | 'suggested';
  source_chat_ids: string[];
  source_project_ids: string[];
  source_message_count: number;
  time_period: 'current' | 'recent' | 'past' | 'long_ago';
  relevance_score: number;
  content_hash: string;
};

function generateContentHash(content: string): string {
  return crypto.createHash('sha256').update(content.toLowerCase().trim()).digest('hex');
}

/**
 * Sachee's Identity Memory Entries
 * Parsed from docs/Research/Identity/
 */
const SACHEE_MEMORIES: Omit<MemoryEntry, 'user_id' | 'content_hash'>[] = [
  // ========================================
  // WORK CONTEXT (Current Role & Expertise)
  // ========================================
  {
    category: 'work_context',
    subcategory: null,
    content: 'B2B SaaS go-to-market advisor and strategist',
    summary: 'Primary professional role',
    confidence: 1.0,
    source_type: 'manual',
    source_chat_ids: [],
    source_project_ids: [],
    source_message_count: 0,
    time_period: 'current',
    relevance_score: 1.0,
  },
  {
    category: 'work_context',
    subcategory: null,
    content: 'Former COO at CorePlan (mining tech SaaS), 2020-2025',
    summary: 'Most recent full-time role',
    confidence: 1.0,
    source_type: 'manual',
    source_chat_ids: [],
    source_project_ids: [],
    source_message_count: 0,
    time_period: 'recent',
    relevance_score: 0.95,
  },
  {
    category: 'work_context',
    subcategory: null,
    content: 'Built CorePlan\'s commercial engine from pre-product-market fit through scale: sales, marketing, customer success, revenue operations',
    summary: 'Core COO accomplishment at CorePlan',
    confidence: 1.0,
    source_type: 'manual',
    source_chat_ids: [],
    source_project_ids: [],
    source_message_count: 0,
    time_period: 'recent',
    relevance_score: 0.95,
  },
  {
    category: 'work_context',
    subcategory: null,
    content: 'Specializes in founder-led sales, vertical SaaS, and complex B2B go-to-market',
    summary: 'Core expertise areas',
    confidence: 1.0,
    source_type: 'manual',
    source_chat_ids: [],
    source_project_ids: [],
    source_message_count: 0,
    time_period: 'current',
    relevance_score: 1.0,
  },
  {
    category: 'work_context',
    subcategory: null,
    content: 'Expert in SPICED framework for consultative sales and presales methodology',
    summary: 'Sales methodology expertise',
    confidence: 1.0,
    source_type: 'manual',
    source_chat_ids: [],
    source_project_ids: [],
    source_message_count: 0,
    time_period: 'current',
    relevance_score: 0.9,
  },
  {
    category: 'work_context',
    subcategory: null,
    content: '15+ years across telco, hospitality, marketplaces, and vertical SaaS',
    summary: 'Breadth of experience across industries',
    confidence: 1.0,
    source_type: 'manual',
    source_chat_ids: [],
    source_project_ids: [],
    source_message_count: 0,
    time_period: 'long_ago',
    relevance_score: 0.85,
  },
  {
    category: 'work_context',
    subcategory: null,
    content: 'Focus on early-stage B2B SaaS founders (0-10M ARR), especially 0-1M ARR',
    summary: 'Target market and ideal customer profile',
    confidence: 1.0,
    source_type: 'manual',
    source_chat_ids: [],
    source_project_ids: [],
    source_message_count: 0,
    time_period: 'current',
    relevance_score: 1.0,
  },
  {
    category: 'work_context',
    subcategory: null,
    content: 'Deep experience in under-digitised industries: mining, heavy industry, construction, trades',
    summary: 'Vertical expertise in complex B2B markets',
    confidence: 1.0,
    source_type: 'manual',
    source_chat_ids: [],
    source_project_ids: [],
    source_message_count: 0,
    time_period: 'current',
    relevance_score: 0.9,
  },
  {
    category: 'work_context',
    subcategory: null,
    content: 'Developed Sachee GTM Strategy Workbook as core advisory framework',
    summary: 'Proprietary GTM methodology and deliverable',
    confidence: 1.0,
    source_type: 'manual',
    source_chat_ids: [],
    source_project_ids: [],
    source_message_count: 0,
    time_period: 'current',
    relevance_score: 0.9,
  },

  // ========================================
  // LONG-TERM BACKGROUND (Career History)
  // ========================================
  {
    category: 'long_term_background',
    subcategory: null,
    content: 'TSA Telco Group (Telstra contractor): Sales & Retention Manager, 2007-2013',
    summary: 'Early career in high-volume telco sales',
    confidence: 1.0,
    source_type: 'manual',
    source_chat_ids: [],
    source_project_ids: [],
    source_message_count: 0,
    time_period: 'long_ago',
    relevance_score: 0.7,
  },
  {
    category: 'long_term_background',
    subcategory: null,
    content: 'Accor Plus: Programme Manager, Perth. Led P&L turnaround of underperforming loyalty programme, 2014-2016',
    summary: 'Hospitality and membership turnaround experience',
    confidence: 1.0,
    source_type: 'manual',
    source_chat_ids: [],
    source_project_ids: [],
    source_message_count: 0,
    time_period: 'long_ago',
    relevance_score: 0.75,
  },
  {
    category: 'long_term_background',
    subcategory: null,
    content: 'UberEATS Perth: Launch team, restaurant partnerships & operations, 2016-2017',
    summary: '"First boots on ground" for UberEATS Perth launch',
    confidence: 1.0,
    source_type: 'manual',
    source_chat_ids: [],
    source_project_ids: [],
    source_message_count: 0,
    time_period: 'past',
    relevance_score: 0.8,
  },
  {
    category: 'long_term_background',
    subcategory: null,
    content: 'Sidekicker: General Manager, Perth. Built dual-sided gig marketplace from scratch, 2017-2019',
    summary: 'Marketplace launch and growth experience',
    confidence: 1.0,
    source_type: 'manual',
    source_chat_ids: [],
    source_project_ids: [],
    source_message_count: 0,
    time_period: 'past',
    relevance_score: 0.8,
  },
  {
    category: 'long_term_background',
    subcategory: null,
    content: 'Austal Ships: Product Strategy Consultant. Advised on GTM for AI/data analytics software targeting ferry operators, 2020',
    summary: 'Consulting experience in maritime/industrial tech',
    confidence: 1.0,
    source_type: 'manual',
    source_chat_ids: [],
    source_project_ids: [],
    source_message_count: 0,
    time_period: 'past',
    relevance_score: 0.75,
  },

  // ========================================
  // PERSONAL CONTEXT
  // ========================================
  {
    category: 'personal_context',
    subcategory: null,
    content: 'Based in Australia',
    summary: 'Primary location',
    confidence: 1.0,
    source_type: 'manual',
    source_chat_ids: [],
    source_project_ids: [],
    source_message_count: 0,
    time_period: 'current',
    relevance_score: 0.9,
  },
  {
    category: 'personal_context',
    subcategory: null,
    content: 'Primary focus on Australia and New Zealand SaaS founders and ecosystem',
    summary: 'Geographic market focus',
    confidence: 1.0,
    source_type: 'manual',
    source_chat_ids: [],
    source_project_ids: [],
    source_message_count: 0,
    time_period: 'current',
    relevance_score: 0.9,
  },
  {
    category: 'personal_context',
    subcategory: null,
    content: 'Website: https://www.sachee.com.au',
    summary: 'Professional website and online presence',
    confidence: 1.0,
    source_type: 'manual',
    source_chat_ids: [],
    source_project_ids: [],
    source_message_count: 0,
    time_period: 'current',
    relevance_score: 0.7,
  },

  // ========================================
  // OTHER INSTRUCTIONS (Communication & Preferences)
  // ========================================
  {
    category: 'other_instructions',
    subcategory: null,
    content: 'Prefers direct, clear, and grounded communication. Friendly but not fluffy.',
    summary: 'Core communication style',
    confidence: 1.0,
    source_type: 'manual',
    source_chat_ids: [],
    source_project_ids: [],
    source_message_count: 0,
    time_period: 'current',
    relevance_score: 1.0,
  },
  {
    category: 'other_instructions',
    subcategory: null,
    content: 'Uses "stupidly obvious + highly detailed" approach: simple core ideas with specific examples',
    summary: 'Content and explanation philosophy',
    confidence: 1.0,
    source_type: 'manual',
    source_chat_ids: [],
    source_project_ids: [],
    source_message_count: 0,
    time_period: 'current',
    relevance_score: 0.95,
  },
  {
    category: 'other_instructions',
    subcategory: null,
    content: 'Avoids corporate buzzwords, empty phrases, and generic "thought leadership"',
    summary: 'Anti-patterns in communication',
    confidence: 1.0,
    source_type: 'manual',
    source_chat_ids: [],
    source_project_ids: [],
    source_message_count: 0,
    time_period: 'current',
    relevance_score: 0.9,
  },
  {
    category: 'other_instructions',
    subcategory: null,
    content: 'Emphasizes "Speed is our weapon" - move faster than incumbents, shorten feedback loops',
    summary: 'Key operating principle #1',
    confidence: 1.0,
    source_type: 'manual',
    source_chat_ids: [],
    source_project_ids: [],
    source_message_count: 0,
    time_period: 'current',
    relevance_score: 0.9,
  },
  {
    category: 'other_instructions',
    subcategory: null,
    content: 'Believes in "Do things that don\'t scale" especially for first 10-30 customers',
    summary: 'Early-stage GTM philosophy',
    confidence: 1.0,
    source_type: 'manual',
    source_chat_ids: [],
    source_project_ids: [],
    source_message_count: 0,
    time_period: 'current',
    relevance_score: 0.9,
  },
  {
    category: 'other_instructions',
    subcategory: null,
    content: 'Uses specific examples, numbers, and stories over generic advice. Prefers tables, checklists, frameworks.',
    summary: 'Preferred content formats',
    confidence: 1.0,
    source_type: 'manual',
    source_chat_ids: [],
    source_project_ids: [],
    source_message_count: 0,
    time_period: 'current',
    relevance_score: 0.95,
  },
  {
    category: 'other_instructions',
    subcategory: null,
    content: '"Save the cheerleader, save the world" - focus on tight beachhead segments that unlock broader markets',
    summary: 'Beachhead strategy principle',
    confidence: 1.0,
    source_type: 'manual',
    source_chat_ids: [],
    source_project_ids: [],
    source_message_count: 0,
    time_period: 'current',
    relevance_score: 0.85,
  },
  {
    category: 'other_instructions',
    subcategory: null,
    content: 'Founder-led sales as a permanent capability, not a phase to "graduate out of"',
    summary: 'Core GTM philosophy on founder involvement',
    confidence: 1.0,
    source_type: 'manual',
    source_chat_ids: [],
    source_project_ids: [],
    source_message_count: 0,
    time_period: 'current',
    relevance_score: 0.9,
  },
];

async function backloadIdentity() {
  console.log('🚀 Starting Sachee identity backload...\n');

  // Prepare entries with user_id and content_hash
  const entries: MemoryEntry[] = SACHEE_MEMORIES.map(memory => ({
    ...memory,
    user_id: DEFAULT_USER_ID,
    content_hash: generateContentHash(memory.content),
  }));

  console.log(`📊 Prepared ${entries.length} memory entries across categories:`);

  const categoryCounts = entries.reduce((acc, entry) => {
    acc[entry.category] = (acc[entry.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  Object.entries(categoryCounts).forEach(([category, count]) => {
    console.log(`   - ${category}: ${count}`);
  });
  console.log('');

  // Check for existing memories to avoid duplicates
  const { data: existing, error: checkError } = await supabase
    .from('memory_entries')
    .select('content_hash')
    .eq('user_id', DEFAULT_USER_ID);

  if (checkError) {
    console.error('❌ Error checking existing memories:', checkError);
    process.exit(1);
  }

  const existingHashes = new Set(existing?.map(e => e.content_hash) || []);
  const newEntries = entries.filter(e => !existingHashes.has(e.content_hash));

  if (newEntries.length === 0) {
    console.log('✅ All memories already exist. Nothing to insert.');
    return;
  }

  console.log(`📝 Inserting ${newEntries.length} new memories (${entries.length - newEntries.length} already exist)...\n`);

  // Insert in batches of 10
  const BATCH_SIZE = 10;
  let inserted = 0;

  for (let i = 0; i < newEntries.length; i += BATCH_SIZE) {
    const batch = newEntries.slice(i, i + BATCH_SIZE);

    const { error } = await supabase
      .from('memory_entries')
      .insert(batch);

    if (error) {
      console.error(`❌ Error inserting batch ${i / BATCH_SIZE + 1}:`, error);
      process.exit(1);
    }

    inserted += batch.length;
    console.log(`   ✓ Inserted batch ${Math.floor(i / BATCH_SIZE) + 1} (${inserted}/${newEntries.length})`);
  }

  console.log('\n✅ Identity backload complete!');
  console.log(`\n📊 Summary:`);
  console.log(`   - Total entries: ${entries.length}`);
  console.log(`   - New entries inserted: ${newEntries.length}`);
  console.log(`   - Already existed: ${entries.length - newEntries.length}`);
  console.log(`\n🎯 Next steps:`);
  console.log(`   1. Visit http://localhost:3000/memory to view memories`);
  console.log(`   2. Start a new chat to test context injection`);
  console.log(`   3. Ask: "What's my background?" or "What do I do?"`);
}

// Run the backload
backloadIdentity().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
