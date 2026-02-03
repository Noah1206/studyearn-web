import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';

/**
 * GET /api/admin/payouts
 * Get list of payout requests for admin
 */
export async function GET(request: NextRequest) {
  const adminError = await requireAdmin();
  if (adminError) return adminError;

  try {
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Get payout requests
    const { data: payouts, error, count } = await supabase
      .from('payout_requests')
      .select('*', { count: 'exact' })
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Failed to fetch payouts:', error);
      return NextResponse.json(
        { message: '정산 목록을 불러오는데 실패했습니다.' },
        { status: 500 }
      );
    }

    // Get creator details
    const enrichedPayouts = await Promise.all(
      (payouts || []).map(async (payout: { creator_id: string; [key: string]: unknown }) => {
        const { data: creator } = await supabase
          .from('profiles')
          .select('nickname, email')
          .eq('id', payout.creator_id)
          .single();

        const { data: creatorSettings } = await supabase
          .from('creator_settings')
          .select('display_name')
          .eq('user_id', payout.creator_id)
          .single();

        return {
          ...payout,
          creator: {
            nickname: creatorSettings?.display_name || creator?.nickname || '알 수 없음',
            email: creator?.email || null,
          },
        };
      })
    );

    return NextResponse.json({
      payouts: enrichedPayouts,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Admin payouts API error:', error);
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
