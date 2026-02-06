import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';

/**
 * GET /api/admin/transactions
 * Unified transaction list from platform_transactions VIEW.
 * Supports filtering by source, platform, status with pagination.
 */
export async function GET(request: NextRequest) {
  const adminError = await requireAdmin();
  if (adminError) return adminError;

  try {
    const supabase = createAdminClient();

    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source') || 'all';
    const platform = searchParams.get('platform') || 'all';
    const status = searchParams.get('status') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Query the platform_transactions VIEW
    let query = supabase
      .from('platform_transactions')
      .select(
        `
        id,
        user_id,
        creator_id,
        product_id,
        content_id,
        status,
        platform,
        source,
        transaction_type,
        environment,
        external_transaction_id,
        is_verified,
        transaction_date,
        created_at,
        updated_at
      `,
        { count: 'exact' }
      );

    // Apply filters
    if (source !== 'all') {
      query = query.eq('source', source);
    }

    if (platform !== 'all') {
      query = query.eq('platform', platform);
    }

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: transactions, error, count } = await query
      .order('transaction_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Failed to fetch transactions:', error);
      return NextResponse.json(
        { message: '거래 내역을 불러오는데 실패했습니다.' },
        { status: 500 }
      );
    }

    // Enrich each transaction with user profile info
    const enrichedTransactions = await Promise.all(
      (transactions || []).map(async (tx: { user_id: string; [key: string]: unknown }) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('nickname, email')
          .eq('id', tx.user_id)
          .single();

        return {
          ...tx,
          user: profile || { nickname: '알 수 없음', email: null },
        };
      })
    );

    return NextResponse.json({
      transactions: enrichedTransactions,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Admin transactions API error:', error);
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
