/**
 * Supabase Database Client
 *
 * Singleton client for interacting with Supabase database.
 * Uses environment variables for configuration.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Environment variables validation
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

/**
 * Public Supabase client (uses anon key)
 * Safe to use in browser and server components
 */
export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false, // Single-user MVP, no auth needed
      autoRefreshToken: false,
    },
  }
);

/**
 * Server-only Supabase client (uses service role key)
 * Has admin privileges, never expose to browser
 *
 * Usage: Only in Server Components, API Routes, and Server Actions
 */
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

/**
 * Default user ID for single-user MVP
 * All data will be associated with this user
 */
export const DEFAULT_USER_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
