/**
 * Sidebar Main View Component
 *
 * Main view with DEALS, CLIENTS, PROJECTS, and RECENT sections
 *
 * M312B-11: Sidebar Main View
 */

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Briefcase,
  Users,
  Folder,
  FolderPlus,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  Pencil,
  Trash2,
  Archive,
  MessageSquare,
  Plus,
} from 'lucide-react';
import type { ProjectWithStats, ChatWithProject } from '@/lib/db/types';
import { StageIndicator } from './stage-indicator';
import type { SelectedEntity } from '@/hooks/use-sidebar-navigation';
import { useSidebar } from '@/components/ui/sidebar';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChatContextMenu } from '@/components/chat/chat-context-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

interface SidebarMainViewProps {
  projects: ProjectWithStats[];
  chats: ChatWithProject[];
  activeChatId?: string;
  onDrillInto: (entity: SelectedEntity) => void;
  onNewProject: () => void;
  onImportDeal: () => void;
  fetchData: () => void;
}

export function SidebarMainView({
  projects,
  chats,
  activeChatId,
  onDrillInto,
  onNewProject,
  onImportDeal,
  fetchData,
}: SidebarMainViewProps) {
  // Collapsible state for each section
  const [dealsOpen, setDealsOpen] = useState(true);
  const [clientsOpen, setClientsOpen] = useState(true);
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [recentOpen, setRecentOpen] = useState(true);
  const [showAllChats, setShowAllChats] = useState(false);

  // Separate projects by entity type
  const deals = projects.filter(p => p.entity_type === 'deal');
  const clients = projects.filter(p => p.entity_type === 'client');
  const personalProjects = projects.filter(p =>
    p.entity_type === 'personal' || !p.entity_type
  );

  // Recent chats - show 15 by default, all when expanded
  const INITIAL_CHAT_LIMIT = 15;
  const recentChats = showAllChats ? chats : chats.slice(0, INITIAL_CHAT_LIMIT);
  const hasMoreChats = chats.length > INITIAL_CHAT_LIMIT;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Deals Section */}
      <Collapsible open={dealsOpen} onOpenChange={setDealsOpen} className="group/collapsible">
        <SidebarGroup>
          <SidebarGroupLabel asChild>
            <CollapsibleTrigger className="flex w-full items-center gap-2 [&[data-state=open]>svg.chevron]:rotate-0">
              <ChevronDown className="chevron h-4 w-4 shrink-0 transition-transform -rotate-90" />
              <Briefcase className="h-4 w-4" />
              <span className="flex-1 text-left">Deals</span>
              {deals.length > 0 && (
                <span className="text-[10px] text-muted-foreground tabular-nums">{deals.length}</span>
              )}
            </CollapsibleTrigger>
          </SidebarGroupLabel>
          <CollapsibleContent>
            <SidebarGroupContent>
              <SidebarMenu>
                {deals.length === 0 ? (
                  <div className="px-2 py-2 text-sm text-muted-foreground">
                    No deals yet
                  </div>
                ) : (
                  deals.map(deal => (
                    <EntityRow
                      key={deal.id}
                      project={deal}
                      type="deal"
                      onDrillInto={onDrillInto}
                    />
                  ))
                )}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={onImportDeal}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Import Deal</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </CollapsibleContent>
        </SidebarGroup>
      </Collapsible>

      {/* Clients Section */}
      {(clients.length > 0 || deals.length > 0) && (
        <Collapsible open={clientsOpen} onOpenChange={setClientsOpen} className="group/collapsible">
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex w-full items-center gap-2 [&[data-state=open]>svg.chevron]:rotate-0">
                <ChevronDown className="chevron h-4 w-4 shrink-0 transition-transform -rotate-90" />
                <Users className="h-4 w-4" />
                <span className="flex-1 text-left">Clients</span>
                {clients.length > 0 && (
                  <span className="text-[10px] text-muted-foreground tabular-nums">{clients.length}</span>
                )}
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {clients.length === 0 ? (
                    <div className="px-2 py-2 text-sm text-muted-foreground">
                      No clients yet
                    </div>
                  ) : (
                    clients.map(client => (
                      <EntityRow
                        key={client.id}
                        project={client}
                        type="client"
                        onDrillInto={onDrillInto}
                      />
                    ))
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      )}

      <SidebarSeparator className="my-2" />

      {/* Projects Section */}
      <Collapsible open={projectsOpen} onOpenChange={setProjectsOpen} className="group/collapsible">
        <SidebarGroup>
          <SidebarGroupLabel asChild>
            <CollapsibleTrigger className="flex w-full items-center gap-2 [&[data-state=open]>svg.chevron]:rotate-0">
              <ChevronDown className="chevron h-4 w-4 shrink-0 transition-transform -rotate-90" />
              <Folder className="h-4 w-4" />
              <span className="flex-1 text-left">Projects</span>
              {personalProjects.length > 0 && (
                <span className="text-[10px] text-muted-foreground tabular-nums">{personalProjects.length}</span>
              )}
            </CollapsibleTrigger>
          </SidebarGroupLabel>
          <CollapsibleContent>
            <SidebarGroupContent>
              <SidebarMenu>
                {personalProjects.length === 0 ? (
                  <div className="px-2 py-2 text-sm text-muted-foreground">
                    No projects yet
                  </div>
                ) : (
                  personalProjects.map(project => (
                    <ProjectRow key={project.id} project={project} />
                  ))
                )}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={onNewProject}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <FolderPlus className="h-4 w-4" />
                    <span>New Project</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </CollapsibleContent>
        </SidebarGroup>
      </Collapsible>

      {/* Recent Chats Section */}
      <Collapsible open={recentOpen} onOpenChange={setRecentOpen} className="group/collapsible">
        <SidebarGroup>
          <SidebarGroupLabel asChild>
            <CollapsibleTrigger className="flex w-full items-center gap-2 [&[data-state=open]>svg.chevron]:rotate-0">
              <ChevronDown className="chevron h-4 w-4 shrink-0 transition-transform -rotate-90" />
              <MessageSquare className="h-4 w-4" />
              <span className="flex-1 text-left">Recent</span>
              {chats.length > 0 && (
                <span className="text-[10px] text-muted-foreground tabular-nums">{chats.length}</span>
              )}
            </CollapsibleTrigger>
          </SidebarGroupLabel>
          <CollapsibleContent>
            <SidebarGroupContent>
              <SidebarMenu>
                {recentChats.length === 0 ? (
                  <div className="px-2 py-2 text-sm text-muted-foreground">
                    No recent chats
                  </div>
                ) : (
                  <>
                    {recentChats.map(chat => (
                      <ChatRow
                        key={chat.id}
                        chat={chat}
                        isActive={chat.id === activeChatId}
                        projects={projects}
                        onUpdate={fetchData}
                      />
                    ))}
                    {hasMoreChats && (
                      <button
                        onClick={() => setShowAllChats(!showAllChats)}
                        className="w-full px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-md transition-colors text-center"
                      >
                        {showAllChats ? `Show less` : `See all ${chats.length} chats`}
                      </button>
                    )}
                  </>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </CollapsibleContent>
        </SidebarGroup>
      </Collapsible>
    </div>
  );
}

// Entity Row (Deal/Client) with stage indicator and drill-in arrow
interface EntityRowProps {
  project: ProjectWithStats;
  type: 'deal' | 'client';
  onDrillInto: (entity: SelectedEntity) => void;
}

function EntityRow({ project, type, onDrillInto }: EntityRowProps) {
  const [stage, setStage] = useState<string | null>(null);

  // Fetch stage from master doc
  useEffect(() => {
    if (project.advisory_folder_path) {
      fetch(`/api/advisory/master-doc?folderPath=${encodeURIComponent(project.advisory_folder_path)}`)
        .then(res => res.json())
        .then(data => {
          if (data.frontmatter?.stage) {
            setStage(data.frontmatter.stage);
          }
        })
        .catch(() => {});
    }
  }, [project.advisory_folder_path]);

  const handleClick = () => {
    onDrillInto({
      type,
      id: project.id,
      name: project.name,
      folderPath: project.advisory_folder_path || `advisory/${type}s/${project.name}`,
    });
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton onClick={handleClick} className="pr-2">
        <span className="truncate flex-1">{project.name}</span>
        <div className="flex items-center gap-2">
          {stage && <StageIndicator stage={stage} />}
          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover/menu-item:opacity-100 transition-opacity" />
        </div>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

// Project Row (regular projects - navigate to project page)
function ProjectRow({ project }: { project: ProjectWithStats }) {
  const { setOpenMobile, isMobile } = useSidebar();

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <Link
          href={`/project/${project.id}`}
          onClick={() => isMobile && setOpenMobile(false)}
        >
          <Folder className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">{project.name}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

// Chat Row with context menu
interface ChatRowProps {
  chat: ChatWithProject;
  isActive: boolean;
  projects: ProjectWithStats[];
  onUpdate: () => void;
}

function ChatRow({ chat, isActive, projects, onUpdate }: ChatRowProps) {
  const router = useRouter();
  const { setOpenMobile, isMobile } = useSidebar();
  const [menuOpen, setMenuOpen] = useState(false);

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
    <ChatContextMenu chat={chat} projects={projects} onUpdate={onUpdate}>
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={isActive}
          className="pr-8"
        >
          <Link
            href={`/?chatId=${chat.id}`}
            onClick={handleClick}
            title={chat.title}
          >
            <span className={`truncate ${!isActive ? 'text-muted-foreground' : ''}`}>{chat.title}</span>
          </Link>
        </SidebarMenuButton>

        {/* Three-dot menu */}
        <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/menu-item:opacity-100 group-focus-within/menu-item:opacity-100 transition-opacity">
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
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem disabled className="opacity-50">
                <Pencil className="mr-2 h-4 w-4" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem disabled className="opacity-50">
                <Folder className="mr-2 h-4 w-4" />
                Move to Project
              </DropdownMenuItem>
              <DropdownMenuItem disabled className="opacity-50">
                <Archive className="mr-2 h-4 w-4" />
                Archive
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
  );
}
