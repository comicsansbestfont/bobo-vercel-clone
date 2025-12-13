'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { LayoutGrid, Table2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { DealsKanban } from './deals-kanban';
import { DealsTable } from './deals-table';
import type { DealData, ViewMode } from './types';
import type { DealStage } from '@/lib/sidebar/stage-config';
import { normalizeStageKey, getStageLabel } from '@/lib/sidebar/stage-config';
import { toast } from 'sonner';

export function DealsViewContainer() {
  const [deals, setDeals] = useState<DealData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>('kanban');

  // Fetch deals
  useEffect(() => {
    async function fetchDeals() {
      try {
        setLoading(true);
        const res = await fetch('/api/deals');
        if (!res.ok) throw new Error('Failed to fetch deals');
        const data = await res.json();

        // Normalize stage keys from API
        const normalized: DealData[] = data.deals.map((deal: DealData & { stage?: string }) => ({
          ...deal,
          stage: normalizeStageKey(deal.stage),
        }));

        setDeals(normalized);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load deals');
        toast.error('Failed to load deals');
      } finally {
        setLoading(false);
      }
    }
    fetchDeals();
  }, []);

  // Handle stage change (shared between kanban and table)
  const handleStageChange = useCallback(
    async (dealId: string, newStage: DealStage) => {
      const previousDeals = [...deals];
      const deal = deals.find((d) => d.id === dealId);

      // Optimistic update
      setDeals(deals.map((d) => (d.id === dealId ? { ...d, stage: newStage } : d)));

      try {
        const res = await fetch(`/api/deals/${dealId}/stage`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stage: newStage }),
        });

        if (!res.ok) throw new Error('Failed to update stage');

        toast.success(`Moved ${deal?.name} to ${getStageLabel(newStage)}`);
      } catch {
        // Revert on error
        setDeals(previousDeals);
        toast.error('Failed to update deal stage');
      }
    },
    [deals]
  );

  // Handle bulk data change from kanban drag-drop
  const handleKanbanDataChange = useCallback(
    async (newDeals: DealData[]) => {
      // Find the changed deal
      const changedDeal = newDeals.find((newDeal) => {
        const oldDeal = deals.find((d) => d.id === newDeal.id);
        return oldDeal && oldDeal.stage !== newDeal.stage;
      });

      if (changedDeal) {
        await handleStageChange(changedDeal.id, changedDeal.stage);
      }
    },
    [deals, handleStageChange]
  );

  // Stats
  const stats = useMemo(() => {
    const totalArr = deals.reduce((sum, d) => {
      if (!d.arrEstimate) return sum;
      const num = parseFloat(d.arrEstimate.replace(/[^0-9.-]+/g, ''));
      return sum + (isNaN(num) ? 0 : num);
    }, 0);
    return {
      count: deals.length,
      totalArr,
    };
  }, [deals]);

  if (loading) {
    return (
      <div className="flex flex-col h-full p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid grid-cols-6 gap-4 flex-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="h-8 w-full" />
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold">Pipeline</h1>
          <span className="text-sm text-muted-foreground">
            {stats.count} {stats.count === 1 ? 'deal' : 'deals'}
          </span>
        </div>

        {/* View Toggle */}
        <Tabs value={view} onValueChange={(v) => setView(v as ViewMode)}>
          <TabsList>
            <TabsTrigger value="kanban" className="gap-1.5">
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">Board</span>
            </TabsTrigger>
            <TabsTrigger value="table" className="gap-1.5">
              <Table2 className="h-4 w-4" />
              <span className="hidden sm:inline">Table</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      {view === 'kanban' ? (
        <DealsKanban deals={deals} onDataChange={handleKanbanDataChange} />
      ) : (
        <div className="flex-1 overflow-auto">
          <DealsTable deals={deals} onStageChange={handleStageChange} />
        </div>
      )}
    </div>
  );
}
