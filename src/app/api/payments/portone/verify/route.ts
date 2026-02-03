import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyPayment, PortOneApiError } from '@/lib/portone/server';

interface VerifyPaymentRequest {
  paymentId: string;
  amount: number;
}

/**
 * POST /api/payments/portone/verify
 * Verify payment with PortOne and update content_purchases status
 */
export async function POST(request: NextRequest) {
  try {
    const body: VerifyPaymentRequest = await request.json();
    const { paymentId, amount } = body;

    // Validate required fields
    if (!paymentId || !amount) {
      return NextResponse.json(
        { message: 'paymentId, amount가 필요합니다' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { message: '데이터베이스 연결 실패' },
        { status: 500 }
      );
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { message: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    // Find pending purchase by payment_id
    const { data: purchase, error: purchaseError } = await supabase
      .from('content_purchases')
      .select('*')
      .eq('payment_id', paymentId)
      .eq('buyer_id', user.id)
      .single();

    if (purchaseError || !purchase) {
      return NextResponse.json(
        { message: '주문을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // Check if already completed
    if (purchase.status === 'completed') {
      return NextResponse.json({
        success: true,
        status: 'completed',
        message: '이미 결제가 완료되었습니다',
      });
    }

    // Verify amount matches
    if (purchase.amount !== amount) {
      return NextResponse.json(
        { message: '결제 금액이 일치하지 않습니다' },
        { status: 400 }
      );
    }

    // Verify with PortOne
    const { verified, payment, error } = await verifyPayment(paymentId, amount);

    if (!verified) {
      // Update purchase status to failed
      await supabase
        .from('content_purchases')
        .update({
          status: 'failed',
        })
        .eq('id', purchase.id);

      return NextResponse.json(
        { message: error || '결제 검증 실패' },
        { status: 400 }
      );
    }

    // Determine status based on payment status
    let newStatus: string = 'completed';
    const updateData: Record<string, unknown> = {
      payment_id: paymentId,
    };

    if (payment.status === 'VIRTUAL_ACCOUNT_ISSUED') {
      // 가상계좌 발급됨 - 입금 대기 상태
      newStatus = 'pending_payment';
      // Note: Virtual account info would need additional columns in content_purchases
      // For now, we'll just set status
    } else if (payment.status === 'PAID') {
      // 결제 완료
      newStatus = 'completed';
      updateData.purchased_at = payment.paidAt || new Date().toISOString();
    }

    updateData.status = newStatus;

    // Update purchase
    const { error: updateError } = await supabase
      .from('content_purchases')
      .update(updateData)
      .eq('id', purchase.id);

    if (updateError) {
      console.error('Failed to update purchase:', updateError);
      return NextResponse.json(
        { message: '구매 정보 업데이트에 실패했습니다' },
        { status: 500 }
      );
    }

    // Return response based on payment type
    if (payment.status === 'VIRTUAL_ACCOUNT_ISSUED') {
      const va = payment.method?.virtualAccount;
      return NextResponse.json({
        success: true,
        status: 'awaiting_deposit',
        orderName: payment.orderName,
        virtualAccount: {
          bankCode: va?.bankCode,
          accountNumber: va?.accountNumber,
          accountHolder: va?.accountHolder,
          expiresAt: va?.expiresAt,
        },
      });
    }

    return NextResponse.json({
      success: true,
      status: 'completed',
      orderName: payment.orderName,
      paidAt: payment.paidAt,
      receiptUrl: payment.receiptUrl,
      purchaseId: purchase.id,
    });
  } catch (error) {
    console.error('Payment verification error:', error);

    if (error instanceof PortOneApiError) {
      return NextResponse.json(
        { message: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: '결제 검증 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
