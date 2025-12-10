/**
 * Sidebar Chat List Component
 *
 * Compact chat list for detail view, filtered by project
 *
 * M312B-09: Sidebar Chat List
 */

'use client';

import Link from 'next/link';
import { MessageSquare, Plus } from 'lucide-react';
import type { ChatWithProject } from '@/lib/db/types';
import { cn } from '@/lib/utils';

interface SidebarChatListProps {
  chats: ChatWithProject[];
  projectId: string;
  activeChatId?: string;
  onNewChat: () => void;
  onChatSelect?: () => void;
}

export function SidebarChatList({
  chats,
  projectId,
  activeChatId,
  onNewChat,
  onChatSelect,
}: SidebarChatListProps) {
  const projectChats = chats.filter(c => c.project_id === projectId);

  return (
    <div className="space-y-0.5">
      {projectChats.length === 0 ? (
        <p className="text-xs text-muted-foreground px-2 py-1">No chats yet</p>
      ) : (
        projectChats.map(chat => (
          <Link
            key={chat.id}
            href={`/?chatId=${chat.id}`}
            onClick={onChatSelect}
            className={cn(
              'flex items-center gap-1.5 px-2 py-1 text-xs rounded-md transition-colors',
              'hover:bg-sidebar-accent',
              activeChatId === chat.id && 'bg-sidebar-accent text-sidebar-accent-foreground'
            )}
          >
            <MessageSquare className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <span className="truncate">{chat.title || 'Untitled'}</span>
          </Link>
        ))
      )}
      <button
        onClick={onNewChat}
        className="flex items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground hover:text-foreground w-full rounded-md hover:bg-sidebar-accent transition-colors"
      >
        <Plus className="h-3.5 w-3.5 flex-shrink-0" />
        <span>New Chat</span>
      </button>
    </div>
  );
}
