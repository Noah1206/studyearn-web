import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

/**
 * Create Supabase client for browser/client components
 * Creates a new instance each time (removed singleton for debugging)
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log('[Supabase Client] Creating client...', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    url: supabaseUrl?.substring(0, 30) + '...'
  });

  // During build time, env vars might not be available
  if (!supabaseUrl || !supabaseAnonKey) {
    if (typeof window === 'undefined') {
      // Server-side build time - return null safely
      return null as any;
    }
    throw new Error('Missing Supabase environment variables');
  }

  const client = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
  console.log('[Supabase Client] Client created successfully');
  return client;
}
