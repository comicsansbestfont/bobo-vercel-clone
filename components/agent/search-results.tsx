'use client';

import { cn } from '@/lib/utils';
import { FileIcon } from 'lucide-react';

interface SearchResult {
  path: string;
  line?: number;
  content?: string;
}

interface SearchResultsProps {
  results: SearchResult[] | string;
  maxResults?: number;
  className?: string;
}

export function SearchResults({
  results,
  maxResults = 20,
  className,
}: SearchResultsProps) {
  // Parse results if string
  const parsedResults: SearchResult[] = typeof results === 'string'
    ? parseSearchResults(results)
    : results;

  const displayResults = parsedResults.slice(0, maxResults);
  const hasMore = parsedResults.length > maxResults;

  if (displayResults.length === 0) {
    return (
      <div className={cn('text-xs text-muted-foreground italic', className)}>
        No results found
      </div>
    );
  }

  return (
    <div className={cn('space-y-1', className)}>
      {displayResults.map((result, index) => (
        <div
          key={`${result.path}-${result.line || index}`}
          className="flex items-start gap-2 text-xs"
        >
          <FileIcon className="h-3 w-3 mt-0.5 text-muted-foreground flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <span className="font-mono text-primary">
              {result.path}
              {result.line !== undefined && (
                <span className="text-muted-foreground">:{result.line}</span>
              )}
            </span>
            {result.content && (
              <pre className="mt-0.5 text-muted-foreground truncate">
                {result.content}
              </pre>
            )}
          </div>
        </div>
      ))}

      {hasMore && (
        <div className="text-xs text-muted-foreground">
          ... and {parsedResults.length - maxResults} more results
        </div>
      )}
    </div>
  );
}

/**
 * Parse grep/glob output string into structured results
 */
function parseSearchResults(output: string): SearchResult[] {
  const lines = output.split('\n').filter(Boolean);
  const results: SearchResult[] = [];

  for (const line of lines) {
    // Try to parse as file:line:content (grep format)
    const grepMatch = line.match(/^(.+?):(\d+):(.*)$/);
    if (grepMatch) {
      results.push({
        path: grepMatch[1],
        line: parseInt(grepMatch[2], 10),
        content: grepMatch[3].trim(),
      });
      continue;
    }

    // Try to parse as just file:line (grep -l format)
    const fileLineMatch = line.match(/^(.+?):(\d+)$/);
    if (fileLineMatch) {
      results.push({
        path: fileLineMatch[1],
        line: parseInt(fileLineMatch[2], 10),
      });
      continue;
    }

    // Treat as just a file path (glob format)
    if (line.trim()) {
      results.push({ path: line.trim() });
    }
  }

  return results;
}
