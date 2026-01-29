import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

interface CookieToSet {
  name: string;
  value: string;
  options?: Record<string, unknown>;
}

/**
 * Middleware helper to handle Supabase auth session refresh
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Protected routes - require authentication
  const protectedPaths = ['/dashboard', '/my', '/subscribe', '/purchase', '/profile', '/settings'];
  const authPaths = ['/login', '/signup'];

  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );
  const isAuthPath = authPaths.includes(request.nextUrl.pathname);

  // Admin route protection (cookie-based, separate from Supabase auth)
  const isAdminPath = request.nextUrl.pathname.startsWith('/admin') && !request.nextUrl.pathname.startsWith('/admin/login');
  if (isAdminPath) {
    const adminSession = request.cookies.get('admin_session');
    if (adminSession?.value !== 'studyearn-admin-session-2025') {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // 보호된 경로나 인증 페이지가 아니면 빠르게 통과
  if (!isProtectedPath && !isAuthPath) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }: CookieToSet) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }: CookieToSet) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser()는 서버에서 세션을 검증하고 필요시 리프레시함
  // getSession()은 쿠키만 읽어서 빠르지만 만료된 세션을 감지 못할 수 있음
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (isProtectedPath && (!user || error)) {
    // Redirect to login with return URL
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirectTo', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthPath && user && !error) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
