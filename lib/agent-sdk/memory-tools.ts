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
import { createMemory, getMemoryById, updateMemoryEntry, softDeleteMemory } from '@/lib/db/queries';
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

export type MemorySearchResult = {
  id: string;
  category: string;
  content: string;
  confidence: number;
  last_updated: string;
  similarity: number;
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
Returns up to 10 matching memories sorted by relevance.`,

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
  }),

  execute: async ({
    query,
    category,
    limit = 5,
  }: {
    query: string;
    category?: MemoryCategory;
    limit?: number;
  }): Promise<string> => {
    try {
      memoryLogger.info(`[search_memory] Searching for: "${query}"`, {
        category,
        limit,
      });

      // Generate embedding for semantic search
      const embedding = await generateEmbedding(query);

      // Call hybrid search RPC
      const { data: memories, error } = await supabase.rpc(
        'hybrid_memory_search',
        {
          query_embedding: embedding,
          query_text: query,
          match_count: limit,
          vector_weight: 0.7,
          text_weight: 0.3,
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

      // Check for duplicates using semantic similarity
      const duplicates = await findSimilarMemories(content, 0.85);

      if (duplicates.length > 0) {
        const existing = duplicates[0];
        memoryLogger.info('[remember_fact] Duplicate found:', existing);
        return `Similar memory already exists in ${existing.category}: "${existing.content}". Use update_memory if you need to modify it. (id: ${existing.id})`;
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
