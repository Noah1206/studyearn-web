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

        if (!existingProfile) {
          // OAuth 메타데이터에서 사용자 정보 추출
          const metadata = user.user_metadata || {};
          // 카카오: user_name, name 순서로 확인 (Supabase가 카카오 닉네임을 user_name에 매핑)
          const nickname = metadata.user_name || metadata.name || metadata.full_name || metadata.preferred_username || `user_${user.id.slice(0, 8)}`;
          // 카카오: avatar_url 또는 picture 확인
          const avatarUrl = metadata.avatar_url || metadata.picture || null;
          const email = user.email || metadata.email || null;

          // 프로필 생성 시도 (테이블이 없으면 실패해도 무시)
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
        }
      } catch (profileError) {
        // 프로필 처리 실패해도 로그인은 진행
        console.error('Profile creation error (non-blocking):', profileError);
      }

      return NextResponse.redirect(`${origin}${redirectTo}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
