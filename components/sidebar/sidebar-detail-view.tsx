/**
 * Sidebar Detail View Component
 *
 * Detail view for drill-down navigation showing entity info, chats, and files
 *
 * M312B-10: Sidebar Detail View
 */

'use client';

import { useState } from 'react';
import { ArrowLeft, MessageSquare, FolderOpen, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EntityInfoCard } from './entity-info-card';
import { SidebarChatList } from './sidebar-chat-list';
import { DealFileTree } from './deal-file-tree';
import { FilePreviewModal } from './file-preview-modal';
import type { SelectedEntity } from '@/hooks/use-sidebar-navigation';
import type { ChatWithProject } from '@/lib/db/types';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface SidebarDetailViewProps {
  entity: SelectedEntity;
  chats: ChatWithProject[];
  activeChatId?: string;
  onBack: () => void;
  onNewChat: (projectId: string) => void;
  onChatSelect?: () => void;
}

export function SidebarDetailView({
  entity,
  chats,
  activeChatId,
  onBack,
  onNewChat,
  onChatSelect,
}: SidebarDetailViewProps) {
  const [previewPath, setPreviewPath] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [chatsOpen, setChatsOpen] = useState(true);
  const [filesOpen, setFilesOpen] = useState(false);

  const handleFileSelect = (path: string) => {
    setPreviewPath(path);
    setPreviewOpen(true);
  };

  const handleNewChat = () => {
    onNewChat(entity.id);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Compact header with back + entity info */}
      <div className="px-2 py-1.5 border-b flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="h-10 w-10 sm:h-8 sm:w-8 shrink-0 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
        </Button>
        <div className="flex-1 min-w-0">
          <EntityInfoCard
            type={entity.type}
            name={entity.name}
            folderPath={entity.folderPath}
          />
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Chats Section - Collapsible */}
        <Collapsible open={chatsOpen} onOpenChange={setChatsOpen}>
          <CollapsibleTrigger className="flex w-full items-center gap-1.5 px-2 py-1 text-xs font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50">
            <ChevronDown className={`h-3 w-3 transition-transform shrink-0 ${chatsOpen ? '' : '-rotate-90'}`} />
            <MessageSquare className="h-3 w-3 shrink-0" />
            <span>Chats</span>
            <span className="ml-auto text-[10px] text-muted-foreground tabular-nums">{chats.filter(c => c.project_id === entity.id).length}</span>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="pl-5 pr-1 pb-1">
              <SidebarChatList
                chats={chats}
                projectId={entity.id}
                activeChatId={activeChatId}
                onNewChat={handleNewChat}
                onChatSelect={onChatSelect}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Files Section - Collapsible */}
        <Collapsible open={filesOpen} onOpenChange={setFilesOpen}>
          <CollapsibleTrigger className="flex w-full items-center gap-1.5 px-2 py-1 text-xs font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50">
            <ChevronDown className={`h-3 w-3 transition-transform shrink-0 ${filesOpen ? '' : '-rotate-90'}`} />
            <FolderOpen className="h-3 w-3 shrink-0" />
            <span>Files</span>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="pl-5 pr-1 pb-1">
              <DealFileTree
                folderPath={entity.folderPath}
                onFileSelect={handleFileSelect}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* File Preview Modal */}
      <FilePreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        filePath={previewPath}
      />
    </div>
  );
}
