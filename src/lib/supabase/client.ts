import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

// Singleton instance
let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

/**
 * Create Supabase client for browser/client components
 * Uses singleton pattern to ensure consistent auth state
 */
export function createClient() {
  // Return existing instance if available
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log('[Supabase Client] Creating singleton client...', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
  });

  // During build time, env vars might not be available
  if (!supabaseUrl || !supabaseAnonKey) {
    if (typeof window === 'undefined') {
      // Server-side build time - return null safely
      return null as any;
    }
    throw new Error('Missing Supabase environment variables');
  }

  supabaseClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
  console.log('[Supabase Client] Singleton client created successfully');
  return supabaseClient;
}
