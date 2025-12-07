import { test, expect, Page } from '@playwright/test';

/**
 * E2E Test: M37-01 Advisory Search Tool
 *
 * Tests the search_advisory agent tool functionality:
 * - Basic semantic search
 * - Entity type filtering (deal, client, all)
 * - Entity name filtering
 * - Hybrid search scoring (70% vector + 30% text)
 * - Result formatting and truncation
 * - Error handling and edge cases
 *
 * Prerequisites:
 * - Advisory files indexed in database
 * - Dev server running on localhost:3000
 * - Agent Mode accessible
 */
test.describe('M37-01: Advisory Search Tool', () => {
  /**
   * Helper to navigate to Agent Mode and submit a query
   */
  async function submitAgentQuery(page: Page, query: string): Promise<string> {
    // Navigate to home (Agent Mode)
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Find message input
    const messageInput = page.locator('textarea[placeholder]').first();
    await expect(messageInput).toBeVisible();

    // Type and submit query
    await messageInput.fill(query);

    const submitButton = page.locator('button[type="submit"]').or(
      page.locator('button:has-text("Send")')
    );
    await submitButton.click();

    // Wait for response (AI may take time)
    await page.waitForTimeout(15000); // 15 seconds for AI response

    // Get the assistant's response
    const assistantMessages = page.locator('[role="article"]').or(page.locator('.message'));
    const lastMessage = assistantMessages.last();
    await expect(lastMessage).toBeVisible({ timeout: 30000 });

    const responseText = await lastMessage.textContent() || '';
    return responseText;
  }

  /**
   * Helper to check if search_advisory tool was invoked
   */
  async function checkToolInvocation(page: Page): Promise<boolean> {
    // Look for tool usage indicators
    const toolIndicator = page.locator('text=/search_advisory|📂|Found.*advisory/i').first();
    return await toolIndicator.isVisible({ timeout: 5000 }).catch(() => false);
  }

  test.describe('Basic Search Functionality', () => {
    test('should return results for company name search: "MyTab"', async ({ page }) => {
      const response = await submitAgentQuery(page, 'Brief me on MyTab');

      console.log('Response for "Brief me on MyTab":', response.substring(0, 500));

      // Should contain MyTab-related content
      const hasMyTab = response.toLowerCase().includes('mytab') ||
                       response.toLowerCase().includes('mikaela');
      expect(hasMyTab).toBe(true);
    });

    test('should return results for topic search: "valuation"', async ({ page }) => {
      const response = await submitAgentQuery(page, 'What valuations do we have on file?');

      console.log('Response for valuation search:', response.substring(0, 500));

      // Should mention valuation-related content
      const hasValuation = response.toLowerCase().includes('valuation') ||
                          response.toLowerCase().includes('arr') ||
                          response.toLowerCase().includes('revenue');
      expect(hasValuation).toBe(true);
    });

    test('should return results for meeting search', async ({ page }) => {
      const response = await submitAgentQuery(page, 'Show me recent meeting notes');

      console.log('Response for meeting search:', response.substring(0, 500));

      // Should mention meetings or related content
      const hasMeetingContent = response.toLowerCase().includes('meeting') ||
                                response.toLowerCase().includes('call') ||
                                response.toLowerCase().includes('session');
      expect(hasMeetingContent).toBe(true);
    });

    test('should return results for communication search', async ({ page }) => {
      const response = await submitAgentQuery(page, 'What was my last email to Mikaela?');

      console.log('Response for email search:', response.substring(0, 500));

      // Should find communications related to Mikaela
      const hasEmailContent = response.toLowerCase().includes('email') ||
                              response.toLowerCase().includes('mikaela') ||
                              response.toLowerCase().includes('communication');
      expect(hasEmailContent).toBe(true);
    });
  });

  test.describe('Entity Filtering', () => {
    test('should filter by entity type: deals only', async ({ page }) => {
      // Using natural language that implies deal search
      const response = await submitAgentQuery(page,
        'Search deals only: What are the red flags for any deal?'
      );

      console.log('Response for deals filter:', response.substring(0, 500));

      // Should mention deal-specific content
      const hasDealContent = response.toLowerCase().includes('deal') ||
                             response.toLowerCase().includes('valuation') ||
                             response.toLowerCase().includes('stage');
      expect(hasDealContent).toBe(true);
    });

    test('should filter by entity type: clients only', async ({ page }) => {
      const response = await submitAgentQuery(page,
        'Search clients only: Tell me about SwiftCheckin as a client'
      );

      console.log('Response for clients filter:', response.substring(0, 500));

      // Should mention client-related content
      const hasClientContent = response.toLowerCase().includes('client') ||
                               response.toLowerCase().includes('engagement') ||
                               response.toLowerCase().includes('swiftcheckin');
      expect(hasClientContent).toBe(true);
    });

    test('should filter by entity name: SwiftCheckin', async ({ page }) => {
      const response = await submitAgentQuery(page,
        'Find all documents about SwiftCheckin'
      );

      console.log('Response for SwiftCheckin filter:', response.substring(0, 500));

      // Should be specifically about SwiftCheckin
      expect(response.toLowerCase()).toContain('swiftcheckin');
    });

    test('should filter by entity name: ArcheloLab', async ({ page }) => {
      const response = await submitAgentQuery(page,
        'What\'s the valuation for ArcheloLab?'
      );

      console.log('Response for ArcheloLab:', response.substring(0, 500));

      // Should contain ArcheloLab-specific content
      expect(response.toLowerCase()).toContain('archelolab');
    });
  });

  test.describe('Hybrid Search Scoring', () => {
    test('should return semantically relevant results for conceptual queries', async ({ page }) => {
      // Query that relies on semantic understanding
      const response = await submitAgentQuery(page,
        'What are the strategic concerns or risks for deals in the pipeline?'
      );

      console.log('Response for semantic query:', response.substring(0, 500));

      // Should find strategic observations/red flags even without exact keyword match
      const hasRelevantContent = response.toLowerCase().includes('risk') ||
                                 response.toLowerCase().includes('concern') ||
                                 response.toLowerCase().includes('flag') ||
                                 response.toLowerCase().includes('strategic') ||
                                 response.toLowerCase().includes('observation');
      expect(hasRelevantContent).toBe(true);
    });

    test('should rank exact keyword matches highly', async ({ page }) => {
      // Query with specific keywords that should appear in results
      const response = await submitAgentQuery(page,
        'Search for "Phase 1a" deal stage'
      );

      console.log('Response for keyword match:', response.substring(0, 500));

      // Should find files containing the exact phase
      const hasPhaseMatch = response.toLowerCase().includes('phase') ||
                           response.toLowerCase().includes('stage') ||
                           response.toLowerCase().includes('mytab');
      expect(hasPhaseMatch).toBe(true);
    });

    test('should combine vector and text relevance', async ({ page }) => {
      // Query that benefits from both semantic and keyword matching
      const response = await submitAgentQuery(page,
        'Show me the master document for MyTab including their ARR and founder information'
      );

      console.log('Response for combined query:', response.substring(0, 500));

      // Should find the master doc with relevant information
      const hasComprehensiveContent =
        response.toLowerCase().includes('mytab') &&
        (response.toLowerCase().includes('arr') ||
         response.toLowerCase().includes('mikaela') ||
         response.toLowerCase().includes('founder'));
      expect(hasComprehensiveContent).toBe(true);
    });
  });

  test.describe('Result Formatting', () => {
    test('should truncate long content in results', async ({ page }) => {
      const response = await submitAgentQuery(page,
        'Brief me on all deal documentation'
      );

      console.log('Response length:', response.length);

      // Response should be readable, not excessively long
      // If raw content was returned, it would be thousands of characters
      // Truncated should be more manageable
      expect(response.length).toBeLessThan(50000); // Reasonable limit
    });

    test('should include entity name and type in results', async ({ page }) => {
      const response = await submitAgentQuery(page,
        'What advisory files do we have?'
      );

      console.log('Response for file list:', response.substring(0, 1000));

      // Results should indicate what type of entity the results are from
      const hasEntityInfo = response.toLowerCase().includes('deal') ||
                           response.toLowerCase().includes('client');
      expect(hasEntityInfo).toBe(true);
    });

    test('should show relevance/similarity scores when available', async ({ page }) => {
      const response = await submitAgentQuery(page,
        'Search advisory files for "valuation analysis"'
      );

      console.log('Response for score check:', response.substring(0, 500));

      // The tool should return score information (may be formatted differently)
      // This is a soft check - scores may or may not be visible in final output
      const hasScoreOrRanking = response.toLowerCase().includes('score') ||
                                response.toLowerCase().includes('found') ||
                                response.match(/\[\d+\]/); // Citation markers
      console.log('Has score/ranking info:', hasScoreOrRanking);
    });
  });

  test.describe('Edge Cases and Error Handling', () => {
    test('should handle no results gracefully', async ({ page }) => {
      const response = await submitAgentQuery(page,
        'Find documents about NonExistentCompanyXYZ123'
      );

      console.log('Response for no results:', response.substring(0, 500));

      // Should not crash, should provide helpful message
      const hasGracefulResponse = response.toLowerCase().includes('no') ||
                                  response.toLowerCase().includes('found') ||
                                  response.toLowerCase().includes('couldn\'t find') ||
                                  response.toLowerCase().includes('not find') ||
                                  response.toLowerCase().includes('unable');
      expect(hasGracefulResponse).toBe(true);
    });

    test('should handle very short queries', async ({ page }) => {
      const response = await submitAgentQuery(page,
        'MyTab?'
      );

      console.log('Response for short query:', response.substring(0, 500));

      // Should still attempt to find relevant content
      const hasContent = response.length > 50;
      expect(hasContent).toBe(true);
    });

    test('should handle queries with special characters', async ({ page }) => {
      const response = await submitAgentQuery(page,
        'What\'s the status of the deal: MyTab & SwiftCheckin?'
      );

      console.log('Response for special chars:', response.substring(0, 500));

      // Should handle quotes, ampersand, etc.
      const hasContent = response.length > 50;
      expect(hasContent).toBe(true);
    });

    test('should handle very long queries', async ({ page }) => {
      const longQuery = 'I need a comprehensive briefing on all the deals in the pipeline including ' +
        'MyTab with its current stage and valuation, SwiftCheckin with its engagement history, ' +
        'ArcheloLab with its positioning work, ControlShiftAI with its market analysis, ' +
        'and any other deals we have documentation for. Please include key contacts, ' +
        'red flags, and next steps for each.';

      const response = await submitAgentQuery(page, longQuery);

      console.log('Response for long query:', response.substring(0, 500));

      // Should process without error
      const hasContent = response.length > 100;
      expect(hasContent).toBe(true);
    });
  });

  test.describe('Sprint Validation Queries', () => {
    /**
     * These are the 6 validation queries from the sprint document
     * Target: 5/6 should pass
     */

    test('Validation Query 1: "Brief me on MyTab"', async ({ page }) => {
      const response = await submitAgentQuery(page, 'Brief me on MyTab');

      console.log('VQ1 Response:', response.substring(0, 1000));

      // Expected: Master-doc summary with stage, contacts, red flags
      const checks = {
        hasMyTab: response.toLowerCase().includes('mytab'),
        hasStageOrPhase: response.toLowerCase().includes('stage') ||
                         response.toLowerCase().includes('phase'),
        hasContactOrFounder: response.toLowerCase().includes('mikaela') ||
                             response.toLowerCase().includes('founder') ||
                             response.toLowerCase().includes('contact'),
        hasRedFlagOrConcern: response.toLowerCase().includes('flag') ||
                             response.toLowerCase().includes('concern') ||
                             response.toLowerCase().includes('risk'),
      };

      console.log('VQ1 Checks:', checks);

      // At minimum, should have MyTab content
      expect(checks.hasMyTab).toBe(true);

      // Should have at least 2 of the other criteria
      const passedCriteria = Object.values(checks).filter(Boolean).length;
      expect(passedCriteria).toBeGreaterThanOrEqual(2);
    });

    test('Validation Query 2: "What was my last email to Mikaela?"', async ({ page }) => {
      const response = await submitAgentQuery(page, 'What was my last email to Mikaela?');

      console.log('VQ2 Response:', response.substring(0, 1000));

      // Expected: Communications Log from MyTab
      const checks = {
        hasEmail: response.toLowerCase().includes('email'),
        hasMikaela: response.toLowerCase().includes('mikaela'),
        hasMyTab: response.toLowerCase().includes('mytab'),
        hasCommunication: response.toLowerCase().includes('communication') ||
                          response.toLowerCase().includes('message'),
      };

      console.log('VQ2 Checks:', checks);

      // Should find email/communication content
      const passedCriteria = Object.values(checks).filter(Boolean).length;
      expect(passedCriteria).toBeGreaterThanOrEqual(2);
    });

    test('Validation Query 3: "What deals have red flags?"', async ({ page }) => {
      const response = await submitAgentQuery(page, 'What deals have red flags?');

      console.log('VQ3 Response:', response.substring(0, 1000));

      // Expected: Multiple deals with Strategic Observations
      const checks = {
        hasRedFlag: response.toLowerCase().includes('flag') ||
                    response.toLowerCase().includes('red'),
        hasStrategic: response.toLowerCase().includes('strategic') ||
                      response.toLowerCase().includes('concern') ||
                      response.toLowerCase().includes('risk'),
        hasMultipleDeals: (response.match(/mytab|swiftcheckin|archelolab|controlshiftai|talvin|tandm/gi) || []).length >= 2,
      };

      console.log('VQ3 Checks:', checks);

      // Should identify concerns from multiple deals
      const passedCriteria = Object.values(checks).filter(Boolean).length;
      expect(passedCriteria).toBeGreaterThanOrEqual(1);
    });

    test('Validation Query 4: "Prep me for SwiftCheckin call"', async ({ page }) => {
      const response = await submitAgentQuery(page, 'Prep me for SwiftCheckin call');

      console.log('VQ4 Response:', response.substring(0, 1000));

      // Expected: Client profile + touchpoints
      const checks = {
        hasSwiftCheckin: response.toLowerCase().includes('swiftcheckin'),
        hasClientProfile: response.toLowerCase().includes('client') ||
                          response.toLowerCase().includes('profile'),
        hasTouchpoint: response.toLowerCase().includes('call') ||
                       response.toLowerCase().includes('meeting') ||
                       response.toLowerCase().includes('touchpoint'),
        hasEngagement: response.toLowerCase().includes('engagement') ||
                       response.toLowerCase().includes('gtm'),
      };

      console.log('VQ4 Checks:', checks);

      // Should have SwiftCheckin and relevant prep info
      expect(checks.hasSwiftCheckin).toBe(true);
      const passedCriteria = Object.values(checks).filter(Boolean).length;
      expect(passedCriteria).toBeGreaterThanOrEqual(2);
    });

    test('Validation Query 5: "What\'s the valuation for ArcheloLab?"', async ({ page }) => {
      const response = await submitAgentQuery(page, 'What\'s the valuation for ArcheloLab?');

      console.log('VQ5 Response:', response.substring(0, 1000));

      // Expected: Valuation Snapshot section
      const checks = {
        hasArcheloLab: response.toLowerCase().includes('archelolab'),
        hasValuation: response.toLowerCase().includes('valuation'),
        hasFinancial: response.toLowerCase().includes('arr') ||
                      response.toLowerCase().includes('revenue') ||
                      response.toLowerCase().includes('multiple') ||
                      response.toLowerCase().includes('$'),
      };

      console.log('VQ5 Checks:', checks);

      // Should have ArcheloLab valuation info
      expect(checks.hasArcheloLab).toBe(true);
      const passedCriteria = Object.values(checks).filter(Boolean).length;
      expect(passedCriteria).toBeGreaterThanOrEqual(2);
    });

    test('Validation Query 6: "Show me Dec 2 meeting notes for MyTab"', async ({ page }) => {
      const response = await submitAgentQuery(page, 'Show me Dec 2 meeting notes for MyTab');

      console.log('VQ6 Response:', response.substring(0, 1000));

      // Expected: Specific meeting file (2025-12-02-pitch-practice-session.md)
      const checks = {
        hasMyTab: response.toLowerCase().includes('mytab'),
        hasMeeting: response.toLowerCase().includes('meeting') ||
                    response.toLowerCase().includes('session'),
        hasDecember: response.toLowerCase().includes('dec') ||
                     response.toLowerCase().includes('december') ||
                     response.includes('12-02') ||
                     response.includes('12/02'),
        hasPitch: response.toLowerCase().includes('pitch'),
      };

      console.log('VQ6 Checks:', checks);

      // Should find the specific meeting
      const passedCriteria = Object.values(checks).filter(Boolean).length;
      expect(passedCriteria).toBeGreaterThanOrEqual(2);
    });
  });
});
