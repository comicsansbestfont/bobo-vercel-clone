# CRM Terminology Guide

This document defines the standard terminology for the CRM system following the unified company model migration (Dec 2025).

---

## Core Terminology Changes

### Entity Model

| Old Term | New Term | Reason |
|----------|----------|--------|
| `engagements` (table) | `companies` (unified) | Single entity with `account_stage` - no separate engagements table |
| `engagement_type` | `account_stage` | Clearer semantics: what stage is this account at? |
| `stage` (in engagements) | `sub_stage` | More granular stage within the account_stage |
| "Deal" (as entity type) | "Account" or "Company" | The company IS the deal - `account_stage` tracks status |

### Navigation & UI Labels

| Old Label | New Label | Context |
|-----------|-----------|---------|
| "Deals" (sidebar) | "Engagements" | Sidebar navigation item |
| "← Deals" (back button) | "← Engagements" | Back navigation from detail page |
| "Mark Won" (button) | "Convert to Client" | Action to move deal → client |
| "Mark Lost" (button) | "Close as Lost" | Action to mark as closed lost |
| "Deal Workspace" | "Account Workspace" | Page title (optional change) |
| "Deal Summary" | "Account Summary" | Section header |

### Stage Terminology

The `account_stage` field uses these values:

| account_stage | UI Display | Description |
|---------------|------------|-------------|
| `lead` | "Lead" | Early-stage opportunity being qualified |
| `deal` | "Deal" | Active opportunity with commercial intent |
| `client` | "Client" | Converted customer with active engagement |

### Sub-Stages by Account Stage

| account_stage | Valid sub_stages | UI Display Format |
|---------------|------------------|-------------------|
| **lead** | `new_opportunity`, `triage`, `deep_dive`, `closed_lost` | "New Opportunity", "Triage", "Deep Dive", "Closed Lost" |
| **deal** | `relationship_dev`, `proposal_presented`, `contract_sent`, `finalising_terms`, `closed_lost` | "Relationship Dev", "Proposal Presented", "Contract Sent", "Finalising Terms", "Closed Lost" |
| **client** | `active`, `on_hold`, `completed` | "Active", "On Hold", "Completed" |

---

## UI Component Naming

### Variable/Interface Names

```typescript
// OLD (deprecated)
interface EngagementData { ... }
const [engagement, setEngagement] = useState<EngagementData | null>(null);

// NEW (preferred)
interface CompanyData { ... }
const [company, setCompany] = useState<CompanyData | null>(null);

// OR for backward compatibility during transition
interface AccountData { ... }
const [account, setAccount] = useState<AccountData | null>(null);
```

### API Response Mapping

During transition, the API can maintain backward compatibility:

```typescript
// API returns company data but maps to 'engagement' key for UI compatibility
const response = {
  engagement: companyData,  // For backward-compat with existing UI
  company: companyData,     // New canonical key
  contacts: [...],
  // ...
};
```

### Stage Color Functions

```typescript
// Function should handle both old and new sub_stage values
const getStageColor = (subStage: string): string => {
  // Format for display
  const formatted = formatSubStage(subStage);
  // ... color mapping
};

// Format snake_case to Title Case
const formatSubStage = (stage: string): string => {
  return stage
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
};
```

---

## Button & Action Labels

### Primary Actions

| Action | Button Label | Tooltip/Description |
|--------|--------------|---------------------|
| Move deal to client | "Convert to Client" | Converts this account to client status |
| Mark as lost | "Close as Lost" | Marks this opportunity as lost (no longer pursuing) |
| Reopen lost deal | "Reopen" | Reopens a closed lost opportunity |
| Edit stage | "Change Stage" | Change the current stage |

### Stage Progression Buttons

For deals in active stages:

```typescript
// Show stage-appropriate action buttons
{account.account_stage === 'deal' && account.sub_stage !== 'closed_lost' && (
  <>
    <Button variant="outline">Change Stage</Button>
    <Button variant="default" className="bg-green-600">Convert to Client</Button>
    <Button variant="ghost" className="text-red-600">Close as Lost</Button>
  </>
)}
```

---

## Sidebar Navigation Structure

```
Engagements        ← Changed from "Deals"
├── All            ← Shows all account_stage types
├── Leads          ← Filter: account_stage = 'lead'
├── Active Deals   ← Filter: account_stage = 'deal' AND sub_stage != 'closed_lost'
├── Clients        ← Filter: account_stage = 'client'
└── Closed         ← Filter: sub_stage = 'closed_lost' OR sub_stage = 'completed'
```

---

## Database Field Mapping

### companies Table (Unified)

| Field | Purpose | Example Values |
|-------|---------|----------------|
| `account_stage` | Primary lifecycle stage | `lead`, `deal`, `client` |
| `sub_stage` | Specific stage within lifecycle | `proposal_presented`, `contract_sent` |
| `stage_changed_at` | When stage last changed | `2025-12-11T14:39:00Z` |
| `engagement_type` | Legacy field (deprecated) | Mapped from `account_stage` |
| `engagement_description` | Account context/notes | Free text |

### stage_history Table

| Field | Purpose |
|-------|---------|
| `company_id` | Links to companies (not engagement_id) |
| `from_stage` | Previous account_stage |
| `to_stage` | New account_stage |
| `from_sub_stage` | Previous sub_stage |
| `to_sub_stage` | New sub_stage |
| `changed_at` | Timestamp |
| `notes` | Reason for change |

---

## Migration Checklist

### Code Changes Required

- [ ] Rename sidebar "Deals" → "Engagements"
- [ ] Rename back button "← Deals" → "← Engagements"
- [ ] Rename "Mark Won" button → "Convert to Client"
- [ ] Update `EngagementData` interface → `CompanyData` (or `AccountData`)
- [ ] Update state variables `engagement` → `company`
- [ ] Add `formatSubStage()` function for badge display
- [ ] Update stage badge to use formatted sub_stage
- [ ] Update "Deal Summary" section header → "Account Summary" (optional)

### API Changes Required

- [ ] Add `company` key to API response (alongside `engagement` for compat)
- [ ] Update queries to use `companies.account_stage` and `companies.sub_stage`
- [ ] Remove `engagement_id` foreign keys from activity tables

### Database Changes (Already Applied)

- [x] Add `account_stage` column to companies
- [x] Add `sub_stage` column to companies
- [x] Add `stage_at_time` and `sub_stage_at_time` to activity tables
- [x] Add `company_id` to stage_history
- [x] Create sub_stage validation trigger

---

## Examples

### MyTab (Reference Implementation)

```typescript
// MyTab company data
{
  id: 'uuid...',
  name: 'MyTab',
  account_stage: 'deal',
  sub_stage: 'closed_lost',
  close_date: '2025-12-11',
  lost_reason: 'Declined to support raise - heavy reliance on paid media GTM strategy',
  // ...
}
```

### UI Display Logic

```typescript
// Stage badge display
const stageBadge = formatSubStage(company.sub_stage);
// Result: "Closed Lost"

// Show convert button only for active deals
const showConvertButton =
  company.account_stage === 'deal' &&
  company.sub_stage !== 'closed_lost';

// Navigation label
const backButtonLabel = "← Engagements";
```

---

## Rationale

### Why "Engagements" instead of "Deals"?

1. **Inclusive**: Covers leads, deals, AND clients - not just deals
2. **Accurate**: Represents ongoing business relationships at all stages
3. **Flexible**: Doesn't imply only commercial transactions
4. **User-friendly**: Familiar term in CRM context

### Why "Convert to Client" instead of "Mark Won"?

1. **Clear action**: Explicitly states what happens (becomes a client)
2. **Semantic accuracy**: "Winning" implies competition; "converting" implies progression
3. **User intent**: Shows the outcome, not the action
4. **Consistency**: Matches the `account_stage = 'client'` value

### Why unified companies table?

1. **Single source of truth**: One entity = one row
2. **Simpler queries**: No joins between companies and engagements
3. **Cleaner history**: Stage changes tracked on one entity
4. **Flexible lifecycle**: Account can move between lead/deal/client naturally

---

*Last updated: December 2025*
