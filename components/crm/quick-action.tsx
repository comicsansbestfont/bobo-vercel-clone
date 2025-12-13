'use client';

import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickActionButtonProps {
  icon: LucideIcon;
  label: string;
  color?: string;
  onClick?: () => void;
}

export function QuickActionButton({
  icon: Icon,
  label,
  color = 'text-muted-foreground',
  onClick,
}: QuickActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 p-2 md:flex-row md:gap-2 md:px-3 md:py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg md:rounded-md transition-colors min-w-[56px] md:min-w-0"
    >
      <Icon className={cn('w-5 h-5 md:w-4 md:h-4', color)} />
      <span className="text-[10px] md:text-sm">{label}</span>
    </button>
  );
}
