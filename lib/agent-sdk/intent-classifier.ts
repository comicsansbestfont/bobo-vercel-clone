/**
 * M3.8: Intent Classification for Automatic Tool Selection
 *
 * Classifies user queries to route to the appropriate search sources:
 * - memory: Personal facts, preferences, instructions
 * - advisory: Deal/client files, meetings, documents
 * - hybrid: Both sources for complex queries
 *
 * Uses deterministic pattern matching for speed and reliability.
 */

// ============================================================================
// Types
// ============================================================================

export type IntentCategory = 'advisory' | 'memory' | 'hybrid';

export type EntityType = 'company' | 'person' | 'document_type';

export type ExtractedEntity = {
  type: EntityType;
  value: string;
  confidence: number;
};

export type QueryIntent = {
  category: IntentCategory;
  confidence: number;
  entities: ExtractedEntity[];
  suggestedSources: ('memory' | 'advisory')[];
  matchedPatterns: string[]; // For debugging
};

// ============================================================================
// Pattern Definitions
// ============================================================================

type PatternRule = {
  pattern: RegExp;
  category: IntentCategory;
  weight: number;
  name: string;
};

// Advisory patterns (File/Document queries)
const ADVISORY_PATTERNS: PatternRule[] = [
  // Briefing requests
  {
    pattern: /\b(brief|briefing|brief me|catch me up)\s*(on|about)?\b/i,
    category: 'advisory',
    weight: 0.9,
    name: 'briefing_request',
  },
  // Document-specific requests
  {
    pattern: /\b(master\s*doc|pitch\s*deck|valuation|client\s*profile)\b/i,
    category: 'advisory',
    weight: 0.95,
    name: 'document_type',
  },
  // Meeting-related
  {
    pattern: /\b(meeting|notes|transcript|call|session)\s*(notes|with|about|for)?\b/i,
    category: 'advisory',
    weight: 0.85,
    name: 'meeting_keyword',
  },
  // Email/communication requests
  {
    pattern: /\b(email|emails|message|communication|sent|received)\s*(to|from|with|about)?\b/i,
    category: 'advisory',
    weight: 0.85,
    name: 'email_keyword',
  },
  // Show/get file requests
  {
    pattern: /\b(show|get|find|pull|retrieve)\s*(me|the)?\s*(file|doc|document|notes)\b/i,
    category: 'advisory',
    weight: 0.9,
    name: 'file_request',
  },
  // Deal-specific language
  {
    pattern: /\b(deal|client|engagement)\s*(status|update|overview|summary|red flags?)\b/i,
    category: 'advisory',
    weight: 0.85,
    name: 'deal_status',
  },
  // What's in the doc patterns
  {
    pattern: /\bwhat('s| is)\s*(in|the)\s*(the\s*)?(doc|file|master|valuation)\b/i,
    category: 'advisory',
    weight: 0.9,
    name: 'whats_in_doc',
  },
  // Red flags query
  {
    pattern: /\b(red flags?|concerns?|issues?|problems?)\s*(for|with|about)?\b/i,
    category: 'advisory',
    weight: 0.8,
    name: 'red_flags',
  },
  // Follow-up / last interaction
  {
    pattern: /\b(last|recent|follow.?up|latest)\s*(interaction|email|meeting|call|touchpoint)\b/i,
    category: 'advisory',
    weight: 0.85,
    name: 'last_interaction',
  },
];

// Memory patterns (Personal context queries)
const MEMORY_PATTERNS: PatternRule[] = [
  // Explicit preference queries
  {
    pattern: /\b(my|i)\s*(prefer|like|want|use|always)\b/i,
    category: 'memory',
    weight: 0.9,
    name: 'preference_statement',
  },
  // What do I/you know about me
  {
    pattern: /\b(what|do you)\s*(know|remember)\s*(about me|about my)\b/i,
    category: 'memory',
    weight: 0.95,
    name: 'what_you_know',
  },
  // Framework/tool preferences
  {
    pattern: /\b(what|which)\s*(framework|tool|stack|approach)\s*(do i|i)\s*(use|prefer)\b/i,
    category: 'memory',
    weight: 0.9,
    name: 'tech_preference',
  },
  // Remember/recall instructions
  {
    pattern: /\b(remember|recall|don't forget)\s*(that|when|how)\b/i,
    category: 'memory',
    weight: 0.85,
    name: 'remember_instruction',
  },
  // Personal context keywords
  {
    pattern: /\b(my\s+)(style|approach|workflow|process|background)\b/i,
    category: 'memory',
    weight: 0.8,
    name: 'personal_context',
  },
];

// Hybrid patterns (Need both sources)
const HYBRID_PATTERNS: PatternRule[] = [
  // Prep for meeting
  {
    pattern: /\b(prep|prepare|get ready)\s*(me)?\s*(for|ahead of)\b/i,
    category: 'hybrid',
    weight: 0.95,
    name: 'prep_request',
  },
  // Status with context
  {
    pattern: /\bwhat('s| is)\s*(the\s+)?(status|state|situation)\s*(of|with)?\b/i,
    category: 'hybrid',
    weight: 0.8,
    name: 'status_query',
  },
  // "my deals" / "my clients"
  {
    pattern: /\bmy\s+(deal|client|engagement|project)s?\b/i,
    category: 'hybrid',
    weight: 0.9,
    name: 'my_entities',
  },
  // Summary requests
  {
    pattern: /\b(summarize|summary|overview)\s*(of|for)?\s*(my|all|everything)\b/i,
    category: 'hybrid',
    weight: 0.85,
    name: 'summary_request',
  },
];

// ============================================================================
// Known Entities (from advisory files)
// ============================================================================

const KNOWN_COMPANIES = [
  'mytab',
  'swiftcheckin',
  'swift checkin',
  'archelolab',
  'archelo lab',
  'controlshiftai',
  'control shift ai',
  'talvin',
  'tandm',
] as const;

const KNOWN_PEOPLE = [
  'mikaela',
  'boney',
  'ain',
  'krishna',
  'newan',
  'peter',
] as const;

const COMPANY_PATTERN = new RegExp(`\\b(${KNOWN_COMPANIES.join('|')})\\b`, 'gi');
const PERSON_PATTERN = new RegExp(`\\b(${KNOWN_PEOPLE.join('|')})\\b`, 'gi');

// Company name normalization map
const COMPANY_NORMALIZATIONS: Record<string, string> = {
  'mytab': 'MyTab',
  'swiftcheckin': 'SwiftCheckin',
  'swift checkin': 'SwiftCheckin',
  'archelolab': 'ArcheloLab',
  'archelo lab': 'ArcheloLab',
  'controlshiftai': 'ControlShiftAI',
  'control shift ai': 'ControlShiftAI',
  'talvin': 'Talvin',
  'tandm': 'Tandm',
};

// ============================================================================
// Entity Extraction
// ============================================================================

function extractEntities(query: string): ExtractedEntity[] {
  const entities: ExtractedEntity[] = [];
  const normalizedQuery = query.toLowerCase();

  // 1. Extract known company names
  const companyMatches = normalizedQuery.matchAll(COMPANY_PATTERN);
  for (const match of companyMatches) {
    const normalized = COMPANY_NORMALIZATIONS[match[0].toLowerCase()] || match[0];
    if (!entities.find(e => e.value === normalized)) {
      entities.push({
        type: 'company',
        value: normalized,
        confidence: 1.0,
      });
    }
  }

  // 2. Extract known person names
  const personMatches = normalizedQuery.matchAll(PERSON_PATTERN);
  for (const match of personMatches) {
    const name = match[0].charAt(0).toUpperCase() + match[0].slice(1).toLowerCase();
    if (!entities.find(e => e.value === name)) {
      entities.push({
        type: 'person',
        value: name,
        confidence: 0.9,
      });
    }
  }

  // 3. Extract document type mentions
  const docTypes = [
    { pattern: /\bmaster\s*doc\b/i, value: 'master-doc' },
    { pattern: /\bpitch\s*deck\b/i, value: 'pitch-deck' },
    { pattern: /\bvaluation\b/i, value: 'valuation' },
    { pattern: /\bclient\s*profile\b/i, value: 'client-profile' },
    { pattern: /\bmeeting\s*notes?\b/i, value: 'meeting-notes' },
  ];

  for (const docType of docTypes) {
    if (docType.pattern.test(query)) {
      entities.push({
        type: 'document_type',
        value: docType.value,
        confidence: 0.95,
      });
    }
  }

  return entities;
}

// ============================================================================
// Main Classification Function
// ============================================================================

/**
 * Classify user query intent for automatic tool/source selection
 *
 * @param query - The user's natural language query
 * @returns QueryIntent with category, confidence, entities, and suggested sources
 */
export function classifyQueryIntent(query: string): QueryIntent {
  const normalizedQuery = query.toLowerCase().trim();

  // Extract entities first (they influence classification)
  const entities = extractEntities(query);

  // Track matched patterns and scores
  const matchedPatterns: string[] = [];
  const categoryScores: Record<IntentCategory, number> = {
    advisory: 0,
    memory: 0,
    hybrid: 0,
  };

  // Check advisory patterns
  for (const rule of ADVISORY_PATTERNS) {
    if (rule.pattern.test(normalizedQuery)) {
      categoryScores.advisory += rule.weight;
      matchedPatterns.push(`advisory:${rule.name}`);
    }
  }

  // Check memory patterns
  for (const rule of MEMORY_PATTERNS) {
    if (rule.pattern.test(normalizedQuery)) {
      categoryScores.memory += rule.weight;
      matchedPatterns.push(`memory:${rule.name}`);
    }
  }

  // Check hybrid patterns
  for (const rule of HYBRID_PATTERNS) {
    if (rule.pattern.test(normalizedQuery)) {
      categoryScores.hybrid += rule.weight;
      matchedPatterns.push(`hybrid:${rule.name}`);
    }
  }

  // Boost scores based on entities
  const hasCompanyEntity = entities.some(e => e.type === 'company');
  const hasPersonEntity = entities.some(e => e.type === 'person');
  const hasDocTypeEntity = entities.some(e => e.type === 'document_type');

  if (hasCompanyEntity) {
    categoryScores.advisory += 0.5;
    matchedPatterns.push('entity:company');
  }
  if (hasPersonEntity) {
    categoryScores.advisory += 0.3;
    matchedPatterns.push('entity:person');
  }
  if (hasDocTypeEntity) {
    categoryScores.advisory += 0.6;
    matchedPatterns.push('entity:document_type');
  }

  // Determine category based on scores
  let category: IntentCategory;
  let confidence: number;

  const maxScore = Math.max(
    categoryScores.advisory,
    categoryScores.memory,
    categoryScores.hybrid
  );

  // If no patterns matched, default to hybrid with low confidence
  if (maxScore === 0) {
    category = 'hybrid';
    confidence = 0.3;
    matchedPatterns.push('fallback:no_patterns');
  } else {
    // Find the winning category
    if (categoryScores.hybrid >= maxScore * 0.8 && categoryScores.hybrid > 0) {
      category = 'hybrid';
    } else if (categoryScores.advisory > categoryScores.memory) {
      category = 'advisory';
    } else if (categoryScores.memory > categoryScores.advisory) {
      category = 'memory';
    } else {
      category = 'hybrid';
    }

    // Calculate confidence (normalized, capped at 1.0)
    confidence = Math.min(maxScore / 2.0, 1.0);
  }

  // Determine suggested sources
  const suggestedSources: ('memory' | 'advisory')[] = [];
  switch (category) {
    case 'advisory':
      suggestedSources.push('advisory');
      // Also include memory if confidence is not very high
      if (confidence < 0.8) {
        suggestedSources.push('memory');
      }
      break;
    case 'memory':
      suggestedSources.push('memory');
      break;
    case 'hybrid':
      suggestedSources.push('advisory', 'memory');
      break;
  }

  return {
    category,
    confidence,
    entities,
    suggestedSources,
    matchedPatterns,
  };
}

/**
 * Check if query likely needs advisory file search
 */
export function needsAdvisorySearch(query: string): boolean {
  const intent = classifyQueryIntent(query);
  return intent.suggestedSources.includes('advisory');
}

/**
 * Extract company name from query if present
 */
export function extractCompanyName(query: string): string | null {
  const entities = extractEntities(query);
  const company = entities.find(e => e.type === 'company');
  return company?.value || null;
}
