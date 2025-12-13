'use client';

import { Suspense } from 'react';
import { use } from 'react';
import { AppSidebar } from '@/components/ui/app-sidebar';
import { Building2 } from 'lucide-react';

function CompanyContent({ id }: { id: string }) {
  return (
    <AppSidebar>
      <div className="flex min-h-svh flex-1 flex-col">
        <div className="m-1 md:m-2 flex flex-1 flex-col rounded-lg md:rounded-2xl border border-border bg-background overflow-hidden">
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <Building2 className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h1 className="text-2xl font-semibold mb-2">Company Workspace</h1>
            <p className="text-muted-foreground mb-4">
              Company ID: {id}
            </p>
            <p className="text-sm text-muted-foreground max-w-md">
              The company workspace with three-column layout (info panel, content tabs, AI assistant)
              will be implemented in Phase 5.
            </p>
          </div>
        </div>
      </div>
    </AppSidebar>
  );
}

export default function CompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Loading company...</div>}>
      <CompanyContent id={id} />
    </Suspense>
  );
}
