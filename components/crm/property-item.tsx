'use client';

import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Property } from './types';

interface PropertyItemProps extends Property {}

export function PropertyItem({ label, value, icon: Icon, link }: PropertyItemProps) {
  return (
    <div className="flex items-center justify-between py-2.5 md:py-2 group cursor-pointer hover:bg-muted/50 -mx-2 px-2 rounded-md transition-colors">
      <div className="flex items-center gap-2 text-muted-foreground">
        {Icon && <Icon className="w-4 h-4" />}
        <span className="text-sm">{label}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className={cn('text-sm font-medium', link ? 'text-blue-600' : 'text-foreground')}>
          {value}
        </span>
        {link && <ExternalLink className="w-3 h-3 text-blue-600" />}
      </div>
    </div>
  );
}
