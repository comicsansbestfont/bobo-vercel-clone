"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { motion } from "motion/react";

interface ChatCardProps {
  id: string;
  title: string;
  preview?: string;
  timestamp: Date;
  projectId: string;
  className?: string;
}

function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
}

export function ChatCard({
  id,
  title,
  preview,
  timestamp,
  projectId,
  className,
}: ChatCardProps) {
  const formattedDate = formatRelativeDate(timestamp);

  return (
    <Link
      href={`/project/${projectId}?chatId=${id}`}
      className={cn(
        "block rounded-lg bg-neutral-100 p-4 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700",
        className,
      )}
      aria-label={`Open chat: ${title}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-1">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            {title}
          </h3>
          {preview && (
            <p className="line-clamp-2 text-sm text-neutral-700 dark:text-neutral-400">
              {preview}
            </p>
          )}
        </div>
        <time
          className="flex-shrink-0 text-xs text-neutral-600 dark:text-neutral-500"
          dateTime={timestamp.toISOString()}
        >
          {formattedDate}
        </time>
      </div>
    </Link>
  );
}
