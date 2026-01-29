import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const ADMIN_SESSION_TOKEN = 'studyearn-admin-session-2025';

/**
 * Check if the current request has a valid admin session
 */
export async function checkIsAdmin(): Promise<{
  isAdmin: boolean;
  error: string | null;
}> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session');

    if (session?.value === ADMIN_SESSION_TOKEN) {
      return { isAdmin: true, error: null };
    }

    return { isAdmin: false, error: '관리자 권한이 없습니다.' };
  } catch (error) {
    console.error('Admin check error:', error);
    return { isAdmin: false, error: '권한 확인 중 오류가 발생했습니다.' };
  }
}

/**
 * Middleware helper for admin-only API routes
 * Returns error response if not admin, null if admin
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  const { isAdmin, error } = await checkIsAdmin();

  if (!isAdmin) {
    return NextResponse.json(
      { message: error || '관리자 권한이 없습니다.' },
      { status: 403 }
    );
  }

  return null;
}
