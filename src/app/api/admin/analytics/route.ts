import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';

/**
 * GET /api/admin/analytics
 * Fetch aggregated analytics data for the admin dashboard.
 * Returns counts for users, creators, content, subscriptions, and purchases.
 */
export async function GET(_request: NextRequest) {
  const adminError = await requireAdmin();
  if (adminError) return adminError;

  try {
    const supabase = createAdminClient();

    // Calculate date 30 days ago for recent purchases query
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

    // Fetch all counts in parallel for efficiency
    const [
      usersResult,
      creatorsResult,
      contentResult,
      subscriptionsResult,
      recentPurchasesResult,
      p2pPurchasesResult,
    ] = await Promise.all([
      // Total user count
      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true }),

      // Total creator count
      supabase
        .from('creator_settings')
        .select('*', { count: 'exact', head: true }),

      // Total content count (table may not exist; error is handled below)
      supabase
        .from('contents')
        .select('*', { count: 'exact', head: true }),

      // Active IAP subscription count
      supabase
        .from('iap_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active'),

      // Recent IAP purchases (last 30 days)
      supabase
        .from('iap_purchases')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgoISO),

      // Total completed P2P content purchases
      supabase
        .from('content_purchases')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed'),
    ]);

    // Log any non-critical errors for debugging
    if (usersResult.error) {
      console.error('Analytics - profiles count error:', usersResult.error);
    }
    if (creatorsResult.error) {
      console.error('Analytics - creator_settings count error:', creatorsResult.error);
    }
    if (contentResult.error) {
      console.error('Analytics - contents count error:', contentResult.error);
    }
    if (subscriptionsResult.error) {
      console.error('Analytics - iap_subscriptions count error:', subscriptionsResult.error);
    }
    if (recentPurchasesResult.error) {
      console.error('Analytics - iap_purchases count error:', recentPurchasesResult.error);
    }
    if (p2pPurchasesResult.error) {
      console.error('Analytics - content_purchases count error:', p2pPurchasesResult.error);
    }

    return NextResponse.json({
      totalUsers: usersResult.count ?? 0,
      totalCreators: creatorsResult.count ?? 0,
      totalContent: contentResult.count ?? 0,
      activeSubscriptions: subscriptionsResult.count ?? 0,
      recentPurchases: recentPurchasesResult.count ?? 0,
      totalP2PPurchases: p2pPurchasesResult.count ?? 0,
    });
  } catch (error) {
    console.error('Admin analytics API error:', error);
    return NextResponse.json(
      { message: '분석 데이터를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
