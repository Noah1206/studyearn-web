import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cancelPayment, PortOneApiError } from '@/lib/portone/server';

interface CancelPaymentRequest {
  paymentId: string;
  reason: string;
  amount?: number; // 부분 취소 시 사용
}

/**
 * POST /api/payments/portone/cancel
 * Cancel payment through PortOne
 */
export async function POST(request: NextRequest) {
  try {
    const body: CancelPaymentRequest = await request.json();
    const { paymentId, reason, amount } = body;

    // Validate required fields
    if (!paymentId) {
      return NextResponse.json(
        { message: 'paymentId가 필요합니다' },
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

    // Find purchase by payment_id
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .select('*')
      .eq('payment_id', paymentId)
      .single();

    if (purchaseError || !purchase) {
      return NextResponse.json(
        { message: '결제 내역을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // Check if user owns this purchase or is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin';

    if (purchase.user_id !== user.id && !isAdmin) {
      return NextResponse.json(
        { message: '권한이 없습니다' },
        { status: 403 }
      );
    }

    // Check if cancellable
    if (purchase.status === 'refunded') {
      return NextResponse.json(
        { message: '이미 환불된 결제입니다' },
        { status: 400 }
      );
    }

    if (purchase.status !== 'completed' && purchase.status !== 'awaiting_deposit') {
      return NextResponse.json(
        { message: '취소할 수 없는 결제 상태입니다' },
        { status: 400 }
      );
    }

    // Cancel with PortOne
    try {
      const cancelResult = await cancelPayment(
        paymentId,
        reason || '고객 요청에 의한 취소',
        amount
      );

      // Update purchase status
      await supabase
        .from('purchases')
        .update({
          status: 'refunded',
          updated_at: new Date().toISOString(),
        })
        .eq('id', purchase.id);

      return NextResponse.json({
        success: true,
        message: '결제가 취소되었습니다',
        cancelledAt: cancelResult.cancelledAt,
      });
    } catch (error) {
      if (error instanceof PortOneApiError) {
        return NextResponse.json(
          { message: error.message },
          { status: 400 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Payment cancellation error:', error);
    return NextResponse.json(
      { message: '결제 취소 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
