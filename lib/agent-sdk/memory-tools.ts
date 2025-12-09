/**
 * M3.5: Memory Agent Tools
 *
 * Agent tools for real-time memory management during conversations.
 * These tools allow the agent to search, store, update, and delete
 * user memories with appropriate safety controls.
 */

import { z } from 'zod';
import { generateEmbedding } from '@/lib/ai/embedding';
import { supabase, DEFAULT_USER_ID } from '@/lib/db/client';
import { createMemory, getMemoryById, updateMemoryEntry, softDeleteMemory, updateMemoryAccess } from '@/lib/db/queries';
import { memoryLogger } from '@/lib/logger';
import type { MemoryCategory } from '@/lib/db/types';
import crypto from 'crypto';

// ============================================================================
// Types
// ============================================================================

export type MemoryToolResult = {
  success: boolean;
  message: string;
  memoryId?: string;
  data?: Record<string, unknown>;
};

// M3.6-02: Enhanced search result with all score components
export type MemorySearchResult = {
  id: string;
  category: string;
  content: string;
  confidence: number;
  source_type: string;
  last_accessed: string | null;
  access_count: number;
  importance: number;
  // Score components for transparency/debugging
  vector_score: number;
  text_score: number;
  recency_score: number;
  frequency_score: number;
  combined_score: number;
};

export type SimilarMemory = {
  id: string;
  category: string;
  content: string;
  confidence: number;
  source_type: string;
  similarity: number;
};

// Category enum for Zod validation
const MEMORY_CATEGORIES = [
  'work_context',
  'personal_context',
  'top_of_mind',
  'brief_history',
  'long_term_background',
  'other_instructions',
] as const;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Find semantically similar memories using vector search
 * Used for deduplication before creating new memories
 */
export async function findSimilarMemories(
  content: string,
  threshold: number = 0.85,
  userId: string = DEFAULT_USER_ID
): Promise<SimilarMemory[]> {
  try {
    const embedding = await generateEmbedding(content);

    const { data, error } = await supabase.rpc('find_memories_by_embedding', {
      query_embedding: embedding,
      similarity_threshold: threshold,
      p_user_id: userId,
      match_count: 5,
    });

    if (error) {
      memoryLogger.error('findSimilarMemories RPC error:', error);
      throw error;
    }

    return (data || []) as SimilarMemory[];
  } catch (error) {
    memoryLogger.error('findSimilarMemories failed:', error);
    throw error;
  }
}

/**
 * Generate a content hash for deduplication
 */
function generateContentHash(content: string): string {
  return crypto
    .createHash('sha256')
    .update(content.toLowerCase().trim())
    .digest('hex')
    .substring(0, 32);
}

// ============================================================================
// Tool Definitions
// ============================================================================

/**
 * search_memory - Search user's memories using hybrid search
 *
 * Auto-approved (read-only operation)
 */
export const searchMemoryTool = {
  name: 'search_memory',

  description: `Search the user's memories to find relevant information.
Use this to look up facts you previously stored or to find memories to update/forget.
Returns up to 10 matching memories sorted by relevance.
Optionally provide recent conversation context to improve relevance.`,

  parameters: z.object({
    query: z
      .string()
      .min(1)
      .max(500)
      .describe('Search query - can be keywords or natural language'),
    category: z
      .enum(MEMORY_CATEGORIES)
      .optional()
      .describe('Filter to specific category'),
    limit: z
      .number()
      .min(1)
      .max(10)
      .default(5)
      .describe('Max results to return'),
    conversationContext: z
      .array(z.string())
      .optional()
      .describe('Recent conversation messages for context-aware search'),
  }),

  execute: async ({
    query,
    category,
    limit = 5,
    conversationContext,
  }: {
    query: string;
    category?: MemoryCategory;
    limit?: number;
    conversationContext?: string[];
  }): Promise<string> => {
    try {
      memoryLogger.info(`[search_memory] Searching for: "${query}"`, {
        category,
        limit,
        hasContext: !!conversationContext,
      });

      // REQ-014: Context-aware embedding generation
      // If conversation context provided, combine last 3 messages with query
      let embeddingText = query;
      if (conversationContext && conversationContext.length > 0) {
        const recentMessages = conversationContext.slice(-3);
        embeddingText = [...recentMessages, query].join('\n');
        memoryLogger.info(`[search_memory] Using contextual embedding with ${recentMessages.length} messages`);
      }

      // Generate embedding for semantic search
      const embedding = await generateEmbedding(embeddingText);

      // M3.6-02: Call enhanced search RPC with temporal weighting (REQ-009)
      const { data: memories, error } = await supabase.rpc(
        'enhanced_memory_search',
        {
          query_embedding: embedding,
          query_text: query,
          match_count: limit,
          // REQ-009 temporal weighting (sum = 1.0)
          vector_weight: 0.45,
          text_weight: 0.15,
          recency_weight: 0.20,
          frequency_weight: 0.10,
          confidence_weight: 0.10,
          // Tuning parameters
          recency_half_life_days: 45.0,
          min_vector_similarity: 0.3,
          // Filters
          p_user_id: DEFAULT_USER_ID,
          p_category: category ?? undefined,
        }
      );

      if (error) {
        memoryLogger.error('[search_memory] RPC error:', error);
        throw new Error(`Memory search failed: ${error.message}`);
      }

      if (!memories || memories.length === 0) {
        memoryLogger.info('[search_memory] No results found');
        return 'No matching memories found.';
      }

      // Format results for agent consumption
      const results = (memories as MemorySearchResult[])
        .map(
          (m, i) =>
            `[${i + 1}] ${m.category}: "${m.content}" (id: ${m.id})`
        )
        .join('\n');

      // M3.6-02: Fire-and-forget access tracking
      // Extract IDs and update metrics asynchronously (don't await)
      const memoryIds = (memories as MemorySearchResult[]).map(m => m.id);
      updateMemoryAccess(memoryIds).catch(() => {
        // Errors already logged inside updateMemoryAccess
        // This catch prevents unhandled promise rejection
      });

      memoryLogger.info(
        `[search_memory] Found ${memories.length} memories`
      );
      return `Found ${memories.length} memories:\n${results}`;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      memoryLogger.error('[search_memory] Failed:', error);
      return `Memory search failed: ${errorMessage}. You can try again or suggest the user visit their Memory settings at /memory.`;
    }
  },
};

/**
 * remember_fact - Store a new fact about the user
 *
 * Auto-approved (additive operation, easily undone)
 */
export const rememberFactTool = {
  name: 'remember_fact',

  description: `Store an important fact about the user or their work.
Use when the user shares something worth remembering long-term.
Be selective - only store meaningful, actionable information.
Examples: "I'm a senior engineer at Acme Corp", "I prefer TypeScript over JavaScript"
Do NOT store: transient tasks, temporary states, obvious context`,

  parameters: z.object({
    category: z
      .enum(MEMORY_CATEGORIES)
      .describe('Which memory category this belongs to'),
    content: z
      .string()
      .min(10)
      .max(500)
      .describe('The fact to remember'),
    confidence: z
      .number()
      .min(0.5)
      .max(1.0)
      .default(0.8)
      .describe(
        'How confident are you this is accurate? 1.0 = user explicitly stated'
      ),
  }),

  execute: async ({
    category,
    content,
    confidence = 0.8,
  }: {
    category: MemoryCategory;
    content: string;
    confidence?: number;
  }): Promise<string> => {
    try {
      memoryLogger.info(`[remember_fact] Storing: "${content}"`, {
        category,
        confidence,
      });

      // REQ-013: Check for similar memories using semantic similarity (Hebbian Reinforcement)
      // Threshold lowered from 0.85 to 0.80 to catch more near-duplicates
      const duplicates = await findSimilarMemories(content, 0.80);

      if (duplicates.length > 0) {
        const existing = duplicates[0];
        memoryLogger.info('[remember_fact] Similar memory found, reinforcing:', existing);

        // REQ-013: Hebbian Reinforcement - strengthen existing memory instead of rejecting
        const oldConfidence = existing.confidence;
        const newConfidence = Math.min(1.0, oldConfidence + 0.05); // Cap at 1.0

        // Get the existing memory to access importance field
        const existingMemory = await getMemoryById(existing.id);

        if (!existingMemory) {
          memoryLogger.warn('[remember_fact] Memory not found during reinforcement:', existing.id);
          // Fall through to create new memory if existing one disappeared
        } else {
          const oldImportance = existingMemory.importance;
          const newImportance = Math.max(oldImportance, 0.8); // Use higher of existing vs default (0.8)

          // Update existing memory with reinforced values
          const { error } = await supabase
            .from('memory_entries')
            .update({
              confidence: newConfidence,
              importance: newImportance,
              access_count: (existingMemory.access_count || 0) + 1,
              last_accessed: new Date().toISOString(),
              last_mentioned: new Date().toISOString(),
            })
            .eq('id', existing.id);

          if (error) {
            memoryLogger.error('[remember_fact] Reinforcement update failed:', error);
            throw new Error(`Failed to reinforce memory: ${error.message}`);
          }

          memoryLogger.info('[remember_fact] Memory reinforced:', {
            id: existing.id,
            oldConfidence,
            newConfidence,
            oldImportance,
            newImportance,
          });

          return `Reinforced existing memory: "${existing.content}" (confidence: ${oldConfidence.toFixed(2)} → ${newConfidence.toFixed(2)}, importance: ${oldImportance.toFixed(2)} → ${newImportance.toFixed(2)})`;
        }
      }

      // Generate embedding for the new content
      const embedding = await generateEmbedding(content);
      const contentHash = generateContentHash(content);

      // Create new memory entry
      const memory = await createMemory({
        category,
        subcategory: null,
        content,
        summary: null,
        confidence,
        source_type: 'agent_tool',
        content_hash: contentHash,
        embedding,
        relevance_score: 1.0,
        source_chat_ids: [],
        source_project_ids: [],
        source_message_count: 1,
        time_period: 'current',
      });

      if (!memory) {
        throw new Error('Failed to create memory entry');
      }

      memoryLogger.info('[remember_fact] Memory created:', memory.id);
      return `Remembered: "${content}" in ${category} (id: ${memory.id})`;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      memoryLogger.error('[remember_fact] Failed:', error);
      return `Memory operation failed: ${errorMessage}. You can try again or suggest the user visit their Memory settings at /memory.`;
    }
  },
};

// ============================================================================
// Update Memory Tool
// ============================================================================

/**
 * update_memory - Update an existing memory with corrected content
 *
 * Requires user confirmation (destructive operation - modifies existing data)
 * IMPORTANT: Agent must first use search_memory to get the memory ID
 */
export const updateMemoryTool = {
  name: 'update_memory',

  description: `Update an existing memory when the user provides a correction.
IMPORTANT: First use search_memory to find the memory ID.
User approval is required before execution (confirmation dialog shown).
Use when: User says "Actually, I...", "That's not right, I...", or provides corrected information.
Cannot modify manual entries - those must be edited by the user directly.`,

  parameters: z.object({
    memoryId: z
      .string()
      .uuid()
      .describe('ID of the memory to update (from search_memory results)'),
    newContent: z
      .string()
      .min(10)
      .max(500)
      .describe('The corrected content for this memory'),
    reason: z
      .string()
      .min(5)
      .max(200)
      .describe('Why this update is being made (e.g., "User corrected their location")'),
  }),

  // This will be called AFTER user approves in confirmation dialog
  execute: async ({
    memoryId,
    newContent,
    reason,
  }: {
    memoryId: string;
    newContent: string;
    reason: string;
  }): Promise<string> => {
    try {
      memoryLogger.info(`[update_memory] Updating memory: ${memoryId}`, {
        newContent,
        reason,
      });

      // Fetch existing memory
      const existing = await getMemoryById(memoryId);

      if (!existing) {
        memoryLogger.warn('[update_memory] Memory not found:', memoryId);
        return `Memory not found with ID: ${memoryId}. Use search_memory to find the correct ID first.`;
      }

      // Check if this is a manual entry (protected)
      if (existing.source_type === 'manual') {
        memoryLogger.warn('[update_memory] Attempted to modify manual entry:', memoryId);
        return `Cannot modify manual memory entries. The user set this directly in their profile. They should update it via the Memory settings at /memory.`;
      }

      const oldContent = existing.content;

      // Update the memory
      await updateMemoryEntry(memoryId, {
        content: newContent,
        confidence: 1.0, // User correction = high confidence
        updated_reason: reason,
      });

      memoryLogger.info('[update_memory] Memory updated successfully:', {
        memoryId,
        oldContent,
        newContent,
      });

      return `Memory updated successfully.\n\nOld: "${oldContent}"\nNew: "${newContent}"\n\nReason: ${reason}`;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      memoryLogger.error('[update_memory] Failed:', error);
      return `Memory update failed: ${errorMessage}. You can try again or suggest the user visit their Memory settings at /memory.`;
    }
  },

  // Metadata for confirmation dialog - shows diff preview
  confirmationMetadata: {
    type: 'memory_update' as const,
    getPreviewData: async (params: {
      memoryId: string;
      newContent: string;
      reason: string;
    }) => {
      const existing = await getMemoryById(params.memoryId);
      return {
        oldContent: existing?.content || 'Memory not found',
        newContent: params.newContent,
        category: existing?.category || 'unknown',
        reason: params.reason,
        isManualEntry: existing?.source_type === 'manual',
      };
    },
  },
};

// ============================================================================
// Forget Memory Tool
// ============================================================================

/**
 * forget_memory - Soft delete a memory that is no longer accurate
 *
 * Requires user confirmation (destructive operation)
 * IMPORTANT: Agent must first use search_memory to get the memory ID
 */
export const forgetMemoryTool = {
  name: 'forget_memory',

  description: `Remove a memory that is no longer accurate or relevant.
IMPORTANT: First use search_memory to find the memory ID.
User approval is required before execution (confirmation dialog shown).
Use when: User says "That's outdated", "I don't do that anymore", "Forget that", "That's no longer true".
Cannot delete manual entries - those must be removed by the user directly.
This performs a soft delete (data preserved for recovery if needed).`,

  parameters: z.object({
    memoryId: z
      .string()
      .uuid()
      .describe('ID of the memory to forget (from search_memory results)'),
    reason: z
      .string()
      .min(5)
      .max(200)
      .describe('Why this memory should be forgotten (e.g., "User said this is outdated")'),
  }),

  execute: async ({
    memoryId,
    reason,
  }: {
    memoryId: string;
    reason: string;
  }): Promise<string> => {
    try {
      memoryLogger.info(`[forget_memory] Forgetting memory: ${memoryId}`, {
        reason,
      });

      // Fetch existing memory
      const existing = await getMemoryById(memoryId);

      if (!existing) {
        memoryLogger.warn('[forget_memory] Memory not found:', memoryId);
        return `Memory not found with ID: ${memoryId}. Use search_memory to find the correct ID first.`;
      }

      // Check if this is a manual entry (protected)
      if (existing.source_type === 'manual') {
        memoryLogger.warn('[forget_memory] Attempted to delete manual entry:', memoryId);
        return `Cannot delete manual memory entries. The user set this directly in their profile. They should remove it via the Memory settings at /memory.`;
      }

      const deletedContent = existing.content;
      const deletedCategory = existing.category;

      // Soft delete the memory
      const success = await softDeleteMemory(memoryId, reason);

      if (!success) {
        throw new Error('Soft delete operation failed');
      }

      memoryLogger.info('[forget_memory] Memory forgotten successfully:', {
        memoryId,
        content: deletedContent,
        reason,
      });

      return `Memory forgotten: "${deletedContent}" (from ${deletedCategory})\n\nReason: ${reason}`;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      memoryLogger.error('[forget_memory] Failed:', error);
      return `Memory deletion failed: ${errorMessage}. You can try again or suggest the user visit their Memory settings at /memory.`;
    }
  },

  // Metadata for confirmation dialog - shows destructive warning
  confirmationMetadata: {
    type: 'memory_delete' as const,
    getPreviewData: async (params: { memoryId: string; reason: string }) => {
      const existing = await getMemoryById(params.memoryId);
      return {
        content: existing?.content || 'Memory not found',
        category: existing?.category || 'unknown',
        reason: params.reason,
        isManualEntry: existing?.source_type === 'manual',
        confidence: existing?.confidence || 0,
        lastUpdated: existing?.last_updated || 'Unknown',
      };
    },
  },
};

// ============================================================================
// M3.13: THINKING PARTNER TOOLS
// ============================================================================

/**
 * record_question - Record a question the user is exploring
 *
 * Auto-approved (additive operation, easily undone)
 */
export const recordQuestionTool = {
  name: 'record_question',

  description: `Record a question the user is exploring.
Use when the user asks a significant question worth remembering.
This helps track the user's thinking process and questions they're working through.
Examples: "How do I scale this architecture?", "What's the best way to handle this edge case?"`,

  parameters: z.object({
    question: z
      .string()
      .min(10)
      .max(500)
      .describe('The question being asked'),
    context: z
      .string()
      .max(500)
      .optional()
      .describe('Why this question is being asked'),
    tags: z
      .array(z.string())
      .optional()
      .describe('Tags to categorize this question'),
    thread_id: z
      .string()
      .uuid()
      .optional()
      .describe('Link to existing thought thread'),
  }),

  execute: async ({
    question,
    context,
    tags,
    thread_id,
  }: {
    question: string;
    context?: string;
    tags?: string[];
    thread_id?: string;
  }): Promise<string> => {
    try {
      memoryLogger.info(`[record_question] Storing question: "${question}"`, {
        hasContext: !!context,
        tags,
        thread_id,
      });

      // Check for similar questions using semantic similarity
      const duplicates = await findSimilarMemories(question, 0.80);

      if (duplicates.length > 0) {
        const existing = duplicates[0];
        memoryLogger.info('[record_question] Similar question found, reinforcing:', existing);

        // Reinforce existing question instead of creating duplicate
        const oldConfidence = existing.confidence;
        const newConfidence = Math.min(1.0, oldConfidence + 0.05);

        const existingMemory = await getMemoryById(existing.id);

        if (existingMemory) {
          const oldImportance = existingMemory.importance;
          const newImportance = Math.max(oldImportance, 0.8);

          const { error } = await supabase
            .from('memory_entries')
            .update({
              confidence: newConfidence,
              importance: newImportance,
              access_count: (existingMemory.access_count || 0) + 1,
              last_accessed: new Date().toISOString(),
              last_mentioned: new Date().toISOString(),
            })
            .eq('id', existing.id);

          if (error) {
            memoryLogger.error('[record_question] Reinforcement update failed:', error);
            throw new Error(`Failed to reinforce question: ${error.message}`);
          }

          memoryLogger.info('[record_question] Question reinforced:', {
            id: existing.id,
            oldConfidence,
            newConfidence,
          });

          return `Reinforced existing question: "${existing.content}" (confidence: ${oldConfidence.toFixed(2)} → ${newConfidence.toFixed(2)})`;
        }
      }

      // Generate embedding for the question
      const embedding = await generateEmbedding(question);
      const contentHash = generateContentHash(question);

      // Create new memory entry with memory_type='question'
      const memory = await createMemory({
        category: 'other_instructions',
        subcategory: null,
        content: question,
        summary: context || null,
        confidence: 0.8,
        source_type: 'agent_tool',
        content_hash: contentHash,
        embedding,
        relevance_score: 1.0,
        source_chat_ids: [],
        source_project_ids: [],
        source_message_count: 1,
        time_period: 'current',
        memory_type: 'question',
        tags: tags || [],
        thread_id: thread_id || undefined,
      });

      if (!memory) {
        throw new Error('Failed to create question memory');
      }

      memoryLogger.info('[record_question] Question recorded:', memory.id);
      return `Recorded question: "${question}" (id: ${memory.id})`;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      memoryLogger.error('[record_question] Failed:', error);
      return `Question recording failed: ${errorMessage}. You can try again or suggest the user visit their Memory settings at /memory.`;
    }
  },
};

/**
 * record_decision - Record a decision made by the user
 *
 * Auto-approved (additive operation, easily undone)
 */
export const recordDecisionTool = {
  name: 'record_decision',

  description: `Record a decision made by the user.
Use when the user decides on an approach, makes a choice, or commits to a direction.
This helps track important decisions and the reasoning behind them.
Examples: "I'll use PostgreSQL for this project", "We'll prioritize performance over features"`,

  parameters: z.object({
    decision: z
      .string()
      .min(10)
      .max(500)
      .describe('The decision made'),
    alternatives: z
      .array(z.string())
      .optional()
      .describe('Other options that were considered'),
    rationale: z
      .string()
      .max(500)
      .optional()
      .describe('Why this decision was made'),
    tags: z
      .array(z.string())
      .optional()
      .describe('Tags to categorize this decision'),
    thread_id: z
      .string()
      .uuid()
      .optional()
      .describe('Link to existing thought thread'),
  }),

  execute: async ({
    decision,
    alternatives,
    rationale,
    tags,
    thread_id,
  }: {
    decision: string;
    alternatives?: string[];
    rationale?: string;
    tags?: string[];
    thread_id?: string;
  }): Promise<string> => {
    try {
      memoryLogger.info(`[record_decision] Storing decision: "${decision}"`, {
        hasAlternatives: !!alternatives?.length,
        hasRationale: !!rationale,
        tags,
        thread_id,
      });

      // Check for similar decisions using semantic similarity
      const duplicates = await findSimilarMemories(decision, 0.80);

      if (duplicates.length > 0) {
        const existing = duplicates[0];
        memoryLogger.info('[record_decision] Similar decision found, reinforcing:', existing);

        const oldConfidence = existing.confidence;
        const newConfidence = Math.min(1.0, oldConfidence + 0.05);

        const existingMemory = await getMemoryById(existing.id);

        if (existingMemory) {
          const oldImportance = existingMemory.importance;
          const newImportance = Math.max(oldImportance, 0.9); // Decisions get high importance

          const { error } = await supabase
            .from('memory_entries')
            .update({
              confidence: newConfidence,
              importance: newImportance,
              access_count: (existingMemory.access_count || 0) + 1,
              last_accessed: new Date().toISOString(),
              last_mentioned: new Date().toISOString(),
            })
            .eq('id', existing.id);

          if (error) {
            memoryLogger.error('[record_decision] Reinforcement update failed:', error);
            throw new Error(`Failed to reinforce decision: ${error.message}`);
          }

          memoryLogger.info('[record_decision] Decision reinforced:', {
            id: existing.id,
            oldConfidence,
            newConfidence,
          });

          return `Reinforced existing decision: "${existing.content}" (confidence: ${oldConfidence.toFixed(2)} → ${newConfidence.toFixed(2)})`;
        }
      }

      // Generate embedding for the decision
      const embedding = await generateEmbedding(decision);
      const contentHash = generateContentHash(decision);

      // Create new memory entry with memory_type='decision'
      const memory = await createMemory({
        category: 'other_instructions',
        subcategory: null,
        content: decision,
        summary: rationale || null,
        confidence: 0.9, // Decisions have high confidence
        source_type: 'agent_tool',
        content_hash: contentHash,
        embedding,
        relevance_score: 1.0,
        source_chat_ids: [],
        source_project_ids: [],
        source_message_count: 1,
        time_period: 'current',
        memory_type: 'decision',
        tags: tags || [],
        thread_id: thread_id || undefined,
      });

      if (!memory) {
        throw new Error('Failed to create decision memory');
      }

      memoryLogger.info('[record_decision] Decision recorded:', memory.id);
      let response = `Recorded decision: "${decision}" (id: ${memory.id})`;
      if (alternatives && alternatives.length > 0) {
        response += `\nAlternatives considered: ${alternatives.join(', ')}`;
      }
      return response;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      memoryLogger.error('[record_decision] Failed:', error);
      return `Decision recording failed: ${errorMessage}. You can try again or suggest the user visit their Memory settings at /memory.`;
    }
  },
};

/**
 * record_insight - Record an insight or pattern discovered
 *
 * Auto-approved (additive operation, easily undone)
 */
export const recordInsightTool = {
  name: 'record_insight',

  description: `Record an insight or pattern discovered.
Use when recognizing a recurring theme, learning, or realization.
This helps track important learnings and patterns the user has discovered.
Examples: "Authentication issues often come from token expiry", "Users prefer simpler UIs"`,

  parameters: z.object({
    insight: z
      .string()
      .min(10)
      .max(500)
      .describe('The insight or pattern discovered'),
    evidence: z
      .array(z.string())
      .optional()
      .describe('Examples or data supporting this insight'),
    tags: z
      .array(z.string())
      .optional()
      .describe('Tags to categorize this insight'),
    thread_id: z
      .string()
      .uuid()
      .optional()
      .describe('Link to existing thought thread'),
  }),

  execute: async ({
    insight,
    evidence,
    tags,
    thread_id,
  }: {
    insight: string;
    evidence?: string[];
    tags?: string[];
    thread_id?: string;
  }): Promise<string> => {
    try {
      memoryLogger.info(`[record_insight] Storing insight: "${insight}"`, {
        hasEvidence: !!evidence?.length,
        tags,
        thread_id,
      });

      // Check for similar insights using semantic similarity
      const duplicates = await findSimilarMemories(insight, 0.80);

      if (duplicates.length > 0) {
        const existing = duplicates[0];
        memoryLogger.info('[record_insight] Similar insight found, reinforcing:', existing);

        const oldConfidence = existing.confidence;
        const newConfidence = Math.min(1.0, oldConfidence + 0.05);

        const existingMemory = await getMemoryById(existing.id);

        if (existingMemory) {
          const oldImportance = existingMemory.importance;
          const newImportance = Math.max(oldImportance, 0.85); // Insights get high importance

          const { error } = await supabase
            .from('memory_entries')
            .update({
              confidence: newConfidence,
              importance: newImportance,
              access_count: (existingMemory.access_count || 0) + 1,
              last_accessed: new Date().toISOString(),
              last_mentioned: new Date().toISOString(),
            })
            .eq('id', existing.id);

          if (error) {
            memoryLogger.error('[record_insight] Reinforcement update failed:', error);
            throw new Error(`Failed to reinforce insight: ${error.message}`);
          }

          memoryLogger.info('[record_insight] Insight reinforced:', {
            id: existing.id,
            oldConfidence,
            newConfidence,
          });

          return `Reinforced existing insight: "${existing.content}" (confidence: ${oldConfidence.toFixed(2)} → ${newConfidence.toFixed(2)})`;
        }
      }

      // Generate embedding for the insight
      const embedding = await generateEmbedding(insight);
      const contentHash = generateContentHash(insight);

      // Create new memory entry with memory_type='insight'
      const memory = await createMemory({
        category: 'other_instructions',
        subcategory: null,
        content: insight,
        summary: evidence ? `Evidence: ${evidence.join('; ')}` : null,
        confidence: 0.85, // Insights have high confidence
        source_type: 'agent_tool',
        content_hash: contentHash,
        embedding,
        relevance_score: 1.0,
        source_chat_ids: [],
        source_project_ids: [],
        source_message_count: 1,
        time_period: 'current',
        memory_type: 'insight',
        tags: tags || [],
        thread_id: thread_id || undefined,
      });

      if (!memory) {
        throw new Error('Failed to create insight memory');
      }

      memoryLogger.info('[record_insight] Insight recorded:', memory.id);
      let response = `Recorded insight: "${insight}" (id: ${memory.id})`;
      if (evidence && evidence.length > 0) {
        response += `\nSupporting evidence: ${evidence.length} example(s)`;
      }
      return response;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      memoryLogger.error('[record_insight] Failed:', error);
      return `Insight recording failed: ${errorMessage}. You can try again or suggest the user visit their Memory settings at /memory.`;
    }
  },
};

// ============================================================================
// Tool Collection Export
// ============================================================================

/**
 * All memory tools for agent use
 */
export const memoryTools = {
  search_memory: searchMemoryTool,
  remember_fact: rememberFactTool,
  update_memory: updateMemoryTool,
  forget_memory: forgetMemoryTool,
  record_question: recordQuestionTool,
  record_decision: recordDecisionTool,
  record_insight: recordInsightTool,
};

/**
 * Memory tool names for configuration
 */
export const MEMORY_TOOL_NAMES = Object.keys(memoryTools);

/**
 * Get a memory tool by name
 */
export function getMemoryTool(name: string) {
  return memoryTools[name as keyof typeof memoryTools];
}

// ============================================================================
// M3.5-5: Error Handling Wrapper
// ============================================================================

type ToolDefinition = {
  name: string;
  description: string;
  parameters: z.ZodType<unknown>;
  execute: (params: unknown) => Promise<string>;
  confirmationMetadata?: unknown;
};

/**
 * Wrap a tool with comprehensive error handling
 * Ensures that tool failures never crash the chat and provide helpful feedback
 */
function wrapWithErrorHandling(tool: ToolDefinition): ToolDefinition {
  return {
    ...tool,
    execute: async (params: unknown) => {
      try {
        return await tool.execute(params);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        memoryLogger.error(`Memory tool '${tool.name}' failed:`, {
          error: errorMessage,
          params,
          stack: error instanceof Error ? error.stack : undefined,
        });

        return `Memory operation failed: ${errorMessage}. You can try again or suggest the user visit their Memory settings at /memory.`;
      }
    },
  };
}

/**
 * Apply error handling to all memory tools
 * Export safe versions that gracefully handle failures
 */
const safeMemoryTools = Object.fromEntries(
  Object.entries(memoryTools).map(([name, tool]) => [
    name,
    wrapWithErrorHandling(tool as ToolDefinition),
  ])
) as typeof memoryTools;

// Re-export the safe version for explicit use
// Note: Keep original memoryTools export for backward compatibility
export { safeMemoryTools };
