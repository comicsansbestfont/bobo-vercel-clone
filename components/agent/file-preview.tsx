'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDownIcon, ChevronRightIcon, CopyIcon, CheckIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FilePreviewProps {
  content: string;
  filename?: string;
  maxLines?: number;
  className?: string;
}

export function FilePreview({
  content,
  filename,
  maxLines = 20,
  className,
}: FilePreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const lines = content.split('\n');
  const shouldTruncate = lines.length > maxLines;
  const displayContent = isExpanded
    ? content
    : lines.slice(0, maxLines).join('\n');

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn('rounded-md border bg-background overflow-hidden', className)}>
      {/* Header */}
      {filename && (
        <div className="flex items-center justify-between px-3 py-1.5 border-b bg-muted/30">
          <span className="text-xs font-mono text-muted-foreground">{filename}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={handleCopy}
          >
            {copied ? (
              <CheckIcon className="h-3 w-3 text-emerald-500" />
            ) : (
              <CopyIcon className="h-3 w-3" />
            )}
          </Button>
        </div>
      )}

      {/* Content */}
      <pre className="p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-words">
        <code>{displayContent}</code>
      </pre>

      {/* Expand/Collapse */}
      {shouldTruncate && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 w-full px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted/50 border-t transition-colors"
        >
          {isExpanded ? (
            <>
              <ChevronDownIcon className="h-3 w-3" />
              Show less
            </>
          ) : (
            <>
              <ChevronRightIcon className="h-3 w-3" />
              Show {lines.length - maxLines} more lines
            </>
          )}
        </button>
      )}
    </div>
  );
}
