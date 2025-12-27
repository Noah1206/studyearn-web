import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyWebhookSignature, getPayment } from '@/lib/toss/server';

const PLATFORM_FEE_RATE = 0.1;

// Lazy initialization of Supabase client (avoid module-level env access during build)
function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface TossWebhookPayload {
  eventType: string;
  createdAt: string;
  data: {
    paymentKey: string;
    orderId: string;
    status: string;
    totalAmount: number;
    method?: string;
    approvedAt?: string;
    canceledAt?: string;
    cancels?: Array<{
      cancelAmount: number;
      cancelReason: string;
      canceledAt: string;
    }>;
    receipt?: {
      url: string;
    };
    card?: {
      company: string;
      number: string;
    };
  };
}

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get('toss-signature') || '';

    // Verify webhook signature
    const webhookSecretKey = process.env.TOSS_WEBHOOK_SECRET_KEY;
    if (webhookSecretKey && signature) {
      const isValid = verifyWebhookSignature(rawBody, signature, webhookSecretKey);
      if (!isValid) {
        console.error('Invalid webhook signature');
        return NextResponse.json(
          { message: 'Invalid signature' },
          { status: 401 }
        );
      }
    }

    const payload: TossWebhookPayload = JSON.parse(rawBody);
    const { eventType, data } = payload;

    console.log(`Received webhook: ${eventType}`, data.orderId);

    // Find payment by order ID
    const supabase = getSupabaseClient();
    const { data: payment, error: findError } = await (supabase
      .from('payments') as any)
      .select('*')
      .eq('merchant_uid', data.orderId)
      .single();

    if (findError || !payment) {
      console.error('Payment not found:', data.orderId);
      // Return 200 to acknowledge receipt
      return NextResponse.json({ received: true });
    }

    switch (eventType) {
      case 'PAYMENT_STATUS_CHANGED':
        await handlePaymentStatusChanged(payment, data);
        break;

      case 'BILLING_STATUS_CHANGED':
        await handleBillingStatusChanged(payment, data);
        break;

      case 'CARD_CONFIRM':
        // Payment confirmed - already handled in /api/payments/confirm
        break;

      case 'VIRTUAL_ACCOUNT_DEPOSIT':
        await handleVirtualAccountDeposit(payment, data);
        break;

      case 'CANCEL_PAYMENT':
        await handlePaymentCanceled(payment, data);
        break;

      default:
        console.log(`Unhandled webhook event: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    // Return 200 to prevent retries for invalid payloads
    return NextResponse.json({ received: true });
  }
}

async function handlePaymentStatusChanged(
  payment: Record<string, unknown>,
  data: TossWebhookPayload['data']
) {
  const statusMap: Record<string, string> = {
    DONE: 'completed',
    CANCELED: 'cancelled',
    PARTIAL_CANCELED: 'partially_cancelled',
    ABORTED: 'failed',
    EXPIRED: 'expired',
  };

  const newStatus = statusMap[data.status] || data.status.toLowerCase();

  if (newStatus === 'completed' && payment.status !== 'completed') {
    // Payment completed - process the order
    const amount = data.totalAmount;
    const platformFee = Math.floor(amount * PLATFORM_FEE_RATE);
    const creatorRevenue = amount - platformFee;

    const supabase = getSupabaseClient();
    await (supabase
      .from('payments') as any)
      .update({
        status: 'completed',
        payment_key: data.paymentKey,
        paid_at: data.approvedAt,
        receipt_url: data.receipt?.url,
        platform_fee: platformFee,
        creator_revenue: creatorRevenue,
        card_company: data.card?.company,
        card_number: data.card?.number,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.id);

    // Create content purchase if applicable
    if (payment.payment_type === 'one_time' && payment.content_id) {
      await (supabase
        .from('content_purchases') as any)
        .upsert({
          content_id: payment.content_id as string,
          buyer_id: payment.user_id as string,
          amount: amount,
          platform_fee: platformFee,
          creator_revenue: creatorRevenue,
          payment_method: data.method || 'CARD',
          payment_id: payment.id as string,
          status: 'completed',
        }, {
          onConflict: 'content_id,buyer_id',
        });
    }

    // Create subscription if applicable
    if (payment.payment_type === 'subscription' && payment.creator_id) {
      const nextBillingDate = new Date();
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

      await (supabase
        .from('creator_subscriptions') as any)
        .upsert({
          subscriber_id: payment.user_id as string,
          creator_id: payment.creator_id as string,
          tier_id: payment.tier_id as string,
          status: 'active',
          started_at: new Date().toISOString(),
          current_period_start: new Date().toISOString(),
          current_period_end: nextBillingDate.toISOString(),
        }, {
          onConflict: 'subscriber_id,creator_id',
        });
    }
  } else if (newStatus === 'cancelled' || newStatus === 'partially_cancelled') {
    // Handle cancellation
    await handlePaymentCanceled(payment, data);
  } else {
    // Update status only
    const supabase = getSupabaseClient();
    await (supabase
      .from('payments') as any)
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.id);
  }
}

async function handleBillingStatusChanged(
  payment: Record<string, unknown>,
  data: TossWebhookPayload['data']
) {
  // Handle recurring billing status changes
  const supabase = getSupabaseClient();
  if (data.status === 'DONE') {
    // Renewal successful
    const amount = data.totalAmount;
    const platformFee = Math.floor(amount * PLATFORM_FEE_RATE);

    // Update payment
    await (supabase
      .from('payments') as any)
      .update({
        status: 'completed',
        paid_at: data.approvedAt,
        platform_fee: platformFee,
        creator_revenue: amount - platformFee,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.id);

    // Extend subscription period
    if (payment.creator_id && payment.user_id) {
      const nextPeriodEnd = new Date();
      nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + 1);

      await (supabase
        .from('creator_subscriptions') as any)
        .update({
          current_period_start: new Date().toISOString(),
          current_period_end: nextPeriodEnd.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('subscriber_id', payment.user_id)
        .eq('creator_id', payment.creator_id);
    }
  } else if (data.status === 'FAILED' || data.status === 'EXPIRED') {
    // Renewal failed - mark subscription as past_due
    if (payment.creator_id && payment.user_id) {
      await (supabase
        .from('creator_subscriptions') as any)
        .update({
          status: 'past_due',
          updated_at: new Date().toISOString(),
        })
        .eq('subscriber_id', payment.user_id)
        .eq('creator_id', payment.creator_id);
    }
  }
}

async function handleVirtualAccountDeposit(
  payment: Record<string, unknown>,
  data: TossWebhookPayload['data']
) {
  // Virtual account deposit received
  const amount = data.totalAmount;
  const platformFee = Math.floor(amount * PLATFORM_FEE_RATE);
  const creatorRevenue = amount - platformFee;

  const supabase = getSupabaseClient();
  await (supabase
    .from('payments') as any)
    .update({
      status: 'completed',
      payment_key: data.paymentKey,
      paid_at: data.approvedAt || new Date().toISOString(),
      platform_fee: platformFee,
      creator_revenue: creatorRevenue,
      updated_at: new Date().toISOString(),
    })
    .eq('id', payment.id);

  // Process the order
  if (payment.payment_type === 'one_time' && payment.content_id) {
    await (supabase
      .from('content_purchases') as any)
      .insert({
        content_id: payment.content_id as string,
        buyer_id: payment.user_id as string,
        amount: amount,
        platform_fee: platformFee,
        creator_revenue: creatorRevenue,
        payment_method: 'VIRTUAL_ACCOUNT',
        payment_id: payment.id as string,
        status: 'completed',
      });
  }
}

async function handlePaymentCanceled(
  payment: Record<string, unknown>,
  data: TossWebhookPayload['data']
) {
  const cancelInfo = data.cancels?.[0];
  const cancelAmount = cancelInfo?.cancelAmount || data.totalAmount;
  const isFull = cancelAmount >= (payment.amount as number);

  // Update payment status
  const supabase = getSupabaseClient();
  await (supabase
    .from('payments') as any)
    .update({
      status: isFull ? 'cancelled' : 'partially_cancelled',
      cancelled_at: cancelInfo?.canceledAt || data.canceledAt,
      cancel_reason: cancelInfo?.cancelReason,
      refund_amount: cancelAmount,
      updated_at: new Date().toISOString(),
    })
    .eq('id', payment.id);

  // Update related records
  if (payment.payment_type === 'one_time' && payment.content_id && isFull) {
    await (supabase
      .from('content_purchases') as any)
      .update({
        status: 'refunded',
        refunded_at: new Date().toISOString(),
      })
      .eq('payment_id', payment.id);
  }

  if (payment.payment_type === 'subscription' && payment.creator_id && isFull) {
    await (supabase
      .from('creator_subscriptions') as any)
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
      })
      .eq('subscriber_id', payment.user_id)
      .eq('creator_id', payment.creator_id);

    // Decrement subscriber count
    if (payment.creator_id) {
      await (supabase as any).rpc('decrement_creator_subscriber_count', {
        creator_id: payment.creator_id as string,
      });
    }
  }
}
