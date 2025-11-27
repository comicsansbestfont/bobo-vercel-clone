# Quick Start: Running M3.5-01 Integration Tests

## 1-Minute Setup

```bash
# Start dev server (Terminal 1)
npm run dev

# Run API tests (Terminal 2)
npx tsx tests/api/memory-tools-api.test.ts

# Run DB tests (Terminal 2 - with env vars)
source <(cat .env.local | grep "^NEXT_PUBLIC_SUPABASE" | sed 's/^/export /') && \
npx tsx tests/db/memory-tools-db-simple.test.ts
```

## Expected Results

- **API Tests:** 4/12 passing (33.3%)
- **DB Tests:** 4/8 passing (57.1%)
- **Status:** Needs fixes before production

## Critical Issues Found

1. **POST /api/memory/entries returns null**
   - Missing `content_hash` generation
   - Fix: Add `generateContentHash(data.content)` in route handler

2. **Error handling returns wrong status codes**
   - Should return 404/400 instead of 200 with null
   - Fix: Add null checks and proper status codes

## Next Steps

1. Read `TEST_EXECUTION_SUMMARY.md` for full details
2. Fix P0 issues in `app/api/memory/entries/route.ts`
3. Re-run tests to verify fixes

## Test Files

```
tests/
├── api/memory-tools-api.test.ts       # API integration tests
├── db/memory-tools-db-simple.test.ts  # Database tests
├── API_INTEGRATION_TEST_REPORT.md     # Detailed findings
├── TEST_EXECUTION_SUMMARY.md          # Overall summary
└── README.md                          # Full documentation
```

**Report Generated:** 2025-11-28
**Confidence:** High - All issues have clear reproduction steps
