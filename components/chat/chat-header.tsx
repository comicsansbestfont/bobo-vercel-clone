'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  IconStar,
  IconEdit,
  IconFolder,
  IconTrash,
} from '@tabler/icons-react';
import { RenameDialog, MoveToProjectDialog, DeleteDialog } from './chat-dialogs';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';

interface ChatHeaderProps {
  chatId: string;
  title: string;
  projectId?: string | null;
  projectName?: string | null;
  onTitleChange?: (newTitle: string) => void;
  onDelete?: () => void;
}

export function ChatHeader({
  chatId,
  title,
  projectId,
  projectName: initialProjectName,
  onTitleChange,
  onDelete,
}: ChatHeaderProps) {
  const { isMobile, state } = useSidebar();
  // Show trigger on mobile OR when sidebar is collapsed on desktop
  const showTrigger = isMobile || state === 'collapsed';
  const [renameOpen, setRenameOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [projectName, setProjectName] = useState<string | null>(initialProjectName || null);

  // Fetch project name if we have projectId but no name
  useEffect(() => {
    if (projectId && !projectName) {
      fetch(`/api/projects/${projectId}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.name) {
            setProjectName(data.name);
          }
        })
        .catch(() => {});
    }
  }, [projectId, projectName]);

  // Update project name when prop changes
  useEffect(() => {
    if (initialProjectName) {
      setProjectName(initialProjectName);
    }
  }, [initialProjectName]);

  return (
    <>
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center gap-1 min-w-0">
          {/* Sidebar trigger - shown on mobile or when sidebar is collapsed on desktop */}
          {showTrigger && (
            <SidebarTrigger className="h-8 w-8 mr-1 -ml-1 flex-shrink-0" />
          )}

          {/* Breadcrumb: Project Name */}
          {projectId && projectName && (
            <>
              <Link
                href={`/project/${projectId}`}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors truncate max-w-[150px] md:max-w-[200px]"
              >
                {projectName}
              </Link>
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </>
          )}

          {/* Chat Title Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 px-2 py-1 rounded-md transition-colors outline-none">
              <span className="truncate max-w-[200px] md:max-w-[300px]">{title}</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem disabled className="opacity-50">
              <IconStar className="mr-2 h-4 w-4" />
              Star
              <span className="ml-auto text-[10px] text-muted-foreground">Soon</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setRenameOpen(true)}>
              <IconEdit className="mr-2 h-4 w-4" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setMoveOpen(true)}>
              <IconFolder className="mr-2 h-4 w-4" />
              Add to project
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setDeleteOpen(true)}
              className="text-destructive focus:text-destructive"
            >
              <IconTrash className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      </div>

      {/* Dialogs */}
      <RenameDialog
        open={renameOpen}
        onOpenChange={setRenameOpen}
        chatId={chatId}
        currentTitle={title}
        onSuccess={onTitleChange ? () => onTitleChange(title) : undefined}
      />
      <MoveToProjectDialog
        open={moveOpen}
        onOpenChange={setMoveOpen}
        chatId={chatId}
        currentProjectId={projectId}
      />
      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        chatId={chatId}
        chatTitle={title}
        onSuccess={onDelete}
      />
    </>
  );
}
