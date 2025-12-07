/**
 * Advisory Summarizer
 *
 * Generates AI summaries from master docs for project instructions.
 * Uses Gemini Flash via AI Gateway for cost efficiency.
 *
 * M38: Advisory Project Integration
 */

import { generateText } from 'ai';
import { getModel } from '@/lib/ai/models';
import type { AdvisoryFile } from './file-reader';

const SUMMARY_PROMPT = `You are analyzing an advisory master document. Generate a concise project briefing that captures:

1. **Company Snapshot**: One paragraph with key facts (ARR, stage, team size, location)
2. **Key Context**: 2-3 bullet points about what makes this deal/client unique
3. **Red Flags**: Any concerns or risks mentioned (if none, say "None identified")
4. **Current Status**: What's the latest and what's next

Keep the total summary under 1000 characters. Focus on what an advisor needs to know for their next interaction.

Format as clean markdown without excessive formatting.`;

/**
 * Generate an AI summary from a master doc
 */
export async function generateSummary(
  masterDoc: AdvisoryFile,
  entityType: 'deal' | 'client'
): Promise<string> {
  try {
    const { text } = await generateText({
      model: getModel('google/gemini-2.0-flash'),
      system: SUMMARY_PROMPT,
      prompt: `Entity Type: ${entityType}
Company: ${masterDoc.frontmatter.company || 'Unknown'}

FRONTMATTER:
${JSON.stringify(masterDoc.frontmatter, null, 2)}

DOCUMENT CONTENT (first 8000 chars):
${masterDoc.content.slice(0, 8000)}`,
    });

    return text;
  } catch (error) {
    console.error('[summarizer] Error generating summary:', error);
    // Return a basic summary from frontmatter if AI fails
    return generateFallbackSummary(masterDoc, entityType);
  }
}

/**
 * Generate a fallback summary from frontmatter when AI is unavailable
 */
function generateFallbackSummary(masterDoc: AdvisoryFile, entityType: 'deal' | 'client'): string {
  const fm = masterDoc.frontmatter;
  const parts: string[] = [];

  parts.push(`## ${fm.company || 'Unknown Company'} (${entityType})`);
  parts.push('');

  if (fm.founder) parts.push(`**Founder:** ${fm.founder}`);
  if (fm.arr_estimate) parts.push(`**ARR:** ${fm.arr_estimate}`);
  if (fm.deal_stage) parts.push(`**Stage:** ${fm.deal_stage}`);
  if (fm.team_size) parts.push(`**Team:** ${fm.team_size}`);

  parts.push('');
  parts.push('*AI summary unavailable - showing basic info from frontmatter*');

  return parts.join('\n');
}

/**
 * Generate summaries for multiple master docs in batch
 */
export async function generateSummariesBatch(
  masterDocs: Array<{ masterDoc: AdvisoryFile; entityType: 'deal' | 'client' }>
): Promise<Map<string, string>> {
  const results = new Map<string, string>();

  // Process sequentially to avoid rate limits
  for (const { masterDoc, entityType } of masterDocs) {
    const key = masterDoc.frontmatter.company || masterDoc.filename;
    try {
      const summary = await generateSummary(masterDoc, entityType);
      results.set(key, summary);

      // Small delay between API calls
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`[summarizer] Failed to generate summary for ${key}:`, error);
      results.set(key, generateFallbackSummary(masterDoc, entityType));
    }
  }

  return results;
}
