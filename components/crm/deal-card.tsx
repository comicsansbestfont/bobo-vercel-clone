'use client';

import { Briefcase } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Deal } from './types';

interface DealCardProps {
  deal: Deal;
}

export function DealCard({ deal }: DealCardProps) {
  return (
    <div className="flex items-center gap-3 p-3 md:p-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
      <div className="w-9 h-9 md:w-8 md:h-8 rounded-md bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0">
        <Briefcase className="w-4 h-4 md:w-3.5 md:h-3.5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{deal.name}</div>
        {deal.role && <div className="text-xs text-muted-foreground truncate">{deal.role}</div>}
      </div>
      <div className="text-right shrink-0">
        <Badge variant="secondary" className="text-[10px] h-5 mb-0.5">
          {deal.stage}
        </Badge>
        <div className="text-xs font-medium">{deal.amount}</div>
      </div>
    </div>
  );
}
