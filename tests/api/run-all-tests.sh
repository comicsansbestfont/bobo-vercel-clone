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
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  🧪 Bobo AI V1 API Test Suite        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""
echo "Base URL: $BASE_URL"
echo ""

# Helper function to test endpoint
test_endpoint() {
  local method=$1
  local endpoint=$2
  local data=$3
  local expected_status=$4
  local test_name=$5

  echo -n "  Testing: $test_name... "

  if [ -z "$data" ]; then
    response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" 2>/dev/null)
  else
    response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
      -H "Content-Type: application/json" \
      -d "$data" 2>/dev/null)
  fi

  status_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')

  if [ "$status_code" -eq "$expected_status" ]; then
    echo -e "${GREEN}✓ PASS${NC} (Status: $status_code)"
    ((PASS++))
    return 0
  else
    echo -e "${RED}✗ FAIL${NC} (Expected: $expected_status, Got: $status_code)"
    if [ -n "$body" ]; then
      echo -e "    ${YELLOW}Response: $body${NC}"
    fi
    ((FAIL++))
    return 1
  fi
}

# Test server is running
echo "Checking if server is running..."
if ! curl -s "$BASE_URL" > /dev/null 2>&1; then
  echo -e "${RED}✗ Server not running at $BASE_URL${NC}"
  echo "Please start the dev server: npm run dev"
  exit 1
fi
echo -e "${GREEN}✓ Server is running${NC}"
echo ""

# Test Suite 1: Projects
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}📁 Testing Project Endpoints${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"

test_endpoint "GET" "/api/projects" "" 200 "List all projects"

test_endpoint "POST" "/api/projects" \
  '{"name":"Test Project","description":"Automated test"}' \
  201 "Create project"

# Get project ID for further tests
echo ""
echo "Creating test project for ID-based tests..."
PROJECT_ID=$(curl -s -X POST "$BASE_URL/api/projects" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Get Project"}' | jq -r '.project.id' 2>/dev/null)

if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" == "null" ]; then
  echo -e "${RED}✗ Failed to create project for testing${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Created test project: $PROJECT_ID${NC}"
echo ""

test_endpoint "GET" "/api/projects/$PROJECT_ID" "" 200 "Get project by ID"

test_endpoint "PATCH" "/api/projects/$PROJECT_ID" \
  '{"name":"Updated Name"}' \
  200 "Update project"

# Test Suite 2: Chats
echo ""
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}💬 Testing Chat Endpoints${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"

test_endpoint "GET" "/api/chats" "" 200 "List all chats"

test_endpoint "POST" "/api/chats" \
  '{"title":"Test Chat","model":"openai/gpt-4o"}' \
  201 "Create chat"

echo ""
echo "Creating test chat for ID-based tests..."
CHAT_ID=$(curl -s -X POST "$BASE_URL/api/chats" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Get Chat","model":"openai/gpt-4o"}' | jq -r '.chat.id' 2>/dev/null)

if [ -z "$CHAT_ID" ] || [ "$CHAT_ID" == "null" ]; then
  echo -e "${RED}✗ Failed to create chat for testing${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Created test chat: $CHAT_ID${NC}"
echo ""

test_endpoint "GET" "/api/chats/$CHAT_ID" "" 200 "Get chat by ID"

test_endpoint "PATCH" "/api/chats/$CHAT_ID" \
  '{"title":"Updated Chat Title"}' \
  200 "Update chat"

# Test Suite 3: Project-Chat Association
echo ""
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}🔗 Testing Project-Chat Association${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"

test_endpoint "GET" "/api/projects/$PROJECT_ID/chats" "" 200 "List project chats"

test_endpoint "PATCH" "/api/chats/$CHAT_ID/project" \
  "{\"projectId\":\"$PROJECT_ID\"}" \
  200 "Move chat to project"

test_endpoint "PATCH" "/api/chats/$CHAT_ID/project" \
  '{"projectId":null}' \
  200 "Detach chat from project"

# Test Suite 4: Edge Cases
echo ""
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}⚠️  Testing Edge Cases${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"

test_endpoint "POST" "/api/projects" \
  '{"description":"No name"}' \
  400 "Create project without name (should fail)"

test_endpoint "GET" "/api/projects/00000000-0000-0000-0000-000000000000" \
  "" 404 "Get non-existent project"

test_endpoint "GET" "/api/chats/00000000-0000-0000-0000-000000000000" \
  "" 404 "Get non-existent chat"

# Test Suite 5: Cleanup (DELETE tests)
echo ""
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}🗑️  Testing Delete Operations${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"

test_endpoint "DELETE" "/api/chats/$CHAT_ID" "" 204 "Delete chat"

test_endpoint "DELETE" "/api/projects/$PROJECT_ID" "" 204 "Delete project"

# Summary
echo ""
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}📊 Test Results Summary${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""
echo -e "  ${GREEN}Passed: $PASS${NC}"
echo -e "  ${RED}Failed: $FAIL${NC}"
echo -e "  Total:  $((PASS + FAIL))"
echo ""

PASS_RATE=$((PASS * 100 / (PASS + FAIL)))
echo -e "  Pass Rate: ${PASS_RATE}%"
echo ""

if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}✓ All tests passed! 🎉${NC}"
  echo ""
  exit 0
else
  echo -e "${RED}✗ $FAIL test(s) failed${NC}"
  echo ""
  exit 1
fi
