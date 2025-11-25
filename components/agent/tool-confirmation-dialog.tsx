'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { FilePreview } from './file-preview';
import { AlertTriangleIcon, FileEditIcon, FilePlusIcon, TerminalIcon } from 'lucide-react';

export interface ToolConfirmationProps {
  isOpen: boolean;
  toolName: string;
  input: Record<string, unknown>;
  onApprove: () => void;
  onDeny: () => void;
}

/**
 * Confirmation dialog shown before executing write operations
 */
export function ToolConfirmationDialog({
  isOpen,
  toolName,
  input,
  onApprove,
  onDeny,
}: ToolConfirmationProps) {
  const { title, description, icon: Icon } = getConfirmationContent(toolName);

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onDeny()}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Tool-specific preview */}
        <div className="my-4">
          <ToolPreview toolName={toolName} input={input} />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onDeny}>
            Deny
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onApprove}
            className={cn(
              toolName === 'Bash' && 'bg-amber-600 hover:bg-amber-700'
            )}
          >
            Approve
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function getConfirmationContent(toolName: string): {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
} {
  switch (toolName) {
    case 'Write':
      return {
        title: 'Create New File',
        description: 'The agent wants to create a new file in your project.',
        icon: FilePlusIcon,
      };
    case 'Edit':
      return {
        title: 'Edit File',
        description: 'The agent wants to modify an existing file in your project.',
        icon: FileEditIcon,
      };
    case 'Bash':
      return {
        title: 'Execute Command',
        description: 'The agent wants to run a shell command. Review carefully before approving.',
        icon: TerminalIcon,
      };
    default:
      return {
        title: 'Confirm Action',
        description: 'The agent wants to perform an action that requires your approval.',
        icon: AlertTriangleIcon,
      };
  }
}

function ToolPreview({
  toolName,
  input,
}: {
  toolName: string;
  input: Record<string, unknown>;
}) {
  switch (toolName) {
    case 'Write':
      return (
        <div className="space-y-2">
          <div className="text-sm">
            <span className="text-muted-foreground">File: </span>
            <code className="bg-muted px-1.5 py-0.5 rounded">
              {String(input.file_path || input.path || 'Unknown')}
            </code>
          </div>
          {typeof input.content === 'string' && (
            <FilePreview
              content={input.content}
              filename={String(input.file_path || input.path)}
              maxLines={30}
            />
          )}
        </div>
      );

    case 'Edit':
      return (
        <div className="space-y-2">
          <div className="text-sm">
            <span className="text-muted-foreground">File: </span>
            <code className="bg-muted px-1.5 py-0.5 rounded">
              {String(input.file_path || input.path || 'Unknown')}
            </code>
          </div>
          {typeof input.old_string === 'string' && typeof input.new_string === 'string' && (
            <DiffPreview
              oldString={input.old_string}
              newString={input.new_string}
            />
          )}
        </div>
      );

    case 'Bash':
      return (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3">
          <code className="text-sm font-mono text-amber-700 dark:text-amber-400">
            $ {String(input.command || 'Unknown command')}
          </code>
          {(typeof input.timeout === 'number' || typeof input.timeout === 'string') && (
            <p className="mt-1 text-xs text-muted-foreground">
              Timeout: {String(input.timeout)}ms
            </p>
          )}
        </div>
      );

    default:
      return (
        <pre className="rounded-md border bg-muted p-3 text-xs font-mono overflow-x-auto">
          {JSON.stringify(input, null, 2)}
        </pre>
      );
  }
}

function DiffPreview({
  oldString,
  newString,
}: {
  oldString: string;
  newString: string;
}) {
  return (
    <div className="rounded-md border overflow-hidden">
      {/* Old content */}
      <div className="bg-red-500/10 border-b border-red-500/20 p-2">
        <div className="text-xs text-red-600 dark:text-red-400 mb-1 font-medium">
          - Remove:
        </div>
        <pre className="text-xs font-mono text-red-700 dark:text-red-300 whitespace-pre-wrap">
          {oldString}
        </pre>
      </div>

      {/* New content */}
      <div className="bg-emerald-500/10 p-2">
        <div className="text-xs text-emerald-600 dark:text-emerald-400 mb-1 font-medium">
          + Add:
        </div>
        <pre className="text-xs font-mono text-emerald-700 dark:text-emerald-300 whitespace-pre-wrap">
          {newString}
        </pre>
      </div>
    </div>
  );
}
