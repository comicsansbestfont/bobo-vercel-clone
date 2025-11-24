'use client';

import { Progress } from '@/components/ui/progress';
import { formatDistanceToNow } from 'date-fns';

interface MemorySummaryProps {
  totalCount: number;
  tokenUsage: number;
  tokenBudget: number;
  lastUpdated: Date | null;
}

export function MemorySummary({ totalCount, tokenUsage, tokenBudget, lastUpdated }: MemorySummaryProps) {
  const usagePercentage = Math.min((tokenUsage / tokenBudget) * 100, 100);
  
  let progressColor = "bg-green-500";
  if (usagePercentage > 90) progressColor = "bg-destructive";
  else if (usagePercentage > 70) progressColor = "bg-yellow-500";

  return (
    <div className="bg-card border rounded-lg p-4 md:p-6 mb-4 md:mb-8 shadow-sm">
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <h2 className="text-base md:text-lg font-semibold flex items-center gap-2">
          <span>📊</span> Summary
        </h2>
      </div>

      <div className="grid gap-4 md:gap-6 md:grid-cols-2">
        <div>
          <div className="text-xs md:text-sm text-muted-foreground mb-1">Total Memories</div>
          <div className="text-xl md:text-2xl font-bold">
            {totalCount} <span className="text-xs md:text-sm font-normal text-muted-foreground">across 6 categories</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Token Usage</span>
            <span className="font-medium">
              {tokenUsage} / {tokenBudget} ({Math.round(usagePercentage)}%)
            </span>
          </div>
          <Progress value={usagePercentage} className={`h-2 ${progressColor}`} />
        </div>
      </div>

      <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t text-[10px] md:text-xs text-muted-foreground flex flex-col sm:flex-row justify-between gap-1 sm:gap-0">
        <span>
          Last updated: {lastUpdated ? formatDistanceToNow(lastUpdated, { addSuffix: true }) : 'Never'}
        </span>
        <span className="hidden sm:inline">
          Next consolidation: Every Sunday 3am
        </span>
      </div>
    </div>
  );
}
