# BOBO DEALS WORKSPACE: COMPREHENSIVE DESIGN STRATEGY

**Document Version:** 1.0
**Created:** December 13, 2025
**Author:** Claude (Opus 4.5)
**Purpose:** Strategic UX/UI design for transforming Bobo into a hybrid CRM with AI-first deal management

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Research Findings](#research-findings)
   - [HubSpot Deal Record UI Patterns](#hubspot-deal-record-ui-patterns)
   - [HubSpot Activity Logging System](#hubspot-activity-logging-system)
   - [HubSpot Pipeline Management](#hubspot-pipeline-management)
   - [Modern CRM + AI Innovations](#modern-crm--ai-innovations)
   - [Current Bobo Implementation Analysis](#current-bobo-implementation-analysis)
3. [Design Philosophy](#design-philosophy)
4. [Master Workflow Diagram](#master-workflow-diagram)
5. [Deal Workspace Layout](#deal-workspace-layout)
6. [Quick Actions Bar](#quick-actions-bar)
7. [Activity Card Designs](#activity-card-designs)
8. [AI Panel Design](#ai-panel-design)
9. [Activity Logging Workflow](#activity-logging-workflow)
10. [Data Model Additions](#data-model-additions)
11. [AI-Powered Features](#ai-powered-features)
12. [Navigation Architecture](#navigation-architecture)
13. [Implementation Roadmap](#implementation-roadmap)
14. [Key Design Decisions](#key-design-decisions)
15. [Sync Architecture: Bridging Local Files and Cloud](#sync-architecture-bridging-local-files-and-cloud)
    - [The Core Problem](#the-core-problem)
    - [The Solution: Local Sync Agent + Cloud Bridge](#the-solution-local-sync-agent--cloud-bridge)
    - [Complete Data Flow Diagrams](#complete-data-flow-diagrams)
    - [Supabase Schema Additions for Sync](#supabase-schema-additions-for-sync)
    - [The Sync CLI Tool](#the-sync-cli-tool)
    - [CLI Tool Package Structure](#cli-tool-package-structure)
    - [Bobo UI: Upload & Process Workflow](#bobo-ui-upload--process-workflow)
    - [Summary: The Complete Picture](#summary-the-complete-picture)

---

## Executive Summary

Based on extensive research of HubSpot's CRM patterns, modern AI-enhanced CRM innovations, and analysis of the current Bobo implementation, this document proposes a **hybrid CRM workspace** that combines:

1. **HubSpot's proven 3-column layout** for structured deal management
2. **AI-first interaction model** with Claude as the central intelligence layer
3. **File-reference architecture** maintaining master docs as source of truth
4. **Activity logging system** inspired by HubSpot but optimized for solo advisory work

### The Core Problem

Chat interfaces are optimized for **thinking**. Work requires **doing**.

| Mode | Chat Strengths | Chat Weaknesses |
|------|---------------|-----------------|
| **Thinking** | Open-ended exploration, reasoning, brainstorming | — |
| **Doing** | — | No persistence, linear flow, no structure |

When working on a deal, users need:
- Quick status visibility (stage, value, blockers)
- Structured data entry (not typing "update stage to negotiation")
- Action triggers (log call, send follow-up)
- Document editing with version control

Chat makes users describe what they want to do rather than just *doing* it.

### The Solution

Transform Bobo from "chat with deal context" into a **full-featured deal workspace with AI superpowers** by adding:
1. An artifact pane for AI outputs
2. A unified workspace view for deals
3. Quick action triggers for common tasks
4. Structured activity logging

---

## Research Findings

### HubSpot Deal Record UI Patterns

#### Three-Column Layout Structure

HubSpot's Deal Record page follows a consistent **three-column layout** architecture:

**Left Sidebar (Properties Panel)**
- Deal Card at top with high-level info (name, amount, close date, stage)
- "About this Deal" card with editable properties
- Action buttons (Follow, View all properties, Merge, Delete)
- Up to 50 properties per card
- Hover-to-edit with pencil icon affordance

**Middle Column (Timeline/Overview)**
- Tabbed interface (Overview, Activities, Custom tabs)
- Overview: Data highlights, recent communications, associations
- Activities: Chronological timeline with search and filters
- Maximum 5 tabs, Activities tab cannot be deleted

**Right Sidebar (Associations & Tools)**
- Companies, Contacts, Tickets associations
- Line Items card for products/services
- Quotes card
- Attachments, Playbooks, Revenue attribution

#### Key UX Patterns

1. **Contextual Editing**: Properties editable directly where displayed
2. **Progressive Disclosure**: Cards collapse/expand to manage density
3. **Consistent Card Architecture**: Cards as containers throughout interface
4. **Auto-Save vs Manual Save**: Table view auto-saves, record page requires confirmation

#### 2025 Update: New Deals Sidebar

HubSpot introduced a redesigned deals sidebar with **two-column layout**:
- Left column: Deal summary and key properties
- Right column: Activity timeline and upcoming tasks
- AI-powered guided actions
- Deal scoring and health indicators

---

### HubSpot Activity Logging System

#### Log a Call

**Form Fields:**
- Date and Time (dropdowns)
- Call Body (rich text with formatting)
- Call Outcome: Busy, Connected, Left live message, Left voicemail, No answer, Wrong number (customizable)
- Call Direction: Inbound or Outbound
- Call Type: Custom categories for reporting
- Duration (for live calls)
- Contacts Called

**Auto-Association Rules:**
- Calls on contacts auto-associate with primary company + 5 most recent open deals
- Calls on companies auto-associate with 5 most recent open deals + called contacts
- Calls on deals auto-associate with deal's primary company + called contacts

#### Log an Email

**Three Modes:**
1. Track Only - Get open/click notifications but no timeline record
2. Log Only - Timeline record but no open/click data
3. Track + Log - Both features enabled (recommended)

**Key Features:**
- Automatic logging for replies to HubSpot emails
- Manual logging for external emails
- Thread view option collapses replies

#### Log a Meeting

**Form Fields:**
- Date, Time, Duration
- Meeting Body (notes/summary with rich text)
- Meeting Outcome (customizable, up to 30 options)
- Meeting Type (custom categories)
- Meeting Attendees (up to 50 displayed)

#### Create a Note

**Features:**
- Rich text formatting
- Activity date (can backdate)
- Owner assignment
- @mention team members
- Workflow automation support

#### Create a Task

**Form Fields:**
- Title (including "call" or "email" auto-sets task type)
- Type: Call, Email, To-do, LinkedIn Sales Navigator
- Priority: Low, Medium, High
- Due Date and Time
- Assigned To
- Notes
- Reminders

**Advanced Features:**
- Task queues (up to 20 per account)
- Recurring tasks
- Bulk creation from index pages
- Workflow automation

#### Activity Timeline Display

**Organization:**
- Reverse chronological (newest at bottom)
- Upcoming activities at top
- Each activity as expandable card

**Controls:**
- Collapse/Expand all toggle
- Search across email subjects, task bodies, note bodies, call bodies, meeting bodies
- Filter tabs: Notes, Emails, Calls, Tasks, Meetings
- Filter by user/team

**Activity Card Features:**
- Type icon (left side)
- Title/subject
- Timestamp
- Owner/creator
- Associated records count
- Outcome (for calls/meetings)
- Body text (expandable)
- Actions: Pin, View history, Copy link, Delete

---

### HubSpot Pipeline Management

#### Stage Configuration

**Best Practices:**
- 5-9 stages optimal (7 ± 2)
- Each stage represents a completed action
- Probability increases with stage progression
- Must include Won (100%) and Lost (0%) stages

**Default Pipeline Stages:**
1. Appointment scheduled (20%)
2. Qualified to buy (40%)
3. Presentation scheduled (60%)
4. Decision maker bought-in (80%)
5. Contract sent (90%)
6. Closed won (100%, Won)
7. Closed lost (0%, Lost)

#### Conditional Stage Properties

- Required fields enforced when moving between stages
- Fields must cascade to all subsequent stages to prevent bypass
- Workflow-based validation for complex requirements

#### Deal Probability & Forecasting

**Weighted Amount Calculation:**
```
Weighted Amount = Deal Amount × Stage Probability
```

**Forecast Categories:**
1. Not Forecasted
2. Pipeline (low likelihood)
3. Best Case (moderate likelihood)
4. Commit (high likelihood)
5. Closed Won

#### Pipeline Views

**Board View (Kanban):**
- Cards represent deals, columns represent stages
- Drag-and-drop to move deals
- Record count and total amount per stage
- Inactive deals grayed out
- Customizable card properties (up to 4)

**Table View:**
- Traditional rows and columns
- Filter by "All Pipelines"
- Bulk editing support

#### Deal Aging & Stale Deal Detection

- "Time Since Last Activity" shown on deal cards by default
- Inactive deals automatically grayed out
- Deal Inspection View for prioritizing aging deals
- Custom reports for "Days in current stage > X"

#### Win/Loss Tracking

**Closed Lost Reason:**
- Make required for Closed Lost stage
- Use dropdown select (not free text) for analysis
- Common options: High pricing, Lack of feature fit, Competitor chosen, Timing, Unresponsive

---

### Modern CRM + AI Innovations

#### Salesforce Einstein (Market Leader)

**Einstein Next Best Action:**
- Real-time recommendations using predictive analytics
- Process automation guiding agents through ideal sequences
- 80% case close rate with AI-generated replies

**Einstein Copilot:**
- Conversational AI embedded in CRM
- Summarizes content, generates responses, automates tasks

#### HubSpot Breeze AI

**Breeze Copilot:**
- In-app conversational assistant
- Builds workflows, summarizes records, writes content

**Breeze Agents:**
- Content Agent: Generates marketing materials
- Prospecting Agent: Automates lead qualification
- Customer Agent: Handles support inquiries

**AI Summarization:**
- Transforms complex interactions into journey summaries
- Summarizes records, activities, company performance

#### Key AI Patterns to Adopt

1. **Next Best Action Cards**: Display 3 AI-recommended actions at top of workspace
2. **Activity Auto-Summary**: After calls, auto-generate summary with action items
3. **Timeline Intelligence**: "Who they talk to most, what they care about"
4. **Call Prep Brief Generation**: AI pulls context, suggests talking points
5. **Deal Health Scoring**: Engagement, momentum, risk scores

#### Mobile-First Design

- Pipedrive achieved 26% boost in session completion with mobile optimization
- Swipeable panel design for pipeline stages
- Touch-optimized interactions
- Offline capability for viewing and drafting

---

### Current Bobo Implementation Analysis

#### Existing Deal Data Model

**Frontmatter Fields (master-doc-*.md):**
```yaml
company: string           # Deal name
website: string          # Company website
founder: string          # Founder/contact name
lead_source: string      # How deal came in
first_contact: date      # Initial contact date
deal_stage: enum         # Pipeline stage
engagement_type: string  # Type of engagement
current_stage: string    # Product/GTM stage
arr_estimate: string     # ARR estimate
team_size: string        # Team composition
last_updated: date       # Last update date
```

**Deal Stage Pipeline (9 stages):**
| Stage | Color | Label |
|-------|-------|-------|
| New Opportunity | Gray | New |
| Triage & Qualification | Yellow | Triage |
| Deep Dive & Diagnosis | Orange | Deep Dive |
| Relationship Development | Cyan | Relationship |
| Proposal Presented | Blue | Proposal |
| Contract Sent | Indigo | Contract |
| Finalising Terms | Purple | Finalising |
| Closed Won | Green | Won |
| Closed Lost | Red | Lost |

#### Existing UI Components

**DealCard** (`/components/deals/deal-card.tsx`)
- Company name, engagement type badge, ARR, team size, founder, last updated

**DealProfile** (`/components/deals/deal-profile.tsx`)
- Header with stage badge, ARR, team size, website link
- Overview: founder, website, lead source, first contact, summary, tags
- Assessment: strengths, weaknesses, red flags
- Timeline: vertical timeline with date/stage/notes

**DealsKanban** (`/components/deals/deals-kanban.tsx`)
- 6-column Kanban board with drag-and-drop
- Optimistic UI updates
- Toast notifications

#### Existing API Endpoints

- `GET /api/deals` - List all deals with metadata
- `GET /api/deals/[id]` - Detailed deal profile with parsed sections
- `PATCH /api/deals/[id]/stage` - Update deal stage in master doc

#### Critical Gaps for CRM Functionality

1. **Activity Metadata Not Structured**: No standardized activity types, dates only in table rows
2. **No Standardized Activity Objects**: Activities embedded in markdown tables
3. **Timeline Parsing Issues**: Only parses basic tables, misses activities in other formats
4. **Relational Data Missing**: No linked contact entities
5. **Status/Outcome Tracking**: Action items use markdown checkboxes only

---

## Design Philosophy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         BOBO DESIGN PRINCIPLES                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                 │
│  │  AI-FIRST   │    │ FILE-BASED  │    │  ARTIFACT   │                 │
│  │             │    │   SOURCE    │    │  ORIENTED   │                 │
│  │ Claude is   │    │   OF TRUTH  │    │             │                 │
│  │ the primary │    │             │    │ Outputs are │                 │
│  │ interface,  │    │ Master docs │    │ editable,   │                 │
│  │ not just a  │    │ remain the  │    │ saveable,   │                 │
│  │ sidebar     │    │ canonical   │    │ exportable  │                 │
│  │             │    │ record      │    │ documents   │                 │
│  └─────────────┘    └─────────────┘    └─────────────┘                 │
│                                                                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                 │
│  │  MINIMAL    │    │   SMART     │    │  CONTEXT    │                 │
│  │  DATA ENTRY │    │  DEFAULTS   │    │  PRESERVED  │                 │
│  │             │    │             │    │             │                 │
│  │ AI extracts │    │ Suggest     │    │ Everything  │                 │
│  │ and infers  │    │ values,     │    │ links back  │                 │
│  │ rather than │    │ pre-fill    │    │ to timeline │                 │
│  │ user typing │    │ forms       │    │ and history │                 │
│  └─────────────┘    └─────────────┘    └─────────────┘                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Key Differentiators from Traditional CRMs

1. **AI is Central**: Claude isn't a sidebar feature—it's the primary way users interact with deal data
2. **File-Based Truth**: Master docs remain canonical, database supplements for queries
3. **Artifact-Oriented**: AI outputs become editable documents, not ephemeral chat messages
4. **Minimal Data Entry**: AI extracts information from transcripts and context
5. **Context Preserved**: Every interaction links back to timeline and history

---

## Master Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          BOBO DEALS WORKFLOW                                     │
└─────────────────────────────────────────────────────────────────────────────────┘

                                    ┌─────────────┐
                                    │   ENTRY     │
                                    │   POINTS    │
                                    └──────┬──────┘
                                           │
              ┌────────────────────────────┼────────────────────────────┐
              │                            │                            │
              ▼                            ▼                            ▼
     ┌─────────────────┐        ┌─────────────────┐        ┌─────────────────┐
     │  PIPELINE VIEW  │        │   DEAL RECORD   │        │   CHAT + AI     │
     │   (Kanban)      │        │   (Workspace)   │        │  (Home Page)    │
     │                 │        │                 │        │                 │
     │ • Bird's eye    │        │ • Single deal   │        │ • "Brief me on  │
     │   view          │        │   deep dive     │        │    MyTab"       │
     │ • Drag to move  │        │ • Log activity  │        │ • AI opens      │
     │ • Quick preview │        │ • View timeline │        │   workspace     │
     └────────┬────────┘        └────────┬────────┘        └────────┬────────┘
              │                          │                          │
              │         ┌────────────────┴────────────────┐         │
              │         │                                 │         │
              ▼         ▼                                 ▼         ▼
     ┌───────────────────────────────────────────────────────────────────────┐
     │                         DEAL WORKSPACE                                 │
     │  ┌───────────────┬─────────────────────────┬───────────────────────┐  │
     │  │    LEFT       │        MIDDLE           │        RIGHT          │  │
     │  │  SIDEBAR      │       TIMELINE          │      AI PANEL         │  │
     │  │               │                         │                       │  │
     │  │ • Deal Card   │ • Activity Feed         │ • Claude Chat         │  │
     │  │ • Properties  │ • Quick Actions Bar     │ • Artifacts           │  │
     │  │ • Contacts    │ • Meetings/Calls/Notes  │ • Suggestions         │  │
     │  │ • Files       │ • Stage History         │ • Generated Docs      │  │
     │  └───────────────┴─────────────────────────┴───────────────────────┘  │
     └───────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
     ┌───────────────────────────────────────────────────────────────────────┐
     │                         ACTIVITY LOGGING                               │
     │                                                                        │
     │   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
     │   │ 📞 LOG   │  │ ✉️ LOG   │  │ 📅 LOG   │  │ 📝 ADD   │  │ ✅ ADD │ │
     │   │   CALL   │  │  EMAIL   │  │ MEETING  │  │  NOTE    │  │  TASK  │ │
     │   └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───┬────┘ │
     │        │             │             │             │            │      │
     │        └─────────────┴─────────────┼─────────────┴────────────┘      │
     │                                    │                                  │
     │                                    ▼                                  │
     │   ┌────────────────────────────────────────────────────────────────┐ │
     │   │                    ACTIVITY FORM MODAL                         │ │
     │   │                                                                │ │
     │   │  Date: [Dec 13, 2025 ▼]  Time: [2:30 PM ▼]  Duration: [45m ▼] │ │
     │   │                                                                │ │
     │   │  Channel: [Zoom ▼]  Outcome: [Positive ▼]                     │ │
     │   │                                                                │ │
     │   │  Attendees: [Mikaela Greene] [+ Add]                          │ │
     │   │                                                                │ │
     │   │  Summary:                                                      │ │
     │   │  ┌──────────────────────────────────────────────────────────┐ │ │
     │   │  │ Discussed pitch deck revisions and valuation concerns... │ │ │
     │   │  └──────────────────────────────────────────────────────────┘ │ │
     │   │                                                                │ │
     │   │  [✨ AI Summarize]  [ ] Create follow-up task                 │ │
     │   │                                                                │ │
     │   │  Action Items:                                                 │ │
     │   │  ☐ Send revised deck by Friday → [Mikaela ▼]                  │ │
     │   │  ☐ Schedule follow-up call → [Me ▼]                           │ │
     │   │  [+ Add action item]                                          │ │
     │   │                                                                │ │
     │   │                              [Cancel]  [Save Activity]         │ │
     │   └────────────────────────────────────────────────────────────────┘ │
     │                                    │                                  │
     │                                    ▼                                  │
     │   ┌────────────────────────────────────────────────────────────────┐ │
     │   │  • Saved to timeline                                           │ │
     │   │  • Appended to master doc (Communications Log / Meeting Notes) │ │
     │   │  • Action items tracked                                        │ │
     │   │  • AI context updated                                          │ │
     │   └────────────────────────────────────────────────────────────────┘ │
     └───────────────────────────────────────────────────────────────────────┘
```

---

## Deal Workspace Layout

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  ← Back to Pipeline    MyTab                              [⚙️ Settings] [↗️ Open]   │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌──────────────────┐  ┌─────────────────────────────────┐  ┌─────────────────────┐ │
│  │                  │  │                                 │  │                     │ │
│  │   LEFT PANEL     │  │         MIDDLE PANEL            │  │    RIGHT PANEL      │ │
│  │   (280px)        │  │         (flex-1)                │  │    (400px)          │ │
│  │                  │  │                                 │  │                     │ │
│  │  ┌────────────┐  │  │  ┌─────────────────────────┐   │  │  ┌───────────────┐  │ │
│  │  │ DEAL CARD  │  │  │  │    QUICK ACTIONS BAR    │   │  │  │  💬 AI CHAT   │  │ │
│  │  │            │  │  │  │                         │   │  │  │               │  │ │
│  │  │ Stage:     │  │  │  │ [📞 Call] [✉️ Email]   │   │  │  │  Ask Claude   │  │ │
│  │  │ [Proposal▼]│  │  │  │ [📅 Meet] [📝 Note]    │   │  │  │  about this   │  │ │
│  │  │            │  │  │  │ [✅ Task] [📋 Brief]   │   │  │  │  deal...      │  │ │
│  │  │ ARR: $45K  │  │  │  └─────────────────────────┘   │  │  │               │  │ │
│  │  │ Team: 4    │  │  │                                 │  │  │  ─────────────│  │ │
│  │  │ Close: Jan │  │  │  ┌─────────────────────────┐   │  │  │               │  │ │
│  │  └────────────┘  │  │  │   ACTIVITY TIMELINE     │   │  │  │  [User msg]   │  │ │
│  │                  │  │  │                         │   │  │  │               │  │ │
│  │  ┌────────────┐  │  │  │  ▼ Upcoming             │   │  │  │  [AI reply]   │  │ │
│  │  │ ABOUT      │  │  │  │  ┌───────────────────┐  │   │  │  │               │  │ │
│  │  │            │  │  │  │  │ ✅ Send deck      │  │   │  │  │               │  │ │
│  │  │ Founder:   │  │  │  │  │    Due: Dec 15    │  │   │  │  └───────────────┘  │ │
│  │  │ Mikaela    │  │  │  │  └───────────────────┘  │   │  │                     │ │
│  │  │            │  │  │  │                         │   │  │  ┌───────────────┐  │ │
│  │  │ Website:   │  │  │  │  ▼ Today                │   │  │  │  📄 ARTIFACT  │  │ │
│  │  │ mytab.app  │  │  │  │  ┌───────────────────┐  │   │  │  │               │  │ │
│  │  │            │  │  │  │  │ 📞 2:30 PM        │  │   │  │  │  Call Prep    │  │ │
│  │  │ Source:    │  │  │  │  │ Call with Mikaela │  │   │  │  │  Brief        │  │ │
│  │  │ LinkedIn   │  │  │  │  │ 45 min · Zoom     │  │   │  │  │               │  │ │
│  │  │            │  │  │  │  │ Outcome: Positive │  │   │  │  │  ───────────  │  │ │
│  │  │ First:     │  │  │  │  │                   │  │   │  │  │  Key Points:  │  │ │
│  │  │ Nov 6      │  │  │  │  │ Discussed pitch   │  │   │  │  │  • Valuation  │  │ │
│  │  └────────────┘  │  │  │  │ revisions and     │  │   │  │  │  • Timeline   │  │ │
│  │                  │  │  │  │ valuation model...│  │   │  │  │  • Next steps │  │ │
│  │  ┌────────────┐  │  │  │  │                   │  │   │  │  │               │  │ │
│  │  │ ASSESSMENT │  │  │  │  │ [View] [Edit]     │  │   │  │  │ [Edit] [Save] │  │ │
│  │  │            │  │  │  │  └───────────────────┘  │   │  │  │ [Export]      │  │ │
│  │  │ ✓ Strong   │  │  │  │                         │   │  │  └───────────────┘  │ │
│  │  │   pitch    │  │  │  │  ▼ This Week            │   │  │                     │ │
│  │  │ ✓ Product  │  │  │  │  ┌───────────────────┐  │   │  │  ┌───────────────┐  │ │
│  │  │   traction │  │  │  │  │ ✉️ Dec 11         │  │   │  │  │ 💡 SUGGESTED  │  │ │
│  │  │            │  │  │  │  │ Email: Deck sent  │  │   │  │  │    ACTIONS    │  │ │
│  │  │ ✗ Unit     │  │  │  │  │ Outbound          │  │   │  │  │               │  │ │
│  │  │   economics│  │  │  │  └───────────────────┘  │   │  │  │ • Schedule    │  │ │
│  │  │            │  │  │  │  ┌───────────────────┐  │   │  │  │   follow-up   │  │ │
│  │  │ ⚠️ No term │  │  │  │  │ 📅 Dec 10         │  │   │  │  │   call        │  │ │
│  │  │   sheet    │  │  │  │  │ Meeting: Pitch    │  │   │  │  │               │  │ │
│  │  └────────────┘  │  │  │  │ practice session  │  │   │  │  │ • Send VC     │  │ │
│  │                  │  │  │  │ 63 min · Zoom     │  │   │  │  │   intro email │  │ │
│  │  ┌────────────┐  │  │  │  │                   │  │   │  │  │               │  │ │
│  │  │ CONTACTS   │  │  │  │  │ [View details]    │  │   │  │  │ • Review ARR  │  │ │
│  │  │            │  │  │  │  └───────────────────┘  │   │  │  │   projections │  │ │
│  │  │ 👤 Mikaela │  │  │  │                         │   │  │  │               │  │ │
│  │  │   Founder  │  │  │  │  ▼ Earlier              │   │  │  │ [Do it →]     │  │ │
│  │  │   ✉️ 📞    │  │  │  │  ┌───────────────────┐  │   │  │  └───────────────┘  │ │
│  │  │            │  │  │  │  │ ...more items...  │  │   │  │                     │ │
│  │  │ [+ Add]    │  │  │  │  └───────────────────┘  │   │  │                     │ │
│  │  └────────────┘  │  │  │                         │   │  │                     │ │
│  │                  │  │  └─────────────────────────┘   │  │                     │ │
│  │  ┌────────────┐  │  │                                 │  │                     │ │
│  │  │ FILES      │  │  │  ┌─────────────────────────┐   │  │                     │ │
│  │  │            │  │  │  │    STAGE HISTORY        │   │  │                     │ │
│  │  │ 📁 Meetings│  │  │  │                         │   │  │                     │ │
│  │  │ 📁 Comms   │  │  │  │ ● Proposal ←── Now      │   │  │                     │ │
│  │  │ 📁 Docs    │  │  │  │ ○ Relationship (Dec 2)  │   │  │                     │ │
│  │  │            │  │  │  │ ○ Deep Dive (Nov 10)    │   │  │                     │ │
│  │  │ [Browse]   │  │  │  │ ○ Triage (Nov 6)        │   │  │                     │ │
│  │  └────────────┘  │  │  │ ○ New (Nov 6)           │   │  │                     │ │
│  │                  │  │  └─────────────────────────┘   │  │                     │ │
│  │                  │  │                                 │  │                     │ │
│  └──────────────────┘  └─────────────────────────────────┘  └─────────────────────┘ │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Panel Specifications

**Left Panel (280px fixed)**
- Deal Card: Stage selector, ARR, team size, close date
- About: Founder, website, lead source, first contact
- Assessment: Strengths (green ✓), weaknesses (orange ✗), red flags (⚠️)
- Contacts: Associated people with roles
- Files: Folder browser for deal documents

**Middle Panel (flex-1, minimum 400px)**
- Quick Actions Bar: Activity logging buttons
- Activity Timeline: Chronological feed with grouping
- Stage History: Visual progression through pipeline

**Right Panel (400px fixed, collapsible)**
- AI Chat: Contextual conversation about the deal
- Artifacts: Generated documents (briefs, emails, summaries)
- Suggested Actions: AI-recommended next steps
- Deal Health: Engagement, momentum, risk scores

---

## Quick Actions Bar

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              QUICK ACTIONS BAR                                       │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │                                                                             │    │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐     │    │
│  │  │  📞       │ │  ✉️       │ │  📅       │ │  📝       │ │  ✅       │     │    │
│  │  │  Log      │ │  Log      │ │  Log      │ │  Add      │ │  Add      │     │    │
│  │  │  Call     │ │  Email    │ │  Meeting  │ │  Note     │ │  Task     │     │    │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘     │    │
│  │                                                                             │    │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────────────────────┐   │    │
│  │  │  📋       │ │  📊       │ │  ↗️       │ │  🔍 Search activities...  │   │    │
│  │  │  Prep     │ │  Update   │ │  Move     │ │                           │   │    │
│  │  │  Brief    │ │  Stage    │ │  Stage    │ └───────────────────────────┘   │    │
│  │  └───────────┘ └───────────┘ └───────────┘                                 │    │
│  │                                                                             │    │
│  │  Filter: [All ▼] [Calls ○] [Emails ○] [Meetings ○] [Notes ○] [Tasks ○]    │    │
│  │                                                                             │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
│  QUICK ACTION BEHAVIORS:                                                             │
│                                                                                      │
│  📞 Log Call     → Opens activity modal with call fields pre-selected               │
│  ✉️ Log Email    → Opens activity modal with email fields pre-selected              │
│  📅 Log Meeting  → Opens activity modal with meeting fields pre-selected            │
│  📝 Add Note     → Opens quick note input (inline or modal)                         │
│  ✅ Add Task     → Opens task creation modal with deal context                      │
│  📋 Prep Brief   → Triggers AI to generate call prep artifact                       │
│  📊 Update Stage → Opens stage selector dropdown                                    │
│  ↗️ Move Stage   → Drag handle or opens stage picker                                │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Activity Card Designs

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                            ACTIVITY CARD VARIANTS                                    │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  CALL ACTIVITY                                                                       │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │ 📞 Call with Mikaela Greene                          Dec 13, 2025 · 2:30 PM │    │
│  │ ───────────────────────────────────────────────────────────────────────────  │    │
│  │ Duration: 45 min  │  Channel: Zoom  │  Outcome: ✓ Positive                  │    │
│  │                                                                             │    │
│  │ Discussed pitch deck revisions and valuation model. Mikaela presented      │    │
│  │ updated projections. Agreed to schedule follow-up after VC feedback.       │    │
│  │                                                                             │    │
│  │ Action Items:                                                               │    │
│  │ ☐ Send revised deck by Friday → Mikaela                                    │    │
│  │ ☑ Share VC contact list → Me (completed)                                   │    │
│  │                                                                             │    │
│  │                                        [📎 Attach] [✏️ Edit] [🗑️ Delete]   │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
│  EMAIL ACTIVITY                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │ ✉️ Email: Deck review and feedback                   Dec 11, 2025 · 4:15 PM │    │
│  │ ───────────────────────────────────────────────────────────────────────────  │    │
│  │ Direction: Outbound  │  To: Mikaela Greene                                  │    │
│  │                                                                             │    │
│  │ Sent detailed feedback on investor deck. Highlighted strengths in          │    │
│  │ product demo section. Requested clarification on unit economics and        │    │
│  │ customer acquisition costs.                                                 │    │
│  │                                                                             │    │
│  │                                        [📎 Attach] [✏️ Edit] [🗑️ Delete]   │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
│  MEETING ACTIVITY                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │ 📅 Pitch Practice Session                            Dec 10, 2025 · 3:00 PM │    │
│  │ ───────────────────────────────────────────────────────────────────────────  │    │
│  │ Duration: 63 min  │  Channel: Zoom  │  Attendees: 2                         │    │
│  │                                                                             │    │
│  │ Full pitch deck review with live app demo. Strong presentation style.      │    │
│  │ Identified valuation mismatch - recommended WA-first geographic focus.     │    │
│  │ Offered to forward deck to VC contacts.                                     │    │
│  │                                                                             │    │
│  │ 📄 Linked File: /Meetings/2025-12-10-pitch-practice.md                      │    │
│  │                                                                             │    │
│  │                                        [📎 Attach] [✏️ Edit] [🗑️ Delete]   │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
│  NOTE ACTIVITY                                                                       │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │ 📝 Note                                              Dec 8, 2025 · 10:22 AM │    │
│  │ ───────────────────────────────────────────────────────────────────────────  │    │
│  │ Competitor analysis: TabSquare just raised Series B at $40M valuation.     │    │
│  │ MyTab differentiates on NFC ordering and venue analytics. Should discuss   │    │
│  │ competitive positioning in next call.                                       │    │
│  │                                                                             │    │
│  │                                        [📎 Attach] [✏️ Edit] [🗑️ Delete]   │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
│  TASK ACTIVITY                                                                       │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │ ✅ Send VC intro email for Mikaela                   Due: Dec 15, 2025      │    │
│  │ ───────────────────────────────────────────────────────────────────────────  │    │
│  │ Status: ○ Pending  │  Owner: Me  │  Priority: High                          │    │
│  │                                                                             │    │
│  │ Draft intro email to Sarah at Purpose Ventures. Include deck link and      │    │
│  │ highlight traction metrics.                                                 │    │
│  │                                                                             │    │
│  │                              [✓ Complete] [📅 Reschedule] [✏️ Edit]         │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## AI Panel Design

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                               AI PANEL (RIGHT SIDE)                                  │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │  💬 AI ASSISTANT                                              [Minimize ─]  │    │
│  │  ─────────────────────────────────────────────────────────────────────────  │    │
│  │                                                                             │    │
│  │  ┌─────────────────────────────────────────────────────────────────────┐   │    │
│  │  │ 👤 You                                                    10:30 AM  │   │    │
│  │  │                                                                     │   │    │
│  │  │ Prep me for my call with Mikaela this afternoon                    │   │    │
│  │  └─────────────────────────────────────────────────────────────────────┘   │    │
│  │                                                                             │    │
│  │  ┌─────────────────────────────────────────────────────────────────────┐   │    │
│  │  │ 🤖 Claude                                                 10:30 AM  │   │    │
│  │  │                                                                     │   │    │
│  │  │ I've prepared a call brief for your meeting with Mikaela:         │   │    │
│  │  │                                                                     │   │    │
│  │  │ **Key Context:**                                                   │   │    │
│  │  │ • Last call Dec 10 - pitch practice, went well                    │   │    │
│  │  │ • Open item: Unit economics clarity needed                        │   │    │
│  │  │ • She's pitching Purpose Ventures on Dec 18                       │   │    │
│  │  │                                                                     │   │    │
│  │  │ **Suggested Topics:**                                              │   │    │
│  │  │ 1. Review updated financial projections                           │   │    │
│  │  │ 2. Discuss valuation expectations                                 │   │    │
│  │  │ 3. Prep for VC Q&A on CAC/LTV                                     │   │    │
│  │  │                                                                     │   │    │
│  │  │ **Red Flags to Address:**                                          │   │    │
│  │  │ • No term sheet yet despite advanced discussions                  │   │    │
│  │  │ • Unit economics story needs tightening                           │   │    │
│  │  │                                                                     │   │    │
│  │  │ I've created this as an artifact you can edit:                    │   │    │
│  │  │                                    [📋 Open Brief →]               │   │    │
│  │  └─────────────────────────────────────────────────────────────────────┘   │    │
│  │                                                                             │    │
│  │  ┌─────────────────────────────────────────────────────────────────────┐   │    │
│  │  │ Type a message...                                      [Send →]    │   │    │
│  │  └─────────────────────────────────────────────────────────────────────┘   │    │
│  │                                                                             │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │  📄 ARTIFACTS                                                [+ New]        │    │
│  │  ─────────────────────────────────────────────────────────────────────────  │    │
│  │                                                                             │    │
│  │  ┌─────────────────────────────────────────────────────────────────────┐   │    │
│  │  │  📋 Call Prep Brief - Dec 13                              [Active] │   │    │
│  │  │  ─────────────────────────────────────────────────────────────────  │   │    │
│  │  │                                                                     │   │    │
│  │  │  # Call Prep: Mikaela Greene                                       │   │    │
│  │  │  **Date:** Dec 13, 2025, 2:30 PM                                   │   │    │
│  │  │  **Duration:** ~45 min expected                                    │   │    │
│  │  │                                                                     │   │    │
│  │  │  ## Key Context                                                    │   │    │
│  │  │  - Last interaction: Dec 10 pitch practice (positive)             │   │    │
│  │  │  - Upcoming: Purpose Ventures pitch Dec 18                        │   │    │
│  │  │  - Deal stage: Proposal                                           │   │    │
│  │  │                                                                     │   │    │
│  │  │  ## Agenda Items                                                   │   │    │
│  │  │  1. [ ] Review updated projections                                │   │    │
│  │  │  2. [ ] Discuss valuation expectations                            │   │    │
│  │  │  3. [ ] Prep VC Q&A responses                                     │   │    │
│  │  │                                                                     │   │    │
│  │  │  ## Questions to Ask                                               │   │    │
│  │  │  - What's your target raise amount now?                           │   │    │
│  │  │  - Any updates on WA venue pipeline?                              │   │    │
│  │  │                                                                     │   │    │
│  │  │  ─────────────────────────────────────────────────────────────────  │   │    │
│  │  │  [✏️ Edit] [💾 Save to Files] [📤 Export] [🗑️ Discard]            │   │    │
│  │  └─────────────────────────────────────────────────────────────────────┘   │    │
│  │                                                                             │    │
│  │  ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐       │    │
│  │  │ 📧 Draft Email    │  │ 📊 Deal Summary   │  │ 📝 Meeting Notes  │       │    │
│  │  │ Dec 12            │  │ Dec 10            │  │ Dec 10            │       │    │
│  │  └───────────────────┘  └───────────────────┘  └───────────────────┘       │    │
│  │                                                                             │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │  💡 SUGGESTED ACTIONS                                                       │    │
│  │  ─────────────────────────────────────────────────────────────────────────  │    │
│  │                                                                             │    │
│  │  Based on deal activity, I suggest:                                        │    │
│  │                                                                             │    │
│  │  ┌─────────────────────────────────────────────────────────────────────┐   │    │
│  │  │ 🎯 HIGH PRIORITY                                                    │   │    │
│  │  │                                                                     │   │    │
│  │  │ • Schedule follow-up call post-Purpose Ventures pitch              │   │    │
│  │  │   It's been 3 days since last contact                             │   │    │
│  │  │                                           [📅 Schedule →]          │   │    │
│  │  │                                                                     │   │    │
│  │  │ • Draft VC intro email to Sarah @ Purpose Ventures                 │   │    │
│  │  │   Mikaela mentioned needing warm intros                            │   │    │
│  │  │                                           [✉️ Draft Email →]       │   │    │
│  │  └─────────────────────────────────────────────────────────────────────┘   │    │
│  │                                                                             │    │
│  │  ┌─────────────────────────────────────────────────────────────────────┐   │    │
│  │  │ 📊 DEAL HEALTH                                                      │   │    │
│  │  │                                                                     │   │    │
│  │  │ Engagement:  ████████░░ 80%  (Active)                              │   │    │
│  │  │ Momentum:    ██████░░░░ 60%  (Watch)                               │   │    │
│  │  │ Risk Level:  ████░░░░░░ 40%  (Moderate)                            │   │    │
│  │  │                                                                     │   │    │
│  │  │ ⚠️ Valuation gap identified - discuss early in next call          │   │    │
│  │  └─────────────────────────────────────────────────────────────────────┘   │    │
│  │                                                                             │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Activity Logging Workflow

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         ACTIVITY LOGGING WORKFLOW                                    │
└─────────────────────────────────────────────────────────────────────────────────────┘

  USER TRIGGER                    FORM FLOW                      DATA FLOW
  ───────────────────────────────────────────────────────────────────────────────────

  ┌─────────────────┐
  │ Quick Action    │
  │ Button Click    │
  │ (📞 Log Call)   │
  └────────┬────────┘
           │
           ▼
  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │                           ACTIVITY FORM MODAL                                    │
  │                                                                                  │
  │   Activity Type: [Call ▼]  ← Pre-selected based on button                       │
  │                                                                                  │
  │   ┌─────────────────────────────────────────────────────────────────────────┐   │
  │   │                          SMART DEFAULTS                                 │   │
  │   │                                                                         │   │
  │   │  Date: [Today ▼]        ← Defaults to today                            │   │
  │   │  Time: [Now ▼]          ← Defaults to current time                     │   │
  │   │  Duration: [30 min ▼]   ← Based on average for this deal               │   │
  │   │  Channel: [Zoom ▼]      ← Based on previous calls with contact         │   │
  │   │  Attendees: [Mikaela]   ← Auto-suggested from deal contacts            │   │
  │   │                                                                         │   │
  │   └─────────────────────────────────────────────────────────────────────────┘   │
  │                                                                                  │
  │   ┌─────────────────────────────────────────────────────────────────────────┐   │
  │   │                         SUMMARY INPUT                                   │   │
  │   │                                                                         │   │
  │   │  ┌───────────────────────────────────────────────────────────────────┐ │   │
  │   │  │                                                                   │ │   │
  │   │  │ [Type summary here or paste meeting transcript...]               │ │   │
  │   │  │                                                                   │ │   │
  │   │  │                                                                   │ │   │
  │   │  └───────────────────────────────────────────────────────────────────┘ │   │
  │   │                                                                         │   │
  │   │  [✨ AI Summarize Transcript]  ← Paste long transcript, AI condenses   │   │
  │   │                                                                         │   │
  │   └─────────────────────────────────────────────────────────────────────────┘   │
  │                                                                                  │
  │   ┌─────────────────────────────────────────────────────────────────────────┐   │
  │   │                         OUTCOME & NEXT STEPS                            │   │
  │   │                                                                         │   │
  │   │  Outcome: [Positive ▼] [Neutral ▼] [Negative ▼] [No Answer ▼]          │   │
  │   │                                                                         │   │
  │   │  Action Items:                                                          │   │
  │   │  ┌───────────────────────────────────────────────────────────────────┐ │   │
  │   │  │ ☐ [Action item text]    Owner: [Me ▼]    Due: [Dec 15 ▼]         │ │   │
  │   │  │ ☐ [Action item text]    Owner: [Them ▼]  Due: [Dec 18 ▼]         │ │   │
  │   │  │ [+ Add action item]                                               │ │   │
  │   │  └───────────────────────────────────────────────────────────────────┘ │   │
  │   │                                                                         │   │
  │   │  [ ] Create follow-up task reminder                                    │   │
  │   │                                                                         │   │
  │   └─────────────────────────────────────────────────────────────────────────┘   │
  │                                                                                  │
  │                                    [Cancel]  [Save Activity]                     │
  │                                                                                  │
  └─────────────────────────────────────────────────────────────────────────────────┘
           │
           ▼
  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │                              ON SAVE                                             │
  │                                                                                  │
  │   ┌─────────────────┐                                                           │
  │   │  1. DATABASE    │  Create activity record in activities table              │
  │   │     WRITE       │  • id, project_id, type, date, duration, channel,        │
  │   │                 │    attendees, summary, outcome                           │
  │   └────────┬────────┘                                                           │
  │            │                                                                     │
  │            ▼                                                                     │
  │   ┌─────────────────┐                                                           │
  │   │  2. FILE        │  Append to master doc section:                           │
  │   │     SYNC        │  • Add row to Communications Log table                   │
  │   │                 │  • OR create new file in Meetings/ folder                │
  │   └────────┬────────┘                                                           │
  │            │                                                                     │
  │            ▼                                                                     │
  │   ┌─────────────────┐                                                           │
  │   │  3. ACTION      │  Create task records for each action item               │
  │   │     ITEMS       │  • Linked to activity and deal                          │
  │   │                 │  • Due dates and owners set                              │
  │   └────────┬────────┘                                                           │
  │            │                                                                     │
  │            ▼                                                                     │
  │   ┌─────────────────┐                                                           │
  │   │  4. TIMELINE    │  UI immediately updates:                                 │
  │   │     UPDATE      │  • New card appears in activity feed                    │
  │   │                 │  • Toast confirmation                                    │
  │   └────────┬────────┘                                                           │
  │            │                                                                     │
  │            ▼                                                                     │
  │   ┌─────────────────┐                                                           │
  │   │  5. AI          │  Update AI context:                                      │
  │   │     CONTEXT     │  • New activity available for search                    │
  │   │                 │  • Suggested actions recalculate                        │
  │   └─────────────────┘                                                           │
  │                                                                                  │
  └─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Model Additions

### Activities Table

```sql
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),

  -- Activity Type
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'call', 'email', 'meeting', 'note', 'message', 'linkedin', 'task_completed'
  )),

  -- Core Fields
  title TEXT,
  activity_date TIMESTAMPTZ NOT NULL,
  duration_mins INTEGER,

  -- Channel & Direction
  channel TEXT CHECK (channel IN (
    'zoom', 'phone', 'email', 'whatsapp', 'linkedin', 'in_person', 'slack'
  )),
  direction TEXT CHECK (direction IN ('inbound', 'outbound')),

  -- Outcome
  outcome TEXT CHECK (outcome IN (
    'positive', 'neutral', 'negative', 'no_answer', 'left_message'
  )),

  -- Content
  attendees JSONB DEFAULT '[]',  -- [{name, role, email?}]
  summary TEXT,
  next_steps TEXT,

  -- Linkage
  linked_file TEXT,  -- Path to meeting notes file
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX activities_project_id_idx ON activities(project_id);
CREATE INDEX activities_date_idx ON activities(activity_date DESC);
CREATE INDEX activities_type_idx ON activities(activity_type);
```

### Action Items Table

```sql
CREATE TABLE action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES activities(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id),

  -- Core Fields
  title TEXT NOT NULL,
  description TEXT,

  -- Assignment
  owner TEXT,  -- Name: "Me", "Mikaela", etc.
  owner_type TEXT CHECK (owner_type IN ('me', 'them', 'shared')),

  -- Scheduling
  due_date DATE,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',

  -- Status
  status TEXT CHECK (status IN (
    'pending', 'in_progress', 'completed', 'blocked', 'cancelled'
  )) DEFAULT 'pending',
  completed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX action_items_project_id_idx ON action_items(project_id);
CREATE INDEX action_items_status_idx ON action_items(status);
CREATE INDEX action_items_due_date_idx ON action_items(due_date);
```

### Contacts Table

```sql
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),

  -- Core Fields
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  linkedin_url TEXT,

  -- Company Info
  company TEXT,
  role TEXT,  -- "Founder", "CTO", etc.

  -- Notes
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Junction table for project-contact relationships
CREATE TABLE project_contacts (
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,

  -- Relationship
  relationship TEXT CHECK (relationship IN ('primary', 'secondary', 'stakeholder')),
  role_in_deal TEXT,  -- "Decision Maker", "Technical Lead", etc.

  created_at TIMESTAMPTZ DEFAULT now(),

  PRIMARY KEY (project_id, contact_id)
);
```

---

## AI-Powered Features

### 1. Next Best Action Suggestions

**Based on:**
- Days since last activity
- Open action items past due
- Deal stage and typical stage duration
- Upcoming events (meetings, deadlines)
- Pattern matching from successful deals

**Example suggestions:**
```
🎯 "Schedule follow-up call - it's been 5 days since last contact"
⚠️ "Review valuation gap before next meeting - mentioned as concern"
📧 "Send VC intro email - Mikaela mentioned needing warm intros"
```

### 2. Activity Summarization

**User pastes raw transcript → AI generates:**
- Concise summary (2-3 sentences)
- Key decisions made
- Action items extracted (with suggested owners)
- Next steps identified
- Red flags or concerns noted

### 3. Call Prep Brief Generation

**User clicks "📋 Prep Brief" → AI generates:**

```markdown
# Call Prep: [Contact Name]

## Key Context
- Last interaction summary
- Current deal stage and duration
- Open action items

## Suggested Agenda
1. [Topic based on open items]
2. [Topic based on deal stage]
3. [Topic based on timeline]

## Questions to Ask
- [AI-generated based on gaps in knowledge]

## Red Flags to Address
- [From deal assessment]
```

### 4. Deal Health Scoring

**AI calculates scores based on:**

**Engagement Score (0-100):**
- Activity frequency vs. expected for stage
- Response times
- Bi-directional communication

**Momentum Score (0-100):**
- Days in current stage vs. average
- Action item completion rate
- Stage progression velocity

**Risk Score (0-100):**
- Red flags count and severity
- Negative outcomes in recent activities
- Missing critical information

```
Engagement:  ████████░░ 80%  (Healthy)
Momentum:    ██████░░░░ 60%  (Watch)
Risk:        ████░░░░░░ 40%  (Moderate)
```

### 5. Conversational Deal Queries

**Natural language queries about the deal:**

| Query | Response |
|-------|----------|
| "When did we last talk to Mikaela?" | "Your last call with Mikaela was Dec 10 (3 days ago). You discussed pitch practice and agreed to review unit economics." |
| "What are the open action items?" | Lists action items with owners and due dates |
| "Draft a follow-up email to Mikaela" | Generates email draft as artifact |
| "What's blocking this deal?" | Analyzes red flags, stale items, and gaps |

---

## Navigation Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         NAVIGATION ARCHITECTURE                                      │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│                              ┌───────────────┐                                       │
│                              │   HOME (/)    │                                       │
│                              │   Chat + AI   │                                       │
│                              └───────┬───────┘                                       │
│                                      │                                               │
│              ┌───────────────────────┼───────────────────────┐                      │
│              │                       │                       │                      │
│              ▼                       ▼                       ▼                      │
│     ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐              │
│     │   /deals        │    │ /deals/[id]     │    │ /deals/[id]/    │              │
│     │   Pipeline      │    │ Workspace       │    │ workspace       │              │
│     │   (Kanban)      │    │ (Full View)     │    │ (Alternative)   │              │
│     └────────┬────────┘    └────────┬────────┘    └─────────────────┘              │
│              │                      │                                               │
│              │      ┌───────────────┴───────────────┐                              │
│              │      │                               │                              │
│              ▼      ▼                               ▼                              │
│     ┌─────────────────────────────────────────────────────────────────┐            │
│     │                      DEAL WORKSPACE                              │            │
│     │                                                                  │            │
│     │   ┌─────────┐  ┌─────────────────────┐  ┌─────────────────┐    │            │
│     │   │  Left   │  │      Middle         │  │     Right       │    │            │
│     │   │  Panel  │  │      Panel          │  │     Panel       │    │            │
│     │   └─────────┘  └─────────────────────┘  └─────────────────┘    │            │
│     │                                                                  │            │
│     └─────────────────────────────────────────────────────────────────┘            │
│                                                                                      │
│  ENTRY POINTS TO WORKSPACE:                                                          │
│                                                                                      │
│  1. SIDEBAR DRILL-DOWN                                                               │
│     Sidebar → Deals → Click Deal → Detail View                                      │
│     [Currently: shows chats + files]                                                │
│     [Proposed: opens full workspace OR quick preview]                               │
│                                                                                      │
│  2. KANBAN CARD CLICK                                                                │
│     /deals → Click Card → Opens Workspace                                           │
│     [Currently: opens DealProfile page]                                             │
│     [Proposed: opens full workspace with activity focus]                            │
│                                                                                      │
│  3. CHAT COMMAND                                                                     │
│     Home → "Work on MyTab deal" → AI suggests opening workspace                     │
│     [Currently: not implemented]                                                    │
│     [Proposed: intent detection + mode switch suggestion]                           │
│                                                                                      │
│  4. DIRECT URL                                                                       │
│     /deals/[id] → Full workspace view                                               │
│     [Currently: DealProfile component]                                              │
│     [Proposed: new DealWorkspace component]                                         │
│                                                                                      │
│  5. QUICK PREVIEW (HubSpot-style)                                                    │
│     Hover on deal in sidebar/kanban → Preview panel                                 │
│     Click "Open" → Full workspace                                                   │
│     [Currently: not implemented]                                                    │
│     [Proposed: lightweight preview with key info]                                   │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

- [ ] Database: Create activities table
- [ ] Database: Create action_items table
- [ ] Database: Create contacts table + project_contacts junction
- [ ] API: POST /api/deals/[id]/activities
- [ ] API: GET /api/deals/[id]/activities
- [ ] API: GET /api/deals/[id]/timeline (merged activities + stage history)
- [ ] API: CRUD for action items
- [ ] Migration: Parse existing activities from master docs → database

### Phase 2: Activity Logging UI (Week 2-3)

- [ ] Component: ActivityFormModal (log call/email/meeting/note)
- [ ] Component: ActivityCard (display individual activity)
- [ ] Component: ActivityTimeline (chronological feed)
- [ ] Component: ActionItemsList (with checkboxes)
- [ ] Component: QuickActionsBar
- [ ] Integration: Add quick actions to existing DealProfile
- [ ] Integration: File sync - append to master doc on activity save

### Phase 3: Deal Workspace Layout (Week 3-4)

- [ ] Component: DealWorkspace (3-column layout)
- [ ] Component: DealSidebar (left panel - properties, contacts, files)
- [ ] Component: DealTimeline (middle panel - activities)
- [ ] Component: DealAIPanel (right panel - chat + artifacts)
- [ ] Route: Update /deals/[id] to use new workspace
- [ ] Navigation: Update sidebar drill-down to open workspace
- [ ] Navigation: Update kanban card click to open workspace

### Phase 4: AI Features (Week 4-5)

- [ ] Tool: summarize_activity (transcript → structured summary)
- [ ] Tool: generate_call_prep (deal context → prep brief artifact)
- [ ] Tool: suggest_next_actions (deal analysis → recommendations)
- [ ] Component: SuggestedActions card
- [ ] Component: DealHealthScore visualization
- [ ] Component: Artifact editor with save/export
- [ ] Integration: Artifacts persist to deal files

### Phase 5: Polish & Advanced (Week 5-6)

- [ ] Feature: Contacts management (add/edit contacts per deal)
- [ ] Feature: Activity search and filtering
- [ ] Feature: Inline property editing (stage, ARR, close date)
- [ ] Feature: Stage history visualization
- [ ] Feature: Deal preview on hover (kanban/sidebar)
- [ ] Feature: Mobile-responsive workspace
- [ ] Feature: Keyboard shortcuts for quick actions
- [ ] Feature: Intent detection for "work on [deal]" commands

---

## Key Design Decisions

| Decision | Recommendation | Rationale |
|----------|---------------|-----------|
| **Layout** | 3-column (HubSpot-inspired) | Proven pattern, separates concerns |
| **Activity Storage** | Database + file sync | Real-time queries + file-based audit trail |
| **AI Position** | Right panel, always visible | AI is central to value prop, not hidden |
| **Artifacts** | Editable, saveable documents | Transforms chat outputs into work products |
| **Quick Actions** | Toolbar above timeline | Reduces friction for common tasks |
| **Suggested Actions** | AI-generated, prominent | Differentiator from traditional CRMs |
| **File Sync** | Dual-write to DB and files | Maintains master doc as source of truth |
| **Contacts** | Separate entity, linked to deals | Enables relationship tracking across deals |
| **Entry Points** | Multiple (sidebar, kanban, chat, URL) | Meet users where they are |

---

## Sync Architecture: Bridging Local Files and Cloud

### The Core Problem

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              THE ARCHITECTURE CHALLENGE                              │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│   ┌───────────────────────────┐              ┌───────────────────────────┐          │
│   │                           │              │                           │          │
│   │    LOCAL FILESYSTEM       │      ✗      │     BOBO WEB APP          │          │
│   │                           │   NO ACCESS  │                           │          │
│   │  ~/Deals/                 │◄────────────►│  vercel.app               │          │
│   │  ├── MyTab/               │              │                           │          │
│   │  │   ├── master-doc.md    │              │  Browser-based            │          │
│   │  │   ├── Meetings/        │              │  No filesystem access     │          │
│   │  │   ├── Comms/           │              │  (security sandbox)       │          │
│   │  │   └── _Inbox/          │              │                           │          │
│   │  └── ...                  │              │                           │          │
│   │                           │              │                           │          │
│   └───────────────────────────┘              └───────────────────────────┘          │
│                                                                                      │
│   CURRENT WORKFLOW:                          DESIRED WORKFLOW:                       │
│                                                                                      │
│   1. Drop files into _Inbox                  • Work from Bobo UI directly           │
│   2. Chat with Claude Code                   • Upload files to Bobo                 │
│   3. Claude Code updates master-doc          • AI processes in browser              │
│   4. Claude Code moves processed files       • Changes sync back to local           │
│   5. Files always up-to-date locally         • Files always up-to-date              │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

**Key Constraint:** Bobo is a web application running in a browser. Browsers cannot access the local filesystem for security reasons. Yet the user wants to:

1. Continue using Claude Code with local files (short-to-medium term)
2. Gradually transition to Bobo UI for deal workflows
3. Keep both workflows in sync during the transition
4. Eventually move fully to Bobo once proven

---

### The Solution: Local Sync Agent + Cloud Bridge

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           THE BRIDGE ARCHITECTURE                                    │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│                        ┌─────────────────────────────┐                              │
│                        │     SUPABASE (CLOUD)        │                              │
│                        │                             │                              │
│                        │  ┌───────────────────────┐  │                              │
│                        │  │  Database             │  │                              │
│                        │  │  • deal_files table   │  │                              │
│                        │  │  • activities table   │  │                              │
│                        │  │  • inbox_items table  │  │                              │
│                        │  └───────────────────────┘  │                              │
│                        │                             │                              │
│                        │  ┌───────────────────────┐  │                              │
│                        │  │  Storage Bucket       │  │                              │
│                        │  │  • Binary files       │  │                              │
│                        │  │  • Screenshots        │  │                              │
│                        │  │  • PDFs               │  │                              │
│                        │  └───────────────────────┘  │                              │
│                        │                             │                              │
│                        └──────────────┬──────────────┘                              │
│                                       │                                              │
│                                       │ API / Realtime                               │
│                                       │                                              │
│        ┌──────────────────────────────┼──────────────────────────────┐              │
│        │                              │                              │              │
│        ▼                              ▼                              ▼              │
│   ┌─────────────────┐          ┌─────────────────┐          ┌─────────────────┐    │
│   │  LOCAL SYNC     │          │   BOBO WEB      │          │   MOBILE APP    │    │
│   │  AGENT (CLI)    │          │   (Browser)     │          │   (Future)      │    │
│   │                 │          │                 │          │                 │    │
│   │  Has filesystem │          │  No filesystem  │          │  No filesystem  │    │
│   │  access         │          │  access         │          │  access         │    │
│   │                 │          │                 │          │                 │    │
│   │  bobo sync      │          │  File upload    │          │  Photo upload   │    │
│   │  push / pull    │          │  AI processing  │          │  Voice notes    │    │
│   │                 │          │                 │          │                 │    │
│   └────────┬────────┘          └─────────────────┘          └─────────────────┘    │
│            │                                                                        │
│            ▼                                                                        │
│   ┌─────────────────────────────────────────────────────────────────────────────┐  │
│   │                         LOCAL FILESYSTEM                                     │  │
│   │                                                                              │  │
│   │  ~/Deals/MyTab/                                                             │  │
│   │  ├── master-doc-mytab.md     ← Sync agent reads/writes this                 │  │
│   │  ├── Meetings/               ← Sync agent reads/writes here                 │  │
│   │  │   └── 2025-12-10-pitch.md                                                │  │
│   │  ├── Comms/                  ← Sync agent reads/writes here                 │  │
│   │  │   └── email-log.md                                                       │  │
│   │  └── _Inbox/                 ← Sync agent processes this                    │  │
│   │      └── screenshot.png                                                      │  │
│   │                                                                              │  │
│   └─────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

### Complete Data Flow Diagrams

#### Workflow A: Claude Code (Local-First)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                    WORKFLOW A: CLAUDE CODE (LOCAL-FIRST)                             │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  User drops files          Claude Code            Files updated         Push to     │
│  into _Inbox               processes              locally               Cloud       │
│                                                                                      │
│  ┌─────────────┐          ┌─────────────┐        ┌─────────────┐       ┌──────────┐│
│  │  _Inbox/    │          │  Claude     │        │  ~/Deals/   │       │ Supabase ││
│  │             │─────────►│  Code       │───────►│  MyTab/     │──────►│          ││
│  │  • screenshot│ "Process │             │ Updates │  master-doc │ bobo  │ Database ││
│  │  • transcript│  inbox"  │  Reads all  │ files   │  Meetings/  │ sync  │ + Storage││
│  │  • email    │          │  context    │         │  Comms/     │ push  │          ││
│  └─────────────┘          └─────────────┘        └─────────────┘       └──────────┘│
│                                                                                      │
│  DETAILS:                                                                            │
│                                                                                      │
│  1. User drops files into ~/Deals/MyTab/_Inbox/                                     │
│     • Screenshots of WhatsApp messages                                              │
│     • Email screenshots or exports                                                  │
│     • Meeting transcripts                                                           │
│     • Any documents for processing                                                  │
│                                                                                      │
│  2. User opens Claude Code and says:                                                │
│     "Process the inbox for MyTab - update the master doc,                           │
│      extract action items, and move files to correct folders"                       │
│                                                                                      │
│  3. Claude Code (with Vision API for screenshots):                                  │
│     • Reads screenshot → extracts text/data                                         │
│     • Parses transcript → summarizes, extracts action items                         │
│     • Updates master-doc.md with new activity entry                                 │
│     • Moves processed files to Meetings/ or Comms/                                  │
│     • Empties _Inbox/                                                               │
│                                                                                      │
│  4. User runs sync to push changes to cloud:                                        │
│     $ bobo sync push                                                                │
│     • Computes file hashes                                                          │
│     • Uploads changed files to Supabase                                             │
│     • Creates/updates structured activity records                                   │
│                                                                                      │
│  5. Bobo UI now reflects all updates (via Supabase)                                 │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

#### Workflow B: Bobo UI (Cloud-First)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                      WORKFLOW B: BOBO UI (CLOUD-FIRST)                               │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  User uploads            Stored in              AI processes         User syncs     │
│  to Bobo UI              Supabase               and extracts         to local       │
│                                                                                      │
│  ┌─────────────┐        ┌─────────────┐        ┌─────────────┐      ┌─────────────┐│
│  │  Bobo UI    │        │  Supabase   │        │  Claude AI  │      │  ~/Deals/   ││
│  │             │───────►│             │───────►│             │─────►│  MyTab/     ││
│  │  [Drop Zone]│ Upload │  Storage    │ Process│  Extracts   │ bobo │             ││
│  │  • files    │ files  │  + Database │ inbox  │  activities │ sync │  Files      ││
│  │  • images   │        │             │        │  + notes    │ pull │  updated    ││
│  └─────────────┘        └─────────────┘        └─────────────┘      └─────────────┘│
│                                                                                      │
│  DETAILS:                                                                            │
│                                                                                      │
│  1. In Bobo UI deal workspace, user clicks "Upload to Inbox"                        │
│     • Drag & drop files or click to select                                          │
│     • Supports: images, PDFs, transcripts, documents                                │
│                                                                                      │
│  2. Files stored in Supabase:                                                       │
│     • Binary files → Storage bucket                                                 │
│     • Metadata → inbox_items table                                                  │
│     • Status: "pending_processing"                                                  │
│                                                                                      │
│  3. User clicks "Process Inbox" or AI auto-processes:                               │
│     • Claude (via chat) reads inbox items                                           │
│     • Extracts activities, action items, notes                                      │
│     • Creates structured records in activities table                                │
│     • Updates inbox_items status → "processed"                                      │
│     • Generates summary for user review                                             │
│                                                                                      │
│  4. User optionally syncs to local filesystem:                                      │
│     $ bobo sync pull                                                                │
│     • Downloads new activity records                                                │
│     • Appends to master-doc.md                                                      │
│     • Downloads processed files to Meetings/ or Comms/                              │
│     • Local files now match cloud state                                             │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

#### Workflow C: Mixed Mode (Transition Period)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                       WORKFLOW C: MIXED MODE (TRANSITION)                            │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│            MORNING                    AFTERNOON                   EVENING           │
│                                                                                      │
│   ┌─────────────────┐          ┌─────────────────┐          ┌─────────────────┐    │
│   │ Claude Code     │          │ Bobo UI         │          │ Sync            │    │
│   │ (Desktop)       │          │ (Browser)       │          │                 │    │
│   │                 │          │                 │          │                 │    │
│   │ Process meeting │          │ Log quick call  │          │ $ bobo sync     │    │
│   │ transcript from │          │ directly in     │          │                 │    │
│   │ yesterday       │          │ activity form   │          │ Reconciles all  │    │
│   │                 │          │                 │          │ changes         │    │
│   └────────┬────────┘          └────────┬────────┘          └────────┬────────┘    │
│            │                            │                            │             │
│            ▼                            ▼                            ▼             │
│   ┌─────────────────┐          ┌─────────────────┐          ┌─────────────────┐    │
│   │ Local files     │          │ Supabase        │          │ Both in sync    │    │
│   │ updated         │          │ updated         │          │                 │    │
│   │                 │          │                 │          │ Local = Cloud   │    │
│   │ master-doc ✓    │          │ activities ✓    │          │                 │    │
│   └─────────────────┘          └─────────────────┘          └─────────────────┘    │
│                                                                                      │
│  CONFLICT RESOLUTION:                                                                │
│                                                                                      │
│  • Content hashes track file versions                                               │
│  • Last-write-wins with optional merge prompts                                      │
│  • Activities table tracks source: 'local_file' | 'bobo_ui' | 'sync'               │
│  • Audit log preserves all changes for recovery                                     │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

### Supabase Schema Additions for Sync

```sql
-- =============================================================================
-- DEAL FILES TABLE (Sync tracking for master docs and related files)
-- =============================================================================
CREATE TABLE deal_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,

  -- File identification
  file_path TEXT NOT NULL,           -- Relative path: "master-doc-mytab.md"
  file_type TEXT CHECK (file_type IN (
    'master_doc', 'meeting', 'comms', 'artifact', 'document'
  )),

  -- Content storage
  content TEXT,                       -- Full file content (text files)
  content_hash TEXT,                  -- SHA-256 for change detection

  -- Sync status
  sync_status TEXT CHECK (sync_status IN (
    'synced',        -- Local and cloud match
    'local_ahead',   -- Local has newer changes
    'cloud_ahead',   -- Cloud has newer changes
    'conflict'       -- Both changed, needs resolution
  )) DEFAULT 'synced',

  -- Timestamps
  local_modified_at TIMESTAMPTZ,      -- When file changed locally
  cloud_modified_at TIMESTAMPTZ,      -- When record changed in Supabase
  last_synced_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(project_id, file_path)
);

-- =============================================================================
-- INBOX ITEMS TABLE (Files uploaded via Bobo UI for processing)
-- =============================================================================
CREATE TABLE inbox_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),

  -- File metadata
  original_name TEXT NOT NULL,        -- "screenshot-whatsapp.png"
  file_type TEXT,                     -- "image/png", "text/plain", etc.
  file_size INTEGER,

  -- Storage reference
  storage_path TEXT,                  -- Path in Supabase Storage bucket

  -- Processing status
  processing_status TEXT CHECK (processing_status IN (
    'pending',           -- Just uploaded, not processed
    'processing',        -- AI currently processing
    'processed',         -- Successfully extracted data
    'failed',            -- Processing failed
    'archived'           -- Processed and moved to deal files
  )) DEFAULT 'pending',

  -- Extracted data (after AI processing)
  extracted_data JSONB DEFAULT '{}',
  /*
    {
      "type": "meeting_notes" | "email" | "message" | "document",
      "summary": "...",
      "action_items": [...],
      "date_extracted": "2025-12-13",
      "participants": ["Mikaela"],
      "raw_text": "..."
    }
  */

  -- Sync to local
  sync_status TEXT CHECK (sync_status IN (
    'pending',           -- Not yet synced to local
    'synced',            -- Synced to local filesystem
    'not_applicable'     -- E.g., temp files
  )) DEFAULT 'pending',
  synced_to_path TEXT,               -- Where it was synced: "Meetings/2025-12-13-call.md"

  -- Timestamps
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ,
  synced_at TIMESTAMPTZ
);

-- =============================================================================
-- ACTIVITIES TABLE ADDITIONS (Sync tracking fields)
-- =============================================================================
ALTER TABLE activities ADD COLUMN IF NOT EXISTS
  source TEXT CHECK (source IN (
    'local_file',    -- Parsed from local master-doc or meeting file
    'bobo_ui',       -- Created via Bobo UI activity form
    'sync',          -- Created during sync reconciliation
    'ai_extracted'   -- Extracted by AI from inbox item
  )) DEFAULT 'bobo_ui';

ALTER TABLE activities ADD COLUMN IF NOT EXISTS
  synced_to_file BOOLEAN DEFAULT false;  -- Has this been written to master-doc?

ALTER TABLE activities ADD COLUMN IF NOT EXISTS
  source_file TEXT;  -- Reference to originating file: "Meetings/2025-12-13.md"

ALTER TABLE activities ADD COLUMN IF NOT EXISTS
  inbox_item_id UUID REFERENCES inbox_items(id);  -- If extracted from inbox

-- =============================================================================
-- SYNC LOG TABLE (Audit trail for all sync operations)
-- =============================================================================
CREATE TABLE sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  project_id UUID REFERENCES projects(id),

  -- Operation details
  operation TEXT CHECK (operation IN ('push', 'pull', 'conflict_resolve')),
  direction TEXT CHECK (direction IN ('local_to_cloud', 'cloud_to_local')),

  -- What changed
  files_pushed INTEGER DEFAULT 0,
  files_pulled INTEGER DEFAULT 0,
  activities_synced INTEGER DEFAULT 0,
  conflicts_found INTEGER DEFAULT 0,
  conflicts_resolved INTEGER DEFAULT 0,

  -- Status
  status TEXT CHECK (status IN ('success', 'partial', 'failed')),
  error_message TEXT,

  -- Timing
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER
);

-- Indexes for sync queries
CREATE INDEX deal_files_sync_status_idx ON deal_files(sync_status);
CREATE INDEX deal_files_project_path_idx ON deal_files(project_id, file_path);
CREATE INDEX inbox_items_status_idx ON inbox_items(processing_status);
CREATE INDEX inbox_items_project_idx ON inbox_items(project_id);
CREATE INDEX activities_source_idx ON activities(source);
CREATE INDEX sync_log_user_idx ON sync_log(user_id, started_at DESC);
```

---

### The Sync CLI Tool

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              SYNC CLI TOOL DESIGN                                    │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  INSTALLATION:                                                                       │
│                                                                                      │
│    $ npm install -g @bobo/sync-cli                                                  │
│    OR                                                                               │
│    $ npx @bobo/sync-cli [command]                                                   │
│                                                                                      │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│                                                                                      │
│  COMMANDS:                                                                           │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │  $ bobo sync push                                                           │    │
│  │                                                                             │    │
│  │  Pushes local file changes to Supabase.                                    │    │
│  │                                                                             │    │
│  │  1. Scans configured deal folders (~/Deals/*)                              │    │
│  │  2. Computes content hashes for all tracked files                          │    │
│  │  3. Compares with deal_files table in Supabase                             │    │
│  │  4. Uploads files where local_hash != cloud_hash                           │    │
│  │  5. Parses master-docs → creates/updates activity records                  │    │
│  │  6. Reports: "Pushed 3 files, created 2 activities"                        │    │
│  │                                                                             │    │
│  │  Options:                                                                   │    │
│  │    --deal <name>    Only push specific deal                                │    │
│  │    --dry-run        Show what would be pushed without doing it             │    │
│  │    --force          Overwrite cloud even if conflict detected              │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │  $ bobo sync pull                                                           │    │
│  │                                                                             │    │
│  │  Pulls cloud changes to local filesystem.                                  │    │
│  │                                                                             │    │
│  │  1. Fetches deal_files where cloud_modified_at > last_synced_at           │    │
│  │  2. Fetches activities where synced_to_file = false                        │    │
│  │  3. Downloads changed files to local paths                                 │    │
│  │  4. Appends new activities to master-doc Communications Log                │    │
│  │  5. Downloads processed inbox items to appropriate folders                 │    │
│  │  6. Reports: "Pulled 2 files, added 4 activities to master-doc"           │    │
│  │                                                                             │    │
│  │  Options:                                                                   │    │
│  │    --deal <name>    Only pull specific deal                                │    │
│  │    --dry-run        Show what would be pulled without doing it             │    │
│  │    --force          Overwrite local even if conflict detected              │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │  $ bobo sync status                                                         │    │
│  │                                                                             │    │
│  │  Shows sync status for all deals.                                          │    │
│  │                                                                             │    │
│  │  Example output:                                                            │    │
│  │                                                                             │    │
│  │  Deal          Local Status    Cloud Status    Last Sync                   │    │
│  │  ─────────────────────────────────────────────────────────────────────     │    │
│  │  MyTab         ✓ Up to date    ✓ Up to date    2 hours ago                │    │
│  │  SwiftCheckin  ⚠ 2 files ahead ✓ Up to date    1 day ago                  │    │
│  │  ArcheloLab    ✓ Up to date    ⚠ 3 activities  3 days ago                 │    │
│  │                                  pending sync                              │    │
│  │                                                                             │    │
│  │  Run 'bobo sync push' to upload local changes                              │    │
│  │  Run 'bobo sync pull' to download cloud changes                            │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │  $ bobo sync watch                                                          │    │
│  │                                                                             │    │
│  │  Watches for local file changes and auto-syncs.                            │    │
│  │                                                                             │    │
│  │  • Uses chokidar to watch deal folders                                     │    │
│  │  • Debounces changes (waits 5s after last change)                          │    │
│  │  • Auto-pushes when changes detected                                       │    │
│  │  • Polls Supabase every 60s for cloud changes                              │    │
│  │  • Auto-pulls when cloud changes detected                                  │    │
│  │                                                                             │    │
│  │  Options:                                                                   │    │
│  │    --push-only      Only watch and push, don't pull                        │    │
│  │    --pull-only      Only poll and pull, don't push                         │    │
│  │    --interval <ms>  Cloud poll interval (default 60000)                    │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│                                                                                      │
│  CONFIGURATION (~/.boborc or .boborc in project):                                   │
│                                                                                      │
│    {                                                                                 │
│      "supabaseUrl": "https://xxx.supabase.co",                                      │
│      "supabaseKey": "eyJ...",                                                       │
│      "dealsPath": "~/Deals",                                                        │
│      "syncedFolders": ["Meetings", "Comms", "Docs"],                                │
│      "ignoredPatterns": ["*.tmp", ".DS_Store", "_Inbox/*"]                          │
│    }                                                                                 │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

### CLI Tool Package Structure

```
packages/sync-cli/
├── package.json
├── bin/
│   └── bobo.ts               # CLI entry point
├── src/
│   ├── commands/
│   │   ├── push.ts           # bobo sync push
│   │   ├── pull.ts           # bobo sync pull
│   │   ├── status.ts         # bobo sync status
│   │   └── watch.ts          # bobo sync watch
│   ├── parsers/
│   │   ├── master-doc.ts     # Parse master-doc YAML + sections
│   │   ├── meeting.ts        # Parse meeting transcript files
│   │   └── comms-log.ts      # Parse communications log table
│   ├── writers/
│   │   ├── master-doc.ts     # Append to master-doc sections
│   │   ├── meeting.ts        # Create meeting files
│   │   └── artifact.ts       # Write AI-generated artifacts
│   ├── sync-engine.ts        # Core sync logic
│   ├── hash.ts               # Content hashing utilities
│   ├── conflict.ts           # Conflict detection and resolution
│   ├── supabase.ts           # Supabase client wrapper
│   └── config.ts             # Configuration loading
└── tests/
    └── ...
```

---

### Bobo UI: Upload & Process Workflow

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                        BOBO UI: INBOX UPLOAD & PROCESS                               │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  IN DEAL WORKSPACE:                                                                  │
│                                                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │                              QUICK ACTIONS BAR                                 │  │
│  │                                                                                │  │
│  │  [📞 Call] [✉️ Email] [📅 Meet] [📝 Note] [✅ Task] [📥 Upload to Inbox]      │  │
│  │                                                                                │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  USER CLICKS "📥 Upload to Inbox":                                                  │
│                                                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │                           INBOX UPLOAD MODAL                                   │  │
│  │                                                                                │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │                                                                         │  │  │
│  │  │         ┌─────────────────────────────────────────────────────┐        │  │  │
│  │  │         │                                                     │        │  │  │
│  │  │         │     📁 Drop files here or click to browse          │        │  │  │
│  │  │         │                                                     │        │  │  │
│  │  │         │     Supports: Images, PDFs, Transcripts, Docs      │        │  │  │
│  │  │         │                                                     │        │  │  │
│  │  │         └─────────────────────────────────────────────────────┘        │  │  │
│  │  │                                                                         │  │  │
│  │  │  Uploaded files:                                                        │  │  │
│  │  │  ┌─────────────────────────────────────────────────────────────────┐   │  │  │
│  │  │  │ 📷 whatsapp-screenshot.png                    [✓] [×]           │   │  │  │
│  │  │  │ 📄 meeting-transcript-dec12.txt               [✓] [×]           │   │  │  │
│  │  │  │ 📄 email-from-investor.pdf                    [✓] [×]           │   │  │  │
│  │  │  └─────────────────────────────────────────────────────────────────┘   │  │  │
│  │  │                                                                         │  │  │
│  │  │  [Cancel]                                      [Upload & Process →]    │  │  │
│  │  │                                                                         │  │  │
│  │  └─────────────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                                │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│                                                                                      │
│  AFTER CLICKING "Upload & Process":                                                  │
│                                                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │                           PROCESSING STATUS                                    │  │
│  │                                                                                │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │                                                                         │  │  │
│  │  │  📷 whatsapp-screenshot.png                                            │  │  │
│  │  │     ✓ Uploaded to storage                                              │  │  │
│  │  │     ✓ Vision API extracted text                                        │  │  │
│  │  │     ✓ Identified: WhatsApp message from Mikaela                        │  │  │
│  │  │     ✓ Created activity: "Message - Dec 12"                             │  │  │
│  │  │                                                                         │  │  │
│  │  │  📄 meeting-transcript-dec12.txt                                       │  │  │
│  │  │     ✓ Uploaded to storage                                              │  │  │
│  │  │     ✓ Parsed transcript (2,450 words)                                  │  │  │
│  │  │     ⏳ Generating summary...                                           │  │  │
│  │  │     → Extracting action items...                                       │  │  │
│  │  │                                                                         │  │  │
│  │  │  📄 email-from-investor.pdf                                            │  │  │
│  │  │     ✓ Uploaded to storage                                              │  │  │
│  │  │     ⏳ Processing PDF...                                               │  │  │
│  │  │                                                                         │  │  │
│  │  └─────────────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                                │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│                                                                                      │
│  AFTER PROCESSING COMPLETE:                                                          │
│                                                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │                         REVIEW EXTRACTED DATA                                  │  │
│  │                                                                                │  │
│  │  AI extracted the following from your uploads:                                │  │
│  │                                                                                │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │  📅 MEETING: Dec 12 Pitch Practice                                      │  │  │
│  │  │  ───────────────────────────────────────────────────────────────────    │  │  │
│  │  │  Duration: 63 min | Attendees: Mikaela, Sache                          │  │  │
│  │  │                                                                         │  │  │
│  │  │  Summary:                                                               │  │  │
│  │  │  Reviewed pitch deck for Purpose Ventures meeting. Strong demo         │  │  │
│  │  │  section. Need to tighten unit economics slide. Discussed              │  │  │
│  │  │  valuation expectations - gap between $3-4M ask and current metrics.   │  │  │
│  │  │                                                                         │  │  │
│  │  │  Action Items:                                                          │  │  │
│  │  │  ☐ Revise unit economics slide → Mikaela (Dec 15)                      │  │  │
│  │  │  ☐ Send VC intro email to Sarah → Me (Dec 14)                          │  │  │
│  │  │  ☐ Schedule follow-up call → Shared (Dec 18)                           │  │  │
│  │  │                                                                         │  │  │
│  │  │  [Edit] [Accept ✓]                                                     │  │  │
│  │  └─────────────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                                │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │  💬 MESSAGE: WhatsApp from Mikaela                                      │  │  │
│  │  │  ───────────────────────────────────────────────────────────────────    │  │  │
│  │  │  Date: Dec 12, 3:45 PM | Direction: Inbound                            │  │  │
│  │  │                                                                         │  │  │
│  │  │  "Hey! Just wanted to say thanks for the feedback on the deck.         │  │  │
│  │  │   Already working on the unit econ updates. Chat tomorrow?"            │  │  │
│  │  │                                                                         │  │  │
│  │  │  [Edit] [Accept ✓]                                                     │  │  │
│  │  └─────────────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                                │  │
│  │                                               [Save All to Timeline →]        │  │
│  │                                                                                │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

### Summary: The Complete Picture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                       THE COMPLETE SYNC ARCHITECTURE                                 │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                                │ │
│  │                           ┌─────────────────┐                                  │ │
│  │                           │    SUPABASE     │                                  │ │
│  │                           │  (Source of     │                                  │ │
│  │                           │   Cloud Truth)  │                                  │ │
│  │                           │                 │                                  │ │
│  │                           │  • deal_files   │                                  │ │
│  │                           │  • activities   │                                  │ │
│  │                           │  • inbox_items  │                                  │ │
│  │                           │  • sync_log     │                                  │ │
│  │                           │  • Storage 📦   │                                  │ │
│  │                           └────────┬────────┘                                  │ │
│  │                                    │                                           │ │
│  │            ┌───────────────────────┼───────────────────────┐                  │ │
│  │            │                       │                       │                  │ │
│  │            ▼                       ▼                       ▼                  │ │
│  │   ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐        │ │
│  │   │  SYNC CLI       │     │  BOBO WEB APP   │     │  FUTURE:        │        │ │
│  │   │  (Local Agent)  │     │  (Browser)      │     │  Mobile App     │        │ │
│  │   │                 │     │                 │     │                 │        │ │
│  │   │  ┌───────────┐  │     │  ┌───────────┐  │     │  ┌───────────┐  │        │ │
│  │   │  │ push/pull │  │     │  │ Upload UI │  │     │  │ Photo     │  │        │ │
│  │   │  │ status    │  │     │  │ Process   │  │     │  │ Voice     │  │        │ │
│  │   │  │ watch     │  │     │  │ AI Chat   │  │     │  │ Quick log │  │        │ │
│  │   │  └───────────┘  │     │  └───────────┘  │     │  └───────────┘  │        │ │
│  │   │        ↕        │     │                 │     │                 │        │ │
│  │   │  Local Files    │     │                 │     │                 │        │ │
│  │   │  (Source of     │     │                 │     │                 │        │ │
│  │   │   Local Truth)  │     │                 │     │                 │        │ │
│  │   └─────────────────┘     └─────────────────┘     └─────────────────┘        │ │
│  │                                                                                │ │
│  └────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
│  KEY PRINCIPLES:                                                                     │
│                                                                                      │
│  1. FILES REMAIN SOURCE OF TRUTH (for audit, portability, Claude Code access)       │
│  2. SUPABASE ENABLES CLOUD ACCESS (for Bobo UI, mobile, anywhere)                   │
│  3. SYNC CLI BRIDGES THE GAP (runs locally, has filesystem access)                  │
│  4. BIDIRECTIONAL SYNC (push local→cloud, pull cloud→local)                         │
│  5. CONFLICT DETECTION (hash-based, last-write-wins with optional merge)            │
│  6. AUDIT LOG (all sync operations recorded for debugging/recovery)                 │
│                                                                                      │
│  TRANSITION PATH:                                                                    │
│                                                                                      │
│  Phase 1 (Now):        Claude Code + Files → Occasional sync → Bobo for viewing    │
│  Phase 2 (3 months):   Mixed mode - some work in files, some in Bobo UI            │
│  Phase 3 (6 months):   Primary work in Bobo UI, files as backup/archive            │
│  Phase 4 (Future):     Full Bobo UI, sync deprecated, files optional export        │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Conclusion

This design transforms Bobo from "chat with deal context" into a **full-featured deal workspace with AI superpowers**.

The key innovations are:
1. **AI-First Interaction**: Claude isn't a sidebar—it's the central intelligence layer
2. **Artifact-Oriented Outputs**: AI generates editable, saveable documents
3. **Minimal Data Entry**: Smart defaults, AI summarization, and context inference
4. **Hybrid Data Model**: Database for queries, files for audit trail
5. **HubSpot-Inspired UX**: Proven 3-column layout with modern AI enhancements

The implementation can be phased over 5-6 weeks, with each phase delivering incremental value while building toward the complete vision.

---

*Document generated by Claude (Opus 4.5) on December 13, 2025*
