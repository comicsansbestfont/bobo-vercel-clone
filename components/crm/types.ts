import type { LucideIcon } from 'lucide-react';

export type ActivityType = 'call' | 'email' | 'meeting' | 'note' | 'linkedin' | 'task';

export interface Activity {
  id: string | number;
  type: ActivityType;
  title: string;
  date: string;
  time: string;
  sortDate: string; // Raw ISO timestamp for accurate sorting
  content: string;
  deal?: string;
  metadata?: Record<string, string>;
}

export interface Property {
  label: string;
  value: string | React.ReactNode;
  icon?: LucideIcon;
  link?: boolean;
}

export interface Stage {
  id: string;
  name: string;
  date?: string;
  isCurrent?: boolean;
}

export interface Contact {
  id: string;
  name: string;
  role: string;
  email?: string | null;
  initials?: string;
  linkedin_url?: string | null;
  is_primary?: boolean;
}

export interface Deal {
  id: string;
  name: string;
  stage: string;
  amount: string;
  role?: string;
}
