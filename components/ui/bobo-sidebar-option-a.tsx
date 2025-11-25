"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  IconMessagePlus,
  IconFolder,
  IconSettings,
  IconUser,
  IconSearch,
  IconFolderPlus,
  IconDots,
  IconDotsVertical,
  IconClock,
  IconCalendar,
  IconBrain,
  IconHome,
  IconEdit,
  IconTrash,
  IconArchive,
} from "@tabler/icons-react";
import {
  Sidebar,
  SidebarBody,
  SidebarLink,
  Logo,
  LogoIcon,
  useSidebar,
} from "./collapsible-sidebar";
import type { ProjectWithStats, ChatWithProject } from "@/lib/db/types";
import { CreateProjectModal } from "@/components/project/create-project-modal";
import { toast } from "sonner";
import { Skeleton } from "./skeleton";
import { ThemeSwitcherConnected } from "@/components/theme-switcher-connected";
import { ChatContextMenu } from "@/components/chat/chat-context-menu";
import { RenameDialog, MoveToProjectDialog } from "@/components/chat/chat-dialogs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Skeleton loading components
const ProjectSkeleton = () => {
  const { open: sidebarOpen } = useSidebar();

  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <Skeleton className="h-4 w-4 flex-shrink-0" />
      <motion.div
        animate={{
          display: sidebarOpen ? "block" : "none",
          opacity: sidebarOpen ? 1 : 0,
        }}
        className="flex-1"
      >
        <Skeleton className="h-4 w-full" />
      </motion.div>
    </div>
  );
};

const ChatSkeleton = () => {
  const { open: sidebarOpen } = useSidebar();

  return (
    <div className="px-3 py-2">
      <motion.div
        animate={{
          display: sidebarOpen ? "block" : "none",
          opacity: sidebarOpen ? 1 : 0,
        }}
      >
        <Skeleton className="h-4 w-full" />
      </motion.div>
    </div>
  );
};

const SidebarLoadingState = () => {
  return (
    <div className="mt-4 space-y-2">
      <ProjectSkeleton />
      <ProjectSkeleton />
      <ProjectSkeleton />
      <div className="my-3 h-px bg-neutral-200/50 dark:bg-neutral-700/50" />
      <ChatSkeleton />
      <ChatSkeleton />
      <ChatSkeleton />
      <ChatSkeleton />
      <ChatSkeleton />
    </div>
  );
};

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
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

function formatAbsoluteDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
  });
}

// Search Bar Component
const SearchBar = () => {
  const { open: sidebarOpen } = useSidebar();

  return (
    <div className="relative mb-4">
      <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500 dark:text-neutral-400" />
      <input
        type="text"
        placeholder="Search"
        className={cn(
          "w-full rounded-lg border border-neutral-200 bg-neutral-50 py-2 pr-3 text-sm outline-none transition-all placeholder:text-neutral-500 focus:border-neutral-300 focus:bg-white dark:border-neutral-700 dark:bg-neutral-800 dark:placeholder:text-neutral-400 dark:focus:border-neutral-600 dark:focus:bg-neutral-900",
          sidebarOpen ? "pl-9" : "pl-3",
        )}
      />
    </div>
  );
};

// Simple Chat Item (no icons) with hover three-dot menu
const SimpleChatItem = ({
  chat,
  isActive = false,
  dateMode,
  projects,
  onUpdate,
}: {
  chat: ChatWithProject;
  isActive?: boolean;
  dateMode: 'updated' | 'created';
  projects: ProjectWithStats[];
  onUpdate: () => void;
}) => {
  const router = useRouter();
  const { open: sidebarOpen, setOpen: setSidebarOpen } = useSidebar();
  const [isHovered, setIsHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete "${chat.title}"? This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/chats/${chat.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete chat');

      toast.success('Chat deleted');
      onUpdate();

      if (window.location.search.includes(chat.id)) {
        router.push('/');
      }
    } catch {
      toast.error('Failed to delete chat');
    }
  };

  return (
    <>
      <ChatContextMenu chat={chat} projects={projects} onUpdate={onUpdate}>
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => !menuOpen && setIsHovered(false)}
          className={cn(
            "group relative flex items-center justify-between rounded-md text-sm transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800",
            isActive && "bg-neutral-100 dark:bg-neutral-800",
          )}
        >
          <Link
            href={`/?chatId=${chat.id}`}
            onClick={() => {
              if (window.innerWidth < 768) {
                setSidebarOpen(false);
              }
            }}
            onContextMenu={(e) => {
              e.preventDefault();
            }}
            className="flex-1 truncate px-3 py-2 text-neutral-700 dark:text-neutral-300"
          >
            <motion.span
              animate={{
                display: sidebarOpen ? "inline-block" : "none",
                opacity: sidebarOpen ? 1 : 0,
              }}
            >
              {chat.title}
            </motion.span>
          </Link>

          {/* Three-dot menu button - appears on hover */}
          {(isHovered || menuOpen) && sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-shrink-0 pr-1"
            >
              <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    className="flex h-6 w-6 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-200"
                  >
                    <IconDotsVertical className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setRenameOpen(true)}>
                    <IconEdit className="mr-2 h-4 w-4" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setMoveOpen(true)}>
                    <IconFolder className="mr-2 h-4 w-4" />
                    Move to Project
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled className="opacity-50">
                    <IconArchive className="mr-2 h-4 w-4" />
                    Archive
                    <span className="ml-auto text-[10px] text-muted-foreground">Soon</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <IconTrash className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </motion.div>
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
};

// Inline Project Item (no expansion)
const InlineProjectItem = ({ project }: { project: ProjectWithStats }) => {
  const { open: sidebarOpen, setOpen: setSidebarOpen } = useSidebar();

  return (
    <Link
      href={`/project/${project.id}`}
      onClick={() => {
        // Close sidebar on mobile when navigating to a project
        if (window.innerWidth < 768) {
          setSidebarOpen(false);
        }
      }}
      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
    >
      <IconFolder className="h-4 w-4 flex-shrink-0 text-neutral-600 dark:text-neutral-400" />
      <motion.span
        animate={{
          display: sidebarOpen ? "inline-block" : "none",
          opacity: sidebarOpen ? 1 : 0,
        }}
        className="flex-1 truncate text-neutral-700 dark:text-neutral-300"
      >
        {project.name}
      </motion.span>
    </Link>
  );
};

// See More Button
const SeeMoreButton = ({
  onClick,
  isExpanded,
}: {
  onClick: () => void;
  isExpanded: boolean;
}) => {
  const { open: sidebarOpen } = useSidebar();

  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
    >
      <IconDots className="h-4 w-4 flex-shrink-0" />
      <motion.span
        animate={{
          display: sidebarOpen ? "inline-block" : "none",
          opacity: sidebarOpen ? 1 : 0,
        }}
      >
        {isExpanded ? "Show less" : "See more"}
      </motion.span>
    </button>
  );
};

// New Project Button
const NewProjectButton = ({ onClick }: { onClick: () => void }) => {
  const { open: sidebarOpen } = useSidebar();

  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
    >
      <IconFolderPlus className="h-4 w-4 flex-shrink-0 text-neutral-600 dark:text-neutral-400" />
      <motion.span
        animate={{
          display: sidebarOpen ? "inline-block" : "none",
          opacity: sidebarOpen ? 1 : 0,
        }}
        className="text-neutral-700 dark:text-neutral-300"
      >
        New project
      </motion.span>
    </button>
  );
};

// Subtle Divider
const SubtleDivider = () => {
  return <div className="my-3 h-px bg-neutral-200/50 dark:bg-neutral-700/50" />;
};

// Date Mode Toggle
const DateModeToggle = ({
  dateMode,
  onToggle,
}: {
  dateMode: 'updated' | 'created';
  onToggle: () => void;
}) => {
  const { open: sidebarOpen } = useSidebar();

  return (
    <button
      onClick={onToggle}
      className="mb-2 flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-xs text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
      title={`Showing ${dateMode === 'updated' ? 'last updated' : 'created'} dates. Click to toggle.`}
    >
      {dateMode === 'updated' ? (
        <IconClock className="h-3.5 w-3.5 flex-shrink-0" />
      ) : (
        <IconCalendar className="h-3.5 w-3.5 flex-shrink-0" />
      )}
      <motion.span
        animate={{
          display: sidebarOpen ? "inline-block" : "none",
          opacity: sidebarOpen ? 1 : 0,
        }}
        className="text-left"
      >
        {dateMode === 'updated' ? 'Show created dates' : 'Show updated dates'}
      </motion.span>
    </button>
  );
};

// Main Bobo Sidebar Option A Component
export function BoboSidebarOptionA({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [dateMode, setDateMode] = useState<'updated' | 'created'>('updated');
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);

  // Initialize sidebar state based on screen size
  useEffect(() => {
    if (window.innerWidth >= 768) {
      setOpen(true);
    }
  }, []);

  // Real data states
  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [chats, setChats] = useState<ChatWithProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch projects and chats from API
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [projectsRes, chatsRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/chats'),
      ]);

      if (!projectsRes.ok || !chatsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const projectsData = await projectsRes.json();
      const chatsData = await chatsRes.json();

      setProjects(projectsData.projects || []);
      setChats(chatsData.chats || []);
    } catch (err) {
      console.error('Failed to fetch sidebar data:', err);
      const errorMessage = 'Failed to load sidebar data';
      setError(errorMessage);
      toast.error(errorMessage, {
        description: 'Unable to load projects and chats. Please try refreshing the page.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Refresh sidebar when URL changes (new chat created or navigation)
  useEffect(() => {
    const chatId = searchParams?.get('chatId');
    if (chatId) {
      // Debounce to avoid multiple rapid fetches
      const timeoutId = setTimeout(() => {
        fetchData();
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [searchParams]);

  const visibleProjects = showAllProjects
    ? projects
    : projects.slice(0, 3);

  const toggleDateMode = () => {
    setDateMode(prev => prev === 'updated' ? 'created' : 'updated');
  };

  const handleProjectCreated = (projectId: string) => {
    // Navigate to the newly created project
    router.push(`/project/${projectId}`);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden bg-gray-100 dark:bg-neutral-800">
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-0">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            {/* Logo and New Chat Button Row */}
            <div className="mb-4 flex items-center justify-between gap-2">
              {open ? <Logo /> : <LogoIcon />}

              {/* New Chat Button - Right aligned */}
              <button
                onClick={() => {
                  // If we're on the home page, force a reload to clear chat state
                  if (pathname === '/') {
                    window.location.href = '/';
                  } else {
                    router.push('/');
                  }
                  // Close sidebar on mobile after creating new chat
                  if (window.innerWidth < 768) {
                    setOpen(false);
                  }
                }}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors",
                  !open && "px-2",
                )}
                title="New Chat"
              >
                <IconMessagePlus className="h-4 w-4 flex-shrink-0" />
              </button>
            </div>

            {/* Search Bar */}
            <SearchBar />

            {/* New Project Button */}
            <NewProjectButton onClick={() => setIsCreateProjectModalOpen(true)} />

            {/* Loading State */}
            {loading && <SidebarLoadingState />}

            {/* Error State */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded text-sm">
                {error}
              </div>
            )}

            {/* Projects - Inline (no section header) */}
            {!loading && !error && (
              <div className="mt-1 space-y-0.5">
                {visibleProjects.map((project) => (
                  <InlineProjectItem key={project.id} project={project} />
                ))}
                {projects.length > 4 && (
                  <SeeMoreButton
                    onClick={() => setShowAllProjects(!showAllProjects)}
                    isExpanded={showAllProjects}
                  />
                )}
                {projects.length === 0 && (
                  <div className="py-4 text-center text-sm text-neutral-500">
                    No projects yet. Create one to get started!
                  </div>
                )}
              </div>
            )}

            {/* Subtle Divider */}
            {!loading && !error && <SubtleDivider />}

            {/* Date Mode Toggle */}
            {!loading && !error && chats.length > 0 && (
              <DateModeToggle dateMode={dateMode} onToggle={toggleDateMode} />
            )}

            {/* Chats - Flat List (no section header, no icons) */}
            {!loading && !error && (
              <div className="space-y-0.5">
                {chats.map((chat) => {
                  const currentChatId = searchParams?.get('chatId');
                  return (
                    <SimpleChatItem
                      key={chat.id}
                      chat={chat}
                      isActive={chat.id === currentChatId}
                      dateMode={dateMode}
                      projects={projects}
                      onUpdate={fetchData}
                    />
                  );
                })}
                {chats.length === 0 && (
                  <div className="py-4 text-center text-sm text-neutral-500">
                    No chats yet. Start a conversation!
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Footer Bar */}
          <div className="border-t border-neutral-200 dark:border-neutral-700 py-3">
            <div className="flex items-center justify-around">
              <Link
                href="/"
                onClick={() => {
                  if (window.innerWidth < 768) setOpen(false);
                }}
                className="flex h-11 w-11 items-center justify-center rounded-lg text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100 transition-colors"
                title="Home"
              >
                <IconHome className="h-5 w-5" />
              </Link>
              <Link
                href="/memory"
                onClick={() => {
                  if (window.innerWidth < 768) setOpen(false);
                }}
                className="flex h-11 w-11 items-center justify-center rounded-lg text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100 transition-colors"
                title="Memory"
              >
                <IconBrain className="h-5 w-5" />
              </Link>
              <Link
                href="/settings/profile"
                onClick={() => {
                  if (window.innerWidth < 768) setOpen(false);
                }}
                className="flex h-11 w-11 items-center justify-center rounded-lg text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100 transition-colors"
                title="Profile"
              >
                <IconUser className="h-5 w-5" />
              </Link>
              <div className="flex h-11 items-center justify-center">
                <ThemeSwitcherConnected />
              </div>
            </div>
          </div>
        </SidebarBody>
      </Sidebar>
      {children}

      {/* Create Project Modal */}
      <CreateProjectModal
        open={isCreateProjectModalOpen}
        onOpenChange={setIsCreateProjectModalOpen}
        onProjectCreated={handleProjectCreated}
      />
    </div>
  );
}
