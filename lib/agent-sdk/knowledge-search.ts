/**
 * M3.8: Unified Knowledge Search for Agent Mode
 *
 * Pre-flight search that automatically fetches relevant content from:
 * - Advisory files (deals, clients, meetings)
 * - Memory entries (facts, preferences)
 *
 * Based on intent classification, this module determines which sources
 * to search and injects the results into the agent's context.
 */

import { generateEmbedding } from '@/lib/ai/embedding';
import { supabase, DEFAULT_USER_ID } from '@/lib/db/client';
import { chatLogger } from '@/lib/logger';
import {
  classifyQueryIntent,
  extractCompanyName,
  type QueryIntent,
} from './intent-classifier';

// ============================================================================
// Types
// ============================================================================

export type KnowledgeSource = 'memory' | 'advisory';

export type KnowledgeResult = {
  source: KnowledgeSource;
  id: string;
  content: string;
  metadata: {
    // Memory fields
    category?: string;
    confidence?: number;
    // Advisory fields
    entityType?: string;
    entityName?: string;
    filename?: string;
  };
  score: number;
};

export type KnowledgeSearchResult = {
  intent: QueryIntent;
  results: KnowledgeResult[];
  context: string; // Formatted context for system prompt
  sourceCounts: {
    memory: number;
    advisory: number;
  };
};

// ============================================================================
// Configuration
// ============================================================================

const ADVISORY_PROJECT_ID = '11111111-1111-1111-1111-111111111111';

const SEARCH_CONFIG = {
  advisory: {
    limit: 5,
    vectorWeight: 0.7,
    textWeight: 0.3,
    minSimilarity: 0.25,
  },
  memory: {
    limit: 5,
    vectorWeight: 0.45,
    textWeight: 0.15,
    recencyWeight: 0.20,
    frequencyWeight: 0.10,
    confidenceWeight: 0.10,
    halfLifeDays: 45.0,
    minSimilarity: 0.25,
  },
};

// ============================================================================
// Internal Search Functions
// ============================================================================

/**
 * Search advisory files
 */
async function searchAdvisoryFiles(
  query: string,
  embedding: number[],
  entityName?: string | null,
  limit: number = 5
): Promise<KnowledgeResult[]> {
  try {
    const { data, error } = await supabase.rpc('search_advisory_files', {
      query_embedding: embedding,
      query_text: query,
      p_project_id: ADVISORY_PROJECT_ID,
      entity_name_filter: entityName ?? undefined,
      match_count: limit,
      vector_weight: SEARCH_CONFIG.advisory.vectorWeight,
      text_weight: SEARCH_CONFIG.advisory.textWeight,
      min_similarity: SEARCH_CONFIG.advisory.minSimilarity,
    });

    if (error) {
      chatLogger.error('[knowledge-search] Advisory search error:', error);
      return [];
    }

    return (data || []).map((r: {
      id: string;
      content_text: string;
      entity_type: string | null;
      entity_name: string | null;
      filename: string;
      combined_score: number;
    }) => ({
      source: 'advisory' as const,
      id: r.id,
      content: r.content_text.length > 800
        ? r.content_text.slice(0, 800) + '...'
        : r.content_text,
      metadata: {
        entityType: r.entity_type ?? undefined,
        entityName: r.entity_name ?? undefined,
        filename: r.filename,
      },
      score: r.combined_score,
    }));
  } catch (error) {
    chatLogger.error('[knowledge-search] Advisory search failed:', error);
    return [];
  }
}

/**
 * Search memory entries
 */
async function searchMemoryEntries(
  query: string,
  embedding: number[],
  category?: string,
  limit: number = 5
): Promise<KnowledgeResult[]> {
  try {
    const { data, error } = await supabase.rpc('enhanced_memory_search', {
      query_embedding: embedding,
      query_text: query,
      match_count: limit,
      vector_weight: SEARCH_CONFIG.memory.vectorWeight,
      text_weight: SEARCH_CONFIG.memory.textWeight,
      recency_weight: SEARCH_CONFIG.memory.recencyWeight,
      frequency_weight: SEARCH_CONFIG.memory.frequencyWeight,
      confidence_weight: SEARCH_CONFIG.memory.confidenceWeight,
      recency_half_life_days: SEARCH_CONFIG.memory.halfLifeDays,
      min_vector_similarity: SEARCH_CONFIG.memory.minSimilarity,
      p_user_id: DEFAULT_USER_ID,
      p_category: category ?? undefined,
    });

    if (error) {
      chatLogger.error('[knowledge-search] Memory search error:', error);
      return [];
    }

    return (data || []).map((m: {
      id: string;
      content: string;
      category: string;
      confidence: number;
      combined_score: number;
    }) => ({
      source: 'memory' as const,
      id: m.id,
      content: m.content,
      metadata: {
        category: m.category,
        confidence: m.confidence,
      },
      score: m.combined_score,
    }));
  } catch (error) {
    chatLogger.error('[knowledge-search] Memory search failed:', error);
    return [];
  }
}

// ============================================================================
// Context Formatting
// ============================================================================

/**
 * Format search results into context for system prompt
 */
function formatKnowledgeContext(
  results: KnowledgeResult[],
  intent: QueryIntent
): string {
  if (results.length === 0) {
    return '';
  }

  const advisoryResults = results.filter(r => r.source === 'advisory');
  const memoryResults = results.filter(r => r.source === 'memory');

  const sections: string[] = [];

  // Advisory files section
  if (advisoryResults.length > 0) {
    const advisoryLines = advisoryResults.map((r, i) => {
      const label = r.metadata.entityName || 'Document';
      const filename = r.metadata.filename?.split('/').pop() || '';
      return `[${i + 1}] ${label} (${filename})\n${r.content}`;
    });

    sections.push(`## Advisory Files (Deals/Clients)

Found ${advisoryResults.length} relevant documents:

${advisoryLines.join('\n\n---\n\n')}`);
  }

  // Memory section
  if (memoryResults.length > 0) {
    const memoryLines = memoryResults.map((r, i) => {
      const category = r.metadata.category || 'general';
      return `[${i + 1}] (${category}) ${r.content}`;
    });

    sections.push(`## Relevant Memories

${memoryLines.join('\n')}`);
  }

  // Wrap in context block
  return `
### KNOWLEDGE CONTEXT (Auto-retrieved)

Based on your query, I found relevant information:

${sections.join('\n\n')}

Use this context to inform your response. Cite specific details when answering.
`;
}

// ============================================================================
// Main Search Function
// ============================================================================

/**
 * Perform unified knowledge search based on query intent
 *
 * This is the main entry point called by agent-handler.ts
 * It automatically determines which sources to search based on the query.
 *
 * @param userQuery - The user's natural language query
 * @returns Search results with formatted context for injection
 */
export async function searchKnowledge(
  userQuery: string
): Promise<KnowledgeSearchResult> {
  // Skip very short queries
  if (!userQuery || userQuery.trim().length < 5) {
    return {
      intent: { category: 'hybrid', confidence: 0, entities: [], suggestedSources: [], matchedPatterns: [] },
      results: [],
      context: '',
      sourceCounts: { memory: 0, advisory: 0 },
    };
  }

  // Step 1: Classify intent
  const intent = classifyQueryIntent(userQuery);
  chatLogger.debug('[knowledge-search] Intent classified:', {
    category: intent.category,
    confidence: intent.confidence,
    sources: intent.suggestedSources,
    patterns: intent.matchedPatterns,
  });

  // Step 2: Generate embedding (shared for all searches)
  let embedding: number[];
  try {
    embedding = await generateEmbedding(userQuery);
  } catch (error) {
    chatLogger.error('[knowledge-search] Embedding generation failed:', error);
    return {
      intent,
      results: [],
      context: '',
      sourceCounts: { memory: 0, advisory: 0 },
    };
  }

  // Step 3: Determine sources to search
  const searchAdvisory = intent.suggestedSources.includes('advisory');
  const searchMemory = intent.suggestedSources.includes('memory');

  // Extract company name for filtering (if present)
  const companyName = extractCompanyName(userQuery);

  // Step 4: Execute searches in parallel
  const [advisoryResults, memoryResults] = await Promise.all([
    searchAdvisory
      ? searchAdvisoryFiles(userQuery, embedding, companyName, SEARCH_CONFIG.advisory.limit)
      : Promise.resolve([]),
    searchMemory
      ? searchMemoryEntries(userQuery, embedding, undefined, SEARCH_CONFIG.memory.limit)
      : Promise.resolve([]),
  ]);

  // Step 5: Combine results (interleave by score)
  const allResults = [...advisoryResults, ...memoryResults];
  allResults.sort((a, b) => b.score - a.score);

  // Take top 8 combined results
  const topResults = allResults.slice(0, 8);

  chatLogger.info('[knowledge-search] Search complete:', {
    query: userQuery.slice(0, 50),
    intent: intent.category,
    advisory: advisoryResults.length,
    memory: memoryResults.length,
    total: topResults.length,
  });

  // Step 6: Format context
  const context = formatKnowledgeContext(topResults, intent);

  return {
    intent,
    results: topResults,
    context,
    sourceCounts: {
      memory: memoryResults.length,
      advisory: advisoryResults.length,
    },
  };
}

/**
 * Build advisory-specific context for agent system prompt
 *
 * This is called when we detect the query is about deals/clients
 * and we want to provide file content directly in the context.
 */
export async function buildAdvisoryContext(
  userQuery: string
): Promise<string> {
  const result = await searchKnowledge(userQuery);

  if (result.results.length === 0) {
    return '';
  }

  return result.context;
}
