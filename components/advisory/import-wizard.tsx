'use client';

/**
 * Import Wizard Component
 *
 * Step-by-step wizard for importing a single advisory folder.
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
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, ChevronLeft, ChevronRight, Check, Building2, Users } from 'lucide-react';

type WizardStep = 'select' | 'preview' | 'summary' | 'complete';

interface AvailableFolders {
  deals: string[];
  clients: string[];
}

interface Frontmatter {
  company?: string;
  founder?: string;
  deal_stage?: string;
  arr_estimate?: string;
  team_size?: string;
  last_updated?: string;
  [key: string]: string | undefined;
}

interface ImportWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectCreated?: (projectId: string) => void;
}

export function ImportWizard({ open, onOpenChange, onProjectCreated }: ImportWizardProps) {
  const [step, setStep] = useState<WizardStep>('select');
  const [available, setAvailable] = useState<AvailableFolders>({ deals: [], clients: [] });
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [frontmatter, setFrontmatter] = useState<Frontmatter | null>(null);
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep('select');
        setSelectedFolder(null);
        setFrontmatter(null);
        setSummary('');
        setCreatedProjectId(null);
      }, 200);
    }
  }, [open]);

  // Fetch available folders on open
  useEffect(() => {
    if (open && step === 'select') {
      fetchAvailable();
    }
  }, [open, step]);

  const fetchAvailable = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/advisory/available');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setAvailable(data.available);
    } catch (error) {
      toast.error('Failed to load folders');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFolderSelect = (path: string) => {
    setSelectedFolder(path);
  };

  const handleNextFromSelect = async () => {
    if (!selectedFolder) return;

    setIsLoading(true);
    setIsGenerating(true);
    try {
      // Import with summary generation
      const response = await fetch('/api/advisory/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folderPath: selectedFolder,
          generateSummary: true,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Import failed');
      }

      const data = await response.json();
      setFrontmatter(data.frontmatter);
      setCreatedProjectId(data.project.id);

      // Get the generated summary from the project
      const projectResponse = await fetch(`/api/projects/${data.project.id}`);
      if (projectResponse.ok) {
        const projectData = await projectResponse.json();
        setSummary(projectData.project.custom_instructions || '');
      }

      setStep('summary');
    } catch (error) {
      toast.error('Failed to import', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsLoading(false);
      setIsGenerating(false);
    }
  };

  const handleSaveSummary = async () => {
    if (!createdProjectId) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${createdProjectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ custom_instructions: summary }),
      });

      if (!response.ok) throw new Error('Failed to save');

      setStep('complete');
      toast.success('Project created successfully');
    } catch (error) {
      toast.error('Failed to save summary');
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = () => {
    if (createdProjectId) {
      onProjectCreated?.(createdProjectId);
    }
    onOpenChange(false);
  };

  const totalAvailable = available.deals.length + available.clients.length;

  const renderStep = () => {
    switch (step) {
      case 'select':
        return (
          <>
            <DialogHeader>
              <DialogTitle>Import Advisory Folder</DialogTitle>
              <DialogDescription>
                Select a deal or client folder to import as a project.
              </DialogDescription>
            </DialogHeader>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : totalAvailable === 0 ? (
              <div className="py-8 text-center text-neutral-500">
                All advisory folders have been imported.
              </div>
            ) : (
              <div className="max-h-[300px] overflow-y-auto space-y-4">
                {/* Deals */}
                {available.deals.length > 0 && (
                  <div>
                    <h4 className="flex items-center gap-2 text-sm font-medium mb-2">
                      <Building2 className="h-4 w-4" />
                      Deals
                    </h4>
                    <div className="grid gap-2 pl-6">
                      {available.deals.map(folder => {
                        const path = `advisory/deals/${folder}`;
                        const isSelected = selectedFolder === path;
                        return (
                          <button
                            key={path}
                            onClick={() => handleFolderSelect(path)}
                            className={`text-left p-3 rounded-lg border transition-colors ${
                              isSelected
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'
                            }`}
                          >
                            <span className="font-medium">{folder}</span>
                            <span className="block text-xs text-neutral-500 mt-0.5">
                              {path}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Clients */}
                {available.clients.length > 0 && (
                  <div>
                    <h4 className="flex items-center gap-2 text-sm font-medium mb-2">
                      <Users className="h-4 w-4" />
                      Clients
                    </h4>
                    <div className="grid gap-2 pl-6">
                      {available.clients.map(folder => {
                        const path = `advisory/clients/${folder}`;
                        const isSelected = selectedFolder === path;
                        return (
                          <button
                            key={path}
                            onClick={() => handleFolderSelect(path)}
                            className={`text-left p-3 rounded-lg border transition-colors ${
                              isSelected
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'
                            }`}
                          >
                            <span className="font-medium">{folder}</span>
                            <span className="block text-xs text-neutral-500 mt-0.5">
                              {path}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleNextFromSelect} disabled={!selectedFolder || isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    Import
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        );

      case 'summary':
        return (
          <>
            <DialogHeader>
              <DialogTitle>Edit Project Instructions</DialogTitle>
              <DialogDescription>
                Review and edit the AI-generated summary for {frontmatter?.company || 'this project'}.
              </DialogDescription>
            </DialogHeader>

            {frontmatter && (
              <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  {frontmatter.founder && (
                    <div><span className="text-neutral-500">Founder:</span> {frontmatter.founder}</div>
                  )}
                  {frontmatter.deal_stage && (
                    <div><span className="text-neutral-500">Stage:</span> {frontmatter.deal_stage}</div>
                  )}
                  {frontmatter.arr_estimate && (
                    <div><span className="text-neutral-500">ARR:</span> {frontmatter.arr_estimate}</div>
                  )}
                  {frontmatter.team_size && (
                    <div><span className="text-neutral-500">Team:</span> {frontmatter.team_size}</div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Project Instructions (editable)
              </label>
              <Textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={8}
                placeholder="AI-generated summary will appear here..."
                className="font-mono text-sm"
              />
              <p className="text-xs text-neutral-500">
                This summary will be used as context in all chats within this project.
              </p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep('select')}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button onClick={handleSaveSummary} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Save & Complete
              </Button>
            </DialogFooter>
          </>
        );

      case 'complete':
        return (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <Check className="h-5 w-5" />
                Project Created
              </DialogTitle>
              <DialogDescription>
                {frontmatter?.company || 'Your project'} has been imported successfully.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 text-center">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                You can now start chatting in this project. The context from the master doc
                will be automatically injected into all conversations.
              </p>
            </div>

            <DialogFooter>
              <Button onClick={handleComplete}>
                Open Project
              </Button>
            </DialogFooter>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        {renderStep()}
      </DialogContent>
    </Dialog>
  );
}
