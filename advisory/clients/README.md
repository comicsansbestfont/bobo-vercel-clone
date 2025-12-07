# Client Management System

**Purpose:** Manage client relationships from Closed Won through Alumni status.

This system is **separate from but integrated with** the Deal Management system in `Deals/`.

---

## System Overview

| System | Purpose | Lifecycle |
|--------|---------|-----------|
| **Deals/** | Win the business | First Contact → Closed Won |
| **Clients/** | Deliver value & grow | Closed Won → Alumni |

---

## Folder Structure

```
Clients/
├── README.md                 # This file
├── CLIENT_SOP.md             # Standard operating procedures
│
├── _TEMPLATE/
│   ├── client-profile-template.md
│   ├── engagement-summary-template.md
│   └── ONBOARDING_CHECKLIST.md
│
└── [ClientName]/
    ├── client-profile.md     # Main relationship doc
    ├── Engagements/
    │   └── YYYY-MM_[Type]/
    │       ├── engagement-summary.md
    │       ├── Deliverables/
    │       ├── Sessions/
    │       └── _raw/
    ├── Comms/                # Ongoing communications
    ├── Deliverables/         # Master deliverables
    └── _Inbox/               # Processing queue
```

---

## Client Lifecycle Stages

```
DEALS/                        CLIENTS/
─────────────────────        ─────────────────────────────────
First Contact
    ↓
Triage & Qualification
    ↓
Deep Dive & Diagnosis
    ↓
Relationship Development
    ↓
Proposal Presented
    ↓
Contract Sent
    ↓
Finalising Terms
    ↓
Closed Won ─────────────────→ ONBOARDING
                                  ↓
                              ACTIVE ←──────┐
                                  ↓         │
                              EXPANSION ────┘
                                  ↓
                              ALUMNI
                                  ↓
                              (Reactivate or Churn)
```

| Stage | Definition | Entry Trigger |
|-------|------------|---------------|
| **Onboarding** | First 2 weeks | Closed Won |
| **Active** | Ongoing delivery | Rhythm established |
| **Expansion** | New engagement | Upsell agreed |
| **Alumni** | No active work | Engagement complete |
| **Paused** | Temporary hold | Mutual agreement |
| **Churned** | Relationship ended | Cancellation |

---

## Key Documents

### Client Profile (`client-profile.md`)
- Relationship overview across all engagements
- Client health and status
- Outcomes delivered
- Expansion opportunities
- Links back to Deal doc for sales history

### Engagement Summary (`engagement-summary.md`)
- Per-engagement scope and timeline
- Deliverables checklist
- Session notes
- Outcomes achieved
- Created for each engagement (Diagnostic, Advisory, Project, etc.)

---

## Material Ownership

| Phase | Location | Examples |
|-------|----------|----------|
| **Pre-signing** | `Deals/` | Discovery calls, proposals, contracts, research |
| **Post-signing** | `Clients/` | Kickoff, weekly 1:1s, Slack, deliverables |

---

## Quick Reference

**New client onboarding:** See `CLIENT_SOP.md` → SOP 1

**Weekly rhythm (retainers):** See `CLIENT_SOP.md` → SOP 2

**Engagement wrap-up:** See `CLIENT_SOP.md` → SOP 3

**Templates:** See `_TEMPLATE/` folder

---

## Naming Conventions

| Type | Format | Example |
|------|--------|---------|
| Client Folder | `PascalCase` | `SwiftCheckin`, `MyTab` |
| Engagement Folder | `YYYY-MM_Type` | `2025-07_GTM-Diagnostic` |
| Session Notes | `YYYY-MM-DD-session.md` | `2025-07-14-session.md` |
| Deliverables | `ClientName-Type-vX.ext` | `SwiftCheckin-Diagnostic-v1.pdf` |

---

*Created: 2025-11-30*
*Part of Sachee's GTM Advisory Operating System*
