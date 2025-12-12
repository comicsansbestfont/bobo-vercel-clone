import { getFilesByProject, getAdvisoryFilesByPath, getProject } from '@/lib/db/queries';
import { CoreMessage, CoreSystemMessage } from 'ai';
import { chatLogger } from '@/lib/logger';

/**
 * Context Manager
 *
 * Handles the "Loop A" (Project Loop) of the Double-Loop architecture.
 * Responsible for fetching project context and preparing it for the LLM,
 * applying caching strategies where supported (Anthropic, Gemini).
 *
 * M38: Extended to support advisory projects.
 * Advisory files are pre-indexed in the database with embeddings.
 * Query by folder path pattern instead of file system read (Vercel compatible).
 */

export interface ProjectContext {
    projectId: string;
    files: Array<{
        id: string;
        filename: string;
        content_text: string;
    }>;
    totalTokens: number;
    isAdvisory?: boolean;
}

/**
 * Fetch all files for a project to build the context
 *
 * For advisory projects (with advisory_folder_path), reads master doc from file system.
 * For regular projects, reads from the files database table.
 */
export async function getProjectContext(projectId: string): Promise<ProjectContext> {
    // First, check if this is an advisory project
    const project = await getProject(projectId);

    // M38: Advisory projects - query from database by path pattern
    // Files are pre-indexed via `npm run index-advisory` with full paths as filenames
    if (project?.advisory_folder_path) {
        const advisoryFiles = await getAdvisoryFilesByPath(project.advisory_folder_path);

        if (advisoryFiles.length > 0) {
            chatLogger.debug(`Found ${advisoryFiles.length} advisory files for ${project.advisory_folder_path}`);

            // Sort by priority: Meetings first, then Comms, then others
            const priorityOrder = ['Meetings', 'Comms', 'Engagements', 'Strategy', 'Valuation', 'Docs'];
            const sortedFiles = [...advisoryFiles].sort((a, b) => {
                const aPriority = priorityOrder.findIndex(p => a.filename.includes(p));
                const bPriority = priorityOrder.findIndex(p => b.filename.includes(p));
                if (aPriority !== -1 && bPriority === -1) return -1;
                if (aPriority === -1 && bPriority !== -1) return 1;
                if (aPriority !== bPriority) return aPriority - bPriority;
                return b.filename.localeCompare(a.filename); // Recent files first
            });

            // Calculate total tokens
            const totalTokens = sortedFiles.reduce((acc, f) => acc + (f.content_text?.length || 0) / 4, 0);

            return {
                projectId,
                files: sortedFiles.map(f => ({
                    id: f.id,
                    filename: f.filename.replace(`${project.advisory_folder_path}/`, ''), // Use relative path
                    content_text: f.content_text || '',
                })),
                totalTokens,
                isAdvisory: true,
            };
        } else {
            chatLogger.warn(`No indexed files found for ${project.advisory_folder_path}`);
        }
    }

    // Regular projects: read from database (existing behavior)
    const files = await getFilesByProject(projectId);

    // Calculate rough token count (4 chars ~= 1 token)
    const totalTokens = files.reduce((acc, file) => {
        return acc + (file.content_text.length / 4);
    }, 0);

    return {
        projectId,
        files: files.map(f => ({
            id: f.id,
            filename: f.filename,
            content_text: f.content_text
        })),
        totalTokens,
        isAdvisory: false,
    };
}

/**
 * Prepare the system prompt with project context
 * Handles provider-specific caching logic
 */
export function prepareSystemPrompt(
    baseSystemPrompt: string,
    context: ProjectContext,
    modelId: string
): { system: string; messages?: CoreMessage[] } {
    const isAnthropic = modelId?.includes('claude') ?? false;
    const isGemini = modelId?.includes('gemini') ?? false;

    // Format the context block
    const contextBlock = context.files.map(f => `
<file name="${f.filename}">
${f.content_text}
</file>
`).join('\n');

    const fullSystemPrompt = `${baseSystemPrompt}

### ACTIVE PROJECT CONTEXT
The user is currently working on Project ID: ${context.projectId}
The following files are pinned to your memory as the AUTHORITATIVE source of truth for this project.

<project_files>
${contextBlock}
</project_files>
`;

    // Strategy 1: Anthropic Prompt Caching
    // We use the "cache-control" breakpoint at the end of the huge context block
    if (isAnthropic && context.files.length > 0) {
        return {
            system: fullSystemPrompt,
            // For Anthropic via AI SDK, we might need to pass cache headers specifically
            // or structure the message content with cache control.
            // Currently, Vercel AI SDK handles this via specific message structures or headers.
            // For now, we return the full prompt. The actual caching header injection 
            // happens in the API route or via the provider config.
            // Note: As of late 2024, Vercel AI SDK supports 'experimental_providerMetadata'
        };
    }

    // Strategy 2: Gemini Caching
    // Gemini automatically caches long context if repeated, or uses explicit caching API.
    // For the Vercel AI SDK, we rely on the provider's native behavior or standard context window.
    if (isGemini) {
        return {
            system: fullSystemPrompt
        };
    }

    // Strategy 3: Standard Fallback (OpenAI, etc.)
    // Just inject the text.
    return {
        system: fullSystemPrompt
    };
}
