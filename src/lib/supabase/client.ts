import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

/**
 * Create Supabase client for browser/client components
 * Returns null during build time when env vars are not available
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // During build time, env vars might not be available
  if (!supabaseUrl || !supabaseAnonKey) {
    if (typeof window === 'undefined') {
      // Server-side build time - return null safely
      return null as any;
    }
    throw new Error('Missing Supabase environment variables');
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
