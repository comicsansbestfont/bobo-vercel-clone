# Sprint Documentation Organization Guide

**Created:** November 28, 2025
**Purpose:** Document the new folder structure and process for sprint organization

---

## Executive Summary

Sprint documentation has been reorganized to consolidate all artifacts in sprint-specific folders. This eliminates scattered documents across the project root and provides a clear archive of each sprint's complete history.

---

## New Folder Structure

### Before (Scattered)
```
Project Root/
├── EXECUTIVE_SUMMARY_M35.md
├── SPRINT-M35-01-SUMMARY.md
├── docs/
│   ├── testing/
│   │   ├── M35-01-COMPREHENSIVE-QA-REPORT.md
│   │   └── M35-01-TEST-PLAN.md
│   └── sprints/
│       ├── POST_MORTEM_M35-01.md
│       ├── M35-01-COMPLETION-REPORT.md
│       ├── active/
│       │   ├── sprint-m35-01.md
│       │   └── sprint-m35-02.md
│       ├── completed/
│       │   └── sprint-m3-03.md
└── tests/
    ├── API_INTEGRATION_TEST_REPORT.md
    └── INTEGRATION_TEST_REPORT.md
```

### After (Organized)
```
docs/sprints/
├── active/
│   ├── M35-01/
│   │   ├── sprint-m35-01.md           # Main plan
│   │   ├── POST_MORTEM_M35-01.md
│   │   ├── COMPLETION_REPORT.md
│   │   ├── testing/
│   │   │   ├── QA_REPORT.md
│   │   │   ├── TEST_PLAN.md
│   │   │   └── TEST_EXECUTION_SUMMARY.md
│   │   └── reports/
│   │       ├── API_INTEGRATION_REPORT.md
│   │       └── other reports...
│   ├── M35-02/
│   │   ├── sprint-m35-02.md
│   │   └── testing/
│   └── README.md
├── handover/                          # Stays shared (not duplicated)
│   ├── HANDOVER_M35-01.md
│   ├── HANDOVER_M35-02.md
│   ├── HANDOVER_M4-01.md
│   └── README.md
├── completed/
│   ├── M35-01/                        # Moved from active
│   │   ├── sprint-m35-01.md
│   │   ├── POST_MORTEM.md
│   │   ├── testing/
│   │   └── reports/
│   ├── M3-03/
│   │   └── sprint-m3-03.md
│   └── README.md
├── templates/
│   ├── sprint-template.md
│   └── README.md
└── README.md
```

---

## Key Changes

### 1. Sprint-Specific Folders
Each sprint now has its own folder: `active/M##-##/` or `completed/M##-##/`

**Before:**
- Sprint plans scattered in root of `active/` or `completed/`
- No clear relationship between related artifacts

**After:**
- All sprint artifacts consolidated in one folder
- Clear organization with `testing/` and `reports/` subfolders
- Easy to move entire sprint to archive when complete

### 2. Testing & Reports Organization
Testing and reporting artifacts now have dedicated subfolders

**Before:**
- QA reports in `docs/testing/`
- API reports in `tests/`
- Test plans mixed with sprint plans

**After:**
- All testing artifacts in `active/M##-##/testing/`
  - QA_REPORT.md
  - TEST_PLAN.md
  - TEST_EXECUTION_SUMMARY.md
- All reports in `active/M##-##/reports/`
  - API_INTEGRATION_REPORT.md
  - COMPLETION_REPORT.md
  - POST_MORTEM.md

### 3. Shared Handover Documents
Handover documents stay in `docs/sprints/handover/` (not duplicated)

**Why:**
- Handovers are execution guides, not sprint artifacts
- Can be referenced by multiple sprints
- Useful for future similar sprints
- Stays as reference after sprint completes

**Lifecycle:**
- Created during sprint planning
- Used during sprint execution
- Stays in handover folder (not archived)
- Can be referenced by future sprints

### 4. Archive Process
When a sprint completes, the entire folder moves to `completed/`

**Command:**
```bash
mv active/M##-##/ completed/M##-##/
```

**Result:**
- Complete history of sprint preserved
- Retrospective and learnings documented
- Easy to reference for future planning

---

## Documentation Files Updated

### Main Sprints README
**File:** `docs/sprints/README.md`
- Updated folder structure diagram
- New 4-phase sprint process (Planning → Execution → Completion → Archiving)
- Updated current sprints table with folder locations
- Updated completed sprints table with folder locations

### Active Sprints README
**File:** `docs/sprints/active/README.md`
- New comprehensive guide to active sprint organization
- Organization structure documented
- Current active sprints listed
- Sprint lifecycle steps with commands
- Quick access guide to find sprint documents

### Completed Sprints README (New)
**File:** `docs/sprints/completed/README.md`
- How to access completed sprint information
- Archive of all completed sprints
- Learning opportunities from completed sprints
- How to reference patterns from old sprints

### Templates README (New)
**File:** `docs/sprints/templates/README.md`
- Sprint planning process overview
- How to use each template
- Lifecycle reference for sprints
- Best practices for organization

### Handover README
**File:** `docs/sprints/handover/README.md`
- Clarified that handovers stay in shared folder
- Lifecycle of a handover document
- How to create new handovers
- Active handovers listed

---

## Sprint Lifecycle (Updated)

### Phase 0: Plan (with Sprint Planning Agent)
```bash
@sprint-planning-agent let's plan {sprint name}
```
Agent guides through scoping, task definition, capacity planning, quality gates

### Phase 1: Create Folder Structure
```bash
mkdir -p docs/sprints/active/M##-##/{testing,reports}
cp docs/sprints/templates/sprint-template.md \
   docs/sprints/active/M##-##/sprint-m##-##.md
cp docs/sprints/handover/HANDOVER_TEMPLATE.md \
   docs/sprints/handover/HANDOVER_M##-##.md
```

### Phase 2: Execution
- Update `active/M##-##/sprint-m##-##.md` daily
- Generate testing artifacts → `active/M##-##/testing/`
- Generate reports → `active/M##-##/reports/`

### Phase 3: Completion
```bash
# 1. Fill retrospective in sprint plan
# 2. Move entire sprint folder to completed
mv docs/sprints/active/M##-##/ docs/sprints/completed/M##-##/
```

---

## Navigation Guide

### If you want to...

**Track a sprint in progress:**
- Go to `docs/sprints/active/M##-##/sprint-m##-##.md`

**Execute a sprint:**
- Go to `docs/sprints/handover/HANDOVER_M##-##.md`

**Review testing results:**
- Go to `docs/sprints/active/M##-##/testing/`

**Find completion reports:**
- Go to `docs/sprints/active/M##-##/reports/`

**Learn from a completed sprint:**
- Go to `docs/sprints/completed/M##-##/`

**Reference sprint patterns:**
- Go to `docs/sprints/handover/HANDOVER_M##-##.md`

**Create a new sprint:**
- Start with `@sprint-planning-agent`
- Use templates in `docs/sprints/templates/`

---

## Migration Path

### Existing Sprints
Older sprints (M3-03 and earlier) may not yet have the new folder structure. When they are next referenced or updated, they should be reorganized to match the new structure:

1. Create `completed/M##-##/` folder
2. Move sprint plan
3. Consolidate any related artifacts
4. Move folder from root level to organized structure

### New Sprints
All new sprints should follow the new structure from the start.

---

## Benefits

1. **Clear Organization** - All sprint artifacts in one place
2. **Easy Navigation** - Know exactly where to find any sprint document
3. **Simple Archival** - Move entire folder when sprint completes
4. **Better History** - Complete sprint history preserved for learning
5. **Reduced Clutter** - No more scattered documents in project root
6. **Reusable Patterns** - Handovers stay accessible for future reference
7. **Process Clarity** - Clear lifecycle from planning to completion to archive

---

## Questions?

Refer to:
- `docs/sprints/README.md` - Overall sprint management guide
- `docs/sprints/active/README.md` - How active sprints are organized
- `docs/sprints/completed/README.md` - How to access completed sprint info
- `docs/sprints/handover/README.md` - Handover document guide
