/**
 * Identity Context Fetcher
 *
 * Fetches identity documents for proactive injection into chat context.
 * Called when content creation intent is detected.
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { chatLogger } from '@/lib/logger';

// Path to identity documents
const IDENTITY_BASE_PATH = 'advisory/identity/Sachee';

// Identity document paths
const IDENTITY_DOCS = {
  voiceAndTone: 'VOICE_AND_TONE.md',
  coreProfile: 'CORE_PROFILE.md',
  businessPlan: 'BUSINESS_PLAN.md',
} as const;

type IdentityDocType = keyof typeof IDENTITY_DOCS;

/**
 * Fetches the VOICE_AND_TONE.md document for content creation context
 *
 * @returns The full content of VOICE_AND_TONE.md, or null if not found
 */
export async function fetchVoiceAndToneContext(): Promise<string | null> {
  return fetchIdentityDocument('voiceAndTone');
}

/**
 * Fetches a specific identity document
 *
 * @param docType - The type of identity document to fetch
 * @returns The document content, or null if not found
 */
export async function fetchIdentityDocument(
  docType: IdentityDocType
): Promise<string | null> {
  const filename = IDENTITY_DOCS[docType];
  const fullPath = join(process.cwd(), IDENTITY_BASE_PATH, filename);

  try {
    if (!existsSync(fullPath)) {
      chatLogger.warn(`[identity-context] Document not found: ${fullPath}`);
      return null;
    }

    const content = await readFile(fullPath, 'utf-8');
    chatLogger.info(
      `[identity-context] Fetched ${docType} (${content.length} chars)`
    );

    return content;
  } catch (error) {
    chatLogger.error(`[identity-context] Error fetching ${docType}:`, error);
    return null;
  }
}

/**
 * Formats identity context for injection into system prompt
 *
 * @param voiceAndToneContent - The raw content of VOICE_AND_TONE.md
 * @returns Formatted context block for system prompt
 */
export function formatIdentityContext(voiceAndToneContent: string): string {
  return `
### IDENTITY CONTEXT: Voice & Tone Guide

The following is Sachee's comprehensive voice and tone guide. Use this to ensure all content written on his behalf matches his authentic voice.

---

${voiceAndToneContent}

---

**Important:** When writing content for Sachee:
- Follow the voice markers and patterns documented above
- Use the authenticity checklist before finalizing content
- Prefer specific examples over generic statements
- Maintain "mate at the pub" energy with real substance
`;
}

/**
 * Fetches and formats the voice and tone context for content creation
 *
 * @returns Formatted identity context, or null if fetch fails
 */
export async function getContentCreationContext(): Promise<string | null> {
  const voiceAndTone = await fetchVoiceAndToneContext();

  if (!voiceAndTone) {
    return null;
  }

  return formatIdentityContext(voiceAndTone);
}

/**
 * Gets a summary of available identity documents
 * Useful for debugging and verification
 */
export async function getIdentityDocumentsSummary(): Promise<{
  available: string[];
  missing: string[];
}> {
  const available: string[] = [];
  const missing: string[] = [];

  for (const [docType, filename] of Object.entries(IDENTITY_DOCS)) {
    const fullPath = join(process.cwd(), IDENTITY_BASE_PATH, filename);
    if (existsSync(fullPath)) {
      available.push(docType);
    } else {
      missing.push(docType);
    }
  }

  return { available, missing };
}
