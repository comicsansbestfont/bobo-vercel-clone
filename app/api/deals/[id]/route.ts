/**
 * Individual Deal API - GET /api/deals/[id]
 *
 * Returns detailed deal data including parsed master doc sections.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getProject } from '@/lib/db/queries';
import { readMasterDoc, type AdvisoryFile } from '@/lib/advisory/file-reader';
import { apiLogger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

interface DealDetail {
  id: string;
  name: string;
  stage: string;
  company?: string;
  website?: string;
  founder?: string;
  leadSource?: string;
  arrEstimate?: string;
  teamSize?: string;
  firstContact?: string;
  lastUpdated?: string;
  engagementType?: string;
  currentStage?: string;
  folderPath?: string;
  // Parsed sections from master doc
  summary?: string;
  strengths?: string[];
  weaknesses?: string[];
  redFlags?: string[];
  timeline?: Array<{
    date: string;
    stage: string;
    notes: string;
  }>;
}

function extractSection(masterDoc: AdvisoryFile, titlePattern: string): string | undefined {
  const section = masterDoc.sections.find(s =>
    s.title.toLowerCase().includes(titlePattern.toLowerCase())
  );
  return section?.content;
}

function extractListItems(content: string): string[] {
  const items: string[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    // Match bullet points, numbered lists, or bold items
    const match = line.match(/^[\s]*[-*•✓✗⚠]\s*(.+)/) ||
                  line.match(/^[\s]*\d+\.\s*\*\*([^*]+)\*\*/) || // **Bold** items
                  line.match(/^[\s]*\d+\.\s*(.+)/);
    if (match) {
      // Clean up the matched text
      let item = match[1].trim();
      // Remove trailing markdown like " - details..."
      item = item.replace(/\*\*/g, '').trim();
      if (item.length > 0) {
        items.push(item);
      }
    }
  }

  return items;
}

function extractTimeline(masterDoc: AdvisoryFile): DealDetail['timeline'] {
  // First try to find the section directly
  const historySection = masterDoc.sections.find(s =>
    s.title.toLowerCase().includes('stage history') ||
    s.title.toLowerCase().includes('engagement tracker')
  );

  if (historySection && historySection.content.includes('|')) {
    return parseTimelineFromContent(historySection.content);
  }

  // Fallback: Search in the raw content for the table
  const fullContent = masterDoc.content;
  // Look for the Deal Stage History table pattern
  const tableMatch = fullContent.match(/Deal Stage History[\s\S]*?(\|[^\n]+\|\n\|[-\s|]+\|\n(?:\|[^\n]+\|\n?)+)/i);
  if (tableMatch) {
    return parseTimelineFromContent(tableMatch[1]);
  }

  return undefined;
}

function parseTimelineFromContent(content: string): DealDetail['timeline'] {
  const timeline: DealDetail['timeline'] = [];
  const lines = content.split('\n');

  // Parse table rows (| Date | Stage | Notes |)
  for (const line of lines) {
    if (line.includes('|') && !line.includes('---') && !line.toLowerCase().includes('date')) {
      const cells = line.split('|').map(c => c.trim()).filter(Boolean);
      if (cells.length >= 2 && cells[0].match(/\d{4}/)) {
        timeline.push({
          date: cells[0],
          stage: cells[1],
          notes: cells[2] || '',
        });
      }
    }
  }

  return timeline.length > 0 ? timeline : undefined;
}

function extractAssessment(masterDoc: AdvisoryFile): {
  strengths: string[];
  weaknesses: string[];
  redFlags: string[];
} {
  const result = {
    strengths: [] as string[],
    weaknesses: [] as string[],
    redFlags: [] as string[],
  };

  // Look for Red Flags section specifically (common in all master docs)
  const redFlagsSection = masterDoc.sections.find(s =>
    s.title.toLowerCase().includes('red flag')
  );
  if (redFlagsSection) {
    result.redFlags = extractListItems(redFlagsSection.content);
  }

  // Look for GTM Assessment or similar sections
  const assessmentSection = masterDoc.sections.find(s =>
    s.title.includes('GTM Assessment') ||
    s.title.includes('Assessment') ||
    s.title.includes('SWOT')
  );

  // Look for Key Insights section (common pattern)
  const insightsSection = masterDoc.sections.find(s =>
    s.title.toLowerCase().includes('key insight') ||
    s.title.toLowerCase().includes('strategic insight')
  );
  if (insightsSection) {
    // Key insights are often strengths
    const insights = extractListItems(insightsSection.content);
    result.strengths.push(...insights.slice(0, 4)); // Take first 4
  }

  // Look for TLDR section for quick assessment items
  const tldrSection = masterDoc.sections.find(s =>
    s.title.toLowerCase().includes('tldr') ||
    s.title.toLowerCase().includes('executive summary')
  );
  if (tldrSection && result.strengths.length === 0) {
    const content = tldrSection.content;
    const lines = content.split('\n');
    for (const line of lines) {
      // Positive indicators
      if (line.includes('**Strong') || line.includes('✓')) {
        const match = line.match(/\*\*([^*]+)\*\*/) || line.match(/[✓-]\s*(.+)/);
        if (match) {
          result.strengths.push(match[1].trim().replace(/\*\*/g, ''));
        }
      }
      // Negative indicators
      if (line.includes('bottleneck') || line.includes('challenge') || line.includes('concern')) {
        const match = line.match(/\*\*([^*]+)\*\*/) || line.match(/[-]\s*(.+)/);
        if (match && !result.weaknesses.includes(match[1])) {
          result.weaknesses.push(match[1].trim().replace(/\*\*/g, ''));
        }
      }
    }
  }

  if (assessmentSection) {
    const content = assessmentSection.content;

    // Split by subsections if present
    const strengthsMatch = content.match(/Strength[s]?[:\s]*\n([\s\S]*?)(?=Weakness|Red Flag|###|$)/i);
    const weaknessesMatch = content.match(/Weakness[es]*[:\s]*\n([\s\S]*?)(?=Red Flag|Strength|###|$)/i);

    if (strengthsMatch && result.strengths.length === 0) {
      result.strengths = extractListItems(strengthsMatch[1]);
    }
    if (weaknessesMatch && result.weaknesses.length === 0) {
      result.weaknesses = extractListItems(weaknessesMatch[1]);
    }
  }

  return result;
}

function extractSummary(masterDoc: AdvisoryFile): string | undefined {
  // Try different section names for summary
  const summaryTitles = ['TLDR', 'Summary', 'Company Snapshot', 'Overview', 'Background'];

  for (const title of summaryTitles) {
    const section = masterDoc.sections.find(s =>
      s.title.toLowerCase().includes(title.toLowerCase())
    );
    if (section) {
      // Get first ~500 chars of meaningful content
      const content = section.content
        .replace(/\|[^|]+\|/g, '') // Remove table rows
        .replace(/[-]+/g, '') // Remove separators
        .trim();

      if (content.length > 50) {
        return content.slice(0, 500) + (content.length > 500 ? '...' : '');
      }
    }
  }

  // Fallback: use first section with substantial content
  for (const section of masterDoc.sections) {
    if (section.content.length > 100 && section.level <= 2) {
      return section.content.slice(0, 500) + '...';
    }
  }

  return undefined;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get project to find advisory folder path
    const project = await getProject(id);

    if (!project) {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      );
    }

    if (!project.advisory_folder_path) {
      return NextResponse.json(
        { error: 'Not an advisory deal' },
        { status: 400 }
      );
    }

    // Read the master doc
    const masterDoc = await readMasterDoc(project.advisory_folder_path);

    if (!masterDoc) {
      return NextResponse.json(
        { error: 'Master doc not found' },
        { status: 404 }
      );
    }

    const fm = masterDoc.frontmatter;
    const assessment = extractAssessment(masterDoc);

    const deal: DealDetail = {
      id: project.id,
      name: fm.company || project.name,
      stage: fm.deal_stage || 'New Opportunity',
      company: fm.company,
      website: fm.website,
      founder: fm.founder,
      leadSource: fm.lead_source,
      arrEstimate: fm.arr_estimate,
      teamSize: fm.team_size,
      firstContact: fm.first_contact,
      lastUpdated: fm.last_updated,
      engagementType: fm.engagement_type,
      currentStage: fm.current_stage,
      folderPath: project.advisory_folder_path,
      summary: extractSummary(masterDoc),
      strengths: assessment.strengths,
      weaknesses: assessment.weaknesses,
      redFlags: assessment.redFlags,
      timeline: extractTimeline(masterDoc),
    };

    return NextResponse.json({ deal });
  } catch (error) {
    apiLogger.error('Error fetching deal', error);
    return NextResponse.json(
      { error: 'Failed to fetch deal' },
      { status: 500 }
    );
  }
}
