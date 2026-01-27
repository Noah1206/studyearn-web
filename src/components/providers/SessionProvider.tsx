'use client';

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUserStore } from '@/store/userStore';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';

interface SessionContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  refreshUserData: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType>({
  user: null,
  session: null,
  isLoading: true,
  refreshUserData: async () => {},
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

  // User store actions
  const { setProfile, syncCreatorStatus, clearUser } = useUserStore();

  // 유저 프로필 및 크리에이터 정보 로드
  const loadUserData = useCallback(async (user: User) => {
    if (!supabase || !user) return;

    const userId = user.id;

    try {
      // OAuth 메타데이터에서 정보 추출 (Kakao, Google 등)
      const oauthNickname = user.user_metadata?.full_name ||
                           user.user_metadata?.name ||
                           user.user_metadata?.user_name ||
                           user.user_metadata?.preferred_username ||
                           user.user_metadata?.nickname;
      const oauthAvatarUrl = user.user_metadata?.avatar_url ||
                            user.user_metadata?.picture ||
                            user.user_metadata?.profile_image;

      // 프로필 정보 가져오기 시도
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, nickname, username, avatar_url, bio')
        .eq('id', userId)
        .maybeSingle();

      // DB 프로필이 있든 없든 항상 setProfile 호출 (OAuth 메타데이터 fallback)
      setProfile({
        id: userId,
        email: user.email || '',
        nickname: profile?.nickname || profile?.username || oauthNickname || '사용자',
        username: profile?.username,
        avatar_url: profile?.avatar_url || oauthAvatarUrl,
        bio: profile?.bio,
      });

      // 크리에이터 설정 가져오기
      const { data: creatorSettings, error: creatorError } = await supabase
        .from('creator_settings')
        .select('display_name, bio, profile_image_url, is_verified')
        .eq('user_id', userId)
        .maybeSingle();

      if (creatorError) {
        console.error('❌ [SessionProvider] Failed to fetch creator_settings:', creatorError);
      }

      console.log('👤 [SessionProvider] Creator settings for user:', userId, creatorSettings);

      if (creatorSettings) {
        console.log('✅ [SessionProvider] User is a creator, syncing status');
        syncCreatorStatus(true, {
          display_name: creatorSettings.display_name || '',
          bio: creatorSettings.bio,
          profile_image_url: creatorSettings.profile_image_url,
          is_verified: creatorSettings.is_verified || false,
          total_subscribers: 0,
        });
      } else {
        console.log('ℹ️ [SessionProvider] User is not a creator (no creator_settings found)');
        syncCreatorStatus(false);
      }
    } catch (error) {
      console.error('Failed to load user data:', error);

      // 에러 발생해도 OAuth 메타데이터로 기본 프로필 설정
      const oauthNickname = user.user_metadata?.full_name ||
                           user.user_metadata?.name ||
                           user.user_metadata?.nickname ||
                           '사용자';
      const oauthAvatarUrl = user.user_metadata?.avatar_url ||
                            user.user_metadata?.picture;

      setProfile({
        id: userId,
        email: user.email || '',
        nickname: oauthNickname,
        avatar_url: oauthAvatarUrl,
      });

      // 에러 발생 시에도 크리에이터 상태를 명시적으로 false로 설정
      syncCreatorStatus(false);
    }
  }, [supabase, setProfile, syncCreatorStatus]);

  // 외부에서 호출 가능한 새로고침 함수
  const refreshUserData = useCallback(async () => {
    if (session?.user) {
      await loadUserData(session.user);
    }
  }, [session?.user, loadUserData]);

  useEffect(() => {
    if (!supabase) return;

    // 서버에서 전달받은 초기 세션이 있으면 사용
    if (initialSession) {
      console.log('🔑 [SessionProvider] Using initial session for:', initialSession.user?.email);
      setSession(initialSession);
      setIsLoading(false);
      // 초기 세션이 있으면 유저 데이터 로드
      if (initialSession.user) {
        loadUserData(initialSession.user);
      }
    } else {
      console.log('⚠️ [SessionProvider] No initial session provided');
    }

    // Auth 상태 변경 구독
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, currentSession: Session | null) => {
        console.log('🔐 [SessionProvider] Auth state changed:', event, 'Has session:', !!currentSession);
        setSession(currentSession);
        setIsLoading(false);

        // 로그인 이벤트 시 유저 데이터 로드
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && currentSession?.user) {
          console.log('✅ [SessionProvider] Loading user data for:', currentSession.user.email);
          await loadUserData(currentSession.user);
        }

        // 로그아웃 시 유저 스토어 클리어
        if (event === 'SIGNED_OUT') {
          console.log('🚪 [SessionProvider] SIGNED_OUT event - clearing user');
          clearUser();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase, initialSession, loadUserData, clearUser]);

  const value = useMemo(() => ({
    user: session?.user ?? null,
    session,
    isLoading,
    refreshUserData,
  }), [session, isLoading, refreshUserData]);

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}
