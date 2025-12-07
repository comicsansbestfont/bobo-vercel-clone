'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { ProjectWithStats } from '@/lib/db/types';

// ============================================================================
// Rename Dialog
// ============================================================================

interface RenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chatId: string;
  currentTitle: string;
  onSuccess?: () => void;
}

export function RenameDialog({
  open,
  onOpenChange,
  chatId,
  currentTitle,
  onSuccess,
}: RenameDialogProps) {
  const [newTitle, setNewTitle] = useState(currentTitle);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync title when dialog opens
  useEffect(() => {
    if (open) {
      setNewTitle(currentTitle);
    }
  }, [open, currentTitle]);

  const handleRename = async () => {
    if (!newTitle.trim()) {
      toast.error('Title cannot be empty');
      return;
    }

    if (newTitle.trim() === currentTitle) {
      onOpenChange(false);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/chats/${chatId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim() }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to rename chat');
      }

      toast.success('Chat renamed successfully');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to rename chat'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename Chat</DialogTitle>
          <DialogDescription>
            Enter a new name for this chat
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-4">
          <Label htmlFor="chat-title">Chat Title</Label>
          <Input
            id="chat-title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleRename();
              }
            }}
            placeholder="Enter chat title"
            disabled={isSubmitting}
            autoFocus
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleRename} disabled={isSubmitting}>
            {isSubmitting ? 'Renaming...' : 'Rename'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Move to Project Dialog
// ============================================================================

interface MoveToProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chatId: string;
  currentProjectId?: string | null;
  onSuccess?: () => void;
}

export function MoveToProjectDialog({
  open,
  onOpenChange,
  chatId,
  currentProjectId,
  onSuccess,
}: MoveToProjectDialogProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    currentProjectId || null
  );
  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch projects when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedProjectId(currentProjectId || null);
      fetchProjects();
    }
  }, [open, currentProjectId]);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        // API returns { projects: [...], count: n }
        setProjects(data.projects || []);
      }
    } catch (error) {
      // Silently fail - projects dropdown will just be empty
    } finally {
      setIsLoading(false);
    }
  };

  const handleMoveToProject = async () => {
    if (selectedProjectId === currentProjectId) {
      onOpenChange(false);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/chats/${chatId}/project`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: selectedProjectId }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to move chat');
      }

      const actionMessage = selectedProjectId
        ? 'Chat moved to project'
        : 'Chat removed from project';
      toast.success(actionMessage);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to move chat'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to Project</DialogTitle>
          <DialogDescription>
            Select a project or choose &quot;No Project&quot; to make this chat
            standalone
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-4">
          <Label htmlFor="project-select">Project</Label>
          <Select
            value={selectedProjectId || 'none'}
            onValueChange={(value) =>
              setSelectedProjectId(value === 'none' ? null : value)
            }
            disabled={isSubmitting || isLoading}
          >
            <SelectTrigger id="project-select">
              <SelectValue placeholder={isLoading ? 'Loading...' : 'Select a project'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                <span className="text-muted-foreground">No Project</span>
              </SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleMoveToProject} disabled={isSubmitting || isLoading}>
            {isSubmitting ? 'Moving...' : 'Move'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Delete Dialog
// ============================================================================

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chatId: string;
  chatTitle?: string;
  onSuccess?: () => void;
}

export function DeleteDialog({
  open,
  onOpenChange,
  chatId,
  chatTitle = 'this chat',
  onSuccess,
}: DeleteDialogProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/chats/${chatId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to delete chat');
      }

      toast.success('Chat deleted successfully');
      onOpenChange(false);
      onSuccess?.();

      // If we're currently viewing this chat, redirect to home
      if (window.location.search.includes(chatId)) {
        router.push('/');
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete chat'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Chat</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;{chatTitle}&quot;? This
            action cannot be undone and all messages will be permanently
            deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isSubmitting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isSubmitting ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
