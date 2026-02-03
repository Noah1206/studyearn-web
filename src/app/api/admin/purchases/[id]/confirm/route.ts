import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { sendPurchaseConfirmEmail } from '@/lib/email';
import { requireAdmin } from '@/lib/auth';
import { notify } from '@/lib/notifications';

/**
 * POST /api/admin/purchases/[id]/confirm
 * Confirm a purchase payment (admin only)
 * This updates the purchase status and adds to creator's balance
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check admin permission (environment variable based)
  const adminError = await requireAdmin();
  if (adminError) return adminError;

  try {
    const { id } = await params;
    const supabase = createAdminClient();

    // Get the purchase
    const { data: purchase, error: purchaseError } = await supabase
      .from('content_purchases')
      .select('*')
      .eq('id', id)
      .single();

    if (purchaseError || !purchase) {
      return NextResponse.json(
        { message: '구매 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // Get buyer and content info separately for email
    const [{ data: buyer }, { data: content }] = await Promise.all([
      supabase.from('profiles').select('email, nickname').eq('id', purchase.buyer_id).single(),
      supabase.from('contents').select('title').eq('id', purchase.content_id).single(),
    ]);

    if (purchase.status !== 'pending_confirm' && purchase.status !== 'pending_payment') {
      return NextResponse.json(
        { message: '이미 처리된 구매입니다.' },
        { status: 400 }
      );
    }

    // Update purchase status to completed
    const { error: updateError } = await supabase
      .from('content_purchases')
      .update({
        status: 'completed',
        platform_confirmed_at: new Date().toISOString(),
        platform_confirmed_by: null,
      })
      .eq('id', id);

    if (updateError) {
      console.error('Failed to update purchase:', updateError);
      return NextResponse.json(
        { message: '구매 상태 업데이트에 실패했습니다.' },
        { status: 500 }
      );
    }

    // Update or create creator balance
    const creatorRevenue = purchase.creator_revenue || Math.floor(purchase.amount * 0.8);

    // Check if creator balance exists
    const { data: existingBalance } = await supabase
      .from('creator_balances')
      .select('id, available_balance, total_earned')
      .eq('creator_id', purchase.seller_id)
      .single();

    if (existingBalance) {
      // Update existing balance
      const { error: balanceError } = await supabase
        .from('creator_balances')
        .update({
          available_balance: existingBalance.available_balance + creatorRevenue,
          total_earned: existingBalance.total_earned + creatorRevenue,
          updated_at: new Date().toISOString(),
        })
        .eq('creator_id', purchase.seller_id);

      if (balanceError) {
        console.error('Failed to update creator balance:', balanceError);
        // Don't fail the whole operation, just log
      }
    } else {
      // Create new balance record
      const { error: insertError } = await supabase
        .from('creator_balances')
        .insert({
          creator_id: purchase.seller_id,
          available_balance: creatorRevenue,
          pending_balance: 0,
          total_earned: creatorRevenue,
          total_paid_out: 0,
        });

      if (insertError) {
        console.error('Failed to create creator balance:', insertError);
        // Don't fail the whole operation, just log
      }
    }

    // Send purchase confirmation email to buyer
    if (buyer?.email && content?.title) {
      try {
        await sendPurchaseConfirmEmail(
          buyer.email,
          content.title,
          purchase.content_id
        );
      } catch (emailError) {
        console.error('Failed to send purchase confirmation email:', emailError);
      }
    }

    // Send app notification to buyer
    const contentTitle = content?.title || '콘텐츠';
    notify.purchaseComplete(purchase.buyer_id, contentTitle, purchase.content_id).catch(() => {});

    return NextResponse.json({
      success: true,
      message: '입금이 확인되었습니다.',
      purchaseId: id,
      creatorRevenue,
    });
  } catch (error) {
    console.error('Admin confirm purchase API error:', error);
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/purchases/[id]/confirm
 * Reject a purchase (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check admin permission (environment variable based)
  const adminError = await requireAdmin();
  if (adminError) return adminError;

  try {
    const { id } = await params;
    const supabase = createAdminClient();

    // Get the purchase
    const { data: purchase, error: purchaseError } = await supabase
      .from('content_purchases')
      .select('status, buyer_id, content_id')
      .eq('id', id)
      .single();

    if (purchaseError || !purchase) {
      return NextResponse.json(
        { message: '구매 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (purchase.status !== 'pending_confirm' && purchase.status !== 'pending_payment') {
      return NextResponse.json(
        { message: '이미 처리된 구매입니다.' },
        { status: 400 }
      );
    }

    // Update purchase status to rejected
    const { error: updateError } = await supabase
      .from('content_purchases')
      .update({
        status: 'rejected',
        platform_confirmed_at: new Date().toISOString(),
        platform_confirmed_by: null,
      })
      .eq('id', id);

    if (updateError) {
      console.error('Failed to reject purchase:', updateError);
      return NextResponse.json(
        { message: '구매 거절에 실패했습니다.' },
        { status: 500 }
      );
    }

    // Send app notification to buyer
    const { data: content } = await supabase.from('contents').select('title').eq('id', purchase.content_id).single();
    notify.purchaseRejected(purchase.buyer_id, content?.title || '콘텐츠', purchase.content_id).catch(() => {});

    return NextResponse.json({
      success: true,
      message: '구매가 거절되었습니다.',
      purchaseId: id,
    });
  } catch (error) {
    console.error('Admin reject purchase API error:', error);
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
