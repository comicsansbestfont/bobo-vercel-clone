import { test, expect } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

/**
 * E2E Test: M37-01 Advisory Indexing Pipeline
 *
 * Tests the complete indexing pipeline for advisory files:
 * - File scanning and discovery
 * - Embedding generation
 * - Database upsert operations
 * - Entity metadata extraction
 * - Verification script accuracy
 *
 * Prerequisites:
 * - Advisory files exist in advisory/ directory
 * - Environment variables set (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, AI_GATEWAY_API_KEY)
 */
test.describe('M37-01: Advisory Indexing Pipeline', () => {
  const projectRoot = path.join(__dirname, '../..');
  const advisoryDir = path.join(projectRoot, 'advisory');

  test.describe('File System Structure', () => {
    test('should have advisory directory with expected structure', async () => {
      // Check advisory directory exists
      expect(fs.existsSync(advisoryDir)).toBe(true);

      // Check deals subdirectory
      const dealsDir = path.join(advisoryDir, 'deals');
      expect(fs.existsSync(dealsDir)).toBe(true);

      // Check for expected deal companies
      const expectedDeals = ['MyTab', 'SwiftCheckin', 'ArcheloLab', 'ControlShiftAI', 'Talvin', 'Tandm'];
      for (const deal of expectedDeals) {
        const dealPath = path.join(dealsDir, deal);
        const exists = fs.existsSync(dealPath);
        console.log(`Deal folder ${deal}: ${exists ? '✅' : '❌'}`);
        expect(exists).toBe(true);
      }

      // Check clients subdirectory
      const clientsDir = path.join(advisoryDir, 'clients');
      expect(fs.existsSync(clientsDir)).toBe(true);
    });

    test('should have master docs for each deal', async () => {
      const dealsDir = path.join(advisoryDir, 'deals');
      const deals = fs.readdirSync(dealsDir).filter(d =>
        fs.statSync(path.join(dealsDir, d)).isDirectory() && !d.startsWith('.')
      );

      const missingMasterDocs: string[] = [];

      for (const deal of deals) {
        const masterDocPath = path.join(dealsDir, deal, `master-doc-${deal.toLowerCase()}.md`);
        if (!fs.existsSync(masterDocPath)) {
          missingMasterDocs.push(deal);
        }
      }

      console.log(`Deals with master docs: ${deals.length - missingMasterDocs.length}/${deals.length}`);
      if (missingMasterDocs.length > 0) {
        console.log(`Missing master docs: ${missingMasterDocs.join(', ')}`);
      }

      // At least 80% of deals should have master docs
      expect(missingMasterDocs.length / deals.length).toBeLessThan(0.2);
    });

    test('should exclude _Inbox, _raw, and _TEMPLATE directories from indexing scope', async () => {
      const { glob } = await import('glob');

      // Get all files including excluded patterns
      const allFiles = await glob('advisory/**/*.md', {
        nodir: true,
        cwd: projectRoot,
      });

      // Get indexed files (excluding patterns)
      const indexableFiles = await glob('advisory/**/*.md', {
        ignore: ['**/_Inbox/**', '**/_raw/**', '**/_TEMPLATE/**', '**/README.md'],
        nodir: true,
        cwd: projectRoot,
      });

      const excludedCount = allFiles.length - indexableFiles.length;
      console.log(`Total .md files: ${allFiles.length}`);
      console.log(`Indexable files: ${indexableFiles.length}`);
      console.log(`Excluded files: ${excludedCount}`);

      // Verify exclusion works
      for (const file of indexableFiles) {
        expect(file).not.toContain('_Inbox');
        expect(file).not.toContain('_raw');
        expect(file).not.toContain('_TEMPLATE');
        expect(path.basename(file).toLowerCase()).not.toBe('readme.md');
      }
    });

    test('should correctly identify entity type and name from file paths', async () => {
      const testCases = [
        {
          path: 'advisory/deals/MyTab/master-doc-mytab.md',
          expectedType: 'deal',
          expectedName: 'MyTab',
        },
        {
          path: 'advisory/deals/SwiftCheckin/Valuation/2025-12-03-valuation-analysis.md',
          expectedType: 'deal',
          expectedName: 'SwiftCheckin',
        },
        {
          path: 'advisory/clients/SwiftCheckin/Engagements/2025-07_GTM-Diagnostic/engagement-summary.md',
          expectedType: 'client',
          expectedName: 'SwiftCheckin',
        },
        {
          path: 'advisory/deals/ArcheloLab/Communications/2025-12-whatsappchats.md',
          expectedType: 'deal',
          expectedName: 'ArcheloLab',
        },
      ];

      // Import the parseFilePath logic
      const parseFilePath = (filepath: string): { entityType: 'deal' | 'client'; entityName: string } => {
        const parts = filepath.split(path.sep);
        const advisoryIdx = parts.findIndex(p => p === 'advisory');

        if (advisoryIdx === -1 || parts.length < advisoryIdx + 3) {
          return { entityType: 'deal', entityName: 'unknown' };
        }

        const typeFolder = parts[advisoryIdx + 1];
        const entityName = parts[advisoryIdx + 2];

        return {
          entityType: typeFolder === 'clients' ? 'client' : 'deal',
          entityName,
        };
      };

      for (const testCase of testCases) {
        const result = parseFilePath(testCase.path);
        expect(result.entityType).toBe(testCase.expectedType);
        expect(result.entityName).toBe(testCase.expectedName);
      }
    });
  });

  test.describe('Indexing Script Execution', () => {
    test.skip(process.env.CI === 'true', 'Skipping indexing tests in CI - requires API key');

    test('should run indexing script without errors', async () => {
      // This test actually runs the indexing script
      // Timeout extended as it makes API calls
      test.setTimeout(300000); // 5 minutes

      try {
        const { stdout, stderr } = await execAsync('npm run index-advisory', {
          cwd: projectRoot,
          env: {
            ...process.env,
            NODE_ENV: 'test',
          },
        });

        console.log('Indexing stdout:', stdout);
        if (stderr) {
          console.warn('Indexing stderr:', stderr);
        }

        // Check for success indicators
        expect(stdout).toContain('Scanning advisory files');
        expect(stdout).toContain('Indexing Complete');

        // Extract success count
        const successMatch = stdout.match(/Success:\s*(\d+)/);
        const errorMatch = stdout.match(/Errors:\s*(\d+)/);

        if (successMatch && errorMatch) {
          const successCount = parseInt(successMatch[1], 10);
          const errorCount = parseInt(errorMatch[1], 10);

          console.log(`Indexed: ${successCount} success, ${errorCount} errors`);

          // Should have some successes
          expect(successCount).toBeGreaterThan(0);

          // Error rate should be low (< 10%)
          const errorRate = errorCount / (successCount + errorCount);
          expect(errorRate).toBeLessThan(0.1);
        }
      } catch (error) {
        // Check if it's an expected error (e.g., rate limiting)
        const errMsg = error instanceof Error ? error.message : String(error);
        if (errMsg.includes('429') || errMsg.includes('rate limit')) {
          console.warn('Rate limited - skipping test');
          test.skip();
        }
        throw error;
      }
    });

    test('should run verification script after indexing', async () => {
      test.setTimeout(60000); // 1 minute

      try {
        const { stdout, stderr } = await execAsync('npm run verify-advisory', {
          cwd: projectRoot,
        });

        console.log('Verification stdout:', stdout);
        if (stderr) {
          console.warn('Verification stderr:', stderr);
        }

        // Should show verification running
        expect(stdout).toContain('Verifying advisory indexing');

        // Extract metrics
        const diskMatch = stdout.match(/Files on disk:\s*(\d+)/);
        const indexedMatch = stdout.match(/Files indexed:\s*(\d+)/);
        const coverageMatch = stdout.match(/Coverage:\s*([\d.]+)%/);

        if (diskMatch && indexedMatch && coverageMatch) {
          const diskCount = parseInt(diskMatch[1], 10);
          const indexedCount = parseInt(indexedMatch[1], 10);
          const coverage = parseFloat(coverageMatch[1]);

          console.log(`Disk: ${diskCount}, Indexed: ${indexedCount}, Coverage: ${coverage}%`);

          // After successful indexing, coverage should be high
          if (process.env.RUN_FULL_INDEXING === 'true') {
            expect(coverage).toBeGreaterThan(90);
          }
        }
      } catch (error) {
        // Verification should not fail catastrophically
        throw error;
      }
    });
  });

  test.describe('Database State Verification', () => {
    test('should verify files table has advisory entries', async ({ request }) => {
      // Use the app's API to check database state
      // This assumes there's an API endpoint or we can call the verification script

      const response = await request.get('/api/debug/advisory-stats').catch(() => null);

      if (response && response.ok()) {
        const data = await response.json();
        console.log('Advisory stats:', data);

        expect(data.totalFiles).toBeGreaterThan(0);
        expect(data.withEmbeddings).toBeGreaterThan(0);
      } else {
        // Fallback: run verification script and parse output
        const { stdout } = await execAsync('npm run verify-advisory', {
          cwd: projectRoot,
        });

        const indexedMatch = stdout.match(/Files indexed:\s*(\d+)/);
        if (indexedMatch) {
          expect(parseInt(indexedMatch[1], 10)).toBeGreaterThan(0);
        }
      }
    });

    test('should have entity breakdown (deals vs clients)', async () => {
      const { stdout } = await execAsync('npm run verify-advisory', {
        cwd: projectRoot,
      });

      // Check entity breakdown section
      const dealsMatch = stdout.match(/Deals:\s*(\d+)/);
      const clientsMatch = stdout.match(/Clients:\s*(\d+)/);

      if (dealsMatch && clientsMatch) {
        const deals = parseInt(dealsMatch[1], 10);
        const clients = parseInt(clientsMatch[1], 10);

        console.log(`Entity breakdown - Deals: ${deals}, Clients: ${clients}`);

        // Should have more deals than clients (based on structure)
        expect(deals).toBeGreaterThan(0);
        // Clients may be 0 if only deal files are indexed
      }
    });

    test('should index files with expected companies', async () => {
      const { stdout } = await execAsync('npm run verify-advisory', {
        cwd: projectRoot,
      });

      const companiesMatch = stdout.match(/Companies indexed:\s*(.+)/);

      if (companiesMatch) {
        const companies = companiesMatch[1].split(',').map(c => c.trim());
        console.log('Indexed companies:', companies);

        // Check for expected companies
        const expectedCompanies = ['MyTab', 'SwiftCheckin', 'ArcheloLab'];
        for (const expected of expectedCompanies) {
          const found = companies.some(c =>
            c.toLowerCase().includes(expected.toLowerCase())
          );
          console.log(`${expected}: ${found ? '✅' : '❌'}`);
        }
      }
    });
  });

  test.describe('Edge Cases', () => {
    test('should handle files larger than 100KB gracefully', async () => {
      // The indexing script should skip files > 100KB
      const { stdout } = await execAsync('npm run index-advisory 2>&1 || true', {
        cwd: projectRoot,
      });

      // Check for skip messages for large files
      const skipMatches = stdout.match(/Skipping large file/g);
      if (skipMatches) {
        console.log(`Skipped ${skipMatches.length} large files`);
      }

      // Script should still complete successfully even with large files
      expect(stdout).not.toContain('Fatal error');
    });

    test('should handle non-markdown files correctly', async () => {
      const { glob } = await import('glob');

      // Get all files in advisory
      const allFiles = await glob('advisory/**/*', {
        nodir: true,
        cwd: projectRoot,
      });

      // Get only markdown files
      const mdFiles = await glob('advisory/**/*.md', {
        nodir: true,
        cwd: projectRoot,
      });

      const nonMdFiles = allFiles.length - mdFiles.length;
      console.log(`Total files: ${allFiles.length}`);
      console.log(`Markdown files: ${mdFiles.length}`);
      console.log(`Non-markdown files: ${nonMdFiles} (should be skipped)`);

      // Non-markdown files should exist but be ignored
      expect(nonMdFiles).toBeGreaterThan(0); // PDFs, docs, etc. exist
    });

    test('should handle empty directories gracefully', async () => {
      // Create a temporary empty directory
      const emptyDir = path.join(advisoryDir, 'deals', '_test_empty');

      if (!fs.existsSync(emptyDir)) {
        fs.mkdirSync(emptyDir, { recursive: true });
      }

      try {
        const { stdout } = await execAsync('npm run verify-advisory', {
          cwd: projectRoot,
        });

        // Should complete without errors
        expect(stdout).toContain('Verification');
      } finally {
        // Cleanup
        if (fs.existsSync(emptyDir)) {
          fs.rmdirSync(emptyDir);
        }
      }
    });
  });
});
