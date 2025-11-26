"use client";

import Link from "next/link";
import {
  IconChevronRight,
  IconCopy,
  IconSettings,
} from "@tabler/icons-react";
import { toast } from "sonner";

interface ProjectHeaderProps {
  projectName: string;
  projectId: string;
}

export function ProjectHeader({
  projectName,
  projectId,
}: ProjectHeaderProps) {
  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  return (
    <div className="flex items-center justify-between rounded-t-2xl border-b border-neutral-200 bg-white px-6 py-3 dark:border-neutral-700 dark:bg-neutral-900">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link
          href="/"
          className="text-neutral-600 transition-colors hover:text-neutral-900 hover:underline dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          Home
        </Link>
        <IconChevronRight className="h-3.5 w-3.5 text-neutral-400" />
        <span className="text-neutral-900 dark:text-neutral-100">
          {projectName}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <Link
          href={`/project/${projectId}/settings`}
          className="rounded-md p-2 text-neutral-600 transition-colors hover:bg-neutral-200 dark:text-neutral-400 dark:hover:bg-neutral-700"
          title="Project Settings"
          aria-label="Project settings"
        >
          <IconSettings className="h-4 w-4" />
        </Link>
        <button
          onClick={handleCopyLink}
          className="rounded-md p-2 text-neutral-600 transition-colors hover:bg-neutral-200 dark:text-neutral-400 dark:hover:bg-neutral-700"
          title="Copy link"
          aria-label="Copy project link"
        >
          <IconCopy className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
