import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';

/**
 * GET /api/admin/subscriptions
 * Get list of IAP subscriptions for admin management.
 * Supports filtering by status and platform with pagination.
 */
export async function GET(request: NextRequest) {
  const adminError = await requireAdmin();
  if (adminError) return adminError;

  try {
    const supabase = createAdminClient();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const platform = searchParams.get('platform') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('iap_subscriptions')
      .select('*', { count: 'exact' });

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    if (platform !== 'all') {
      query = query.eq('platform', platform);
    }

    const { data: subscriptions, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Failed to fetch subscriptions:', error);
      return NextResponse.json(
        { message: '구독 목록을 불러오는데 실패했습니다.' },
        { status: 500 }
      );
    }

    // Enrich each subscription with user and creator profile info
    const enrichedSubscriptions = await Promise.all(
      (subscriptions || []).map(async (sub: { user_id: string; creator_id?: string | null; [key: string]: unknown }) => {
        // Get user profile
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('nickname, email')
          .eq('id', sub.user_id)
          .single();

        // Get creator display name if creator_id exists
        let creator: { display_name: string } | null = null;
        if (sub.creator_id) {
          // Try creator_settings first for display_name
          const { data: creatorSettings } = await supabase
            .from('creator_settings')
            .select('display_name')
            .eq('user_id', sub.creator_id)
            .single();

          if (creatorSettings?.display_name) {
            creator = { display_name: creatorSettings.display_name };
          } else {
            // Fallback to profiles nickname
            const { data: creatorProfile } = await supabase
              .from('profiles')
              .select('nickname')
              .eq('id', sub.creator_id)
              .single();

            creator = {
              display_name: creatorProfile?.nickname || '알 수 없음',
            };
          }
        }

        return {
          ...sub,
          user: userProfile || { nickname: '알 수 없음', email: null },
          creator,
        };
      })
    );

    return NextResponse.json({
      subscriptions: enrichedSubscriptions,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Admin subscriptions API error:', error);
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
