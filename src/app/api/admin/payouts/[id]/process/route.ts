import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendPayoutCompleteEmail } from '@/lib/email';
import { requireAdmin } from '@/lib/auth';

/**
 * POST /api/admin/payouts/[id]/process
 * Process (complete) a payout request (admin only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminError = await requireAdmin();
  if (adminError) return adminError;

  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get the payout request
    const { data: payout, error: payoutError } = await supabase
      .from('payout_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (payoutError || !payout) {
      return NextResponse.json(
        { message: '정산 요청을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // Get creator info separately
    const { data: creator } = await supabase
      .from('profiles')
      .select('email, nickname')
      .eq('id', payout.creator_id)
      .single();

    if (payout.status !== 'pending' && payout.status !== 'processing') {
      return NextResponse.json(
        { message: '이미 처리된 정산 요청입니다.' },
        { status: 400 }
      );
    }

    // Update payout status to completed
    const { error: updateError } = await supabase
      .from('payout_requests')
      .update({
        status: 'completed',
        processed_at: new Date().toISOString(),
        processed_by: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      console.error('Failed to update payout:', updateError);
      return NextResponse.json(
        { message: '정산 상태 업데이트에 실패했습니다.' },
        { status: 500 }
      );
    }

    // Update creator balance - move from pending to paid out
    const { data: balance } = await supabase
      .from('creator_balances')
      .select('pending_balance, total_paid_out')
      .eq('creator_id', payout.creator_id)
      .single();

    if (balance) {
      const { error: balanceError } = await supabase
        .from('creator_balances')
        .update({
          pending_balance: Math.max(0, balance.pending_balance - payout.amount),
          total_paid_out: balance.total_paid_out + payout.amount,
          updated_at: new Date().toISOString(),
        })
        .eq('creator_id', payout.creator_id);

      if (balanceError) {
        console.error('Failed to update creator balance:', balanceError);
      }
    }

    // Send payout complete email to creator
    if (creator?.email) {
      try {
        await sendPayoutCompleteEmail(
          creator.email,
          payout.amount,
          payout.bank_name,
          payout.bank_account
        );
      } catch (emailError) {
        console.error('Failed to send payout complete email:', emailError);
        // Don't fail the whole operation, just log
      }
    }

    return NextResponse.json({
      success: true,
      message: '정산이 완료되었습니다.',
      payoutId: id,
    });
  } catch (error) {
    console.error('Admin process payout API error:', error);
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/payouts/[id]/process
 * Reject a payout request (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminError2 = await requireAdmin();
  if (adminError2) return adminError2;

  try {
    const { id } = await params;
    const supabase = await createClient();

    const body = await request.json().catch(() => ({}));
    const { reason } = body;

    // Get the payout request
    const { data: payout, error: payoutError } = await supabase
      .from('payout_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (payoutError || !payout) {
      return NextResponse.json(
        { message: '정산 요청을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (payout.status !== 'pending' && payout.status !== 'processing') {
      return NextResponse.json(
        { message: '이미 처리된 정산 요청입니다.' },
        { status: 400 }
      );
    }

    // Update payout status to rejected
    const { error: updateError } = await supabase
      .from('payout_requests')
      .update({
        status: 'rejected',
        admin_note: reason || null,
        processed_at: new Date().toISOString(),
        processed_by: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      console.error('Failed to reject payout:', updateError);
      return NextResponse.json(
        { message: '정산 거절에 실패했습니다.' },
        { status: 500 }
      );
    }

    // Return balance from pending to available
    const { data: balance } = await supabase
      .from('creator_balances')
      .select('available_balance, pending_balance')
      .eq('creator_id', payout.creator_id)
      .single();

    if (balance) {
      const { error: balanceError } = await supabase
        .from('creator_balances')
        .update({
          available_balance: balance.available_balance + payout.amount,
          pending_balance: Math.max(0, balance.pending_balance - payout.amount),
          updated_at: new Date().toISOString(),
        })
        .eq('creator_id', payout.creator_id);

      if (balanceError) {
        console.error('Failed to restore creator balance:', balanceError);
      }
    }

    return NextResponse.json({
      success: true,
      message: '정산 요청이 거절되었습니다.',
      payoutId: id,
    });
  } catch (error) {
    console.error('Admin reject payout API error:', error);
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
