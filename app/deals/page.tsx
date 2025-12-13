'use client';

import { Suspense } from 'react';
import { AppSidebar } from '@/components/ui/app-sidebar';
import { DealsViewContainer } from '@/components/deals/deals-view-container';

function DealsContent() {
  return (
    <AppSidebar>
      <div className="flex min-h-svh flex-1 flex-col">
        <div className="m-1 md:m-2 flex flex-1 flex-col rounded-lg md:rounded-2xl border border-border bg-background overflow-hidden">
          <DealsViewContainer />
        </div>
      </div>
    </AppSidebar>
  );
}

export default function DealsPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Loading pipeline...</div>}>
      <DealsContent />
    </Suspense>
  );
}
