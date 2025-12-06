# Seeding Strategy: Deal/Client Context

**Version:** 1.0
**Created:** 2025-12-06
**Purpose:** Strategy for seeding Bobo's memory with deal/client context from file system

---

## Overview

Before building new features, we seed Bobo with existing deal/client knowledge from the file system. This validates the memory retrieval system works and enables immediate dogfooding.

---

## Source Files

### Deal Master Docs
Location: `/Users/sacheeperera/VibeCoding Projects/Blog Migration/Deals/[Company]/master-doc-[company].md`

| Deal | Stage | ARR | Priority |
|------|-------|-----|----------|
| **MyTab** | Relationship Development | $24K | HIGH - active mentorship |
| **SwiftCheckin** | Alumni (Sounding Board) | $2.7K | MEDIUM - recent activity |
| **ArcheloLab** | Relationship Development | Pre-revenue | MEDIUM - monthly calls |
| **ControlShiftAI** | Relationship Development | Pre-revenue | LOW - awaiting response |
| **Talvin** | Relationship Development | $12K | HIGH - strong fit |
| **Tandm** | New Opportunity | TBD | LOW - early stage |

### Client Profiles
Location: `/Users/sacheeperera/VibeCoding Projects/Blog Migration/Clients/[Company]/client-profile.md`

| Client | Status | Health |
|--------|--------|--------|
| **SwiftCheckin** | Alumni | Yellow |

---

## Extraction Patterns

### From YAML Frontmatter
```yaml
company: "MyTab"
deal_stage: "Relationship Development"
arr_estimate: "$24K"
current_stage: "Phase 1a"
founder: "Mikaela Greene"
```

**Extract to `work_context`:**
- Company summary (name, stage, ARR, founder)
- Current engagement type
- Key metrics

### From Section 2.8: TLDR
Contains 5-6 bullet summary of deep research.

**Extract to `work_context`:**
- Core business model
- Key differentiators
- Critical challenges

### From Section 3: GTM Assessment
Contains current state, what's working, what's broken.

**Extract to `top_of_mind`:**
- Critical blockers (Tier 1 items)
- Recommended next actions

### From Section 4: Meeting Notes
Most recent meeting summaries.

**Extract to `brief_history`:**
- Last touchpoint date and summary
- Key action items
- Outcomes/decisions

### From Section 6: My Notes & Observations
Red flags, opportunities, personal notes.

**Extract to `top_of_mind`:**
- Active red flags
- Key opportunities
- Pattern recognition insights

### From Section 8: Valuation (if present)
Current valuation range, investment status.

**Extract to `work_context`:**
- Valuation range
- Investment/VC intro readiness

---

## Memory Category Mapping

| Source Section | Category | Confidence | Example |
|----------------|----------|------------|---------|
| YAML + Section 1 | `work_context` | 1.0 | "MyTab ($24K ARR) is a hospitality ordering platform founded by Mikaela Greene" |
| Section 2.8 TLDR | `work_context` | 0.9 | "MyTab's bottleneck is lead generation, not product or conversion" |
| Section 3 (Tier 1 blockers) | `top_of_mind` | 0.9 | "MyTab RED FLAG: Valuation mismatch - $24K ARR but asking $1M at $6M post" |
| Section 4 (recent) | `brief_history` | 0.9 | "Dec 2: Pitch practice session with Mikaela. Identified valuation mismatch." |
| Section 6 (red flags) | `top_of_mind` | 0.85 | "MyTab: Geographic concentration risk (WA only)" |
| Section 6 (opportunities) | `work_context` | 0.8 | "MyTab opportunity: Venue referral program is low-hanging fruit" |
| Methodology/Frameworks | `long_term_background` | 1.0 | "SPICED framework: Situation, Pain, Impact, Critical Event, Decision" |
| Preferences | `other_instructions` | 1.0 | "When briefing on deals, always include red flags and pending actions" |

---

## Seeding Script Design

### Phase 1: Manual Seeding (NOW)
Since bulk API doesn't exist, seed via:
1. Direct SQL INSERT into `memory_entries`
2. REST API POST to `/api/memory/entries`

**Required fields per memory:**
```typescript
{
  category: 'work_context' | 'top_of_mind' | 'brief_history' | 'long_term_background' | 'other_instructions',
  content: string,           // The fact to remember
  confidence: number,        // 0.5-1.0 (1.0 = explicitly stated)
  source_type: 'manual',     // Indicates seeded by user
  // Embedding generated automatically by API
}
```

### Phase 2: Bulk API (NEXT)
Create `/api/memory/bulk` endpoint:
- Accept array of memories
- Generate embeddings in batch
- Deduplication check (0.85 similarity threshold)
- Support backdating (created_at, last_accessed)

### Phase 3: Automated Sync (LATER)
File watcher or scheduled job:
- Detect changes to master docs
- Extract updated facts
- Sync to memory_entries
- Handle deletions (soft delete stale memories)

---

## Memories to Seed (Initial Batch)

### Work Context: Deal Summaries (~6 memories)

| Deal | Content |
|------|---------|
| MyTab | "MyTab ($24K ARR, Phase 1a) is a hospitality ordering SaaS founded by Mikaela Greene. Based in Yallingup, WA. 40K downloads, 16 venues. Product-market fit proven but struggling with lead generation. Deal stage: Relationship Development." |
| SwiftCheckin | "SwiftCheckin ($2.7K ARR) is a construction tech platform for timesheet tracking. Founded by Boney Mylady (India-based, selling to Australian tradies). 1 paying customer (Mr Shingles), 1 trial pending (Ariel, 28 users). Client status: Alumni with sounding board through Jan 2026." |
| ArcheloLab | "ArcheloLab is a pre-revenue construction marketplace for Sri Lankan diaspora. Founded by Ain Haran (Sri Lanka). Matching diaspora with architects for home builds. Recently simplified platform after burning $20K. Monthly advisory cadence established." |
| ControlShiftAI | "ControlShiftAI is a pre-revenue AI voice agent platform for SMBs. Founded by Krishna Kishore Durgasi (DevOps background). 2 pilot customers, 12-person team (mostly dev). Sent positioning worksheet Dec 1, awaiting response. Founder-market fit concern for trades vertical." |
| Talvin | "Talvin AI ($12K ARR) is a voice AI recruitment platform. Founded by Newan Vinthusa (age 24, spun out from Code94 Labs). 3 enterprise customers (Mindvalley, Sampath Bank, JXG). APAC focus. Raising $1M pre-seed at $10M valuation. Strong fit for enterprise sales advisory." |
| Tandm | "Tandm is an architect-builder matching platform (early stage). Founded by Peter Glodic. 8 weeks post-pivot. Has sales leader, case studies, bundles. Challenge: slow adoption in archaic industry. Deal stage: New Opportunity." |

### Top of Mind: Red Flags (~6 memories)

| Entity | Red Flag |
|--------|----------|
| MyTab | "MyTab RED FLAG: Valuation mismatch. $24K ARR x 10x = $240K valuation, but asking $1M at $6M post-money. Math doesn't work with founder's 80% ownership goal." |
| MyTab | "MyTab RED FLAG: Geographic concentration. All traction is WA-only. Unproven in competitive urban markets (Sydney, Melbourne). me&u has $100M+ funding, 6K venues." |
| MyTab | "MyTab RED FLAG: No CRM or sales process. Ad-hoc founder-led sales won't scale. Tracking via Google spreadsheet." |
| SwiftCheckin | "SwiftCheckin RED FLAG: Severe founder-market fit gap. Tech founders in India with accents selling to Australian tradies. Neither has sales experience." |
| ControlShiftAI | "ControlShiftAI RED FLAG: No founder-market fit for trades vertical. Krishna is DevOps/cloud expert with no trades industry background. 5+ Australian bootstrapped competitors already targeting trades." |
| ArcheloLab | "ArcheloLab RED FLAG: Founder overwhelm. Ain taking on dev + marketing + PM simultaneously after letting entire team go. $20K spent 'almost in vain'." |

### Brief History: Recent Activity (~4 memories)

| Entity | Activity |
|--------|----------|
| MyTab | "Dec 2, 2025: Pitch practice session with Mikaela (~63 min). Full deck review with app demo. Identified valuation mismatch. Recommended WA-first strategy. Purpose Ventures pitch on Dec 5." |
| SwiftCheckin | "Nov 26, 2025: Ariel fully converted (28 users). PSF validated. Sales strategy review with Nisha. Next: Send Ariel contract, get referrals." |
| Talvin | "Nov 19, 2025: Published LinkedIn post about Talvin (6,459 impressions). Blog post 'From 135 Clients to 3' on sachee.com.au. Offered enterprise sales advisory." |
| ControlShiftAI | "Dec 1, 2025: Sent positioning worksheet + explained equity advisory model. Ball in Krishna's court. Awaiting response before final fit decision." |

### Long-term Background: Methodology (~3 memories)

| Topic | Content |
|-------|---------|
| SPICED | "SPICED sales framework: Situation (current state), Pain (problems), Impact (consequences), Critical Event (why now), Decision (process/criteria). Use for discovery calls and deal qualification." |
| Valuation | "Sachee's valuation framework v2.2: Phase 1a ($0-50K ARR) uses Berkus + Scorecard methods with AU Market Calibration. Reality-adjusted range typically 50-60% of raw output. Key modifiers: Founder Engine Score, GTM Readiness, Market-Fit Penalty." |
| Save the Cheerleader | "'Save the Cheerleader' principle: Focus on one vertical/market before expanding. Prove dominance in beachhead market, then expand. Example: Rosie hit $1M ARR in 8 months by focusing only on home services." |

### Other Instructions: Preferences (~2 memories)

| Instruction | Content |
|-------------|---------|
| Briefing format | "When briefing on deals, always include: 1) Current stage and context, 2) Red flags, 3) Pending action items, 4) Recent activity, 5) Recommended next steps." |
| Red flag priority | "Surface red flags proactively. Don't wait for explicit ask. If a deal has concerning signals, mention them even in general briefings." |

---

## Deduplication Strategy

### Similarity Threshold
- **0.85+ similarity**: Consider duplicate, don't create
- **0.70-0.84 similarity**: Potential update, flag for review
- **< 0.70 similarity**: Treat as new memory

### Content Hash
Generate SHA-256 hash of normalized content (lowercase, trimmed) for exact-match detection.

### Update vs Create Logic
```
If existing memory with 0.85+ similarity:
  → Return existing memory, don't create duplicate
  → Log as "duplicate detected"

If existing memory with 0.70-0.84 similarity:
  → Log for potential consolidation
  → Create new memory (may need manual merge later)

If no similar memory found:
  → Create new memory with embedding
```

---

## Validation Tests

After seeding, run these queries to validate retrieval:

| Test | Query | Expected Result |
|------|-------|-----------------|
| Entity recall | "Tell me about MyTab" | Returns MyTab summary with ARR, founder, stage |
| Red flag query | "What deals have red flags?" | Returns multiple red flag memories |
| Recent activity | "What happened recently with SwiftCheckin?" | Returns Nov 26 activity |
| Cross-entity | "Which deals are in Relationship Development?" | Returns MyTab, ArcheloLab, ControlShiftAI, Talvin |
| Monday briefing | "Brief me on my deals" | Returns prioritized list with context |
| Methodology recall | "What is SPICED?" | Returns SPICED framework definition |

---

## Maintenance Cadence

### Weekly (During Dogfooding)
- [ ] Update `brief_history` after significant meetings
- [ ] Add new red flags as discovered
- [ ] Archive resolved items

### Monthly
- [ ] Reconcile memories with file system (detect drift)
- [ ] Consolidate duplicate or overlapping memories
- [ ] Update deal stage transitions

### Quarterly
- [ ] Full audit of seeded content vs source files
- [ ] Clean up stale memories (soft delete)
- [ ] Refine extraction patterns based on usage

---

## Implementation Checklist

### NOW (This Session)
- [x] Document seeding strategy (this file)
- [ ] Clear test data from database
- [ ] Seed ~21 memories via REST API or SQL
- [ ] Run 6 validation tests
- [ ] Start daily dogfooding workflow

### NEXT (Week 2-3)
- [ ] Create bulk seeding API (`/api/memory/bulk`)
- [ ] Implement `enhanced_memory_search` with temporal weighting
- [ ] Automate extraction from master doc sections

### LATER (Week 4+)
- [ ] File watcher for automatic sync
- [ ] Bidirectional sync (memory changes back to files)
- [ ] Full MCP integration for file operations
