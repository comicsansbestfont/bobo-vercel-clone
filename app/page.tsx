'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChatInterface } from '@/components/chat/chat-interface';
import { AppSidebar } from '@/components/ui/app-sidebar';

const ChatBotDemo = () => {
  const searchParams = useSearchParams();
  const projectId = searchParams?.get('projectId') || undefined;

  return (
    <AppSidebar>
      <div className="flex min-h-svh flex-1 flex-col">
        {/* Main Content */}
        <div className="m-2 md:m-3 flex flex-1 flex-col rounded-lg md:rounded-2xl border border-border bg-background">
          <ChatInterface projectId={projectId} />
        </div>
      </div>
    </AppSidebar>
  );
};

export default function Page() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Loading chat...</div>}>
      <ChatBotDemo />
    </Suspense>
  );
}
