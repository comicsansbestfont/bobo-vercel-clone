'use client';

import { Suspense } from 'react';
import { use } from 'react';
import { AppSidebar } from '@/components/ui/app-sidebar';
import { DealProfile } from '@/components/deals/deal-profile';

function DealContent({ id }: { id: string }) {
  return (
    <AppSidebar>
      <div className="flex min-h-svh flex-1 flex-col">
        <div className="m-1 md:m-2 flex flex-1 flex-col rounded-lg md:rounded-2xl border border-border bg-background overflow-hidden">
          <DealProfile dealId={id} />
        </div>
      </div>
    </AppSidebar>
  );
}

export default function DealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Loading deal...</div>}>
      <DealContent id={id} />
    </Suspense>
  );
}
