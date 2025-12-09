/**
 * Advisory Browser with Preview Panel
 *
 * Split-pane layout: tree view on left, file preview on right
 *
 * M312A-06: File Preview Panel
 */

'use client';

import { useState, useEffect } from 'react';
import { FolderBrowser } from './folder-browser';
import { Loader2, FileTextIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FolderNode } from '@/lib/advisory/file-reader';

interface AdvisoryBrowserWithPreviewProps {
  tree: FolderNode;
  className?: string;
}

export function AdvisoryBrowserWithPreview({ tree, className }: AdvisoryBrowserWithPreviewProps) {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedPath) {
      setContent(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    // Fetch file content via API
    fetch(`/api/advisory/file?path=${encodeURIComponent(selectedPath)}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load file');
        return res.json();
      })
      .then(data => setContent(data.content))
      .catch(err => setError(err.message || 'Failed to load file'))
      .finally(() => setLoading(false));
  }, [selectedPath]);

  // Extract filename from path
  const filename = selectedPath?.split('/').pop() || '';

  return (
    <div className={cn('flex h-full border rounded-lg overflow-hidden', className)}>
      {/* Tree panel */}
      <div className="w-1/3 min-w-[200px] max-w-[400px] border-r bg-muted/30 overflow-auto">
        <div className="p-3 border-b bg-muted/50">
          <h3 className="font-medium text-sm">Advisory Files</h3>
        </div>
        <FolderBrowser
          tree={tree}
          onFileSelect={setSelectedPath}
          selectedPath={selectedPath ?? undefined}
        />
      </div>

      {/* Preview panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Preview header */}
        {selectedPath && (
          <div className="p-3 border-b bg-muted/30 flex items-center gap-2">
            <FileTextIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium truncate">{filename}</span>
          </div>
        )}

        {/* Preview content */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full text-destructive">
              <p className="text-sm">{error}</p>
            </div>
          ) : content ? (
            <div className="prose dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap text-sm font-mono bg-muted/30 p-4 rounded-lg overflow-auto">
                {content}
              </pre>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <FileTextIcon className="h-12 w-12 mb-4 opacity-30" />
              <p className="text-sm">Select a file to preview</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
