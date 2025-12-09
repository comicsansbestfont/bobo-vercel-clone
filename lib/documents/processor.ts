import matter from 'gray-matter';

export interface ProcessedDocument {
  filename: string;
  type: 'pdf' | 'txt' | 'md' | 'image';
  content: string;
  metadata?: Record<string, unknown>;
  pageCount?: number;
}

/**
 * Client-side document processor for TXT and MD files.
 * PDF files must be processed server-side via /api/documents/process
 */
export async function processDocument(file: File): Promise<ProcessedDocument> {
  const filename = file.name;
  const extension = filename.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'txt':
      return processTxt(file);
    case 'md':
    case 'markdown':
      return processMarkdown(file);
    case 'pdf':
      throw new Error('PDF processing must be done server-side. Use /api/documents/process endpoint.');
    default:
      throw new Error(`Unsupported file type: ${extension}`);
  }
}

async function processTxt(file: File): Promise<ProcessedDocument> {
  const content = await file.text();
  return {
    filename: file.name,
    type: 'txt',
    content,
  };
}

async function processMarkdown(file: File): Promise<ProcessedDocument> {
  const raw = await file.text();
  const { data, content } = matter(raw);

  return {
    filename: file.name,
    type: 'md',
    content,
    metadata: data,
  };
}

/**
 * Truncate document content for context injection
 */
export function truncateForContext(doc: ProcessedDocument, maxChars: number = 10000): string {
  if (doc.content.length <= maxChars) {
    return doc.content;
  }
  return doc.content.slice(0, maxChars) + '\n\n[... truncated for context ...]';
}
