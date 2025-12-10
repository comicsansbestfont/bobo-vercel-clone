/**
 * Sidebar Detail View Component
 *
 * Detail view for drill-down navigation showing entity info, chats, and files
 *
 * M312B-10: Sidebar Detail View
 */

'use client';

import { useState } from 'react';
import { ArrowLeft, MessageSquare, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EntityInfoCard } from './entity-info-card';
import { SidebarChatList } from './sidebar-chat-list';
import { DealFileTree } from './deal-file-tree';
import { FilePreviewModal } from './file-preview-modal';
import type { SelectedEntity } from '@/hooks/use-sidebar-navigation';
import type { ChatWithProject } from '@/lib/db/types';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from '@/components/ui/sidebar';

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

  const handleFileSelect = (path: string) => {
    setPreviewPath(path);
    setPreviewOpen(true);
  };

  const handleNewChat = () => {
    onNewChat(entity.id);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Back button header */}
      <div className="px-3 py-2 border-b">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-2 -ml-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </Button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Entity Info Card */}
        <div className="p-3">
          <EntityInfoCard
            type={entity.type}
            name={entity.name}
            folderPath={entity.folderPath}
          />
        </div>

        {/* Chats Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span>Chats</span>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarChatList
              chats={chats}
              projectId={entity.id}
              activeChatId={activeChatId}
              onNewChat={handleNewChat}
              onChatSelect={onChatSelect}
            />
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Files Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            <span>Files</span>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <DealFileTree
              folderPath={entity.folderPath}
              onFileSelect={handleFileSelect}
            />
          </SidebarGroupContent>
        </SidebarGroup>
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
