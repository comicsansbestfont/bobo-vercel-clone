/**
 * Source Tracker
 *
 * Intelligent source tracking for the Double-Loop architecture.
 * Analyzes AI responses to determine which sources were actually used,
 * and inserts inline Perplexity-style citations.
 */

import type { MessagePart, SearchResult } from '@/lib/db/types';
import type { ProjectContext } from './context-manager';

/**
 * Citation data structure for tracking inline references
 */
export interface Citation {
  index: number;              // [1], [2], [3]...
  type: 'project-source' | 'global-source';
  sourceId: string;
  sourceType: 'project-file' | 'global-file' | 'global-message';
  sourceTitle: string;
  projectId?: string;
  projectName?: string;
  similarity?: number;
  positions: number[];        // Character positions where citations appear in text
}

/**
 * Result of inline citation insertion
 */
export interface CitationResult {
  text: string;               // Modified text with [1], [2] markers
  citations: Citation[];      // Ordered list of all citations
}

/**
 * Track which project files were actually referenced in the AI response
 * Uses filename matching and content similarity heuristics
 */
export function trackProjectSources(
  responseText: string,
  projectContext: ProjectContext,
  projectName: string
): Citation[] {
  const citations: Citation[] = [];
  let citationIndex = 1;

  for (const file of projectContext.files) {
    // Check if the file was referenced by name
    const filenameWithoutExt = file.filename.replace(/\.md$/i, '');
    const filenameRegex = new RegExp(`\\b${escapeRegex(filenameWithoutExt)}\\b`, 'i');

    // Check if filename or distinctive content appears in response
    const isReferencedByName = filenameRegex.test(responseText);
    const isReferencedByContent = checkContentSimilarity(responseText, file.content_text);

    if (isReferencedByName || isReferencedByContent) {
      citations.push({
        index: citationIndex++,
        type: 'project-source',
        sourceId: file.id,
        sourceType: 'project-file',
        sourceTitle: file.filename,
        projectId: projectContext.projectId,
        projectName,
        positions: [], // Will be filled by insertInlineCitations
      });
    }
  }

  return citations;
}

/**
 * Track global sources from hybrid search results
 */
export function trackGlobalSources(
  searchResults: SearchResult[],
  projectNames: Map<string, string>, // projectId -> projectName mapping
  startingIndex: number = 1
): Citation[] {
  const citations: Citation[] = [];

  // Only include global sources (not current project)
  const globalResults = searchResults.filter(r => r.source_type === 'global');

  globalResults.forEach((result, i) => {
    // Determine source type from ID pattern or other metadata
    // For now, assume files. Can be enhanced later.
    const sourceType = 'global-file'; // TODO: Detect if it's a message

    citations.push({
      index: startingIndex + i,
      type: 'global-source',
      sourceId: result.id,
      sourceType,
      sourceTitle: result.content.substring(0, 60) + (result.content.length > 60 ? '...' : ''),
      projectName: projectNames.get(result.id.split('-')[0]), // Simplified - should query DB
      similarity: result.similarity,
      positions: [], // Will be filled by insertInlineCitations
    });
  });

  return citations;
}

/**
 * Insert inline citation markers [1], [2] into the response text
 * Strategy: Insert citations after sentences that reference the source
 */
export function insertInlineCitations(
  responseText: string,
  citations: Citation[]
): CitationResult {
  let modifiedText = responseText;
  const citationMap = new Map<number, Citation>();

  citations.forEach(citation => {
    citationMap.set(citation.index, citation);
  });

  // Find insertion points for each citation
  // Strategy 1: Insert after mentions of source title/filename
  for (const citation of citations) {
    if (citation.sourceTitle) {
      const titleWithoutExt = citation.sourceTitle.replace(/\.md$/i, '');
      const titleRegex = new RegExp(
        `(\\b${escapeRegex(titleWithoutExt)}\\b[^.!?]*[.!?])`,
        'gi'
      );

      modifiedText = modifiedText.replace(titleRegex, (match, sentence) => {
        // Record position
        citation.positions.push(modifiedText.indexOf(match));
        return `${sentence}[${citation.index}]`;
      });
    }
  }

  // Strategy 2: If no citations inserted yet, use content-based heuristics
  // Look for sentences that likely came from the source
  for (const citation of citations) {
    if (citation.positions.length === 0 && citation.type === 'global-source') {
      // For global sources with high similarity, insert at relevant paragraphs
      if (citation.similarity && citation.similarity > 0.85) {
        // Simple heuristic: Insert at end of first paragraph
        const firstParaEnd = modifiedText.indexOf('\n\n');
        if (firstParaEnd > 0) {
          const insertPos = firstParaEnd;
          modifiedText =
            modifiedText.substring(0, insertPos) +
            `[${citation.index}]` +
            modifiedText.substring(insertPos);
          citation.positions.push(insertPos);
        }
      }
    }
  }

  // Strategy 3: Fallback - insert citations at the end of response if not yet placed
  const notYetCited = citations.filter(c => c.positions.length === 0);
  if (notYetCited.length > 0) {
    const citationNumbers = notYetCited.map(c => `[${c.index}]`).join('');
    modifiedText = modifiedText.trim() + citationNumbers;
    notYetCited.forEach(c => {
      c.positions.push(modifiedText.length - citationNumbers.length);
    });
  }

  return {
    text: modifiedText,
    citations: citations.sort((a, b) => a.index - b.index),
  };
}

/**
 * Convert citations to MessagePart format for database storage
 */
export function citationsToMessageParts(citations: Citation[]): MessagePart[] {
  return citations.map(citation => ({
    type: citation.type,
    sourceId: citation.sourceId,
    sourceType: citation.sourceType,
    sourceTitle: citation.sourceTitle,
    projectId: citation.projectId,
    projectName: citation.projectName,
    similarity: citation.similarity,
    citationIndex: citation.index,
  }));
}

/**
 * Helper: Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Helper: Check if response text contains substantial content from source
 * Simple implementation using word overlap
 */
function checkContentSimilarity(responseText: string, sourceContent: string): boolean {
  // Extract significant words (> 4 chars) from both texts
  const responseWords = new Set(
    responseText
      .toLowerCase()
      .match(/\b\w{5,}\b/g) || []
  );
  const sourceWords = sourceContent
    .toLowerCase()
    .match(/\b\w{5,}\b/g) || [];

  if (sourceWords.length === 0) return false;

  // Count overlapping words
  let overlapCount = 0;
  for (const word of sourceWords) {
    if (responseWords.has(word)) {
      overlapCount++;
    }
  }

  // If >20% of source's significant words appear in response, consider it referenced
  const similarityRatio = overlapCount / sourceWords.length;
  return similarityRatio > 0.2;
}
