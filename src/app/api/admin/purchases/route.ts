import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';

/**
 * GET /api/admin/purchases
 * Get list of purchases for admin (pending confirmation)
 */
export async function GET(request: NextRequest) {
  // Check admin permission (environment variable based)
  const adminError = await requireAdmin();
  if (adminError) return adminError;

  try {
    const supabase = createAdminClient();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending_confirm';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Get purchases with content and buyer info
    let query = supabase
      .from('content_purchases')
      .select(`
        id,
        content_id,
        buyer_id,
        seller_id,
        amount,
        status,
        order_number,
        buyer_note,
        payment_confirmed_at,
        platform_confirmed_at,
        platform_confirmed_by,
        creator_revenue,
        platform_fee,
        created_at
      `, { count: 'exact' });

    if (status === 'pending') {
      query = query.in('status', ['pending_payment', 'pending_confirm']);
    } else {
      query = query.eq('status', status);
    }

    const { data: purchases, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Failed to fetch purchases:', error);
      return NextResponse.json(
        { message: '구매 목록을 불러오는데 실패했습니다.' },
        { status: 500 }
      );
    }

    // Get content and user details
    const enrichedPurchases = await Promise.all(
      (purchases || []).map(async (purchase: { content_id: string; buyer_id: string; seller_id: string; [key: string]: unknown }) => {
        // Get content info
        const { data: content } = await supabase
          .from('contents')
          .select('title, thumbnail_url')
          .eq('id', purchase.content_id)
          .single();

        // Get buyer info
        const { data: buyer } = await supabase
          .from('profiles')
          .select('nickname, email')
          .eq('id', purchase.buyer_id)
          .single();

        // Get seller info
        const { data: seller } = await supabase
          .from('profiles')
          .select('nickname, email')
          .eq('id', purchase.seller_id)
          .single();

        return {
          ...purchase,
          content: content || { title: '삭제된 콘텐츠', thumbnail_url: null },
          buyer: buyer || { nickname: '알 수 없음', email: null },
          seller: seller || { nickname: '알 수 없음', email: null },
        };
      })
    );

    return NextResponse.json({
      purchases: enrichedPurchases,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Admin purchases API error:', error);
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
