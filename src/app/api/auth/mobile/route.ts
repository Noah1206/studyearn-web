// 모바일 앱 전용 OAuth 엔드포인트
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const provider = searchParams.get('provider') as 'kakao' | 'google' | null;
  const redirectTo = searchParams.get('redirectTo') || '/';

  if (!provider || !['kakao', 'google'].includes(provider)) {
    return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
  }

  const supabase = await createClient();

  // 콜백 URL에 앱 딥링크를 포함
  const callbackUrl = `${origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: callbackUrl,
    },
  });

  if (error || !data?.url) {
    // 앱 딥링크인 경우 에러와 함께 리다이렉트
    if (redirectTo.startsWith('exp://') || redirectTo.startsWith('studyearn://')) {
      return NextResponse.redirect(`${redirectTo}?error=${encodeURIComponent(error?.message || 'oauth_init_failed')}`);
    }
    return NextResponse.json({ error: error?.message || 'OAuth failed' }, { status: 500 });
  }

  return NextResponse.redirect(data.url);
}
