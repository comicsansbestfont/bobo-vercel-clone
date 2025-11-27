#!/bin/bash

# M3.5-01: API Integration Test Runner
# Run API tests against localhost:3000

set -e

echo "========================================"
echo "M3.5-01: API Integration Tests"
echo "========================================"
echo ""

# Check if server is running
if ! curl -s http://localhost:3000 > /dev/null; then
  echo "❌ Server not running on localhost:3000"
  echo "Please start with: npm run dev"
  exit 1
fi

echo "✅ Server is running"
echo ""

# Run the TypeScript test file
cd "$(dirname "$0")/.."
npx tsx tests/api/memory-tools-api.test.ts
