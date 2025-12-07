# M37-01 Advisory System E2E Test Suite

Comprehensive end-to-end testing for Sprint M37-01: Repository Consolidation (Advisory Core).

## Test Files

| File | Description | Tests |
|------|-------------|-------|
| `m37-advisory-indexing.spec.ts` | Indexing pipeline tests | 12 |
| `m37-advisory-search.spec.ts` | Search tool functionality | 25 |
| `m37-advisory-agent-mode.spec.ts` | Agent Mode integration | 18 |
| `m37-advisory-regression.spec.ts` | Regression tests | 16 |
| `m37-advisory-visual.spec.ts` | Visual testing | 20 |

**Total: ~91 tests**

## Running Tests

### All M37 Tests
```bash
npm run test:m37
# or
npx playwright test --grep "M37"
```

### Individual Test Suites
```bash
# Indexing tests
npx playwright test m37-advisory-indexing

# Search tool tests
npx playwright test m37-advisory-search

# Agent Mode tests
npx playwright test m37-advisory-agent-mode

# Regression tests
npx playwright test m37-advisory-regression

# Visual tests
npx playwright test m37-advisory-visual
```

### Specific Validation Queries
```bash
npx playwright test --grep "Validation Query"
```

## Prerequisites

1. **Advisory files indexed**
   ```bash
   npm run index-advisory
   npm run verify-advisory  # Should show 100% coverage
   ```

2. **Dev server running**
   ```bash
   npm run dev
   ```

3. **Environment variables**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `AI_GATEWAY_API_KEY` (for indexing tests)

## Test Categories

### 1. Indexing Pipeline Tests (`m37-advisory-indexing.spec.ts`)

Tests the complete indexing pipeline:

- **File System Structure**
  - Advisory directory exists with expected structure
  - Master docs present for each deal
  - Exclusion patterns (_Inbox, _raw, _TEMPLATE) work correctly
  - Entity type/name extraction from paths

- **Indexing Script Execution**
  - Script runs without errors
  - Verification script shows coverage
  - Files indexed with embeddings

- **Database State**
  - Files table has advisory entries
  - Entity breakdown (deals vs clients) correct
  - Expected companies indexed

- **Edge Cases**
  - Large files (>100KB) handled gracefully
  - Non-markdown files ignored
  - Empty directories don't cause errors

### 2. Search Tool Tests (`m37-advisory-search.spec.ts`)

Tests the `search_advisory` tool functionality:

- **Basic Search**
  - Company name search (MyTab)
  - Topic search (valuation)
  - Meeting search
  - Communication search

- **Entity Filtering**
  - Filter by type: deals only
  - Filter by type: clients only
  - Filter by entity name

- **Hybrid Search Scoring**
  - Semantic relevance for conceptual queries
  - Keyword matches ranked highly
  - Combined vector + text relevance

- **Result Formatting**
  - Content truncation
  - Entity info included
  - Score display

- **Edge Cases**
  - No results handling
  - Short queries
  - Special characters
  - Long queries

- **Sprint Validation Queries** (6 tests)
  - "Brief me on MyTab"
  - "What was my last email to Mikaela?"
  - "What deals have red flags?"
  - "Prep me for SwiftCheckin call"
  - "What's the valuation for ArcheloLab?"
  - "Show me Dec 2 meeting notes for MyTab"

### 3. Agent Mode Integration Tests (`m37-advisory-agent-mode.spec.ts`)

Tests full Agent Mode integration:

- **UI Components**
  - Chat interface on load
  - Tool indicators during search
  - Streaming response display
  - TD-8 regression (viewport stability)

- **Network Validation**
  - Correct API calls made
  - Error handling
  - No sensitive data in console

- **Tool Registration**
  - search_advisory registered
  - Auto-approved as read-only

- **Chat Persistence**
  - Advisory searches persist in history
  - Follow-up questions work

- **Performance**
  - Response time within limits
  - Multiple rapid queries handled

- **Accessibility**
  - ARIA labels present
  - Keyboard navigation works

### 4. Regression Tests (`m37-advisory-regression.spec.ts`)

Ensures M37 changes don't break existing functionality:

- **Memory Tools**
  - search_memory still works
  - Distinguishes memory vs advisory queries
  - add_memory functionality preserved

- **Chat Functionality**
  - Chat creation works
  - Message persistence works
  - Model selection works
  - Web search toggle works

- **Build/Type Safety**
  - No TypeScript errors
  - No module import errors

- **Context Management**
  - Context tracking still works
  - Long conversations handled

- **Combined Queries**
  - Mixed memory + advisory queries work
  - Correct tool selection in sequence

- **Database Integrity**
  - files table not corrupted
  - memory_entries table intact

- **Performance**
  - Page load time reasonable
  - Memory query response time reasonable

### 5. Visual Tests (`m37-advisory-visual.spec.ts`)

Screenshot-based visual testing:

- **Interface States**
  - Initial state
  - Focus states
  - Submit button states

- **Message Display**
  - User message appearance
  - Streaming stages
  - Completed response

- **Tool Visuals**
  - Tool indicators
  - Search results in response

- **Responsive Behavior**
  - Mobile viewport (375x667)
  - Tablet viewport (768x1024)
  - Desktop viewport (1920x1080)

- **Error States**
  - Network error
  - Empty results

- **Conversation Flow**
  - Multi-turn conversation
  - Scroll behavior

- **Validation Query Screenshots**
  - All 6 validation queries captured

## Test Helpers

Located in `helpers/advisory-test-helpers.ts`:

- **Navigation helpers**: `navigateToAgentMode()`, `navigateToProject()`
- **Query helpers**: `submitQuery()`, `submitQuerySequence()`
- **Validation helpers**: `validateAdvisoryContent()`, `validateQueryResponse()`
- **Console monitoring**: `ConsoleCollector` class
- **Network monitoring**: `NetworkCollector` class
- **Screenshot utilities**: `saveScreenshot()`, `saveFailureScreenshot()`
- **Assertion helpers**: `assertContainsAtLeast()`, `assertNoConsoleErrors()`

## Screenshot Artifacts

Screenshots are saved to:
- `tests/screenshots/m37/` - General M37 screenshots
- `tests/screenshots/m37-visual/` - Visual test screenshots
- `tests/screenshots/m37-regression/` - Regression test screenshots
- `tests/screenshots/failures/` - Failure screenshots

## Success Criteria

Based on sprint document:

| Metric | Target | How to Verify |
|--------|--------|---------------|
| Validation queries | 5/6 pass | Run validation query tests |
| Build passes | ✅ | `npm run build` |
| No memory tool regression | ✅ | Run regression tests |
| Advisory tool functional | ✅ | Run search tests |
| Files indexed | 100% | `npm run verify-advisory` |

## Troubleshooting

### Tests timeout
- Increase timeout in specific test: `test.setTimeout(60000)`
- Check if dev server is running
- Verify advisory files are indexed

### Indexing tests skip
- Set `RUN_FULL_INDEXING=true` for full indexing tests
- Ensure `AI_GATEWAY_API_KEY` is set

### Visual tests fail
- Run in headed mode: `npx playwright test --headed`
- Check screenshot artifacts for differences
- Update reference screenshots if intentional changes

### Validation queries fail
- Verify advisory files are indexed
- Check specific file content matches expected
- Review AI response for tool invocation

## CI Integration

```yaml
# Example GitHub Actions workflow
- name: Run M37 E2E Tests
  run: |
    npm run index-advisory
    npm run verify-advisory
    npm run test:m37
  env:
    AI_GATEWAY_API_KEY: ${{ secrets.AI_GATEWAY_API_KEY }}
```

## Related Documentation

- Sprint Document: `docs/sprints/active/M37-01/sprint-m37-01.md`
- Handover Guide: `docs/sprints/handover/HANDOVER_M37-01.md`
- Advisory Tools: `lib/agent-sdk/advisory-tools.ts`
- Indexing Script: `scripts/index-advisory.ts`
