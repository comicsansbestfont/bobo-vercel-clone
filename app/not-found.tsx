'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-900">
      <div className="max-w-md space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-8xl font-bold text-neutral-900 dark:text-neutral-100">
            404
          </h1>
          <h2 className="text-2xl font-semibold text-neutral-700 dark:text-neutral-300">
            Page not found
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            The page you are looking for does not exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link href="/">
            <Button className="w-full sm:w-auto">
              Go to home
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="w-full sm:w-auto"
          >
            Go back
          </Button>
        </div>
      </div>
    </div>
  );
}
