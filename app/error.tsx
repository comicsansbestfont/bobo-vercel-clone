'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-900">
      <div className="max-w-md space-y-6 rounded-lg border border-neutral-200 bg-white p-8 text-center shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Something went wrong
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            An unexpected error occurred. Please try again.
          </p>
        </div>

        {error.message && (
          <div className="rounded-md bg-red-50 p-3 text-left dark:bg-red-900/20">
            <p className="text-sm font-medium text-red-800 dark:text-red-400">
              Error details:
            </p>
            <p className="mt-1 text-xs text-red-700 dark:text-red-300">
              {error.message}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Button
            onClick={reset}
            className="w-full"
          >
            Try again
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.href = '/'}
            className="w-full"
          >
            Go to home
          </Button>
        </div>

        {error.digest && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
