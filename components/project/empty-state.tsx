"use client";

import { IconMessageCircle } from "@tabler/icons-react";

export function ProjectEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
        <IconMessageCircle className="h-8 w-8 text-neutral-400 dark:text-neutral-500" />
      </div>
      <h3 className="mb-2 text-lg font-medium text-neutral-900 dark:text-neutral-100">
        No conversations yet
      </h3>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Start chatting to work on this project
      </p>
    </div>
  );
}
