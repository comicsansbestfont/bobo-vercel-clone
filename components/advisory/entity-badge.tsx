'use client';

/**
 * Entity Type Badge Component
 *
 * Displays a badge indicating the project type (deal/client/personal).
 *
 * M38: Advisory Project Integration
 */

import { Building2, Users, FolderOpen, UserCircle } from 'lucide-react';
import type { EntityType } from '@/lib/db/types';

interface EntityBadgeProps {
  entityType: EntityType;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

const config: Record<EntityType, {
  label: string;
  bgColor: string;
  textColor: string;
  icon: typeof Building2;
}> = {
  deal: {
    label: 'Deal',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    textColor: 'text-blue-700 dark:text-blue-300',
    icon: Building2,
  },
  client: {
    label: 'Client',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    textColor: 'text-green-700 dark:text-green-300',
    icon: Users,
  },
  personal: {
    label: 'Personal',
    bgColor: 'bg-neutral-100 dark:bg-neutral-800',
    textColor: 'text-neutral-600 dark:text-neutral-400',
    icon: FolderOpen,
  },
  identity: {
    label: 'Identity',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    textColor: 'text-purple-700 dark:text-purple-300',
    icon: UserCircle,
  },
};

export function EntityBadge({ entityType, size = 'sm', showIcon = true }: EntityBadgeProps) {
  const { label, bgColor, textColor, icon: Icon } = config[entityType];

  // Don't show badge for personal projects (default)
  if (entityType === 'personal') {
    return null;
  }

  const sizeClasses = size === 'sm'
    ? 'text-xs px-1.5 py-0.5'
    : 'text-sm px-2 py-1';

  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${bgColor} ${textColor} ${sizeClasses}`}
    >
      {showIcon && <Icon className={iconSize} />}
      {label}
    </span>
  );
}

/**
 * Inline entity indicator (smaller, no background)
 */
export function EntityIndicator({ entityType }: { entityType: EntityType }) {
  if (entityType === 'personal') return null;

  const { icon: Icon, textColor } = config[entityType];

  return (
    <Icon className={`h-3.5 w-3.5 ${textColor}`} aria-label={entityType} />
  );
}
