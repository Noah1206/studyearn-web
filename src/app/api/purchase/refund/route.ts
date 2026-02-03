import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { notify } from '@/lib/notifications';

/**
 * POST /api/purchase/refund
 * Request a refund for a completed purchase
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();
    const { purchase_id, reason } = body;

    if (!purchase_id) {
      return NextResponse.json({ message: 'purchase_id가 필요합니다.' }, { status: 400 });
    }

    // Find the completed purchase
    const { data: purchase, error: findError } = await supabase
      .from('content_purchases')
      .select('id, content_id, buyer_id, seller_id, amount, status, creator_revenue, platform_fee, created_at')
      .eq('id', purchase_id)
      .eq('buyer_id', user.id)
      .single();

    if (findError || !purchase) {
      return NextResponse.json({ message: '구매 내역을 찾을 수 없습니다.' }, { status: 404 });
    }

    if (purchase.status !== 'completed') {
      return NextResponse.json({ message: '완료된 구매만 환불할 수 있습니다.' }, { status: 400 });
    }

    // Check refund window (7 days)
    const purchaseDate = new Date(purchase.created_at);
    const now = new Date();
    const daysDiff = (now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24);

    if (daysDiff > 7) {
      return NextResponse.json({ message: '구매 후 7일이 지나 환불이 불가합니다.' }, { status: 400 });
    }

    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json({ message: '서버 오류' }, { status: 500 });
    }

    // Update purchase status to refunded
    const { error: updateError } = await admin
      .from('content_purchases')
      .update({
        status: 'refunded',
        refund_reason: reason || null,
        refunded_at: new Date().toISOString(),
      })
      .eq('id', purchase_id);

    if (updateError) {
      console.error('Refund update error:', updateError);
      return NextResponse.json({ message: '환불 처리에 실패했습니다.' }, { status: 500 });
    }

    // Deduct from creator's pending revenue if not yet paid out
    if (purchase.seller_id && purchase.creator_revenue) {
      const { data: creatorSettings } = await admin
        .from('creator_settings')
        .select('pending_revenue')
        .eq('user_id', purchase.seller_id)
        .single();

      if (creatorSettings) {
        const newPending = Math.max(0, (creatorSettings.pending_revenue || 0) - purchase.creator_revenue);
        await admin
          .from('creator_settings')
          .update({ pending_revenue: newPending })
          .eq('user_id', purchase.seller_id);
      }
    }

    // Get content title for notifications
    const { data: content } = await admin
      .from('contents')
      .select('title')
      .eq('id', purchase.content_id)
      .single();

    const contentTitle = content?.title || '콘텐츠';

    // Notify buyer (refund confirmed)
    notify.refund(user.id, contentTitle, purchase.amount).catch(() => {});

    // Notify seller (refund occurred)
    if (purchase.seller_id) {
      const { data: buyerProfile } = await admin
        .from('profiles')
        .select('nickname')
        .eq('id', user.id)
        .single();

      await notify.purchase(
        purchase.seller_id,
        buyerProfile?.nickname || '구매자',
        `${contentTitle} (환불)`,
        -purchase.amount,
        purchase_id
      ).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      message: '환불이 완료되었습니다.',
      refunded_amount: purchase.amount,
    });
  } catch (error) {
    console.error('Refund API error:', error);
    return NextResponse.json({ message: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
