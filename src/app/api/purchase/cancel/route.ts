import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/purchase/cancel
 * Cancel a pending purchase
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { message: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { contentId } = body;

    if (!contentId) {
      return NextResponse.json(
        { message: 'contentId가 필요합니다.' },
        { status: 400 }
      );
    }

    // Find pending purchase
    const { data: pendingPurchase, error: findError } = await supabase
      .from('content_purchases')
      .select('id, status')
      .eq('content_id', contentId)
      .eq('buyer_id', user.id)
      .in('status', ['pending_payment', 'pending_confirm'])
      .maybeSingle();

    if (findError) {
      console.error('Failed to find pending purchase:', findError);
      return NextResponse.json(
        { message: '구매 정보 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    if (!pendingPurchase) {
      return NextResponse.json(
        { message: '대기 중인 구매가 없습니다.' },
        { status: 404 }
      );
    }

    // Update status to cancelled
    const { error: updateError } = await supabase
      .from('content_purchases')
      .update({ status: 'cancelled' })
      .eq('id', pendingPurchase.id);

    if (updateError) {
      console.error('Failed to cancel purchase:', updateError);
      return NextResponse.json(
        { message: '구매 취소에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '구매가 취소되었습니다.',
    });
  } catch (error) {
    console.error('Cancel purchase API error:', error);
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
