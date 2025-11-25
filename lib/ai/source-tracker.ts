/**
 * Source Tracker
 *
 * Intelligent source tracking for the Double-Loop architecture.
 * Analyzes AI responses to determine which sources were actually used,
 * and inserts inline Perplexity-style citations.
 */

import type { MessagePart, SearchResult, ProjectMessageSearchResult } from '@/lib/db/types';
import type { ProjectContext } from './context-manager';
import { supabase } from '@/lib/db';

/**
 * Citation data structure for tracking inline references
 */
export interface Citation {
  index: number;              // [1], [2], [3]...
  type: 'project-source' | 'global-source' | 'project-conversation';
  sourceId: string;
  sourceType: 'project-file' | 'global-file' | 'global-message' | 'project-conversation';
  sourceTitle: string;
  projectId?: string;
  projectName?: string;
  chatId?: string;            // For project-conversation: the source chat ID
  chatTitle?: string;         // For project-conversation: the source chat title
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
 * Detect whether a search result ID belongs to files or messages table
 */
async function detectSourceType(id: string): Promise<'global-file' | 'global-message'> {
  // Check if ID exists in files table
  const { data: fileData, error: fileError } = await supabase
    .from('files')
    .select('id')
    .eq('id', id)
    .single();

  if (!fileError && fileData) {
    return 'global-file';
  }

  // If not in files, must be from messages table
  return 'global-message';
}

/**
 * Track global sources from hybrid search results
 */
export async function trackGlobalSources(
  searchResults: SearchResult[],
  projectNames: Map<string, string>, // projectId -> projectName mapping
  startingIndex: number = 1
): Promise<Citation[]> {
  const citations: Citation[] = [];

  // Only include global sources (not current project)
  const globalResults = searchResults.filter(r => r.source_type === 'global');

  // Detect source type for each result (file vs message)
  for (let i = 0; i < globalResults.length; i++) {
    const result = globalResults[i];
    const sourceType = await detectSourceType(result.id);

    citations.push({
      index: startingIndex + i,
      type: 'global-source',
      sourceId: result.id,
      sourceType,
      sourceTitle: result.content.substring(0, 60) + (result.content.length > 60 ? '...' : ''),
      projectName: projectNames.get(result.id),
      similarity: result.similarity,
      positions: [], // Will be filled by insertInlineCitations
    });
  }

  return citations;
}

/**
 * Track project conversation sources from intra-project message search
 * These are messages from sibling chats within the same project
 */
export function trackProjectConversations(
  searchResults: ProjectMessageSearchResult[],
  projectId: string,
  projectName: string,
  startingIndex: number = 1
): Citation[] {
  const citations: Citation[] = [];

  for (let i = 0; i < searchResults.length; i++) {
    const result = searchResults[i];

    citations.push({
      index: startingIndex + i,
      type: 'project-conversation',
      sourceId: result.message_id,
      sourceType: 'project-conversation',
      sourceTitle: result.content.substring(0, 60) + (result.content.length > 60 ? '...' : ''),
      projectId,
      projectName,
      chatId: result.chat_id,
      chatTitle: result.chat_title,
      similarity: result.similarity,
      positions: [], // Will be filled by insertInlineCitations
    });
  }

  return citations;
}

/**
 * Insert inline citation markers [1], [2] into the response text
 * Strategy: Insert citations after complete sentences that reference the source
 *
 * Fixed algorithm that prevents mid-word/mid-number insertions
 */
export function insertInlineCitations(
  responseText: string,
  citations: Citation[]
): CitationResult {
  // Track insertions to adjust positions correctly
  const insertions: Array<{ position: number; text: string; citationIndex: number }> = [];

  // Strategy 1: Find sentences mentioning each source and mark for insertion
  for (const citation of citations) {
    if (!citation.sourceTitle) continue;

    const titleWithoutExt = citation.sourceTitle.replace(/\.md$/i, '');
    const escapedTitle = escapeRegex(titleWithoutExt);

    // Match sentences containing the source title
    // Sentence ends with: . ! ? : (markdown-aware)
    const sentenceRegex = new RegExp(
      `([^.!?:]*\\b${escapedTitle}\\b[^.!?:]*[.!?:])`,
      'gi'
    );

    const matches = responseText.matchAll(sentenceRegex);
    let foundMatch = false;

    for (const match of matches) {
      if (!match.index) continue;

      // Find the position right after the sentence-ending punctuation
      const sentenceEnd = match.index + match[0].length;

      // Ensure we're not in the middle of a word
      // Check next character isn't alphanumeric
      const nextChar = responseText[sentenceEnd];
      if (nextChar && /[a-zA-Z0-9]/.test(nextChar)) {
        continue; // Skip if next char is alphanumeric (we're mid-word)
      }

      insertions.push({
        position: sentenceEnd,
        text: ` [${citation.index}]`,
        citationIndex: citation.index,
      });

      foundMatch = true;
      break; // Only insert once per source
    }

    if (foundMatch) {
      citation.positions.push(insertions[insertions.length - 1].position);
    }
  }

  // Strategy 2: For sources not yet cited, check content similarity
  for (const citation of citations) {
    if (citation.positions.length === 0 && citation.type === 'global-source') {
      // For high similarity global sources, insert at end of first paragraph
      if (citation.similarity && citation.similarity > 0.85) {
        const firstParaEnd = responseText.indexOf('\n\n');
        if (firstParaEnd > 0) {
          insertions.push({
            position: firstParaEnd,
            text: ` [${citation.index}]`,
            citationIndex: citation.index,
          });
          citation.positions.push(firstParaEnd);
        }
      }
    }
  }

  // Strategy 3: Fallback - append uncited sources at end
  const notYetCited = citations.filter(c => c.positions.length === 0);
  if (notYetCited.length > 0) {
    const endPosition = responseText.length;
    notYetCited.forEach(citation => {
      insertions.push({
        position: endPosition,
        text: ` [${citation.index}]`,
        citationIndex: citation.index,
      });
      citation.positions.push(endPosition);
    });
  }

  // Apply all insertions in reverse order (to preserve positions)
  insertions.sort((a, b) => b.position - a.position);

  let modifiedText = responseText;
  for (const insertion of insertions) {
    modifiedText =
      modifiedText.substring(0, insertion.position) +
      insertion.text +
      modifiedText.substring(insertion.position);
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
    chatId: citation.chatId,
    chatTitle: citation.chatTitle,
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
