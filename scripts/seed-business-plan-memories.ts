/**
 * Seed Memory Entries from Business Plan
 * Run: npx tsx scripts/seed-business-plan-memories.ts
 */

const BULK_API_URL = 'http://localhost:3000/api/memory/bulk';

// Memory entries extracted from SACHEE_ADVISORY_BUSINESS_PLAN.md
const memories = [
  // ==========================================
  // Professional Identity (long_term_background)
  // ==========================================
  {
    category: 'long_term_background' as const,
    content: "Sachee is a full-stack operator who builds complete commercial engines and teams from scratch. At CorePlan, he built Sales, Marketing, CS, and RevOps functions, hired teams, and created the operating rhythm.",
    confidence: 0.95,
    importance: 0.9,
    source_type: 'manual' as const,
  },
  {
    category: 'long_term_background' as const,
    content: "Core career pattern: 'first boots on ground' experiences at CorePlan (pre-PMF to scale), Sidekicker WA (first hire as GM), UberEATS Perth (launch team), and Accor Plus (P&L turnaround). Repeatedly builds GTM engines and teams simultaneously.",
    confidence: 0.95,
    importance: 0.9,
    source_type: 'manual' as const,
  },
  {
    category: 'long_term_background' as const,
    content: "Mechanical Engineer by training (scored 100% in C/C# at university). Technical translator between engineering and commercial teams. Still actively builds personal tools using Cursor, Vercel, and Supabase.",
    confidence: 0.95,
    importance: 0.85,
    source_type: 'manual' as const,
  },
  {
    category: 'long_term_background' as const,
    content: "Deep expertise in hard industries: mining, heavy industry, and construction. Sells to people in 'steel-capped boots', not VPs in San Francisco. Differentiates from typical GTM strategists focused on SaaS.",
    confidence: 0.95,
    importance: 0.8,
    source_type: 'manual' as const,
  },
  {
    category: 'long_term_background' as const,
    content: "Practices radical transparency and anti-guru positioning, documenting the real costs of building including burnout, career challenges, and early adopter realities. Values authentic narrative over polished mythology.",
    confidence: 0.9,
    importance: 0.75,
    source_type: 'manual' as const,
  },

  // ==========================================
  // Business Model (work_context)
  // ==========================================
  {
    category: 'work_context' as const,
    content: "ARR-based pricing: startups under $200K ARR get equity-only terms (2-12%) with aligned incentives. Startups over $200K ARR pay cash fees ($3-5K+/month) at market rate. Post-milestone engagements transition to cash retainers.",
    confidence: 0.95,
    importance: 0.85,
    source_type: 'manual' as const,
  },
  {
    category: 'work_context' as const,
    content: "Operator Capital model for early startups: Active Advisors receive 2-4% equity for 2-4 hrs/week; Fractional Co-Founder Sprints offer 6-12% equity for 1.5-2 days/week. Monthly vesting with performance acceleration at $1M ARR or $1.5M+ raise.",
    confidence: 0.95,
    importance: 0.82,
    source_type: 'manual' as const,
  },
  {
    category: 'work_context' as const,
    content: "Year 1 revenue target is $80K AUD cash from: 2-3 diagnostics ($10-24K), 1-2 advisory retainers with >$200K ARR clients ($36-60K), and 1-2 strategic projects ($10-30K). Equity deals represent deferred value.",
    confidence: 0.9,
    importance: 0.78,
    source_type: 'manual' as const,
  },
  {
    category: 'work_context' as const,
    content: "Capacity constrained to maximum 3-4 concurrent engagements: 2-3 Active Advisor relationships plus 1 Fractional Co-Founder engagement. Requires selective client acquisition.",
    confidence: 0.9,
    importance: 0.8,
    source_type: 'manual' as const,
  },

  // ==========================================
  // Target Market (work_context)
  // ==========================================
  {
    category: 'work_context' as const,
    content: "ICP: Phase 2 B2B SaaS founders (200K-1M ARR) in vertical/complex markets like mining, heavy industry, construction. High-ACV products with 3-12 month sales cycles and multi-stakeholder buying groups.",
    confidence: 0.95,
    importance: 0.82,
    source_type: 'manual' as const,
  },
  {
    category: 'work_context' as const,
    content: "ECP: Phase 1a/1b founders (<$200K ARR) experiencing stalled growth or random wins, willing to offer 2-12% equity for hands-on GTM partnership and founder coaching.",
    confidence: 0.95,
    importance: 0.8,
    source_type: 'manual' as const,
  },
  {
    category: 'work_context' as const,
    content: "Client must-haves: revenue ambition (not lifestyle business), coachability and willingness to do the work, founder available for regular 1:1 sessions. Not a fit: B2C consumer products or 'just need leads' requests.",
    confidence: 0.9,
    importance: 0.78,
    source_type: 'manual' as const,
  },
  {
    category: 'work_context' as const,
    content: "Phase model defines GTM progression: Phase 1a (0-50K ARR) proves willingness to pay; Phase 1b (50-200K) makes GTM repeatable; Phase 2 (200K-1M) transitions founder-led to team-supported; Phase 3 (1M-10M) scales without breaking.",
    confidence: 0.9,
    importance: 0.75,
    source_type: 'manual' as const,
  },

  // ==========================================
  // Operating Principles (other_instructions)
  // ==========================================
  {
    category: 'other_instructions' as const,
    content: "'Speed is our weapon': Move fast on opportunities. Respond within 24 hours and schedule calls within the same week to demonstrate commitment and stay ahead of competitors.",
    confidence: 0.95,
    importance: 0.85,
    source_type: 'manual' as const,
  },
  {
    category: 'other_instructions' as const,
    content: "'Do things that don't scale': For first 10 clients, forget automation. Prioritize personal touch and deep attention. Custom solutions build loyalty and credibility.",
    confidence: 0.95,
    importance: 0.88,
    source_type: 'manual' as const,
  },
  {
    category: 'other_instructions' as const,
    content: "'Save the cheerleader, save the world': Focus exclusively on a tight beachhead market segment—vertical SaaS founders in AU/NZ—to build deep expertise and become category leader.",
    confidence: 0.95,
    importance: 0.87,
    source_type: 'manual' as const,
  },
  {
    category: 'other_instructions' as const,
    content: "'Always solve for the customer': When facing decision ambiguity, ask 'What's best for this founder?' to align business incentives with genuine customer value.",
    confidence: 0.95,
    importance: 0.86,
    source_type: 'manual' as const,
  },
  {
    category: 'other_instructions' as const,
    content: "'People buy from people, not logos': Build personal presence and founder-led content as primary marketing channel. Human connection resonates more than corporate branding.",
    confidence: 0.9,
    importance: 0.84,
    source_type: 'manual' as const,
  },

  // ==========================================
  // Service Offerings (work_context)
  // ==========================================
  {
    category: 'work_context' as const,
    content: "GTM Health Check is a free 30-minute rapid assessment that identifies revenue bottlenecks for founders. Entry-point service that provides quick insights without commitment.",
    confidence: 0.9,
    importance: 0.75,
    source_type: 'manual' as const,
  },
  {
    category: 'work_context' as const,
    content: "GTM Diagnostic ($5-8K AUD, ~2 weeks) is a deep-dive audit using the GTM Strategy Workbook. Comprehensive analysis of GTM strategy, positioning, sales process, and metrics.",
    confidence: 0.9,
    importance: 0.78,
    source_type: 'manual' as const,
  },
  {
    category: 'work_context' as const,
    content: "Active Advisor engagement for sub-$200K ARR startups: 2-4% equity for 2-4 hrs/week. Includes GTM strategy, first hire support (bar raiser), and ICP definition.",
    confidence: 0.9,
    importance: 0.76,
    source_type: 'manual' as const,
  },
  {
    category: 'work_context' as const,
    content: "Cash model for >$200K ARR: GTM Advisory ($3-5K/month) with weekly calls + Slack support; GTM Copilot (custom) for fractional leadership; Strategic Projects ($5-15K) for positioning sprints; Team Scaling Sprint ($8-15K) for first GTM hire.",
    confidence: 0.9,
    importance: 0.77,
    source_type: 'manual' as const,
  },

  // ==========================================
  // Marketing Strategy (work_context)
  // ==========================================
  {
    category: 'work_context' as const,
    content: "Primary message: 'I help founders build the commercial engine AND hire the first person to run it—so you're not stuck doing everything forever.' Addresses founder pain of doing everything themselves.",
    confidence: 0.9,
    importance: 0.78,
    source_type: 'manual' as const,
  },
  {
    category: 'work_context' as const,
    content: "Four content pillars: GTM Strategy & Execution (40%), People & Team Scaling (30%), Founder Operator Stories (20%), Frameworks & Tools (10%). Emphasizes practical execution over theory.",
    confidence: 0.9,
    importance: 0.77,
    source_type: 'manual' as const,
  },
  {
    category: 'work_context' as const,
    content: "Channel strategy: LinkedIn 60% (weekly posts, 5K follower goal), Referrals 25% (CorePlan network, investors for 50%+ leads), Events 15% (West Tech Fest, speaking opportunities).",
    confidence: 0.9,
    importance: 0.76,
    source_type: 'manual' as const,
  },
  {
    category: 'work_context' as const,
    content: "'Open Notebook' content philosophy: Share real frameworks (not gated), show work publicly (diagnostics, lessons learned), use 'stupidly obvious + highly detailed' approach, admit what's hard (anti-guru positioning).",
    confidence: 0.9,
    importance: 0.75,
    source_type: 'manual' as const,
  },
];

async function seedMemories() {
  console.log(`\n🧠 Seeding ${memories.length} memory entries from business plan...\n`);

  try {
    const response = await fetch(BULK_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        memories,
        skip_duplicates: true,
        similarity_threshold: 0.85,
      }),
    });

    const result = await response.json();

    if (result.success || response.status === 207) {
      console.log('✅ Bulk creation completed!\n');
      console.log('📊 Summary:');
      console.log(`   Total: ${result.summary.total}`);
      console.log(`   Created: ${result.summary.created}`);
      console.log(`   Skipped (duplicates): ${result.summary.skipped}`);
      console.log(`   Errors: ${result.summary.errors}`);

      if (result.created.length > 0) {
        console.log('\n📝 Created memories:');
        result.created.forEach((m: { id: string; content: string }) => {
          console.log(`   • ${m.content}`);
        });
      }

      if (result.skipped.length > 0) {
        console.log('\n⏭️ Skipped (similar exists):');
        result.skipped.forEach((m: { content: string; reason: string }) => {
          console.log(`   • ${m.content} - ${m.reason}`);
        });
      }

      if (result.errors.length > 0) {
        console.log('\n❌ Errors:');
        result.errors.forEach((m: { content: string; error: string }) => {
          console.log(`   • ${m.content} - ${m.error}`);
        });
      }
    } else {
      console.error('❌ Bulk creation failed:', result);
    }
  } catch (error) {
    console.error('❌ Error calling bulk API:', error);
  }
}

seedMemories();
