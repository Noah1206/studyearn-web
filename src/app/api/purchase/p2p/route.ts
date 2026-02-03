import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateOrderNumber } from '@/lib/utils';
import { notify } from '@/lib/notifications';

// Platform fee rate (20%)
const PLATFORM_FEE_RATE = 0.20;

/**
 * POST /api/purchase/p2p
 * Create a purchase record when buyer confirms payment to platform account
 * Flow: buyer pays to platform -> admin confirms -> creator gets 80%
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
    const { contentId, buyerNote } = body;

    if (!contentId) {
      return NextResponse.json(
        { message: '콘텐츠 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // Get content info
    const { data: content, error: contentError } = await supabase
      .from('contents')
      .select('id, title, price, creator_id, is_published')
      .eq('id', contentId)
      .single();

    if (contentError || !content) {
      return NextResponse.json(
        { message: '콘텐츠를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (!content.is_published) {
      return NextResponse.json(
        { message: '구매할 수 없는 콘텐츠입니다.' },
        { status: 400 }
      );
    }

    if (content.creator_id === user.id) {
      return NextResponse.json(
        { message: '자신의 콘텐츠는 구매할 수 없습니다.' },
        { status: 400 }
      );
    }

    // Check if already purchased (completed status)
    const { data: existingPurchase } = await supabase
      .from('content_purchases')
      .select('id, status')
      .eq('content_id', contentId)
      .eq('buyer_id', user.id)
      .eq('status', 'completed')
      .single();

    if (existingPurchase) {
      return NextResponse.json(
        { message: '이미 구매한 콘텐츠입니다.' },
        { status: 400 }
      );
    }

    // Check if there's already a pending purchase
    const { data: pendingPurchase } = await supabase
      .from('content_purchases')
      .select('id, status, order_number, amount')
      .eq('content_id', contentId)
      .eq('buyer_id', user.id)
      .in('status', ['pending_payment', 'pending_confirm'])
      .single();

    if (pendingPurchase) {
      // Update existing pending purchase to pending_confirm
      const { error: updateError } = await supabase
        .from('content_purchases')
        .update({
          status: 'pending_confirm',
          payment_confirmed_at: new Date().toISOString(),
          buyer_note: buyerNote || null,
        })
        .eq('id', pendingPurchase.id);

      if (updateError) {
        console.error('Failed to update purchase:', updateError);
        return NextResponse.json(
          { message: '구매 정보 업데이트에 실패했습니다.' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: '결제 확인 요청이 전송되었습니다.',
        purchaseId: pendingPurchase.id,
        orderNumber: pendingPurchase.order_number,
        amount: pendingPurchase.amount,
      });
    }

    // Calculate platform fee (20%) and creator revenue (80%)
    const platformFee = Math.floor(content.price * PLATFORM_FEE_RATE);
    const creatorRevenue = content.price - platformFee;

    // Generate unique order number for payment tracking
    const orderNumber = generateOrderNumber();

    // Create new purchase record with pending_confirm status
    const { data: newPurchase, error: insertError } = await supabase
      .from('content_purchases')
      .insert({
        content_id: contentId,
        buyer_id: user.id,
        seller_id: content.creator_id,
        amount: content.price,
        status: 'pending_confirm',
        payment_confirmed_at: new Date().toISOString(),
        buyer_note: buyerNote || null,
        creator_revenue: creatorRevenue,
        platform_fee: platformFee,
        order_number: orderNumber,
      })
      .select('id, order_number')
      .single();

    if (insertError) {
      console.error('Failed to create purchase:', insertError);
      return NextResponse.json(
        { message: '구매 요청에 실패했습니다.' },
        { status: 500 }
      );
    }

    // Send notification to creator about new purchase
    const { data: buyerProfile } = await supabase
      .from('profiles')
      .select('nickname')
      .eq('id', user.id)
      .single();
    notify.purchase(content.creator_id, buyerProfile?.nickname || '누군가', content.title, content.price, newPurchase.id).catch(() => {});

    return NextResponse.json({
      success: true,
      message: '결제 확인 요청이 전송되었습니다.',
      purchaseId: newPurchase.id,
      orderNumber: newPurchase.order_number,
      amount: content.price,
    });
  } catch (error) {
    console.error('P2P purchase API error:', error);
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
