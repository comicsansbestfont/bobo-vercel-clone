/**
 * File Preview Modal
 *
 * Modal to display file content when selected from the file tree
 *
 * M312B-05: File Preview Modal
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Edit3, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';

const BlockNoteMarkdownEditor = dynamic(
  () =>
    import('@/components/editor/blocknote-markdown-editor').then(
      (mod) => mod.BlockNoteMarkdownEditor
    ),
  { ssr: false }
);

interface FilePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filePath: string | null;
}

export function FilePreviewModal({ open, onOpenChange, filePath }: FilePreviewModalProps) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [draftMarkdown, setDraftMarkdown] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!filePath || !open) {
      setContent(null);
      setError(null);
      setIsEditing(false);
      setDraftMarkdown('');
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`/api/advisory/file?path=${encodeURIComponent(filePath)}`)
      .then(async res => {
        if (res.ok) return res.json();

        let errorMessage = 'Failed to load file';
        try {
          const data = (await res.json()) as { error?: string };
          if (data?.error) errorMessage = data.error;
        } catch {
          // ignore
        }

        throw new Error(errorMessage);
      })
      .then(data => {
        setContent(data.content);
        setDraftMarkdown(data.content || '');
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [filePath, open]);

  const fileName = filePath?.split('/').pop() || 'File Preview';
  const editorKey = useMemo(() => filePath || 'blocknote-editor', [filePath]);

  const handleSave = async () => {
    if (!filePath) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/advisory/file', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: filePath,
          content: draftMarkdown,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save file');
      }
      setContent(draftMarkdown);
      setIsEditing(false);
      toast.success('File saved');
    } catch (err) {
      toast.error('Failed to save file', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setDraftMarkdown(content || '');
    setIsEditing(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="truncate">{fileName}</DialogTitle>
            {!loading && !error && content !== null && (
              <div className="flex items-center gap-2">
                {!isEditing ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={isSaving}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isSaving ? 'Saving...' : 'Save'}
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
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
            isEditing ? (
              <div className="p-2">
                <BlockNoteMarkdownEditor
                  key={editorKey}
                  initialMarkdown={content}
                  onMarkdownChange={setDraftMarkdown}
                />
              </div>
            ) : (
              <pre className="text-sm whitespace-pre-wrap p-4 bg-muted rounded font-mono">
                {content}
              </pre>
            )
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
