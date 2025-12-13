'use client';

import {
  Phone,
  Mail,
  Calendar,
  FileText,
  CheckSquare,
  Linkedin,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ActivityType } from './types';

interface ActivityIconProps {
  type: ActivityType;
  size?: 'default' | 'small';
  className?: string;
}

const iconMap: Record<ActivityType, { icon: LucideIcon; color: string; bg: string }> = {
  call: { icon: Phone, color: 'text-blue-600', bg: 'bg-blue-50' },
  email: { icon: Mail, color: 'text-purple-600', bg: 'bg-purple-50' },
  meeting: { icon: Calendar, color: 'text-orange-600', bg: 'bg-orange-50' },
  note: { icon: FileText, color: 'text-gray-600', bg: 'bg-gray-100' },
  task: { icon: CheckSquare, color: 'text-green-600', bg: 'bg-green-50' },
  linkedin: { icon: Linkedin, color: 'text-blue-700', bg: 'bg-blue-50' },
};

export function ActivityIcon({ type, size = 'default', className }: ActivityIconProps) {
  const { icon: Icon, color, bg } = iconMap[type] || iconMap.note;
  const sizeClasses = size === 'small' ? 'w-6 h-6' : 'w-8 h-8';
  const iconSize = size === 'small' ? 'w-3 h-3' : 'w-4 h-4';

  return (
    <div className={cn('rounded-lg flex items-center justify-center shrink-0', bg, sizeClasses, className)}>
      <Icon className={cn(iconSize, color)} />
    </div>
  );
}
