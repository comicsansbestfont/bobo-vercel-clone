'use client';

import { Suspense } from 'react';
import { ChatInterface } from '@/components/chat/chat-interface';
import { AppSidebar } from '@/components/ui/app-sidebar';
import { InfoIcon } from 'lucide-react';
import Link from 'next/link';

const ChatBotDemo = () => {
  return (
    <AppSidebar>
      <div className="flex min-h-svh flex-1 flex-col">
        {/* BETA Banner for Memory Tools */}
        <div className="m-1 md:m-2 mb-0 rounded-t-lg md:rounded-t-2xl border border-b-0 border-border bg-amber-50 dark:bg-amber-950/30 px-3 py-2">
          <div className="flex items-center gap-2 text-xs text-amber-900 dark:text-amber-200">
            <InfoIcon className="h-3.5 w-3.5 flex-shrink-0" />
            <p>
              <strong>Memory Tools (BETA):</strong> Bobo can remember facts about you automatically. Updates happen without confirmation.{' '}
              <Link href="/memory" className="underline hover:text-amber-700 dark:hover:text-amber-100">
                View your memories
              </Link>
            </p>
          </div>
        </div>
        {/* Main Content */}
        <div className="m-1 md:m-2 mt-0 flex flex-1 flex-col rounded-b-lg md:rounded-b-2xl rounded-t-none border border-border bg-background">
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
