import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  getPayment,
  type PortOnePayment,
} from '@/lib/portone/server';

// Lazy initialization of Supabase client
function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface PortOneWebhookBody {
  type: string;
  timestamp: string;
  data: {
    paymentId: string;
    transactionId?: string;
    storeId: string;
  };
}

/**
 * POST /api/webhooks/portone
 * Handle PortOne V2 webhook events for content_purchases
 */
export async function POST(request: NextRequest) {
  try {
    const body: PortOneWebhookBody = await request.json();
    const { type, data } = body;
    const { paymentId } = data;

    console.log(`[PortOne Webhook] Received: ${type}, paymentId: ${paymentId}`);

    // Get payment details from PortOne API
    let payment: PortOnePayment;
    try {
      payment = await getPayment(paymentId);
    } catch (error) {
      console.error('[PortOne Webhook] Failed to get payment:', error);
      return NextResponse.json({ received: true });
    }

    // Find purchase by payment_id in content_purchases
    const supabase = getSupabaseClient();
    const { data: purchase, error: findError } = await supabase
      .from('content_purchases')
      .select('*')
      .eq('payment_id', paymentId)
      .single();

    if (findError || !purchase) {
      console.error('[PortOne Webhook] Purchase not found for paymentId:', paymentId);
      // Return 200 to acknowledge receipt
      return NextResponse.json({ received: true });
    }

    // Handle different webhook types
    switch (type) {
      case 'Transaction.Paid':
        // 결제 완료 (카드 결제 또는 가상계좌 입금 완료)
        await handlePaymentPaid(purchase, payment);
        break;

      case 'Transaction.VirtualAccountIssued':
        // 가상계좌 발급됨
        await handleVirtualAccountIssued(purchase, payment);
        break;

      case 'Transaction.Cancelled':
        // 결제 취소됨
        await handlePaymentCancelled(purchase);
        break;

      case 'Transaction.Failed':
        // 결제 실패
        await handlePaymentFailed(purchase);
        break;

      default:
        console.log(`[PortOne Webhook] Unhandled event type: ${type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[PortOne Webhook] Processing error:', error);
    // Return 200 to prevent retries for invalid payloads
    return NextResponse.json({ received: true });
  }
}

/**
 * 결제 완료 처리
 */
async function handlePaymentPaid(
  purchase: Record<string, unknown>,
  payment: PortOnePayment
) {
  const supabase = getSupabaseClient();

  console.log('[PortOne Webhook] Payment paid:', payment.id);

  await supabase
    .from('content_purchases')
    .update({
      status: 'completed',
      purchased_at: payment.paidAt || new Date().toISOString(),
    })
    .eq('id', purchase.id);
}

/**
 * 가상계좌 발급 처리
 */
async function handleVirtualAccountIssued(
  purchase: Record<string, unknown>,
  payment: PortOnePayment
) {
  const supabase = getSupabaseClient();
  const virtualAccount = payment.method?.virtualAccount;

  console.log('[PortOne Webhook] Virtual account issued:', payment.id, virtualAccount);

  // Update status to pending_payment (awaiting deposit)
  await supabase
    .from('content_purchases')
    .update({
      status: 'pending_payment',
      // Note: If you need to store virtual account info,
      // you'd need to add these columns to content_purchases table
    })
    .eq('id', purchase.id);

  // TODO: Send notification to user with virtual account info
  // SMS or push notification with:
  // - Bank: virtualAccount?.bankCode
  // - Account: virtualAccount?.accountNumber
  // - Expires: virtualAccount?.expiresAt
}

/**
 * 결제 취소 처리
 */
async function handlePaymentCancelled(
  purchase: Record<string, unknown>
) {
  const supabase = getSupabaseClient();

  console.log('[PortOne Webhook] Payment cancelled:', purchase.id);

  await supabase
    .from('content_purchases')
    .update({
      status: 'refunded',
    })
    .eq('id', purchase.id);
}

/**
 * 결제 실패 처리
 */
async function handlePaymentFailed(
  purchase: Record<string, unknown>
) {
  const supabase = getSupabaseClient();

  console.log('[PortOne Webhook] Payment failed:', purchase.id);

  await supabase
    .from('content_purchases')
    .update({
      status: 'failed',
    })
    .eq('id', purchase.id);
}
