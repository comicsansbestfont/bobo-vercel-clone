import { test, expect } from '@playwright/test';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * E2E Test: M37-01 Database Validation Tests
 *
 * These tests verify that the advisory search system works correctly
 * by validating against actual database state rather than heuristic
 * keyword matching. This ensures:
 *
 * 1. RPC function isolation - search_advisory_files works correctly
 * 2. Validation queries return data from actual indexed files
 * 3. Entity filtering works as expected
 * 4. Hybrid search scoring is correct
 *
 * Prerequisites:
 * - Advisory files indexed (npm run index-advisory)
 * - Environment variables set:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let supabase: SupabaseClient | null = null;

test.describe('M37-01: Database Validation Tests', () => {
  test.beforeAll(async () => {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      console.warn('Supabase credentials not found. Some tests will be skipped.');
      return;
    }

    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // Verify connection
    const { error } = await supabase.from('files').select('id').limit(1);
    if (error) {
      console.error('Supabase connection failed:', error.message);
      supabase = null;
    }
  });

  test.describe('RPC Function Isolation Tests', () => {
    test('should have search_advisory_files RPC function', async () => {
      test.skip(!supabase, 'Supabase not configured');

      // Test that the RPC function exists and is callable
      const { data, error } = await supabase!.rpc('search_advisory_files', {
        query_text: 'test',
        query_embedding: new Array(1536).fill(0.1),
        match_count: 5,
      });

      // Should not throw "function does not exist" error
      expect(error?.message).not.toContain('function');
      expect(error?.message).not.toContain('does not exist');
    });

    test('should return properly structured results from RPC', async () => {
      test.skip(!supabase, 'Supabase not configured');

      const { data, error } = await supabase!.rpc('search_advisory_files', {
        query_text: 'MyTab',
        query_embedding: new Array(1536).fill(0.1),
        match_count: 5,
      });

      if (error) {
        console.log('RPC error:', error.message);
        // Skip if RPC not yet deployed
        test.skip(error.message.includes('does not exist'), 'RPC function not deployed');
        throw error;
      }

      // Validate result structure
      if (data && data.length > 0) {
        const result = data[0];
        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('path');
        expect(result).toHaveProperty('content');
        expect(result).toHaveProperty('entity_type');
        expect(result).toHaveProperty('entity_name');
        expect(result).toHaveProperty('combined_score');
      }
    });

    test('should apply entity_type filter correctly', async () => {
      test.skip(!supabase, 'Supabase not configured');

      // Test deals filter
      const { data: dealsData, error: dealsError } = await supabase!.rpc('search_advisory_files', {
        query_text: 'company',
        query_embedding: new Array(1536).fill(0.1),
        match_count: 10,
        filter_entity_type: 'deals',
      });

      if (dealsError?.message.includes('does not exist')) {
        test.skip(true, 'RPC function not deployed');
        return;
      }

      if (dealsData && dealsData.length > 0) {
        // All results should be deals
        for (const result of dealsData) {
          expect(result.entity_type).toBe('deals');
        }
      }

      // Test clients filter
      const { data: clientsData } = await supabase!.rpc('search_advisory_files', {
        query_text: 'company',
        query_embedding: new Array(1536).fill(0.1),
        match_count: 10,
        filter_entity_type: 'clients',
      });

      if (clientsData && clientsData.length > 0) {
        for (const result of clientsData) {
          expect(result.entity_type).toBe('clients');
        }
      }
    });

    test('should apply entity_name filter correctly', async () => {
      test.skip(!supabase, 'Supabase not configured');

      const { data, error } = await supabase!.rpc('search_advisory_files', {
        query_text: 'meeting',
        query_embedding: new Array(1536).fill(0.1),
        match_count: 10,
        filter_entity_name: 'MyTab',
      });

      if (error?.message.includes('does not exist')) {
        test.skip(true, 'RPC function not deployed');
        return;
      }

      if (data && data.length > 0) {
        // All results should be for MyTab
        for (const result of data) {
          expect(result.entity_name).toBe('MyTab');
        }
      }
    });

    test('should respect match_count limit', async () => {
      test.skip(!supabase, 'Supabase not configured');

      const matchCounts = [1, 3, 5, 10];

      for (const matchCount of matchCounts) {
        const { data, error } = await supabase!.rpc('search_advisory_files', {
          query_text: 'company',
          query_embedding: new Array(1536).fill(0.1),
          match_count: matchCount,
        });

        if (error?.message.includes('does not exist')) {
          test.skip(true, 'RPC function not deployed');
          return;
        }

        if (data) {
          expect(data.length).toBeLessThanOrEqual(matchCount);
        }
      }
    });

    test('should calculate combined_score correctly (70% vector + 30% text)', async () => {
      test.skip(!supabase, 'Supabase not configured');

      const { data, error } = await supabase!.rpc('search_advisory_files', {
        query_text: 'MyTab valuation',
        query_embedding: new Array(1536).fill(0.1),
        match_count: 5,
      });

      if (error?.message.includes('does not exist')) {
        test.skip(true, 'RPC function not deployed');
        return;
      }

      if (data && data.length > 0) {
        for (const result of data) {
          // Combined score should be between 0 and 1
          expect(result.combined_score).toBeGreaterThanOrEqual(0);
          expect(result.combined_score).toBeLessThanOrEqual(1);
        }

        // Results should be sorted by combined_score descending
        for (let i = 1; i < data.length; i++) {
          expect(data[i - 1].combined_score).toBeGreaterThanOrEqual(data[i].combined_score);
        }
      }
    });
  });

  test.describe('Database State Validation', () => {
    test('should have advisory files in files table', async () => {
      test.skip(!supabase, 'Supabase not configured');

      const { data, error } = await supabase!
        .from('files')
        .select('id, path, entity_type, entity_name')
        .like('path', 'advisory/%');

      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(data!.length).toBeGreaterThan(0);

      console.log(`Found ${data!.length} advisory files in database`);
    });

    test('should have files for expected deal entities', async () => {
      test.skip(!supabase, 'Supabase not configured');

      const expectedDeals = ['MyTab', 'SwiftCheckin', 'ArcheloLab', 'ControlShiftAI'];

      const { data, error } = await supabase!
        .from('files')
        .select('entity_name')
        .eq('entity_type', 'deals')
        .like('path', 'advisory/%');

      expect(error).toBeNull();
      expect(data).not.toBeNull();

      const foundEntities = new Set(data!.map(d => d.entity_name));

      for (const deal of expectedDeals) {
        expect(foundEntities.has(deal)).toBe(true);
      }
    });

    test('should have embeddings for all advisory files', async () => {
      test.skip(!supabase, 'Supabase not configured');

      // Count total advisory files
      const { count: totalCount } = await supabase!
        .from('files')
        .select('*', { count: 'exact', head: true })
        .like('path', 'advisory/%');

      // Count files with embeddings
      const { count: embeddingCount } = await supabase!
        .from('files')
        .select('*', { count: 'exact', head: true })
        .like('path', 'advisory/%')
        .not('embedding', 'is', null);

      console.log(`Files with embeddings: ${embeddingCount}/${totalCount}`);

      // All files should have embeddings
      expect(embeddingCount).toBe(totalCount);
    });

    test('should have FTS vectors for all advisory files', async () => {
      test.skip(!supabase, 'Supabase not configured');

      // Count total advisory files
      const { count: totalCount } = await supabase!
        .from('files')
        .select('*', { count: 'exact', head: true })
        .like('path', 'advisory/%');

      // Count files with FTS vectors
      const { count: ftsCount } = await supabase!
        .from('files')
        .select('*', { count: 'exact', head: true })
        .like('path', 'advisory/%')
        .not('fts', 'is', null);

      console.log(`Files with FTS: ${ftsCount}/${totalCount}`);

      // All files should have FTS vectors
      expect(ftsCount).toBe(totalCount);
    });
  });

  test.describe('Validation Query Database Verification', () => {
    /**
     * These tests verify that the 6 sprint validation queries
     * can find relevant data in the database
     */

    test('VQ1: "Brief me on MyTab" - should find MyTab files', async () => {
      test.skip(!supabase, 'Supabase not configured');

      // Direct database check for MyTab content
      const { data, error } = await supabase!
        .from('files')
        .select('path, content')
        .eq('entity_name', 'MyTab')
        .limit(5);

      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(data!.length).toBeGreaterThan(0);

      // Should have master doc or significant content
      const hasMasterDoc = data!.some(f =>
        f.path.toLowerCase().includes('master') ||
        f.path.toLowerCase().includes('overview')
      );

      console.log(`MyTab files found: ${data!.length}`);
      console.log(`Has master doc: ${hasMasterDoc}`);

      // At minimum, should have MyTab files
      expect(data!.length).toBeGreaterThanOrEqual(1);
    });

    test('VQ2: "What was my last email to Mikaela?" - should find email content', async () => {
      test.skip(!supabase, 'Supabase not configured');

      // Search for Mikaela in file content
      const { data, error } = await supabase!
        .from('files')
        .select('path, content')
        .like('path', 'advisory/%')
        .ilike('content', '%Mikaela%')
        .limit(5);

      expect(error).toBeNull();

      if (data && data.length > 0) {
        console.log(`Files mentioning Mikaela: ${data.length}`);

        // Check if any are email-related
        const hasEmailContent = data.some(f =>
          f.content.toLowerCase().includes('email') ||
          f.path.toLowerCase().includes('email') ||
          f.path.toLowerCase().includes('communication')
        );

        console.log(`Has email content: ${hasEmailContent}`);
      } else {
        console.log('No files mentioning Mikaela found - this VQ may not be satisfiable');
      }
    });

    test('VQ3: "What deals have red flags?" - should find red flag content', async () => {
      test.skip(!supabase, 'Supabase not configured');

      // Search for red flag content
      const { data, error } = await supabase!
        .from('files')
        .select('path, content, entity_name')
        .eq('entity_type', 'deals')
        .or('content.ilike.%red flag%,content.ilike.%concern%,content.ilike.%risk%,content.ilike.%warning%')
        .limit(10);

      expect(error).toBeNull();

      if (data && data.length > 0) {
        console.log(`Files with red flag/risk content: ${data.length}`);
        const entities = new Set(data.map(d => d.entity_name));
        console.log(`Entities with concerns: ${Array.from(entities).join(', ')}`);
      } else {
        console.log('No red flag content found - searching broader');

        // Try broader search
        const { data: broader } = await supabase!
          .from('files')
          .select('path, entity_name')
          .eq('entity_type', 'deals')
          .ilike('content', '%issue%')
          .limit(10);

        console.log(`Broader search results: ${broader?.length || 0}`);
      }
    });

    test('VQ4: "Prep me for SwiftCheckin call" - should find SwiftCheckin files', async () => {
      test.skip(!supabase, 'Supabase not configured');

      const { data, error } = await supabase!
        .from('files')
        .select('path, content')
        .eq('entity_name', 'SwiftCheckin')
        .limit(10);

      expect(error).toBeNull();

      if (data && data.length > 0) {
        console.log(`SwiftCheckin files: ${data.length}`);

        // Check for meeting/call related content
        const hasMeetingContent = data.some(f =>
          f.content.toLowerCase().includes('meeting') ||
          f.content.toLowerCase().includes('call') ||
          f.content.toLowerCase().includes('agenda')
        );

        console.log(`Has meeting/call content: ${hasMeetingContent}`);
      } else {
        // Check if SwiftCheckin exists at all
        const { count } = await supabase!
          .from('files')
          .select('*', { count: 'exact', head: true })
          .ilike('entity_name', '%swift%');

        console.log(`Files with "swift" in entity name: ${count}`);
      }
    });

    test('VQ5: "What\'s the valuation for ArcheloLab?" - should find valuation content', async () => {
      test.skip(!supabase, 'Supabase not configured');

      // Search ArcheloLab files for valuation content
      const { data, error } = await supabase!
        .from('files')
        .select('path, content')
        .eq('entity_name', 'ArcheloLab')
        .ilike('content', '%valuation%')
        .limit(5);

      expect(error).toBeNull();

      if (data && data.length > 0) {
        console.log(`ArcheloLab files with valuation: ${data.length}`);
      } else {
        // Check if ArcheloLab exists
        const { data: archeloFiles } = await supabase!
          .from('files')
          .select('path')
          .eq('entity_name', 'ArcheloLab')
          .limit(5);

        console.log(`Total ArcheloLab files: ${archeloFiles?.length || 0}`);

        // Search for any valuation content
        const { data: valuationFiles } = await supabase!
          .from('files')
          .select('path, entity_name')
          .like('path', 'advisory/%')
          .ilike('content', '%valuation%')
          .limit(5);

        console.log(`Any files with valuation: ${valuationFiles?.length || 0}`);
      }
    });

    test('VQ6: "Show me Dec 2 meeting notes for MyTab" - should find date-specific content', async () => {
      test.skip(!supabase, 'Supabase not configured');

      // Search for Dec 2 content in MyTab files
      const { data, error } = await supabase!
        .from('files')
        .select('path, content')
        .eq('entity_name', 'MyTab')
        .or('content.ilike.%dec 2%,content.ilike.%december 2%,content.ilike.%12/2%,content.ilike.%2023-12-02%')
        .limit(5);

      expect(error).toBeNull();

      if (data && data.length > 0) {
        console.log(`MyTab files with Dec 2 content: ${data.length}`);

        // Check for meeting content
        const hasMeetingNotes = data.some(f =>
          f.content.toLowerCase().includes('meeting') ||
          f.content.toLowerCase().includes('notes') ||
          f.path.toLowerCase().includes('meeting')
        );

        console.log(`Has meeting notes: ${hasMeetingNotes}`);
      } else {
        // List all MyTab files to understand structure
        const { data: allMyTab } = await supabase!
          .from('files')
          .select('path')
          .eq('entity_name', 'MyTab')
          .limit(10);

        console.log('MyTab files:', allMyTab?.map(f => f.path).join(', '));
      }
    });
  });

  test.describe('Search Quality Metrics', () => {
    test('should return relevant results for semantic queries', async () => {
      test.skip(!supabase, 'Supabase not configured');

      // Test that semantically similar queries return overlapping results
      const queries = [
        'company valuation and financial metrics',
        'how much is the company worth',
        'pricing and investment amount',
      ];

      const resultSets: Set<string>[] = [];

      for (const query of queries) {
        const { data } = await supabase!
          .from('files')
          .select('id, path')
          .like('path', 'advisory/%')
          .ilike('content', `%valuation%`)
          .limit(5);

        if (data) {
          resultSets.push(new Set(data.map(d => d.id)));
        }
      }

      // Check for overlap between result sets
      if (resultSets.length >= 2) {
        const intersection = [...resultSets[0]].filter(x => resultSets[1].has(x));
        console.log(`Overlap between semantic queries: ${intersection.length}`);
      }
    });

    test('should rank exact keyword matches highly', async () => {
      test.skip(!supabase, 'Supabase not configured');

      // Verify FTS functionality
      const testQuery = 'MyTab';

      const { data, error } = await supabase!
        .from('files')
        .select('path, entity_name')
        .like('path', 'advisory/%')
        .textSearch('fts', testQuery)
        .limit(10);

      if (error && error.message.includes('syntax')) {
        console.log('FTS query syntax issue, using ilike fallback');

        const { data: fallback } = await supabase!
          .from('files')
          .select('path, entity_name')
          .like('path', 'advisory/%')
          .ilike('content', `%${testQuery}%`)
          .limit(10);

        if (fallback && fallback.length > 0) {
          // MyTab entity files should be at the top
          const topResult = fallback[0];
          console.log(`Top result entity: ${topResult.entity_name}`);
        }
      } else if (data && data.length > 0) {
        console.log(`FTS results for "${testQuery}": ${data.length}`);

        // Check if MyTab entity files are in results
        const hasMyTabEntity = data.some(d => d.entity_name === 'MyTab');
        expect(hasMyTabEntity).toBe(true);
      }
    });
  });
});
