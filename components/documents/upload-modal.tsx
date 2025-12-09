'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { FileTextIcon, UploadIcon, XIcon, CheckIcon, Loader2Icon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { processDocument, ProcessedDocument, truncateForContext } from '@/lib/documents/processor';

interface DocumentUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDocumentProcessed: (doc: ProcessedDocument) => void;
}

const ACCEPTED_TYPES = '.pdf,.txt,.md,.markdown';
const MAX_PREVIEW_CHARS = 2000;

export function DocumentUploadModal({
  open,
  onOpenChange,
  onDocumentProcessed,
}: DocumentUploadModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedDoc, setProcessedDoc] = useState<ProcessedDocument | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await processFile(files[0]);
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processFile(files[0]);
    }
  };

  const processFile = async (file: File) => {
    setError(null);
    setProcessedDoc(null);
    setIsProcessing(true);

    try {
      const extension = file.name.split('.').pop()?.toLowerCase();

      // Validate file type
      if (!['pdf', 'txt', 'md', 'markdown'].includes(extension || '')) {
        throw new Error(`Unsupported file type: ${extension}`);
      }

      let result: ProcessedDocument;

      // For PDF files, use server-side processing
      if (extension === 'pdf') {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/documents/process', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to process PDF');
        }

        result = await response.json();
      } else {
        // For TXT and MD files, use client-side processing
        result = await processDocument(file);
      }

      setProcessedDoc(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process document');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = () => {
    if (processedDoc) {
      onDocumentProcessed(processedDoc);
      handleClose();
    }
  };

  const handleClose = () => {
    setProcessedDoc(null);
    setError(null);
    setIsDragging(false);
    setIsProcessing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onOpenChange(false);
  };

  const getPreviewText = () => {
    if (!processedDoc) return '';

    if (processedDoc.content.length <= MAX_PREVIEW_CHARS) {
      return processedDoc.content;
    }

    return processedDoc.content.slice(0, MAX_PREVIEW_CHARS) + '\n\n[... preview truncated ...]';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Upload a PDF, TXT, or Markdown file to add to the conversation context
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Upload Zone */}
          {!processedDoc && !isProcessing && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                transition-colors duration-200
                ${isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                }
              `}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_TYPES}
                onChange={handleFileChange}
                className="hidden"
              />

              <UploadIcon className="mx-auto size-12 text-muted-foreground mb-4" />

              <p className="text-sm font-medium mb-2">
                Drop file here or click to browse
              </p>

              <p className="text-xs text-muted-foreground">
                Supported formats: PDF, TXT, Markdown (.md)
              </p>
            </div>
          )}

          {/* Processing State */}
          {isProcessing && (
            <div className="flex items-center justify-center py-12">
              <Loader2Icon className="size-8 animate-spin text-primary mr-3" />
              <span className="text-sm text-muted-foreground">Processing document...</span>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <XIcon className="size-5 text-destructive mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-destructive mb-1">
                    Processing Error
                  </p>
                  <p className="text-sm text-destructive/80">{error}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => {
                  setError(null);
                  fileInputRef.current?.click();
                }}
              >
                Try Another File
              </Button>
            </div>
          )}

          {/* Preview */}
          {processedDoc && !error && (
            <div className="space-y-3">
              {/* File Info */}
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="p-2 bg-primary/10 rounded">
                  <FileTextIcon className="size-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{processedDoc.filename}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="uppercase">{processedDoc.type}</span>
                    {processedDoc.pageCount && (
                      <span>{processedDoc.pageCount} pages</span>
                    )}
                    <span>{processedDoc.content.length.toLocaleString()} characters</span>
                  </div>
                </div>
                <CheckIcon className="size-5 text-green-600 shrink-0" />
              </div>

              {/* Content Preview */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Content Preview</label>
                <div className="bg-muted/50 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <pre className="text-xs whitespace-pre-wrap font-mono">
                    {getPreviewText()}
                  </pre>
                </div>
                {processedDoc.content.length > MAX_PREVIEW_CHARS && (
                  <p className="text-xs text-muted-foreground">
                    Showing first {MAX_PREVIEW_CHARS.toLocaleString()} characters.
                    Full content will be available in context.
                  </p>
                )}
              </div>

              {/* Metadata */}
              {processedDoc.metadata && Object.keys(processedDoc.metadata).length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Metadata</label>
                  <div className="bg-muted/50 rounded-lg p-3 text-xs">
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(processedDoc.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {processedDoc && (
            <Button onClick={handleConfirm}>
              Add to Context
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
