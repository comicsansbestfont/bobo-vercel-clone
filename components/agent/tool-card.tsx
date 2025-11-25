'use client';

import { cn } from '@/lib/utils';
import {
  FileTextIcon,
  FilePlusIcon,
  FileEditIcon,
  TerminalIcon,
  FolderSearchIcon,
  SearchIcon,
  GlobeIcon,
  DownloadIcon,
  CheckCircleIcon,
  XCircleIcon,
  Loader2Icon,
} from 'lucide-react';

export type ToolStatus = 'running' | 'success' | 'error';

export interface ToolCardProps {
  toolName: string;
  status: ToolStatus;
  duration?: number;
  input?: Record<string, unknown>;
  children?: React.ReactNode;
  className?: string;
}

const TOOL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Read: FileTextIcon,
  Write: FilePlusIcon,
  Edit: FileEditIcon,
  Bash: TerminalIcon,
  Glob: FolderSearchIcon,
  Grep: SearchIcon,
  WebSearch: GlobeIcon,
  WebFetch: DownloadIcon,
};

export function ToolCard({
  toolName,
  status,
  duration,
  input,
  children,
  className,
}: ToolCardProps) {
  const Icon = TOOL_ICONS[toolName] || FileTextIcon;

  return (
    <div
      className={cn(
        'rounded-lg border bg-muted/50 p-3 my-2',
        status === 'error' && 'border-destructive/50 bg-destructive/5',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium text-sm">{toolName}</span>

        {/* Status indicator */}
        <StatusBadge status={status} />

        {/* Duration */}
        {duration !== undefined && status !== 'running' && (
          <span className="text-xs text-muted-foreground ml-auto">
            {duration}ms
          </span>
        )}
      </div>

      {/* Input preview for some tools */}
      {input && (
        <ToolInputPreview toolName={toolName} input={input} />
      )}

      {/* Tool-specific content */}
      {children && (
        <div className="mt-2">
          {children}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: ToolStatus }) {
  switch (status) {
    case 'running':
      return (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Loader2Icon className="h-3 w-3 animate-spin" />
          <span>Running</span>
        </div>
      );
    case 'success':
      return (
        <div className="flex items-center gap-1 text-xs text-emerald-600">
          <CheckCircleIcon className="h-3 w-3" />
        </div>
      );
    case 'error':
      return (
        <div className="flex items-center gap-1 text-xs text-destructive">
          <XCircleIcon className="h-3 w-3" />
        </div>
      );
  }
}

function ToolInputPreview({
  toolName,
  input,
}: {
  toolName: string;
  input: Record<string, unknown>;
}) {
  switch (toolName) {
    case 'Read':
      return input.file_path ? (
        <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
          {String(input.file_path)}
        </code>
      ) : null;

    case 'Grep':
      return input.pattern ? (
        <div className="text-xs text-muted-foreground">
          Pattern: <code className="bg-muted px-1 py-0.5 rounded">{String(input.pattern)}</code>
        </div>
      ) : null;

    case 'Glob':
      return input.pattern ? (
        <div className="text-xs text-muted-foreground">
          Pattern: <code className="bg-muted px-1 py-0.5 rounded">{String(input.pattern)}</code>
        </div>
      ) : null;

    case 'Bash':
      return input.command ? (
        <code className="text-xs text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded block">
          $ {String(input.command)}
        </code>
      ) : null;

    case 'Write':
    case 'Edit':
      return input.file_path ? (
        <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
          {String(input.file_path)}
        </code>
      ) : null;

    default:
      return null;
  }
}
