import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';

/**
 * GET /api/admin/users
 * Get paginated list of users with optional search and user_type filtering
 */
export async function GET(request: NextRequest) {
  const adminError = await requireAdmin();
  if (adminError) return adminError;

  try {
    const supabase = createAdminClient();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const userType = searchParams.get('user_type') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' });

    // Apply search filter on nickname and email
    if (search) {
      query = query.or(
        `nickname.ilike.%${search}%,email.ilike.%${search}%`
      );
    }

    // Apply user_type filter
    if (userType === 'runner' || userType === 'creator') {
      query = query.eq('user_type', userType);
    }

    const { data: users, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Failed to fetch users:', error);
      return NextResponse.json(
        { message: '유저 목록을 불러오는데 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      users: users || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Admin users API error:', error);
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
