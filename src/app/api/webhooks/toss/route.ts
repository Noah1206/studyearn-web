import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyWebhookSignature } from '@/lib/toss/server';

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
  };
}

/**
 * POST /api/webhooks/toss
 * Handle TossPayments webhook events
 * MVP: Only handles purchases table
 */
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

    // Find purchase by order ID
    const supabase = getSupabaseClient();
    const { data: purchase, error: findError } = await supabase
      .from('purchases')
      .select('*')
      .eq('order_id', data.orderId)
      .single();

    if (findError || !purchase) {
      console.error('Purchase not found:', data.orderId);
      // Return 200 to acknowledge receipt
      return NextResponse.json({ received: true });
    }

    switch (eventType) {
      case 'PAYMENT_STATUS_CHANGED':
        await handlePaymentStatusChanged(purchase, data);
        break;

      case 'CARD_CONFIRM':
        // Payment confirmed - update purchase status
        await handlePaymentConfirmed(purchase, data);
        break;

      case 'VIRTUAL_ACCOUNT_DEPOSIT':
        // Virtual account deposit received
        await handlePaymentConfirmed(purchase, data);
        break;

      case 'CANCEL_PAYMENT':
        await handlePaymentCanceled(purchase, data);
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
  purchase: Record<string, unknown>,
  data: TossWebhookPayload['data']
) {
  const statusMap: Record<string, string> = {
    DONE: 'completed',
    CANCELED: 'refunded',
    PARTIAL_CANCELED: 'refunded',
    ABORTED: 'failed',
    EXPIRED: 'failed',
  };

  const newStatus = statusMap[data.status] || data.status.toLowerCase();
  const supabase = getSupabaseClient();

  if (newStatus === 'completed' && purchase.status !== 'completed') {
    await supabase
      .from('purchases')
      .update({
        status: 'completed',
        payment_key: data.paymentKey,
        paid_at: data.approvedAt || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', purchase.id);
  } else if (newStatus === 'refunded') {
    await handlePaymentCanceled(purchase, data);
  } else if (newStatus === 'failed') {
    await supabase
      .from('purchases')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', purchase.id);
  }
}

async function handlePaymentConfirmed(
  purchase: Record<string, unknown>,
  data: TossWebhookPayload['data']
) {
  const supabase = getSupabaseClient();

  await supabase
    .from('purchases')
    .update({
      status: 'completed',
      payment_key: data.paymentKey,
      paid_at: data.approvedAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', purchase.id);
}

async function handlePaymentCanceled(
  purchase: Record<string, unknown>,
  data: TossWebhookPayload['data']
) {
  const supabase = getSupabaseClient();

  await supabase
    .from('purchases')
    .update({
      status: 'refunded',
      updated_at: new Date().toISOString(),
    })
    .eq('id', purchase.id);
}
