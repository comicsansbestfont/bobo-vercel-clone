'use client';

import { Suspense } from 'react';
import { AppSidebar } from '@/components/ui/app-sidebar';
import { DealsKanban } from '@/components/deals/deals-kanban';

function DealsContent() {
  return (
    <AppSidebar>
      <div className="flex min-h-svh flex-1 flex-col">
        <div className="m-1 md:m-2 flex flex-1 flex-col rounded-lg md:rounded-2xl border border-border bg-background overflow-hidden">
          <DealsKanban />
        </div>
      </div>
    </AppSidebar>
  );
}

export default function DealsPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Loading deals...</div>}>
      <DealsContent />
    </Suspense>
  );
}
