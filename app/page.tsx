'use client';

import { Suspense } from 'react';
import { ChatInterface } from '@/components/chat/chat-interface';
import { BoboSidebarOptionA } from '@/components/ui/bobo-sidebar-option-a';

const ChatBotDemo = () => {
  return (
    <BoboSidebarOptionA>
      <div className="m-2 flex flex-1 flex-col rounded-2xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900">
        <ChatInterface />
      </div>
    </BoboSidebarOptionA>
  );
};

export default function Page() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Loading chat...</div>}>
      <ChatBotDemo />
    </Suspense>
  );
}
