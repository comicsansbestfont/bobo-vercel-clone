/**
 * File Viewer Page
 *
 * Displays a single project file with metadata and rendered content.
 * Used as the target for clickable citation sources.
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, FileText, Calendar, Weight } from 'lucide-react';
import { getFile, getProject } from '@/lib/db';
import { Streamdown } from 'streamdown';

interface FilePageProps {
  params: Promise<{
    projectId: string;
    fileId: string;
  }>;
}

export default async function FilePage({ params }: FilePageProps) {
  const { projectId, fileId } = await params;

  // Fetch file and project data
  const [file, project] = await Promise.all([
    getFile(fileId),
    getProject(projectId),
  ]);

  if (!file || !project) {
    notFound();
  }

  // Verify file belongs to this project
  if (file.project_id !== projectId) {
    notFound();
  }

  // Format file size
  const fileSizeKB = (file.file_size / 1024).toFixed(2);
  const fileDate = new Date(file.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* Breadcrumb navigation */}
      <nav className="mb-6">
        <Link
          href={`/project/${projectId}`}
          className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to {project.name}</span>
        </Link>
      </nav>

      {/* File metadata */}
      <header className="mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
              {file.filename}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {project.name}
            </p>
          </div>
        </div>

        {/* File stats */}
        <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            <span>Uploaded {fileDate}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Weight className="h-4 w-4" />
            <span>{fileSizeKB} KB</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FileText className="h-4 w-4" />
            <span className="capitalize">{file.file_type}</span>
          </div>
        </div>
      </header>

      {/* File content */}
      <article className="prose prose-gray dark:prose-invert max-w-none">
        <Streamdown>{file.content_text}</Streamdown>
      </article>
    </div>
  );
}
