/**
 * Stage Indicator Component
 *
 * Renders a colored dot indicating deal stage
 *
 * M312B-06: Stage Indicator
 */

'use client';

import { getStageConfig } from '@/lib/sidebar/stage-config';
import { cn } from '@/lib/utils';

interface StageIndicatorProps {
  stage: string;
  showLabel?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function StageIndicator({
  stage,
  showLabel = false,
  size = 'sm',
  className,
}: StageIndicatorProps) {
  const config = getStageConfig(stage);

  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-2.5 w-2.5',
  };

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <div
        className={cn(
          'rounded-full flex-shrink-0',
          sizeClasses[size],
          config.color
        )}
        title={stage}
      />
      {showLabel && (
        <span className="text-xs text-muted-foreground truncate">
          {config.label}
        </span>
      )}
    </div>
  );
}
