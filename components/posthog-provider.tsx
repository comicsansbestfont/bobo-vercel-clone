'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect } from 'react';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Check if already initialized to prevent React Strict Mode double-init warning
    if (typeof window !== 'undefined' && !posthog.__loaded) {
      posthog.init('phc_4ES6bIYIkuKvFUlgGg4eJAE3O2XSMZt2sdWzCrWXRcW', {
        api_host: 'https://us.i.posthog.com',
        person_profiles: 'identified_only',
        capture_pageview: false,
        capture_pageleave: true,
      });
    }
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
