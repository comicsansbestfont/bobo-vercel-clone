/**
 * M4-13: Global Search Integration for Agent Mode
 *
 * Provides Loop B global search capability to agent mode by searching across
 * all projects for relevant context using hybrid vector + text search.
 */

import { generateEmbedding } from '@/lib/ai/embedding';
import { hybridSearch } from '@/lib/db/queries';
import { type SearchResult } from '@/lib/db/types';
import { chatLogger } from '@/lib/logger';

export interface GlobalSearchResult {
  context: string;
  sources: SearchResult[];
}

const GLOBAL_SEARCH_CONFIG = {
  threshold: 0.65, // Similarity threshold for vector search
  limit: 5, // Max results to return
};

/**
 * Build global search context for agent mode
 *
 * This function:
 * 1. Generates an embedding for the user's query
 * 2. Searches across all projects (except the active one) using hybrid search
 * 3. Formats results into a context string for the system prompt
 *
 * @param userMessage - The user's message to search for
 * @param activeProjectId - Current project ID to exclude from results (optional)
 * @returns Context string and source metadata for citations
 */
export async function buildGlobalSearchContext(
  userMessage: string,
  activeProjectId?: string | null
): Promise<GlobalSearchResult> {
  try {
    // Skip if message is too short to be meaningful
    if (!userMessage || userMessage.trim().length < 10) {
      return { context: '', sources: [] };
    }

    // Generate embedding for the user's query
    const queryEmbedding = await generateEmbedding(userMessage);

    // Perform hybrid search across all projects
    const results = await hybridSearch(
      queryEmbedding,
      GLOBAL_SEARCH_CONFIG.threshold,
      GLOBAL_SEARCH_CONFIG.limit,
      activeProjectId || '' // Empty string means search all projects
    );

    if (results.length === 0) {
      chatLogger.debug('Global search: No relevant results found');
      return { context: '', sources: [] };
    }

    chatLogger.debug('Global search: Found results', { count: results.length });

    // Format results into a context section
    const contextLines = results.map((result, index) => {
      const sourceType = result.source_type === 'project' ? 'Project File' : 'Global';
      const similarity = Math.round(result.similarity * 100);
      // Truncate long content for context
      const truncatedContent = result.content.length > 500
        ? result.content.slice(0, 500) + '...'
        : result.content;

      return `[${index + 1}] (${sourceType}, ${similarity}% match)
${truncatedContent}`;
    });

    const context = `
## Related Context from Other Sources

Found relevant information from previous work that may help:

${contextLines.join('\n\n')}

Use this context to inform your responses, but prioritize the current project's files and the user's explicit instructions.
`;

    return { context, sources: results };
  } catch (error) {
    chatLogger.error('Global search failed:', error);
    // Graceful degradation - return empty context if search fails
    return { context: '', sources: [] };
  }
}

/**
 * Re-export SearchResult type for convenience
 */
export type { SearchResult };
