'use client';

import { BoboSidebarOptionA } from '@/components/ui/bobo-sidebar-option-a';
import { useParams, useRouter } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { Project, File } from '@/lib/db/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Upload, Trash2, File as FileIcon } from 'lucide-react';
import { FileUploadEmptyState } from '@/components/project/file-upload-empty-state';

export default function ProjectSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [customInstructions, setCustomInstructions] = useState('');
  const [isSavingInstructions, setIsSavingInstructions] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<globalThis.File | null>(null);

  // Fetch project and files
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        const [projectRes, filesRes] = await Promise.all([
          fetch(`/api/projects/${projectId}`),
          fetch(`/api/projects/${projectId}/files`),
        ]);

        if (!projectRes.ok) {
          throw new Error('Failed to fetch project');
        }

        const projectData = await projectRes.json();
        const filesData = filesRes.ok ? await filesRes.json() : { files: [] };

        setProject(projectData.project);
        setCustomInstructions(projectData.project.custom_instructions || '');
        setFiles(filesData.files || []);
      } catch (err) {
        console.error('Failed to fetch project data:', err);
        toast.error('Failed to load project settings');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  // Auto-save custom instructions (debounced)
  const saveInstructions = useCallback(async () => {
    if (!project) return;

    setIsSavingInstructions(true);

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          custom_instructions: customInstructions || null,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save instructions');
      }

      toast.success('Custom instructions saved');
    } catch (err) {
      console.error('Failed to save instructions:', err);
      toast.error('Failed to save instructions');
    } finally {
      setIsSavingInstructions(false);
    }
  }, [projectId, customInstructions, project]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.md')) {
      toast.error('Invalid file type', {
        description: 'Only markdown files (.md) are supported',
      });
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error('File too large', {
        description: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (10MB)`,
      });
      return;
    }

    setSelectedFile(file);
  };

  // Upload file
  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);

    try {
      // Read file content
      const content = await selectedFile.text();

      const res = await fetch(`/api/projects/${projectId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: selectedFile.name,
          content: content,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to upload file');
      }

      const data = await res.json();
      setFiles((prev) => [data.file, ...prev]);
      setSelectedFile(null);

      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      toast.success('File uploaded successfully');
    } catch (err) {
      console.error('Failed to upload file:', err);
      toast.error('Failed to upload file', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Delete file
  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const res = await fetch(`/api/projects/${projectId}/files/${fileId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete file');
      }

      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      toast.success('File deleted');
    } catch (err) {
      console.error('Failed to delete file:', err);
      toast.error('Failed to delete file');
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex h-screen flex-col bg-white dark:bg-neutral-900">
          <div className="border-b border-neutral-200 p-6 dark:border-neutral-700">
            <Skeleton className="h-8 w-64" />
          </div>
          <div className="flex-1 overflow-auto p-6">
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      );
    }

    if (!project) {
      return (
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Project not found</h1>
            <Button onClick={() => router.push('/')} className="mt-4">
              Go Home
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex h-screen flex-col bg-white dark:bg-neutral-900">
        {/* Header */}
        <div className="border-b border-neutral-200 p-6 dark:border-neutral-700">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/project/${projectId}`)}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Project
          </Button>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {project.name} - Settings
          </h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Configure custom instructions and manage knowledge base files
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-4xl space-y-8">
            {/* Custom Instructions Section */}
            <section>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Custom Instructions
              </h2>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                Provide context and instructions that will be included in every chat for this
                project.
              </p>

              <div className="mt-4">
                <Textarea
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="e.g., You are an expert in React and TypeScript. Always use functional components and hooks. Prefer Tailwind CSS for styling..."
                  className="min-h-[200px] font-mono text-sm"
                  onBlur={saveInstructions}
                />
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {customInstructions.length} characters
                    {customInstructions.length > 2000 && (
                      <span className="ml-2 text-yellow-600">
                        (Consider keeping under 2000 characters)
                      </span>
                    )}
                  </p>
                  <Button
                    onClick={saveInstructions}
                    size="sm"
                    disabled={isSavingInstructions}
                  >
                    {isSavingInstructions ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
            </section>

            {/* Knowledge Base Files Section */}
            <section>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Knowledge Base Files
              </h2>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                Upload markdown files (.md) that contain project-specific knowledge. Max 10MB per
                file.
              </p>

              {/* File Upload */}
              <div className="mt-4 rounded-lg border-2 border-dashed border-neutral-300 p-6 text-center dark:border-neutral-700">
                <Input
                  id="file-upload"
                  type="file"
                  accept=".md"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="mx-auto h-12 w-12 text-neutral-400" />
                  <p className="mt-2 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    Click to upload or drag and drop
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">Markdown files only (.md), max 10MB</p>
                </label>

                {selectedFile && (
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <p className="text-sm text-neutral-700 dark:text-neutral-300">
                      Selected: {selectedFile.name} (
                      {(selectedFile.size / 1024).toFixed(2)} KB)
                    </p>
                    <Button onClick={handleUpload} size="sm" disabled={isUploading}>
                      {isUploading ? 'Uploading...' : 'Upload'}
                    </Button>
                    <Button
                      onClick={() => setSelectedFile(null)}
                      size="sm"
                      variant="ghost"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>

              {/* Files List */}
              {files.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    Uploaded Files ({files.length})
                  </h3>
                  <div className="mt-3 space-y-2">
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between rounded-lg border border-neutral-200 p-3 dark:border-neutral-700"
                      >
                        <div className="flex items-center gap-3">
                          <FileIcon className="h-5 w-5 text-neutral-400" />
                          <div>
                            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                              {file.filename}
                            </p>
                            <p className="text-xs text-neutral-500">
                              {(file.file_size / 1024).toFixed(2)} KB •{' '}
                              {new Date(file.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleDeleteFile(file.id)}
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {files.length === 0 && (
                <FileUploadEmptyState />
              )}
            </section>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Loading project settings...</div>}>
      <BoboSidebarOptionA>
        {renderContent()}
      </BoboSidebarOptionA>
    </Suspense>
  );
}
