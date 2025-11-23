'use client';

/**
 * Inline Citations Component
 *
 * Perplexity-style inline citations for Double-Loop source attribution.
 * Displays [1], [2] markers in text with expandable source list at bottom.
 */

import { useState } from 'react';
import { ChevronDown, FileText, Sparkles, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import type { MessagePart } from '@/lib/db/types';

export interface CitationMarkerProps {
  number: number;
  onClick?: () => void;
}

/**
 * Inline [1] citation marker - appears as superscript in text
 */
export function CitationMarker({ number, onClick }: CitationMarkerProps) {
  return (
    <sup
      className="inline-flex items-center justify-center w-4 h-4 ml-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400 cursor-pointer hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
      onClick={onClick}
      role="button"
      aria-label={`Citation ${number}`}
    >
      [{number}]
    </sup>
  );
}

export interface CitationsListProps {
  sources: MessagePart[];
  projectId?: string;
}

/**
 * Expandable list of all sources at the bottom of message
 */
export function CitationsList({ sources, projectId }: CitationsListProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Separate project and global sources
  const projectSources = sources.filter(s => s.type === 'project-source');
  const globalSources = sources.filter(s => s.type === 'global-source');

  const totalCount = projectSources.length + globalSources.length;

  if (totalCount === 0) return null;

  return (
    <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-3">
      {/* Collapsible trigger */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors w-full"
        aria-expanded={isExpanded}
      >
        <ChevronDown
          className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        />
        <span className="font-medium">
          Sources ({totalCount})
        </span>
      </button>

      {/* Expandable content */}
      {isExpanded && (
        <div className="mt-3 space-y-4">
          {/* Project sources section */}
          {projectSources.length > 0 && (
            <div>
              <h4 className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <FileText className="h-3.5 w-3.5" />
                Used from Project Files
              </h4>
              <div className="space-y-1.5">
                {projectSources.map((source, index) => (
                  <CitationItem
                    key={`project-${index}`}
                    source={source}
                    projectId={projectId}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Global sources section */}
          {globalSources.length > 0 && (
            <div>
              <h4 className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <Sparkles className="h-3.5 w-3.5" />
                Relevant from Other Projects
              </h4>
              <div className="space-y-1.5">
                {globalSources.map((source, index) => (
                  <CitationItem
                    key={`global-${index}`}
                    source={source}
                    isGlobal
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface CitationItemProps {
  source: MessagePart;
  projectId?: string;
  isGlobal?: boolean;
}

/**
 * Individual citation item in the list
 */
function CitationItem({ source, projectId, isGlobal }: CitationItemProps) {
  const citationNumber = source.citationIndex || 0;
  const sourceTitle = source.sourceTitle || 'Untitled';
  const similarity = source.similarity ? Math.round(source.similarity * 100) : null;

  // Build URL for clickable sources
  const href = isGlobal
    ? null // Global sources not yet clickable (TODO: Add cross-project navigation)
    : projectId && source.sourceId
    ? `/projects/${projectId}/files/${source.sourceId}`
    : null;

  const content = (
    <div className="flex items-start gap-2 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
      <span className="flex-shrink-0 text-xs font-medium text-blue-600 dark:text-blue-400 mt-0.5">
        [{citationNumber}]
      </span>
      <div className="flex-1 min-w-0">
        {isGlobal && source.projectName && (
          <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">
            {source.projectName}
          </p>
        )}
        <p className="text-sm text-gray-800 dark:text-gray-200 truncate">
          {sourceTitle}
        </p>
        {similarity !== null && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {similarity}% match
          </p>
        )}
      </div>
      {href && (
        <ExternalLink className="h-3.5 w-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
