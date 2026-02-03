import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateOrderNumber } from '@/lib/utils';

// Platform fee rate (20%)
const PLATFORM_FEE_RATE = 0.20;

/**
 * POST /api/purchase/portone
 * Create a purchase record for PortOne payment
 * Returns paymentId for client to use with PortOne SDK
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

    // Check for existing pending_payment purchase (can reuse)
    const { data: pendingPurchase } = await supabase
      .from('content_purchases')
      .select('id, order_number, amount, payment_id')
      .eq('content_id', contentId)
      .eq('buyer_id', user.id)
      .eq('status', 'pending_payment')
      .single();

    if (pendingPurchase) {
      // Reuse existing pending purchase - generate new payment_id (max 40 chars for KG Inicis)
      const newPaymentId = `pay_${crypto.randomUUID().replace(/-/g, '')}`;

      const { error: updateError } = await supabase
        .from('content_purchases')
        .update({
          payment_id: newPaymentId,
        })
        .eq('id', pendingPurchase.id);

      if (updateError) {
        console.error('Failed to update payment_id:', updateError);
      }

      return NextResponse.json({
        success: true,
        purchaseId: pendingPurchase.id,
        paymentId: newPaymentId,
        orderNumber: pendingPurchase.order_number,
        orderName: content.title,
        amount: pendingPurchase.amount,
      });
    }

    // Calculate platform fee (20%) and creator revenue (80%)
    const platformFee = Math.floor(content.price * PLATFORM_FEE_RATE);
    const creatorRevenue = content.price - platformFee;

    // Generate unique order number and payment ID (max 40 chars for KG Inicis)
    const orderNumber = generateOrderNumber();
    const paymentId = `pay_${crypto.randomUUID().replace(/-/g, '')}`;

    // Create new purchase record with pending_payment status
    const { data: newPurchase, error: insertError } = await supabase
      .from('content_purchases')
      .insert({
        content_id: contentId,
        buyer_id: user.id,
        seller_id: content.creator_id,
        amount: content.price,
        status: 'pending_payment',
        payment_id: paymentId,
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

    return NextResponse.json({
      success: true,
      purchaseId: newPurchase.id,
      paymentId: paymentId,
      orderNumber: newPurchase.order_number,
      orderName: content.title,
      amount: content.price,
    });
  } catch (error) {
    console.error('PortOne purchase API error:', error);
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
