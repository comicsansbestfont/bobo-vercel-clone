#!/bin/bash

# Chat API Endpoints Test Script
# Tests all chat-related API endpoints

BASE_URL="http://localhost:3000"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================"
echo "Testing Chat API Endpoints"
echo "========================================"
echo ""

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${RED}Error: jq is not installed. Please install it first.${NC}"
    echo "  macOS: brew install jq"
    echo "  Ubuntu: sudo apt-get install jq"
    exit 1
fi

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to test API calls
test_api() {
    local test_name="$1"
    local expected_status="$2"
    shift 2
    local curl_output=$(curl -s -w "\n%{http_code}" "$@")
    local response_body=$(echo "$curl_output" | sed '$d')
    local status_code=$(echo "$curl_output" | tail -n1)

    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓${NC} $test_name (Status: $status_code)"
        ((TESTS_PASSED++))
        echo "$response_body"
    else
        echo -e "${RED}✗${NC} $test_name (Expected: $expected_status, Got: $status_code)"
        ((TESTS_FAILED++))
        echo "Response: $response_body"
    fi
    echo ""
}

echo "----------------------------------------"
echo "1. Creating Test Chat"
echo "----------------------------------------"
CHAT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/chats" \
  -H "Content-Type: application/json" \
  -d '{"title":"API Test Chat","model":"openai/gpt-4o","webSearchEnabled":false}')

CHAT_ID=$(echo "$CHAT_RESPONSE" | jq -r '.chat.id')

if [ "$CHAT_ID" != "null" ] && [ -n "$CHAT_ID" ]; then
    echo -e "${GREEN}✓${NC} Created chat: $CHAT_ID"
    echo "Chat details: $(echo "$CHAT_RESPONSE" | jq '.chat')"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗${NC} Failed to create chat"
    echo "Response: $CHAT_RESPONSE"
    ((TESTS_FAILED++))
    exit 1
fi
echo ""

echo "----------------------------------------"
echo "2. Listing All Chats"
echo "----------------------------------------"
test_api "GET /api/chats" "200" \
  "$BASE_URL/api/chats"

echo "----------------------------------------"
echo "3. Getting Chat with Messages"
echo "----------------------------------------"
test_api "GET /api/chats/$CHAT_ID" "200" \
  "$BASE_URL/api/chats/$CHAT_ID"

echo "----------------------------------------"
echo "4. Creating User Message"
echo "----------------------------------------"
test_api "POST /api/chats/$CHAT_ID/messages" "201" \
  -X POST "$BASE_URL/api/chats/$CHAT_ID/messages" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "user",
    "content": {
      "parts": [
        {"type": "text", "text": "Hello, this is a test message!"}
      ]
    },
    "tokenCount": 7
  }'

echo "----------------------------------------"
echo "5. Creating Assistant Message with Reasoning"
echo "----------------------------------------"
test_api "POST /api/chats/$CHAT_ID/messages" "201" \
  -X POST "$BASE_URL/api/chats/$CHAT_ID/messages" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "assistant",
    "content": {
      "parts": [
        {"type": "reasoning", "text": "User is greeting me, I should respond warmly..."},
        {"type": "text", "text": "Hello! I received your test message. How can I help you today?"}
      ]
    },
    "tokenCount": 20
  }'

echo "----------------------------------------"
echo "6. Listing Messages in Chat"
echo "----------------------------------------"
test_api "GET /api/chats/$CHAT_ID/messages" "200" \
  "$BASE_URL/api/chats/$CHAT_ID/messages"

echo "----------------------------------------"
echo "7. Updating Chat Title"
echo "----------------------------------------"
test_api "PATCH /api/chats/$CHAT_ID" "200" \
  -X PATCH "$BASE_URL/api/chats/$CHAT_ID" \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated Test Chat Title"}'

echo "----------------------------------------"
echo "8. Updating Chat Model"
echo "----------------------------------------"
test_api "PATCH /api/chats/$CHAT_ID" "200" \
  -X PATCH "$BASE_URL/api/chats/$CHAT_ID" \
  -H "Content-Type: application/json" \
  -d '{"model":"anthropic/claude-sonnet-4.5"}'

echo "----------------------------------------"
echo "9. Creating a Test Project"
echo "----------------------------------------"
PROJECT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/projects" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Project for Chat API","description":"Testing chat-project association"}')

PROJECT_ID=$(echo "$PROJECT_RESPONSE" | jq -r '.project.id')

if [ "$PROJECT_ID" != "null" ] && [ -n "$PROJECT_ID" ]; then
    echo -e "${GREEN}✓${NC} Created project: $PROJECT_ID"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗${NC} Failed to create project"
    echo "Response: $PROJECT_RESPONSE"
    ((TESTS_FAILED++))
fi
echo ""

echo "----------------------------------------"
echo "10. Adding Chat to Project"
echo "----------------------------------------"
test_api "PATCH /api/chats/$CHAT_ID/project (add)" "200" \
  -X PATCH "$BASE_URL/api/chats/$CHAT_ID/project" \
  -H "Content-Type: application/json" \
  -d "{\"projectId\":\"$PROJECT_ID\"}"

echo "----------------------------------------"
echo "11. Listing Chats in Project"
echo "----------------------------------------"
test_api "GET /api/chats?projectId=$PROJECT_ID" "200" \
  "$BASE_URL/api/chats?projectId=$PROJECT_ID"

echo "----------------------------------------"
echo "12. Removing Chat from Project"
echo "----------------------------------------"
test_api "PATCH /api/chats/$CHAT_ID/project (remove)" "200" \
  -X PATCH "$BASE_URL/api/chats/$CHAT_ID/project" \
  -H "Content-Type: application/json" \
  -d '{"projectId":null}'

echo "----------------------------------------"
echo "13. Deleting Test Project"
echo "----------------------------------------"
test_api "DELETE /api/projects/$PROJECT_ID" "204" \
  -X DELETE "$BASE_URL/api/projects/$PROJECT_ID"

echo "----------------------------------------"
echo "14. Deleting Test Chat"
echo "----------------------------------------"
test_api "DELETE /api/chats/$CHAT_ID" "204" \
  -X DELETE "$BASE_URL/api/chats/$CHAT_ID"

echo "----------------------------------------"
echo "15. Verifying Chat Deletion"
echo "----------------------------------------"
test_api "GET /api/chats/$CHAT_ID (should 404)" "404" \
  "$BASE_URL/api/chats/$CHAT_ID"

echo "========================================"
echo "Test Summary"
echo "========================================"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed! 🎉${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed. Please review the output above.${NC}"
    exit 1
fi
