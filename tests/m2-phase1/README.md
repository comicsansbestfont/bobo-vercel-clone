# M2 Phase 1 - Automated Testing Suite

This directory contains automated tests for M2 Phase 1 (Custom Instructions + File Storage).

## Quick Start

### 1. Backend API Tests (Automated)

```bash
# Ensure dev server is running
npm run dev

# In another terminal, run the backend test suite
./tests/m2-phase1/backend-api-test.sh
```

**Expected Output:**
```
========================================
M2 Phase 1 - Backend API Test Suite
========================================
Base URL: http://localhost:3000
Date: ...

...

========================================
TEST SUMMARY
========================================
Total Tests:  15
Passed:       15
Failed:       0
Pass Rate:    100%

========================================
✓ ALL TESTS PASSED!
========================================
```

---

### 2. Frontend UI Tests (Manual with Chrome DevTools)

**Prerequisites:**
- Chrome browser
- Dev server running
- Claude Code with Chrome DevTools MCP

**Test Checklist:**

#### Settings Navigation
- [ ] Navigate to project page
- [ ] Click ⚙️ gear icon → settings page opens
- [ ] Click "Settings & Files" link → settings page opens
- [ ] Click "Back to Project" → returns to project page

#### Custom Instructions
- [ ] Type instructions in textarea
- [ ] Blur textarea → toast appears "Custom instructions saved"
- [ ] Click "Save" button → saves successfully
- [ ] Refresh page → instructions persist
- [ ] Type 2000+ characters → yellow warning appears

#### File Upload
- [ ] Select .md file → "Upload" button appears
- [ ] Click "Upload" → file uploads, appears in list
- [ ] Select .txt file → error toast "Only markdown files (.md) are supported"
- [ ] File > 10MB → error toast "File too large"
- [ ] Click trash icon → confirmation appears
- [ ] Confirm delete → file removed, toast appears

---

### 3. Integration Tests (Manual End-to-End)

#### Test 1: Custom Instructions Flow
1. Create new project "Pirate Test"
2. Go to settings
3. Add instructions:
   ```
   You are a pirate. Always respond in pirate speak with "Arrr!" and nautical terms.
   ```
4. Save
5. Go back to project
6. Send message: "What is React?"
7. **Expected:** AI responds in pirate speak

#### Test 2: File Upload Flow
1. Go to settings
2. Create `test.md`:
   ```markdown
   # API Docs
   Use Bearer tokens for auth.
   ```
3. Upload file
4. Verify appears in list
5. Delete file
6. Verify removed from list

#### Test 3: Multiple Projects
1. Create Project A with instructions "Use Python examples"
2. Create Project B with instructions "Use JavaScript examples"
3. Ask same question in both projects
4. **Expected:** Different responses based on instructions

---

## Test Files Included

### Backend
- `backend-api-test.sh` - Automated API endpoint tests (15 tests)

### Documentation
- `README.md` - This file
- `../../docs/M2_PHASE1_TESTING_PLAN.md` - Comprehensive test plan

---

## Troubleshooting

### Tests Fail to Connect

**Error:** `curl: (7) Failed to connect to localhost port 3000`

**Solution:**
```bash
# Check if dev server is running
lsof -i :3000

# If not running, start it:
npm run dev
```

---

### Database Errors

**Error:** `Failed to create test project`

**Solution:**
```bash
# Check Supabase connection
cat .env.local | grep SUPABASE

# Verify migration applied
# Check: supabase/migrations/20250123000000_m2_phase1_custom_instructions_and_files.sql
```

---

### jq Command Not Found

**Error:** `jq: command not found`

**Solution:**
```bash
# Install jq (JSON processor)
# macOS:
brew install jq

# Linux:
sudo apt-get install jq
```

---

## Test Coverage

### Backend API (15 tests)
- ✅ Custom instructions CRUD
- ✅ File upload validation
- ✅ File list/delete operations
- ✅ Error handling (404, 400)
- ✅ Edge cases (empty, null, invalid)

### Frontend UI (Manual - 15 tests)
- ✅ Settings navigation
- ✅ Custom instructions editor
- ✅ File upload UI
- ✅ File list display
- ✅ Delete confirmation
- ✅ Validation errors
- ✅ Loading states
- ✅ Toast notifications

### Integration (Manual - 4 flows)
- ✅ Custom instructions end-to-end
- ✅ File upload/delete flow
- ✅ Multiple projects independence
- ✅ Standalone chats (no instructions)

---

## Success Criteria

**All tests must pass:**
- ✅ 15/15 backend API tests
- ✅ 15/15 frontend UI tests
- ✅ 4/4 integration flows
- ✅ Zero console errors
- ✅ No TypeScript errors
- ✅ Production build succeeds

**Performance:**
- ✅ Settings page loads < 1s
- ✅ File upload (1MB) < 2s
- ✅ Custom instructions save < 500ms

---

## Continuous Testing

### Before Each Commit
```bash
# Run backend tests
./tests/m2-phase1/backend-api-test.sh

# Run build
npm run build

# If both pass, commit is safe
```

### Before Deployment
```bash
# Full test suite
./tests/m2-phase1/backend-api-test.sh
npm run build

# Manual smoke test:
# 1. Create project
# 2. Set custom instructions
# 3. Upload file
# 4. Send chat message
# 5. Verify instructions applied
```

---

## Next Steps

After all tests pass:
1. ✅ Mark M2 Phase 1 as complete
2. ✅ Update CHANGELOG.md
3. ✅ Create git tag: `v1.1.0-m2-phase1`
4. ✅ Begin Phase 2 planning (RAG pipeline)

---

**Last Updated:** November 22, 2025
**Test Suite Version:** 1.0
**Maintained by:** Engineering Team
