'use client';

import { cn } from '@/lib/utils';
import type { Stage } from './types';

interface StageIndicatorProps {
  stages: Stage[];
}

export function StageIndicator({ stages }: StageIndicatorProps) {
  const currentIndex = stages.findIndex(s => s.isCurrent);

  return (
    <div className="space-y-1">
      {stages.map((stage, index) => {
        const isPast = currentIndex === -1 ? true : index < currentIndex;
        const isCurrent = stage.isCurrent;
        const isFuture = currentIndex !== -1 && index > currentIndex;

        return (
          <div key={stage.id} className="flex items-center gap-3 py-1.5 md:py-1">
            <div
              className={cn(
                'w-2 h-2 rounded-full shrink-0',
                isPast && 'bg-green-500',
                isCurrent && 'bg-blue-500 ring-4 ring-blue-100',
                isFuture && 'bg-muted-foreground/20'
              )}
            />
            <span
              className={cn(
                'text-sm',
                isCurrent && 'font-medium text-foreground',
                !isCurrent && 'text-muted-foreground'
              )}
            >
              {stage.name}
            </span>
            {stage.date && (
              <span className="text-xs text-muted-foreground ml-auto">{stage.date}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
