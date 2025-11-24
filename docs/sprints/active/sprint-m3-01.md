# Sprint M3-01: Personal Context Foundation

**Sprint Duration:** November 24-30, 2025 (Week 1 of 3)
**Milestone:** M3 - User Profile & Bio Memory
**Sprint Goal:** Enable users to set their personal profile and see it injected into all chats
**Team Capacity:** 10 hours

---

## 🎯 Sprint Goal

Build the foundation for global user memory by implementing a manual "About You" profile system. Users can set their bio, background, and preferences, which will be automatically injected into every chat's system prompt. This provides authoritative personal context that persists across all projects.

### Success Criteria
- [ ] User can create/edit personal profile in settings
- [ ] Profile data persists to database
- [ ] Profile content appears in chat system prompts
- [ ] AI responds with awareness of user's background
- [ ] Memory schema defined for future fact categorization

---

## 📋 Sprint Backlog

| ID | Task | Estimate | Status | Actual | Notes |
|----|------|----------|--------|--------|-------|
| M3-11 | Personal context profile schema (bio, background, key facts) | 2h | ⏳ Pending | - | Database migration + types |
| M3-12 | "About You" settings UI + optional context file upload | 3h | ⏳ Pending | - | /settings/profile page |
| M3-13 | Inject personal context into system prompt and memory pipeline | 3h | ⏳ Pending | - | Modify chat API route |
| M3-8 | Define memory schema & categories (fact types, sources) | 2h | ⏳ Pending | - | Documentation + enums |

**Status Legend:**
- ⏳ Pending - Not started
- 🚧 In Progress - Currently working
- ✅ Done - Completed and verified
- 🚫 Blocked - Cannot proceed
- 📝 Deferred - Moved to future sprint

**Total Estimated:** 10 hours
**Total Actual:** -
**Variance:** -

---

## 📅 Daily Progress Log

### Day 1 - Nov 24, 2025
**Hours Worked:** 0
**Completed:**
- Sprint planning document created
- Reviewed M2 completion and backlog

**Next Up:**
- Start M3-11 (database schema)

**Notes:**
- This is the kickoff day - planning and documentation

---

### Day 2 - Nov 25, 2025
**Hours Worked:**
**Completed:**

**In Progress:**

**Blockers:**

**Notes:**

---

### Day 3 - Nov 26, 2025
**Hours Worked:**
**Completed:**

**In Progress:**

**Blockers:**

**Notes:**

---

### Day 4 - Nov 27, 2025
**Hours Worked:**
**Completed:**

**In Progress:**

**Blockers:**

**Notes:**

---

### Day 5 - Nov 28, 2025
**Hours Worked:**
**Completed:**

**In Progress:**

**Blockers:**

**Notes:**

---

### Day 6 - Nov 29, 2025
**Hours Worked:**
**Completed:**

**In Progress:**

**Blockers:**

**Notes:**

---

### Day 7 - Nov 30, 2025 (Sprint End)
**Hours Worked:**
**Completed:**

**Sprint Demo Prep:**

**Retrospective Notes:**

---

## 🚧 Blockers & Risks

| Blocker | Impact | Status | Resolution |
|---------|--------|--------|------------|
| - | - | - | - |

---

## 📦 Deliverables

### Code Artifacts
- [ ] Database migration: `user_profiles` table
- [ ] TypeScript types for profile schema
- [ ] `/settings/profile` page component
- [ ] API route: GET/POST `/api/user/profile`
- [ ] Profile injection logic in `/api/chat/route.ts`
- [ ] Memory schema documentation

### Database Schema (Planned)
```sql
-- Migration: 20251124000000_m3_phase1_user_profiles.sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  bio TEXT,                    -- Short bio (e.g., "Software engineer at X")
  background TEXT,             -- Professional background and expertise
  preferences TEXT,            -- Work style, communication preferences
  technical_context TEXT,      -- Languages, frameworks, tools user knows
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Memory fact categories (for M3-8, used in future sprints)
CREATE TYPE memory_category AS ENUM (
  'personal',        -- Name, location, personal facts
  'preferences',     -- Communication style, work preferences
  'technical',       -- Languages, frameworks, tools
  'work_style',      -- How user likes to work
  'context'          -- Other context (timezone, etc.)
);
```

### Documentation
- [ ] Memory schema document (`docs/memory-schema.md`)
- [ ] Updated PRODUCT_BACKLOG.md with M3-01 status
- [ ] API documentation for profile endpoints

### Tests
- [ ] Manual testing: Create profile → see in chat
- [ ] E2E test (optional, can defer to M3-03)

---

## 🎬 Sprint Demo (Planned for Nov 30)

**Demo Date:** November 30, 2025
**Attendees:** Solo project (self-review)

### Demo Script (Planned)
1. **Show Profile Settings:**
   - Navigate to `/settings/profile`
   - Fill in bio: "Full-stack developer specializing in Next.js and AI"
   - Fill in background: "5 years experience with React, TypeScript, PostgreSQL"
   - Fill in preferences: "Prefer TypeScript over JavaScript, TDD approach"
   - Save profile ✓

2. **Show Profile Persistence:**
   - Refresh page
   - Profile data still visible ✓

3. **Show Profile in Chat:**
   - Start new chat
   - Ask: "What languages should I use?"
   - AI response mentions TypeScript (from preferences) ✓
   - Ask: "What's my background?"
   - AI summarizes from profile ✓

4. **Show System Prompt (Debug):**
   - Open browser DevTools
   - Check network request to `/api/chat`
   - Verify system prompt includes "ABOUT THE USER:" section ✓

### Success Metrics for Demo
- Profile saves correctly
- Profile loads on page refresh
- AI responses reflect profile context
- System prompt includes profile data

---

## 🔄 Sprint Retrospective (To be filled at end of sprint)

### What Went Well ✅
-

### What Didn't Go Well ❌
-

### What We Learned 📚
-

### Action Items for Next Sprint 🎯
- [ ]

---

## 📊 Sprint Metrics

| Metric | Target | Actual | Variance |
|--------|--------|--------|----------|
| Story Points Completed | 4 | - | - |
| Hours Estimated | 10h | - | - |
| Tasks Completed | 4 | - | - |
| Bugs Found | 0 | - | - |
| Tests Added | 1 | - | - |

**Velocity:** (to be calculated)
**Completion Rate:** (to be calculated)

---

## 🔗 Related Links

- **Product Backlog:** [PRODUCT_BACKLOG.md](../../PRODUCT_BACKLOG.md#milestone-3-user-profile--bio-q1-2026)
- **Previous Sprint:** [Sprint M2-01](../completed/sprint-m2-01.md)
- **Next Sprint:** Sprint M3-02 (Supermemory Integration) - Planned for Dec 1-7
- **Milestone Overview:** M3 - User Profile & Bio Memory
- **Architecture Doc:** [context-memory-vision.md](../../context-memory-vision.md)
- **Sprint Index:** [Sprint README](../README.md)

---

## 📌 Implementation Notes

### M3-11: Profile Schema Design Decisions

**Fields to Include:**
1. **bio** (TEXT): Short 1-2 sentence summary
   - Example: "Full-stack developer at Acme Corp, passionate about AI/ML"

2. **background** (TEXT): Professional experience and expertise
   - Example: "10 years experience with React, Node.js, Python. Built 5 production apps..."

3. **preferences** (TEXT): Work style and tool preferences
   - Example: "Prefer TypeScript over JavaScript, TDD approach, functional programming"

4. **technical_context** (TEXT): Languages, frameworks, tools
   - Example: "Expert: TypeScript, React, PostgreSQL. Familiar: Python, Docker, AWS"

**Why separate fields?**
- Allows granular injection (e.g., only inject technical_context for code questions)
- Easier to edit specific sections
- Future: Can add field-level visibility controls

**Alternative considered:** Single `profile` TEXT field
- Simpler schema
- Less flexible for selective injection
- Decided against due to future requirements

---

### M3-12: UI/UX Considerations

**Settings Page Location:** `/settings/profile`
- Follows pattern: `/settings/account`, `/settings/billing` (future)
- Sidebar navigation: "Settings > Profile"

**Form Layout:**
```
┌─────────────────────────────────┐
│ Personal Profile                │
├─────────────────────────────────┤
│ Bio (Optional)                  │
│ [Text input - 200 char max]     │
│                                 │
│ Background (Optional)           │
│ [Textarea - auto-resize]        │
│                                 │
│ Preferences (Optional)          │
│ [Textarea - auto-resize]        │
│                                 │
│ Technical Context (Optional)    │
│ [Textarea - auto-resize]        │
│                                 │
│ [Cancel] [Save Profile]         │
└─────────────────────────────────┘
```

**UX Features:**
- All fields optional (user can skip)
- Auto-save on blur (or manual save button?)
- Character count for bio (max 200 chars)
- Rich text? (No - keep simple for v1)
- File upload? (Deferred to future - just text for now)

---

### M3-13: System Prompt Injection Strategy

**Injection Location:** Before custom instructions, after base system prompt

**Prompt Structure:**
```
[Base System Prompt]

ABOUT THE USER:
{user.bio}

BACKGROUND & EXPERTISE:
{user.background}

PREFERENCES:
{user.preferences}

TECHNICAL CONTEXT:
{user.technical_context}

[Custom Instructions from Project]

[Project Files (Loop A)]

[Global Inspiration (Loop B)]
```

**Token Budget:**
- Reserve 500 tokens for user profile
- If profile exceeds 500 tokens, truncate or summarize
- Priority: bio > preferences > background > technical_context

**Edge Cases:**
- User has no profile → skip section entirely
- User has partial profile → only inject filled fields
- Profile is too long → truncate with "..."

---

### M3-8: Memory Schema Categories

**Purpose:** Define fact types for future automatic extraction (Sprint M3-02)

**Categories:**
1. **personal** - Name, location, age, family, hobbies
   - Example: "User's name is John", "Lives in San Francisco"

2. **preferences** - Communication style, work preferences
   - Example: "Prefers async communication", "Likes detailed explanations"

3. **technical** - Languages, frameworks, tools
   - Example: "Expert in React", "Learning Rust"

4. **work_style** - How user likes to work
   - Example: "Prefers TDD", "Likes pair programming"

5. **context** - Timezone, location, other runtime context
   - Example: "Timezone: PST", "Usually works evenings"

**Storage:** Documented in `docs/memory-schema.md` for now
**Future:** Will be used in `memory_facts` table (Sprint M3-02)

---

## 🎯 Definition of Done for Each Task

### M3-11 (Schema) ✅ Done When:
- [ ] Migration file created and applied to Supabase
- [ ] TypeScript types defined in `lib/db/types.ts`
- [ ] Migration tested (can create/update/read profile)
- [ ] No database errors

### M3-12 (UI) ✅ Done When:
- [ ] `/settings/profile` page accessible from sidebar
- [ ] Form has all 4 fields (bio, background, preferences, technical_context)
- [ ] Save button works (POST to API)
- [ ] Profile data persists after refresh
- [ ] Loading states and error handling
- [ ] Responsive design (works on mobile)

### M3-13 (Injection) ✅ Done When:
- [ ] Chat API route reads user profile from database
- [ ] Profile injected into system prompt with "ABOUT THE USER:" format
- [ ] Manual test: Ask AI about user → AI knows profile info
- [ ] Token budget respected (profile doesn't exceed 500 tokens)
- [ ] Empty profile gracefully handled (no section if no data)

### M3-8 (Schema Doc) ✅ Done When:
- [ ] `docs/memory-schema.md` created
- [ ] All 5 categories documented with examples
- [ ] Injection rules defined
- [ ] Conflict resolution strategy documented
- [ ] Reviewed and approved

---

## 💡 Open Questions

1. **Should bio field have a character limit?**
   - Suggestion: 200 characters (like Twitter)
   - Prevents token bloat

2. **Should we show token count in settings UI?**
   - "Your profile uses 87 tokens (17% of budget)"
   - Good for power users, might confuse others

3. **Should profile be project-specific or global?**
   - Decision: Global (one profile for all projects)
   - Rationale: User identity doesn't change per project

4. **Should we add profile photo/avatar?**
   - Defer to future (not needed for M3 MVP)

---

**Sprint Created:** November 24, 2025
**Sprint Owner:** Sachee Perera (CTO)
**Status:** 🚀 Active - Ready to Start
**Next Update:** Daily (during sprint)
