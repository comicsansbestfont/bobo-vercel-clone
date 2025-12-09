# Testing Quick Start Guide

Quick reference for running V1 tests on Bobo AI Chatbot.

---

## 📋 Prerequisites

```bash
# 1. Start dev server (in terminal 1)
npm run dev

# 2. Verify server is running
curl http://localhost:3000
```

---

## 🤖 Automated Backend Tests

### Run All API Tests
```bash
# Make executable (first time only)
chmod +x tests/api/run-all-tests.sh

# Run tests
./tests/api/run-all-tests.sh
```

**Expected Output:**
```
🧪 Bobo AI V1 API Test Suite
═══════════════════════════════

✓ All tests passed! 🎉

Passed: 18
Failed: 0
Total: 18
```

---

## 🌱 Seed Test Data

```bash
# Install tsx if not already installed
npm install -D tsx

# Run seeder
npx tsx tests/seed-data.ts
```

**This creates:**
- 5 projects (with varying numbers of chats)
- 15 chats total
- Mix of standalone and project-assigned chats

---

## 🧪 Manual Frontend Tests

### 1. Test Sidebar
1. Open http://localhost:3000
2. Check sidebar loads projects and chats
3. Click "New project" → create a project
4. Verify project appears in sidebar

### 2. Test Project Page
1. Click a project in sidebar
2. Verify project page loads
3. Check chat list displays
4. Try editing project name

### 3. Test Chat
1. Go to home page
2. Send a message
3. Verify response streams
4. Refresh page
5. Verify message persists

---

## 📊 Check Test Results

After running tests, record results in:
```
docs/V1_TESTING_PLAN.md
```

Use the template at the bottom of that file.

---

## 🐛 Common Issues

### Server not running
```bash
# Error: curl: (7) Failed to connect
# Fix: Start dev server
npm run dev
```

### Port already in use
```bash
# Error: Port 3000 is already in use
# Fix: Kill process on port 3000
lsof -ti:3000 | xargs kill
npm run dev
```

### Database connection error
```bash
# Error: Failed to connect to Supabase
# Fix: Check .env.local has correct values
cat .env.local | grep SUPABASE
```

### No data in database
```bash
# Fix: Run seeder
npx tsx tests/seed-data.ts
```

---

## ✅ V1 Launch Checklist

Before marking V1 as ready:

- [ ] All automated backend tests pass (18/18)
- [ ] Sidebar loads real data from API
- [ ] Project page loads real data from API
- [ ] Can create new project via modal
- [ ] Can send message and see response
- [ ] Messages persist after refresh
- [ ] No console errors on happy path
- [ ] Loading states appear during data fetch
- [ ] Error boundaries work (test with network offline)
- [ ] Zero mock data in codebase

---

## 📖 Full Documentation

For comprehensive testing plan with all test cases:
- **Full Plan:** `docs/V1_TESTING_PLAN.md`
- **Progress Tracker:** `docs/archive/PROGRESS_TRACKER.md` (historical)
- **Product Backlog:** `docs/product/PRODUCT_BACKLOG.md`
- **Current Status:** `CLAUDE.md`

---

**Last Updated:** November 22, 2025
