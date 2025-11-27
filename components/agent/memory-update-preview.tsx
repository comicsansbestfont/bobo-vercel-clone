'use client';

/**
 * M3.5-6: Memory Update Preview Component
 *
 * Displays a diff-style preview for update_memory confirmations.
 * Shows old content (strikethrough, red background) vs new content (green background).
 */

interface MemoryUpdatePreviewProps {
  oldContent: string;
  newContent: string;
  category: string;
}

export function MemoryUpdatePreview({
  oldContent,
  newContent,
  category,
}: MemoryUpdatePreviewProps) {
  return (
    <div className="space-y-3 p-3 bg-muted rounded-lg">
      <div className="text-sm font-medium text-muted-foreground">
        Updating memory in: <span className="text-foreground">{category}</span>
      </div>

      <div className="space-y-2">
        <div className="text-sm text-muted-foreground">Current:</div>
        <div className="text-sm text-red-600 dark:text-red-400 line-through bg-red-500/10 p-2 rounded">
          {oldContent}
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-sm text-muted-foreground">Will become:</div>
        <div className="text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 p-2 rounded">
          {newContent}
        </div>
      </div>
    </div>
  );
}
