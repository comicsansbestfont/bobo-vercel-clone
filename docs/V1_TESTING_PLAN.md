# Bobo AI Chatbot - V1 Testing Plan

**Version:** 1.0
**Last Updated:** November 22, 2025
**Status:** Ready for Execution
**Test Environment:** Development (localhost:3000)

---

## 📋 Table of Contents

1. [Test Overview](#test-overview)
2. [Backend API Tests](#backend-api-tests)
3. [Frontend UI Tests](#frontend-ui-tests)
4. [Integration Tests](#integration-tests)
5. [Error Handling Tests](#error-handling-tests)
6. [Performance Tests](#performance-tests)
7. [Automated Test Scripts](#automated-test-scripts)
8. [Test Results Template](#test-results-template)

---

## 🎯 Test Overview

### Test Goals
- ✅ Verify all backend APIs return correct data
- ✅ Confirm frontend displays real data (no mock data)
- ✅ Validate user flows work end-to-end
- ✅ Test error handling and edge cases
- ✅ Ensure acceptable performance

### Success Criteria
- [ ] All backend endpoints return 200 OK with valid data
- [ ] All frontend components fetch and display real data
- [ ] Zero console errors in production build
- [ ] User can create project → persists after refresh
- [ ] User can send message → appears after refresh
- [ ] User can move chat between projects
- [ ] Loading states appear during data fetch
- [ ] Error boundaries catch and display errors gracefully

### Test Environment Setup

**Prerequisites:**
```bash
# 1. Start dev server
npm run dev

# 2. Verify Supabase connection
# Check .env.local has:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - AI_GATEWAY_API_KEY

# 3. Verify database has data
# Run: SELECT COUNT(*) FROM chats;
# Should return > 0 if you've created chats
```

---

## 🔌 Backend API Tests

### Test Suite 1: Project Endpoints

#### 1.1 GET /api/projects
**Purpose:** List all projects with chat count stats

**Test Case:**
```bash
curl -X GET http://localhost:3000/api/projects
```

**Expected Response:**
```json
{
  "projects": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "name": "Project Name",
      "description": "Description",
      "created_at": "ISO-8601",
      "updated_at": "ISO-8601",
      "chat_count": 5
    }
  ]
}
```

**Validation:**
- [ ] Status: 200 OK
- [ ] Response is valid JSON
- [ ] `projects` is an array
- [ ] Each project has `id`, `name`, `chat_count`
- [ ] `chat_count` is accurate (matches actual chats in project)

---

#### 1.2 POST /api/projects
**Purpose:** Create new project

**Test Case:**
```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Project",
    "description": "Automated test project"
  }'
```

**Expected Response:**
```json
{
  "project": {
    "id": "new-uuid",
    "user_id": "uuid",
    "name": "Test Project",
    "description": "Automated test project",
    "created_at": "ISO-8601",
    "updated_at": "ISO-8601"
  }
}
```

**Validation:**
- [ ] Status: 201 Created
- [ ] Response contains new `project` object
- [ ] `project.id` is a valid UUID
- [ ] `project.name` matches input
- [ ] `created_at` and `updated_at` are present

**Edge Cases:**
```bash
# Missing name (should fail)
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{"description": "No name"}'
# Expected: 400 Bad Request

# Empty name (should fail)
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name": ""}'
# Expected: 400 Bad Request

# Very long name (should truncate or fail)
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name": "'$(printf 'A%.0s' {1..300})'"}'
# Expected: 400 Bad Request or truncated to 255 chars
```

---

#### 1.3 GET /api/projects/[id]
**Purpose:** Get single project details

**Test Case:**
```bash
# First create a project to get ID
PROJECT_ID=$(curl -s -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Get"}' | jq -r '.project.id')

# Then fetch it
curl -X GET "http://localhost:3000/api/projects/$PROJECT_ID"
```

**Expected Response:**
```json
{
  "project": {
    "id": "uuid",
    "user_id": "uuid",
    "name": "Test Get",
    "description": null,
    "created_at": "ISO-8601",
    "updated_at": "ISO-8601"
  }
}
```

**Validation:**
- [ ] Status: 200 OK
- [ ] Project data matches created project
- [ ] All fields present

**Edge Cases:**
```bash
# Non-existent project
curl -X GET http://localhost:3000/api/projects/00000000-0000-0000-0000-000000000000
# Expected: 404 Not Found

# Invalid UUID format
curl -X GET http://localhost:3000/api/projects/invalid-id
# Expected: 400 Bad Request or 404
```

---

#### 1.4 PATCH /api/projects/[id]
**Purpose:** Update project name/description

**Test Case:**
```bash
# Create project
PROJECT_ID=$(curl -s -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name":"Original Name"}' | jq -r '.project.id')

# Update it
curl -X PATCH "http://localhost:3000/api/projects/$PROJECT_ID" \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Name","description":"New description"}'
```

**Expected Response:**
```json
{
  "project": {
    "id": "uuid",
    "name": "Updated Name",
    "description": "New description",
    "updated_at": "ISO-8601 (newer)"
  }
}
```

**Validation:**
- [ ] Status: 200 OK
- [ ] `name` updated correctly
- [ ] `description` updated correctly
- [ ] `updated_at` is newer than before
- [ ] `created_at` unchanged

---

#### 1.5 DELETE /api/projects/[id]
**Purpose:** Delete project

**Test Case:**
```bash
# Create project
PROJECT_ID=$(curl -s -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name":"To Delete"}' | jq -r '.project.id')

# Delete it
curl -X DELETE "http://localhost:3000/api/projects/$PROJECT_ID"

# Verify it's gone
curl -X GET "http://localhost:3000/api/projects/$PROJECT_ID"
```

**Expected Response:**
```
# DELETE response: 204 No Content (empty body)
# GET response: 404 Not Found
```

**Validation:**
- [ ] DELETE returns 204 No Content
- [ ] GET returns 404 Not Found after deletion
- [ ] Associated chats still exist (just detached from project)

---

#### 1.6 GET /api/projects/[id]/chats
**Purpose:** List chats in a project

**Test Case:**
```bash
# Create project
PROJECT_ID=$(curl -s -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name":"Project With Chats"}' | jq -r '.project.id')

# Create chat in project
curl -X POST "http://localhost:3000/api/projects/$PROJECT_ID/chats" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Chat","model":"openai/gpt-4o"}'

# List chats
curl -X GET "http://localhost:3000/api/projects/$PROJECT_ID/chats"
```

**Expected Response:**
```json
{
  "chats": [
    {
      "id": "uuid",
      "title": "Test Chat",
      "model": "openai/gpt-4o",
      "project_id": "project-uuid",
      "created_at": "ISO-8601",
      "updated_at": "ISO-8601"
    }
  ]
}
```

**Validation:**
- [ ] Status: 200 OK
- [ ] `chats` is an array
- [ ] Each chat has `project_id` matching the project
- [ ] Chats ordered by `updated_at` DESC

---

### Test Suite 2: Chat Endpoints

#### 2.1 GET /api/chats
**Purpose:** List all chats

**Test Case:**
```bash
curl -X GET http://localhost:3000/api/chats
```

**Expected Response:**
```json
{
  "chats": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "project_id": "uuid or null",
      "title": "Chat Title",
      "model": "openai/gpt-4o",
      "web_search": false,
      "last_message_at": "ISO-8601",
      "created_at": "ISO-8601",
      "updated_at": "ISO-8601"
    }
  ]
}
```

**Validation:**
- [ ] Status: 200 OK
- [ ] `chats` is an array
- [ ] Chats ordered by `last_message_at` DESC
- [ ] Both project and non-project chats returned

**Query Param Test:**
```bash
# Filter by project
curl -X GET "http://localhost:3000/api/chats?projectId=PROJECT_UUID"
# Expected: Only chats in that project
```

---

#### 2.2 POST /api/chats
**Purpose:** Create new chat

**Test Case:**
```bash
curl -X POST http://localhost:3000/api/chats \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Test Chat",
    "model": "openai/gpt-4o",
    "web_search": false
  }'
```

**Expected Response:**
```json
{
  "chat": {
    "id": "new-uuid",
    "title": "New Test Chat",
    "model": "openai/gpt-4o",
    "web_search": false,
    "project_id": null,
    "created_at": "ISO-8601",
    "updated_at": "ISO-8601"
  }
}
```

**Validation:**
- [ ] Status: 201 Created
- [ ] Chat created with correct fields
- [ ] `project_id` is null (not in a project)

**With Project:**
```bash
curl -X POST http://localhost:3000/api/chats \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Project Chat",
    "model": "openai/gpt-4o",
    "project_id": "PROJECT_UUID"
  }'
# Expected: Chat created in project
```

---

#### 2.3 GET /api/chats/[id]
**Purpose:** Get chat with all messages

**Test Case:**
```bash
# Get existing chat (replace with real ID)
curl -X GET http://localhost:3000/api/chats/CHAT_ID
```

**Expected Response:**
```json
{
  "chat": {
    "id": "uuid",
    "title": "Chat Title",
    "model": "openai/gpt-4o",
    "messages": [
      {
        "id": "uuid",
        "chat_id": "uuid",
        "role": "user",
        "content": {"parts": [{"type": "text", "text": "Hello"}]},
        "sequence_number": 1,
        "created_at": "ISO-8601"
      },
      {
        "id": "uuid",
        "chat_id": "uuid",
        "role": "assistant",
        "content": {"parts": [{"type": "text", "text": "Hi!"}]},
        "sequence_number": 2,
        "created_at": "ISO-8601"
      }
    ]
  }
}
```

**Validation:**
- [ ] Status: 200 OK
- [ ] `messages` array ordered by `sequence_number` ASC
- [ ] All messages belong to this chat
- [ ] Content is valid JSONB with `parts` array

---

#### 2.4 PATCH /api/chats/[id]
**Purpose:** Update chat title/model/settings

**Test Case:**
```bash
curl -X PATCH http://localhost:3000/api/chats/CHAT_ID \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated Title","web_search":true}'
```

**Expected Response:**
```json
{
  "chat": {
    "id": "uuid",
    "title": "Updated Title",
    "web_search": true,
    "updated_at": "ISO-8601 (newer)"
  }
}
```

**Validation:**
- [ ] Status: 200 OK
- [ ] Fields updated correctly
- [ ] `updated_at` is newer

---

#### 2.5 DELETE /api/chats/[id]
**Purpose:** Delete chat (cascade to messages)

**Test Case:**
```bash
# Create chat
CHAT_ID=$(curl -s -X POST http://localhost:3000/api/chats \
  -H "Content-Type: application/json" \
  -d '{"title":"To Delete","model":"openai/gpt-4o"}' | jq -r '.chat.id')

# Delete it
curl -X DELETE "http://localhost:3000/api/chats/$CHAT_ID"

# Verify gone
curl -X GET "http://localhost:3000/api/chats/$CHAT_ID"
```

**Expected Response:**
```
# DELETE: 204 No Content
# GET: 404 Not Found
```

**Validation:**
- [ ] DELETE returns 204
- [ ] Chat deleted from database
- [ ] Messages cascade deleted (verify in DB)

---

#### 2.6 PATCH /api/chats/[id]/project
**Purpose:** Move chat to/from project

**Test Case:**
```bash
# Create chat
CHAT_ID=$(curl -s -X POST http://localhost:3000/api/chats \
  -H "Content-Type: application/json" \
  -d '{"title":"Movable Chat","model":"openai/gpt-4o"}' | jq -r '.chat.id')

# Create project
PROJECT_ID=$(curl -s -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name":"Target Project"}' | jq -r '.project.id')

# Move chat to project
curl -X PATCH "http://localhost:3000/api/chats/$CHAT_ID/project" \
  -H "Content-Type: application/json" \
  -d "{\"project_id\":\"$PROJECT_ID\"}"

# Verify chat is in project
curl -X GET "http://localhost:3000/api/chats/$CHAT_ID"
```

**Expected Response:**
```json
{
  "chat": {
    "id": "uuid",
    "project_id": "project-uuid",
    "updated_at": "ISO-8601"
  }
}
```

**Validation:**
- [ ] Status: 200 OK
- [ ] `project_id` updated to new project
- [ ] Chat appears in `/api/projects/[id]/chats`

**Detach from project:**
```bash
curl -X PATCH "http://localhost:3000/api/chats/$CHAT_ID/project" \
  -H "Content-Type: application/json" \
  -d '{"project_id":null}'
# Expected: Chat moved out of project (project_id = null)
```

---

### Test Suite 3: Streaming Chat Endpoint

#### 3.1 POST /api/chat (Streaming)
**Purpose:** Send message and get streaming response

**Test Case:**
```bash
# Start new chat
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role":"user","content":"Hello, test message"}
    ],
    "model": "openai/gpt-4o",
    "webSearch": false
  }' --no-buffer
```

**Expected Response:**
```
# Streaming response with Server-Sent Events
data: {"type":"text","text":"Hello"}
data: {"type":"text","text":"!"}
data: {"type":"text","text":" How"}
...
data: [DONE]
```

**Validation:**
- [ ] Status: 200 OK
- [ ] Response streams chunks
- [ ] Content-Type: `text/event-stream` or similar
- [ ] Response ends with `[DONE]`
- [ ] Header `X-Chat-Id` present (for new chats)
- [ ] Message saved to database after streaming completes

**Test with existing chat:**
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role":"user","content":"First message"},
      {"role":"assistant","content":"Response"},
      {"role":"user","content":"Second message"}
    ],
    "chatId": "EXISTING_CHAT_ID",
    "model": "openai/gpt-4o"
  }' --no-buffer
```

**Validation:**
- [ ] Streams correctly
- [ ] New messages appended to existing chat
- [ ] `sequence_number` increments correctly

---

## 🖥️ Frontend UI Tests

### Test Suite 4: Sidebar Component

#### 4.1 Sidebar Data Loading
**Test Steps:**
1. Open browser DevTools (F12)
2. Navigate to `http://localhost:3000`
3. Observe Network tab

**Expected Behavior:**
- [ ] Request to `/api/projects` (Status: 200)
- [ ] Request to `/api/chats` (Status: 200)
- [ ] Skeleton loading state appears briefly
- [ ] Projects list populates with real data
- [ ] Chats list populates with real data
- [ ] No console errors

**Validation:**
```javascript
// In browser console
// Check no mock data is used
console.log(window.__MOCK_DATA_DETECTED__ === undefined); // Should be true
```

---

#### 4.2 Create Project Modal
**Test Steps:**
1. Click "New project" button in sidebar
2. Modal opens
3. Enter project name: "UI Test Project"
4. Enter description: "Testing from UI"
5. Click "Create Project"

**Expected Behavior:**
- [ ] Modal opens smoothly
- [ ] Form fields are editable
- [ ] "Create" button disabled until name entered
- [ ] On submit, shows "Creating..." loading state
- [ ] Success toast appears: "Project created successfully"
- [ ] Modal closes automatically
- [ ] New project appears in sidebar
- [ ] POST request to `/api/projects` visible in Network tab

**Error Case:**
1. Click "New project"
2. Leave name empty
3. Try to submit

**Expected:**
- [ ] "Create" button disabled
- [ ] Or validation error shown

---

#### 4.3 Project Click Navigation
**Test Steps:**
1. Click on a project in sidebar

**Expected Behavior:**
- [ ] Navigates to `/project/[projectId]`
- [ ] Project page loads
- [ ] URL updates correctly

---

#### 4.4 Chat Click Navigation
**Test Steps:**
1. Click on a chat in sidebar

**Expected Behavior:**
- [ ] Navigates to `/?chatId=[chatId]`
- [ ] Chat history loads
- [ ] URL updates with `chatId` query param

---

### Test Suite 5: Project Page

#### 5.1 Project Page Data Loading
**Test Steps:**
1. Navigate to a project: `http://localhost:3000/project/[PROJECT_ID]`
2. Observe loading behavior

**Expected Behavior:**
- [ ] Skeleton loading state appears
- [ ] Request to `/api/projects/[id]` (Status: 200)
- [ ] Request to `/api/projects/[id]/chats` (Status: 200)
- [ ] Project name displays correctly
- [ ] Chat list displays correctly
- [ ] If no chats, shows empty state
- [ ] No console errors

---

#### 5.2 Project Name Edit
**Test Steps:**
1. On project page, click project name
2. Edit the name
3. Press Enter or click outside

**Expected Behavior:**
- [ ] Name becomes editable
- [ ] On save, PATCH request to `/api/projects/[id]`
- [ ] Success toast appears
- [ ] Name updates in UI
- [ ] Name updates in sidebar

---

#### 5.3 Project Not Found
**Test Steps:**
1. Navigate to: `http://localhost:3000/project/00000000-0000-0000-0000-000000000000`

**Expected Behavior:**
- [ ] Shows "Project not found" message
- [ ] Shows "Go back home" button
- [ ] Button navigates to `/`
- [ ] No console errors (404 is expected)

---

### Test Suite 6: Chat Interface

#### 6.1 Send Message (New Chat)
**Test Steps:**
1. Navigate to `http://localhost:3000`
2. Ensure no `chatId` in URL
3. Type message: "Hello, this is a test message"
4. Click send

**Expected Behavior:**
- [ ] Message appears in chat immediately
- [ ] Loader appears while waiting for response
- [ ] POST request to `/api/chat` in Network tab
- [ ] Response streams in real-time
- [ ] Response appears word by word
- [ ] URL updates with `?chatId=[NEW_ID]`
- [ ] Header `X-Chat-Id` in response
- [ ] Messages saved to database (verify with GET `/api/chats/[id]`)

---

#### 6.2 Send Message (Existing Chat)
**Test Steps:**
1. Navigate to `/?chatId=[EXISTING_CHAT_ID]`
2. Wait for history to load
3. Send new message: "Follow-up message"

**Expected Behavior:**
- [ ] Previous messages loaded from database
- [ ] New message appended to conversation
- [ ] Response streams correctly
- [ ] `chatId` stays the same in URL
- [ ] Messages persist (refresh and verify)

---

#### 6.3 Model Switching
**Test Steps:**
1. Start new chat
2. Change model dropdown to "Claude Sonnet 4.5"
3. Send message

**Expected Behavior:**
- [ ] Model changes in UI
- [ ] POST request includes `"model":"anthropic/claude-sonnet-4.5"`
- [ ] Response comes from selected model
- [ ] Model setting persists in chat

---

#### 6.4 Web Search Toggle
**Test Steps:**
1. Start new chat
2. Enable web search toggle
3. Send message: "What's the weather today?"

**Expected Behavior:**
- [ ] Toggle switches ON
- [ ] Model automatically switches to Perplexity
- [ ] POST request includes `"webSearch":true`
- [ ] Response may include sources (if supported)

---

#### 6.5 Chat History Loading
**Test Steps:**
1. Send 5 messages in a chat
2. Refresh page
3. Wait for load

**Expected Behavior:**
- [ ] All 5 message pairs load
- [ ] Messages appear in correct order
- [ ] Can continue conversation
- [ ] No data loss

---

## 🔗 Integration Tests

### Test Suite 7: End-to-End User Flows

#### 7.1 Flow: Create Project → Add Chat → Refresh
**Steps:**
1. Click "New project"
2. Name: "E2E Test Project"
3. Create project
4. Click on project in sidebar
5. Navigate to project page
6. Click "New Chat" button (if exists) OR go to home
7. Send message: "Test message in project"
8. Verify URL has chatId
9. Refresh page
10. Navigate back to project page

**Expected:**
- [ ] Project persists after refresh
- [ ] Chat appears in project's chat list
- [ ] Chat has `project_id` set
- [ ] Can access chat from project page

---

#### 7.2 Flow: Move Chat Between Projects
**Steps:**
1. Create Project A: "Project A"
2. Create Project B: "Project B"
3. Create standalone chat
4. Use PATCH `/api/chats/[id]/project` to move chat to Project A
5. Verify chat appears in Project A's chat list
6. Move chat to Project B
7. Verify chat appears in Project B's chat list
8. Verify chat no longer in Project A

**Expected:**
- [ ] Chat successfully moves between projects
- [ ] `project_id` updates correctly
- [ ] Chat appears in correct project's list

---

#### 7.3 Flow: Detach Chat from Project
**Steps:**
1. Create project with chat
2. PATCH chat with `project_id: null`
3. Verify chat removed from project
4. Verify chat still exists as standalone

**Expected:**
- [ ] Chat detaches from project
- [ ] Chat remains in global chat list
- [ ] No data loss

---

#### 7.4 Flow: Delete Project with Chats
**Steps:**
1. Create project
2. Add 3 chats to project
3. Delete project
4. Check if chats still exist

**Expected:**
- [ ] Project deleted
- [ ] Chats still exist (just detached)
- [ ] Chats have `project_id = null`

---

## ❌ Error Handling Tests

### Test Suite 8: Error Scenarios

#### 8.1 Network Error Simulation
**Test Steps:**
1. Open DevTools → Network tab
2. Enable "Offline" mode
3. Try to send a message

**Expected:**
- [ ] Error toast appears
- [ ] Message: "Failed to send message" or similar
- [ ] No crash or console errors (beyond expected network failure)

---

#### 8.2 API Error (500)
**Test Steps:**
1. Modify API route to throw error (temporary):
```typescript
// In app/api/chat/route.ts
export async function POST() {
  throw new Error("Simulated error");
}
```
2. Send message

**Expected:**
- [ ] Error boundary catches error OR
- [ ] Error toast appears
- [ ] User sees friendly error message
- [ ] Can recover (no infinite error loop)

---

#### 8.3 Invalid Chat ID
**Test Steps:**
1. Navigate to `/?chatId=invalid-uuid-12345`

**Expected:**
- [ ] Shows error message OR
- [ ] Starts new chat
- [ ] No crash

---

#### 8.4 Component Error Boundary
**Test Steps:**
1. Create a component that throws error:
```tsx
// Temporary test component
function ErrorTest() {
  throw new Error("Test error");
}
```
2. Render it somewhere
3. Observe error boundary

**Expected:**
- [ ] Error boundary shows "Something went wrong"
- [ ] Shows "Try again" button
- [ ] Shows "Go to home" button
- [ ] Error logged to console

---

## ⚡ Performance Tests

### Test Suite 9: Performance Benchmarks

#### 9.1 Page Load Performance
**Test Steps:**
1. Open DevTools → Performance tab
2. Start recording
3. Navigate to `http://localhost:3000`
4. Stop recording when page fully loaded

**Metrics:**
- [ ] First Contentful Paint (FCP): < 1.5s
- [ ] Largest Contentful Paint (LCP): < 2.5s
- [ ] Time to Interactive (TTI): < 3.5s
- [ ] Cumulative Layout Shift (CLS): < 0.1

---

#### 9.2 API Response Times
**Test Steps:**
1. Check Network tab for API calls

**Benchmarks:**
- [ ] `/api/projects`: < 200ms
- [ ] `/api/chats`: < 200ms
- [ ] `/api/chats/[id]`: < 300ms (includes messages)
- [ ] `/api/chat` (first chunk): < 1000ms

---

#### 9.3 Large Chat History Loading
**Test Steps:**
1. Create chat with 100+ messages (use script)
2. Load chat: `/?chatId=[ID]`
3. Measure load time

**Expected:**
- [ ] Loads in < 2s
- [ ] No lag when scrolling
- [ ] No memory leaks

---

## 🤖 Automated Test Scripts

### Script 1: Backend API Test Suite

Save as `tests/api/run-all-tests.sh`:

```bash
#!/bin/bash

# Bobo AI - V1 Backend API Test Suite
# Run all backend API tests

set -e  # Exit on error

BASE_URL="http://localhost:3000"
PASS=0
FAIL=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "🧪 Starting Bobo AI V1 API Tests..."
echo "Base URL: $BASE_URL"
echo ""

# Helper function to test endpoint
test_endpoint() {
  local method=$1
  local endpoint=$2
  local data=$3
  local expected_status=$4
  local test_name=$5

  echo -n "Testing: $test_name... "

  if [ -z "$data" ]; then
    response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint")
  else
    response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
      -H "Content-Type: application/json" \
      -d "$data")
  fi

  status_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')

  if [ "$status_code" -eq "$expected_status" ]; then
    echo -e "${GREEN}✓ PASS${NC} (Status: $status_code)"
    ((PASS++))
  else
    echo -e "${RED}✗ FAIL${NC} (Expected: $expected_status, Got: $status_code)"
    echo "Response: $body"
    ((FAIL++))
  fi
}

# Test Suite 1: Projects
echo "📁 Testing Project Endpoints"
echo "----------------------------"

test_endpoint "GET" "/api/projects" "" 200 "List all projects"

test_endpoint "POST" "/api/projects" \
  '{"name":"Test Project","description":"Automated test"}' \
  201 "Create project"

# Get project ID for further tests
PROJECT_ID=$(curl -s -X POST "$BASE_URL/api/projects" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Get Project"}' | jq -r '.project.id')

test_endpoint "GET" "/api/projects/$PROJECT_ID" "" 200 "Get project by ID"

test_endpoint "PATCH" "/api/projects/$PROJECT_ID" \
  '{"name":"Updated Name"}' \
  200 "Update project"

# Test Suite 2: Chats
echo ""
echo "💬 Testing Chat Endpoints"
echo "-------------------------"

test_endpoint "GET" "/api/chats" "" 200 "List all chats"

test_endpoint "POST" "/api/chats" \
  '{"title":"Test Chat","model":"openai/gpt-4o"}' \
  201 "Create chat"

CHAT_ID=$(curl -s -X POST "$BASE_URL/api/chats" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Get Chat","model":"openai/gpt-4o"}' | jq -r '.chat.id')

test_endpoint "GET" "/api/chats/$CHAT_ID" "" 200 "Get chat by ID"

test_endpoint "PATCH" "/api/chats/$CHAT_ID" \
  '{"title":"Updated Chat Title"}' \
  200 "Update chat"

# Test Suite 3: Project-Chat Association
echo ""
echo "🔗 Testing Project-Chat Association"
echo "------------------------------------"

test_endpoint "GET" "/api/projects/$PROJECT_ID/chats" "" 200 "List project chats"

test_endpoint "PATCH" "/api/chats/$CHAT_ID/project" \
  "{\"project_id\":\"$PROJECT_ID\"}" \
  200 "Move chat to project"

test_endpoint "PATCH" "/api/chats/$CHAT_ID/project" \
  '{"project_id":null}' \
  200 "Detach chat from project"

# Test Suite 4: Edge Cases
echo ""
echo "⚠️  Testing Edge Cases"
echo "----------------------"

test_endpoint "POST" "/api/projects" \
  '{"description":"No name"}' \
  400 "Create project without name (should fail)"

test_endpoint "GET" "/api/projects/00000000-0000-0000-0000-000000000000" \
  "" 404 "Get non-existent project"

# Test Suite 5: Cleanup (DELETE tests)
echo ""
echo "🗑️  Testing Delete Operations"
echo "-----------------------------"

test_endpoint "DELETE" "/api/chats/$CHAT_ID" "" 204 "Delete chat"

test_endpoint "DELETE" "/api/projects/$PROJECT_ID" "" 204 "Delete project"

# Summary
echo ""
echo "=============================="
echo "Test Results"
echo "=============================="
echo -e "${GREEN}Passed: $PASS${NC}"
echo -e "${RED}Failed: $FAIL${NC}"
echo "Total: $((PASS + FAIL))"
echo ""

if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}✓ All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}✗ Some tests failed${NC}"
  exit 1
fi
```

**Usage:**
```bash
chmod +x tests/api/run-all-tests.sh
./tests/api/run-all-tests.sh
```

---

### Script 2: Database Data Seeder

Save as `tests/seed-data.ts`:

```typescript
/**
 * Seed database with test data
 * Run with: npx tsx tests/seed-data.ts
 */

const BASE_URL = 'http://localhost:3000';

async function seedData() {
  console.log('🌱 Seeding test data...\n');

  // Create 3 projects
  const projects = [];
  for (let i = 1; i <= 3; i++) {
    const res = await fetch(`${BASE_URL}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Test Project ${i}`,
        description: `This is test project number ${i}`,
      }),
    });
    const data = await res.json();
    projects.push(data.project);
    console.log(`✓ Created project: ${data.project.name}`);
  }

  // Create 10 standalone chats
  const chats = [];
  for (let i = 1; i <= 10; i++) {
    const res = await fetch(`${BASE_URL}/api/chats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `Standalone Chat ${i}`,
        model: 'openai/gpt-4o',
      }),
    });
    const data = await res.json();
    chats.push(data.chat);
    console.log(`✓ Created chat: ${data.chat.title}`);
  }

  // Add chats to projects (5 chats to first project)
  for (let i = 0; i < 5; i++) {
    await fetch(`${BASE_URL}/api/chats/${chats[i].id}/project`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: projects[0].id }),
    });
    console.log(`✓ Added ${chats[i].title} to ${projects[0].name}`);
  }

  console.log('\n✅ Seeding complete!');
  console.log(`Projects: ${projects.length}`);
  console.log(`Chats: ${chats.length}`);
}

seedData().catch(console.error);
```

**Usage:**
```bash
npx tsx tests/seed-data.ts
```

---

## 📊 Test Results Template

Copy this template to record test results:

```markdown
# V1 Test Results

**Date:** [DATE]
**Tester:** [NAME]
**Environment:** Development / Staging / Production
**Git Commit:** [COMMIT_HASH]

---

## Backend API Tests

### Projects
- [ ] GET /api/projects - PASS / FAIL
- [ ] POST /api/projects - PASS / FAIL
- [ ] GET /api/projects/[id] - PASS / FAIL
- [ ] PATCH /api/projects/[id] - PASS / FAIL
- [ ] DELETE /api/projects/[id] - PASS / FAIL
- [ ] GET /api/projects/[id]/chats - PASS / FAIL

### Chats
- [ ] GET /api/chats - PASS / FAIL
- [ ] POST /api/chats - PASS / FAIL
- [ ] GET /api/chats/[id] - PASS / FAIL
- [ ] PATCH /api/chats/[id] - PASS / FAIL
- [ ] DELETE /api/chats/[id] - PASS / FAIL
- [ ] PATCH /api/chats/[id]/project - PASS / FAIL

### Streaming
- [ ] POST /api/chat (new chat) - PASS / FAIL
- [ ] POST /api/chat (existing chat) - PASS / FAIL

---

## Frontend UI Tests

### Sidebar
- [ ] Data loading - PASS / FAIL
- [ ] Create project modal - PASS / FAIL
- [ ] Project navigation - PASS / FAIL
- [ ] Chat navigation - PASS / FAIL

### Project Page
- [ ] Data loading - PASS / FAIL
- [ ] Name editing - PASS / FAIL
- [ ] 404 handling - PASS / FAIL

### Chat Interface
- [ ] New chat message - PASS / FAIL
- [ ] Existing chat continuation - PASS / FAIL
- [ ] Model switching - PASS / FAIL
- [ ] Web search toggle - PASS / FAIL
- [ ] History loading - PASS / FAIL

---

## Integration Tests

- [ ] Create project → add chat → refresh - PASS / FAIL
- [ ] Move chat between projects - PASS / FAIL
- [ ] Detach chat from project - PASS / FAIL
- [ ] Delete project with chats - PASS / FAIL

---

## Error Handling

- [ ] Network error - PASS / FAIL
- [ ] API 500 error - PASS / FAIL
- [ ] Invalid chat ID - PASS / FAIL
- [ ] Error boundary - PASS / FAIL

---

## Performance

- [ ] Page load < 2.5s LCP - PASS / FAIL
- [ ] API responses < 300ms - PASS / FAIL
- [ ] Large chat loading < 2s - PASS / FAIL

---

## Issues Found

1. [Describe issue]
   - Severity: Critical / High / Medium / Low
   - Steps to reproduce:
   - Expected:
   - Actual:

2. ...

---

## Overall Result

- Total Tests: [X]
- Passed: [X]
- Failed: [X]
- Pass Rate: [X]%

**Ready for V1 Launch:** YES / NO

**Blocker Issues:**
- [List any blockers]

**Notes:**
[Any additional observations]
```

---

## 🚀 Next Steps

### Before Testing
1. [ ] Start dev server: `npm run dev`
2. [ ] Verify Supabase connection
3. [ ] Seed test data: `npx tsx tests/seed-data.ts`

### During Testing
1. [ ] Run automated backend tests: `./tests/api/run-all-tests.sh`
2. [ ] Manually test frontend UI flows
3. [ ] Document results using template above

### After Testing
1. [ ] Fix any critical/high severity bugs
2. [ ] Re-test failed cases
3. [ ] Update Progress Tracker with results
4. [ ] Decide: Ship V1 or continue fixing

---

**Document Maintained By:** Engineering Team
**Last Updated:** November 22, 2025
