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

      // OAuth 사용자의 경우 프로필이 없으면 자동 생성
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!existingProfile) {
        // OAuth 메타데이터에서 사용자 정보 추출
        const metadata = user.user_metadata || {};
        const nickname = metadata.name || metadata.full_name || metadata.preferred_username || `user_${user.id.slice(0, 8)}`;
        const avatarUrl = metadata.avatar_url || metadata.picture || null;
        const email = user.email || metadata.email || null;

        // 프로필 생성
        await supabase.from('profiles').insert({
          id: user.id,
          nickname,
          avatar_url: avatarUrl,
          email,
          total_study_minutes: 0,
          streak_days: 0,
          follower_count: 0,
          following_count: 0,
        });

        // user_preferences 생성
        await supabase.from('user_preferences').insert({
          user_id: user.id,
          notification_settings: {},
          privacy_settings: {},
          account_settings: {},
        });

        // user_streaks 생성
        await supabase.from('user_streaks').insert({
          user_id: user.id,
          current_streak: 0,
          longest_streak: 0,
          total_study_days: 0,
          weekly_activity: [false, false, false, false, false, false, false],
          monthly_activity: {},
        });
      }

      return NextResponse.redirect(`${origin}${redirectTo}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
