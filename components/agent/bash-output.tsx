'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDownIcon, ChevronRightIcon, CopyIcon, CheckIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BashOutputProps {
  command?: string;
  output: string;
  exitCode?: number;
  maxLines?: number;
  className?: string;
}

export function BashOutput({
  command,
  output,
  exitCode,
  maxLines = 30,
  className,
}: BashOutputProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const lines = output.split('\n');
  const shouldTruncate = lines.length > maxLines;
  const displayOutput = isExpanded
    ? output
    : lines.slice(0, maxLines).join('\n');

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isError = exitCode !== undefined && exitCode !== 0;

  return (
    <div
      className={cn(
        'rounded-md border overflow-hidden',
        isError ? 'border-destructive/50' : 'border-border',
        className
      )}
    >
      {/* Command header */}
      {command && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900 text-zinc-300">
          <code className="text-xs font-mono">
            <span className="text-emerald-400">$</span> {command}
          </code>
          {exitCode !== undefined && (
            <span
              className={cn(
                'text-xs',
                isError ? 'text-red-400' : 'text-emerald-400'
              )}
            >
              exit {exitCode}
            </span>
          )}
        </div>
      )}

      {/* Output */}
      <div className="relative bg-zinc-950 text-zinc-200">
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-1 right-1 h-6 w-6 p-0 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
          onClick={handleCopy}
        >
          {copied ? (
            <CheckIcon className="h-3 w-3 text-emerald-400" />
          ) : (
            <CopyIcon className="h-3 w-3" />
          )}
        </Button>

        <pre className="p-3 pr-10 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-words">
          <code>{displayOutput || '(no output)'}</code>
        </pre>
      </div>

      {/* Expand/Collapse */}
      {shouldTruncate && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 w-full px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800 bg-zinc-900 transition-colors"
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
