/**
 * Advisory File Reader
 *
 * Reads master docs from advisory folder, parses YAML frontmatter and sections.
 * Server-side only (uses Node.js fs).
 *
 * M38: Advisory Project Integration
 */

import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

export interface AdvisoryFrontmatter {
  company: string;
  website?: string;
  founder?: string;
  lead_source?: string;
  first_contact?: string;
  deal_stage?: string;
  engagement_type?: string;
  current_stage?: string;
  arr_estimate?: string;
  team_size?: string;
  last_updated?: string;
  [key: string]: string | undefined;
}

export interface AdvisorySection {
  title: string;
  content: string;
  level: number;
}

export interface AdvisoryFile {
  filename: string;
  filepath: string;
  content: string;
  frontmatter: AdvisoryFrontmatter;
  sections: AdvisorySection[];
}

/**
 * Read master doc from advisory folder
 */
export async function readMasterDoc(folderPath: string): Promise<AdvisoryFile | null> {
  const fullPath = path.join(process.cwd(), folderPath);

  try {
    const files = await fs.readdir(fullPath);
    const masterDocFile = files.find(f => f.startsWith('master-doc-') && f.endsWith('.md'));

    if (!masterDocFile) {
      console.warn(`[file-reader] No master doc found in ${folderPath}`);
      return null;
    }

    const filepath = path.join(fullPath, masterDocFile);
    const rawContent = await fs.readFile(filepath, 'utf-8');
    const { data: frontmatter, content: body } = matter(rawContent);
    const sections = parseSections(body);

    return {
      filename: masterDocFile,
      filepath,
      content: body,
      frontmatter: frontmatter as AdvisoryFrontmatter,
      sections,
    };
  } catch (error) {
    console.error(`[file-reader] Error reading master doc from ${folderPath}:`, error);
    return null;
  }
}

/**
 * List all advisory folders (deals and clients)
 */
export async function listAdvisoryFolders(): Promise<{
  deals: string[];
  clients: string[];
}> {
  const advisoryPath = path.join(process.cwd(), 'advisory');

  const isValidFolder = (name: string) =>
    !name.startsWith('_') && !name.startsWith('.') && !name.endsWith('.md');

  try {
    const [dealsDir, clientsDir] = await Promise.all([
      fs.readdir(path.join(advisoryPath, 'deals')).catch(() => []),
      fs.readdir(path.join(advisoryPath, 'clients')).catch(() => []),
    ]);

    // Filter and verify each is a directory
    const filterDirs = async (dir: string[], basePath: string) => {
      const validDirs: string[] = [];
      for (const name of dir) {
        if (isValidFolder(name)) {
          try {
            const stat = await fs.stat(path.join(basePath, name));
            if (stat.isDirectory()) {
              validDirs.push(name);
            }
          } catch {
            // Skip if stat fails
          }
        }
      }
      return validDirs;
    };

    return {
      deals: await filterDirs(dealsDir, path.join(advisoryPath, 'deals')),
      clients: await filterDirs(clientsDir, path.join(advisoryPath, 'clients')),
    };
  } catch (error) {
    console.error('[file-reader] Error listing advisory folders:', error);
    return { deals: [], clients: [] };
  }
}

/**
 * Parse markdown sections by heading level
 */
function parseSections(content: string): AdvisorySection[] {
  const lines = content.split('\n');
  const sections: AdvisorySection[] = [];
  let currentSection: AdvisorySection | null = null;
  let buffer: string[] = [];

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,3})\s+(.+)/);

    if (headingMatch) {
      // Save previous section
      if (currentSection) {
        currentSection.content = buffer.join('\n').trim();
        sections.push(currentSection);
      }

      currentSection = {
        title: headingMatch[2],
        content: '',
        level: headingMatch[1].length,
      };
      buffer = [];
    } else if (currentSection) {
      buffer.push(line);
    }
  }

  // Save last section
  if (currentSection) {
    currentSection.content = buffer.join('\n').trim();
    sections.push(currentSection);
  }

  return sections;
}

/**
 * Extract key sections for context injection
 * Limits token usage by extracting only the most important sections
 */
export function extractKeySections(masterDoc: AdvisoryFile): string {
  const keySectionTitles = [
    'Company Snapshot',
    'TLDR',
    'Key Stakeholders',
    'GTM Assessment',
    'Red Flags',
    'Current Status',
    'Competitive Landscape',
  ];

  const keyContent: string[] = [];

  // Add frontmatter as structured data
  keyContent.push('## Company Overview');
  if (masterDoc.frontmatter.company) keyContent.push(`**Company:** ${masterDoc.frontmatter.company}`);
  if (masterDoc.frontmatter.founder) keyContent.push(`**Founder:** ${masterDoc.frontmatter.founder}`);
  if (masterDoc.frontmatter.deal_stage) keyContent.push(`**Stage:** ${masterDoc.frontmatter.deal_stage}`);
  if (masterDoc.frontmatter.arr_estimate) keyContent.push(`**ARR:** ${masterDoc.frontmatter.arr_estimate}`);
  if (masterDoc.frontmatter.team_size) keyContent.push(`**Team:** ${masterDoc.frontmatter.team_size}`);
  if (masterDoc.frontmatter.last_updated) keyContent.push(`**Last Updated:** ${masterDoc.frontmatter.last_updated}`);
  keyContent.push('');

  // Add key sections (limited content per section)
  for (const section of masterDoc.sections) {
    if (keySectionTitles.some(t => section.title.includes(t))) {
      keyContent.push(`## ${section.title}`);
      keyContent.push(section.content.slice(0, 2000)); // Limit per section
      keyContent.push('');
    }
  }

  return keyContent.join('\n');
}

/**
 * Get full advisory folder path from folder name and type
 */
export function getAdvisoryFolderPath(folderName: string, entityType: 'deal' | 'client'): string {
  const typeFolder = entityType === 'client' ? 'clients' : 'deals';
  return `advisory/${typeFolder}/${folderName}`;
}
