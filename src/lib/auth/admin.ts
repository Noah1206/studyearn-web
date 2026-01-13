import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Get the list of admin emails from environment variable
 * @returns Array of admin email addresses
 */
export function getAdminEmails(): string[] {
  const adminEmails = process.env.ADMIN_EMAILS || '';
  return adminEmails
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0);
}

/**
 * Check if an email is in the admin list
 * @param email - Email to check
 * @returns true if the email is an admin
 */
export function isAdminEmail(email: string): boolean {
  const adminEmails = getAdminEmails();
  return adminEmails.includes(email.toLowerCase());
}

/**
 * Check if the current user is an admin
 * @returns Object with isAdmin status and user info
 */
export async function checkIsAdmin(): Promise<{
  isAdmin: boolean;
  user: { id: string; email: string } | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        isAdmin: false,
        user: null,
        error: '로그인이 필요합니다.',
      };
    }

    if (!user.email) {
      return {
        isAdmin: false,
        user: null,
        error: '이메일 정보가 없습니다.',
      };
    }

    const isAdmin = isAdminEmail(user.email);

    return {
      isAdmin,
      user: { id: user.id, email: user.email },
      error: isAdmin ? null : '관리자 권한이 없습니다.',
    };
  } catch (error) {
    console.error('Admin check error:', error);
    return {
      isAdmin: false,
      user: null,
      error: '권한 확인 중 오류가 발생했습니다.',
    };
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
