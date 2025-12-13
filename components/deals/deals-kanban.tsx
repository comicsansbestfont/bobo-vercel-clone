'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  KanbanProvider,
  KanbanBoard,
  KanbanHeader,
  KanbanCards,
  KanbanCard,
  type DragEndEvent,
} from '@/components/kibo-ui/kanban';
import { DEAL_STAGES, type DealStage } from '@/lib/sidebar/stage-config';
import { DealCard, type DealCardData } from './deal-card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Kanban column type matching our deal stages
interface KanbanColumn {
  id: string;
  name: string;
  color: string;
  [key: string]: unknown;
}

// Kanban item type for deals - needs index signature for dnd-kit compatibility
interface KanbanDeal extends DealCardData {
  column: string;
  [key: string]: unknown;
}

// Map deal stages to kanban columns
const KANBAN_COLUMNS: KanbanColumn[] = Object.entries(DEAL_STAGES).map(([stage, config]) => ({
  id: stage,
  name: config.label,
  color: config.color,
}));

export function DealsKanban() {
  const router = useRouter();
  const [deals, setDeals] = useState<KanbanDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch deals data
  useEffect(() => {
    async function fetchDeals() {
      try {
        setLoading(true);
        const res = await fetch('/api/deals');
        if (!res.ok) throw new Error('Failed to fetch deals');

        const data = await res.json();

        // Transform to kanban format
        const kanbanDeals: KanbanDeal[] = data.deals.map((deal: DealCardData) => ({
          ...deal,
          column: deal.stage || 'New Opportunity',
        }));

        setDeals(kanbanDeals);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load deals');
        toast.error('Failed to load deals');
      } finally {
        setLoading(false);
      }
    }

    fetchDeals();
  }, []);

  // Handle data changes from drag-and-drop
  const handleDataChange = async (newData: KanbanDeal[]) => {
    // Find the changed deal
    const changedDeal = newData.find((newDeal) => {
      const oldDeal = deals.find((d) => d.id === newDeal.id);
      return oldDeal && oldDeal.column !== newDeal.column;
    });

    // Optimistically update UI
    setDeals(newData);

    // If a deal moved to a new column, update the backend
    if (changedDeal) {
      try {
        const res = await fetch(`/api/deals/${changedDeal.id}/stage`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stage: changedDeal.column }),
        });

        if (!res.ok) throw new Error('Failed to update deal stage');

        toast.success(`Moved ${changedDeal.name} to ${changedDeal.column}`);
      } catch (err) {
        // Revert on error
        setDeals(deals);
        toast.error('Failed to update deal stage');
      }
    }
  };

  // Handle deal click to navigate to deal profile
  const handleDealClick = (dealId: string) => {
    router.push(`/deals/${dealId}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Deals Pipeline</h1>
        </div>
        <div className="grid grid-cols-6 gap-4 flex-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-destructive mb-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-4 md:p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Deals Pipeline</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{deals.length} deals</span>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <KanbanProvider
          columns={KANBAN_COLUMNS}
          data={deals}
          onDataChange={handleDataChange}
          className="!grid-cols-[repeat(6,300px)] min-w-max h-full"
        >
          {(column) => (
            <KanbanBoard key={column.id} id={column.id} className="min-w-[127px]">
              <KanbanHeader className="flex items-center gap-2">
                <div className={cn('h-2.5 w-2.5 rounded-full', column.color)} />
                <span className="font-medium">{column.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {deals.filter((d) => d.column === column.id).length}
                </span>
              </KanbanHeader>
              <KanbanCards id={column.id}>
                {(deal: KanbanDeal) => (
                  <KanbanCard
                    key={deal.id}
                    {...deal}
                  >
                    <DealCard deal={deal} onNavigate={() => handleDealClick(deal.id)} />
                  </KanbanCard>
                )}
              </KanbanCards>
            </KanbanBoard>
          )}
        </KanbanProvider>
      </div>
    </div>
  );
}
