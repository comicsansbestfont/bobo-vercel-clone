/**
 * M3.9: Claude Advisory Tools
 *
 * Tool definitions and executors for searching and reading advisory files.
 * Uses Claude's native tool_use format.
 */

import type { Tool } from '@anthropic-ai/sdk/resources/messages';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync, readdirSync, statSync } from 'fs';
import { generateEmbedding } from '@/lib/ai/embedding';
import { supabase } from '@/lib/db/client';
import { ADVISORY_PROJECT_ID } from '@/lib/db/types';
import { chatLogger } from '@/lib/logger';

// ============================================================================
// Tool Definitions
// ============================================================================

/**
 * Claude tool definitions for advisory file access
 */
export const advisoryTools: Tool[] = [
  {
    name: 'search_advisory',
    description: `Search advisory files including deal master docs, client profiles, and meeting notes.

USE WHEN:
- User asks about a specific deal or client (e.g., "Brief me on MyTab", "What's the status of SwiftCheckin?")
- User wants a briefing or summary of advisory work
- User asks about valuations, meetings, or communications for a deal/client

RETURNS: Relevant file excerpts with similarity scores. Use the results to answer the user's question.

EXAMPLES:
- "Brief me on MyTab" → search_advisory(query: "MyTab overview")
- "What's SwiftCheckin's valuation?" → search_advisory(query: "SwiftCheckin valuation", entity_name: "SwiftCheckin")
- "Show me ControlShiftAI research" → search_advisory(query: "ControlShiftAI research", entity_type: "deal")`,
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Search query - company name, topic, or natural language question',
        },
        entity_type: {
          type: 'string',
          enum: ['deal', 'client', 'all'],
          description: 'Filter by entity type: deal, client, or all (default: all)',
        },
        entity_name: {
          type: 'string',
          description: 'Filter by specific company/entity name (e.g., "MyTab", "SwiftCheckin")',
        },
        limit: {
          type: 'number',
          description: 'Max results to return (1-20, default: 5)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'read_advisory_file',
    description: `Read the full contents of a specific advisory file.

USE WHEN:
- You found a relevant file via search_advisory and need full details
- User explicitly asks to see a specific document
- You need more context than the search excerpt provided

RETURNS: Full file contents (truncated at 8000 chars if very large).

EXAMPLES:
- After search returns "advisory/deals/MyTab/master-doc-mytab.md" → read_advisory_file(filename: "advisory/deals/MyTab/master-doc-mytab.md")`,
    input_schema: {
      type: 'object' as const,
      properties: {
        filename: {
          type: 'string',
          description: 'The filename path from search results (e.g., "advisory/deals/MyTab/master-doc-mytab.md")',
        },
      },
      required: ['filename'],
    },
  },
  {
    name: 'list_advisory_folder',
    description: `List files and folders within an advisory entity's directory.

USE WHEN:
- User wants to explore what documents are available for a deal/client
- You need to find specific file types (meetings, valuations, communications)
- Discovering folder structure before reading specific files

RETURNS: List of files and subdirectories.

EXAMPLES:
- "What files do we have for MyTab?" → list_advisory_folder(entity_type: "deal", entity_name: "MyTab")
- "Show me SwiftCheckin's meetings" → list_advisory_folder(entity_type: "client", entity_name: "SwiftCheckin", subfolder: "Meetings")`,
    input_schema: {
      type: 'object' as const,
      properties: {
        entity_type: {
          type: 'string',
          enum: ['deal', 'client'],
          description: 'Type of entity: deal or client',
        },
        entity_name: {
          type: 'string',
          description: 'Entity name (e.g., "MyTab", "SwiftCheckin")',
        },
        subfolder: {
          type: 'string',
          description: 'Optional subfolder to list (e.g., "Meetings", "Valuation", "Communications")',
        },
      },
      required: ['entity_type', 'entity_name'],
    },
  },
];

// ============================================================================
// Tool Execution
// ============================================================================

/**
 * Execute an advisory tool and return JSON result
 */
export async function executeAdvisoryTool(
  name: string,
  input: Record<string, unknown>
): Promise<string> {
  chatLogger.info(`[Advisory Tool] Executing ${name}`, input);

  try {
    switch (name) {
      case 'search_advisory':
        return await searchAdvisory(input);
      case 'read_advisory_file':
        return await readAdvisoryFile(input);
      case 'list_advisory_folder':
        return await listAdvisoryFolder(input);
      default:
        return JSON.stringify({ success: false, error: `Unknown tool: ${name}` });
    }
  } catch (error) {
    chatLogger.error(`[Advisory Tool] ${name} failed:`, error);
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Tool execution failed',
    });
  }
}

// ============================================================================
// Tool Implementations
// ============================================================================

type SearchAdvisoryInput = {
  query: string;
  entity_type?: 'deal' | 'client' | 'all';
  entity_name?: string;
  limit?: number;
};

async function searchAdvisory(input: Record<string, unknown>): Promise<string> {
  const {
    query,
    entity_type = 'all',
    entity_name,
    limit = 5,
  } = input as SearchAdvisoryInput;

  chatLogger.info(`[search_advisory] Query: "${query}"`, { entity_type, entity_name, limit });

  // Generate embedding for semantic search
  const embedding = await generateEmbedding(query);

  // Call advisory search RPC
  const { data: results, error } = await supabase.rpc('search_advisory_files', {
    query_embedding: embedding,
    query_text: query,
    p_project_id: ADVISORY_PROJECT_ID,
    entity_type_filter: entity_type === 'all' ? undefined : entity_type,
    entity_name_filter: entity_name || undefined,
    match_count: limit,
    vector_weight: 0.7,
    text_weight: 0.3,
    min_similarity: 0.25,
  });

  if (error) {
    chatLogger.error('[search_advisory] RPC error:', error);
    return JSON.stringify({ success: false, error: error.message });
  }

  if (!results || results.length === 0) {
    return JSON.stringify({
      success: true,
      message: 'No matching advisory files found. Try different keywords or check the entity name.',
      results: [],
    });
  }

  // Format results with more content for LLM consumption
  type SearchResult = {
    id: string;
    filename: string;
    content_text: string;
    entity_type: string;
    entity_name: string;
    combined_score: number;
  };

  const formatted = (results as SearchResult[]).map((r, i) => ({
    index: i + 1,
    entity_name: r.entity_name,
    entity_type: r.entity_type,
    filename: r.filename,
    relevance_score: Math.round(r.combined_score * 100) / 100,
    // Include more content (up to 1500 chars) for better LLM context
    content_excerpt: r.content_text.length > 1500
      ? r.content_text.substring(0, 1500) + '...'
      : r.content_text,
  }));

  chatLogger.info(`[search_advisory] Found ${results.length} files`);

  return JSON.stringify({
    success: true,
    message: `Found ${results.length} advisory file(s) matching "${query}"`,
    results: formatted,
  });
}

type ReadAdvisoryFileInput = {
  filename: string;
};

async function readAdvisoryFile(input: Record<string, unknown>): Promise<string> {
  const { filename } = input as ReadAdvisoryFileInput;

  chatLogger.info(`[read_advisory_file] Reading: ${filename}`);

  // Normalize path
  const normalizedPath = filename.startsWith('advisory/')
    ? filename
    : `advisory/${filename}`;

  // Security: Prevent path traversal
  if (normalizedPath.includes('..')) {
    return JSON.stringify({ success: false, error: 'Invalid file path' });
  }

  const fullPath = join(process.cwd(), normalizedPath);

  // Check file exists
  if (!existsSync(fullPath)) {
    return JSON.stringify({
      success: false,
      error: `File not found: ${normalizedPath}`,
    });
  }

  // Read file contents
  const content = await readFile(fullPath, 'utf-8');

  // Truncate very large files
  const maxLength = 8000;
  const truncated = content.length > maxLength;
  const finalContent = truncated
    ? content.substring(0, maxLength) + '\n\n... [Content truncated - file is ' + content.length + ' characters]'
    : content;

  chatLogger.info(`[read_advisory_file] Read ${content.length} chars (truncated: ${truncated})`);

  return JSON.stringify({
    success: true,
    filename: normalizedPath,
    content: finalContent,
    truncated,
    total_length: content.length,
  });
}

type ListAdvisoryFolderInput = {
  entity_type: 'deal' | 'client';
  entity_name: string;
  subfolder?: string;
};

async function listAdvisoryFolder(input: Record<string, unknown>): Promise<string> {
  const { entity_type, entity_name, subfolder } = input as ListAdvisoryFolderInput;

  // Map entity type to folder
  const typeFolder = entity_type === 'deal' ? 'deals' : 'clients';
  let targetPath = join(process.cwd(), 'advisory', typeFolder, entity_name);

  if (subfolder) {
    targetPath = join(targetPath, subfolder);
  }

  const displayPath = `advisory/${typeFolder}/${entity_name}${subfolder ? '/' + subfolder : ''}`;
  chatLogger.info(`[list_advisory_folder] Listing: ${displayPath}`);

  // Check directory exists
  if (!existsSync(targetPath)) {
    return JSON.stringify({
      success: false,
      error: `Folder not found: ${displayPath}. Check if the entity name is correct.`,
    });
  }

  // Read directory contents
  const entries = readdirSync(targetPath);

  type FileEntry = {
    name: string;
    path: string;
    type: 'file' | 'directory';
    size?: number;
  };

  const files: FileEntry[] = entries
    .filter((entry) => !entry.startsWith('.'))
    .map((entry) => {
      const entryPath = join(targetPath, entry);
      const stat = statSync(entryPath);
      const relativePath = subfolder
        ? `${displayPath}/${entry}`
        : `${displayPath}/${entry}`;

      return {
        name: entry,
        path: relativePath,
        type: stat.isDirectory() ? 'directory' as const : 'file' as const,
        size: stat.isFile() ? stat.size : undefined,
      };
    })
    .sort((a, b) => {
      // Directories first, then alphabetical
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

  chatLogger.info(`[list_advisory_folder] Found ${files.length} entries`);

  return JSON.stringify({
    success: true,
    path: displayPath,
    entity_type,
    entity_name,
    files,
    summary: {
      directories: files.filter((f) => f.type === 'directory').length,
      files: files.filter((f) => f.type === 'file').length,
    },
  });
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Get tool names for configuration
 */
export const ADVISORY_TOOL_NAMES = advisoryTools.map((t) => t.name);

/**
 * Check if a tool name is an advisory tool
 */
export function isAdvisoryTool(name: string): boolean {
  return ADVISORY_TOOL_NAMES.includes(name);
}
