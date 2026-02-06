import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';

/**
 * GET /api/admin/creators
 * Get paginated list of creators with search, content count, and subscription stats
 */
export async function GET(request: NextRequest) {
  const adminError = await requireAdmin();
  if (adminError) return adminError;

  try {
    const supabase = createAdminClient();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Query creator_settings with joined profile data
    let query = supabase
      .from('creator_settings')
      .select(
        '*, profiles!creator_settings_user_id_fkey(nickname, email, avatar_url)',
        { count: 'exact' }
      );

    // Apply search filter on display_name
    if (search) {
      query = query.ilike('display_name', `%${search}%`);
    }

    const { data: creators, error, count } = await query
      .order('total_subscribers', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Failed to fetch creators:', error);
      return NextResponse.json(
        { message: '크리에이터 목록을 불러오는데 실패했습니다.' },
        { status: 500 }
      );
    }

    // Enrich each creator with content count and active subscription count
    const enrichedCreators = await Promise.all(
      (creators || []).map(async (creator: { user_id: string; [key: string]: unknown }) => {
        // Get content count for this creator
        const { count: contentCount } = await supabase
          .from('contents')
          .select('id', { count: 'exact', head: true })
          .eq('creator_id', creator.user_id);

        // Get active IAP subscription count for this creator
        const { count: activeSubscriptionCount } = await supabase
          .from('iap_subscriptions')
          .select('id', { count: 'exact', head: true })
          .eq('creator_id', creator.user_id)
          .eq('status', 'active');

        return {
          ...creator,
          content_count: contentCount || 0,
          active_subscription_count: activeSubscriptionCount || 0,
        };
      })
    );

    return NextResponse.json({
      creators: enrichedCreators,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Admin creators API error:', error);
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
