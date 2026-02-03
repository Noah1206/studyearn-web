'use client';

import { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
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

  // 중복 호출 방지를 위한 ref
  const isLoadingUserData = useRef(false);
  const lastLoadedUserId = useRef<string | null>(null);

  // User store actions
  const { setProfile, syncCreatorStatus, clearUser } = useUserStore();

  // 유저 프로필 및 크리에이터 정보 로드
  const loadUserData = useCallback(async (user: User, currentSession: Session | null, force = false) => {
    // 중복 호출 방지
    if (isLoadingUserData.current && !force) {
      console.log('⏳ [SessionProvider] loadUserData already in progress, skipping...');
      return;
    }

    // 같은 유저에 대해 이미 로드했으면 스킵 (force가 아닌 경우)
    if (lastLoadedUserId.current === user.id && !force) {
      console.log('✅ [SessionProvider] User data already loaded for:', user.id);
      return;
    }

    if (!supabase || !user) {
      console.log('⚠️ [SessionProvider] loadUserData early return - no supabase or user');
      return;
    }

    isLoadingUserData.current = true;
    const userId = user.id;
    console.log('🔄 [SessionProvider] loadUserData started for:', userId);
    console.log('🔍 [SessionProvider] Supabase client exists:', !!supabase);

    // OAuth 메타데이터에서 정보 추출 (Kakao, Google 등)
    const oauthNickname = user.user_metadata?.full_name ||
                         user.user_metadata?.name ||
                         user.user_metadata?.user_name ||
                         user.user_metadata?.preferred_username ||
                         user.user_metadata?.nickname;
    let oauthAvatarUrl = user.user_metadata?.avatar_url ||
                          user.user_metadata?.picture ||
                          user.user_metadata?.profile_image;
    // Ensure HTTPS (Kakao uses http://)
    if (oauthAvatarUrl && oauthAvatarUrl.startsWith('http://')) {
      oauthAvatarUrl = oauthAvatarUrl.replace('http://', 'https://');
    }

    // 기본 프로필 먼저 설정 (닉네임은 profiles 테이블에서 로드 후 설정)
    setProfile({
      id: userId,
      email: user.email || '',
      nickname: '', // profiles 테이블 로드 전까지 빈 값
      avatar_url: oauthAvatarUrl,
    });

    try {
      // 세션 토큰을 포함해서 직접 fetch
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      // 전달받은 세션에서 access_token 사용 (getSession 호출 없이)
      const accessToken = currentSession?.access_token || supabaseAnonKey;

      console.log('📡 [SessionProvider] Testing direct fetch to creator_settings...');
      console.log('📡 [SessionProvider] Has access token:', !!currentSession?.access_token);

      // 직접 REST API 호출 (인증 토큰 포함)
      const fetchUrl = `${supabaseUrl}/rest/v1/creator_settings?user_id=eq.${userId}&select=display_name,bio,profile_image_url,is_verified`;

      const fetchResponse = await fetch(fetchUrl, {
        headers: {
          'apikey': supabaseAnonKey || '',
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const fetchData = await fetchResponse.json();
      console.log('📡 [SessionProvider] Direct fetch result:', fetchData);

      // 배열의 첫 번째 항목 또는 null
      const creatorSettings = Array.isArray(fetchData) && fetchData.length > 0 ? fetchData[0] : null;
      const creatorError = fetchResponse.ok ? null : { message: 'Fetch failed', status: fetchResponse.status };

      console.log('📡 [SessionProvider] Query completed:', { creatorSettings, creatorError });

      if (creatorError) {
        console.error('❌ [SessionProvider] Creator settings query error:', creatorError);
      }

      // 크리에이터 설정 동기화
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

      // 프로필도 direct fetch로 조회
      console.log('📡 [SessionProvider] Starting profiles fetch...');
      const profileFetchUrl = `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=id,nickname,username,avatar_url,bio`;

      const profileResponse = await fetch(profileFetchUrl, {
        headers: {
          'apikey': supabaseAnonKey || '',
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const profileData = await profileResponse.json();
      const profile = Array.isArray(profileData) && profileData.length > 0 ? profileData[0] : null;

      console.log('📡 [SessionProvider] Profile fetch completed:', { profile });

      if (profile) {
        const resolvedAvatar = profile.avatar_url || oauthAvatarUrl;
        setProfile({
          id: userId,
          email: user.email || '',
          nickname: profile.nickname || profile.username || oauthNickname || '사용자',
          username: profile.username,
          avatar_url: resolvedAvatar,
          bio: profile.bio,
        });

        // OAuth 프로필 사진이 있고 DB와 다르면 동기화 (유저가 직접 업로드한 supabase 이미지는 유지)
        if (oauthAvatarUrl && profile.avatar_url !== oauthAvatarUrl && !profile.avatar_url?.includes('supabase')) {
          supabase.from('profiles')
            .update({ avatar_url: oauthAvatarUrl })
            .eq('id', userId)
            .then(() => {})
            .catch(() => {});
        }
      }

      lastLoadedUserId.current = userId;
    } catch (error) {
      console.error('❌ [SessionProvider] Failed to load user data:', error);
      // 에러 시에도 크리에이터 상태를 명시적으로 false로 설정
      syncCreatorStatus(false);
    } finally {
      isLoadingUserData.current = false;
      console.log('🏁 [SessionProvider] loadUserData completed for:', userId);
    }
  }, [supabase, setProfile, syncCreatorStatus]);

  // 외부에서 호출 가능한 새로고침 함수
  const refreshUserData = useCallback(async () => {
    if (session?.user) {
      lastLoadedUserId.current = null; // 강제 리로드를 위해 리셋
      await loadUserData(session.user, session, true);
    }
  }, [session, loadUserData]);

  useEffect(() => {
    if (!supabase) return;

    let mounted = true;

    // 서버에서 전달받은 초기 세션이 있으면 사용
    if (initialSession) {
      console.log('🔑 [SessionProvider] Using initial session for:', initialSession.user?.email);
      setSession(initialSession);
      setIsLoading(false);
      // 초기 세션이 있으면 유저 데이터 로드
      if (initialSession.user && mounted) {
        loadUserData(initialSession.user, initialSession);
      }
    } else {
      console.log('⚠️ [SessionProvider] No initial session provided');
    }

    // Auth 상태 변경 구독
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, currentSession: Session | null) => {
        if (!mounted) return;

        console.log('🔐 [SessionProvider] Auth state changed:', event, 'Has session:', !!currentSession);
        setSession(currentSession);
        setIsLoading(false);

        // 로그인 이벤트 시 유저 데이터 로드 (INITIAL_SESSION은 위에서 처리했으므로 SIGNED_IN만)
        if (event === 'SIGNED_IN' && currentSession?.user) {
          // 초기 세션과 다른 유저인 경우에만 로드
          if (currentSession.user.id !== initialSession?.user?.id) {
            console.log('✅ [SessionProvider] New sign in detected, loading user data for:', currentSession.user.email);
            await loadUserData(currentSession.user, currentSession);
          }
        }

        // 토큰 리프레시 시에는 강제 리로드하지 않음 (이미 로드된 데이터 사용)
        if (event === 'TOKEN_REFRESHED' && currentSession?.user) {
          console.log('🔄 [SessionProvider] Token refreshed for:', currentSession.user.email);
        }

        // 로그아웃 시 유저 스토어 클리어
        if (event === 'SIGNED_OUT') {
          console.log('🚪 [SessionProvider] SIGNED_OUT event - clearing user');
          lastLoadedUserId.current = null;
          clearUser();
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
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
