import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

interface ConfirmPaymentRequest {
  paymentKey: string;
  orderId: string;
  amount: number;
}

/**
 * POST /api/payment/confirm
 * Confirm payment with TossPayments and update purchase status
 * Uses content_purchases table
 */
export async function POST(request: NextRequest) {
  try {
    const body: ConfirmPaymentRequest = await request.json();
    const { paymentKey, orderId, amount } = body;

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

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find the pending purchase by order_id (using content_purchases table)
    const { data: purchase, error: purchaseError } = await supabase
      .from('content_purchases')
      .select('*')
      .eq('order_id', orderId)
      .eq('buyer_id', user.id)
      .eq('status', 'pending')
      .single();

    if (purchaseError || !purchase) {
      console.error('Purchase not found:', purchaseError);
      return NextResponse.json(
        { message: 'Purchase not found' },
        { status: 404 }
      );
    }

    // Verify amount matches
    if (purchase.amount !== amount) {
      return NextResponse.json(
        { message: 'Amount mismatch' },
        { status: 400 }
      );
    }

    // Confirm payment with TossPayments
    const secretKey = process.env.TOSS_SECRET_KEY;
    if (!secretKey) {
      console.error('TOSS_SECRET_KEY not configured');
      return NextResponse.json(
        { message: 'Payment configuration error' },
        { status: 500 }
      );
    }

    const tossResponse = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount,
      }),
    });

    if (!tossResponse.ok) {
      const tossError = await tossResponse.json();
      console.error('Toss payment confirmation failed:', tossError);

      // Update purchase status to failed
      await supabase
        .from('content_purchases')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', purchase.id);

      return NextResponse.json(
        { message: tossError.message || 'Payment confirmation failed' },
        { status: 400 }
      );
    }

    const tossData = await tossResponse.json();

    // Update purchase to completed
    const { error: updateError } = await supabase
      .from('content_purchases')
      .update({
        status: 'completed',
        payment_key: paymentKey,
        purchased_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', purchase.id);

    if (updateError) {
      console.error('Failed to update purchase:', updateError);
      return NextResponse.json(
        { message: 'Failed to update purchase status' },
        { status: 500 }
      );
    }

    // Update creator's revenue stats
    if (purchase.seller_id) {
      const creatorId = purchase.seller_id;
      const platformFeePercent = parseFloat(process.env.PLATFORM_FEE_PERCENT || '20');
      const creatorRevenue = Math.floor(amount * (1 - platformFeePercent / 100));
      const currentMonth = new Date().toISOString().slice(0, 7) + '-01'; // YYYY-MM-01

      // Use admin client to bypass RLS for revenue stats (inserting into another user's stats)
      const adminClient = createAdminClient();
      if (adminClient) {
        // Upsert creator revenue stats
        const { data: existingStats } = await adminClient
          .from('creator_revenue_stats')
          .select('*')
          .eq('creator_id', creatorId)
          .eq('month', currentMonth)
          .single();

        if (existingStats) {
          // Update existing stats
          await adminClient
            .from('creator_revenue_stats')
            .update({
              total_revenue: existingStats.total_revenue + creatorRevenue,
              content_revenue: existingStats.content_revenue + creatorRevenue,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingStats.id);
        } else {
          // Create new stats record
          await adminClient
            .from('creator_revenue_stats')
            .insert({
              creator_id: creatorId,
              month: currentMonth,
              total_revenue: creatorRevenue,
              subscription_revenue: 0,
              content_revenue: creatorRevenue,
              tip_revenue: 0,
              subscriber_count: 0,
              new_subscribers: 0,
              churned_subscribers: 0,
            });
        }
      }
    }

    return NextResponse.json({
      success: true,
      orderId,
      amount,
      productId: purchase.content_id,  // Return content_id as productId for backward compatibility
    });
  } catch (error) {
    console.error('Payment confirm API error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
