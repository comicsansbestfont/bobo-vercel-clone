'use client';

import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DEAL_STAGES,
  type DealStage,
  getStageConfig,
  getStageLabel,
} from '@/lib/sidebar/stage-config';
import { cn } from '@/lib/utils';

interface StageBadgeProps {
  stage: DealStage;
  onStageChange?: (newStage: DealStage) => void;
  editable?: boolean;
  size?: 'sm' | 'default';
  className?: string;
}

export function StageBadge({
  stage,
  onStageChange,
  editable = false,
  size = 'default',
  className,
}: StageBadgeProps) {
  const config = getStageConfig(stage);
  const label = getStageLabel(stage);

  if (!editable) {
    return (
      <Badge
        variant="outline"
        className={cn(
          'font-medium whitespace-nowrap',
          config.color.replace('bg-', 'border-'),
          config.textColor,
          size === 'sm' && 'text-[10px] px-1.5 py-0',
          className
        )}
      >
        <span className={cn('h-2 w-2 rounded-full mr-1.5 shrink-0', config.color)} />
        {label}
      </Badge>
    );
  }

  return (
    <Select value={stage} onValueChange={(v) => onStageChange?.(v as DealStage)}>
      <SelectTrigger className={cn('w-auto h-7 text-xs border-0 bg-transparent hover:bg-muted/50', className)}>
        <SelectValue>
          <span className="flex items-center gap-1.5">
            <span className={cn('h-2 w-2 rounded-full shrink-0', config.color)} />
            <span className={config.textColor}>{label}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="start">
        {Object.entries(DEAL_STAGES).map(([key, value]) => (
          <SelectItem key={key} value={key}>
            <span className="flex items-center gap-1.5">
              <span className={cn('h-2 w-2 rounded-full shrink-0', value.color)} />
              {value.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
