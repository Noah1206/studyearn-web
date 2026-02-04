import { createAdminClient, createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

interface KakaoTokenResponse {
  token_type: string;
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope?: string;
}

interface KakaoProfile {
  id: number;
  connected_at?: string;
  properties?: {
    nickname?: string;
    profile_image?: string;
    thumbnail_image?: string;
  };
  kakao_account?: {
    profile_nickname_needs_agreement?: boolean;
    profile_image_needs_agreement?: boolean;
    profile?: {
      nickname?: string;
      thumbnail_image_url?: string;
      profile_image_url?: string;
      is_default_image?: boolean;
    };
    email?: string;
    email_needs_agreement?: boolean;
    is_email_valid?: boolean;
    is_email_verified?: boolean;
  };
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(`${origin}/login?error=kakao_auth_error`);
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

  const clientId = process.env.KAKAO_CLIENT_ID!;
  const clientSecret = process.env.KAKAO_CLIENT_SECRET;
  const callbackUrl = `${origin}/api/auth/kakao/callback`;

  // 1. code → access_token 교환
  const tokenUrl = 'https://kauth.kakao.com/oauth/token';
  const tokenParams = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    redirect_uri: callbackUrl,
    code,
  });

  if (clientSecret) {
    tokenParams.set('client_secret', clientSecret);
  }

  const tokenRes = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: tokenParams.toString(),
  });
  const tokenData: KakaoTokenResponse = await tokenRes.json();

  if (!tokenData.access_token) {
    console.error('Kakao token error:', tokenData);
    return NextResponse.redirect(`${origin}/login?error=kakao_token_error`);
  }

  // 2. access_token으로 프로필 조회
  const profileRes = await fetch('https://kapi.kakao.com/v2/user/me', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const profileData: KakaoProfile = await profileRes.json();

  if (!profileData.id) {
    console.error('Kakao profile error:', profileData);
    return NextResponse.redirect(`${origin}/login?error=kakao_profile_error`);
  }

  const kakaoAccount = profileData.kakao_account;
  const email = kakaoAccount?.email;

  // 이메일이 없으면 카카오 ID로 가상 이메일 생성
  const userEmail = email || `kakao_${profileData.id}@kakao.local`;

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
    const nickname = kakaoAccount?.profile?.nickname ||
      profileData.properties?.nickname ||
      `user_${profileData.id}`;
    const avatarUrl = kakaoAccount?.profile?.profile_image_url ||
      profileData.properties?.profile_image ||
      null;

    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email: userEmail,
      email_confirm: true,
      user_metadata: {
        provider: 'kakao',
        kakao_id: profileData.id.toString(),
        name: nickname,
        user_name: nickname,
        avatar_url: avatarUrl,
      },
    });

    if (createError || !newUser.user) {
      console.error('Kakao user creation error:', createError);
      return NextResponse.redirect(`${origin}/login?error=kakao_create_error`);
    }

    userId = newUser.user.id;
  }

  // 4. 매직 링크로 세션 생성
  const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
    type: 'magiclink',
    email: userEmail,
  });

  if (linkError || !linkData) {
    console.error('Kakao magiclink error:', linkError);
    return NextResponse.redirect(`${origin}/login?error=kakao_session_error`);
  }

  // hashed_token을 사용해 OTP 인증으로 세션 생성
  const tokenHash = linkData.properties?.hashed_token;
  if (!tokenHash) {
    return NextResponse.redirect(`${origin}/login?error=kakao_session_error`);
  }

  const { data: sessionData, error: verifyError } = await supabase.auth.verifyOtp({
    type: 'magiclink',
    token_hash: tokenHash,
  });

  if (verifyError) {
    console.error('Kakao verify error:', verifyError);
    // 앱 딥링크인 경우 에러와 함께 리다이렉트
    if (redirectTo.startsWith('exp://') || redirectTo.startsWith('studyearn://')) {
      return NextResponse.redirect(`${redirectTo}?error=kakao_verify_error`);
    }
    return NextResponse.redirect(`${origin}/login?error=kakao_verify_error`);
  }

  // 5. 프로필 생성/업데이트
  try {
    const nickname = kakaoAccount?.profile?.nickname ||
      profileData.properties?.nickname ||
      `user_${userId.slice(0, 8)}`;
    const avatarUrl = kakaoAccount?.profile?.profile_image_url ||
      profileData.properties?.profile_image ||
      null;

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
        email: email || null, // 실제 이메일만 저장
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
    console.error('Kakao profile creation error (non-blocking):', profileError);
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
