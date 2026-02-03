import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// 쿠키 삭제를 위한 공통 옵션
const getCookieDeleteOptions = () => ({
  expires: new Date(0),
  maxAge: 0,
  path: '/',
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  httpOnly: true,
});

export async function POST() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  // 응답 객체 먼저 생성
  const response = NextResponse.json({ success: true });
  const cookieOptions = getCookieDeleteOptions();

  // sb- 로 시작하는 모든 쿠키 삭제 (signOut 전에 먼저 설정)
  allCookies.forEach((cookie) => {
    if (cookie.name.startsWith('sb-')) {
      console.log('Deleting cookie:', cookie.name);
      response.cookies.set(cookie.name, '', cookieOptions);
    }
  });

  try {
    const supabase = await createClient();

    if (supabase) {
      // 서버에서 signOut 호출
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) {
        console.error('Server signOut error:', error);
      } else {
        console.log('Server signOut successful');
      }
    }

    return response;
  } catch (error) {
    console.error('Logout error:', error);

    // 에러가 나도 쿠키는 이미 삭제 설정됨
    return NextResponse.json(
      { success: false, error: 'Logout failed but cookies cleared' },
      {
        status: 200, // 쿠키는 삭제되었으므로 200 반환
        headers: response.headers,
      }
    );
  }
}
