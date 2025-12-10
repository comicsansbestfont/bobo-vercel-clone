'use client';

import { Users, DollarSign, Calendar, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DealCardData {
  id: string;
  name: string;
  stage: string;
  company?: string;
  website?: string;
  founder?: string;
  arrEstimate?: string;
  teamSize?: string;
  firstContact?: string;
  lastUpdated?: string;
  engagementType?: string;
}

interface DealCardProps {
  deal: DealCardData;
  className?: string;
  onNavigate?: () => void;
}

export function DealCard({ deal, className, onNavigate }: DealCardProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 -m-3 p-3',
        className
      )}
    >
      {/* Company Name */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-sm leading-tight">{deal.name}</h3>
        {onNavigate && (
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onNavigate();
            }}
            className="p-1 -m-1 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors flex-shrink-0"
            title="Open deal details"
          >
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Engagement Type Badge */}
      {deal.engagementType && (
        <span className="text-xs text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded w-fit">
          {deal.engagementType}
        </span>
      )}

      {/* Metrics Row */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {deal.arrEstimate && (
          <span className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            {deal.arrEstimate}
          </span>
        )}
        {deal.teamSize && (
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {deal.teamSize}
          </span>
        )}
      </div>

      {/* Founder */}
      {deal.founder && (
        <p className="text-xs text-muted-foreground truncate">
          {deal.founder}
        </p>
      )}

      {/* Last Updated */}
      {deal.lastUpdated && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground/70 mt-1">
          <Calendar className="h-3 w-3" />
          <span>Updated {deal.lastUpdated}</span>
        </div>
      )}
    </div>
  );
}
