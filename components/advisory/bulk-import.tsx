'use client';

/**
 * Bulk Import Component
 *
 * Multi-select interface for importing multiple advisory folders at once.
 *
 * M38: Advisory Project Integration
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2, FolderOpen, Building2, Users } from 'lucide-react';

interface AvailableFolders {
  deals: string[];
  clients: string[];
}

interface ImportStats {
  totalDeals: number;
  totalClients: number;
  availableDeals: number;
  availableClients: number;
}

interface ImportResult {
  name: string;
  id: string;
  folderPath: string;
  entityType: 'deal' | 'client';
}

interface BulkImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: (results: ImportResult[]) => void;
}

export function BulkImport({ open, onOpenChange, onImportComplete }: BulkImportProps) {
  const [available, setAvailable] = useState<AvailableFolders>({ deals: [], clients: [] });
  const [stats, setStats] = useState<ImportStats | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  // Fetch available folders on open
  useEffect(() => {
    if (open) {
      fetchAvailable();
    }
  }, [open]);

  const fetchAvailable = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/advisory/available');
      if (!response.ok) throw new Error('Failed to fetch available folders');

      const data = await response.json();
      setAvailable(data.available);
      setStats(data.stats);

      // Pre-select all available folders
      const allPaths = [
        ...data.available.deals.map((d: string) => `advisory/deals/${d}`),
        ...data.available.clients.map((c: string) => `advisory/clients/${c}`),
      ];
      setSelected(new Set(allPaths));
    } catch (error) {
      toast.error('Failed to load advisory folders');
      console.error('[BulkImport] Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFolder = (path: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(path)) {
      newSelected.delete(path);
    } else {
      newSelected.add(path);
    }
    setSelected(newSelected);
  };

  const selectAll = () => {
    const allPaths = [
      ...available.deals.map(d => `advisory/deals/${d}`),
      ...available.clients.map(c => `advisory/clients/${c}`),
    ];
    setSelected(new Set(allPaths));
  };

  const selectNone = () => {
    setSelected(new Set());
  };

  const handleImport = async () => {
    if (selected.size === 0) {
      toast.error('Please select at least one folder to import');
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    try {
      const response = await fetch('/api/advisory/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folders: Array.from(selected),
          generateSummaries: true,
        }),
      });

      if (!response.ok) throw new Error('Import failed');

      const data = await response.json();
      setImportProgress(100);

      toast.success(`Imported ${data.stats.imported} projects`, {
        description: data.stats.failed > 0
          ? `${data.stats.failed} failed`
          : 'All imports successful',
      });

      onImportComplete?.(data.imported);
      onOpenChange(false);
    } catch (error) {
      toast.error('Import failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsImporting(false);
    }
  };

  const totalAvailable = available.deals.length + available.clients.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Import Advisory Projects
          </DialogTitle>
          <DialogDescription>
            Import deal and client folders from the advisory directory as projects.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2 text-sm text-neutral-500">Loading folders...</span>
          </div>
        ) : totalAvailable === 0 ? (
          <div className="py-8 text-center text-neutral-500">
            <p>All advisory folders have been imported.</p>
            {stats && (
              <p className="mt-2 text-sm">
                {stats.totalDeals} deals and {stats.totalClients} clients already imported.
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-sm text-neutral-500">
                {selected.size} of {totalAvailable} selected
              </span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={selectAll}>
                  Select All
                </Button>
                <Button variant="ghost" size="sm" onClick={selectNone}>
                  Select None
                </Button>
              </div>
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-4">
              {/* Deals Section */}
              {available.deals.length > 0 && (
                <div>
                  <h4 className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    <Building2 className="h-4 w-4" />
                    Deals ({available.deals.length})
                  </h4>
                  <div className="space-y-2 pl-6">
                    {available.deals.map(folder => {
                      const path = `advisory/deals/${folder}`;
                      return (
                        <label
                          key={path}
                          className="flex items-center gap-2 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 p-1.5 rounded"
                        >
                          <Checkbox
                            checked={selected.has(path)}
                            onCheckedChange={() => toggleFolder(path)}
                          />
                          <span className="text-sm">{folder}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Clients Section */}
              {available.clients.length > 0 && (
                <div>
                  <h4 className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    <Users className="h-4 w-4" />
                    Clients ({available.clients.length})
                  </h4>
                  <div className="space-y-2 pl-6">
                    {available.clients.map(folder => {
                      const path = `advisory/clients/${folder}`;
                      return (
                        <label
                          key={path}
                          className="flex items-center gap-2 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 p-1.5 rounded"
                        >
                          <Checkbox
                            checked={selected.has(path)}
                            onCheckedChange={() => toggleFolder(path)}
                          />
                          <span className="text-sm">{folder}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {isImporting && (
              <div className="mt-4">
                <div className="h-2 w-full bg-neutral-200 dark:bg-neutral-700 rounded overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${importProgress}%` }}
                  />
                </div>
                <p className="text-xs text-neutral-500 mt-1 text-center">
                  Importing... This may take a moment.
                </p>
              </div>
            )}
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isImporting}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={isLoading || isImporting || selected.size === 0}
          >
            {isImporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              `Import ${selected.size} Project${selected.size !== 1 ? 's' : ''}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
