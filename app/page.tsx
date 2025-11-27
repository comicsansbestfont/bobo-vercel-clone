'use client';

import { Suspense } from 'react';
import { ChatInterface } from '@/components/chat/chat-interface';
import { AppSidebar, MobileHeader } from '@/components/ui/app-sidebar';
import { useSearchParams } from 'next/navigation';

const ChatBotDemo = () => {
  const searchParams = useSearchParams();
  const chatId = searchParams?.get('chatId');

  return (
    <AppSidebar>
      <div className="flex min-h-svh flex-1 flex-col">
        {/* Mobile Header - shows chat title or app name */}
        <MobileHeader title={chatId ? undefined : "Bobo AI"} />

        {/* Main Content */}
        <div className="m-1 md:m-2 flex flex-1 flex-col rounded-lg md:rounded-2xl border border-border bg-background">
          <ChatInterface />
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
