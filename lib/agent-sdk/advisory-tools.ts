/**
 * M3.7: Advisory File Search Tool
 *
 * Agent tool for searching indexed advisory files (deals, clients, meetings).
 * Uses hybrid search (70% vector + 30% text) matching memory-tools pattern.
 */

import { z } from 'zod';
import { generateEmbedding } from '@/lib/ai/embedding';
import { supabase } from '@/lib/db/client';
import { ADVISORY_PROJECT_ID, type AdvisorySearchResult } from '@/lib/db/types';

// Entity type options
const ENTITY_TYPES = ['deal', 'client', 'all'] as const;

// ============================================================================
// Types
// ============================================================================

export type AdvisoryToolResult = {
  success: boolean;
  message: string;
  results?: AdvisorySearchResult[];
};

// ============================================================================
// Tool Definition
// ============================================================================

/**
 * search_advisory - Search advisory files (deals, clients, meetings)
 *
 * Auto-approved (read-only operation)
 */
export const searchAdvisoryTool = {
  name: 'search_advisory',

  description: `Search advisory files including deal master docs, client profiles, and meeting notes.
Use when: User asks about specific deals, clients, meetings, or wants briefings.
Returns: Relevant file excerpts with similarity scores.
Examples: "Brief me on MyTab", "What's the valuation for Talvin?", "Show me SwiftCheckin client profile"`,

  parameters: z.object({
    query: z
      .string()
      .min(1)
      .max(500)
      .describe('Search query - company name, topic, or natural language question'),
    entity_type: z
      .enum(ENTITY_TYPES)
      .default('all')
      .describe('Filter by entity type: deal, client, or all'),
    entity_name: z
      .string()
      .optional()
      .describe('Filter by specific company/entity name (e.g., "MyTab", "SwiftCheckin")'),
    limit: z
      .number()
      .min(1)
      .max(20)
      .default(5)
      .describe('Max results to return'),
  }),

  execute: async ({
    query,
    entity_type = 'all',
    entity_name,
    limit = 5,
  }: {
    query: string;
    entity_type?: 'deal' | 'client' | 'all';
    entity_name?: string;
    limit?: number;
  }): Promise<string> => {
    try {
      console.log(`[search_advisory] Searching for: "${query}"`, {
        entity_type,
        entity_name,
        limit,
      });

      // Generate embedding for semantic search
      const embedding = await generateEmbedding(query);

      // Call advisory search RPC
      const { data: results, error } = await supabase.rpc(
        'search_advisory_files',
        {
          query_embedding: embedding,
          query_text: query,
          p_project_id: ADVISORY_PROJECT_ID,
          entity_type_filter: entity_type === 'all' ? undefined : entity_type,
          entity_name_filter: entity_name,
          match_count: limit,
          vector_weight: 0.7,
          text_weight: 0.3,
          min_similarity: 0.3,
        }
      );

      if (error) {
        console.error('[search_advisory] RPC error:', error);
        throw new Error(`Advisory search failed: ${error.message}`);
      }

      if (!results || results.length === 0) {
        console.log('[search_advisory] No results found');
        return 'No matching advisory files found. Try different keywords or entity names.';
      }

      // Format results for agent consumption
      const formatted = (results as AdvisorySearchResult[])
        .map((r, i) => {
          // Truncate content to ~500 chars for readability
          const excerpt = r.content_text.length > 500
            ? r.content_text.substring(0, 500) + '...'
            : r.content_text;

          return `[${i + 1}] ${r.entity_name} (${r.entity_type})\nFile: ${r.filename}\nScore: ${r.combined_score.toFixed(2)}\n---\n${excerpt}`;
        })
        .join('\n\n');

      console.log(`[search_advisory] Found ${results.length} files`);
      return `Found ${results.length} advisory files:\n\n${formatted}`;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[search_advisory] Failed:', error);
      return `Advisory search failed: ${errorMessage}`;
    }
  },
};

// ============================================================================
// Tool Collection Export
// ============================================================================

/**
 * All advisory tools for agent use
 */
export const advisoryTools = {
  search_advisory: searchAdvisoryTool,
};

/**
 * Advisory tool names for configuration
 */
export const ADVISORY_TOOL_NAMES = Object.keys(advisoryTools);

/**
 * Get an advisory tool by name
 */
export function getAdvisoryTool(name: string) {
  return advisoryTools[name as keyof typeof advisoryTools];
}
