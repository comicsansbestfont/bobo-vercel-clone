/**
 * M3.9: Claude Advisory Tools
 *
 * Tool definitions and executors for searching and reading advisory files.
 * Uses Claude's native tool_use format.
 *
 * M3.10: Added fetch_url tool for external weblink access.
 */

import type { Tool } from '@anthropic-ai/sdk/resources/messages';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync, readdirSync, statSync } from 'fs';
import { generateEmbedding } from '@/lib/ai/embedding';
import { supabase } from '@/lib/db/client';
import { ADVISORY_PROJECT_ID } from '@/lib/db/types';
import { chatLogger } from '@/lib/logger';
import { parseHTML } from 'linkedom';
import { Readability } from '@mozilla/readability';

// ============================================================================
// Tool Definitions
// ============================================================================

/**
 * Claude tool definitions for advisory file access
 */
export const advisoryTools: Tool[] = [
  {
    name: 'search_advisory',
    description: `SEMANTIC search of advisory files (conceptual/topic-based queries).

BEST FOR:
- Briefings and summaries ("Brief me on MyTab", "What's the status?")
- Conceptual questions ("What are the key risks?", "What's the valuation thesis?")
- Finding relevant files when you don't know exact text to search for

NOT FOR:
- Finding specific text (use grep_advisory instead)
- Finding files by name pattern (use glob_advisory instead)
- Chronological queries like "last email" (use grep_advisory + read_advisory_file)

RETURNS: Relevant file excerpts ranked by semantic similarity.

EXAMPLES:
- "Brief me on MyTab" → search_advisory(query: "MyTab overview", entity_name: "MyTab")
- "What's the valuation?" → search_advisory(query: "valuation analysis", entity_name: "SwiftCheckin")`,
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Search query - company name, topic, or natural language question',
        },
        entity_type: {
          type: 'string',
          enum: ['deal', 'client', 'identity', 'all'],
          description: 'Filter by entity type: deal, client, identity, or all (default: all)',
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
    description: `Read FULL contents of a specific advisory file.

USE WHEN:
- You found a file via search/grep/glob and need complete details
- User asks to see a specific document
- You need the master doc to understand folder structure (read it first!)
- Following up on a search result to get full context

WORKFLOW TIP: For complex queries like "last email to Mikaela":
1. read_advisory_file(master doc) → find Communications Log
2. grep_advisory(pattern: "Mikaela") → find email files
3. read_advisory_file(email file) → get full content

RETURNS: Full file contents (max 8000 chars).

EXAMPLES:
- read_advisory_file(filename: "advisory/deals/MyTab/master-doc-mytab.md")
- read_advisory_file(filename: "advisory/deals/MyTab/Communications/email-2025-12-01.md")`,
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
    description: `List files and subdirectories in an entity's folder.

USE WHEN:
- User asks what files/folders exist for a deal or client
- You need to discover folder structure before drilling down
- Looking for specific subfolders (Meetings, Communications, Valuation)

COMMON SUBFOLDERS:
- Communications/ - Emails and messages
- Meetings/ - Meeting transcripts and notes
- Valuation/ - Financial analysis
- Research/ - Background research

RETURNS: List of files and subdirectories with sizes.

EXAMPLES:
- list_advisory_folder(entity_type: "deal", entity_name: "MyTab")
- list_advisory_folder(entity_type: "deal", entity_name: "MyTab", subfolder: "Communications")`,
    input_schema: {
      type: 'object' as const,
      properties: {
        entity_type: {
          type: 'string',
          enum: ['deal', 'client', 'identity'],
          description: 'Type of entity: deal, client, or identity',
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
  {
    name: 'glob_advisory',
    description: `Find files by FILENAME pattern (like Unix find/glob).

USE WHEN:
- User asks to find files by name pattern
- You know part of the filename (date, type, person name in filename)
- Looking for specific file types across folders

PATTERN SYNTAX:
- * matches any characters (e.g., "*email*" matches "email-to-mikaela.md")
- Case-insensitive
- Searches filenames only (use grep_advisory for content search)

RETURNS: Matching file paths with entity info.

EXAMPLES:
- "Find email files for MyTab" → glob_advisory(pattern: "*email*", entity_name: "MyTab")
- "Find December files" → glob_advisory(pattern: "*2025-12*")
- "Find Mikaela files" → glob_advisory(pattern: "*mikaela*", entity_name: "MyTab")`,
    input_schema: {
      type: 'object' as const,
      properties: {
        pattern: {
          type: 'string',
          description: 'Glob pattern to match file names (e.g., "*email*", "*2025-12*", "*valuation*")',
        },
        entity_type: {
          type: 'string',
          enum: ['deal', 'client', 'identity', 'all'],
          description: 'Filter by entity type (default: all)',
        },
        entity_name: {
          type: 'string',
          description: 'Filter to specific entity (e.g., "MyTab")',
        },
      },
      required: ['pattern'],
    },
  },
  {
    name: 'grep_advisory',
    description: `Search file CONTENTS for text (like Unix grep).

USE WHEN:
- User asks to find specific text in files (names, dates, amounts, phrases)
- Looking for mentions of a person, company, or topic
- Finding "last" or "most recent" items (search Communications Log in master doc)
- Locating specific information across multiple files

SEARCH BEHAVIOR:
- Case-insensitive text matching
- Returns matching lines with line numbers and context
- Searches .md files only

WORKFLOW for "last email to Mikaela":
1. grep_advisory(pattern: "Mikaela", entity_name: "MyTab") → find all mentions
2. Identify the most recent file from results
3. read_advisory_file(that file) → get full content

RETURNS: Files with matching lines and context.

EXAMPLES:
- grep_advisory(pattern: "Mikaela", entity_name: "MyTab", subfolder: "Communications")
- grep_advisory(pattern: "Series A", entity_type: "deal")
- grep_advisory(pattern: "$5M", entity_name: "MyTab")`,
    input_schema: {
      type: 'object' as const,
      properties: {
        pattern: {
          type: 'string',
          description: 'Text to search for in file contents',
        },
        entity_type: {
          type: 'string',
          enum: ['deal', 'client', 'identity', 'all'],
          description: 'Filter by entity type (default: all)',
        },
        entity_name: {
          type: 'string',
          description: 'Filter to specific entity (e.g., "MyTab")',
        },
        subfolder: {
          type: 'string',
          description: 'Limit search to specific subfolder (e.g., "Communications", "Meetings")',
        },
      },
      required: ['pattern'],
    },
  },
  {
    name: 'fetch_url',
    description: `Fetch and read content from an external URL/webpage.

USE WHEN:
- User shares a URL and asks you to read/analyze it
- User asks about content from a specific webpage
- Need to access external documentation, articles, or web content
- User pastes a link and asks what it's about

CAPABILITIES:
- Fetches webpage content and extracts readable text
- Handles HTML pages, converting to clean readable text
- Works with articles, documentation, blog posts, etc.
- Follows redirects automatically

LIMITATIONS:
- Cannot access pages requiring authentication
- Cannot interact with JavaScript-rendered content (SPA)
- Large pages are truncated to ~15000 characters
- Some sites may block automated access

RETURNS: Extracted text content from the webpage.

EXAMPLES:
- fetch_url(url: "https://example.com/article")
- fetch_url(url: "https://docs.company.com/api-reference")
- fetch_url(url: "https://news.site.com/story/12345")`,
    input_schema: {
      type: 'object' as const,
      properties: {
        url: {
          type: 'string',
          description: 'The full URL to fetch (must start with http:// or https://)',
        },
      },
      required: ['url'],
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
      case 'glob_advisory':
        return await globAdvisory(input);
      case 'grep_advisory':
        return await grepAdvisory(input);
      case 'fetch_url':
        return await fetchUrl(input);
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
  entity_type?: 'deal' | 'client' | 'identity' | 'all';
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
  entity_type: 'deal' | 'client' | 'identity';
  entity_name: string;
  subfolder?: string;
};

async function listAdvisoryFolder(input: Record<string, unknown>): Promise<string> {
  const { entity_type, entity_name, subfolder } = input as ListAdvisoryFolderInput;

  // Map entity type to folder
  const typeFolder = entity_type === 'deal' ? 'deals' : entity_type === 'client' ? 'clients' : 'identity';
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

type GlobAdvisoryInput = {
  pattern: string;
  entity_type?: 'deal' | 'client' | 'identity' | 'all';
  entity_name?: string;
};

/**
 * Find files by glob pattern matching
 */
async function globAdvisory(input: Record<string, unknown>): Promise<string> {
  const { pattern, entity_type = 'all', entity_name } = input as GlobAdvisoryInput;

  chatLogger.info(`[glob_advisory] Pattern: "${pattern}"`, { entity_type, entity_name });

  // Convert glob pattern to regex (case-insensitive)
  const regexPattern = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape regex special chars except *
    .replace(/\*/g, '.*'); // Convert * to .*
  const regex = new RegExp(regexPattern, 'i');

  type MatchedFile = {
    name: string;
    path: string;
    entity_type: 'deal' | 'client' | 'identity';
    entity_name: string;
    size: number;
  };

  const matches: MatchedFile[] = [];
  const advisoryRoot = join(process.cwd(), 'advisory');

  // Determine which folders to search
  const typeFolders: Array<{ type: 'deal' | 'client' | 'identity'; folder: string }> = [];
  if (entity_type === 'all' || entity_type === 'deal') {
    typeFolders.push({ type: 'deal', folder: 'deals' });
  }
  if (entity_type === 'all' || entity_type === 'client') {
    typeFolders.push({ type: 'client', folder: 'clients' });
  }
  if (entity_type === 'all' || entity_type === 'identity') {
    typeFolders.push({ type: 'identity', folder: 'identity' });
  }

  // Recursive function to search directories
  function searchDirectory(dir: string, entityType: 'deal' | 'client' | 'identity', entityName: string) {
    if (!existsSync(dir)) return;

    const entries = readdirSync(dir);
    for (const entry of entries) {
      if (entry.startsWith('.')) continue;

      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        // Recurse into subdirectories
        searchDirectory(fullPath, entityType, entityName);
      } else if (stat.isFile() && regex.test(entry)) {
        // File matches pattern
        const relativePath = fullPath.replace(process.cwd() + '/', '');
        matches.push({
          name: entry,
          path: relativePath,
          entity_type: entityType,
          entity_name: entityName,
          size: stat.size,
        });
      }
    }
  }

  // Search each type folder
  for (const { type, folder } of typeFolders) {
    const typePath = join(advisoryRoot, folder);
    if (!existsSync(typePath)) continue;

    const entities = readdirSync(typePath);
    for (const entity of entities) {
      if (entity.startsWith('.')) continue;
      if (entity_name && entity.toLowerCase() !== entity_name.toLowerCase()) continue;

      const entityPath = join(typePath, entity);
      if (statSync(entityPath).isDirectory()) {
        searchDirectory(entityPath, type, entity);
      }
    }
  }

  chatLogger.info(`[glob_advisory] Found ${matches.length} matching files`);

  if (matches.length === 0) {
    return JSON.stringify({
      success: true,
      message: `No files matching pattern "${pattern}" found.`,
      matches: [],
    });
  }

  return JSON.stringify({
    success: true,
    message: `Found ${matches.length} file(s) matching "${pattern}"`,
    matches: matches.slice(0, 50), // Limit to 50 results
    total: matches.length,
  });
}

type GrepAdvisoryInput = {
  pattern: string;
  entity_type?: 'deal' | 'client' | 'identity' | 'all';
  entity_name?: string;
  subfolder?: string;
};

type GrepMatch = {
  file: string;
  entity_type: 'deal' | 'client' | 'identity';
  entity_name: string;
  matches: Array<{
    line_number: number;
    line: string;
    context_before?: string;
    context_after?: string;
  }>;
};

/**
 * Search file contents for text pattern
 */
async function grepAdvisory(input: Record<string, unknown>): Promise<string> {
  const { pattern, entity_type = 'all', entity_name, subfolder } = input as GrepAdvisoryInput;

  chatLogger.info(`[grep_advisory] Pattern: "${pattern}"`, { entity_type, entity_name, subfolder });

  // Case-insensitive search
  const regex = new RegExp(pattern, 'gi');

  const results: GrepMatch[] = [];
  const advisoryRoot = join(process.cwd(), 'advisory');

  // Determine which folders to search
  const typeFolders: Array<{ type: 'deal' | 'client' | 'identity'; folder: string }> = [];
  if (entity_type === 'all' || entity_type === 'deal') {
    typeFolders.push({ type: 'deal', folder: 'deals' });
  }
  if (entity_type === 'all' || entity_type === 'client') {
    typeFolders.push({ type: 'client', folder: 'clients' });
  }
  if (entity_type === 'all' || entity_type === 'identity') {
    typeFolders.push({ type: 'identity', folder: 'identity' });
  }

  // Search function for a single file
  async function searchFile(
    filePath: string,
    entityType: 'deal' | 'client' | 'identity',
    entityName: string
  ): Promise<GrepMatch | null> {
    try {
      const content = await readFile(filePath, 'utf-8');
      const lines = content.split('\n');
      const matchingLines: GrepMatch['matches'] = [];

      for (let i = 0; i < lines.length; i++) {
        if (regex.test(lines[i])) {
          matchingLines.push({
            line_number: i + 1,
            line: lines[i].trim().substring(0, 200), // Limit line length
            context_before: i > 0 ? lines[i - 1].trim().substring(0, 100) : undefined,
            context_after: i < lines.length - 1 ? lines[i + 1].trim().substring(0, 100) : undefined,
          });
        }
      }

      if (matchingLines.length > 0) {
        return {
          file: filePath.replace(process.cwd() + '/', ''),
          entity_type: entityType,
          entity_name: entityName,
          matches: matchingLines.slice(0, 10), // Limit to 10 matches per file
        };
      }
    } catch {
      // Skip files that can't be read
    }
    return null;
  }

  // Recursive function to search directories
  async function searchDirectory(
    dir: string,
    entityType: 'deal' | 'client' | 'identity',
    entityName: string
  ): Promise<void> {
    if (!existsSync(dir)) return;

    const entries = readdirSync(dir);
    for (const entry of entries) {
      if (entry.startsWith('.')) continue;

      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        await searchDirectory(fullPath, entityType, entityName);
      } else if (stat.isFile() && entry.endsWith('.md')) {
        const match = await searchFile(fullPath, entityType, entityName);
        if (match) {
          results.push(match);
        }
      }
    }
  }

  // Search each type folder
  for (const { type, folder } of typeFolders) {
    const typePath = join(advisoryRoot, folder);
    if (!existsSync(typePath)) continue;

    const entities = readdirSync(typePath);
    for (const entity of entities) {
      if (entity.startsWith('.')) continue;
      if (entity_name && entity.toLowerCase() !== entity_name.toLowerCase()) continue;

      let searchPath = join(typePath, entity);
      if (subfolder) {
        searchPath = join(searchPath, subfolder);
      }

      if (existsSync(searchPath) && statSync(searchPath).isDirectory()) {
        await searchDirectory(searchPath, type, entity);
      }
    }
  }

  chatLogger.info(`[grep_advisory] Found ${results.length} files with matches`);

  if (results.length === 0) {
    return JSON.stringify({
      success: true,
      message: `No files containing "${pattern}" found.`,
      results: [],
    });
  }

  // Sort by number of matches (most relevant first)
  results.sort((a, b) => b.matches.length - a.matches.length);

  return JSON.stringify({
    success: true,
    message: `Found "${pattern}" in ${results.length} file(s)`,
    results: results.slice(0, 20), // Limit to 20 files
    total_files: results.length,
    total_matches: results.reduce((sum, r) => sum + r.matches.length, 0),
  });
}

type FetchUrlInput = {
  url: string;
};

/**
 * Fetch content from an external URL
 * M3.10: External weblink access tool
 */
async function fetchUrl(input: Record<string, unknown>): Promise<string> {
  const { url } = input as FetchUrlInput;

  chatLogger.info(`[fetch_url] Fetching: ${url}`);

  // Validate URL
  if (!url || typeof url !== 'string') {
    return JSON.stringify({ success: false, error: 'URL is required' });
  }

  // Must be http or https
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return JSON.stringify({
      success: false,
      error: 'URL must start with http:// or https://',
    });
  }

  // Parse URL to validate it
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return JSON.stringify({ success: false, error: 'Invalid URL format' });
  }

  // Block localhost and private IPs (SSRF protection)
  const hostname = parsedUrl.hostname.toLowerCase();
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    hostname.startsWith('172.16.') ||
    hostname.endsWith('.local')
  ) {
    return JSON.stringify({
      success: false,
      error: 'Cannot fetch from localhost or private networks',
    });
  }

  try {
    // Fetch with timeout and reasonable headers
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'BoboBot/1.0 (AI Assistant; +https://bobo.ai)',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.7',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return JSON.stringify({
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        url: response.url,
      });
    }

    // Get content type
    const contentType = response.headers.get('content-type') || '';
    const isHtml = contentType.includes('text/html') || contentType.includes('application/xhtml');
    const isText = contentType.includes('text/') || contentType.includes('application/json');

    // Read response body
    const rawText = await response.text();

    // Limit raw content size
    const maxRawSize = 500000; // 500KB max raw
    if (rawText.length > maxRawSize) {
      chatLogger.warn(`[fetch_url] Content too large: ${rawText.length} chars`);
    }

    let extractedContent: string;
    let title: string | null = null;

    if (isHtml) {
      // Parse HTML and extract readable content using linkedom + Readability
      // Readability is Mozilla's algorithm (same as Firefox Reader View)
      try {
        const { document } = parseHTML(rawText);

        // Use Readability to extract main article content
        const reader = new Readability(document);
        const article = reader.parse();

        if (article) {
          title = article.title ?? null;
          extractedContent = article.textContent || '';
          chatLogger.info(`[fetch_url] Readability extracted: "${title}" (${extractedContent.length} chars)`);
        } else {
          // Fallback: extract text from body if Readability fails
          extractedContent = document.body?.textContent || '';
          title = document.title || null;
          chatLogger.info(`[fetch_url] Fallback extraction (${extractedContent.length} chars)`);
        }
      } catch (parseError) {
        chatLogger.warn('[fetch_url] HTML parsing failed, using raw text:', parseError);
        // Strip HTML tags as fallback
        extractedContent = rawText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      }
    } else if (isText) {
      // Plain text or JSON - use as-is
      extractedContent = rawText;
    } else {
      // Binary or unsupported content type
      return JSON.stringify({
        success: false,
        error: `Unsupported content type: ${contentType}`,
        url: response.url,
      });
    }

    // Clean up whitespace
    extractedContent = extractedContent
      .replace(/\n{3,}/g, '\n\n') // Max 2 newlines
      .replace(/[ \t]+/g, ' ') // Collapse spaces
      .trim();

    // Truncate if too long
    const maxLength = 15000;
    const truncated = extractedContent.length > maxLength;
    const finalContent = truncated
      ? extractedContent.substring(0, maxLength) + '\n\n... [Content truncated - page has ' + extractedContent.length + ' characters]'
      : extractedContent;

    chatLogger.info(`[fetch_url] Success: ${finalContent.length} chars (truncated: ${truncated})`);

    return JSON.stringify({
      success: true,
      url: response.url, // Final URL after redirects
      title: title,
      content: finalContent,
      content_type: contentType,
      truncated,
      total_length: extractedContent.length,
    });
  } catch (error) {
    chatLogger.error('[fetch_url] Fetch failed:', error);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return JSON.stringify({
          success: false,
          error: 'Request timed out (15 seconds)',
          url,
        });
      }
      return JSON.stringify({
        success: false,
        error: error.message,
        url,
      });
    }

    return JSON.stringify({
      success: false,
      error: 'Failed to fetch URL',
      url,
    });
  }
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
