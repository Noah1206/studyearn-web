import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/creator/balance
 * Get creator's current balance and payout history
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

    // Get creator balance
    const { data: balance, error: balanceError } = await supabase
      .from('creator_balances')
      .select('*')
      .eq('creator_id', user.id)
      .maybeSingle();

    // If no balance record exists, return zero balance
    if (!balance) {
      return NextResponse.json({
        balance: {
          available_balance: 0,
          pending_balance: 0,
          total_earned: 0,
          total_paid_out: 0,
        },
        recentPayouts: [],
        pendingPayouts: [],
      });
    }

    if (balanceError) {
      console.error('Failed to fetch balance:', balanceError);
      return NextResponse.json(
        { message: '잔액 정보를 불러오는데 실패했습니다.' },
        { status: 500 }
      );
    }

    // Get recent payout requests
    const { data: payouts } = await supabase
      .from('payout_requests')
      .select('*')
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get pending payout requests
    const pendingPayouts = (payouts || []).filter((p: { status: string }) => p.status === 'pending' || p.status === 'processing');

    // Get payout settings
    const { data: settings } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'payout_settings')
      .maybeSingle();

    return NextResponse.json({
      balance: {
        available_balance: balance.available_balance || 0,
        pending_balance: balance.pending_balance || 0,
        total_earned: balance.total_earned || 0,
        total_paid_out: balance.total_paid_out || 0,
      },
      recentPayouts: payouts || [],
      pendingPayouts,
      payoutSettings: settings?.value || {
        fee_rate: 0.20,
        minimum_amount: 10000,
        payout_day: '매주 금요일',
      },
    });
  } catch (error) {
    console.error('Creator balance API error:', error);
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
