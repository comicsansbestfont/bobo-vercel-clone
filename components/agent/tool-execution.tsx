'use client';

import { ToolCard, type ToolStatus } from './tool-card';
import { FilePreview } from './file-preview';
import { BashOutput } from './bash-output';
import { SearchResults } from './search-results';

export interface ToolExecutionProps {
  toolName: string;
  status: ToolStatus;
  input?: Record<string, unknown>;
  output?: string;
  duration?: number;
  className?: string;
}

/**
 * Container component that renders the appropriate tool-specific display
 */
export function ToolExecution({
  toolName,
  status,
  input,
  output,
  duration,
  className,
}: ToolExecutionProps) {
  return (
    <ToolCard
      toolName={toolName}
      status={status}
      duration={duration}
      input={input}
      className={className}
    >
      {status !== 'running' && output && (
        <ToolOutput toolName={toolName} output={output} input={input} />
      )}
    </ToolCard>
  );
}

/**
 * Renders tool-specific output based on tool type
 */
function ToolOutput({
  toolName,
  output,
  input,
}: {
  toolName: string;
  output: string;
  input?: Record<string, unknown>;
}) {
  switch (toolName) {
    case 'Read':
      return (
        <FilePreview
          content={output}
          filename={input?.file_path as string}
        />
      );

    case 'Bash':
      return (
        <BashOutput
          command={input?.command as string}
          output={output}
        />
      );

    case 'Grep':
    case 'Glob':
      return <SearchResults results={output} />;

    case 'Write':
    case 'Edit':
      return (
        <div className="text-xs text-emerald-600">
          {output || 'File operation completed'}
        </div>
      );

    case 'WebSearch':
    case 'WebFetch':
      return (
        <FilePreview
          content={output}
          maxLines={15}
        />
      );

    default:
      // Generic text output for unknown tools
      if (output.length > 500) {
        return <FilePreview content={output} maxLines={20} />;
      }
      return (
        <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap">
          {output}
        </pre>
      );
  }
}

// Re-export components for convenience
export { ToolCard, type ToolStatus } from './tool-card';
export { FilePreview } from './file-preview';
export { BashOutput } from './bash-output';
export { SearchResults } from './search-results';
