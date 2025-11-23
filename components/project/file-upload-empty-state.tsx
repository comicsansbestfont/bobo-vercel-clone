"use client";

import { Upload } from "lucide-react";

export function FileUploadEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
        <Upload className="h-10 w-10 text-neutral-400 dark:text-neutral-500" />
      </div>
      <h3 className="mb-2 text-lg font-medium text-neutral-900 dark:text-neutral-100">
        No knowledge base files
      </h3>
      <p className="mb-1 max-w-sm text-sm text-neutral-600 dark:text-neutral-400">
        Upload markdown files to provide project-specific context to the AI.
      </p>
      <p className="text-xs text-neutral-500 dark:text-neutral-500">
        The AI will automatically search these files when answering questions.
      </p>
    </div>
  );
}
