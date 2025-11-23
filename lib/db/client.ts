/**
 * Supabase Database Client
 *
 * Singleton client for interacting with Supabase database.
 * Uses environment variables for configuration.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Lazily create clients so builds don't fail when env vars are missing.
// We still throw with a clear error the moment a Supabase call is attempted
// without the required environment variables being set.
const missingEnvMessage =
  'Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (and SUPABASE_SERVICE_ROLE_KEY for admin). Set them in your environment.';

let supabaseClient: SupabaseClient<Database> | null = null;
let supabaseAdminClient: SupabaseClient<Database> | null = null;

const createSupabaseProxy = <T>(getClient: () => SupabaseClient<T>) =>
  new Proxy(
    {},
    {
      get(_target, prop) {
        return (getClient() as never)[prop];
      },
    }
  ) as SupabaseClient<T>;

const getSupabaseClient = () => {
  if (supabaseClient) return supabaseClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(missingEnvMessage);
  }

  supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false, // Single-user MVP, no auth needed
      autoRefreshToken: false,
    },
  });

  return supabaseClient;
};

const getSupabaseAdminClient = () => {
  if (supabaseAdminClient) return supabaseAdminClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(missingEnvMessage);
  }

  supabaseAdminClient = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return supabaseAdminClient;
};

/**
 * Public Supabase client (uses anon key)
 * Safe to use in browser and server components
 */
export const supabase = createSupabaseProxy<Database>(getSupabaseClient);

/**
 * Server-only Supabase client (uses service role key)
 * Has admin privileges, never expose to browser
 *
 * Usage: Only in Server Components, API Routes, and Server Actions
 */
export const supabaseAdmin = createSupabaseProxy<Database>(getSupabaseAdminClient);

/**
 * Default user ID for single-user MVP
 * All data will be associated with this user
 */
export const DEFAULT_USER_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
