import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { confirmPayment, TossPaymentError } from '@/lib/toss/server';

const PLATFORM_FEE_RATE = 0.1; // 10% platform fee

interface ConfirmPaymentRequest {
  paymentKey: string;
  orderId: string;
  amount: number;
  type?: 'subscription' | 'content';
  contentId?: string;
  creatorId?: string;
  tierId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ConfirmPaymentRequest = await request.json();
    const { paymentKey, orderId, amount, type, contentId, creatorId, tierId } = body;

    // Validate required fields
    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json(
        { message: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { message: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // Verify payment exists and belongs to user
    const { data: payment, error: paymentError } = await (supabase
      .from('payments') as any)
      .select('*')
      .eq('merchant_uid', orderId)
      .eq('user_id', user.id)
      .single();

    if (paymentError || !payment) {
      return NextResponse.json(
        { message: '결제 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // Check if already processed
    if (payment.status === 'completed') {
      return NextResponse.json(
        { message: '이미 처리된 결제입니다.' },
        { status: 400 }
      );
    }

    // Verify amount matches
    if (payment.amount !== amount) {
      return NextResponse.json(
        { message: '결제 금액이 일치하지 않습니다.' },
        { status: 400 }
      );
    }

    // Confirm payment with TossPayments
    let tossResponse;
    try {
      tossResponse = await confirmPayment(paymentKey, orderId, amount);
    } catch (err) {
      if (err instanceof TossPaymentError) {
        // Update payment status to failed
        await (supabase
          .from('payments') as any)
          .update({
            status: 'failed',
            error_message: err.message,
            updated_at: new Date().toISOString(),
          })
          .eq('id', payment.id);

        return NextResponse.json(
          { message: err.message, code: err.code },
          { status: 400 }
        );
      }
      throw err;
    }

    // Calculate platform fee and creator revenue
    const platformFee = Math.floor(amount * PLATFORM_FEE_RATE);
    const creatorRevenue = amount - platformFee;

    // Update payment record
    const { error: updateError } = await (supabase
      .from('payments') as any)
      .update({
        status: 'completed',
        payment_key: paymentKey,
        paid_at: tossResponse.approvedAt,
        receipt_url: tossResponse.receipt?.url,
        platform_fee: platformFee,
        creator_revenue: creatorRevenue,
        card_company: tossResponse.card?.company,
        card_number: tossResponse.card?.number,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.id);

    if (updateError) {
      console.error('Failed to update payment:', updateError);
      // Payment was successful at TossPayments, so we should still return success
      // but log this for manual reconciliation
    }

    // Process based on payment type
    if (payment.payment_type === 'one_time' && payment.content_id) {
      // Create content purchase record
      const { error: purchaseError } = await (supabase
        .from('content_purchases') as any)
        .insert({
          content_id: payment.content_id,
          buyer_id: user.id,
          amount: amount,
          platform_fee: platformFee,
          creator_revenue: creatorRevenue,
          payment_method: tossResponse.method || 'CARD',
          payment_id: payment.id,
          status: 'completed',
        });

      if (purchaseError) {
        console.error('Failed to create content purchase:', purchaseError);
      }

      // Update content purchase count
      await (supabase as any).rpc('increment_content_purchase_count', {
        content_id: payment.content_id,
      });

      // Update creator revenue stats
      if (payment.creator_id) {
        await updateCreatorRevenue(supabase, payment.creator_id, creatorRevenue);
      }
    } else if (payment.payment_type === 'subscription' && payment.creator_id) {
      // Get tier info
      const { data: tierData } = await (supabase
        .from('subscription_tiers') as any)
        .select('*')
        .eq('id', payment.tier_id)
        .single();

      // Create or update subscription
      const { error: subError } = await (supabase
        .from('creator_subscriptions') as any)
        .upsert({
          subscriber_id: user.id,
          creator_id: payment.creator_id,
          tier_id: payment.tier_id,
          status: 'active',
          started_at: new Date().toISOString(),
          current_period_start: new Date().toISOString(),
          current_period_end: getNextBillingDate().toISOString(),
        }, {
          onConflict: 'subscriber_id,creator_id',
        });

      if (subError) {
        console.error('Failed to create subscription:', subError);
      }

      // Update tier subscriber count
      if (payment.tier_id) {
        await (supabase as any).rpc('increment_tier_subscriber_count', {
          tier_id: payment.tier_id,
        });
      }

      // Update creator stats
      await (supabase as any).rpc('increment_creator_subscriber_count', {
        creator_id: payment.creator_id,
      });

      // Update creator revenue stats
      await updateCreatorRevenue(supabase, payment.creator_id, creatorRevenue);
    }

    return NextResponse.json({
      success: true,
      orderName: tossResponse.orderName,
      method: tossResponse.method,
      approvedAt: tossResponse.approvedAt,
      receiptUrl: tossResponse.receipt?.url,
    });
  } catch (error) {
    console.error('Payment confirmation error:', error);
    return NextResponse.json(
      { message: '결제 확인 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

function getNextBillingDate(): Date {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
  return nextMonth;
}

async function updateCreatorRevenue(
  supabase: Awaited<ReturnType<typeof createClient>>,
  creatorId: string,
  amount: number
) {
  const today = new Date();
  const yearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

  // Upsert revenue stats
  const { error } = await (supabase
    .from('creator_revenue_stats') as any)
    .upsert({
      creator_id: creatorId,
      year_month: yearMonth,
      total_revenue: amount,
      subscription_revenue: 0,
      content_revenue: amount,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'creator_id,year_month',
    });

  if (error) {
    console.error('Failed to update revenue stats:', error);
  }
}
