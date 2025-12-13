'use client';

import { Badge } from '@/components/ui/badge';
import { ActivityIcon } from './activity-icon';
import type { Activity } from './types';

interface ActivityCardProps {
  activity: Activity;
  showDealBadge?: boolean;
}

export function ActivityCard({ activity, showDealBadge = true }: ActivityCardProps) {
  return (
    <div className="group relative">
      {/* Timeline connector - hidden on mobile */}
      <div className="hidden md:block absolute left-4 top-12 bottom-0 w-px bg-border group-last:hidden" />

      <div className="flex gap-3 md:gap-4 pb-4 md:pb-6">
        <ActivityIcon type={activity.type} size="small" />

        <div className="flex-1 min-w-0">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-1 md:gap-2 mb-1">
            <h4 className="text-sm font-medium text-foreground leading-tight">
              {activity.title}
            </h4>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {activity.date}, {activity.time}
            </span>
          </div>

          {showDealBadge && activity.deal && (
            <Badge variant="outline" className="text-[10px] h-5 mb-2">
              {activity.deal}
            </Badge>
          )}

          {activity.metadata && (
            <div className="flex flex-wrap gap-x-2 gap-y-1 mb-2">
              {Object.entries(activity.metadata).map(([key, value]) => (
                <span key={key} className="text-xs text-muted-foreground">
                  {value}
                </span>
              ))}
            </div>
          )}

          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 md:line-clamp-none">
            {activity.content}
          </p>
        </div>
      </div>
    </div>
  );
}
