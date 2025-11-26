'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
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
import {
  IconEdit,
  IconTrash,
  IconFolder,
  IconArchive,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import type { ChatWithProject, ProjectWithStats } from '@/lib/db/types';

interface ChatContextMenuProps {
  chat: ChatWithProject;
  projects: ProjectWithStats[];
  onUpdate?: () => void;
  children: React.ReactNode;
}

export function ChatContextMenu({
  chat,
  projects,
  onUpdate,
  children,
}: ChatContextMenuProps) {
  const router = useRouter();
  // ContextMenu handles open state internally better for right clicks, 
  // but we can still control it if needed. For now, let's rely on default behavior 
  // or use onOpenChange if we need to track it.
  // const [contextMenuOpen, setContextMenuOpen] = useState(false); 

  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [newTitle, setNewTitle] = useState(chat.title);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    chat.project_id
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle rename
  const handleRename = async () => {
    if (!newTitle.trim()) {
      toast.error('Title cannot be empty');
      return;
    }

    if (newTitle.trim() === chat.title) {
      setRenameDialogOpen(false);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/chats/${chat.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim() }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to rename chat');
      }

      toast.success('Chat renamed successfully');
      setRenameDialogOpen(false);
      onUpdate?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to rename chat'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle move to project
  const handleMoveToProject = async () => {
    if (selectedProjectId === chat.project_id) {
      setMoveDialogOpen(false);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/chats/${chat.id}/project`, {
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
      setMoveDialogOpen(false);
      onUpdate?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to move chat'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/chats/${chat.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to delete chat');
      }

      toast.success('Chat deleted successfully');
      setDeleteDialogOpen(false);
      onUpdate?.();

      // If we're currently viewing this chat, redirect to home
      if (window.location.search.includes(chat.id)) {
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
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuItem
            onClick={() => {
              setNewTitle(chat.title);
              setRenameDialogOpen(true);
            }}
          >
            <IconEdit className="mr-2 h-4 w-4" />
            Rename
          </ContextMenuItem>

          <ContextMenuItem
            onClick={() => {
              setSelectedProjectId(chat.project_id);
              setMoveDialogOpen(true);
            }}
          >
            <IconFolder className="mr-2 h-4 w-4" />
            Move to Project
          </ContextMenuItem>

          <ContextMenuItem disabled className="opacity-50">
            <IconArchive className="mr-2 h-4 w-4" />
            Archive
            <span className="ml-auto text-[10px] text-muted-foreground">
              Soon
            </span>
          </ContextMenuItem>

          <ContextMenuSeparator />

          <ContextMenuItem
            onClick={() => {
              setDeleteDialogOpen(true);
            }}
            className="text-destructive focus:text-destructive"
          >
            <IconTrash className="mr-2 h-4 w-4" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
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
              onClick={() => setRenameDialogOpen(false)}
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

      {/* Move to Project Dialog */}
      <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move to Project</DialogTitle>
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
              disabled={isSubmitting}
            >
              <SelectTrigger id="project-select">
                <SelectValue placeholder="Select a project" />
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
              onClick={() => setMoveDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleMoveToProject} disabled={isSubmitting}>
              {isSubmitting ? 'Moving...' : 'Move'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{chat.title}&quot;? This
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
    </>
  );
}
