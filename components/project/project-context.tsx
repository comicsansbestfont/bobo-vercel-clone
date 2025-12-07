'use client';

/**
 * Project Context Component
 *
 * Displays and allows editing of the project context (custom_instructions).
 * For advisory projects, includes a "Refresh from file" button.
 *
 * M38: Advisory Project Integration
 */

import { useState } from 'react';
import { ChevronDown, ChevronUp, RefreshCw, Save, FileText, Edit3, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import type { Project } from '@/lib/db/types';
import { EntityBadge } from '@/components/advisory/entity-badge';

interface ProjectContextProps {
  project: Project;
  onUpdate?: (updatedProject: Project) => void;
}

export function ProjectContext({ project, onUpdate }: ProjectContextProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(project.custom_instructions || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isAdvisory = Boolean(project.advisory_folder_path);
  const hasContent = Boolean(project.custom_instructions?.trim());

  // Don't show if no content and not advisory
  if (!hasContent && !isAdvisory) {
    return null;
  }

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ custom_instructions: editedContent }),
      });

      if (!response.ok) throw new Error('Failed to save');

      const data = await response.json();
      setIsEditing(false);
      toast.success('Project context updated');
      onUpdate?.(data.project);
    } catch (error) {
      toast.error('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch(`/api/advisory/refresh/${project.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regenerateSummary: true }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Refresh failed');
      }

      const data = await response.json();

      // Fetch updated project
      const projectRes = await fetch(`/api/projects/${project.id}`);
      if (projectRes.ok) {
        const projectData = await projectRes.json();
        setEditedContent(projectData.project.custom_instructions || '');
        onUpdate?.(projectData.project);
      }

      toast.success('Context refreshed from master doc');
    } catch (error) {
      toast.error('Failed to refresh', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCancel = () => {
    setEditedContent(project.custom_instructions || '');
    setIsEditing(false);
  };

  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Header - always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between p-4 text-left hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Project Context</span>
              {isAdvisory && <EntityBadge entityType={project.entity_type} size="sm" />}
            </div>
            {!isExpanded && hasContent && (
              <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                {project.custom_instructions?.slice(0, 100)}...
              </p>
            )}
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-border p-4 space-y-4">
          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2">
            {isAdvisory && !isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh from file
              </Button>
            )}
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

          {/* Content */}
          {isEditing ? (
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              rows={10}
              className="font-mono text-sm"
              placeholder="Enter project context..."
            />
          ) : hasContent ? (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap text-sm bg-muted/50 p-4 rounded-lg overflow-x-auto">
                {project.custom_instructions}
              </pre>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              No context set. Click &quot;Refresh from file&quot; to generate from the master doc.
            </p>
          )}

          {/* Footer info */}
          {isAdvisory && (
            <p className="text-xs text-muted-foreground">
              This context is injected into all chats within this project.
              {project.advisory_folder_path && (
                <span className="block mt-1 font-mono">
                  Source: {project.advisory_folder_path}
                </span>
              )}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
