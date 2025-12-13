/**
 * M3.9: Claude Advisory Tools
 *
 * Tool definitions and executors for searching and reading advisory files.
 * Uses Claude's native tool_use format.
 *
 * M3.10: Added fetch_url tool for external weblink access.
 * M3.13: Added memory tools (record_question, record_decision, record_insight).
 */

import type { Tool } from '@anthropic-ai/sdk/resources/messages';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync, readdirSync, statSync } from 'fs';
import crypto from 'crypto';
import { generateEmbedding } from '@/lib/ai/embedding';
import { supabase, DEFAULT_USER_ID } from '@/lib/db/client';
import { ADVISORY_PROJECT_ID, INSPIRATION_LIBRARY_PROJECT_ID } from '@/lib/db/types';
import { createMemory, getMemoryById, updateMemoryAccess } from '@/lib/db/queries';
import { chatLogger } from '@/lib/logger';
import { parseHTML } from 'linkedom';
import { Readability } from '@mozilla/readability';
import { generateText } from 'ai';
import { getModel } from '@/lib/ai/models';

// ============================================================================
// Types
// ============================================================================

/**
 * Context passed to tools that need conversation/project awareness
 * Used by second-opinion tools (ask_gemini, ask_chatgpt) to include chat history and project files
 */
export interface ToolExecutionContext {
  /** Recent messages from current conversation */
  messages?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  /** Project context files (if active project) */
  projectContext?: {
    projectId: string;
    projectName?: string;
    /** Custom project-level instructions (if any) */
    customInstructions?: string;
    files?: Array<{ filename: string; content_text: string }>;
  };
  /**
   * Claude's latest reply in the CURRENT turn (draft text from the tool-using iteration).
   * Useful when requesting a second opinion on Claude's just-generated answer.
   */
  claudeLatestReply?: string;
}

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
    name: 'search_inspiration',
    description: `SEMANTIC search of the Inspiration Library (T2D3, MRR Unlocked, BasicArts, etc.).

BEST FOR:
- "Enrich this draft with T2D3 guidance"
- "What does MRR Unlocked say about pricing / discovery / outbound?"
- Pulling relevant excerpts + principles to strengthen a draft or idea

RETURNS: Relevant excerpts ranked by semantic similarity, with source attribution.

TIP:
- Use \`source\` to target a specific library (e.g., "T2D3", "MRR Unlocked")
- Use \`content_kind\` to narrow to Blog Posts / LinkedIn / Videos`,
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Search query in natural language (e.g., "pricing objections", "founder-led sales")',
        },
        source: {
          type: 'string',
          description: 'Optional source filter (examples: "T2D3", "MRR Unlocked", "BasicArts", "Fluint", "The Venture Crew")',
        },
        content_kind: {
          type: 'string',
          enum: ['blog_post', 'linkedin_post', 'video', 'all'],
          description: 'Optional content kind filter (default: all)',
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
    name: 'read_inspiration_file',
    description: `Read FULL contents of a specific Inspiration Library file (from the indexed database).

USE WHEN:
- You found a file via search_inspiration and need the full content
- You want to quote or extract a specific framework from the source

RETURNS: Full file contents (max 8000 chars).`,
    input_schema: {
      type: 'object' as const,
      properties: {
        filename: {
          type: 'string',
          description: 'The filename path from search results (e.g., "01_Inspiration/BlogPosts/T2D3/....md")',
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
  // ==========================================================================
  // M3.13: Thinking Partner Memory Tools
  // ==========================================================================
  {
    name: 'record_question',
    description: `Record a question the user is exploring.

USE WHEN:
- User asks a significant question worth remembering
- User is working through a problem or decision
- You want to track the user's thinking process
- The question might be relevant to future conversations

FEATURES:
- Checks for similar existing questions (avoids duplicates)
- Reinforces existing questions if similar (Hebbian learning)
- Supports tagging for organization
- Can link to thought threads

EXAMPLES:
- "How should I structure this authentication system?"
- "What's the best way to handle database migrations?"
- "Why is this API endpoint slow?"`,
    input_schema: {
      type: 'object' as const,
      properties: {
        question: {
          type: 'string',
          description: 'The question being asked (10-500 characters)',
        },
        context: {
          type: 'string',
          description: 'Why this question is being asked (optional)',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags to categorize this question (e.g., ["architecture", "performance"])',
        },
        thread_id: {
          type: 'string',
          description: 'UUID of an existing thought thread to link to (optional)',
        },
      },
      required: ['question'],
    },
  },
  {
    name: 'record_decision',
    description: `Record a decision made by the user.

USE WHEN:
- User decides on an approach or makes a choice
- User commits to a direction after considering options
- An important architectural or design decision is made
- You want to remember why a choice was made

FEATURES:
- Stores the decision with high confidence (0.9)
- Can record alternatives that were considered
- Stores rationale for future reference
- Checks for similar decisions to avoid duplicates

EXAMPLES:
- "I'll use PostgreSQL for this project" (alternatives: MySQL, MongoDB)
- "We'll prioritize performance over features"
- "Going with microservices architecture"`,
    input_schema: {
      type: 'object' as const,
      properties: {
        decision: {
          type: 'string',
          description: 'The decision made (10-500 characters)',
        },
        alternatives: {
          type: 'array',
          items: { type: 'string' },
          description: 'Other options that were considered',
        },
        rationale: {
          type: 'string',
          description: 'Why this decision was made',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags to categorize this decision',
        },
        thread_id: {
          type: 'string',
          description: 'UUID of an existing thought thread to link to (optional)',
        },
      },
      required: ['decision'],
    },
  },
  {
    name: 'record_insight',
    description: `Record an insight or pattern discovered.

USE WHEN:
- Recognizing a recurring theme or pattern
- User has a realization or learning
- Discovering something that could help in future situations
- Noticing a best practice or anti-pattern

FEATURES:
- Stores insights with high confidence (0.85)
- Can record supporting evidence
- Useful for building up wisdom over time
- Checks for similar insights to reinforce rather than duplicate

EXAMPLES:
- "Authentication issues often come from token expiry"
- "Users prefer simpler UIs with fewer options"
- "Performance bottlenecks are usually in the database layer"`,
    input_schema: {
      type: 'object' as const,
      properties: {
        insight: {
          type: 'string',
          description: 'The insight or pattern discovered (10-500 characters)',
        },
        evidence: {
          type: 'array',
          items: { type: 'string' },
          description: 'Examples or data supporting this insight',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags to categorize this insight',
        },
        thread_id: {
          type: 'string',
          description: 'UUID of an existing thought thread to link to (optional)',
        },
      },
      required: ['insight'],
    },
  },
  // ==========================================================================
  // M3.14: Memory Search Tool for Extended Thinking
  // ==========================================================================
  {
    name: 'search_memory',
    description: `Search your memory for relevant information about the user.

USE WHEN:
- User references past discussions ("remember when...", "what did we decide...")
- Need context from previous conversations
- Looking for recorded decisions, insights, or questions
- User asks about preferences or background
- Preparing for a complex task where prior context would help

FEATURES:
- Semantic search (conceptual similarity)
- Temporal weighting (recent memories rank higher)
- Frequency weighting (frequently accessed memories rank higher)
- Confidence weighting (high-confidence facts rank higher)
- Category and memory type filtering

RETURNS: Relevant memories ranked by combined relevance score.

EXAMPLES:
- "What decisions have we made about authentication?"
- "What questions was I exploring last week?"
- "What are my preferences for code style?"
- "What insights have we discovered about performance?"`,
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'What to search for in memory (natural language query)',
        },
        category: {
          type: 'string',
          enum: [
            'user_preferences',
            'communication_style',
            'project_context',
            'feedback',
            'personal_facts',
            'other_instructions',
          ],
          description: 'Optional category filter',
        },
        memory_type: {
          type: 'string',
          enum: ['fact', 'question', 'decision', 'insight'],
          description: 'Optional memory type filter',
        },
        limit: {
          type: 'number',
          description: 'Max results to return (1-10, default: 5)',
        },
      },
      required: ['query'],
    },
  },
  // ==========================================================================
  // M3.15: Ask Gemini - Cross-Model Query Tool
  // ==========================================================================
  {
    name: 'ask_gemini',
    description: `Ask Gemini 3.0 Pro about the current conversation (2 query modes).

MODES:
- parallel_answer: Gemini answers the user's latest message as a normal assistant
  - Sends full chat history + active project context/files
  - EXCLUDES Claude's latest reply (not a second opinion)
- second_opinion: Gemini provides a critical second opinion
  - Sends full chat history + active project context/files
  - INCLUDES Claude's latest reply (when available)

USE WHEN:
- User wants an independent Gemini answer to the same prompt ("Ask Gemini this too")
- User explicitly asks for a second opinion or alternative perspective
- Facing a complex technical decision where another AI's view would help
- Debugging a tricky problem and need fresh eyes
- Validating an approach before committing to it
- User says things like "what do you think?", "am I missing something?", "sanity check this"

AUTOMATICALLY INCLUDES:
- Full conversation history so far
- Active project summary + files (if any, and if enabled)
- Claude's latest reply ONLY when query_type=second_opinion

RETURNS: Gemini's response as a collapsible quote block that you should synthesize or present.

FORMAT YOUR RESPONSE AS:
1. Show Gemini's response in a blockquote
2. Provide your synthesis comparing/integrating perspectives

EXAMPLES:
- "Can you get a second opinion on this architecture decision?"
- "Ask Gemini the same question I just asked you"
- "What would another AI think about this approach?"
- "I'm stuck - let's see what Gemini thinks"
- "Sanity check: am I overcomplicating this?"`,
    input_schema: {
      type: 'object' as const,
      properties: {
        query_type: {
          type: 'string',
          enum: ['parallel_answer', 'second_opinion'],
          description:
            'parallel_answer: Gemini answers the latest user message (excludes Claude reply). second_opinion: critique Claude reply (includes Claude reply when available). Default: second_opinion.',
        },
        question: {
          type: 'string',
          description: 'Specific question or aspect to get Gemini\'s opinion on. Be specific about what perspective you want.',
        },
        include_project_files: {
          type: 'boolean',
          description: 'Whether to include active project files in context (default: true, set false for general questions)',
        },
        focus_area: {
          type: 'string',
          enum: ['architecture', 'code-review', 'debugging', 'best-practices', 'general'],
          description: 'What type of feedback to focus on (optional, helps Gemini tailor response)',
        },
      },
      required: ['question'],
    },
  },
  // ==========================================================================
  // M3.17: Review Chat - Cross-Chat Context Tool
  // ==========================================================================
  {
    name: 'review_chat',
    description: `Fetch and review the contents of a previous chat conversation.

USE WHEN:
- User provides a chat URL or chat ID and wants you to reference that conversation
- User says "look at chat X" or "review the conversation from..."
- Need context from a specific past conversation
- User wants to continue or reference a discussion from another chat

INPUT FORMATS:
- Full URL: "http://localhost:3000/chat/abc-123-def"
- Chat ID: "abc-123-def" (UUID format)

RETURNS: Chat metadata and full message history formatted for context.

EXAMPLES:
- review_chat(chat_id: "abc-123-def")
- review_chat(chat_id: "http://localhost:3000/chat/abc-123-def")
- "Review the chat at this URL: ..." → extract chat ID and use this tool`,
    input_schema: {
      type: 'object' as const,
      properties: {
        chat_id: {
          type: 'string',
          description: 'The chat ID (UUID) or full URL containing the chat ID to review',
        },
        include_system_messages: {
          type: 'boolean',
          description: 'Whether to include system messages (default: false)',
        },
        max_messages: {
          type: 'number',
          description: 'Maximum number of messages to return (default: 50, max: 100)',
        },
      },
      required: ['chat_id'],
    },
  },
  // ==========================================================================
  // M3.16: Ask ChatGPT - Cross-Model Query Tool
  // ==========================================================================
  {
    name: 'ask_chatgpt',
    description: `Ask ChatGPT (GPT-5.2) about the current conversation (2 query modes).

MODES:
- parallel_answer: ChatGPT answers the user's latest message as a normal assistant
  - Sends full chat history + active project context/files
  - EXCLUDES Claude's latest reply (not a second opinion)
- second_opinion: ChatGPT provides a critical second opinion
  - Sends full chat history + active project context/files
  - INCLUDES Claude's latest reply (when available)

USE WHEN:
- User wants an independent ChatGPT answer to the same prompt ("Ask ChatGPT this too")
- User explicitly asks for a second opinion or alternative perspective
- Facing a complex technical decision where another AI's view would help
- Debugging a tricky problem and need fresh eyes
- Validating an approach before committing to it
- User says things like "what do you think?", "am I missing something?", "sanity check this"

AUTOMATICALLY INCLUDES:
- Full conversation history so far
- Active project summary + files (if any, and if enabled)
- Claude's latest reply ONLY when query_type=second_opinion

RETURNS: ChatGPT's perspective as a collapsible quote block that you should synthesize.

FORMAT YOUR RESPONSE AS:
1. Show ChatGPT's response in a blockquote
2. Provide your synthesis comparing/integrating perspectives

EXAMPLES:
- "Can you get ChatGPT's take on this?"
- "Ask ChatGPT the same question I just asked you"
- "What would GPT-5.2 think about this approach?"
- "I'm stuck - let's see what ChatGPT thinks"
- "Sanity check: am I overcomplicating this?"`,
    input_schema: {
      type: 'object' as const,
      properties: {
        query_type: {
          type: 'string',
          enum: ['parallel_answer', 'second_opinion'],
          description:
            'parallel_answer: ChatGPT answers the latest user message (excludes Claude reply). second_opinion: critique Claude reply (includes Claude reply when available). Default: second_opinion.',
        },
        question: {
          type: 'string',
          description: 'Specific question or aspect to get ChatGPT\'s opinion on. Be specific about what perspective you want.',
        },
        include_project_files: {
          type: 'boolean',
          description: 'Whether to include active project files in context (default: true, set false for general questions)',
        },
        focus_area: {
          type: 'string',
          enum: ['architecture', 'code-review', 'debugging', 'best-practices', 'general'],
          description: 'What type of feedback to focus on (optional, helps ChatGPT tailor response)',
        },
      },
      required: ['question'],
    },
  },
];

// ============================================================================
// Tool Execution
// ============================================================================

/**
 * Execute an advisory tool and return JSON result
 * @param name - Tool name to execute
 * @param input - Tool input parameters
 * @param context - Optional context for tools that need chat/project awareness (e.g., ask_gemini, ask_chatgpt)
 */
export async function executeAdvisoryTool(
  name: string,
  input: Record<string, unknown>,
  context?: ToolExecutionContext
): Promise<string> {
  chatLogger.info(`[Advisory Tool] Executing ${name}`, input);

  try {
    switch (name) {
      case 'search_advisory':
        return await searchAdvisory(input);
      case 'search_inspiration':
        return await searchInspiration(input);
      case 'read_advisory_file':
        return await readAdvisoryFile(input);
      case 'read_inspiration_file':
        return await readInspirationFile(input);
      case 'list_advisory_folder':
        return await listAdvisoryFolder(input);
      case 'glob_advisory':
        return await globAdvisory(input);
      case 'grep_advisory':
        return await grepAdvisory(input);
      case 'fetch_url':
        return await fetchUrl(input);
      // M3.13: Thinking Partner Memory Tools
      case 'record_question':
        return await recordQuestion(input);
      case 'record_decision':
        return await recordDecision(input);
      case 'record_insight':
        return await recordInsight(input);
      // M3.14: Memory Search Tool
      case 'search_memory':
        return await searchMemory(input);
      // M3.15: Ask Gemini - Second Opinion Tool
      case 'ask_gemini':
        return await askGemini(input, context);
      // M3.16: Ask ChatGPT - Second Opinion Tool
      case 'ask_chatgpt':
        return await askChatGPT(input, context);
      // M3.17: Review Chat - Cross-Chat Context Tool
      case 'review_chat':
        return await reviewChat(input);
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

type SearchInspirationInput = {
  query: string;
  source?: string;
  content_kind?: 'blog_post' | 'linkedin_post' | 'video' | 'all';
  limit?: number;
};

function normalizeInspirationSourceFilter(source?: string): string | undefined {
  if (!source) return undefined;
  const trimmed = source.trim();
  if (!trimmed || trimmed.toLowerCase() === 'all') return undefined;

  const lower = trimmed.toLowerCase();

  if (lower.includes('mrr')) return 'MRR Unlocked';
  if (lower.includes('unlocked')) return 'MRR Unlocked';
  if (lower.includes('venture')) return 'The Venture Crew';
  if (lower.includes('t2d3')) return 'T2D3';
  if (lower.includes('basic')) return 'BasicArts';
  if (lower.includes('fluint')) return 'Fluint';

  return trimmed;
}

function mapInspirationKindToEntityType(kind?: SearchInspirationInput['content_kind']): string | undefined {
  if (!kind || kind === 'all') return undefined;
  if (kind === 'blog_post') return 'inspiration_blog_post';
  if (kind === 'linkedin_post') return 'inspiration_linkedin_post';
  if (kind === 'video') return 'inspiration_video';
  return undefined;
}

async function searchInspiration(input: Record<string, unknown>): Promise<string> {
  const {
    query,
    source,
    content_kind = 'all',
    limit = 5,
  } = input as SearchInspirationInput;

  const clampedLimit = Math.max(1, Math.min(20, Number.isFinite(limit) ? limit : 5));
  const normalizedSource = normalizeInspirationSourceFilter(source);
  const entityTypeFilter = mapInspirationKindToEntityType(content_kind);

  chatLogger.info(`[search_inspiration] Query: "${query}"`, {
    source: normalizedSource || 'all',
    content_kind,
    limit: clampedLimit,
  });

  const embedding = await generateEmbedding(query);

  const { data: results, error } = await supabase.rpc('search_advisory_files', {
    query_embedding: embedding,
    query_text: query,
    p_project_id: INSPIRATION_LIBRARY_PROJECT_ID,
    entity_type_filter: entityTypeFilter,
    entity_name_filter: normalizedSource || undefined,
    match_count: clampedLimit,
    vector_weight: 0.7,
    text_weight: 0.3,
    min_similarity: 0.25,
  });

  if (error) {
    chatLogger.error('[search_inspiration] RPC error:', error);
    return JSON.stringify({ success: false, error: error.message });
  }

  if (!results || results.length === 0) {
    return JSON.stringify({
      success: true,
      message: 'No matching inspiration files found. Try different keywords or remove filters.',
      results: [],
    });
  }

  type SearchResult = {
    id: string;
    filename: string;
    content_text: string;
    entity_type: string | null;
    entity_name: string | null;
    combined_score: number;
  };

  const formatted = (results as SearchResult[]).map((r, i) => ({
    index: i + 1,
    source: r.entity_name,
    content_kind: r.entity_type,
    filename: r.filename,
    relevance_score: Math.round(r.combined_score * 100) / 100,
    content_excerpt: r.content_text.length > 1500
      ? r.content_text.substring(0, 1500) + '...'
      : r.content_text,
  }));

  chatLogger.info(`[search_inspiration] Found ${results.length} files`);

  return JSON.stringify({
    success: true,
    message: `Found ${results.length} inspiration file(s) matching "${query}"`,
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

type ReadInspirationFileInput = {
  filename: string;
};

function normalizeInspirationFilename(filename: string): string {
  const normalized = filename.trim().replace(/\\/g, '/');
  if (!normalized) return normalized;
  if (normalized.startsWith('01_Inspiration/')) return normalized;
  if (normalized.startsWith('BlogPosts/') || normalized.startsWith('LinkedInPosts/') || normalized.startsWith('Videos/')) {
    return `01_Inspiration/${normalized}`;
  }
  return normalized;
}

async function readInspirationFile(input: Record<string, unknown>): Promise<string> {
  const { filename } = input as ReadInspirationFileInput;
  const normalizedFilename = normalizeInspirationFilename(filename);

  chatLogger.info(`[read_inspiration_file] Reading: ${normalizedFilename}`);

  if (!normalizedFilename || normalizedFilename.includes('..')) {
    return JSON.stringify({ success: false, error: 'Invalid file path' });
  }

  const { data, error } = await supabase
    .from('files')
    .select('filename, content_text, entity_type, entity_name')
    .eq('project_id', INSPIRATION_LIBRARY_PROJECT_ID)
    .eq('filename', normalizedFilename)
    .maybeSingle();

  if (error) {
    chatLogger.error('[read_inspiration_file] Query error:', error);
    return JSON.stringify({ success: false, error: error.message });
  }

  if (!data) {
    return JSON.stringify({ success: false, error: `File not found in Inspiration Library: ${normalizedFilename}` });
  }

  const content = data.content_text || '';
  const maxLength = 8000;
  const truncated = content.length > maxLength;
  const finalContent = truncated
    ? content.substring(0, maxLength) + `\n\n... [Content truncated - file is ${content.length} characters]`
    : content;

  return JSON.stringify({
    success: true,
    filename: data.filename,
    source: data.entity_name,
    content_kind: data.entity_type,
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
// M3.13: Memory Tool Implementations
// ============================================================================

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

/**
 * Find semantically similar memories using vector search
 */
async function findSimilarMemories(
  content: string,
  threshold: number = 0.85
): Promise<Array<{ id: string; content: string; confidence: number }>> {
  try {
    const embedding = await generateEmbedding(content);

    const { data, error } = await supabase.rpc('find_memories_by_embedding', {
      query_embedding: embedding,
      similarity_threshold: threshold,
      p_user_id: DEFAULT_USER_ID,
      match_count: 5,
    });

    if (error) {
      chatLogger.error('[Memory] findSimilarMemories RPC error:', error);
      return [];
    }

    return (data || []) as Array<{ id: string; content: string; confidence: number }>;
  } catch (error) {
    chatLogger.error('[Memory] findSimilarMemories failed:', error);
    return [];
  }
}

type RecordQuestionInput = {
  question: string;
  context?: string;
  tags?: string[];
  thread_id?: string;
};

/**
 * Record a question the user is exploring
 * M3.13-04: Thinking Partner tool
 */
async function recordQuestion(input: Record<string, unknown>): Promise<string> {
  const { question, context, tags, thread_id } = input as RecordQuestionInput;

  chatLogger.info(`[record_question] Recording: "${question}"`, { context, tags, thread_id });

  // Validate input
  if (!question || question.length < 10) {
    return JSON.stringify({
      success: false,
      error: 'Question must be at least 10 characters',
    });
  }

  if (question.length > 500) {
    return JSON.stringify({
      success: false,
      error: 'Question must be less than 500 characters',
    });
  }

  try {
    // Check for similar questions (Hebbian reinforcement)
    const duplicates = await findSimilarMemories(question, 0.80);

    if (duplicates.length > 0) {
      const existing = duplicates[0];
      chatLogger.info('[record_question] Similar question found, reinforcing:', existing);

      const existingMemory = await getMemoryById(existing.id);

      if (existingMemory) {
        const oldConfidence = existingMemory.confidence;
        const newConfidence = Math.min(1.0, oldConfidence + 0.05);
        const newImportance = Math.max(existingMemory.importance, 0.8);

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
          throw new Error(`Failed to reinforce question: ${error.message}`);
        }

        return JSON.stringify({
          success: true,
          action: 'reinforced',
          message: `Reinforced existing question: "${existing.content}"`,
          memory_id: existing.id,
          confidence: { old: oldConfidence, new: newConfidence },
        });
      }
    }

    // Create new memory entry
    const embedding = await generateEmbedding(question);
    const contentHash = generateContentHash(question);

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

    chatLogger.info('[record_question] Question recorded:', memory.id);

    return JSON.stringify({
      success: true,
      action: 'created',
      message: `Recorded question: "${question}"`,
      memory_id: memory.id,
      tags: tags || [],
    });
  } catch (error) {
    chatLogger.error('[record_question] Failed:', error);
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to record question',
    });
  }
}

type RecordDecisionInput = {
  decision: string;
  alternatives?: string[];
  rationale?: string;
  tags?: string[];
  thread_id?: string;
};

/**
 * Record a decision made by the user
 * M3.13-05: Thinking Partner tool
 */
async function recordDecision(input: Record<string, unknown>): Promise<string> {
  const { decision, alternatives, rationale, tags, thread_id } = input as RecordDecisionInput;

  chatLogger.info(`[record_decision] Recording: "${decision}"`, { alternatives, rationale, tags, thread_id });

  // Validate input
  if (!decision || decision.length < 10) {
    return JSON.stringify({
      success: false,
      error: 'Decision must be at least 10 characters',
    });
  }

  if (decision.length > 500) {
    return JSON.stringify({
      success: false,
      error: 'Decision must be less than 500 characters',
    });
  }

  try {
    // Check for similar decisions (Hebbian reinforcement)
    const duplicates = await findSimilarMemories(decision, 0.80);

    if (duplicates.length > 0) {
      const existing = duplicates[0];
      chatLogger.info('[record_decision] Similar decision found, reinforcing:', existing);

      const existingMemory = await getMemoryById(existing.id);

      if (existingMemory) {
        const oldConfidence = existingMemory.confidence;
        const newConfidence = Math.min(1.0, oldConfidence + 0.05);
        const newImportance = Math.max(existingMemory.importance, 0.9);

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
          throw new Error(`Failed to reinforce decision: ${error.message}`);
        }

        return JSON.stringify({
          success: true,
          action: 'reinforced',
          message: `Reinforced existing decision: "${existing.content}"`,
          memory_id: existing.id,
          confidence: { old: oldConfidence, new: newConfidence },
        });
      }
    }

    // Create new memory entry
    const embedding = await generateEmbedding(decision);
    const contentHash = generateContentHash(decision);

    // Build summary with rationale
    let summary = rationale || null;
    if (alternatives && alternatives.length > 0) {
      const altText = `Alternatives considered: ${alternatives.join(', ')}`;
      summary = summary ? `${summary}\n${altText}` : altText;
    }

    const memory = await createMemory({
      category: 'other_instructions',
      subcategory: null,
      content: decision,
      summary,
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

    chatLogger.info('[record_decision] Decision recorded:', memory.id);

    return JSON.stringify({
      success: true,
      action: 'created',
      message: `Recorded decision: "${decision}"`,
      memory_id: memory.id,
      alternatives: alternatives || [],
      tags: tags || [],
    });
  } catch (error) {
    chatLogger.error('[record_decision] Failed:', error);
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to record decision',
    });
  }
}

type RecordInsightInput = {
  insight: string;
  evidence?: string[];
  tags?: string[];
  thread_id?: string;
};

/**
 * Record an insight or pattern discovered
 * M3.13-06: Thinking Partner tool
 */
async function recordInsight(input: Record<string, unknown>): Promise<string> {
  const { insight, evidence, tags, thread_id } = input as RecordInsightInput;

  chatLogger.info(`[record_insight] Recording: "${insight}"`, { evidence, tags, thread_id });

  // Validate input
  if (!insight || insight.length < 10) {
    return JSON.stringify({
      success: false,
      error: 'Insight must be at least 10 characters',
    });
  }

  if (insight.length > 500) {
    return JSON.stringify({
      success: false,
      error: 'Insight must be less than 500 characters',
    });
  }

  try {
    // Check for similar insights (Hebbian reinforcement)
    const duplicates = await findSimilarMemories(insight, 0.80);

    if (duplicates.length > 0) {
      const existing = duplicates[0];
      chatLogger.info('[record_insight] Similar insight found, reinforcing:', existing);

      const existingMemory = await getMemoryById(existing.id);

      if (existingMemory) {
        const oldConfidence = existingMemory.confidence;
        const newConfidence = Math.min(1.0, oldConfidence + 0.05);
        const newImportance = Math.max(existingMemory.importance, 0.85);

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
          throw new Error(`Failed to reinforce insight: ${error.message}`);
        }

        return JSON.stringify({
          success: true,
          action: 'reinforced',
          message: `Reinforced existing insight: "${existing.content}"`,
          memory_id: existing.id,
          confidence: { old: oldConfidence, new: newConfidence },
        });
      }
    }

    // Create new memory entry
    const embedding = await generateEmbedding(insight);
    const contentHash = generateContentHash(insight);

    // Build summary with evidence
    const summary = evidence && evidence.length > 0
      ? `Evidence: ${evidence.join('; ')}`
      : null;

    const memory = await createMemory({
      category: 'other_instructions',
      subcategory: null,
      content: insight,
      summary,
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

    chatLogger.info('[record_insight] Insight recorded:', memory.id);

    return JSON.stringify({
      success: true,
      action: 'created',
      message: `Recorded insight: "${insight}"`,
      memory_id: memory.id,
      evidence_count: evidence?.length || 0,
      tags: tags || [],
    });
  } catch (error) {
    chatLogger.error('[record_insight] Failed:', error);
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to record insight',
    });
  }
}

// ============================================================================
// M3.14: Memory Search Implementation
// ============================================================================

type SearchMemoryInput = {
  query: string;
  category?: string;
  memory_type?: 'fact' | 'question' | 'decision' | 'insight';
  limit?: number;
};

/**
 * Search user's memory for relevant information
 * M3.14: Active memory retrieval for extended thinking
 */
async function searchMemory(input: Record<string, unknown>): Promise<string> {
  const { query, category, memory_type, limit = 5 } = input as SearchMemoryInput;

  chatLogger.info(`[search_memory] Query: "${query}"`, { category, memory_type, limit });

  // Validate input
  if (!query || query.length < 3) {
    return JSON.stringify({
      success: false,
      error: 'Query must be at least 3 characters',
    });
  }

  const clampedLimit = Math.max(1, Math.min(10, limit));

  try {
    // Generate embedding for semantic search
    const embedding = await generateEmbedding(query);

    // Call enhanced_memory_search RPC with full capabilities
    const { data: results, error } = await supabase.rpc('enhanced_memory_search', {
      query_embedding: embedding,
      query_text: query,
      match_count: clampedLimit,
      // Weights tuned for balanced relevance
      vector_weight: 0.4, // Semantic similarity
      text_weight: 0.2, // Keyword matching
      recency_weight: 0.2, // Temporal decay
      frequency_weight: 0.1, // Access frequency
      confidence_weight: 0.1, // Source confidence
      recency_half_life_days: 30, // 30-day half-life
      min_vector_similarity: 0.3,
      p_user_id: DEFAULT_USER_ID,
      p_category: category || undefined,
    });

    if (error) {
      chatLogger.error('[search_memory] RPC error:', error);
      return JSON.stringify({
        success: false,
        error: `Memory search failed: ${error.message}`,
      });
    }

    if (!results || results.length === 0) {
      return JSON.stringify({
        success: true,
        message: `No memories found matching "${query}". Try different keywords or a broader search.`,
        results: [],
      });
    }

    // Filter by memory_type if specified (post-filter since RPC doesn't support it directly)
    let filteredResults = results;
    if (memory_type) {
      // We need to fetch memory_type from the database for filtering
      const memoryIds = results.map((r: { id: string }) => r.id);
      const { data: memoryDetails } = await supabase
        .from('memory_entries')
        .select('id, memory_type')
        .in('id', memoryIds);

      if (memoryDetails) {
        const typeMap = new Map(memoryDetails.map((m) => [m.id, m.memory_type]));
        filteredResults = results.filter((r: { id: string }) => typeMap.get(r.id) === memory_type);
      }
    }

    // Update memory access metrics (Hebbian reinforcement)
    const memoryIds = filteredResults.map((r: { id: string }) => r.id);
    if (memoryIds.length > 0) {
      // Fire and forget - don't block on this
      updateMemoryAccess(memoryIds).catch((err) => {
        chatLogger.warn('[search_memory] Failed to update access metrics:', err);
      });
    }

    // Format results for LLM consumption
    type MemorySearchResult = {
      id: string;
      category: string;
      content: string;
      confidence: number;
      source_type: string;
      combined_score: number;
      recency_score: number;
    };

    const formatted = (filteredResults as MemorySearchResult[]).map((r, i) => ({
      index: i + 1,
      content: r.content,
      category: r.category,
      confidence: Math.round(r.confidence * 100) / 100,
      relevance: Math.round(r.combined_score * 100) / 100,
      recency: Math.round(r.recency_score * 100) / 100,
      source: r.source_type,
    }));

    chatLogger.info(`[search_memory] Found ${filteredResults.length} memories`);

    return JSON.stringify({
      success: true,
      message: `Found ${filteredResults.length} relevant memory/memories for "${query}"`,
      results: formatted,
      total: filteredResults.length,
    });
  } catch (error) {
    chatLogger.error('[search_memory] Failed:', error);
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search memory',
    });
  }
}

// ============================================================================
// M3.15: Ask Gemini Implementation
// ============================================================================

type CrossModelQueryType = 'parallel_answer' | 'second_opinion';

type AskGeminiInput = {
  query_type?: CrossModelQueryType;
  question: string;
  include_project_files?: boolean;
  focus_area?: 'architecture' | 'code-review' | 'debugging' | 'best-practices' | 'general';
};

const CROSS_MODEL_ASSISTANT_SYSTEM_PROMPT = `You are a helpful AI assistant.

You are being asked to respond to the user's latest message in an ongoing conversation.

Instructions:
- Answer as a normal assistant (not as a critic of Claude)
- Use the provided conversation history and project context/files
- Do not mention that you were given a transcript/files unless the user asks`;

function truncatePromptForCrossModel(prompt: string, maxChars: number): string {
  if (prompt.length <= maxChars) return prompt;

  const marker = '\n\n[... context truncated due to size limits ...]\n\n';
  const headChars = Math.max(0, Math.floor(maxChars * 0.35));
  const tailChars = Math.max(0, maxChars - headChars - marker.length);

  if (tailChars === 0) {
    return prompt.slice(prompt.length - maxChars);
  }

  return `${prompt.slice(0, headChars)}${marker}${prompt.slice(prompt.length - tailChars)}`;
}

const GEMINI_SYSTEM_PROMPT = `You are a strategic advisor providing a critical second opinion on a conversation between a user and Claude.

Your role:
1. Think critically and pragmatically - challenge assumptions, question the approach
2. Offer your honest perspective - agree, disagree, or provide alternatives
3. Be concise but thorough (aim for 200-500 words)
4. Highlight blind spots, risks, and considerations that might have been missed
5. If you agree with the approach, say so briefly and focus on what could go wrong

Mindset:
- Act as a skeptical but constructive strategic advisor
- Prioritize practical outcomes over theoretical elegance
- Consider real-world constraints: time, complexity, maintenance burden
- Ask "what could go wrong?" and "is this the simplest solution?"
- Challenge over-engineering and unnecessary complexity

Guidelines:
- Be direct and substantive - no filler phrases or false validation
- If you see issues, point them out clearly and constructively
- Provide specific, actionable suggestions when possible
- Consider edge cases, failure modes, and long-term implications
- Format your response as a direct answer to the question`;

/**
 * Ask Gemini 3.0 Pro for a second opinion
 * M3.15: Cross-model consultation during chat
 */
async function askGemini(
  input: Record<string, unknown>,
  context?: ToolExecutionContext
): Promise<string> {
  const {
    query_type,
    question,
    include_project_files = true,
    focus_area = 'general',
  } = input as AskGeminiInput;

  const queryType: CrossModelQueryType = query_type ?? 'second_opinion';

  chatLogger.info(`[ask_gemini] Question: "${question}"`, {
    queryType,
    include_project_files,
    focus_area,
  });

  // Validate input
  if (!question || question.length < 10) {
    return JSON.stringify({
      success: false,
      error: 'Question must be at least 10 characters',
    });
  }

  if (question.length > 2000) {
    return JSON.stringify({
      success: false,
      error: 'Question must be less than 2000 characters',
    });
  }

  try {
    // Build context for Gemini
    const contextParts: string[] = [];

    // 1. Add project summary (if available)
    if (context?.projectContext) {
      const projectName = context.projectContext.projectName || 'Current Project';
      const summaryParts: string[] = [`Project: ${projectName}`];

      if (context.projectContext.projectId) {
        summaryParts.push(`Project ID: ${context.projectContext.projectId}`);
      }

      if (context.projectContext.customInstructions?.trim()) {
        summaryParts.push(`Custom Instructions:\n${context.projectContext.customInstructions.trim()}`);
      }

      contextParts.push(`## Project Summary\n${summaryParts.join('\n')}`);
    }

    // 2. Add full project files context (if enabled and available)
    if (include_project_files && context?.projectContext?.files?.length) {
      const filesBlock = context.projectContext.files
        .map(
          (file) =>
            `<file name="${file.filename}">
${file.content_text}
</file>`
        )
        .join('\n\n');

      contextParts.push(`## Project Files (${context.projectContext.files.length})
<project_files>
${filesBlock}
</project_files>`);
    }

    // 3. Add full conversation transcript (optionally excluding trailing assistant message)
    if (context?.messages?.length) {
      let transcriptMessages = context.messages;
      if (queryType === 'parallel_answer') {
        while (
          transcriptMessages.length > 0 &&
          transcriptMessages[transcriptMessages.length - 1]?.role === 'assistant'
        ) {
          transcriptMessages = transcriptMessages.slice(0, -1);
        }
      }

      const conversationContext = transcriptMessages
        .map((m) => `[${m.role.toUpperCase()}]: ${m.content}`)
        .join('\n\n');

      contextParts.push(`## Conversation Transcript\n${conversationContext}`);
    }

    // 4. Include Claude's latest reply (second_opinion only)
    if (queryType === 'second_opinion' && context?.claudeLatestReply?.trim()) {
      contextParts.push(`## Claude Latest Reply (to evaluate)\n${context.claudeLatestReply.trim()}`);
    }

    // 5. Add focus area hint (second_opinion only)
    const focusHints: Record<string, string> = {
      architecture: 'Focus on system design, patterns, scalability, and maintainability.',
      'code-review': 'Focus on code quality, bugs, edge cases, and best practices.',
      debugging: 'Focus on identifying the root cause and potential solutions.',
      'best-practices': 'Focus on industry standards, conventions, and recommendations.',
      general: 'Provide a general perspective on the question.',
    };

    const taskSection =
      queryType === 'parallel_answer'
        ? `## User Message To Answer\n${question}\n\n## Output Instructions\nAnswer as a normal assistant.`
        : `## Question for Second Opinion\n${question}\n\n## Focus Area\n${focusHints[focus_area]}`;

    const prompt = `${contextParts.length > 0 ? contextParts.join('\n\n---\n\n') + '\n\n---\n\n' : ''}${taskSection}\n`;

    const systemPrompt =
      queryType === 'parallel_answer' ? CROSS_MODEL_ASSISTANT_SYSTEM_PROMPT : GEMINI_SYSTEM_PROMPT;

    // Token limit for context (leave room for response)
    const maxContextChars = 800000; // Gemini supports very large contexts, but keep a hard cap for safety
    const truncatedPrompt = truncatePromptForCrossModel(prompt, maxContextChars);

    chatLogger.debug(`[ask_gemini] Prompt length: ${truncatedPrompt.length} chars`);

    // Call Gemini via AI Gateway
    // Note: AI SDK v5 doesn't expose maxTokens in generateText - relying on system prompt guidance
    const { text, usage } = await generateText({
      model: getModel('google/gemini-3-pro-preview'),
      system: systemPrompt,
      prompt: truncatedPrompt,
      temperature: 0.7, // Allow some creativity
    });

    chatLogger.info(`[ask_gemini] Response received (${text.length} chars)`, {
      inputTokens: usage?.inputTokens,
      outputTokens: usage?.outputTokens,
    });

    // Format response for collapsible display
    return JSON.stringify({
      success: true,
      gemini_response: text,
      query_type: queryType,
      focus_area,
      context_included: {
        messages: context?.messages?.length || 0,
        project_files: include_project_files ? context?.projectContext?.files?.length || 0 : 0,
        claude_latest_reply: queryType === 'second_opinion' ? Boolean(context?.claudeLatestReply?.trim()) : false,
      },
      // UI hints for rendering
      display_format: 'collapsible_quote',
      display_title:
        queryType === 'parallel_answer' ? 'Gemini 3 Pro (Independent Answer)' : 'Gemini 3 Pro Second Opinion',
    });
  } catch (error) {
    chatLogger.error('[ask_gemini] Failed:', error);

    // Provide actionable error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isRateLimit = errorMessage.includes('rate') || errorMessage.includes('429');
    const isTimeout = errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT');

    return JSON.stringify({
      success: false,
      error: isRateLimit
        ? 'Gemini rate limit reached. Please try again in a moment.'
        : isTimeout
          ? 'Gemini request timed out. The service may be busy.'
          : `Failed to get Gemini response: ${errorMessage}`,
    });
  }
}

// ============================================================================
// M3.16: Ask ChatGPT Implementation
// ============================================================================

type AskChatGPTInput = {
  query_type?: CrossModelQueryType;
  question: string;
  include_project_files?: boolean;
  focus_area?: 'architecture' | 'code-review' | 'debugging' | 'best-practices' | 'general';
};

const CHATGPT_SYSTEM_PROMPT = `You are a strategic advisor providing a critical second opinion on a conversation between a user and Claude.

Your role:
1. Think critically and pragmatically - challenge assumptions, question the approach
2. Offer your honest perspective - agree, disagree, or provide alternatives
3. Be concise but thorough (aim for 200-500 words)
4. Highlight blind spots, risks, and considerations that might have been missed
5. If you agree with the approach, say so briefly and focus on what could go wrong

Mindset:
- Act as a skeptical but constructive strategic advisor
- Prioritize practical outcomes over theoretical elegance
- Consider real-world constraints: time, complexity, maintenance burden
- Ask "what could go wrong?" and "is this the simplest solution?"
- Challenge over-engineering and unnecessary complexity

Guidelines:
- Be direct and substantive - no filler phrases or false validation
- If you see issues, point them out clearly and constructively
- Provide specific, actionable suggestions when possible
- Consider edge cases, failure modes, and long-term implications
- Format your response as a direct answer to the question`;

/**
 * Ask ChatGPT (GPT-5.2) for a second opinion
 * M3.16: Cross-model consultation during chat
 */
async function askChatGPT(
  input: Record<string, unknown>,
  context?: ToolExecutionContext
): Promise<string> {
  const {
    query_type,
    question,
    include_project_files = true,
    focus_area = 'general',
  } = input as AskChatGPTInput;

  const queryType: CrossModelQueryType = query_type ?? 'second_opinion';

  chatLogger.info(`[ask_chatgpt] Question: "${question}"`, {
    queryType,
    include_project_files,
    focus_area,
  });

  // Validate input
  if (!question || question.length < 10) {
    return JSON.stringify({
      success: false,
      error: 'Question must be at least 10 characters',
    });
  }

  if (question.length > 2000) {
    return JSON.stringify({
      success: false,
      error: 'Question must be less than 2000 characters',
    });
  }

  try {
    // Build context for ChatGPT
    const contextParts: string[] = [];

    // 1. Add project summary (if available)
    if (context?.projectContext) {
      const projectName = context.projectContext.projectName || 'Current Project';
      const summaryParts: string[] = [`Project: ${projectName}`];

      if (context.projectContext.projectId) {
        summaryParts.push(`Project ID: ${context.projectContext.projectId}`);
      }

      if (context.projectContext.customInstructions?.trim()) {
        summaryParts.push(`Custom Instructions:\n${context.projectContext.customInstructions.trim()}`);
      }

      contextParts.push(`## Project Summary\n${summaryParts.join('\n')}`);
    }

    // 2. Add full project files context (if enabled and available)
    if (include_project_files && context?.projectContext?.files?.length) {
      const filesBlock = context.projectContext.files
        .map(
          (file) =>
            `<file name="${file.filename}">
${file.content_text}
</file>`
        )
        .join('\n\n');

      contextParts.push(`## Project Files (${context.projectContext.files.length})
<project_files>
${filesBlock}
</project_files>`);
    }

    // 3. Add full conversation transcript (optionally excluding trailing assistant message)
    if (context?.messages?.length) {
      let transcriptMessages = context.messages;
      if (queryType === 'parallel_answer') {
        while (
          transcriptMessages.length > 0 &&
          transcriptMessages[transcriptMessages.length - 1]?.role === 'assistant'
        ) {
          transcriptMessages = transcriptMessages.slice(0, -1);
        }
      }

      const conversationContext = transcriptMessages
        .map((m) => `[${m.role.toUpperCase()}]: ${m.content}`)
        .join('\n\n');

      contextParts.push(`## Conversation Transcript\n${conversationContext}`);
    }

    // 4. Include Claude's latest reply (second_opinion only)
    if (queryType === 'second_opinion' && context?.claudeLatestReply?.trim()) {
      contextParts.push(`## Claude Latest Reply (to evaluate)\n${context.claudeLatestReply.trim()}`);
    }

    // 5. Add focus area hint (second_opinion only)
    const focusHints: Record<string, string> = {
      architecture: 'Focus on system design, patterns, scalability, and maintainability.',
      'code-review': 'Focus on code quality, bugs, edge cases, and best practices.',
      debugging: 'Focus on identifying the root cause and potential solutions.',
      'best-practices': 'Focus on industry standards, conventions, and recommendations.',
      general: 'Provide a general perspective on the question.',
    };

    const taskSection =
      queryType === 'parallel_answer'
        ? `## User Message To Answer\n${question}\n\n## Output Instructions\nAnswer as a normal assistant.`
        : `## Question for Second Opinion\n${question}\n\n## Focus Area\n${focusHints[focus_area]}`;

    const prompt = `${contextParts.length > 0 ? contextParts.join('\n\n---\n\n') + '\n\n---\n\n' : ''}${taskSection}\n`;

    const systemPrompt =
      queryType === 'parallel_answer' ? CROSS_MODEL_ASSISTANT_SYSTEM_PROMPT : CHATGPT_SYSTEM_PROMPT;

    // Token limit for context (leave room for response)
    const maxContextChars = 400000; // Keep a hard cap for safety (OpenAI context is large, but requests can get huge with files)
    const truncatedPrompt = truncatePromptForCrossModel(prompt, maxContextChars);

    chatLogger.debug(`[ask_chatgpt] Prompt length: ${truncatedPrompt.length} chars`);

    // Call ChatGPT via AI Gateway
    // Note: AI SDK v5 doesn't expose maxTokens in generateText - relying on system prompt guidance
    const { text, usage } = await generateText({
      model: getModel('openai/gpt-5.2'),
      system: systemPrompt,
      prompt: truncatedPrompt,
      temperature: 0.7,
    });

    chatLogger.info(`[ask_chatgpt] Response received (${text.length} chars)`, {
      inputTokens: usage?.inputTokens,
      outputTokens: usage?.outputTokens,
    });

    return JSON.stringify({
      success: true,
      chatgpt_response: text,
      query_type: queryType,
      focus_area,
      context_included: {
        messages: context?.messages?.length || 0,
        project_files: include_project_files ? context?.projectContext?.files?.length || 0 : 0,
        claude_latest_reply: queryType === 'second_opinion' ? Boolean(context?.claudeLatestReply?.trim()) : false,
      },
      display_format: 'collapsible_quote',
      display_title:
        queryType === 'parallel_answer'
          ? 'ChatGPT (GPT-5.2) (Independent Answer)'
          : 'ChatGPT (GPT-5.2) Second Opinion',
    });
  } catch (error) {
    chatLogger.error('[ask_chatgpt] Failed:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isRateLimit = errorMessage.includes('rate') || errorMessage.includes('429');
    const isTimeout = errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT');

    return JSON.stringify({
      success: false,
      error: isRateLimit
        ? 'ChatGPT rate limit reached. Please try again in a moment.'
        : isTimeout
          ? 'ChatGPT request timed out. The service may be busy.'
          : `Failed to get ChatGPT response: ${errorMessage}`,
    });
  }
}

// ============================================================================
// M3.17: Review Chat Implementation
// ============================================================================

type ReviewChatInput = {
  chat_id: string;
  include_system_messages?: boolean;
  max_messages?: number;
};

/**
 * Extract chat ID from URL or return as-is if already a UUID
 */
function extractChatId(input: string): string | null {
  // UUID pattern
  const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

  // Check if it's a URL containing a chat ID
  if (input.includes('/chat/')) {
    const match = input.match(/\/chat\/([0-9a-f-]+)/i);
    if (match && match[1]) {
      // Validate it looks like a UUID
      if (uuidPattern.test(match[1])) {
        return match[1];
      }
    }
  }

  // Check if it's already a UUID
  if (uuidPattern.test(input)) {
    return input.match(uuidPattern)![0];
  }

  return null;
}

/**
 * Extract text content from message parts (UIMessage format)
 */
function extractMessageText(content: { parts?: Array<{ type: string; text?: string }> }): string {
  if (!content?.parts || !Array.isArray(content.parts)) {
    return '';
  }

  return content.parts
    .filter((part) => part.type === 'text' && part.text)
    .map((part) => part.text)
    .join('\n');
}

/**
 * Review a previous chat conversation
 * M3.17: Cross-chat context retrieval
 */
async function reviewChat(input: Record<string, unknown>): Promise<string> {
  const {
    chat_id: rawChatId,
    include_system_messages = false,
    max_messages = 50,
  } = input as ReviewChatInput;

  chatLogger.info(`[review_chat] Reviewing chat: "${rawChatId}"`, { include_system_messages, max_messages });

  // Validate and extract chat ID
  if (!rawChatId || typeof rawChatId !== 'string') {
    return JSON.stringify({
      success: false,
      error: 'chat_id is required',
    });
  }

  const chatId = extractChatId(rawChatId);
  if (!chatId) {
    return JSON.stringify({
      success: false,
      error: `Could not extract valid chat ID from: "${rawChatId}". Expected UUID format (e.g., abc12345-1234-5678-9abc-def012345678) or URL containing /chat/<id>`,
    });
  }

  const clampedLimit = Math.max(1, Math.min(100, max_messages));

  try {
    // Fetch chat metadata
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .select('id, title, model, created_at, updated_at, project_id')
      .eq('id', chatId)
      .single();

    if (chatError || !chat) {
      chatLogger.warn(`[review_chat] Chat not found: ${chatId}`, chatError);
      return JSON.stringify({
        success: false,
        error: `Chat not found: ${chatId}. Make sure the chat ID is correct and exists.`,
      });
    }

    // Fetch messages
    const messageQuery = supabase
      .from('messages')
      .select('id, role, content, created_at, sequence_number')
      .eq('chat_id', chatId)
      .order('sequence_number', { ascending: true })
      .limit(clampedLimit);

    // Filter out system messages if not requested
    if (!include_system_messages) {
      messageQuery.neq('role', 'system');
    }

    const { data: messages, error: messagesError } = await messageQuery;

    if (messagesError) {
      chatLogger.error(`[review_chat] Failed to fetch messages:`, messagesError);
      return JSON.stringify({
        success: false,
        error: `Failed to fetch messages: ${messagesError.message}`,
      });
    }

    if (!messages || messages.length === 0) {
      return JSON.stringify({
        success: true,
        chat_id: chatId,
        title: chat.title,
        message: 'This chat has no messages yet.',
        messages: [],
      });
    }

    // Format messages for LLM consumption
    type MessageRow = {
      id: string;
      role: string;
      content: { parts?: Array<{ type: string; text?: string }> };
      created_at: string;
      sequence_number: number;
    };

    const formattedMessages = (messages as MessageRow[]).map((m) => ({
      sequence: m.sequence_number,
      role: m.role,
      content: extractMessageText(m.content),
      timestamp: m.created_at,
    }));

    // Build conversation transcript for easy reading
    const transcript = formattedMessages
      .map((m) => `[${m.role.toUpperCase()}]: ${m.content}`)
      .join('\n\n---\n\n');

    chatLogger.info(`[review_chat] Retrieved ${messages.length} messages from chat "${chat.title}"`);

    return JSON.stringify({
      success: true,
      chat_id: chatId,
      title: chat.title,
      model: chat.model,
      project_id: chat.project_id,
      created_at: chat.created_at,
      message_count: messages.length,
      // Include both structured and transcript formats
      messages: formattedMessages,
      transcript: transcript.length > 30000
        ? transcript.slice(0, 30000) + '\n\n... [Transcript truncated]'
        : transcript,
    });
  } catch (error) {
    chatLogger.error('[review_chat] Failed:', error);
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to review chat',
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
