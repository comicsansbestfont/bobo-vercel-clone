"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PlayIcon, Loader2Icon, AlertTriangleIcon } from "lucide-react";
import { useState } from "react";

export type ContinueButtonProps = {
  continuationToken: string;
  model?: string;
  onContinue?: () => void;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
};

/**
 * ContinueButton - Renders a button to resume an interrupted Claude response
 *
 * When a response times out, the server saves the partial content and creates
 * a continuation token. This button calls the /api/chat/continue endpoint
 * to resume generation from where it left off.
 */
export function ContinueButton({
  continuationToken,
  model,
  onContinue,
  onSuccess,
  onError,
  className,
  disabled = false,
}: ContinueButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContinue = async () => {
    if (!continuationToken || isLoading || disabled) return;

    setIsLoading(true);
    setError(null);
    onContinue?.();

    try {
      const response = await fetch("/api/chat/continue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          continuationToken,
          model,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to continue response");
      }

      // The response is a stream - let the parent handle it
      // For now, just signal success
      onSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Button
        onClick={handleContinue}
        disabled={isLoading || disabled || !continuationToken}
        variant="outline"
        size="sm"
        className="gap-2 border-amber-500/50 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300"
      >
        {isLoading ? (
          <>
            <Loader2Icon className="size-4 animate-spin" />
            Continuing...
          </>
        ) : (
          <>
            <PlayIcon className="size-4" />
            Continue generating
          </>
        )}
      </Button>
      {error && (
        <div className="flex items-center gap-2 text-xs text-destructive">
          <AlertTriangleIcon className="size-3" />
          {error}
        </div>
      )}
    </div>
  );
}

/**
 * TimeoutWarning - Displays a warning when response was truncated due to timeout
 */
export type TimeoutWarningProps = {
  message?: string;
  className?: string;
};

export function TimeoutWarning({
  message = "Response was interrupted due to server timeout.",
  className,
}: TimeoutWarningProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400",
        className
      )}
    >
      <AlertTriangleIcon className="size-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

/**
 * PartialMessageIndicator - Visual indicator that a message is incomplete
 */
export type PartialMessageIndicatorProps = {
  className?: string;
};

export function PartialMessageIndicator({
  className,
}: PartialMessageIndicatorProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-500",
        className
      )}
    >
      <span className="inline-block size-1.5 animate-pulse rounded-full bg-amber-500" />
      <span>Response incomplete</span>
    </div>
  );
}
