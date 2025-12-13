# CRM Schema Audit - December 2025

> **Status**: PHASE 1 IMPLEMENTED - Phase 2/3 pending
> **Date**: 2025-12-13
> **Audited by**: Claude (multi-agent analysis)
> **Phase 1 Completed**: 2025-12-13 (migration `add_critical_engagement_fields`)

---

## Executive Summary

This audit analyzed **125+ data fields** from advisory master-docs, **10 deal folders**, **Twenty CRM's data model**, and our current Supabase schema to identify gaps and improvement opportunities.

### Key Findings

| Area | Status | Critical Gaps |
|------|--------|---------------|
| **Companies** | ⚠️ Gaps | Missing ARR, funding status, founded year |
| **Contacts** | 🔴 Critical | Email/phone **100% NULL** for all contacts |
| **Engagements** | ⚠️ Gaps | Missing traction metrics, GTM stage, assessment fields |
| **Meetings** | ✅ Good | Full transcripts, structured data working |
| **Activities** | ⚠️ Underutilized | Linking fields 0% populated |

---

## Part 1: Data Fields Captured in Advisory Master-Docs

### MyTab Master-Doc Analysis (125+ fields)

#### 1.1 Company Information Fields

| Field | Example Value | Structured? | In Current Schema? |
|-------|---------------|-------------|-------------------|
| Company Name | "MyTab Pty Ltd" | Yes | ✅ `companies.name` |
| Website | "https://mytabinfo.com" | Yes | ✅ `companies.website` |
| Location | "Yallingup, Western Australia" | Yes | ✅ `companies.address` (JSONB) |
| Founded Date | "2019-2020" | Yes | ❌ **MISSING** |
| Funding Status | "100% bootstrapped + WA Gov grants" | Yes | ❌ **MISSING** |
| IP/Trademarks | "Registered in AU, UK, USA, NZ" | Yes | ❌ **MISSING** |
| Awards | "Xero FY23, 40under40, BCCI Rising Star" | List | ❌ **MISSING** |
| Origin Story | "Idea conceived at Manly Wharf Bar" | Text | ❌ **MISSING** |

#### 1.2 Contact/Founder Fields

| Field | Example Value | Structured? | In Current Schema? |
|-------|---------------|-------------|-------------------|
| Founder Name | "Mikaela Greene" | Yes | ✅ `contacts.name` |
| Co-Founder | "Eliza Greene" | Yes | ✅ (separate contact) |
| Founder Age | "29" | Yes | ❌ **MISSING** |
| Background | "Former professional surfers" | Text | ❌ **MISSING** |
| LinkedIn URL | Profile URL | Yes | ✅ `contacts.linkedin_url` |
| Email | Contact email | Yes | ⚠️ EXISTS BUT **NULL** |
| Phone | Contact phone | Yes | ⚠️ EXISTS BUT **NULL** |
| References | "Luke Pearce (Peace Pizza)" | List | ❌ **MISSING** |

#### 1.3 Deal/Engagement Fields

| Field | Example Value | Structured? | In Current Schema? |
|-------|---------------|-------------|-------------------|
| Lead Source | "LinkedIn Inbound" | Enum | ❌ **MISSING** (on engagement) |
| First Contact Date | "2025-11-06" | Date | ❌ **MISSING** |
| Deal Stage | "Closed Lost" | Enum | ✅ `engagements.stage` |
| Closed Date | "2025-12-13" | Date | ❌ **MISSING** |
| Closed Reason | "Did not proceed - Sachee decision" | Text | ✅ `engagements.lost_reason` |
| Engagement Type | "Advisory (informal mentorship)" | Enum | ✅ `engagements.engagement_type` |
| Stage History | Timeline table | Table | ✅ `stage_history` table |
| Deliverables Promised | Checklist | List | ❌ **MISSING** |
| Next Steps | Task checklist | List | ❌ **MISSING** |
| Next Meeting | Date/time/purpose | Struct | ❌ **MISSING** |

#### 1.4 Product/Business Fields

| Field | Example Value | Structured? | In Current Schema? |
|-------|---------------|-------------|-------------------|
| Core Value Prop | "Sell more, market smarter..." | Text | ❌ **MISSING** |
| Product Description | "All-in-one SaaS: Digital Ordering..." | Text | ❌ **MISSING** |
| Key Differentiator | "Transforms anonymous takeaway..." | Text | ❌ **MISSING** |
| Product Maturity | "Strong (native iOS/Android, 5-star)" | Qual | ❌ **MISSING** |
| Revenue Streams | Transaction fees, Premium+, Ads | JSONB | ❌ **MISSING** |
| Market | "Australian Hospitality" | Text | ✅ `companies.industry` |
| Market Size | "$89.7B across 91,071 venues" | Text | ❌ **MISSING** |
| Competitors | "me&u, HungryHungry, LOKE, Bopple" | List | ❌ **MISSING** |
| Competitive Advantages | List of advantages | List | ❌ **MISSING** |

#### 1.5 Financial/Traction Fields

| Field | Example Value | Structured? | In Current Schema? |
|-------|---------------|-------------|-------------------|
| ARR Estimate | "~$24K" | Decimal | ❌ **MISSING** |
| MRR | "~$2K" | Decimal | ✅ `engagements.mrr` (JSONB) |
| App Downloads | "40,000+" | Integer | ❌ **MISSING** |
| Total Orders/GMV | "$2.6M+ processed" | Decimal | ❌ **MISSING** |
| Active Customers | "16 (down from 21)" | Integer | ❌ **MISSING** |
| Customer Churn | "Zero (closures were failures)" | Text | ❌ **MISSING** |
| FY Financial Loss | "-$3,495" | Decimal | ❌ **MISSING** |
| Premium Feature Adoption | "30% of venues" | Percent | ❌ **MISSING** |
| Fundraising Goal | "$1M+ growth capital" | Decimal | ❌ **MISSING** |
| Valuation | "$6M post-money ask" | Decimal | ❌ **MISSING** |

#### 1.6 Assessment/Risk Fields

| Field | Example Value | Structured? | In Current Schema? |
|-------|---------------|-------------|-------------------|
| Current GTM Stage | "Phase 1a (0-50K ARR)" | Enum | ❌ **MISSING** |
| Team Size | "6 (2 founders + 4 devs)" | Integer | ❌ **MISSING** |
| Team Composition | Breakdown by role | JSONB | ❌ **MISSING** |
| Sales Motion | "100% founder-led" | Text | ❌ **MISSING** |
| What's Working | List of strengths | List | ❌ **MISSING** |
| What's Broken (Tier 1) | Critical issues | List | ❌ **MISSING** |
| What's Broken (Tier 2) | Secondary issues | List | ❌ **MISSING** |
| Red Flags | Prioritized list | List | ❌ **MISSING** |
| Opportunities | Prioritized list | List | ❌ **MISSING** |
| Hypotheses to Test | Numbered list | List | ❌ **MISSING** |
| Fit Assessment | "STRONG FIT" / "UNCERTAIN" | Enum | ❌ **MISSING** |
| Coachability | "HIGH" / "MEDIUM" / "LOW" | Enum | ❌ **MISSING** |

---

## Part 2: Cross-Deal Analysis (10 Deals)

### Deals Analyzed

1. **MyTab** - Hospitality SaaS (Closed Lost)
2. **SwiftCheckin** - Construction workforce (Closed Won → Client)
3. **ArcheloLab** - Construction marketplace (Relationship Development)
4. **Talvin AI** - AI recruitment (Relationship Development)
5. **ControlShiftAI** - AI voice agents (Relationship Development)
6. **Tandm** - Architect-builder matching (New Opportunity)
7. **BlessPayments** - Migrant fintech (Deep Dive)
8. **Occubuy** - PropTech deposit helper (Deep Dive)
9. **OliByOlympusInsights** - EdTech AI tutor (New Opportunity)
10. **TradieScribe** - Tradie documentation (New Opportunity)

### Common Fields Across All Deals

| Field | Present In | Priority |
|-------|-----------|----------|
| `company` | 10/10 | Required |
| `website` | 10/10 | Required |
| `founder` | 10/10 | Required |
| `lead_source` | 10/10 | Required |
| `first_contact` | 10/10 | Required |
| `deal_stage` | 10/10 | Required |
| `engagement_type` | 10/10 | Required |
| `current_stage` (GTM) | 10/10 | Required |
| `arr_estimate` | 10/10 | Required |
| `team_size` | 10/10 | Required |
| `last_updated` | 10/10 | Required |

### Unique Fields by Deal

| Deal | Unique Fields |
|------|---------------|
| **SwiftCheckin** | `client_folder`, `monthly_burn`, `pilot_customers` |
| **ArcheloLab** | `booking` (calendar link), multiple phone numbers |
| **Talvin** | `strategic_advisor`, founder prior exits |
| **ControlShiftAI** | `fit_assessment`, `cal_com_submission` |
| **Occubuy** | `revenue_streams` breakdown, `partner_count`, `organic_signups` |
| **BlessPayments** | User demographics, retention cohorts |

---

## Part 3: Twenty CRM Data Model Analysis

### Key Design Patterns

#### 3.1 Composite Field Types

Twenty uses specialized composite types instead of multiple columns:

| Type | Structure | Benefit |
|------|-----------|---------|
| `ADDRESS` | `{street, city, postal, country, lat, lng}` | Single field, structured |
| `CURRENCY` | `{amountMicros, currencyCode}` | Type-safe money handling |
| `LINKS` | `{primaryUrl, label, secondaryLinks[]}` | Multi-URL support |
| `FULL_NAME` | `{firstName, lastName}` | Structured name handling |
| `EMAILS` | `{primaryEmail, additionalEmails[]}` | Multi-email support |
| `PHONES` | `{primaryPhone, additionalPhones[]}` | Multi-phone support |

**Recommendation**: We already use JSONB for some of these - ensure consistent structure.

#### 3.2 Standard Object Fields

**Company (11 fields)**:
- name, domainName, linkedinLink, xLink, employees
- annualRecurringRevenue (CURRENCY), address (ADDRESS)
- idealCustomerProfile (BOOLEAN), accountOwner (RELATION)
- searchVector, position

**Person (9 fields)**:
- name (FULL_NAME), emails (EMAILS), phones (PHONES)
- jobTitle, city, linkedinLink, xLink
- avatarUrl, searchVector

**Opportunity (7 fields)**:
- name, amount (CURRENCY), closeDate
- stage (SELECT: New/Screening/Meeting/Proposal/Customer)
- pointOfContact (RELATION), company (RELATION)
- searchVector

#### 3.3 Polymorphic Relations (MORPH_RELATION)

Twenty allows one field to reference multiple object types:

```
TaskTarget → Company | Person | Opportunity
NoteTarget → Company | Person | Opportunity | Meeting
TimelineActivity → Any Object
```

**Our equivalent**: `activity_note_targets` junction table (already implemented!)

#### 3.4 Timeline as Unified Audit Log

Twenty's `TimelineActivity` tracks ALL events:
- Emails sent/received
- Calendar events
- Tasks created/completed
- Notes added
- Deal stage changes
- Workflow executions

**Our equivalent**: `activities` table (exists but underutilized)

### Twenty's Weaknesses (User Feedback)

From [GitHub Issue #13953](https://github.com/twentyhq/twenty/issues/13953):

> "Twenty ships with minimal standard fields - users report 30-60 minutes of setup before they can start using the CRM"

**Missing from Twenty** (that users request):
- Industry, companyType, numberOfEmployees
- Department, dateOfBirth, source, tags
- ContactType (Lead/Customer/Partner)
- LeadStatus, leadScore, doNotCall

**Our opportunity**: Include comprehensive fields from day 1.

---

## Part 4: Current Schema Status

### Table Population Summary

| Table | Rows | Key Observations |
|-------|------|------------------|
| `companies` | 1 | 100% populated for core fields |
| `contacts` | 2 | **Email/phone 100% NULL** |
| `engagements` | 1 | Missing deal_value, probability=0 |
| `activities` | 17 | **linked_* fields 0% used** |
| `activity_threads` | 2 | Working correctly |
| `activity_messages` | 16 | Full body content stored |
| `activity_meetings` | 2 | Full transcripts (56K + 66K chars) |
| `activity_attendees` | 4 | **contact_id 100% NULL** |
| `activity_notes` | 3 | Linked to meetings |
| `activity_note_targets` | 3 | Working correctly |
| `stage_history` | 5 | Complete audit trail |

### Critical Data Gaps

1. **Contacts**: Email and phone fields exist but are **NULL for ALL contacts**
2. **Activities**: Linking fields (`linked_thread_id`, `linked_meeting_id`, etc.) are **0% populated**
3. **Attendees**: `contact_id` is **NULL for ALL attendees** - not linked to contacts
4. **Engagements**: Missing ARR, MRR, customer count, GTM stage

---

## Part 5: Recommended Schema Changes

### Phase 1: CRITICAL (Blocking basic functionality)

```sql
-- Migration: add_critical_engagement_fields

-- 1. Traction metrics
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS arr_estimate decimal;
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS mrr_current decimal;
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS active_customers integer;
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS app_downloads integer;
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS gmv decimal;

-- 2. GTM stage tracking
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS current_gtm_stage text
  CHECK (current_gtm_stage IN ('Phase 0', 'Phase 1a', 'Phase 1b', 'Phase 2', 'Phase 3'));

-- 3. Team metrics
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS team_size integer;
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS team_composition jsonb DEFAULT '{}';

-- 4. Assessment fields
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS fit_assessment text
  CHECK (fit_assessment IN ('strong_fit', 'good_fit', 'uncertain', 'not_a_fit'));
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS coachability text
  CHECK (coachability IN ('high', 'medium', 'low', 'unknown'));

-- 5. Lead source on engagement (not just company)
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS lead_source text;
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS first_contact_date date;
```

### Phase 2: HIGH PRIORITY (Improves advisory workflow)

```sql
-- Migration: add_financial_and_assessment_fields

-- 1. Burn rate tracking
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS burn_rate_monthly decimal;
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS burn_to_date decimal;
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS runway_months integer;

-- 2. Valuation tracking
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS valuation_cap decimal;
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS valuation_method text;
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS fundraising_goal decimal;

-- 3. Assessment arrays (JSONB)
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS red_flags jsonb DEFAULT '[]';
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS opportunities jsonb DEFAULT '[]';
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS hypotheses jsonb DEFAULT '[]';
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS whats_working jsonb DEFAULT '[]';
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS whats_broken jsonb DEFAULT '[]';

-- 4. Founder assessment
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS founder_market_fit text;
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS sales_motion text;

-- 5. Company enhancements
ALTER TABLE companies ADD COLUMN IF NOT EXISTS arr decimal;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS funding_raised decimal;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS funding_status text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS founded_year integer;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS account_owner_id uuid REFERENCES auth.users(id);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS ideal_customer_profile boolean DEFAULT false;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS awards jsonb DEFAULT '[]';
```

### Phase 3: MEDIUM PRIORITY (Contact enhancements)

```sql
-- Migration: enhance_contacts

-- 1. Contact classification
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS contact_type text
  CHECK (contact_type IN ('lead', 'prospect', 'customer', 'partner', 'investor', 'advisor'));
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS lead_source text;

-- 2. Additional profile fields
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS background text;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS x_link text;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS avatar_url text;

-- 3. Communication preferences
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS do_not_contact boolean DEFAULT false;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS preferred_channel text;

-- 4. References/testimonials
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS references jsonb DEFAULT '[]';
```

---

## Part 6: Data Migration Tasks

### Immediate Actions Required

#### 6.1 Populate Contact Emails/Phones

**Priority**: CRITICAL

Currently ALL contacts have NULL email/phone. Extract from:
- LinkedIn profiles (manual)
- Cal.com submissions (ControlShiftAI, ArcheloLab)
- Master-doc contact sections

#### 6.2 Backfill Engagement Metrics

**Priority**: CRITICAL

For MyTab engagement, populate:
```sql
UPDATE engagements SET
  arr_estimate = 24000,
  mrr_current = 2000,
  active_customers = 16,
  app_downloads = 40000,
  gmv = 2600000,
  current_gtm_stage = 'Phase 1a',
  team_size = 6,
  team_composition = '{"founders": 2, "backend": 1, "devops": 1, "ios": 1, "android": 1}',
  fit_assessment = 'uncertain',
  coachability = 'high',
  lead_source = 'linkedin_inbound',
  first_contact_date = '2025-11-06'
WHERE name ILIKE '%MyTab%';
```

#### 6.3 Wire Up Activity Linking

**Priority**: HIGH

Update activity creation to set:
- `linked_meeting_id` when activity_type = 'meeting'
- `linked_thread_id` when activity_type IN ('email', 'linkedin', 'message')
- `linked_note_id` when activity_type = 'note'

#### 6.4 Link Attendees to Contacts

**Priority**: HIGH

Match attendees by name to contacts table:
```sql
UPDATE activity_attendees a
SET contact_id = c.id
FROM contacts c
WHERE a.contact_id IS NULL
  AND LOWER(a.name) = LOWER(c.name);
```

---

## Part 7: Schema Comparison Summary

| Category | Current Fields | Needed (Master-docs) | Twenty CRM | Gap |
|----------|---------------|---------------------|------------|-----|
| **Company** | 12 | 20 | 11 | +8 fields |
| **Contact** | 14 | 22 | 9 | +8 fields |
| **Engagement** | 22 | 38 | 7 | +16 fields |
| **Meeting** | 28 | 28 | N/A | ✅ Complete |
| **Activity** | 22 | 22 | ~15 | ✅ Complete |

### What's Working Well

1. **Meetings table** - Comprehensive with transcripts, key_points, action_items, key_quotes, metrics_discussed
2. **Messages table** - Full body content, proper threading
3. **Notes system** - Polymorphic targets working
4. **Stage history** - Complete audit trail
5. **Search vectors** - GIN indexes on all tables

### Critical Gaps

1. **Contact communication data** - Email/phone NULL
2. **Traction metrics** - ARR, customers, GMV not captured
3. **Assessment fields** - Fit, coachability, red flags not captured
4. **Activity linking** - Pointer architecture not utilized
5. **GTM stage** - Not tracked on engagements

---

## Appendix A: Twenty CRM Field Types Reference

| Type | PostgreSQL Equivalent | Our Implementation |
|------|----------------------|-------------------|
| `UUID` | `uuid` | ✅ Same |
| `TEXT` | `text` | ✅ Same |
| `NUMBER` | `integer` | ✅ Same |
| `NUMERIC` | `decimal` | ✅ Same |
| `BOOLEAN` | `boolean` | ✅ Same |
| `DATE_TIME` | `timestamptz` | ✅ Same |
| `DATE` | `date` | ✅ Same |
| `SELECT` | `text` + CHECK | ✅ Same |
| `MULTI_SELECT` | `text[]` | ✅ Same (tags) |
| `CURRENCY` | JSONB `{amount, code}` | ✅ Same (deal_value, mrr) |
| `ADDRESS` | JSONB `{street, city...}` | ✅ Same (companies.address) |
| `LINKS` | JSONB `{url, label}` | ⚠️ Not used |
| `FULL_NAME` | JSONB `{first, last}` | ✅ Same (name_structured) |
| `EMAILS` | JSONB `{primary, additional[]}` | ✅ Same (contacts.emails) |
| `PHONES` | JSONB `{primary, additional[]}` | ✅ Same (contacts.phones) |
| `RICH_TEXT_V2` | `text` (markdown) | ✅ Same |
| `RAW_JSON` | `jsonb` | ✅ Same |
| `TS_VECTOR` | `tsvector` | ✅ Same |
| `RELATION` | FK + index | ✅ Same |
| `MORPH_RELATION` | Junction table | ✅ Same (note_targets) |

---

## Appendix B: Migration Priority Matrix

| Change | Effort | Impact | Priority |
|--------|--------|--------|----------|
| Add ARR/MRR to engagements | Low | High | P0 |
| Add GTM stage to engagements | Low | High | P0 |
| Add assessment fields | Low | High | P0 |
| Populate contact emails | Medium | Critical | P0 |
| Add team metrics | Low | Medium | P1 |
| Add burn rate tracking | Low | Medium | P1 |
| Add valuation fields | Low | Medium | P1 |
| Wire up activity linking | Medium | High | P1 |
| Link attendees to contacts | Low | Medium | P1 |
| Add company financials | Low | Medium | P2 |
| Add contact background | Low | Low | P2 |
| Add awards tracking | Low | Low | P3 |

---

## Next Steps

1. [x] Review this audit with stakeholder
2. [x] Prioritize which Phase 1 changes to implement first
3. [x] Create migration scripts (`add_critical_engagement_fields`)
4. [ ] Update migration SOP with new fields
5. [x] Backfill existing data from master-docs (MyTab complete)
6. [ ] Update UI to display new fields
7. [ ] Phase 2 migration (financial and assessment fields)
8. [ ] Phase 3 migration (contact enhancements)
9. [ ] Populate contact emails (requires manual entry from email client)

---

*Document generated: 2025-12-13*
*Sources: MyTab master-doc, 10 deal folders, Twenty CRM GitHub, Supabase schema*
