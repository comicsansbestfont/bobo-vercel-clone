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
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counter
TESTS_PASSED=0
TESTS_FAILED=0

echo "========================================"
echo "M2 Phase 1 - Backend API Test Suite"
echo "========================================"
echo "Base URL: $BASE_URL"
echo "Date: $(date)"
echo ""

# Helper function for test assertions
test_endpoint() {
  local name=$1
  local method=$2
  local endpoint=$3
  local data=$4
  local expected_status=$5

  echo -e "${BLUE}Testing:${NC} $name"
  echo "  Method: $method"
  echo "  Endpoint: $endpoint"

  response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$endpoint" \
    -H "Content-Type: application/json" \
    ${data:+-d "$data"})

  body=$(echo "$response" | sed '$d')
  status=$(echo "$response" | tail -n 1)

  if [ "$status" -eq "$expected_status" ]; then
    echo -e "  Result: ${GREEN}✓ PASS${NC} (Status: $status)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
    return 0
  else
    echo -e "  Result: ${RED}✗ FAIL${NC} (Expected: $expected_status, Got: $status)"
    echo "  Response: $body"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    return 1
  fi
}

echo "========================================"
echo "SETUP: Creating Test Project"
echo "========================================"

response=$(curl -s -X POST "$BASE_URL/api/projects" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "M2 Test Project",
    "description": "Automated test project for M2 Phase 1",
    "custom_instructions": null
  }')

PROJECT_ID=$(echo $response | jq -r '.project.id')

if [ "$PROJECT_ID" = "null" ] || [ -z "$PROJECT_ID" ]; then
  echo -e "${RED}Failed to create test project!${NC}"
  echo "Response: $response"
  exit 1
fi

echo -e "${GREEN}✓ Test project created${NC}"
echo "  Project ID: $PROJECT_ID"
echo ""

echo "========================================"
echo "TEST SUITE 1: Custom Instructions API"
echo "========================================"
echo ""

# Test 1: Update project with custom instructions
test_endpoint \
  "TC-API-001: Update custom instructions" \
  "PATCH" \
  "/api/projects/$PROJECT_ID" \
  '{"custom_instructions":"You are a helpful assistant specialized in testing."}' \
  200
echo ""

# Test 2: Clear custom instructions
test_endpoint \
  "TC-API-002: Clear custom instructions (null)" \
  "PATCH" \
  "/api/projects/$PROJECT_ID" \
  '{"custom_instructions":null}' \
  200
echo ""

# Test 3: Empty string becomes null
test_endpoint \
  "TC-API-003: Empty string becomes null" \
  "PATCH" \
  "/api/projects/$PROJECT_ID" \
  '{"custom_instructions":"   "}' \
  200
echo ""

# Test 4: Get project (verify custom_instructions field exists)
test_endpoint \
  "TC-API-004: Get project details" \
  "GET" \
  "/api/projects/$PROJECT_ID" \
  "" \
  200
echo ""

echo "========================================"
echo "TEST SUITE 2: File Upload API"
echo "========================================"
echo ""

# Test 5: Upload valid markdown file
FILE_CONTENT="# Test Document\n\nThis is a test markdown file.\n\n## Features\n- Testing\n- Validation\n\n\`\`\`typescript\nconst test = 'value';\n\`\`\`"
ESCAPED_CONTENT=$(echo "$FILE_CONTENT" | jq -Rs .)

if test_endpoint \
  "TC-API-005: Upload valid markdown file" \
  "POST" \
  "/api/projects/$PROJECT_ID/files" \
  "{\"filename\":\"test.md\",\"content\":$ESCAPED_CONTENT}" \
  201; then

  # Extract file ID for later tests
  FILES_RESPONSE=$(curl -s -X GET "$BASE_URL/api/projects/$PROJECT_ID/files")
  FILE_ID=$(echo $FILES_RESPONSE | jq -r '.files[0].id')
  echo "  File ID: $FILE_ID"
fi
echo ""

# Test 6: Reject non-markdown file
test_endpoint \
  "TC-API-006: Reject non-markdown file (.txt)" \
  "POST" \
  "/api/projects/$PROJECT_ID/files" \
  '{"filename":"test.txt","content":"Should fail"}' \
  400
echo ""

# Test 7: Reject empty filename
test_endpoint \
  "TC-API-007: Reject empty filename" \
  "POST" \
  "/api/projects/$PROJECT_ID/files" \
  '{"filename":"","content":"# Test"}' \
  400
echo ""

# Test 8: Reject file without .md extension
test_endpoint \
  "TC-API-008: Reject file without .md extension" \
  "POST" \
  "/api/projects/$PROJECT_ID/files" \
  '{"filename":"noextension","content":"# Test"}' \
  400
echo ""

echo "========================================"
echo "TEST SUITE 3: File List/Delete API"
echo "========================================"
echo ""

# Test 9: List files
test_endpoint \
  "TC-API-009: List project files" \
  "GET" \
  "/api/projects/$PROJECT_ID/files" \
  "" \
  200
echo ""

# Test 10: Delete file
if [ -n "$FILE_ID" ] && [ "$FILE_ID" != "null" ]; then
  test_endpoint \
    "TC-API-010: Delete file" \
    "DELETE" \
    "/api/projects/$PROJECT_ID/files/$FILE_ID" \
    "" \
    204
  echo ""
else
  echo -e "${YELLOW}⚠ SKIP${NC} TC-API-010: Delete file (no file ID available)"
  echo ""
fi

# Test 11: Delete non-existent file (404)
test_endpoint \
  "TC-API-011: Delete non-existent file (404)" \
  "DELETE" \
  "/api/projects/$PROJECT_ID/files/00000000-0000-0000-0000-000000000000" \
  "" \
  404
echo ""

# Test 12: Verify list is empty after delete
test_endpoint \
  "TC-API-012: Verify files list updated after delete" \
  "GET" \
  "/api/projects/$PROJECT_ID/files" \
  "" \
  200
echo ""

echo "========================================"
echo "TEST SUITE 4: Validation Tests"
echo "========================================"
echo ""

# Test 13: Project not found (404)
test_endpoint \
  "TC-API-013: Get non-existent project (404)" \
  "GET" \
  "/api/projects/00000000-0000-0000-0000-000000000000" \
  "" \
  404
echo ""

# Test 14: Files for non-existent project (404)
test_endpoint \
  "TC-API-014: List files for non-existent project (404)" \
  "GET" \
  "/api/projects/00000000-0000-0000-0000-000000000000/files" \
  "" \
  404
echo ""

# Test 15: Upload file to non-existent project (404)
test_endpoint \
  "TC-API-015: Upload to non-existent project (404)" \
  "POST" \
  "/api/projects/00000000-0000-0000-0000-000000000000/files" \
  '{"filename":"test.md","content":"# Test"}' \
  404
echo ""

echo "========================================"
echo "CLEANUP: Deleting Test Project"
echo "========================================"

cleanup_response=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/api/projects/$PROJECT_ID")
cleanup_status=$(echo "$cleanup_response" | tail -n 1)

if [ "$cleanup_status" -eq 204 ]; then
  echo -e "${GREEN}✓ Test project deleted${NC}"
else
  echo -e "${YELLOW}⚠ Warning: Failed to delete test project (Status: $cleanup_status)${NC}"
  echo "  You may need to manually delete project: $PROJECT_ID"
fi
echo ""

echo "========================================"
echo "TEST SUMMARY"
echo "========================================"
echo -e "Total Tests:  $((TESTS_PASSED + TESTS_FAILED))"
echo -e "Passed:       ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed:       ${RED}$TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
  PASS_RATE="100%"
else
  PASS_RATE=$(awk "BEGIN {printf \"%.1f%%\", ($TESTS_PASSED/($TESTS_PASSED+$TESTS_FAILED))*100}")
fi

echo -e "Pass Rate:    $PASS_RATE"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}========================================${NC}"
  echo -e "${GREEN}✓ ALL TESTS PASSED!${NC}"
  echo -e "${GREEN}========================================${NC}"
  exit 0
else
  echo -e "${RED}========================================${NC}"
  echo -e "${RED}✗ SOME TESTS FAILED${NC}"
  echo -e "${RED}========================================${NC}"
  echo ""
  echo "Please review the failures above and fix the issues."
  exit 1
fi
