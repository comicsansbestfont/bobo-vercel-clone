/**
 * Similar Questions Context Injection (M3.13-08)
 *
 * Detects when a user asks a question and surfaces similar questions
 * they've asked before from memory_entries (memory_type='question').
 */

import { supabase, DEFAULT_USER_ID } from '@/lib/db/client';
import { generateEmbedding } from '@/lib/ai/embedding';
import { chatLogger } from '@/lib/logger';

// ============================================================================
// Question Detection
// ============================================================================

const QUESTION_WORDS = [
  'what', 'why', 'how', 'when', 'where', 'who', 'which',
  'can', 'should', 'would', 'could', 'will', 'shall',
  'is', 'are', 'am', 'was', 'were',
  'do', 'does', 'did', 'have', 'has', 'had'
];

/**
 * Detect if text is a question
 *
 * Criteria:
 * - Contains '?'
 * - Starts with question words (case-insensitive)
 */
export function isQuestion(text: string): boolean {
  if (!text || text.trim().length === 0) {
    return false;
  }

  const trimmed = text.trim();

  // Check for question mark
  if (trimmed.includes('?')) {
    return true;
  }

  // Check if starts with question word
  const firstWord = trimmed.split(/\s+/)[0].toLowerCase();
  // Remove punctuation from first word
  const cleanFirstWord = firstWord.replace(/[^\w]/g, '');

  return QUESTION_WORDS.includes(cleanFirstWord);
}

// ============================================================================
// Similar Questions Search
// ============================================================================

export interface SimilarQuestion {
  id: string;
  content: string;
  context?: string;
  similarity: number;
  created_at: string;
}

/**
 * Find similar questions from memory using hybrid search
 *
 * @param query - The user's current question
 * @param limit - Maximum number of similar questions to return (default: 3)
 * @returns Array of similar questions from memory_entries where memory_type='question'
 */
export async function getSimilarQuestions(
  query: string,
  limit: number = 3
): Promise<SimilarQuestion[]> {
  try {
    chatLogger.info('[SimilarQuestions] Searching for similar questions', {
      query: query.substring(0, 100),
      limit,
    });

    // Generate embedding for semantic search
    const embedding = await generateEmbedding(query);

    // Call enhanced_memory_search with memory_type filter
    // Use same RPC as search_memory tool but filter to memory_type='question'
    const { data, error } = await supabase.rpc('enhanced_memory_search', {
      query_embedding: embedding,
      query_text: query,
      match_count: limit,
      // Temporal weighting (same as search_memory)
      vector_weight: 0.45,
      text_weight: 0.15,
      recency_weight: 0.20,
      frequency_weight: 0.10,
      importance_weight: 0.10, // Changed from confidence_weight to match RPC signature
      recency_half_life_days: 45.0,
      min_vector_similarity: 0.3,
      // Filters
      p_user_id: DEFAULT_USER_ID,
      p_category: undefined, // Don't filter by category
      p_memory_type: 'question', // Only questions (correct parameter name)
    });

    if (error) {
      chatLogger.error('[SimilarQuestions] Search failed:', error);
      return [];
    }

    if (!data || data.length === 0) {
      chatLogger.info('[SimilarQuestions] No similar questions found');
      return [];
    }

    // Map RPC results to SimilarQuestion format
    // RPC returns: id, category, content, confidence, source_type, last_accessed,
    // access_count, importance, combined_score, vector_score, text_score, recency_score, frequency_score
    const results: SimilarQuestion[] = data.map((item: {
      id: string;
      content: string;
      combined_score: number;
      category?: string;
      [key: string]: unknown; // For other fields we don't need
    }) => ({
      id: item.id,
      content: item.content,
      similarity: item.combined_score,
      // Note: RPC doesn't return created_at, so we use empty string
      // The category might contain useful context
      context: item.category ? `Category: ${item.category}` : undefined,
      created_at: '', // Not available from RPC
    }));

    chatLogger.info('[SimilarQuestions] Found similar questions', {
      count: results.length,
    });

    return results;
  } catch (error) {
    chatLogger.error('[SimilarQuestions] Error:', error);
    return []; // Fail gracefully - don't break chat
  }
}

// ============================================================================
// Context Formatting
// ============================================================================

/**
 * Format similar questions as a markdown section for system prompt
 *
 * @param questions - Array of similar questions
 * @returns Formatted markdown string to inject into context
 */
export function formatSimilarQuestionsContext(
  questions: SimilarQuestion[]
): string {
  if (questions.length === 0) {
    return '';
  }

  const formattedQuestions = questions
    .map((q, index) => {
      let line = `${index + 1}. ${q.content}`;

      // Add context if available
      if (q.context) {
        line += `\n   Context: ${q.context}`;
      }

      return line;
    })
    .join('\n');

  return `
## Similar Questions You've Asked Before

${formattedQuestions}

**NOTE:** These are questions you've asked in past conversations. Use them to:
- Maintain consistency in your answers
- Build on previous explanations
- Reference past discussions if relevant
- Avoid repeating yourself unnecessarily
`;
}
