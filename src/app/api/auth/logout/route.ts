import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const supabase = await createClient();

    if (supabase) {
      // 서버에서 signOut 호출
      await supabase.auth.signOut({ scope: 'global' });
    }

    // 모든 Supabase 관련 쿠키 삭제
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();

    const response = NextResponse.json({ success: true });

    // sb- 로 시작하는 모든 쿠키 삭제
    allCookies.forEach((cookie) => {
      if (cookie.name.startsWith('sb-')) {
        response.cookies.set(cookie.name, '', {
          expires: new Date(0),
          path: '/',
        });
      }
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);

    // 에러가 나도 쿠키는 삭제 시도
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();

    const response = NextResponse.json({ success: false, error: 'Logout failed' }, { status: 500 });

    allCookies.forEach((cookie) => {
      if (cookie.name.startsWith('sb-')) {
        response.cookies.set(cookie.name, '', {
          expires: new Date(0),
          path: '/',
        });
      }
    });

    return response;
  }
}
