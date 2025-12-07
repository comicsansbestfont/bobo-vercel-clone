# Client Management Standard Operating Procedure (SOP)

**Version:** 2.3
**Created:** 2025-11-30
**Updated:** 2025-12-07
**Purpose:** Step-by-step checklist for managing clients from Closed Won through Alumni

> **Valuation Framework:** All valuation analysis uses Sachee's Early-Stage B2B SaaS Valuation Framework v2.2
> See: `04_Reference/Identity/SACHEE_VALUATION_FRAMEWORK.md`
>
> **Valuation Triggers:** Framework v2.2 includes automatic valuation checks during inbox processing. Any new metrics (ARR, customers, funding details) shared during engagement must trigger a valuation update.

---

## Quick Reference: Client Stages

| Stage | Trigger | Key Actions |
|-------|---------|-------------|
| Onboarding | Deal Closed Won | Create client folder, kickoff call, set cadence |
| Active | Rhythm established | Regular sessions, deliverables, progress tracking |
| Expansion | Upsell opportunity | Propose new engagement, create new folder |
| Alumni | Engagement complete | Document outcomes, nurture relationship |
| Paused | Mutual agreement | Set check-in date, minimal contact |
| Churned | Relationship ended | Exit interview, document learnings |

---

## SOP 1: New Client Onboarding

**Trigger:** Deal marked "Closed Won" in Deals/
**Time Required:** 60-90 minutes
**Client Stage:** Onboarding

### Checklist

- [ ] **1.1** Create client folder structure
  ```bash
  Clients/[ClientName]/
  ├── client-profile.md
  ├── Engagements/
  │   └── YYYY-MM_[EngagementType]/
  │       ├── engagement-summary.md
  │       ├── Deliverables/
  │       ├── Sessions/
  │       └── _raw/
  ├── Comms/
  ├── Deliverables/
  └── _Inbox/
  ```

- [ ] **1.2** Create client profile from deal doc
  - Copy from `_TEMPLATE/client-profile-template.md`
  - Pull Company Context from deal doc Section 2.8 (TLDR)
  - Pull GTM Assessment from deal doc Section 3
  - Pull contact info and stakeholders
  - **Copy Valuation Snapshot from deal doc Section 8**
  - Set client_status to "Onboarding"

- [ ] **1.2a** Copy valuation analysis from deal
  - Copy `Deals/[Company]/Valuation/YYYY-MM-DD-valuation-analysis.md`
  - Save to `Clients/[Company]/Valuation/YYYY-MM-DD-valuation-analysis.md`
  - Update date if modifications made
  - This becomes the baseline valuation for the client relationship

- [ ] **1.3** Create engagement summary
  - Copy from `_TEMPLATE/engagement-summary-template.md`
  - Fill scope, success criteria, timeline
  - Add deliverables checklist

- [ ] **1.4** Update deal doc
  ```yaml
  deal_stage: "Closed Won"
  closed_date: "YYYY-MM-DD"
  client_folder: "../../Clients/[ClientName]/"
  ```

- [ ] **1.5** Send welcome communication
  - Confirm engagement terms
  - Share meeting cadence
  - Set up communication channels (Slack, etc.)

- [ ] **1.6** Schedule kickoff call
  - Agenda: Review scope, align on cadence, identify first priority
  - Send calendar invite with prep materials

- [ ] **1.7** After kickoff, update client status
  - Once rhythm established, update to "Active"

---

## SOP 2: Weekly Advisory/Copilot Rhythm

**Trigger:** Weekly (or per agreed cadence)
**Applies to:** Advisory and Copilot engagements
**Client Stage:** Active

### Pre-Call Checklist (15 min before)

- [ ] **2.1** Review previous session notes
- [ ] **2.2** Check Slack/email for updates
- [ ] **2.3** Prepare topics and questions
- [ ] **2.4** Have relevant docs ready

### During Call

- [ ] **2.5** Check progress on action items
- [ ] **2.6** Deep dive on priority topic
- [ ] **2.7** Agree on next steps and action items
- [ ] **2.8** Set next session agenda

### Post-Call Checklist (30 min after)

- [ ] **2.9** Write session notes
  - Save to `Engagements/[current]/Sessions/YYYY-MM-DD-session.md`
  - Key discussion points
  - Decisions made
  - Action items (with owners)

- [ ] **2.10** Update engagement summary
  - Mark milestones complete
  - Update deliverables status

- [ ] **2.11** Log touchpoint in client profile Section 5

- [ ] **2.12** Send follow-up message if needed
  - Recap key points
  - Share any promised resources

---

## SOP 3: Engagement Wrap-Up

**Trigger:** Engagement end date approaching OR scope completed
**Time Required:** 60-90 minutes
**Client Stage:** Active → Alumni (or Expansion)

### Checklist

- [ ] **3.1** Final deliverables
  - Compile all deliverables
  - Move to `Engagements/[current]/Deliverables/`
  - Copy final versions to `Deliverables/` master folder

- [ ] **3.2** Document outcomes
  - Update engagement summary "Outcomes & Results" section
  - Quantifiable results (metrics, revenue impact)
  - Strategic wins (positioning shifts, deals closed)

- [ ] **3.3** Request testimonial
  ```
  Hi [Name], as we wrap up our engagement, I'd love to capture
  your experience. Would you be open to sharing a brief
  testimonial about what we achieved together?
  ```

- [ ] **3.4** Wrap-up call
  - Review accomplishments
  - Discuss next steps/continuation options
  - Ask for referrals
  - Gather feedback

- [ ] **3.5** Final valuation snapshot
  - Update valuation analysis with current metrics
  - Capture final ARR, customer count, GTM stage
  - Update Valuation Snapshot in client profile
  - Note valuation trajectory (improved/declined/stable)

- [ ] **3.6** Administrative
  - Send final invoice (if applicable)
  - Update engagement status to "Completed"
  - Update engagement history in client profile

- [ ] **3.7** Make transition decision
  - **Expansion:** New engagement → Create new engagement folder
  - **Alumni:** No immediate next → Update status, set nurture schedule
  - **Churned:** Relationship ending → Document reason, exit gracefully

- [ ] **3.7** Update client status in YAML
  ```yaml
  client_status: "Alumni"  # or "Active" if expansion
  ```

---

## SOP 4: Client Health Check

**Trigger:** Monthly (or if red flags appear)
**Applies to:** All active clients
**Purpose:** Proactively identify and address issues

### Health Assessment Checklist

- [ ] **4.1** Engagement Quality
  - [ ] Attending scheduled sessions
  - [ ] Responsive to communications
  - [ ] Prepared for calls
  - [ ] Implementing recommendations

- [ ] **4.2** Progress Indicators
  - [ ] Making measurable progress
  - [ ] Hitting milestones
  - [ ] Moving toward success criteria
  - [ ] ARR/metrics improving

- [ ] **4.3** Sentiment Signals
  - [ ] Positive tone in calls
  - [ ] Sharing wins and progress
  - [ ] Referring others
  - [ ] No frustration signals

- [ ] **4.4** Operational Health
  - [ ] Invoices paid on time
  - [ ] No scope creep concerns
  - [ ] Effort level appropriate
  - [ ] Clear expectations

- [ ] **4.5** Valuation & Stage Review
  - [ ] Has GTM stage changed? (1a → 1b → 2)
  - [ ] Has ARR significantly changed?
  - [ ] Any new metrics that affect valuation?
  - [ ] Update Valuation Snapshot if material changes
  - [ ] Consider re-running valuation analysis if stage change

### Health Score

| Score | Criteria | Action |
|-------|----------|--------|
| **Green** | All indicators positive | Continue normal cadence |
| **Yellow** | 1-2 concerns | Proactive check-in, address issues |
| **Red** | Multiple concerns | Intervention call, reset expectations |

- [ ] **4.5** Update health score in client profile
- [ ] **4.6** If Yellow/Red, schedule intervention
- [ ] **4.7** Document any red flags or concerns

---

## SOP 5: Expansion & Upsell

**Trigger:** Current engagement going well OR client expresses new need
**Client Stage:** Active → Expansion

### Checklist

- [ ] **5.1** Assess current engagement
  - Client happy with results?
  - Trust established?
  - Budget/capacity for more?

- [ ] **5.2** Identify natural next steps
  - Diagnostic → Advisory upsell
  - Advisory → Copilot expansion
  - Project → Additional project
  - Any → Strategic project

- [ ] **5.3** Prepare proposal
  - Scope and deliverables
  - Timeline
  - Investment
  - Expected outcomes

- [ ] **5.4** Discuss in upcoming session
  - Natural timing (don't force)
  - Frame as continuation of success
  - Address any concerns

- [ ] **5.5** If agreed
  - Create new engagement folder
  - `Engagements/YYYY-MM_[NewType]/`
  - Update engagement history
  - Keep client_status as "Active"

- [ ] **5.6** Update expansion tracking
  - Log in client profile Section 6

---

## SOP 6: Alumni Nurture

**Trigger:** Engagement completed, no immediate next engagement
**Cadence:** Monthly-Quarterly check-ins
**Client Stage:** Alumni

### Initial Transition

- [ ] **6.1** Update client profile
  - Set client_status to "Alumni"
  - Document engagement outcomes
  - Note relationship highlights

- [ ] **6.2** Set nurture schedule
  - 30-day check-in
  - 90-day results review
  - Quarterly relationship touchpoint

### Ongoing Nurture Checklist

- [ ] **6.3** Regular touchpoints
  - Share relevant content/insights
  - Congratulate on wins (monitor LinkedIn)
  - Invite to events or webinars
  - Check in on progress

- [ ] **6.4** Referral requests
  - Ask for introductions periodically
  - Make it easy (provide template/context)
  - Thank and update on outcomes

- [ ] **6.5** Case study development
  - If strong results, propose case study
  - Follow SOP 7 (below)

- [ ] **6.6** Monitor for reactivation
  - New challenges arising?
  - Scaling pain points?
  - New funding/growth phase?

- [ ] **6.7** Log all touchpoints
  - Update client profile Section 5

---

## SOP 7: Case Study Development (Optional)

**Trigger:** Strong outcomes achieved, client willing to participate
**Purpose:** Marketing asset from successful engagement

### Checklist

- [ ] **7.1** Request permission
  - Explain use case
  - Offer review/approval

- [ ] **7.2** Conduct case study interview
  - Challenge/situation before
  - Solution/approach
  - Results/outcomes
  - Quote/testimonial

- [ ] **7.3** Draft case study
  - Problem → Solution → Results format
  - Include metrics where possible
  - Client quote

- [ ] **7.4** Get client approval
  - Send draft for review
  - Incorporate feedback

- [ ] **7.5** Finalize and publish
  - Add to website/portfolio
  - Share on LinkedIn
  - Update case_study_status in client profile

---

## SOP 8: Client Inbox Processing (Anytime)

**Trigger:** Files added to client _Inbox
**Time Required:** 5-15 minutes per file
**Purpose:** Keep _Inbox empty, files properly organized, valuation updated, synced to advisory platform

### Processing Flow

```
_Inbox → Process → Appropriate folder
       ↓                              ↓
       Check for valuation data       Auto-sync to advisory/clients/[Company]/
       ↓
       Update valuation if found
```

> **Advisory Sync:** Processed files are automatically synced to `bobo-vercel-clone/advisory/clients/[Company]/` for the Bobo advisory platform. This happens automatically when using Claude Code or the Gemini document processor.

### File Type Routing

| File Type | Process | Destination | Valuation Impact |
|-----------|---------|-------------|------------------|
| Session recordings | Summarize key points | `Engagements/[current]/Sessions/` | Often contains ARR updates |
| Client documents | Review, file | `Docs/` | May contain metrics |
| Financial reports | **ALWAYS update valuation** | `Docs/` | **HIGH - always triggers update** |
| Email exports | Log touchpoint | `Comms/` | Check for metrics mentions |
| Deliverables received | File appropriately | `Deliverables/` | May show progress |

### Valuation Data Extraction (v2.2 Required)

**ALWAYS scan processed files for these valuation-relevant data points:**

| Data Type | What to Look For | Valuation Impact |
|-----------|-----------------|------------------|
| **ARR/MRR Updates** | "We're now at $X ARR", subscription changes | Updates Phase classification |
| **New Customers** | "We closed X new customers", trials converted | Updates traction evidence |
| **Funding News** | Round size, term sheet, dilution discussions | Triggers Ownership Sanity Check |
| **Stage Changes** | Moving from 1a→1b, "we hit $50K ARR" | May require full re-analysis |
| **Team Changes** | Hired sales rep, new co-founder, departures | Updates Founder Engine Score |
| **GTM Evidence** | Sales wins, lost deals, pricing changes | Updates Section B modifiers |
| **Industry Pivot** | Targeting new vertical, changed ICP | May change Market-Fit penalty |

### Checklist

- [ ] Identify file type
- [ ] Extract key information to engagement notes
- [ ] Rename file per convention
- [ ] Move to appropriate folder
- [ ] **Verify advisory sync completed** (check `bobo-vercel-clone/advisory/clients/[Company]/`)
- [ ] **VALUATION CHECK (MANDATORY):**
  - [ ] Scan file for valuation-relevant data (see table above)
  - [ ] **If material metrics found:**
    - [ ] Update `Valuation/YYYY-MM-DD-valuation-analysis.md` with new data
    - [ ] Re-calculate if >10% ARR change or new customer milestone
    - [ ] Run Ownership Sanity Check if funding details available
    - [ ] Update Valuation Snapshot in client-profile.md
    - [ ] Add entry to Valuation History table
  - [ ] **If stage change detected (1a→1b, 1b→2):**
    - [ ] Run FULL valuation re-analysis
    - [ ] Update Phase classification
    - [ ] Recalculate all methods with new stage parameters
  - [ ] **If no new metrics:** Note "No valuation-relevant data" in processing log
- [ ] Verify _Inbox is empty

### Valuation Update Decision Tree

```
New data found in file?
├── YES: Is it material? (>10% ARR change, customer milestone, stage change, funding)
│   ├── STAGE CHANGE (1a→1b, 1b→2, etc.):
│   │   └── Run FULL valuation re-analysis (all sections)
│   ├── ARR/CUSTOMER CHANGE (>10%):
│   │   ├── Update metrics in valuation analysis
│   │   ├── Re-run Berkus and Scorecard
│   │   ├── Update Valuation Snapshot
│   │   └── Add to Valuation History
│   ├── FUNDING DETAILS:
│   │   ├── Run Ownership Sanity Check
│   │   └── Update Section F in valuation
│   └── MINOR CHANGE (<10%):
│       └── Log data point, update master doc metrics only
└── NO: Continue with standard filing
```

### Stage Change Triggers (Require Full Re-Analysis)

| From | To | Trigger Evidence |
|------|-----|-----------------|
| Phase 1a | Phase 1b | >$50K ARR OR >10 customers OR repeatable sales |
| Phase 1b | Phase 2 | >$300K ARR OR team-supported sales working |
| Any | Down | Significant churn, pivot, or setback |

---

## Quick Commands (Claude Code)

### Create New Client
```
Create a new client folder for [Company] from the Closed Won deal.
```

### Process Client Inbox
```
Process the _Inbox for client [Company] and file appropriately. Run valuation checks per SOP 8.
```

### Health Check
```
Run a health check for client [Company] and update their profile.
```

### Wrap Up Engagement
```
Wrap up the [engagement type] engagement for [Company] and document outcomes.
```

### Update Valuation
```
Update the valuation for client [Company] with new metrics: ARR $X, Customers X, Stage X.
```

### Run Valuation Analysis
```
Run a fresh valuation analysis for client [Company] - they've moved to a new stage.
```

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 2.3 | 2025-12-07 | Added advisory sync to SOP 8 - processed files auto-sync to bobo-vercel-clone/advisory/clients/ |
| 2.2 | 2025-12-04 | Moved valuation files to dedicated `Valuation/` subfolder, updated all path references |
| 2.1 | 2025-12-03 | Updated to v2.2 framework, added SOP 8 (Inbox Processing with mandatory valuation checks), added stage change triggers |
| 2.0 | 2025-12-03 | Added valuation workflow (SOP 1.2a, 3.5, 4.5), added Docs/Meetings folders |
| 1.0 | 2025-11-30 | Initial SOP for Client Management System |
