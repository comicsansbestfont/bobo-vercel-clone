"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  MessageSquarePlus,
  Folder,
  User,
  Search,
  FolderPlus,
  MoreHorizontal,
  MoreVertical,
  Clock,
  Calendar,
  Brain,
  Home,
  Pencil,
  Trash2,
  Archive,
  Kanban,
  X,
} from "lucide-react";
import { useSidebarNavigation } from "@/hooks/use-sidebar-navigation";
import { SidebarMainView } from "@/components/sidebar/sidebar-main-view";
import { SidebarDetailView } from "@/components/sidebar/sidebar-detail-view";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  SidebarSeparator,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import type { ProjectWithStats, ChatWithProject } from "@/lib/db/types";
import { CreateProjectModal } from "@/components/project/create-project-modal";
import { ImportWizard } from "@/components/advisory/import-wizard";
import { BulkImport } from "@/components/advisory/bulk-import";
import { EntityIndicator } from "@/components/advisory/entity-badge";
import { toast } from "sonner";
import { Skeleton } from "./skeleton";
import { ThemeSwitcherConnected } from "@/components/theme-switcher-connected";
import { ModeSwitcher } from "@/components/sidebar/mode-switcher";
import { CRMSidebarContent } from "@/components/sidebar/crm-sidebar-content";
import { useCurrentMode } from "@/hooks/use-current-mode";
import { ChatContextMenu } from "@/components/chat/chat-context-menu";
import { RenameDialog, MoveToProjectDialog } from "@/components/chat/chat-dialogs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

// Custom Logo with smart navigation
const BoboLogo = () => {
  const router = useRouter();
  const { setOpenMobile, isMobile } = useSidebar();

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    router.push('/');
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Link
      href="/"
      onClick={handleLogoClick}
      className="flex items-center gap-2 px-2 py-1"
    >
      <div className="h-5 w-6 flex-shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-black dark:bg-white" />
      <span className="font-medium text-foreground">Bobo AI</span>
    </Link>
  );
};

// Skeleton loading components
const SidebarLoadingState = () => {
  return (
    <div className="space-y-2 p-2">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-3/4" />
      <div className="my-3 h-px bg-sidebar-border" />
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-6 w-4/5" />
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-6 w-3/4" />
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

// Search Bar Component
const SearchBar = () => {
  return (
    <div className="relative px-2">
      <Search className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Search"
        className="pl-9 h-9 bg-sidebar-accent/50"
      />
    </div>
  );
};

// Simple Chat Item with hover menu
const SimpleChatItem = ({
  chat,
  isActive = false,
  projects,
  onUpdate,
}: {
  chat: ChatWithProject;
  isActive?: boolean;
  projects: ProjectWithStats[];
  onUpdate: () => void;
}) => {
  const router = useRouter();
  const { setOpenMobile, isMobile } = useSidebar();
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

  const handleClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <>
      <ChatContextMenu chat={chat} projects={projects} onUpdate={onUpdate}>
        <SidebarMenuItem>
          <SidebarMenuButton
            asChild
            isActive={isActive}
            className="group pr-8"
          >
            <Link
              href={`/?chatId=${chat.id}`}
              onClick={handleClick}
              title={chat.title}
            >
              <span className="truncate">{chat.title}</span>
            </Link>
          </SidebarMenuButton>

          {/* Three-dot menu - visible on hover/focus */}
          <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
            <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36 sm:w-48">
                <DropdownMenuItem onClick={() => setRenameOpen(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setMoveOpen(true)}>
                  <Folder className="mr-2 h-4 w-4" />
                  Move to Project
                </DropdownMenuItem>
                <DropdownMenuItem disabled className="opacity-50">
                  <Archive className="mr-2 h-4 w-4" />
                  Archive
                  <span className="ml-auto text-[10px] text-muted-foreground">Soon</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </SidebarMenuItem>
      </ChatContextMenu>

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

// Project Item
const ProjectItem = ({ project }: { project: ProjectWithStats }) => {
  const { setOpenMobile, isMobile } = useSidebar();

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <Link
          href={`/project/${project.id}`}
          onClick={() => isMobile && setOpenMobile(false)}
          className="flex items-center gap-2"
        >
          <Folder className="h-4 w-4 flex-shrink-0" />
          <span className="truncate flex-1">{project.name}</span>
          {/* M38: Entity type indicator for advisory projects */}
          {project.entity_type && (
            <EntityIndicator entityType={project.entity_type} />
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
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
  return (
    <SidebarMenuItem>
      <SidebarMenuButton onClick={onClick}>
        <MoreHorizontal className="h-4 w-4" />
        <span>{isExpanded ? "Show less" : "See more"}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};

// Date Mode Toggle
const DateModeToggle = ({
  dateMode,
  onToggle,
}: {
  dateMode: 'updated' | 'created';
  onToggle: () => void;
}) => {
  return (
    <button
      onClick={onToggle}
      className="flex w-full items-center gap-2 px-4 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      title={`Showing ${dateMode === 'updated' ? 'last updated' : 'created'} dates. Click to toggle.`}
    >
      {dateMode === 'updated' ? (
        <Clock className="h-3.5 w-3.5" />
      ) : (
        <Calendar className="h-3.5 w-3.5" />
      )}
      <span>{dateMode === 'updated' ? 'Show created dates' : 'Show updated dates'}</span>
    </button>
  );
};

// Inner sidebar content (uses useSidebar hook)
function AppSidebarContent({
  projects,
  chats,
  loading,
  error,
  fetchData,
}: {
  projects: ProjectWithStats[];
  chats: ChatWithProject[];
  loading: boolean;
  error: string | null;
  fetchData: () => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setOpenMobile, isMobile } = useSidebar();
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
  // M38: Advisory import modals
  const [isImportWizardOpen, setIsImportWizardOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

  // M312B: Drill-down navigation
  const { selectedEntity, drillInto, goBack, isDetailView } = useSidebarNavigation();

  // Current app mode (workspace, crm, studio)
  const currentMode = useCurrentMode();

  const handleNewChat = (projectId?: string) => {
    if (projectId) {
      // Create new chat in specific project context
      router.push(`/?projectId=${projectId}`);
    } else {
      router.push('/');
    }
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const handleProjectCreated = (projectId: string) => {
    router.push(`/project/${projectId}`);
  };

  const handleChatSelect = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const currentChatId = searchParams?.get('chatId') || undefined;

  return (
    <>
      <SidebarHeader className="gap-3">
        {/* Mode Switcher with Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <ModeSwitcher />
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => handleNewChat()}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              title="New Chat"
            >
              <MessageSquarePlus className="h-4 w-4" />
            </button>
            {/* Mobile close button */}
            {isMobile && (
              <button
                onClick={() => setOpenMobile(false)}
                aria-label="Close sidebar"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground hover:bg-sidebar-accent transition-colors"
                title="Close sidebar"
              >
                <X className="h-5 w-5" />
              </button>
            )}
            {/* Close/Collapse sidebar button */}
            <SidebarTrigger className="h-8 w-8" />
          </div>
        </div>

        {/* Search Bar */}
        <SearchBar />
      </SidebarHeader>

      <SidebarContent className="flex-1 overflow-hidden">
        {/* Loading State - only show for workspace mode */}
        {loading && currentMode === 'workspace' && <SidebarLoadingState />}

        {/* Error State - only show for workspace mode */}
        {error && currentMode === 'workspace' && (
          <div className="mx-2 p-3 bg-destructive/10 text-destructive rounded text-sm">
            {error}
          </div>
        )}

        {/* Mode-specific content */}
        {currentMode === 'crm' ? (
          <CRMSidebarContent />
        ) : (
          /* Workspace mode: conditional rendering based on navigation state */
          !loading && !error && (
            isDetailView && selectedEntity ? (
              <SidebarDetailView
                entity={selectedEntity}
                chats={chats}
                activeChatId={currentChatId}
                onBack={goBack}
                onNewChat={handleNewChat}
                onChatSelect={handleChatSelect}
              />
            ) : (
              <SidebarMainView
                projects={projects}
                chats={chats}
                activeChatId={currentChatId}
                onDrillInto={drillInto}
                onNewProject={() => setIsCreateProjectModalOpen(true)}
                onImportDeal={() => setIsBulkImportOpen(true)}
                fetchData={fetchData}
              />
            )
          )
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <div className="flex items-center justify-around py-2">
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Home">
                <Link
                  href="/"
                  onClick={() => isMobile && setOpenMobile(false)}
                >
                  <Home className="h-5 w-5" />
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Deals Pipeline">
                <Link
                  href="/deals"
                  onClick={() => isMobile && setOpenMobile(false)}
                >
                  <Kanban className="h-5 w-5" />
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Memory">
                <Link
                  href="/memory"
                  onClick={() => isMobile && setOpenMobile(false)}
                >
                  <Brain className="h-5 w-5" />
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Profile">
                <Link
                  href="/settings/profile"
                  onClick={() => isMobile && setOpenMobile(false)}
                >
                  <User className="h-5 w-5" />
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <div className="flex h-10 items-center justify-center">
                <ThemeSwitcherConnected />
              </div>
            </SidebarMenuItem>
          </div>
        </SidebarMenu>
      </SidebarFooter>

      <CreateProjectModal
        open={isCreateProjectModalOpen}
        onOpenChange={setIsCreateProjectModalOpen}
        onProjectCreated={handleProjectCreated}
        onOpenImportWizard={() => setIsImportWizardOpen(true)}
        onOpenBulkImport={() => setIsBulkImportOpen(true)}
      />

      {/* M38: Advisory Import Modals */}
      <ImportWizard
        open={isImportWizardOpen}
        onOpenChange={setIsImportWizardOpen}
        onProjectCreated={(projectId) => {
          fetchData();
          handleProjectCreated(projectId);
        }}
      />

      <BulkImport
        open={isBulkImportOpen}
        onOpenChange={setIsBulkImportOpen}
        onImportComplete={() => {
          fetchData();
        }}
      />
    </>
  );
}

// Mobile Header Component (shows toggle on mobile or when sidebar is collapsed)
export function MobileHeader({ title }: { title?: string }) {
  const { state, isMobile } = useSidebar();
  const showHeader = isMobile || state === "collapsed";

  if (!showHeader) {
    return null;
  }

  return (
    <header className="sticky top-0 z-20 flex h-12 items-center gap-2 border-b border-border bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/75 md:px-4">
      <SidebarTrigger className="-ml-1 h-8 w-8" />
      <span className="flex-1 truncate text-sm font-medium">
        {title || "Bobo AI"}
      </span>
    </header>
  );
}

// Cookie helper to read sidebar state
function getSidebarStateFromCookie(): boolean {
  if (typeof document === 'undefined') return true;
  const cookies = document.cookie.split(';');
  const sidebarCookie = cookies.find(c => c.trim().startsWith('sidebar_state='));
  if (sidebarCookie) {
    const value = sidebarCookie.split('=')[1];
    return value === 'true';
  }
  return true; // Default to open
}

// Main App Sidebar Component
export function AppSidebar({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const [defaultOpen, setDefaultOpen] = useState(true);

  // Read cookie on mount for sidebar state persistence
  useEffect(() => {
    setDefaultOpen(getSidebarStateFromCookie());
  }, []);

  // Data states
  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [chats, setChats] = useState<ChatWithProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data
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
      setError('Failed to load sidebar data');
      toast.error('Failed to load sidebar data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Refresh on URL changes
  useEffect(() => {
    const chatId = searchParams?.get('chatId');
    if (chatId) {
      const timeoutId = setTimeout(fetchData, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [searchParams]);

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <Sidebar variant="inset" collapsible="icon">
        <AppSidebarContent
          projects={projects}
          chats={chats}
          loading={loading}
          error={error}
          fetchData={fetchData}
        />
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
