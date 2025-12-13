'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  KanbanProvider,
  KanbanBoard,
  KanbanHeader,
  KanbanCards,
  KanbanCard,
} from '@/components/kibo-ui/kanban';
import { DEAL_STAGES, type DealStage } from '@/lib/sidebar/stage-config';
import { DealCard } from './deal-card';
import type { DealData } from './types';
import { cn } from '@/lib/utils';

// Kanban column type matching our deal stages
interface KanbanColumn {
  id: string;
  name: string;
  color: string;
  [key: string]: unknown;
}

// Kanban item type for deals - needs index signature for dnd-kit compatibility
interface KanbanDeal extends DealData {
  column: DealStage;
  [key: string]: unknown;
}

// Map deal stages to kanban columns
const KANBAN_COLUMNS: KanbanColumn[] = Object.entries(DEAL_STAGES).map(([stage, config]) => ({
  id: stage,
  name: config.label,
  color: config.color,
}));

interface DealsKanbanProps {
  deals: DealData[];
  onDataChange: (deals: DealData[]) => void;
}

export function DealsKanban({ deals, onDataChange }: DealsKanbanProps) {
  const router = useRouter();

  // Transform deals to kanban format
  const kanbanDeals: KanbanDeal[] = useMemo(
    () =>
      deals.map((deal) => ({
        ...deal,
        column: deal.stage,
      })),
    [deals]
  );

  // Handle data changes from drag-and-drop
  const handleDataChange = (newData: KanbanDeal[]) => {
    // Convert back to DealData format with updated stages
    const updatedDeals: DealData[] = newData.map((deal) => ({
      ...deal,
      stage: deal.column,
    }));
    onDataChange(updatedDeals);
  };

  // Handle deal click to navigate to deal profile
  const handleDealClick = (dealId: string) => {
    router.push(`/deals/${dealId}`);
  };

  return (
    <div className="flex-1 overflow-x-auto overflow-y-hidden">
      <KanbanProvider
        columns={KANBAN_COLUMNS}
        data={kanbanDeals}
        onDataChange={handleDataChange}
        className="!grid-cols-[repeat(9,280px)] min-w-max h-full"
      >
        {(column) => (
          <KanbanBoard key={column.id} id={column.id} className="min-w-[127px]">
            <KanbanHeader className="flex items-center gap-2">
              <div className={cn('h-2.5 w-2.5 rounded-full', column.color)} />
              <span className="font-medium">{column.name}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {kanbanDeals.filter((d) => d.column === column.id).length}
              </span>
            </KanbanHeader>
            <KanbanCards id={column.id}>
              {(deal: KanbanDeal) => (
                <KanbanCard key={deal.id} {...deal}>
                  <DealCard deal={deal} onNavigate={() => handleDealClick(deal.id)} />
                </KanbanCard>
              )}
            </KanbanCards>
          </KanbanBoard>
        )}
      </KanbanProvider>
    </div>
  );
}
