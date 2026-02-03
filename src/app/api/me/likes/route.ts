import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

/**
 * GET /api/me/likes
 * Get current user's liked content IDs
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();

    if (!supabase || !admin) {
      return NextResponse.json(
        { message: 'Database connection failed' },
        { status: 500 }
      );
    }

    // getSession으로 빠르게 확인 (미들웨어에서 이미 getUser로 검증됨)
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Admin 클라이언트로 likes 조회 (RLS 우회)
    const { data: likes, error } = await admin
      .from('content_likes')
      .select('content_id')
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Failed to fetch likes:', error);
      return NextResponse.json(
        { message: 'Failed to fetch likes' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      likedIds: likes?.map((l: { content_id: string }) => l.content_id) || [],
    });
  } catch (error) {
    console.error('Likes API error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
