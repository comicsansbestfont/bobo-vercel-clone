/**
 * Context Builder
 *
 * Builds the comprehensive system prompt and context for chat.
 * M40-02: Extracted from route.ts lines 380-670
 */

import {
  getChat,
  getProject,
  getProjects,
  getUserProfile,
  getUserMemories,
  type Project,
} from '@/lib/db';
import { getProjectContext, prepareSystemPrompt, type ProjectContext } from '@/lib/ai/context-manager';
import { buildSystemPrompt } from '@/lib/ai/system-prompt';
import { detectContentCreationIntent } from '@/lib/ai/content-detection';
import { getContentCreationContext } from '@/lib/ai/identity-context';
import { chatLogger } from '@/lib/logger';
import { performSearches } from './search-coordinator';
import type { ChatContext } from './types';
import { isQuestion, getSimilarQuestions, formatSimilarQuestionsContext } from '@/lib/ai/similar-questions';

// ============================================================================
// CONTEXT BUILDING
// ============================================================================

export interface BuildContextOptions {
  chatId: string;
  projectId?: string;
  userText: string;
  model: string;
}

/**
 * Build the complete chat context including system prompt, project context, and search results.
 * Parallelizes independent data fetches for performance.
 */
export async function buildChatContext(
  options: BuildContextOptions
): Promise<ChatContext> {
  const { chatId, projectId, userText, model } = options;

  // PARALLELIZED: Fetch chat, user profile, memories, and projects concurrently
  chatLogger.info('[Chat] Starting parallel data fetch...');

  const [chat, profile, memories, allProjects] = await Promise.all([
    getChat(chatId),
    getUserProfile().catch((err) => {
      chatLogger.error('Failed to load user profile:', err);
      return null;
    }),
    getUserMemories({ relevance_threshold: 0.2, limit: 50 }).catch((err) => {
      chatLogger.error('Failed to fetch user memories:', err);
      return [];
    }),
    getProjects().catch((err) => {
      chatLogger.error('[Chat] getProjects() threw error:', err);
      return [] as Project[];
    }),
  ]);

  chatLogger.info('[Chat] Parallel fetch complete', {
    hasChat: !!chat,
    hasProfile: !!profile,
    memoriesCount: memories.length,
    projectsCount: allProjects.length,
  });

  // Determine active project and get custom instructions
  let activeProjectId = projectId || null;
  let customInstructions = '';

  if (chat?.project_id) {
    activeProjectId = chat.project_id;
    const project = await getProject(chat.project_id);
    if (project?.custom_instructions) {
      customInstructions = project.custom_instructions;
    }
  }

  // Build context parts
  const userProfileContext = buildUserProfileContext(profile);
  const userMemoryContext = buildUserMemoryContext(memories);
  const projectsOverviewContext = buildProjectsOverviewContext(allProjects);

  // M3.9-Identity: Detect content creation intent
  let identityContext: string | null = null;
  if (userText && detectContentCreationIntent(userText)) {
    chatLogger.info('[Identity] Content creation detected, fetching voice & tone guide');
    identityContext = await getContentCreationContext();
    if (identityContext) {
      chatLogger.info('[Identity] Voice & tone guide loaded', { length: identityContext.length });
    }
  }

  // M3.13-08: Similar Questions - Detect if user is asking a question
  let similarQuestionsContext: string | null = null;
  if (userText && isQuestion(userText)) {
    chatLogger.info('[SimilarQuestions] Question detected, fetching similar questions');
    try {
      const similarQuestions = await getSimilarQuestions(userText, 3);
      if (similarQuestions.length > 0) {
        similarQuestionsContext = formatSimilarQuestionsContext(similarQuestions);
        chatLogger.info('[SimilarQuestions] Added similar questions to context', {
          count: similarQuestions.length,
        });
      } else {
        chatLogger.info('[SimilarQuestions] No similar questions found');
      }
    } catch (error) {
      // Fail gracefully - don't break chat if similar questions fails
      chatLogger.error('[SimilarQuestions] Error fetching similar questions:', error);
    }
  }

  // Build base system prompt
  let systemPrompt = buildSystemPrompt({
    customInstructions: customInstructions || undefined,
    userProfileContext: userProfileContext || undefined,
    userMemoryContext: userMemoryContext || undefined,
    identityContext: identityContext || undefined,
  });

  // Add projects overview
  if (projectsOverviewContext) {
    systemPrompt += projectsOverviewContext;
    chatLogger.info('[Projects] Added projects overview to system prompt');
  }

  // M3.13-08: Add similar questions context if available
  if (similarQuestionsContext) {
    systemPrompt += similarQuestionsContext;
    chatLogger.info('[SimilarQuestions] Injected similar questions into system prompt');
  }

  // Load project context if available
  let projectContext: ProjectContext | null = null;
  let projectName = '';

  if (activeProjectId) {
    try {
      projectContext = await getProjectContext(activeProjectId);
      const project = await getProject(activeProjectId);
      projectName = project?.name || 'Current Project';

      // Apply model-specific optimizations
      const prepared = prepareSystemPrompt(systemPrompt, projectContext, model);
      systemPrompt = prepared.system;
    } catch (err) {
      chatLogger.error('Failed to load project context:', err);
    }
  }

  // Perform searches (parallelized in search-coordinator)
  const searchResult = await performSearches({
    chatId,
    activeProjectId,
    userText,
  });

  const { projectChatResults, searchResults, queryEmbedding } = searchResult;

  // Process intra-project chat context
  if (projectChatResults.length > 0) {
    const snippets = projectChatResults
      .map((r) => `[${r.chat_title}]: ${r.content}`)
      .join('\n');

    systemPrompt += `
### RELATED CONVERSATIONS IN THIS PROJECT
The following are relevant excerpts from your OTHER conversations in this project.
<project_conversations>
${snippets}
</project_conversations>
INSTRUCTION: Use these to maintain continuity across conversations in this project.
`;
  }

  // Process global search context
  if (searchResults.length > 0) {
    const globalSnippets = searchResults
      .filter((r) => r.source_type === 'global')
      .map((r) => `- ${r.content}`)
      .join('\n');

    if (globalSnippets) {
      systemPrompt += `

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
  }

  return {
    activeChatId: chatId,
    activeProjectId,
    systemPrompt,
    projectContext,
    projectName,
    searchResults,
    projectChatResults,
    queryEmbedding,
    customInstructions,
  };
}

// ============================================================================
// CONTEXT PART BUILDERS
// ============================================================================

/**
 * Build user profile context string
 */
function buildUserProfileContext(
  profile: Awaited<ReturnType<typeof getUserProfile>> | null
): string {
  if (!profile) return '';

  const parts: string[] = [];
  if (profile.bio) parts.push(`BIO:\n${profile.bio}`);
  if (profile.background) parts.push(`BACKGROUND & EXPERTISE:\n${profile.background}`);
  if (profile.preferences) parts.push(`PREFERENCES:\n${profile.preferences}`);
  if (profile.technical_context) parts.push(`TECHNICAL CONTEXT:\n${profile.technical_context}`);

  if (parts.length === 0) return '';

  return `\n\n### ABOUT THE USER\n${parts.join('\n\n')}`;
}

/**
 * Build user memory context string
 */
function buildUserMemoryContext(
  memories: Awaited<ReturnType<typeof getUserMemories>>
): string {
  if (memories.length === 0) return '';

  const sections: Record<string, string[]> = {
    work_context: [],
    personal_context: [],
    top_of_mind: [],
    brief_history: [],
    long_term_background: [],
    other_instructions: [],
  };

  // Group by category
  for (const memory of memories) {
    if (sections[memory.category]) {
      sections[memory.category].push(`- ${memory.content}`);
    }
  }

  const parts: string[] = [];
  if (sections.work_context.length > 0) {
    parts.push(`WORK CONTEXT:\n${sections.work_context.slice(0, 5).join('\n')}`);
  }
  if (sections.personal_context.length > 0) {
    parts.push(`PERSONAL CONTEXT:\n${sections.personal_context.slice(0, 5).join('\n')}`);
  }
  if (sections.top_of_mind.length > 0) {
    parts.push(`TOP OF MIND:\n${sections.top_of_mind.slice(0, 5).join('\n')}`);
  }
  if (sections.brief_history.length > 0) {
    parts.push(`BRIEF HISTORY:\n${sections.brief_history.slice(0, 5).join('\n')}`);
  }
  if (sections.long_term_background.length > 0) {
    parts.push(`BACKGROUND:\n${sections.long_term_background.slice(0, 5).join('\n')}`);
  }
  if (sections.other_instructions.length > 0) {
    parts.push(`PREFERENCES:\n${sections.other_instructions.slice(0, 5).join('\n')}`);
  }

  if (parts.length === 0) return '';

  return `\n\n### USER MEMORY (Automatic)\n${parts.join('\n\n')}`;
}

/**
 * Build projects overview context string
 */
function buildProjectsOverviewContext(projects: Project[]): string {
  if (projects.length === 0) {
    chatLogger.warn('[Projects] No projects found for user');
    return '';
  }

  chatLogger.info('[Projects] Fetched projects for context:', {
    count: projects.length,
    names: projects.map((p) => p.name),
  });

  const projectBriefings = projects
    .map((p) => {
      const type =
        p.entity_type === 'deal'
          ? '📊 Deal'
          : p.entity_type === 'client'
            ? '👥 Client'
            : '📁 Project';

      // Include custom_instructions (AI summary) if available
      let summary = '';
      if (p.custom_instructions) {
        const truncated = p.custom_instructions.substring(0, 600);
        const lastSentence = truncated.lastIndexOf('.');
        summary = lastSentence > 200 ? truncated.substring(0, lastSentence + 1) : truncated;
        if (summary.length < p.custom_instructions.length) {
          summary += '...';
        }
      } else if (p.description) {
        summary = p.description;
      }

      return `#### ${type}: ${p.name}\n${summary}`;
    })
    .join('\n\n');

  return `\n\n### YOUR PROJECTS
You have ${projects.length} project${projects.length === 1 ? '' : 's'}. Here is your briefing on each:

${projectBriefings}

---
INSTRUCTION: When the user asks about their projects, deals, or clients, use this briefing to provide informed answers. You know the key details about each project including company snapshots, status, and red flags.`;
}
