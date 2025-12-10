/**
 * File Preview Modal
 *
 * Modal to display file content when selected from the file tree
 *
 * M312B-05: File Preview Modal
 */

'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

interface FilePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filePath: string | null;
}

export function FilePreviewModal({ open, onOpenChange, filePath }: FilePreviewModalProps) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!filePath || !open) {
      setContent(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`/api/advisory/file?path=${encodeURIComponent(filePath)}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load file');
        return res.json();
      })
      .then(data => setContent(data.content))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [filePath, open]);

  const fileName = filePath?.split('/').pop() || 'File Preview';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="truncate">{fileName}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto min-h-0">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading...</span>
            </div>
          ) : error ? (
            <div className="p-4 text-destructive text-center">
              {error}
            </div>
          ) : content ? (
            <pre className="text-sm whitespace-pre-wrap p-4 bg-muted rounded font-mono">
              {content}
            </pre>
          ) : (
            <div className="p-4 text-muted-foreground text-center">
              No content to display
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
