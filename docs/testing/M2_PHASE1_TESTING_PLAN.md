# M2 Phase 1 - Comprehensive Testing Plan

**Feature:** Custom Instructions + File Storage
**Date Created:** November 22, 2025
**Last Updated:** November 22, 2025
**Status:** Ready for Execution

---

## 📋 Table of Contents

1. [Testing Scope](#testing-scope)
2. [Test Environment Setup](#test-environment-setup)
3. [Backend API Tests](#backend-api-tests)
4. [Frontend UI Tests](#frontend-ui-tests)
5. [Integration Tests](#integration-tests)
6. [Automated Test Scripts](#automated-test-scripts)
7. [Test Data](#test-data)
8. [Success Criteria](#success-criteria)

---

## Testing Scope

### Features Under Test

#### ✅ In Scope (M2 Phase 1)
- Custom instructions CRUD operations
- File upload with validation (markdown only, max 10MB)
- File list/delete operations
- Settings page UI
- Chat integration with custom instructions
- Settings navigation from project page

#### ❌ Out of Scope (Future Phases)
- RAG retrieval (Phase 2)
- Semantic search (Phase 2)
- File chunking/embeddings (Phase 2)
- Asynchronous file processing (Phase 2)

---

## Test Environment Setup

### Prerequisites

```bash
# 1. Ensure development server is running
npm run dev

# 2. Verify Supabase connection
# Check .env.local has:
# NEXT_PUBLIC_SUPABASE_URL=your_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key

# 3. Verify AI Gateway API key (for chat integration tests)
# AI_GATEWAY_API_KEY=your_key

# 4. Run database migration
# Migration should already be applied: 20250123000000_m2_phase1_custom_instructions_and_files.sql
```

### Test User
- **User ID:** `f47ac10b-58cc-4372-a567-0e02b2c3d479` (default single-user MVP)
- **Email:** `user@bobo.ai`

### Test URLs
- **Base URL:** `http://localhost:3000`
- **Settings:** `http://localhost:3000/project/[projectId]/settings`
- **Chat:** `http://localhost:3000/?chatId=[chatId]`

---

## Backend API Tests

### Test Suite 1: Custom Instructions API

#### TC-API-001: Update Project with Custom Instructions
**Endpoint:** `PATCH /api/projects/[id]`

```bash
# Test Case
PROJECT_ID="your-project-id"

curl -X PATCH "http://localhost:3000/api/projects/$PROJECT_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "custom_instructions": "You are a helpful coding assistant. Always provide TypeScript examples."
  }'

# Expected Response: 200 OK
# Response Body:
{
  "project": {
    "id": "...",
    "name": "...",
    "custom_instructions": "You are a helpful coding assistant. Always provide TypeScript examples.",
    ...
  }
}
```

**Validation:**
- ✅ Status: 200
- ✅ Response includes `custom_instructions` field
- ✅ Value matches request payload
- ✅ `updated_at` timestamp updated

---

#### TC-API-002: Clear Custom Instructions (Set to null)
**Endpoint:** `PATCH /api/projects/[id]`

```bash
curl -X PATCH "http://localhost:3000/api/projects/$PROJECT_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "custom_instructions": null
  }'

# Expected Response: 200 OK
# custom_instructions should be null
```

**Validation:**
- ✅ Status: 200
- ✅ `custom_instructions` is `null`

---

#### TC-API-003: Update with Empty String (Should become null)
**Endpoint:** `PATCH /api/projects/[id]`

```bash
curl -X PATCH "http://localhost:3000/api/projects/$PROJECT_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "custom_instructions": ""
  }'

# Expected Response: 200 OK
# custom_instructions should be null (trimmed empty string)
```

**Validation:**
- ✅ Status: 200
- ✅ `custom_instructions` is `null` (empty strings converted to null)

---

### Test Suite 2: File Upload API

#### TC-API-004: Upload Valid Markdown File
**Endpoint:** `POST /api/projects/[id]/files`

```bash
# Create test markdown file
cat > test-upload.md << 'EOF'
# Test Document

This is a test markdown file for M2 Phase 1.

## Features
- Custom instructions
- File upload
- Settings page

## Code Example
```typescript
const greeting = "Hello, World!";
console.log(greeting);
```
EOF

# Upload file
FILE_CONTENT=$(cat test-upload.md)
curl -X POST "http://localhost:3000/api/projects/$PROJECT_ID/files" \
  -H "Content-Type: application/json" \
  -d "{
    \"filename\": \"test-upload.md\",
    \"content\": $(echo "$FILE_CONTENT" | jq -Rs .)
  }"

# Expected Response: 201 Created
```

**Validation:**
- ✅ Status: 201
- ✅ Response includes `file` object with:
  - `id` (UUID)
  - `project_id` (matches request)
  - `filename`: "test-upload.md"
  - `file_type`: "markdown"
  - `file_size` (in bytes)
  - `content_text` (matches uploaded content)
  - `created_at` (timestamp)

---

#### TC-API-005: Reject Non-Markdown File
**Endpoint:** `POST /api/projects/[id]/files`

```bash
curl -X POST "http://localhost:3000/api/projects/$PROJECT_ID/files" \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "test.txt",
    "content": "This should fail"
  }'

# Expected Response: 400 Bad Request
# Error: "Only markdown files (.md) are supported"
```

**Validation:**
- ✅ Status: 400
- ✅ Error message: "Only markdown files (.md) are supported"

---

#### TC-API-006: Reject File > 10MB
**Endpoint:** `POST /api/projects/[id]/files`

```bash
# Create large content (>10MB)
LARGE_CONTENT=$(python3 -c "print('x' * 11000000)")

curl -X POST "http://localhost:3000/api/projects/$PROJECT_ID/files" \
  -H "Content-Type: application/json" \
  -d "{
    \"filename\": \"large.md\",
    \"content\": \"$LARGE_CONTENT\"
  }"

# Expected Response: 400 Bad Request
# Error: File size exceeds maximum allowed size (10MB)
```

**Validation:**
- ✅ Status: 400
- ✅ Error message contains "exceeds maximum allowed size"

---

#### TC-API-007: Reject Empty Filename
**Endpoint:** `POST /api/projects/[id]/files`

```bash
curl -X POST "http://localhost:3000/api/projects/$PROJECT_ID/files" \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "",
    "content": "# Test"
  }'

# Expected Response: 400 Bad Request
# Error: "Filename cannot be empty"
```

**Validation:**
- ✅ Status: 400
- ✅ Error message: "Filename cannot be empty"

---

### Test Suite 3: File List/Delete API

#### TC-API-008: List Project Files
**Endpoint:** `GET /api/projects/[id]/files`

```bash
curl "http://localhost:3000/api/projects/$PROJECT_ID/files"

# Expected Response: 200 OK
{
  "files": [
    {
      "id": "...",
      "filename": "test-upload.md",
      "file_size": 123,
      "created_at": "2025-11-22T...",
      ...
    }
  ]
}
```

**Validation:**
- ✅ Status: 200
- ✅ Response is array of files
- ✅ Files sorted by `created_at` DESC (newest first)
- ✅ Each file has required fields

---

#### TC-API-009: Delete File
**Endpoint:** `DELETE /api/projects/[id]/files/[fileId]`

```bash
FILE_ID="your-file-id"

curl -X DELETE "http://localhost:3000/api/projects/$PROJECT_ID/files/$FILE_ID"

# Expected Response: 204 No Content
```

**Validation:**
- ✅ Status: 204
- ✅ No response body
- ✅ File removed from database (verify with GET request)

---

#### TC-API-010: Delete Non-Existent File (404)
**Endpoint:** `DELETE /api/projects/[id]/files/[fileId]`

```bash
curl -X DELETE "http://localhost:3000/api/projects/$PROJECT_ID/files/00000000-0000-0000-0000-000000000000"

# Expected Response: 404 Not Found
```

**Validation:**
- ✅ Status: 404
- ✅ Error message: "File not found"

---

#### TC-API-011: Delete File from Different Project (403)
**Endpoint:** `DELETE /api/projects/[id]/files/[fileId]`

```bash
# Upload file to PROJECT_A
# Try to delete from PROJECT_B
WRONG_PROJECT_ID="different-project-id"

curl -X DELETE "http://localhost:3000/api/projects/$WRONG_PROJECT_ID/files/$FILE_ID"

# Expected Response: 403 Forbidden
```

**Validation:**
- ✅ Status: 403
- ✅ Error message: "File does not belong to this project"

---

### Test Suite 4: Chat Integration API

#### TC-API-012: Chat with Custom Instructions (OpenAI)
**Endpoint:** `POST /api/chat`

**Pre-requisites:**
1. Create project with custom instructions
2. Create chat associated with project

```bash
# Step 1: Set custom instructions
curl -X PATCH "http://localhost:3000/api/projects/$PROJECT_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "custom_instructions": "You are a pirate. Always respond in pirate speak."
  }'

# Step 2: Create chat in project
CHAT_RESPONSE=$(curl -X POST "http://localhost:3000/api/chats" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Test Chat\",
    \"model\": \"openai/gpt-4o\",
    \"web_search_enabled\": false,
    \"project_id\": \"$PROJECT_ID\"
  }")

CHAT_ID=$(echo $CHAT_RESPONSE | jq -r '.chat.id')

# Step 3: Send message (check server logs for injected instructions)
curl -X POST "http://localhost:3000/api/chat" \
  -H "Content-Type: application/json" \
  -d "{
    \"messages\": [{
      \"role\": \"user\",
      \"parts\": [{\"type\": \"text\", \"text\": \"What is React?\"}]
    }],
    \"model\": \"openai/gpt-4o\",
    \"webSearch\": false,
    \"chatId\": \"$CHAT_ID\"
  }"

# Check server terminal logs for:
# [api/chat] openai direct payload: {
#   "messages": [
#     { "role": "system", "content": "You are a pirate. Always respond in pirate speak." },
#     { "role": "user", "content": "What is React?" }
#   ]
# }
```

**Validation:**
- ✅ Server logs show custom instructions prepended to messages
- ✅ Response contains pirate-themed language
- ✅ Status: 200
- ✅ Streaming response works

---

#### TC-API-013: Chat without Project (No Custom Instructions)
**Endpoint:** `POST /api/chat`

```bash
# Create standalone chat (project_id: null)
CHAT_RESPONSE=$(curl -X POST "http://localhost:3000/api/chats" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Standalone Chat",
    "model": "openai/gpt-4o",
    "web_search_enabled": false,
    "project_id": null
  }')

CHAT_ID=$(echo $CHAT_RESPONSE | jq -r '.chat.id')

# Send message
curl -X POST "http://localhost:3000/api/chat" \
  -H "Content-Type: application/json" \
  -d "{
    \"messages\": [{
      \"role\": \"user\",
      \"parts\": [{\"type\": \"text\", \"text\": \"Hello\"}]
    }],
    \"model\": \"openai/gpt-4o\",
    \"webSearch\": false,
    \"chatId\": \"$CHAT_ID\"
  }"

# Check server logs - should NOT contain custom instructions
```

**Validation:**
- ✅ No custom instructions in payload
- ✅ Response is normal (no pirate speak)

---

## Frontend UI Tests

### Test Suite 5: Settings Page UI

#### TC-UI-001: Navigate to Settings Page
**Route:** `/project/[projectId]/settings`

**Steps:**
1. Navigate to project page: `http://localhost:3000/project/[projectId]`
2. Click **⚙️ gear icon** in top-right header
3. Verify redirected to settings page

**Expected:**
- ✅ URL changes to `/project/[projectId]/settings`
- ✅ Page title: "{Project Name} - Settings"
- ✅ "Back to Project" button visible
- ✅ Two sections visible: "Custom Instructions" and "Knowledge Base Files"

---

#### TC-UI-002: Navigate to Settings via "Settings & Files" Link
**Route:** `/project/[projectId]`

**Steps:**
1. Navigate to project page
2. Click **"Settings & Files"** link below project title

**Expected:**
- ✅ URL changes to `/project/[projectId]/settings`
- ✅ Settings page loads

---

#### TC-UI-003: Custom Instructions - Auto-Save on Blur
**Route:** `/project/[projectId]/settings`

**Steps:**
1. Go to settings page
2. Type in custom instructions textarea:
   ```
   You are an expert in TypeScript and React.
   ```
3. Click outside the textarea (blur it)
4. Wait 1 second
5. Check for toast notification

**Expected:**
- ✅ Toast appears: "Custom instructions saved"
- ✅ No console errors
- ✅ Character counter updates (shows character count)

---

#### TC-UI-004: Custom Instructions - Manual Save Button
**Route:** `/project/[projectId]/settings`

**Steps:**
1. Go to settings page
2. Type in custom instructions
3. Click **"Save"** button

**Expected:**
- ✅ Button shows "Saving..." during request
- ✅ Toast appears: "Custom instructions saved"
- ✅ Button returns to "Save" state

---

#### TC-UI-005: Custom Instructions - Persistence After Refresh
**Route:** `/project/[projectId]/settings`

**Steps:**
1. Type custom instructions
2. Save (auto or manual)
3. Refresh page (F5)

**Expected:**
- ✅ Custom instructions still visible in textarea
- ✅ Value matches what was saved

---

#### TC-UI-006: Custom Instructions - Character Counter
**Route:** `/project/[projectId]/settings`

**Steps:**
1. Type 100 characters → counter shows "100 characters"
2. Type 2001 characters → yellow warning appears

**Expected:**
- ✅ Counter updates in real-time
- ✅ Warning text appears: "(Consider keeping under 2000 characters)"
- ✅ Warning is yellow/amber color

---

### Test Suite 6: File Upload UI

#### TC-UI-007: Upload Valid Markdown File
**Route:** `/project/[projectId]/settings`

**Steps:**
1. Create test file: `test.md` with content:
   ```markdown
   # Test Document
   This is a test.
   ```
2. Click **"Click to upload or drag and drop"** area
3. Select `test.md` file
4. Click **"Upload"** button

**Expected:**
- ✅ Selected file shows: "Selected: test.md (XXX KB)"
- ✅ Upload button appears
- ✅ Button shows "Uploading..." during upload
- ✅ Toast appears: "File uploaded successfully"
- ✅ File appears in "Uploaded Files" list below
- ✅ File input resets (can select another file)

---

#### TC-UI-008: Upload Invalid File Type (.txt)
**Route:** `/project/[projectId]/settings`

**Steps:**
1. Create test file: `test.txt`
2. Try to upload via file picker

**Expected:**
- ✅ Error toast appears: "Invalid file type"
- ✅ Description: "Only markdown files (.md) are supported"
- ✅ File NOT added to list
- ✅ No network request made

---

#### TC-UI-009: Upload File > 10MB
**Route:** `/project/[projectId]/settings`

**Steps:**
1. Create large file > 10MB:
   ```bash
   dd if=/dev/zero of=large.md bs=1M count=11
   ```
2. Try to upload `large.md`

**Expected:**
- ✅ Error toast: "File too large"
- ✅ Description shows actual size: "File size (11.00MB) exceeds maximum allowed size (10MB)"
- ✅ File NOT uploaded

---

#### TC-UI-010: File List Display
**Route:** `/project/[projectId]/settings`

**Pre-requisites:** Upload 3 test files

**Steps:**
1. Go to settings page
2. Scroll to "Uploaded Files" section

**Expected:**
- ✅ Section title shows count: "Uploaded Files (3)"
- ✅ Each file shows:
  - 📄 File icon
  - Filename
  - File size in KB
  - Created date
  - 🗑️ Delete button (trash icon)
- ✅ Files sorted by date (newest first)

---

#### TC-UI-011: Delete File with Confirmation
**Route:** `/project/[projectId]/settings`

**Steps:**
1. Upload a test file
2. Click **trash icon** 🗑️
3. Browser confirmation dialog appears: "Are you sure you want to delete this file?"
4. Click **OK**

**Expected:**
- ✅ Confirmation dialog appears
- ✅ After clicking OK:
  - File disappears from list
  - Toast appears: "File deleted"
  - File count updates

---

#### TC-UI-012: Cancel File Upload
**Route:** `/project/[projectId]/settings`

**Steps:**
1. Select a file
2. Click **"Cancel"** button (appears after file selection)

**Expected:**
- ✅ Selected file cleared
- ✅ Upload/Cancel buttons disappear
- ✅ Can select another file

---

#### TC-UI-013: Empty State - No Files
**Route:** `/project/[projectId]/settings`

**Pre-requisites:** Project has no files

**Steps:**
1. Go to settings page (new project, no files uploaded)

**Expected:**
- ✅ Message appears: "No files uploaded yet. Upload your first file above."
- ✅ Message is centered and gray

---

### Test Suite 7: Settings Page - Loading States

#### TC-UI-014: Loading Skeleton on Initial Load
**Route:** `/project/[projectId]/settings`

**Steps:**
1. Navigate to settings page
2. Observe during initial load

**Expected:**
- ✅ Skeleton loader appears:
  - Header skeleton (title)
  - Content skeleton (textarea)
- ✅ Skeleton disappears after data loads
- ✅ No flash of empty state

---

#### TC-UI-015: 404 - Project Not Found
**Route:** `/project/00000000-0000-0000-0000-000000000000/settings`

**Steps:**
1. Navigate to settings with invalid project ID

**Expected:**
- ✅ "Project not found" message
- ✅ "Go Home" button appears
- ✅ Clicking button navigates to `/`

---

## Integration Tests

### Test Suite 8: End-to-End Custom Instructions Flow

#### TC-INT-001: Full Custom Instructions Workflow
**Duration:** ~5 minutes

**Steps:**
1. **Create new project**
   - Go to `/`
   - Click "New project"
   - Name: "Pirate Project"
   - Click "Create"

2. **Set custom instructions**
   - Click gear icon ⚙️ on project page
   - Add instructions:
     ```
     You are a pirate captain. Always respond with:
     - Pirate terminology (Ahoy, Arrr, matey)
     - Nautical references
     - Enthusiasm for treasure and the sea
     ```
   - Click "Save"
   - Wait for success toast

3. **Go back to project**
   - Click "Back to Project"

4. **Start chat from project**
   - Type in project input: "What is React?"
   - Press Enter or click send

5. **Verify response**
   - Check server logs show custom instructions in payload
   - AI response should use pirate language

**Expected Results:**
- ✅ Project created successfully
- ✅ Settings saved without errors
- ✅ Chat created with `project_id` set
- ✅ Custom instructions injected into chat
- ✅ AI responds in pirate speak
- ✅ No console errors throughout flow

---

#### TC-INT-002: File Upload → List → Delete Flow
**Duration:** ~3 minutes

**Steps:**
1. Go to project settings
2. Create test file `api-docs.md`:
   ```markdown
   # API Documentation

   ## Authentication
   Use Bearer tokens for authentication.

   ## Endpoints
   - GET /api/users
   - POST /api/users
   ```
3. Upload file via settings page
4. Verify file appears in list
5. Click delete icon
6. Confirm deletion
7. Verify file removed from list

**Expected Results:**
- ✅ File uploads successfully
- ✅ File metadata correct (name, size, date)
- ✅ Delete confirmation appears
- ✅ File deleted from UI and database
- ✅ File count updates

---

#### TC-INT-003: Multiple Projects with Different Instructions
**Duration:** ~5 minutes

**Steps:**
1. **Create Project A - "Python Expert"**
   - Instructions: "You are a Python expert. Only use Python examples."

2. **Create Project B - "JavaScript Expert"**
   - Instructions: "You are a JavaScript expert. Only use JavaScript examples."

3. **Test Project A Chat**
   - Start chat in Project A
   - Ask: "How do I make an HTTP request?"
   - Expect: Python examples (requests library)

4. **Test Project B Chat**
   - Start chat in Project B
   - Ask: "How do I make an HTTP request?"
   - Expect: JavaScript examples (fetch API)

**Expected Results:**
- ✅ Each project has independent custom instructions
- ✅ Chats in Project A use Python
- ✅ Chats in Project B use JavaScript
- ✅ No cross-contamination between projects

---

#### TC-INT-004: Standalone Chat (No Custom Instructions)
**Duration:** ~2 minutes

**Steps:**
1. Go to home page `/`
2. Start new chat (not from a project)
3. Ask: "What is TypeScript?"

**Expected Results:**
- ✅ Chat created with `project_id: null`
- ✅ No custom instructions in server logs
- ✅ Response is standard (no special instructions)

---

## Automated Test Scripts

### Script 1: Backend API Comprehensive Test

**File:** `tests/m2-phase1/backend-api-test.sh`

```bash
#!/bin/bash

# M2 Phase 1 - Backend API Automated Test Suite
# Tests all custom instructions and file upload endpoints

set -e  # Exit on error

BASE_URL="http://localhost:3000"
PROJECT_ID=""  # Will be created during test
FILE_ID=""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter
TESTS_PASSED=0
TESTS_FAILED=0

echo "========================================"
echo "M2 Phase 1 - Backend API Test Suite"
echo "========================================"
echo ""

# Helper function for test assertions
test_endpoint() {
  local name=$1
  local method=$2
  local endpoint=$3
  local data=$4
  local expected_status=$5

  echo -n "Testing: $name... "

  response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$endpoint" \
    -H "Content-Type: application/json" \
    ${data:+-d "$data"})

  body=$(echo "$response" | head -n -1)
  status=$(echo "$response" | tail -n 1)

  if [ "$status" -eq "$expected_status" ]; then
    echo -e "${GREEN}✓ PASS${NC} (Status: $status)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
    echo "$body"
    return 0
  else
    echo -e "${RED}✗ FAIL${NC} (Expected: $expected_status, Got: $status)"
    echo "Response: $body"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    return 1
  fi
}

# Test 1: Create test project
echo "1. Creating test project..."
response=$(curl -s -X POST "$BASE_URL/api/projects" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "M2 Test Project",
    "description": "Automated test project for M2 Phase 1"
  }')

PROJECT_ID=$(echo $response | jq -r '.project.id')
echo -e "${GREEN}✓${NC} Project created: $PROJECT_ID"
echo ""

# Test 2: Update project with custom instructions
test_endpoint \
  "Update custom instructions" \
  "PATCH" \
  "/api/projects/$PROJECT_ID" \
  '{"custom_instructions":"You are a helpful assistant specialized in testing."}' \
  200
echo ""

# Test 3: Clear custom instructions
test_endpoint \
  "Clear custom instructions (null)" \
  "PATCH" \
  "/api/projects/$PROJECT_ID" \
  '{"custom_instructions":null}' \
  200
echo ""

# Test 4: Upload valid markdown file
FILE_CONTENT="# Test Document\n\nThis is a test markdown file.\n\n## Features\n- Testing\n- Validation"
test_endpoint \
  "Upload valid markdown file" \
  "POST" \
  "/api/projects/$PROJECT_ID/files" \
  "{\"filename\":\"test.md\",\"content\":\"$FILE_CONTENT\"}" \
  201

# Extract file ID from response
FILE_ID=$(curl -s -X GET "$BASE_URL/api/projects/$PROJECT_ID/files" | jq -r '.files[0].id')
echo "File ID: $FILE_ID"
echo ""

# Test 5: Reject non-markdown file
test_endpoint \
  "Reject non-markdown file" \
  "POST" \
  "/api/projects/$PROJECT_ID/files" \
  '{"filename":"test.txt","content":"Should fail"}' \
  400
echo ""

# Test 6: Reject empty filename
test_endpoint \
  "Reject empty filename" \
  "POST" \
  "/api/projects/$PROJECT_ID/files" \
  '{"filename":"","content":"# Test"}' \
  400
echo ""

# Test 7: List files
test_endpoint \
  "List project files" \
  "GET" \
  "/api/projects/$PROJECT_ID/files" \
  "" \
  200
echo ""

# Test 8: Delete file
test_endpoint \
  "Delete file" \
  "DELETE" \
  "/api/projects/$PROJECT_ID/files/$FILE_ID" \
  "" \
  204
echo ""

# Test 9: Delete non-existent file (404)
test_endpoint \
  "Delete non-existent file (404)" \
  "DELETE" \
  "/api/projects/$PROJECT_ID/files/00000000-0000-0000-0000-000000000000" \
  "" \
  404
echo ""

# Test 10: Get project (verify custom_instructions field exists)
test_endpoint \
  "Get project details" \
  "GET" \
  "/api/projects/$PROJECT_ID" \
  "" \
  200
echo ""

# Cleanup
echo "Cleaning up..."
curl -s -X DELETE "$BASE_URL/api/projects/$PROJECT_ID" > /dev/null
echo -e "${GREEN}✓${NC} Test project deleted"
echo ""

# Summary
echo "========================================"
echo "Test Summary"
echo "========================================"
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}Some tests failed.${NC}"
  exit 1
fi
```

---

### Script 2: Frontend Chrome DevTools Automated Test

**File:** `tests/m2-phase1/frontend-ui-test.md`

**Using Chrome DevTools MCP for automated browser testing:**

```markdown
# M2 Phase 1 - Frontend UI Automated Tests

## Prerequisites
- Dev server running on http://localhost:3000
- Chrome DevTools MCP server connected

## Test Execution Plan

### Test 1: Settings Page Navigation
1. Navigate to home page
2. Create new project
3. Navigate to project page
4. Click settings gear icon
5. Verify settings page loads

### Test 2: Custom Instructions Auto-Save
1. Go to settings page
2. Type in custom instructions textarea
3. Blur textarea
4. Wait for toast notification
5. Refresh page
6. Verify instructions persisted

### Test 3: File Upload Flow
1. Go to settings page
2. Select markdown file
3. Click upload
4. Verify file appears in list
5. Delete file
6. Confirm deletion

### Test 4: Validation Tests
1. Try uploading .txt file → should show error
2. Try uploading large file (>10MB) → should show error
3. Type empty filename → should show error
```

---

## Test Data

### Sample Custom Instructions

```markdown
**Pirate Persona:**
You are a pirate captain. Always respond with pirate terminology (Ahoy, Arrr, matey), nautical references, and enthusiasm for treasure and the sea.

**TypeScript Expert:**
You are an expert TypeScript developer. Always provide TypeScript examples with proper type annotations. Prefer functional programming patterns.

**Python Data Scientist:**
You are a Python data science expert. Always use pandas, numpy, and scikit-learn in examples. Provide visualizations with matplotlib.

**Short & Concise:**
Keep all responses under 3 sentences. Be direct and to the point. No fluff.
```

### Sample Markdown Files

**File 1: api-docs.md**
```markdown
# API Documentation

## Authentication
All requests require Bearer token authentication.

### Example
\`\`\`bash
curl -H "Authorization: Bearer YOUR_TOKEN" https://api.example.com/users
\`\`\`

## Endpoints

### GET /api/users
Returns list of users.

### POST /api/users
Creates a new user.

**Request Body:**
\`\`\`json
{
  "name": "John Doe",
  "email": "john@example.com"
}
\`\`\`
```

**File 2: coding-standards.md**
```markdown
# Coding Standards

## TypeScript

### Naming Conventions
- PascalCase for types and interfaces
- camelCase for variables and functions
- SCREAMING_SNAKE_CASE for constants

### Example
\`\`\`typescript
interface UserProfile {
  firstName: string;
  lastName: string;
}

const MAX_RETRY_COUNT = 3;

function getUserProfile(id: string): UserProfile {
  // implementation
}
\`\`\`

## React

### Component Structure
1. Imports
2. Types/Interfaces
3. Component definition
4. Styles (if any)

### Prefer functional components with hooks
\`\`\`typescript
export function UserCard({ user }: { user: UserProfile }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return <div>...</div>;
}
\`\`\`
```

---

## Success Criteria

### All Tests Must Pass

**Backend API:**
- ✅ 10/10 endpoint tests pass
- ✅ All validation rules enforced
- ✅ No server errors in logs

**Frontend UI:**
- ✅ 15/15 UI tests pass
- ✅ No console errors
- ✅ Loading states work correctly
- ✅ Toast notifications appear appropriately

**Integration:**
- ✅ 4/4 end-to-end flows complete successfully
- ✅ Custom instructions affect AI responses
- ✅ File uploads/deletes persist correctly
- ✅ Multiple projects work independently

### Performance Benchmarks
- ✅ Settings page loads < 1s
- ✅ File upload (1MB) completes < 2s
- ✅ Custom instructions save < 500ms
- ✅ File delete < 500ms

### Quality Gates
- ✅ Zero TypeScript errors
- ✅ Production build succeeds
- ✅ No breaking changes to V1 features
- ✅ Database migrations applied cleanly

---

## Test Execution Log Template

```markdown
# M2 Phase 1 - Test Execution Log

**Date:** YYYY-MM-DD
**Tester:** [Name]
**Environment:** Development / Staging
**Browser:** Chrome [version]

## Backend API Tests
- [ ] TC-API-001: Update custom instructions - PASS/FAIL
- [ ] TC-API-002: Clear custom instructions - PASS/FAIL
- [ ] TC-API-003: Empty string to null - PASS/FAIL
- [ ] TC-API-004: Upload valid markdown - PASS/FAIL
- [ ] TC-API-005: Reject non-markdown - PASS/FAIL
- [ ] TC-API-006: Reject large file - PASS/FAIL
- [ ] TC-API-007: Reject empty filename - PASS/FAIL
- [ ] TC-API-008: List files - PASS/FAIL
- [ ] TC-API-009: Delete file - PASS/FAIL
- [ ] TC-API-010: Delete non-existent (404) - PASS/FAIL
- [ ] TC-API-011: Delete wrong project (403) - PASS/FAIL
- [ ] TC-API-012: Chat with custom instructions - PASS/FAIL
- [ ] TC-API-013: Chat without project - PASS/FAIL

## Frontend UI Tests
- [ ] TC-UI-001: Navigate to settings - PASS/FAIL
- [ ] TC-UI-002: Navigate via link - PASS/FAIL
- [ ] TC-UI-003: Auto-save on blur - PASS/FAIL
- [ ] TC-UI-004: Manual save - PASS/FAIL
- [ ] TC-UI-005: Persistence after refresh - PASS/FAIL
- [ ] TC-UI-006: Character counter - PASS/FAIL
- [ ] TC-UI-007: Upload valid file - PASS/FAIL
- [ ] TC-UI-008: Reject .txt file - PASS/FAIL
- [ ] TC-UI-009: Reject large file - PASS/FAIL
- [ ] TC-UI-010: File list display - PASS/FAIL
- [ ] TC-UI-011: Delete with confirmation - PASS/FAIL
- [ ] TC-UI-012: Cancel upload - PASS/FAIL
- [ ] TC-UI-013: Empty state - PASS/FAIL
- [ ] TC-UI-014: Loading skeleton - PASS/FAIL
- [ ] TC-UI-015: 404 not found - PASS/FAIL

## Integration Tests
- [ ] TC-INT-001: Full custom instructions workflow - PASS/FAIL
- [ ] TC-INT-002: File upload → delete flow - PASS/FAIL
- [ ] TC-INT-003: Multiple projects independence - PASS/FAIL
- [ ] TC-INT-004: Standalone chat (no instructions) - PASS/FAIL

## Issues Found
| ID | Severity | Description | Status |
|----|----------|-------------|--------|
| 1  |          |             |        |

## Sign-Off
- [ ] All critical tests passed
- [ ] All blockers resolved
- [ ] Ready for production

**Approved by:** _______________
**Date:** _______________
```

---

## Next Steps After Testing

1. **If all tests pass:** ✅
   - Mark M2 Phase 1 as complete
   - Update CHANGELOG.md
   - Create git tag: `v1.1.0-m2-phase1`
   - Begin Phase 2 planning (RAG pipeline)

2. **If tests fail:** ❌
   - Log defects with severity
   - Fix critical/high severity bugs
   - Re-run failed tests
   - Repeat until all pass

3. **Performance optimization:**
   - If any benchmark fails, optimize
   - Add database indexes if needed
   - Optimize file upload handling

---

**Document Version:** 1.0
**Last Updated:** November 22, 2025
**Maintained by:** Engineering Team
