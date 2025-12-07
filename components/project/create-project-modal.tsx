'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { FolderOpen, Plus } from 'lucide-react';

type CreateMode = 'new' | 'import';

interface CreateProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectCreated?: (projectId: string) => void;
  onOpenImportWizard?: () => void;
  onOpenBulkImport?: () => void;
}

export function CreateProjectModal({
  open,
  onOpenChange,
  onProjectCreated,
  onOpenImportWizard,
  onOpenBulkImport,
}: CreateProjectModalProps) {
  const [mode, setMode] = useState<CreateMode>('new');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Project name is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create project');
      }

      const data = await response.json();

      // Success - reset form and close modal
      setName('');
      setDescription('');
      onOpenChange(false);

      // Show success toast
      toast.success('Project created successfully', {
        description: `${data.project.name} has been created.`,
      });

      // Navigate to the newly created project
      onProjectCreated?.(data.project.id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create project';
      setError(errorMessage);
      toast.error('Failed to create project', {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setName('');
    setDescription('');
    setError(null);
    setMode('new');
    onOpenChange(false);
  };

  const handleImportAdvisory = () => {
    onOpenChange(false);
    onOpenImportWizard?.();
  };

  const handleBulkImport = () => {
    onOpenChange(false);
    onOpenBulkImport?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Create a new project or import from advisory folders.
          </DialogDescription>
        </DialogHeader>

        {/* Mode Selector */}
        <div className="flex gap-2 border-b pb-4">
          <button
            type="button"
            onClick={() => setMode('new')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === 'new'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
            }`}
          >
            <Plus className="h-4 w-4" />
            New Project
          </button>
          <button
            type="button"
            onClick={() => setMode('import')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === 'import'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
            }`}
          >
            <FolderOpen className="h-4 w-4" />
            Import Advisory
          </button>
        </div>

        {mode === 'import' ? (
          <div className="space-y-4 py-4">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Import deals or clients from your advisory folders. Each imported folder becomes a project with AI-generated context.
            </p>

            <div className="grid gap-3">
              <button
                type="button"
                onClick={handleImportAdvisory}
                className="flex items-start gap-3 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 text-left transition-colors"
              >
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <FolderOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">Import Single Folder</h4>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Choose one deal or client folder to import with guided setup
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={handleBulkImport}
                className="flex items-start gap-3 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 text-left transition-colors"
              >
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <FolderOpen className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">Bulk Import</h4>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Import multiple folders at once with auto-generated summaries
                  </p>
                </div>
              </button>
            </div>

            <DialogFooter className="pt-2">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="project-name" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Project Name *
            </label>
            <Input
              id="project-name"
              type="text"
              placeholder="e.g., E-Commerce Redesign"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="project-description" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Description (optional)
            </label>
            <Textarea
              id="project-description"
              placeholder="Brief description of this project..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
              rows={3}
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !name.trim()}
            >
              {isLoading ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
