"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  IconDotsVertical,
  IconEdit,
  IconFolder,
  IconTrash,
} from "@tabler/icons-react";
import { toast } from "sonner";
import type { ChatWithProject, ProjectWithStats } from "@/lib/db/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RenameDialog, MoveToProjectDialog } from "@/components/chat/chat-dialogs";
import { ChatContextMenu } from "@/components/chat/chat-context-menu";

// Extended chat type with preview
interface ChatWithPreview extends ChatWithProject {
  preview?: string;
}

// Date formatting utility
function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
}

interface ProjectChatCardProps {
  chat: ChatWithPreview;
  projectId: string;
  projects: ProjectWithStats[];
  onUpdate: () => void;
}

function ProjectChatCard({
  chat,
  projectId,
  projects,
  onUpdate,
}: ProjectChatCardProps) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete "${chat.title}"? This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/chats/${chat.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete chat");

      toast.success("Chat deleted");
      onUpdate();
    } catch {
      toast.error("Failed to delete chat");
    }
  };

  const handleClick = () => {
    router.push(`/project/${projectId}?chatId=${chat.id}`);
  };

  return (
    <>
      <ChatContextMenu chat={chat} projects={projects} onUpdate={onUpdate}>
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => !menuOpen && setIsHovered(false)}
          onClick={handleClick}
          className="group relative cursor-pointer py-4 transition-colors hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 border-b border-neutral-100 dark:border-neutral-800 last:border-0"
        >
          {/* Header: Title + Date + Menu */}
          <div className="flex items-start justify-between gap-4">
            <h3 className="flex-1 truncate text-sm font-medium text-neutral-900 dark:text-neutral-100 group-hover:text-neutral-950 dark:group-hover:text-white">
              {chat.title}
            </h3>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-neutral-400 dark:text-neutral-500 tabular-nums">
                {formatRelativeDate(new Date(chat.updated_at))}
              </span>

              {/* Three-dot menu button - appears on hover */}
              <div className={isHovered || menuOpen ? "opacity-100" : "opacity-0"}>
                <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
                  <DropdownMenuTrigger asChild>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      className="flex h-5 w-5 items-center justify-center rounded text-neutral-400 hover:bg-neutral-200 hover:text-neutral-700 dark:text-neutral-500 dark:hover:bg-neutral-700 dark:hover:text-neutral-200"
                    >
                      <IconDotsVertical className="h-3 w-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenameOpen(true);
                      }}
                    >
                      <IconEdit className="mr-2 h-4 w-4" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setMoveOpen(true);
                      }}
                    >
                      <IconFolder className="mr-2 h-4 w-4" />
                      Move to Project
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete();
                      }}
                      className="text-destructive focus:text-destructive"
                    >
                      <IconTrash className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Preview */}
          {chat.preview && (
            <p className="mt-1 line-clamp-1 text-sm text-neutral-500 dark:text-neutral-400 pr-12">
              {chat.preview}
            </p>
          )}
        </div>
      </ChatContextMenu>

      {/* Dialogs */}
      <RenameDialog
        open={renameOpen}
        onOpenChange={setRenameOpen}
        chatId={chat.id}
        currentTitle={chat.title}
        onSuccess={onUpdate}
      />
      <MoveToProjectDialog
        open={moveOpen}
        onOpenChange={setMoveOpen}
        chatId={chat.id}
        currentProjectId={chat.project_id}
        onSuccess={onUpdate}
      />
    </>
  );
}

interface ProjectChatListProps {
  chats: ChatWithPreview[];
  projectId: string;
  projects: ProjectWithStats[];
  onUpdate: () => void;
}

export function ProjectChatList({
  chats,
  projectId,
  projects,
  onUpdate,
}: ProjectChatListProps) {
  if (chats.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col">
      {chats.map((chat) => (
        <ProjectChatCard
          key={chat.id}
          chat={chat}
          projectId={projectId}
          projects={projects}
          onUpdate={onUpdate}
        />
      ))}
    </div>
  );
}
