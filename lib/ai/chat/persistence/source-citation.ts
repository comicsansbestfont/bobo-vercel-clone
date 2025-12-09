/**
 * Source Citation Builder
 *
 * Builds and applies inline citations from various sources.
 * M40-02: Extracted from duplicated citation logic in route.ts
 */

import {
  trackProjectSources,
  trackGlobalSources,
  trackProjectConversations,
  insertInlineCitations,
  citationsToMessageParts,
  type Citation,
} from '@/lib/ai/source-tracker';
import { getProjectNamesForSearchResults } from '../search-coordinator';
import type { ProjectContext } from '@/lib/ai/context-manager';
import type {
  MessagePart,
  SearchResult,
  ProjectMessageSearchResult,
} from '@/lib/db';

// ============================================================================
// CITATION BUILDING
// ============================================================================

export interface BuildCitationsOptions {
  assistantText: string;
  projectContext: ProjectContext | null;
  projectName: string;
  projectChatResults: ProjectMessageSearchResult[];
  searchResults: SearchResult[];
  activeProjectId: string | null;
}

export interface CitationResult {
  finalText: string;
  citations: Citation[];
  sourceParts: MessagePart[];
}

/**
 * Build all citations for an assistant response.
 * Tracks project sources (Loop A), conversation sources, and global sources (Loop B).
 */
export async function buildCitations(
  options: BuildCitationsOptions
): Promise<CitationResult> {
  const {
    assistantText,
    projectContext,
    projectName,
    projectChatResults,
    searchResults,
    activeProjectId,
  } = options;

  const allCitations: Citation[] = [];

  // Track project sources (Loop A)
  if (projectContext && projectContext.files.length > 0) {
    const projectCitations = trackProjectSources(assistantText, projectContext, projectName);
    allCitations.push(...projectCitations);
  }

  // Track project conversation sources (Intra-Project)
  if (projectChatResults.length > 0 && activeProjectId) {
    const conversationCitations = trackProjectConversations(
      projectChatResults,
      activeProjectId,
      projectName,
      allCitations.length + 1
    );
    allCitations.push(...conversationCitations);
  }

  // Track global sources (Loop B)
  if (searchResults.length > 0) {
    const projectNamesMap = await getProjectNamesForSearchResults(searchResults);
    const globalCitations = await trackGlobalSources(
      searchResults,
      projectNamesMap,
      allCitations.length + 1
    );
    allCitations.push(...globalCitations);
  }

  // Insert inline citations if any sources were found
  let finalText = assistantText;
  if (allCitations.length > 0) {
    const citationResult = insertInlineCitations(assistantText, allCitations);
    finalText = citationResult.text;
  }

  // Build source parts for message
  const sourceParts = allCitations.length > 0 ? citationsToMessageParts(allCitations) : [];

  return {
    finalText,
    citations: allCitations,
    sourceParts,
  };
}

/**
 * Apply citations to assistant message parts.
 * Updates the text part with cited text and appends source parts.
 */
export function applyCitations(
  assistantParts: MessagePart[],
  citationResult: CitationResult
): MessagePart[] {
  const { finalText, sourceParts } = citationResult;
  const updatedParts = [...assistantParts];

  // Replace text parts with citation-enhanced text
  const textPartIndex = updatedParts.findIndex((p) => p.type === 'text');
  if (textPartIndex >= 0) {
    updatedParts[textPartIndex] = { ...updatedParts[textPartIndex], text: finalText };
  }

  // Append source metadata as separate parts
  updatedParts.push(...sourceParts);

  return updatedParts;
}
