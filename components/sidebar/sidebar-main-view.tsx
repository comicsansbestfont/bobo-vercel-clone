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
  // Separate projects by entity type
  const deals = projects.filter(p => p.entity_type === 'deal');
  const clients = projects.filter(p => p.entity_type === 'client');
  const personalProjects = projects.filter(p =>
    p.entity_type === 'personal' || !p.entity_type
  );

  // Recent chats (not tied to a specific project in the detail view)
  const recentChats = chats.slice(0, 5);

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Deals Section */}
      <SidebarGroup>
        <SidebarGroupLabel className="flex items-center gap-2">
          <Briefcase className="h-4 w-4" />
          <span>Deals</span>
        </SidebarGroupLabel>
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
      </SidebarGroup>

      {/* Clients Section */}
      {(clients.length > 0 || deals.length > 0) && (
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Clients</span>
          </SidebarGroupLabel>
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
        </SidebarGroup>
      )}

      <SidebarSeparator className="my-2" />

      {/* Projects Section */}
      <SidebarGroup>
        <SidebarGroupLabel className="flex items-center gap-2">
          <Folder className="h-4 w-4" />
          <span>Projects</span>
        </SidebarGroupLabel>
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
      </SidebarGroup>

      {/* Recent Chats Section */}
      <SidebarGroup>
        <SidebarGroupLabel className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          <span>Recent</span>
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {recentChats.length === 0 ? (
              <div className="px-2 py-2 text-sm text-muted-foreground">
                No recent chats
              </div>
            ) : (
              recentChats.map(chat => (
                <ChatRow
                  key={chat.id}
                  chat={chat}
                  isActive={chat.id === activeChatId}
                  projects={projects}
                  onUpdate={fetchData}
                />
              ))
            )}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
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
      <SidebarMenuButton onClick={handleClick} className="group pr-2">
        <span className="truncate flex-1">{project.name}</span>
        <div className="flex items-center gap-2">
          {stage && <StageIndicator stage={stage} />}
          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
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

        {/* Three-dot menu */}
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
