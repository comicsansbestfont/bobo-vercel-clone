import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { EngagementType } from './types';

const ENGAGEMENT_CONFIG: Record<EngagementType, { color: string; label: string }> = {
  lead: { color: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Lead' },
  deal: { color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Deal' },
  client: { color: 'bg-green-100 text-green-700 border-green-200', label: 'Client' },
};

interface EngagementBadgeProps {
  type?: EngagementType | string;
  className?: string;
  size?: 'sm' | 'default';
}

export function EngagementBadge({ type, className, size = 'default' }: EngagementBadgeProps) {
  if (!type) return null;

  const config = ENGAGEMENT_CONFIG[type as EngagementType] || ENGAGEMENT_CONFIG.deal;

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium',
        config.color,
        size === 'sm' && 'text-[10px] px-1.5 py-0',
        className
      )}
    >
      {config.label}
    </Badge>
  );
}
