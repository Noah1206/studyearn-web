import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const MINIMUM_PAYOUT_AMOUNT = 10000; // 최소 정산 금액 10,000원

/**
 * POST /api/creator/payout
 * Request a payout
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { message: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { amount, bankName, bankAccount, accountHolder } = body;

    // Validate input
    if (!amount || !bankName || !bankAccount || !accountHolder) {
      return NextResponse.json(
        { message: '모든 필드를 입력해주세요.' },
        { status: 400 }
      );
    }

    if (amount < MINIMUM_PAYOUT_AMOUNT) {
      return NextResponse.json(
        { message: `최소 정산 금액은 ${MINIMUM_PAYOUT_AMOUNT.toLocaleString()}원입니다.` },
        { status: 400 }
      );
    }

    // Get creator balance
    const { data: balance, error: balanceError } = await supabase
      .from('creator_balances')
      .select('available_balance, pending_balance')
      .eq('creator_id', user.id)
      .single();

    if (balanceError || !balance) {
      return NextResponse.json(
        { message: '잔액 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (balance.available_balance < amount) {
      return NextResponse.json(
        { message: '가용 잔액이 부족합니다.' },
        { status: 400 }
      );
    }

    // Check for existing pending payout request
    const { data: existingRequest } = await supabase
      .from('payout_requests')
      .select('id')
      .eq('creator_id', user.id)
      .in('status', ['pending', 'processing'])
      .single();

    if (existingRequest) {
      return NextResponse.json(
        { message: '이미 처리 중인 정산 요청이 있습니다.' },
        { status: 400 }
      );
    }

    // Create payout request
    const { data: payoutRequest, error: insertError } = await supabase
      .from('payout_requests')
      .insert({
        creator_id: user.id,
        amount,
        bank_name: bankName,
        bank_account: bankAccount,
        account_holder: accountHolder,
        status: 'pending',
        requested_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Failed to create payout request:', insertError);
      return NextResponse.json(
        { message: '정산 요청에 실패했습니다.' },
        { status: 500 }
      );
    }

    // Move balance from available to pending
    const { error: updateError } = await supabase
      .from('creator_balances')
      .update({
        available_balance: balance.available_balance - amount,
        pending_balance: balance.pending_balance + amount,
        updated_at: new Date().toISOString(),
      })
      .eq('creator_id', user.id);

    if (updateError) {
      console.error('Failed to update balance:', updateError);
      // Rollback payout request
      await supabase
        .from('payout_requests')
        .delete()
        .eq('id', payoutRequest.id);

      return NextResponse.json(
        { message: '잔액 업데이트에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '정산 요청이 완료되었습니다.',
      payoutId: payoutRequest.id,
    });
  } catch (error) {
    console.error('Creator payout API error:', error);
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/creator/payout
 * Get payout history
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { message: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Get payout history
    const { data: payouts, error, count } = await supabase
      .from('payout_requests')
      .select('*', { count: 'exact' })
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Failed to fetch payouts:', error);
      return NextResponse.json(
        { message: '정산 내역을 불러오는데 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      payouts: payouts || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Creator payout history API error:', error);
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
