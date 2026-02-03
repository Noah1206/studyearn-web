import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { notify } from '@/lib/notifications';

/**
 * POST /api/purchase/reject
 * Reject a pending P2P purchase (creator did not receive payment)
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
    const { purchaseId, reason } = body;

    if (!purchaseId) {
      return NextResponse.json(
        { message: '구매 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // Get purchase info
    const { data: purchase, error: purchaseError } = await supabase
      .from('content_purchases')
      .select('id, seller_id, status, content_id, buyer_id')
      .eq('id', purchaseId)
      .single();

    if (purchaseError || !purchase) {
      return NextResponse.json(
        { message: '구매 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // Check if user is the seller
    if (purchase.seller_id !== user.id) {
      return NextResponse.json(
        { message: '권한이 없습니다.' },
        { status: 403 }
      );
    }

    // Check if purchase is in pending status
    if (purchase.status !== 'pending_confirm' && purchase.status !== 'pending_payment') {
      return NextResponse.json(
        { message: '이미 처리된 구매입니다.' },
        { status: 400 }
      );
    }

    // Update purchase status to rejected
    const { error: updateError } = await supabase
      .from('content_purchases')
      .update({
        status: 'rejected',
        rejection_reason: reason || '입금 확인 불가',
        seller_confirmed_at: new Date().toISOString(),
      })
      .eq('id', purchaseId);

    if (updateError) {
      console.error('Failed to reject purchase:', updateError);
      return NextResponse.json(
        { message: '거절 처리에 실패했습니다.' },
        { status: 500 }
      );
    }

    // Send notification to buyer about purchase rejection
    const { data: contentData } = await supabase.from('contents').select('title').eq('id', purchase.content_id).single();
    notify.purchaseRejected(purchase.buyer_id, contentData?.title || '콘텐츠', purchase.content_id).catch(() => {});

    return NextResponse.json({
      success: true,
      message: '구매가 거절되었습니다.',
    });
  } catch (error) {
    console.error('Reject purchase API error:', error);
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
