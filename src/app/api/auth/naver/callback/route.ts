import { createAdminClient, createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

interface NaverProfile {
  resultcode: string;
  message: string;
  response: {
    id: string;
    nickname?: string;
    name?: string;
    email?: string;
    profile_image?: string;
  };
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(`${origin}/login?error=naver_auth_error`);
  }

  // state에서 redirectTo 추출
  let redirectTo = '/';
  if (state) {
    try {
      const parsed = JSON.parse(Buffer.from(state, 'base64url').toString());
      redirectTo = parsed.redirectTo || '/';
    } catch {
      // ignore
    }
  }

  const clientId = process.env.NAVER_CLIENT_ID!;
  const clientSecret = process.env.NAVER_CLIENT_SECRET!;

  // 1. code → access_token 교환
  const tokenUrl = new URL('https://nid.naver.com/oauth2.0/token');
  tokenUrl.searchParams.set('grant_type', 'authorization_code');
  tokenUrl.searchParams.set('client_id', clientId);
  tokenUrl.searchParams.set('client_secret', clientSecret);
  tokenUrl.searchParams.set('code', code);
  tokenUrl.searchParams.set('state', state || '');

  const tokenRes = await fetch(tokenUrl.toString());
  const tokenData = await tokenRes.json();

  if (!tokenData.access_token) {
    return NextResponse.redirect(`${origin}/login?error=naver_token_error`);
  }

  // 2. access_token으로 프로필 조회
  const profileRes = await fetch('https://openapi.naver.com/v1/nid/me', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const profileData: NaverProfile = await profileRes.json();

  if (profileData.resultcode !== '00') {
    return NextResponse.redirect(`${origin}/login?error=naver_profile_error`);
  }

  const naverUser = profileData.response;
  const email = naverUser.email;

  // 이메일이 없으면 네이버 ID로 가상 이메일 생성 (카카오와 동일한 방식)
  const userEmail = email || `naver_${naverUser.id}@naver.local`;

  // 3. Supabase에서 사용자 찾기 또는 생성
  const adminClient = createAdminClient();
  const supabase = await createClient();

  // 이메일로 기존 사용자 검색
  const { data: existingUsers } = await adminClient.auth.admin.listUsers();
  const existingUser = existingUsers?.users?.find((u: { email?: string }) => u.email === userEmail);

  let userId: string;

  if (existingUser) {
    userId = existingUser.id;
  } else {
    // 새 사용자 생성
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email: userEmail,
      email_confirm: true,
      user_metadata: {
        provider: 'naver',
        naver_id: naverUser.id,
        name: naverUser.name,
        user_name: naverUser.nickname,
        avatar_url: naverUser.profile_image,
      },
    });

    if (createError || !newUser.user) {
      return NextResponse.redirect(`${origin}/login?error=naver_create_error`);
    }

    userId = newUser.user.id;
  }

  // 4. 매직 링크 대신 admin으로 세션 생성
  // generateLink로 magiclink를 생성하고 그 token으로 verifyOtp
  const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
    type: 'magiclink',
    email: userEmail,
  });

  if (linkError || !linkData) {
    return NextResponse.redirect(`${origin}/login?error=naver_session_error`);
  }

  // hashed_token을 사용해 OTP 인증으로 세션 생성
  const tokenHash = linkData.properties?.hashed_token;
  if (!tokenHash) {
    return NextResponse.redirect(`${origin}/login?error=naver_session_error`);
  }

  const { data: sessionData, error: verifyError } = await supabase.auth.verifyOtp({
    type: 'magiclink',
    token_hash: tokenHash,
  });

  if (verifyError) {
    // 앱 딥링크인 경우 에러와 함께 리다이렉트
    if (redirectTo.startsWith('exp://') || redirectTo.startsWith('studyearn://')) {
      return NextResponse.redirect(`${redirectTo}?error=naver_verify_error`);
    }
    return NextResponse.redirect(`${origin}/login?error=naver_verify_error`);
  }

  // 5. 프로필 생성/업데이트 (기존 callback 패턴과 동일)
  try {
    const nickname = naverUser.nickname || naverUser.name || `user_${userId.slice(0, 8)}`;
    const avatarUrl = naverUser.profile_image || null;

    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (!existingProfile) {
      await supabase.from('profiles').insert({
        id: userId,
        nickname,
        avatar_url: avatarUrl,
        email: email || null, // 실제 이메일만 저장 (가상 이메일은 저장하지 않음)
        total_study_minutes: 0,
        streak_days: 0,
        follower_count: 0,
        following_count: 0,
      });

      await supabase.from('user_preferences').insert({
        user_id: userId,
        notification_settings: {},
        privacy_settings: {},
        account_settings: {},
      });

      await supabase.from('user_streaks').insert({
        user_id: userId,
        current_streak: 0,
        longest_streak: 0,
        total_study_days: 0,
      });
    } else if (avatarUrl) {
      await supabase.from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', userId);
    }
  } catch (profileError) {
    console.error('Naver profile creation error (non-blocking):', profileError);
  }

  // 앱 딥링크인 경우 토큰과 함께 리다이렉트
  if (redirectTo.startsWith('exp://') || redirectTo.startsWith('studyearn://')) {
    const session = sessionData?.session;
    if (session) {
      const separator = redirectTo.includes('?') ? '&' : '?';
      return NextResponse.redirect(
        `${redirectTo}${separator}access_token=${session.access_token}&refresh_token=${session.refresh_token}`
      );
    }
    return NextResponse.redirect(`${redirectTo}?login=success`);
  }

  const separator = redirectTo.includes('?') ? '&' : '?';
  return NextResponse.redirect(`${origin}${redirectTo}${separator}login=success`);
}
