"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";
import {
  IconChevronRight,
  IconCopy,
  IconFolder,
  IconSettings,
} from "@tabler/icons-react";
import { toast } from "sonner";

interface ProjectHeaderProps {
  projectName: string;
  projectId: string;
  onNameChange?: (newName: string) => void;
}

export function ProjectHeader({
  projectName,
  projectId,
  onNameChange,
}: ProjectHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(projectName);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (editValue.trim() && editValue !== projectName) {
      onNameChange?.(editValue.trim());
    } else {
      setEditValue(projectName);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleBlur();
    } else if (e.key === "Escape") {
      setEditValue(projectName);
      setIsEditing(false);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  return (
    <div className="border-b border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between rounded-t-2xl border-b border-neutral-200 px-6 py-3 dark:border-neutral-700">
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

      {/* Project Title Section */}
      <div className="flex flex-col items-center py-8">
        <IconFolder className="mb-3 h-8 w-8 text-neutral-600 dark:text-neutral-400" />

        {isEditing ? (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            autoFocus
            className="bg-transparent text-center text-3xl font-semibold text-neutral-900 outline-none dark:text-neutral-100"
            aria-label="Edit project name"
          />
        ) : (
          <h1
            onDoubleClick={handleDoubleClick}
            className="cursor-text text-3xl font-semibold text-neutral-900 dark:text-neutral-100"
            title="Double-click to edit"
            role="button"
            tabIndex={0}
            aria-label={`Project name: ${projectName}. Double-click or press Enter to edit.`}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleDoubleClick();
              }
            }}
          >
            {projectName}
          </h1>
        )}

        <Link
          href={`/project/${projectId}/settings`}
          className="mt-2 text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
          title="Manage custom instructions and knowledge base files"
          aria-label="Project settings"
        >
          Settings & Files
        </Link>
      </div>
    </div>
  );
}
