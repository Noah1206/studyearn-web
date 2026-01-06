import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { confirmPayment, TossPaymentError } from '@/lib/toss/server';

interface ConfirmPaymentRequest {
  paymentKey: string;
  orderId: string;
  amount: number;
}

/**
 * POST /api/payments/confirm
 * Confirm payment with TossPayments and update purchase status
 */
export async function POST(request: NextRequest) {
  try {
    const body: ConfirmPaymentRequest = await request.json();
    const { paymentKey, orderId, amount } = body;

    // Validate required fields
    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json(
        { message: 'paymentKey, orderId, and amount are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { message: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find pending purchase
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .select('*')
      .eq('order_id', orderId)
      .eq('user_id', user.id)
      .single();

    if (purchaseError || !purchase) {
      return NextResponse.json(
        { message: 'Purchase not found' },
        { status: 404 }
      );
    }

    // Check if already completed
    if (purchase.status === 'completed') {
      return NextResponse.json(
        { message: 'Payment already confirmed' },
        { status: 400 }
      );
    }

    // Verify amount matches
    if (purchase.amount !== amount) {
      return NextResponse.json(
        { message: 'Amount mismatch' },
        { status: 400 }
      );
    }

    // Confirm with TossPayments
    let tossResponse;
    try {
      tossResponse = await confirmPayment(paymentKey, orderId, amount);
    } catch (err) {
      if (err instanceof TossPaymentError) {
        // Update purchase status to failed
        await supabase
          .from('purchases')
          .update({
            status: 'failed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', purchase.id);

        return NextResponse.json(
          { message: err.message, code: err.code },
          { status: 400 }
        );
      }
      throw err;
    }

    // Update purchase to completed
    const { error: updateError } = await supabase
      .from('purchases')
      .update({
        status: 'completed',
        payment_key: paymentKey,
        paid_at: tossResponse.approvedAt || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', purchase.id);

    if (updateError) {
      console.error('Failed to update purchase:', updateError);
      // Payment succeeded at Toss, so still return success
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
      { message: 'Payment confirmation failed' },
      { status: 500 }
    );
  }
}
