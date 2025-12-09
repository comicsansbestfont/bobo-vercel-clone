import { NextRequest, NextResponse } from 'next/server';
import { PDFParse } from 'pdf-parse';
import matter from 'gray-matter';

export interface ProcessedDocument {
  filename: string;
  type: 'pdf' | 'txt' | 'md' | 'image';
  content: string;
  metadata?: Record<string, unknown>;
  pageCount?: number;
}

/**
 * POST /api/documents/process
 * Server-side document processing (primarily for PDFs which require Node.js Buffer)
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const filename = file.name;
    const extension = filename.split('.').pop()?.toLowerCase();

    let result: ProcessedDocument;

    switch (extension) {
      case 'pdf':
        result = await processPdf(file);
        break;
      case 'txt':
        result = await processTxt(file);
        break;
      case 'md':
      case 'markdown':
        result = await processMarkdown(file);
        break;
      default:
        return NextResponse.json(
          { error: `Unsupported file type: ${extension}` },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Document processing error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process document' },
      { status: 500 }
    );
  }
}

async function processPdf(file: File): Promise<ProcessedDocument> {
  const buffer = await file.arrayBuffer();
  const pdfParser = new PDFParse({ data: Buffer.from(buffer) });

  try {
    const textResult = await pdfParser.getText();
    const infoResult = await pdfParser.getInfo();

    return {
      filename: file.name,
      type: 'pdf',
      content: textResult.text,
      pageCount: textResult.pages.length,
      metadata: {
        info: infoResult,
      },
    };
  } finally {
    await pdfParser.destroy();
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
