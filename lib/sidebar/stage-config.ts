/**
 * Deal Stage Configuration
 *
 * Defines deal stages with colors and labels for consistent display
 * Based on advisory/deals SOP:
 * New Opportunity → Triage & Qualification → Deep Dive & Diagnosis →
 * Relationship Development → Proposal Presented → Contract Sent →
 * Finalising Terms → Closed Won / Closed Lost
 *
 * M312B-02: Stage Configuration
 */

export const DEAL_STAGES = {
  'New Opportunity': { color: 'bg-gray-400', textColor: 'text-gray-400', label: 'New' },
  'Triage & Qualification': { color: 'bg-yellow-400', textColor: 'text-yellow-400', label: 'Triage' },
  'Deep Dive & Diagnosis': { color: 'bg-orange-400', textColor: 'text-orange-400', label: 'Deep Dive' },
  'Relationship Development': { color: 'bg-cyan-400', textColor: 'text-cyan-400', label: 'Relationship' },
  'Proposal Presented': { color: 'bg-blue-400', textColor: 'text-blue-400', label: 'Proposal' },
  'Contract Sent': { color: 'bg-indigo-400', textColor: 'text-indigo-400', label: 'Contract' },
  'Finalising Terms': { color: 'bg-purple-400', textColor: 'text-purple-400', label: 'Finalising' },
  'Closed Won': { color: 'bg-green-500', textColor: 'text-green-500', label: 'Won' },
  'Closed Lost': { color: 'bg-red-500', textColor: 'text-red-500', label: 'Lost' },
} as const;

export type DealStage = keyof typeof DEAL_STAGES;

export type StageConfig = {
  color: string;
  textColor: string;
  label: string;
};

export function getStageConfig(stage: string): StageConfig {
  return DEAL_STAGES[stage as DealStage] || DEAL_STAGES['New Opportunity'];
}

export function getAllStages(): DealStage[] {
  return Object.keys(DEAL_STAGES) as DealStage[];
}
