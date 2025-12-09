/**
 * Advisory Files Browser Page
 *
 * Browse and preview advisory folder contents
 *
 * M312A-05/06: Advisory Folder Browser with Preview
 */

'use client';

import { useState, useEffect } from 'react';
import { AdvisoryBrowserWithPreview } from '@/components/advisory';
import { Loader2, FolderOpen } from 'lucide-react';
import type { FolderNode } from '@/lib/advisory/file-reader';

export default function AdvisoryPage() {
  const [tree, setTree] = useState<FolderNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTree() {
      try {
        const res = await fetch('/api/advisory/tree');
        if (!res.ok) throw new Error('Failed to load advisory tree');
        const data = await res.json();
        setTree(data.tree);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    }
    loadTree();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">Loading advisory files...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-destructive">
        <p>{error}</p>
      </div>
    );
  }

  if (!tree) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
        <FolderOpen className="h-12 w-12 mb-4 opacity-30" />
        <p>No advisory files found</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col p-4 md:p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">Advisory Files</h1>
        <p className="text-sm text-muted-foreground">
          Browse and preview deal and client documentation
        </p>
      </div>
      <div className="flex-1 min-h-0">
        <AdvisoryBrowserWithPreview tree={tree} className="h-full" />
      </div>
    </div>
  );
}
