import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const redirectTo = searchParams.get('redirectTo') || '/';

  if (code) {
    const supabase = await createClient();
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && sessionData?.user) {
      const user = sessionData.user;

      // OAuth 사용자의 경우 프로필이 없으면 자동 생성 (테이블이 없으면 무시)
      try {
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();

        // OAuth 메타데이터에서 사용자 정보 추출
        const metadata = user.user_metadata || {};
        const nickname = metadata.user_name || metadata.name || metadata.full_name || metadata.preferred_username || `user_${user.id.slice(0, 8)}`;
        let avatarUrl = metadata.avatar_url || metadata.picture || null;
        // Ensure HTTPS (Kakao uses http://)
        if (avatarUrl && avatarUrl.startsWith('http://')) {
          avatarUrl = avatarUrl.replace('http://', 'https://');
        }
        const email = user.email || metadata.email || null;

        if (!existingProfile) {
          // 프로필 생성 시도
          await supabase.from('profiles').insert({
            id: user.id,
            nickname,
            avatar_url: avatarUrl,
            email,
            total_study_minutes: 0,
            streak_days: 0,
            follower_count: 0,
            following_count: 0,
          }).catch(() => {});

          // user_preferences 생성 시도
          await supabase.from('user_preferences').insert({
            user_id: user.id,
            notification_settings: {},
            privacy_settings: {},
            account_settings: {},
          }).catch(() => {});

          // user_streaks 생성 시도
          await supabase.from('user_streaks').insert({
            user_id: user.id,
            current_streak: 0,
            longest_streak: 0,
            total_study_days: 0,
          }).catch(() => {});
        } else {
          // 매 로그인마다 OAuth 프로필 사진과 닉네임을 profiles에 동기화
          const updateData: Record<string, any> = {};
          if (avatarUrl) updateData.avatar_url = avatarUrl;
          if (nickname) updateData.nickname = nickname;

          if (Object.keys(updateData).length > 0) {
            await supabase.from('profiles')
              .update(updateData)
              .eq('id', user.id)
              .catch(() => {});
          }
        }
      } catch (profileError) {
        // 프로필 처리 실패해도 로그인은 진행
        console.error('Profile creation error (non-blocking):', profileError);
      }

      const separator = redirectTo.includes('?') ? '&' : '?';
      return NextResponse.redirect(`${origin}${redirectTo}${separator}login=success`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
