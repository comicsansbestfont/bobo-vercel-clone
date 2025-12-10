/**
 * Search Coordinator
 *
 * Coordinates hybrid search operations for chat context.
 * M40-02: Extracted from route.ts lines 556-630, 176-229
 *
 * FIXED: N+1 query in getProjectNamesForSearchResults
 */

import {
  supabase,
  hybridSearch,
  searchProjectMessages,
  hybridMemorySearch,
  type SearchResult,
  type ProjectMessageSearchResult,
} from '@/lib/db';
import { generateEmbedding } from '@/lib/ai/embedding';
import { chatLogger } from '@/lib/logger';
import type { SearchCoordinatorResult, MemorySearchResult } from './types';

// ============================================================================
// TYPES
// ============================================================================

type FileWithProject = {
  id: string;
  projects?: { name?: string | null } | null;
};

type MessageWithProject = {
  id: string;
  chats?: { projects?: { name?: string | null } | null } | null;
};

// ============================================================================
// SEARCH COORDINATION
// ============================================================================

export interface PerformSearchesOptions {
  chatId: string;
  activeProjectId: string | null;
  userText: string;
}

/**
 * Perform parallel searches for chat context.
 * Runs intra-project and global hybrid search concurrently.
 */
export async function performSearches(
  options: PerformSearchesOptions
): Promise<SearchCoordinatorResult> {
  const { userText, activeProjectId, chatId: activeChatId } = options;
  // Generate embedding first (required for both searches)
  let queryEmbedding: number[] | null = null;

  if (userText) {
    try {
      queryEmbedding = await generateEmbedding(userText);
    } catch (err) {
      chatLogger.error('Failed to generate query embedding:', err);
    }
  }

  if (!queryEmbedding) {
    return {
      projectChatResults: [],
      searchResults: [],
      queryEmbedding: null,
      memoryResults: [],
    };
  }

  // Run all searches in parallel (including M3.14 memory search)
  const [projectSearchResult, globalSearchResult, memorySearchResult] = await Promise.all([
    // Intra-project search
    activeProjectId
      ? searchProjectMessages(
          activeProjectId,
          activeChatId,
          queryEmbedding,
          0.25,
          5
        ).catch((err) => {
          chatLogger.error('Intra-project search failed:', err);
          return [];
        })
      : Promise.resolve([]),

    // Global hybrid search
    hybridSearch(
      queryEmbedding,
      0.25,
      5,
      activeProjectId || '00000000-0000-0000-0000-000000000000'
    ).catch((err) => {
      chatLogger.error('Hybrid search failed:', err);
      return [];
    }),

    // M3.14: Semantic memory search for personalization
    hybridMemorySearch(
      queryEmbedding,
      userText,
      5 // Limit to 5 most relevant memories
    ).catch((err) => {
      chatLogger.error('Memory search failed (non-fatal):', err);
      return [] as MemorySearchResult[];
    }),
  ]);

  chatLogger.debug('Search coordinator results:', {
    projectMessages: projectSearchResult.length,
    globalResults: globalSearchResult.length,
    memoryResults: memorySearchResult.length,
  });

  return {
    projectChatResults: projectSearchResult,
    searchResults: globalSearchResult,
    queryEmbedding,
    memoryResults: memorySearchResult,
  };
}

// ============================================================================
// PROJECT NAME LOOKUP (FIXED N+1)
// ============================================================================

/**
 * Get project names for search results.
 *
 * FIXED: Previously made N queries (one per result).
 * Now uses batched queries - 2 queries max regardless of result count.
 */
export async function getProjectNamesForSearchResults(
  searchResults: SearchResult[]
): Promise<Map<string, string>> {
  const projectNamesMap = new Map<string, string>();

  if (searchResults.length === 0) return projectNamesMap;

  const allIds = searchResults.map((r) => r.id);

  // Batch query 1: Check which IDs are files and get their project names
  const { data: fileRecords } = await supabase
    .from('files')
    .select('id, projects(name)')
    .in('id', allIds);

  const fileIds = new Set<string>();

  // Process file results
  (fileRecords as FileWithProject[] | null)?.forEach((file) => {
    fileIds.add(file.id);
    if (file.projects?.name) {
      projectNamesMap.set(file.id, file.projects.name);
    }
  });

  // Determine which IDs are messages (not in files)
  const messageIds = allIds.filter((id) => !fileIds.has(id));

  // Batch query 2: Get project names for messages via chats
  if (messageIds.length > 0) {
    const { data: messageRecords } = await supabase
      .from('messages')
      .select('id, chats(project_id, projects(name))')
      .in('id', messageIds);

    (messageRecords as MessageWithProject[] | null)?.forEach((message) => {
      if (message.chats?.projects?.name) {
        projectNamesMap.set(message.id, message.chats.projects.name);
      }
    });
  }

  chatLogger.debug('Project names lookup completed:', {
    totalResults: searchResults.length,
    filesFound: fileIds.size,
    messagesFound: messageIds.length,
    namesResolved: projectNamesMap.size,
  });

  return projectNamesMap;
}

// ============================================================================
// CONTEXT INJECTION HELPERS
// ============================================================================

/**
 * Build the intra-project chat context string for system prompt
 */
export function buildProjectChatContext(
  projectChatResults: ProjectMessageSearchResult[]
): string {
  if (projectChatResults.length === 0) return '';

  const snippets = projectChatResults
    .map((r) => `[${r.chat_title}]: ${r.content}`)
    .join('\n');

  return `
### RELATED CONVERSATIONS IN THIS PROJECT
The following are relevant excerpts from your OTHER conversations in this project.
<project_conversations>
${snippets}
</project_conversations>
INSTRUCTION: Use these to maintain continuity across conversations in this project.
`;
}

/**
 * Build the global search context string for system prompt
 */
export function buildGlobalSearchContext(searchResults: SearchResult[]): string {
  const globalSnippets = searchResults
    .filter((r) => r.source_type === 'global')
    .map((r) => `- ${r.content}`)
    .join('\n');

  if (!globalSnippets) return '';

  return `
### RELEVANT MEMORY & ASSOCIATIONS (Inspiration)
The following information is from your PAST WORK in other projects.
<global_context>
${globalSnippets}
</global_context>
INSTRUCTION: These are for INSPIRATION and PATTERN MATCHING only.
- If the user asks for a strategy, look here for what worked before.
- If the user is writing content, look here for connecting ideas.
- WARNING: Do NOT use names, specific IDs, or confidential data points from this section unless explicitly asked to cross-reference.
`;
}

/**
 * M3.14: Build the semantic memory context string for system prompt
 * Adds personalization from user memories (decisions, insights, preferences)
 */
export function buildSemanticMemoryContext(memoryResults: MemorySearchResult[]): string {
  if (memoryResults.length === 0) return '';

  // Format memories with confidence scores for transparency
  const memorySnippets = memoryResults
    .map((m, i) => {
      const confidenceLabel = m.confidence >= 0.9 ? '★' : m.confidence >= 0.7 ? '●' : '○';
      return `${i + 1}. [${confidenceLabel}] ${m.content}`;
    })
    .join('\n');

  return `
### PERSONALIZED CONTEXT (From Your Memory)
The following are relevant facts, decisions, and insights I remember about you and our past conversations.
<user_memory>
${memorySnippets}
</user_memory>
INSTRUCTION: Use this context to personalize my responses.
- These represent what I know about your preferences, past decisions, and insights.
- Higher confidence (★) items are well-established; lower (○) items are less certain.
- If any seem outdated or incorrect, feel free to correct me and I'll update my memory.
`;
}
