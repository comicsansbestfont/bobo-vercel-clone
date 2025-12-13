# HubSpot Integration Analysis

**Date:** December 14, 2025
**Status:** Research Complete
**Goal:** Sync Bobo CRM (contacts, companies, deals) with HubSpot + pull calendar events & logged emails

---

## Executive Summary

Integrating Bobo CRM with HubSpot is **highly feasible** but requires:
1. **OAuth2 app** for authentication (private apps won't scale)
2. **Bidirectional sync architecture** using webhooks (HubSpot → Bobo) + API polling/push (Bobo → HubSpot)
3. **Field mapping layer** to translate between schemas
4. **Conflict resolution strategy** for simultaneous edits
5. **External ID tracking** to maintain record links

**Estimated Complexity:** Medium-High (4-6 weeks for full implementation)

---

## 1. Current Bobo CRM Schema

### Contacts Table
| Field | Type | HubSpot Equivalent |
|-------|------|-------------------|
| `id` | UUID | (internal, map to `hs_object_id`) |
| `name` | TEXT | `firstname` + `lastname` |
| `name_structured` | JSONB | Direct mapping |
| `email` | TEXT | `email` |
| `emails` | JSONB | Need custom property |
| `phone` | TEXT | `phone` |
| `phones` | JSONB | Need custom property |
| `linkedin_url` | TEXT | `linkedin_url` (custom) |
| `role` | TEXT | `jobtitle` |
| `company_id` | UUID | Association to Company |
| `is_primary` | BOOLEAN | Association label |

### Activities Table
| Field | Type | HubSpot Equivalent |
|-------|------|-------------------|
| `activity_type` | TEXT | Engagement type (`CALL`, `EMAIL`, `MEETING`, `NOTE`, `TASK`) |
| `title` | TEXT | `hs_call_title`, `hs_email_subject`, etc. |
| `activity_date` | TIMESTAMPTZ | `hs_timestamp` |
| `duration_mins` | INTEGER | `hs_call_duration` (milliseconds in HubSpot) |
| `channel` | TEXT | Custom property needed |
| `direction` | TEXT | `hs_call_direction` |
| `outcome` | TEXT | `hs_call_disposition` |
| `summary` | TEXT | `hs_call_body`, `hs_email_text` |

### Deals (via Projects + Advisory Files)
| Field | Type | HubSpot Equivalent |
|-------|------|-------------------|
| `name` | TEXT | `dealname` |
| `stage` | TEXT | `dealstage` (pipeline-specific) |
| `arr_estimate` | NUMERIC | `amount` |
| `company` | TEXT | Association to Company |
| `first_contact` | DATE | `createdate` or custom |

### Companies (Not Yet Implemented)
Need to create `companies` table first. HubSpot fields:
- `name` → `name`
- `domain` → `domain`
- `industry` → `industry`
- `numberofemployees` → `team_size`

---

## 2. HubSpot API Architecture

### Authentication Options

| Method | Use Case | Recommendation |
|--------|----------|----------------|
| **Private App** | Single HubSpot account (yours only) | Good for MVP |
| **OAuth2** | Multi-tenant / distributable | Required for production |

**Recommendation:** Start with Private App for development, migrate to OAuth2 for production.

### Key API Endpoints

```
Base URL: https://api.hubapi.com

# CRM Objects (v3)
GET/POST   /crm/v3/objects/contacts
GET/PATCH  /crm/v3/objects/contacts/{contactId}
POST       /crm/v3/objects/contacts/batch/create
POST       /crm/v3/objects/contacts/batch/update
POST       /crm/v3/objects/contacts/search

# Same pattern for /companies and /deals

# Associations (v4)
PUT        /crm/v4/objects/{fromObjectType}/{fromObjectId}/associations/default/{toObjectType}/{toObjectId}
GET        /crm/v4/objects/{objectType}/{objectId}/associations/{toObjectType}

# Engagements (Meetings, Emails, Calls, Notes)
GET/POST   /crm/v3/objects/meetings
GET/POST   /crm/v3/objects/emails
GET/POST   /crm/v3/objects/calls
GET/POST   /crm/v3/objects/notes

# Webhooks
POST       /webhooks/v3/{appId}/subscriptions
```

### Rate Limits

| Tier | Limit |
|------|-------|
| Standard | 100 requests / 10 seconds |
| Burst | 150 requests / 10 seconds |
| Daily | 250,000 requests / day |
| Batch | 100 records per batch call |

**Batch operations reduce quota consumption by 80%** — always prefer batch APIs.

---

## 3. Sync Architecture

### Option A: Webhook-Based (Recommended)

```
┌─────────────┐    Webhooks     ┌─────────────┐
│   HubSpot   │ ──────────────► │    Bobo     │
│             │                 │   Webhook   │
│             │ ◄────────────── │   Handler   │
└─────────────┘    API Calls    └─────────────┘
                                      │
                                      ▼
                               ┌─────────────┐
                               │  Supabase   │
                               │   (CRM DB)  │
                               └─────────────┘
```

**HubSpot → Bobo (Webhooks):**
1. Create HubSpot App in developer portal
2. Subscribe to events: `contact.creation`, `contact.propertyChange`, `company.*`, `deal.*`
3. Endpoint: `POST /api/integrations/hubspot/webhook`
4. Process events, update Supabase

**Bobo → HubSpot (API Push):**
1. On Supabase write (via Supabase webhooks or triggers)
2. Queue sync job (avoid duplicate updates from webhook echo)
3. Call HubSpot API to create/update records

### Option B: Polling-Based (Simpler but Less Real-Time)

```
┌─────────────┐                 ┌─────────────┐
│   HubSpot   │ ◄────Poll────── │    Bobo     │
│             │                 │   Sync Job  │
│             │ ────Push──────► │  (cron/bg)  │
└─────────────┘                 └─────────────┘
```

- Poll HubSpot every 5 minutes for changes (use `hs_lastmodifieddate` filter)
- Push Bobo changes immediately or on schedule
- Simpler but misses real-time updates

### Recommended: Hybrid Approach

| Direction | Method | Latency |
|-----------|--------|---------|
| HubSpot → Bobo | Webhooks | Real-time |
| Bobo → HubSpot | Immediate API call | Near real-time |
| Initial sync | Batch import | One-time |
| Catch-up | Polling job (hourly) | Backup |

---

## 4. Field Mapping Strategy

### Mapping Table Schema

```sql
CREATE TABLE hubspot_field_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  object_type TEXT NOT NULL, -- 'contact', 'company', 'deal'
  bobo_field TEXT NOT NULL,
  hubspot_property TEXT NOT NULL,
  direction TEXT DEFAULT 'bidirectional', -- 'to_hubspot', 'from_hubspot', 'bidirectional'
  transform_fn TEXT, -- Optional JS function name for value transformation
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Example mappings
INSERT INTO hubspot_field_mappings (object_type, bobo_field, hubspot_property) VALUES
('contact', 'name_structured.firstName', 'firstname'),
('contact', 'name_structured.lastName', 'lastname'),
('contact', 'email', 'email'),
('contact', 'phone', 'phone'),
('contact', 'role', 'jobtitle'),
('contact', 'linkedin_url', 'hs_linkedinid'),
('company', 'name', 'name'),
('company', 'website', 'domain'),
('company', 'industry', 'industry'),
('deal', 'name', 'dealname'),
('deal', 'arr_estimate', 'amount'),
('deal', 'stage', 'dealstage');
```

### External ID Tracking

```sql
ALTER TABLE contacts ADD COLUMN hubspot_id TEXT UNIQUE;
ALTER TABLE contacts ADD COLUMN hubspot_synced_at TIMESTAMPTZ;
ALTER TABLE contacts ADD COLUMN hubspot_sync_status TEXT DEFAULT 'pending';
-- Repeat for companies, projects (deals)
```

---

## 5. Engagement Sync (Emails, Meetings, Calls)

### HubSpot Engagement Types → Bobo Activity Types

| HubSpot | Bobo `activity_type` | Notes |
|---------|---------------------|-------|
| `emails` | `email` | Use Email Events API for marketing emails |
| `meetings` | `meeting` | Calendar sync required |
| `calls` | `call` | Includes call recording URLs |
| `notes` | `note` | Simple text notes |
| `tasks` | `task_completed` | When task marked complete |

### Calendar Events

HubSpot doesn't have a direct Calendar API. Options:

1. **Meetings Engagement API** (`/crm/v3/objects/meetings`)
   - Syncs meetings created in HubSpot
   - Doesn't sync external calendar events unless user connects Google/Outlook

2. **Workaround:**
   - User connects Google Calendar to HubSpot
   - HubSpot creates meeting engagements from calendar
   - Bobo pulls meeting engagements via API

### Email Logging

Two types of emails in HubSpot:

| Type | API | What It Captures |
|------|-----|------------------|
| **1:1 Emails** | Engagements Email API | Emails logged via CRM sidebar or BCC |
| **Marketing Emails** | Email Events API | Campaigns, sequences (no 1:1) |

**To pull logged emails:**
```typescript
// Get emails associated with a contact
const emails = await hubspotClient.crm.objects.emails.basicApi.getPage(
  undefined, undefined,
  ['hs_email_subject', 'hs_email_text', 'hs_email_direction', 'hs_timestamp'],
  undefined,
  [{ id: contactId, type: 'contact' }]
);
```

---

## 6. Implementation Phases

### Phase 1: Foundation (Week 1-2)

**Database:**
- [ ] Create `companies` table with HubSpot fields
- [ ] Add `hubspot_id`, `hubspot_synced_at` to contacts, companies, deals
- [ ] Create `hubspot_field_mappings` table
- [ ] Create `hubspot_sync_log` table for audit trail

**Authentication:**
- [ ] Create HubSpot Private App (dev)
- [ ] Add `HUBSPOT_ACCESS_TOKEN` env var
- [ ] Create `lib/hubspot/client.ts` with SDK init

**Types:**
- [ ] Create `lib/hubspot/types.ts` with API response types
- [ ] Create mapping functions (Bobo ↔ HubSpot)

### Phase 2: Initial Import (Week 2-3)

**Import from HubSpot:**
- [ ] `POST /api/integrations/hubspot/import/contacts`
- [ ] `POST /api/integrations/hubspot/import/companies`
- [ ] `POST /api/integrations/hubspot/import/deals`
- [ ] Handle pagination (use `after` cursor)
- [ ] Map and insert into Supabase

**Association Sync:**
- [ ] Fetch contact-company associations
- [ ] Fetch deal-contact associations
- [ ] Update `company_id` on contacts
- [ ] Create `project_contacts` junction records

### Phase 3: Real-Time Sync (Week 3-4)

**Webhooks (HubSpot → Bobo):**
- [ ] Create HubSpot Developer App
- [ ] `POST /api/integrations/hubspot/webhook` handler
- [ ] Subscribe to: `contact.*`, `company.*`, `deal.*`
- [ ] Signature validation (`X-HubSpot-Signature-v3`)
- [ ] Idempotency handling (dedup by `eventId`)

**Push Sync (Bobo → HubSpot):**
- [ ] Supabase webhook on contacts/companies insert/update
- [ ] `lib/hubspot/sync.ts` push functions
- [ ] Dedup logic (don't push if change came from HubSpot)
- [ ] Batch updates for efficiency

### Phase 4: Engagement Sync (Week 4-5)

**Pull Engagements:**
- [ ] `GET /api/integrations/hubspot/sync/engagements`
- [ ] Fetch meetings, emails, calls, notes
- [ ] Map to Bobo `activities` table
- [ ] Associate with contacts via `project_contacts`

**Push Activities:**
- [ ] On activity creation in Bobo, create HubSpot engagement
- [ ] Map `activity_type` to engagement type
- [ ] Associate with HubSpot contact/company IDs

### Phase 5: UI & Polish (Week 5-6)

**Settings UI:**
- [ ] HubSpot connection status card
- [ ] "Connect to HubSpot" OAuth flow
- [ ] Field mapping configuration UI
- [ ] Sync status dashboard

**Contact/Deal Views:**
- [ ] "View in HubSpot" button
- [ ] Last synced indicator
- [ ] Manual sync trigger
- [ ] Sync conflict resolution UI

---

## 7. Key Technical Decisions

### 1. Conflict Resolution Strategy

**Recommendation:** "Last write wins" with audit trail

```typescript
interface SyncConflict {
  record_type: 'contact' | 'company' | 'deal';
  record_id: string;
  bobo_value: any;
  hubspot_value: any;
  resolved_by: 'bobo' | 'hubspot' | 'user';
  resolved_at: Date;
}
```

**Rules:**
- If `hubspot_synced_at` > local `updated_at`: HubSpot wins
- If local `updated_at` > `hubspot_synced_at`: Bobo wins
- Edge case (simultaneous): Prefer HubSpot (source of truth for sales data)

### 2. Sync Frequency

| Data Type | Frequency | Method |
|-----------|-----------|--------|
| Contacts | Real-time | Webhook |
| Companies | Real-time | Webhook |
| Deals | Real-time | Webhook |
| Meetings | Every 15 min | Polling |
| Emails | Every 15 min | Polling |
| Calls | Every 15 min | Polling |

### 3. Error Handling

```typescript
interface HubSpotSyncJob {
  id: string;
  operation: 'create' | 'update' | 'delete';
  object_type: string;
  object_id: string;
  status: 'pending' | 'processing' | 'success' | 'failed';
  attempts: number;
  last_error?: string;
  next_retry_at?: Date;
}
```

**Retry strategy:** Exponential backoff (1m, 5m, 15m, 1h, 4h, 24h)

### 4. Pipeline Mapping

HubSpot deals require a `pipeline` ID. Options:

1. **Single pipeline:** Map all Bobo stages to one HubSpot pipeline
2. **Multi-pipeline:** Map by `engagement_type` (lead vs deal vs client)

**Recommendation:** Create custom HubSpot pipeline matching Bobo stages:

```
discovery → qualification → proposal → negotiation → closed_won / closed_lost
```

---

## 8. SDK Usage Examples

### Initialize Client

```typescript
// lib/hubspot/client.ts
import { Client } from '@hubspot/api-client';

export const hubspotClient = new Client({
  accessToken: process.env.HUBSPOT_ACCESS_TOKEN,
  numberOfApiCallRetries: 3,
});
```

### Create Contact

```typescript
// lib/hubspot/contacts.ts
import { hubspotClient } from './client';

export async function createHubSpotContact(contact: BoboContact) {
  const properties = {
    email: contact.email,
    firstname: contact.name_structured?.firstName || contact.name.split(' ')[0],
    lastname: contact.name_structured?.lastName || contact.name.split(' ').slice(1).join(' '),
    phone: contact.phone,
    jobtitle: contact.role,
  };

  const response = await hubspotClient.crm.contacts.basicApi.create({ properties });
  return response.id; // HubSpot ID
}
```

### Batch Update Contacts

```typescript
export async function batchUpdateContacts(contacts: Array<{ id: string; properties: object }>) {
  const inputs = contacts.map(c => ({
    id: c.id,
    properties: c.properties,
  }));

  // Process in chunks of 100
  for (let i = 0; i < inputs.length; i += 100) {
    const batch = inputs.slice(i, i + 100);
    await hubspotClient.crm.contacts.batchApi.update({ inputs: batch });
  }
}
```

### Create Association

```typescript
export async function associateContactToCompany(contactId: string, companyId: string) {
  await hubspotClient.crm.associations.v4.basicApi.create(
    'contacts',
    contactId,
    'companies',
    companyId,
    [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 1 }]
  );
}
```

### Webhook Handler

```typescript
// app/api/integrations/hubspot/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('X-HubSpot-Signature-v3');

  // Validate signature
  const hash = crypto
    .createHmac('sha256', process.env.HUBSPOT_CLIENT_SECRET!)
    .update(body)
    .digest('hex');

  if (hash !== signature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const events = JSON.parse(body);

  for (const event of events) {
    switch (event.subscriptionType) {
      case 'contact.creation':
        await handleContactCreation(event);
        break;
      case 'contact.propertyChange':
        await handleContactUpdate(event);
        break;
      case 'deal.propertyChange':
        await handleDealUpdate(event);
        break;
    }
  }

  return NextResponse.json({ received: true });
}
```

---

## 9. Environment Variables

```bash
# .env.local additions

# HubSpot Private App (development)
HUBSPOT_ACCESS_TOKEN=pat-na1-xxxxxxxx

# HubSpot OAuth App (production)
HUBSPOT_CLIENT_ID=xxxxxxxx
HUBSPOT_CLIENT_SECRET=xxxxxxxx
HUBSPOT_REDIRECT_URI=https://yourdomain.com/api/integrations/hubspot/callback

# Webhook validation
HUBSPOT_WEBHOOK_SECRET=xxxxxxxx

# Pipeline IDs (from HubSpot)
HUBSPOT_DEAL_PIPELINE_ID=default
```

---

## 10. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Rate limiting | Sync delays | Batch operations, request queuing |
| Webhook reliability | Missed updates | Hourly polling as backup |
| Schema drift | Data inconsistency | Field mapping layer, validation |
| Duplicate records | Data quality | Email-based dedup, external ID tracking |
| OAuth token expiry | Auth failures | Auto-refresh flow, monitoring |

---

## 11. Cost Considerations

### HubSpot API Access

| Tier | API Access | Webhooks |
|------|------------|----------|
| Free | Yes (rate limited) | No |
| Starter | Yes | No |
| Professional | Yes | Yes (via Workflows) |
| Enterprise | Yes | Yes (native) |

**Webhooks require:** Operations Hub Professional ($720/mo) OR building a Developer App (free but requires OAuth).

### Development Estimate

| Phase | Effort | Complexity |
|-------|--------|------------|
| Foundation | 3-4 days | Medium |
| Initial Import | 2-3 days | Medium |
| Real-time Sync | 4-5 days | High |
| Engagement Sync | 3-4 days | Medium |
| UI & Polish | 3-4 days | Low |
| **Total** | **15-20 days** | - |

---

## Sources

- [HubSpot API Reference Overview](https://developers.hubspot.com/docs/api-reference/overview)
- [HubSpot Webhooks API](https://developers.hubspot.com/docs/api/webhooks)
- [HubSpot Node.js SDK](https://github.com/HubSpot/hubspot-api-nodejs)
- [@hubspot/api-client npm](https://www.npmjs.com/package/@hubspot/api-client)
- [HubSpot Associations API v4](https://developers.hubspot.com/docs/api-reference/crm-associations-v4/guide)
- [HubSpot Two Way Sync Guide](https://www.stacksync.com/blog/hubspot-two-way-sync-the-complete-guide-to-bidirectional-integration)
- [HubSpot Data Sync](https://knowledge.hubspot.com/integrations/connect-and-use-hubspot-data-sync)
- [HubSpot Engagements API](https://developers.hubspot.com/docs/guides/api/crm/engagements/engagement-details)
- [HubSpot Meetings API](https://developers.hubspot.com/docs/guides/api/crm/engagements/meetings)
- [Working with OAuth](https://developers.hubspot.com/docs/api/working-with-oauth)
