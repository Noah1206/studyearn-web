import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

// 싱글톤 인스턴스
let supabaseInstance: ReturnType<typeof createBrowserClient<Database>> | null = null;

/**
 * Create Supabase client for browser/client components
 * Uses singleton pattern to ensure consistent session state
 */
export function createClient() {
  // 이미 인스턴스가 있으면 재사용
  if (supabaseInstance) {
    return supabaseInstance;
  }

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

  // 싱글톤 인스턴스 생성
  supabaseInstance = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
  return supabaseInstance;
}
