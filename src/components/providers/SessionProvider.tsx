'use client';

import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';

interface SessionContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
}

const SessionContext = createContext<SessionContextType>({
  user: null,
  session: null,
  isLoading: true,
});

export function useSession() {
  return useContext(SessionContext);
}

interface SessionProviderProps {
  children: React.ReactNode;
  initialSession: Session | null;
}

export function SessionProvider({ children, initialSession }: SessionProviderProps) {
  const [session, setSession] = useState<Session | null>(initialSession);
  const [isLoading, setIsLoading] = useState(!initialSession);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!supabase) return;

    // 서버에서 전달받은 초기 세션이 있으면 사용
    if (initialSession) {
      setSession(initialSession);
      setIsLoading(false);
    }

    // Auth 상태 변경 구독
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, currentSession: Session | null) => {
        setSession(currentSession);
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase, initialSession]);

  const value = useMemo(() => ({
    user: session?.user ?? null,
    session,
    isLoading,
  }), [session, isLoading]);

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}
