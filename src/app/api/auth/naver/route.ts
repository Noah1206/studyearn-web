import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const redirectTo = searchParams.get('redirectTo') || '/';

  const clientId = process.env.NAVER_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: 'Naver OAuth not configured' }, { status: 500 });
  }

  const state = Buffer.from(JSON.stringify({ redirectTo })).toString('base64url');

  // Production URL 명시 (네이버 개발자 센터에 등록된 URL과 일치해야 함)
  const baseUrl = process.env.NODE_ENV === 'production'
    ? 'https://www.stuple.kr'
    : new URL(request.url).origin;
  const callbackUrl = `${baseUrl}/api/auth/naver/callback`;

  console.log('[Naver OAuth] baseUrl:', baseUrl, 'callbackUrl:', callbackUrl);

  const naverAuthUrl = new URL('https://nid.naver.com/oauth2.0/authorize');
  naverAuthUrl.searchParams.set('response_type', 'code');
  naverAuthUrl.searchParams.set('client_id', clientId);
  naverAuthUrl.searchParams.set('redirect_uri', callbackUrl);
  naverAuthUrl.searchParams.set('state', state);

  return NextResponse.redirect(naverAuthUrl.toString());
}
