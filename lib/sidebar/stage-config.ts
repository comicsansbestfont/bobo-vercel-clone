/**
 * Deal Stage Configuration
 *
 * Defines deal stages with colors and labels for consistent display
 * Based on advisory/deals SOP:
 * new_opportunity → triage_qualification → deep_dive_diagnosis →
 * relationship_development → proposal_presented → contract_sent →
 * finalising_terms → closed_won / closed_lost
 *
 * M312B-02: Stage Configuration (Updated to snake_case)
 */

export const DEAL_STAGES = {
  new_opportunity: { color: 'bg-gray-400', textColor: 'text-gray-400', label: 'New Opportunity' },
  triage_qualification: { color: 'bg-yellow-400', textColor: 'text-yellow-400', label: 'Triage' },
  deep_dive_diagnosis: { color: 'bg-orange-400', textColor: 'text-orange-400', label: 'Deep Dive' },
  relationship_development: { color: 'bg-cyan-400', textColor: 'text-cyan-400', label: 'Relationship Dev' },
  proposal_presented: { color: 'bg-blue-400', textColor: 'text-blue-400', label: 'Proposal' },
  contract_sent: { color: 'bg-indigo-400', textColor: 'text-indigo-400', label: 'Contract Sent' },
  finalising_terms: { color: 'bg-purple-400', textColor: 'text-purple-400', label: 'Finalising' },
  closed_won: { color: 'bg-green-500', textColor: 'text-green-500', label: 'Won' },
  closed_lost: { color: 'bg-red-500', textColor: 'text-red-500', label: 'Lost' },
} as const;

export type DealStage = keyof typeof DEAL_STAGES;

export type StageConfig = {
  color: string;
  textColor: string;
  label: string;
};

/**
 * Legacy stage name mapping for backward compatibility
 * Maps Title Case stage names to snake_case keys
 */
const LEGACY_STAGE_MAPPING: Record<string, DealStage> = {
  'New Opportunity': 'new_opportunity',
  'Triage & Qualification': 'triage_qualification',
  'Deep Dive & Diagnosis': 'deep_dive_diagnosis',
  'Relationship Development': 'relationship_development',
  'Proposal Presented': 'proposal_presented',
  'Contract Sent': 'contract_sent',
  'Finalising Terms': 'finalising_terms',
  'Closed Won': 'closed_won',
  'Closed Lost': 'closed_lost',
  // Also handle some variations
  'Triage': 'triage_qualification',
  'Deep Dive': 'deep_dive_diagnosis',
  'Relationship': 'relationship_development',
  'Finalising': 'finalising_terms',
  'Won': 'closed_won',
  'Lost': 'closed_lost',
};

/**
 * Normalizes a stage key to snake_case format
 * Handles both legacy Title Case and new snake_case formats
 */
export function normalizeStageKey(stage: string | undefined | null): DealStage {
  if (!stage) return 'new_opportunity';

  // If already a valid snake_case key, return it
  if (stage in DEAL_STAGES) {
    return stage as DealStage;
  }

  // Try legacy mapping
  if (stage in LEGACY_STAGE_MAPPING) {
    return LEGACY_STAGE_MAPPING[stage];
  }

  // Try case-insensitive match on snake_case keys
  const lowerStage = stage.toLowerCase().replace(/[\s&]+/g, '_');
  for (const key of Object.keys(DEAL_STAGES)) {
    if (key === lowerStage) {
      return key as DealStage;
    }
  }

  // Default fallback
  return 'new_opportunity';
}

/**
 * Gets the configuration for a stage
 * Automatically normalizes legacy stage names
 */
export function getStageConfig(stage: string | undefined | null): StageConfig {
  const normalizedStage = normalizeStageKey(stage);
  return DEAL_STAGES[normalizedStage];
}

/**
 * Returns all available stages in pipeline order
 */
export function getAllStages(): DealStage[] {
  return Object.keys(DEAL_STAGES) as DealStage[];
}

/**
 * Returns the display label for a stage
 */
export function getStageLabel(stage: string | undefined | null): string {
  const config = getStageConfig(stage);
  return config.label;
}

/**
 * Checks if a stage is a terminal stage (won or lost)
 */
export function isTerminalStage(stage: string | undefined | null): boolean {
  const normalized = normalizeStageKey(stage);
  return normalized === 'closed_won' || normalized === 'closed_lost';
}

/**
 * Returns stages grouped by engagement phase
 */
export const STAGE_GROUPS = {
  lead: ['new_opportunity', 'triage_qualification', 'deep_dive_diagnosis'] as DealStage[],
  deal: ['relationship_development', 'proposal_presented', 'contract_sent', 'finalising_terms'] as DealStage[],
  terminal: ['closed_won', 'closed_lost'] as DealStage[],
};
