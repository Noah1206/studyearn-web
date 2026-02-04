import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const redirectTo = searchParams.get('redirectTo') || '/';

  const clientId = process.env.KAKAO_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: 'Kakao OAuth not configured' }, { status: 500 });
  }

  const state = Buffer.from(JSON.stringify({ redirectTo })).toString('base64url');
  const callbackUrl = `${new URL(request.url).origin}/api/auth/kakao/callback`;

  const kakaoAuthUrl = new URL('https://kauth.kakao.com/oauth/authorize');
  kakaoAuthUrl.searchParams.set('response_type', 'code');
  kakaoAuthUrl.searchParams.set('client_id', clientId);
  kakaoAuthUrl.searchParams.set('redirect_uri', callbackUrl);
  kakaoAuthUrl.searchParams.set('state', state);

  return NextResponse.redirect(kakaoAuthUrl.toString());
}
