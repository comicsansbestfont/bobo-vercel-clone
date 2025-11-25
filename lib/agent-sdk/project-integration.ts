/**
 * M4-4: Project Context Integration for Agent SDK
 *
 * Injects project context (M2 Loop A) into the agent's system prompt.
 */

import { getProject, getFilesByProject } from '@/lib/db';
import { chatLogger } from '@/lib/logger';

// Token budget for project context (conservative limit)
const PROJECT_CONTEXT_TOKEN_BUDGET = 50000;

/**
 * Build project context string from project files and custom instructions
 */
export async function buildProjectContext(projectId: string): Promise<string> {
  if (!projectId) return '';

  const parts: string[] = [];

  try {
    // Get project details
    const project = await getProject(projectId);
    if (!project) {
      chatLogger.warn(`Project not found: ${projectId}`);
      return '';
    }

    // Add project name header
    parts.push(`### PROJECT: ${project.name}`);

    // Add custom instructions if present
    if (project.custom_instructions) {
      parts.push(`#### Custom Instructions\n${project.custom_instructions}`);
    }

    // Add project description if present
    if (project.description) {
      parts.push(`#### Description\n${project.description}`);
    }

    // Get project files (Loop A context)
    const files = await getFilesByProject(projectId);

    if (files && files.length > 0) {
      let totalTokenEstimate = 0;
      const fileContents: string[] = [];

      for (const file of files) {
        // Estimate tokens (rough: 1 token per 4 chars)
        const tokenEstimate = Math.ceil((file.content_text?.length || 0) / 4);

        if (totalTokenEstimate + tokenEstimate > PROJECT_CONTEXT_TOKEN_BUDGET) {
          chatLogger.warn(`Project context exceeds token budget, truncating files`);
          break;
        }

        totalTokenEstimate += tokenEstimate;

        if (file.content_text) {
          fileContents.push(`##### ${file.filename}\n\`\`\`\n${file.content_text}\n\`\`\``);
        }
      }

      if (fileContents.length > 0) {
        parts.push(`#### Project Files (${fileContents.length} files)\n${fileContents.join('\n\n')}`);
      }
    }
  } catch (err) {
    chatLogger.error('Failed to build project context for agent:', err);
  }

  return parts.join('\n\n');
}

/**
 * Get a summary of project files without full content (for token-constrained contexts)
 */
export async function getProjectFileSummary(projectId: string): Promise<string> {
  if (!projectId) return '';

  try {
    const files = await getFilesByProject(projectId);

    if (!files || files.length === 0) {
      return 'No files in project.';
    }

    const fileSummary = files.map(f => `- ${f.filename} (${f.content_text?.length || 0} chars)`).join('\n');
    return `Project has ${files.length} files:\n${fileSummary}`;
  } catch (err) {
    chatLogger.error('Failed to get project file summary:', err);
    return '';
  }
}
