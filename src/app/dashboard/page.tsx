import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardClient } from './DashboardClient';

export const dynamic = 'force-dynamic';

interface ContentRecord {
  id: string;
  title: string;
  content_type: string;
  access_level: string;
  view_count: number;
  like_count: number;
  price: number;
  created_at: string;
  thumbnail_url?: string | null;
  subject?: string | null;
}

// 모든 대시보드 데이터를 한 번에 가져오기
async function getDashboardData(creatorId: string) {
  const supabase = await createClient();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  const startDate = new Date(sixMonthsAgo.getFullYear(), sixMonthsAgo.getMonth(), 1);

  // 병렬로 모든 데이터 가져오기
  const [
    balanceResult,
    contentsResult,
    purchasesResult,
    recentPurchasesResult,
  ] = await Promise.all([
    // 잔액 정보
    supabase
      .from('creator_balances')
      .select('total_earned, available_balance')
      .eq('creator_id', creatorId)
      .maybeSingle(),
    // 콘텐츠 목록
    supabase
      .from('contents')
      .select('id, title, content_type, access_level, view_count, like_count, price, created_at, thumbnail_url, subject')
      .eq('creator_id', creatorId)
      .eq('is_published', true)
      .order('created_at', { ascending: false }),
    // 월별 수익
    supabase
      .from('content_purchases')
      .select('creator_revenue, platform_confirmed_at, content_id')
      .eq('seller_id', creatorId)
      .eq('status', 'completed')
      .gte('platform_confirmed_at', startDate.toISOString()),
    // 최근 판매 (content_id 포함)
    supabase
      .from('content_purchases')
      .select(`
        id, creator_revenue, created_at, buyer_id, content_id,
        content:contents!content_id (title)
      `)
      .eq('seller_id', creatorId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  const contents = (contentsResult.data || []) as ContentRecord[];
  const purchases = purchasesResult.data || [];
  const totalRevenue = balanceResult.data?.total_earned || 0;
  const availableBalance = balanceResult.data?.available_balance || 0;
  const totalViews = contents.reduce((sum, c) => sum + c.view_count, 0);

  // 월별 수익 계산
  const monthlyRevenue: Record<string, number> = {};
  for (const purchase of purchases) {
    if (purchase.platform_confirmed_at) {
      const month = purchase.platform_confirmed_at.slice(0, 7) + '-01';
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (purchase.creator_revenue || 0);
    }
  }

  const revenueStats = Object.entries(monthlyRevenue)
    .map(([month, revenue]) => ({ yearMonth: month, totalRevenue: revenue }))
    .sort((a, b) => b.yearMonth.localeCompare(a.yearMonth));

  const currentMonthRevenue = revenueStats[0]?.totalRevenue || 0;
  const lastMonthRevenue = revenueStats[1]?.totalRevenue || 0;

  // 콘텐츠별 구매 정보 매핑
  const purchaseMap = new Map<string, { count: number; revenue: number }>();
  for (const purchase of purchases) {
    if (purchase.content_id) {
      const existing = purchaseMap.get(purchase.content_id) || { count: 0, revenue: 0 };
      purchaseMap.set(purchase.content_id, {
        count: existing.count + 1,
        revenue: existing.revenue + (purchase.creator_revenue || 0),
      });
    }
  }

  // 콘텐츠 통계 생성
  const contentStats = contents.map(content => {
    const purchaseInfo = purchaseMap.get(content.id) || { count: 0, revenue: 0 };
    return {
      id: content.id,
      title: content.title,
      contentType: content.content_type,
      accessLevel: content.access_level,
      viewCount: content.view_count,
      likeCount: content.like_count,
      purchaseCount: purchaseInfo.count,
      price: content.price || 0,
      revenue: purchaseInfo.revenue,
      createdAt: content.created_at,
      thumbnailUrl: content.thumbnail_url,
      subject: content.subject,
    };
  });

  // 최근 판매 데이터 (content_id 포함)
  const recentSales = (recentPurchasesResult.data || []).map((purchase: {
    id: string;
    creator_revenue: number | null;
    created_at: string;
    content_id: string | null;
    content: { title: string } | null;
    buyer_id: string | null;
  }) => ({
    id: purchase.id,
    type: 'content' as const,
    title: purchase.content?.title || '콘텐츠',
    amount: purchase.creator_revenue || 0,
    createdAt: purchase.created_at,
    contentId: purchase.content_id || undefined,
    buyerName: undefined,
  }));

  return {
    totalRevenue,
    availableBalance,
    currentMonthRevenue,
    lastMonthRevenue,
    contentCount: contents.length,
    totalViews,
    contentStats,
    recentSales,
  };
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect('/login?redirectTo=/dashboard');
  }

  const user = session.user;

  const { data: creatorCheck } = await supabase
    .from('creator_settings')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!creatorCheck) {
    redirect('/');
  }

  const dashboardData = await getDashboardData(user.id);

  return <DashboardClient data={dashboardData} />;
}

export const metadata = {
  title: '크리에이터 스튜디오 - 스터플',
  description: '콘텐츠와 수익을 한눈에 관리하세요.',
};
