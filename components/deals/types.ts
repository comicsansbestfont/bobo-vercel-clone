/**
 * Deal Types
 * Shared TypeScript interfaces for deal-related components
 */

import type { DealStage } from '@/lib/sidebar/stage-config';

export type EngagementType = 'lead' | 'deal' | 'client';

export type ViewMode = 'kanban' | 'table';

export interface DealData {
  id: string;
  name: string;
  stage: DealStage;
  company?: string;
  website?: string;
  founder?: string;
  arrEstimate?: string;
  teamSize?: string;
  firstContact?: string;
  lastUpdated?: string;
  engagementType?: EngagementType;
  folderPath?: string;
  // Additional fields from master doc
  currentGtmStage?: string;
  activeCustomers?: number;
  fitAssessment?: string;
  coachability?: string;
  leadSource?: string;
  lostReason?: string | null;
}

export interface DealDetail extends DealData {
  content?: string;
  sections?: Record<string, string>;
  assessment?: {
    redFlags?: string[];
    strengths?: string[];
    weaknesses?: string[];
  };
  timeline?: Array<{
    date: string;
    event: string;
    type: string;
  }>;
}

export interface KanbanDeal extends DealData {
  column: DealStage;
}
