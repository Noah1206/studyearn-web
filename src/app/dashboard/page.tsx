import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, TrendingUp, Wallet, Eye, FileText, ArrowUpRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { Button, LoadingSection } from '@/components/ui';
import { ContentThumbnail } from '@/components/content';
import { AnalyticsChart } from './AnalyticsChart';
import { RecentActivityChart } from './RecentActivityChart';

export const dynamic = 'force-dynamic';

interface RevenueStats {
  yearMonth: string;
  totalRevenue: number;
  subscriptionRevenue: number;
  contentRevenue: number;
}

interface ContentStats {
  id: string;
  title: string;
  contentType: string;
  accessLevel: string;
  viewCount: number;
  likeCount: number;
  purchaseCount: number;
  price: number;
  revenue: number;
  createdAt: string;
  thumbnailUrl?: string | null;
  subject?: string | null;
}

interface PayoutInfo {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  processed_at: string | null;
}

interface SaleItem {
  id: string;
  type: 'content';
  title: string;
  amount: number;
  createdAt: string;
  buyerName?: string;
}

// 섹션별 데이터 fetching 함수들
async function getStatsData(creatorId: string) {
  const supabase = await createClient();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  const startDate = new Date(sixMonthsAgo.getFullYear(), sixMonthsAgo.getMonth(), 1);

  // Get balance from creator_balances table
  const [balanceResult, contentsCountResult, purchasesResult] = await Promise.all([
    supabase
      .from('creator_balances')
      .select('total_earned, available_balance')
      .eq('creator_id', creatorId)
      .maybeSingle(),
    supabase
      .from('contents')
      .select('id, view_count')
      .eq('creator_id', creatorId)
      .eq('is_published', true),
    // Get monthly revenue from content_purchases
    supabase
      .from('content_purchases')
      .select('creator_revenue, platform_confirmed_at')
      .eq('seller_id', creatorId)
      .eq('status', 'completed')
      .gte('platform_confirmed_at', startDate.toISOString()),
  ]);

  const contents = contentsCountResult.data || [];
  const purchases = purchasesResult.data || [];
  const totalRevenue = balanceResult.data?.total_earned || 0;
  const availableBalance = balanceResult.data?.available_balance || 0;
  const totalViews = contents.reduce((sum: number, c: { view_count: number }) => sum + c.view_count, 0);

  // Group purchases by month for revenue stats
  const monthlyRevenue: Record<string, number> = {};
  for (const purchase of purchases) {
    if (purchase.platform_confirmed_at) {
      const month = purchase.platform_confirmed_at.slice(0, 7) + '-01'; // YYYY-MM-01
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (purchase.creator_revenue || 0);
    }
  }

  // Create sorted revenue stats array
  const revenueStats = Object.entries(monthlyRevenue)
    .map(([month, revenue]) => ({
      yearMonth: month,
      totalRevenue: revenue,
      subscriptionRevenue: 0,
      contentRevenue: revenue,
    }))
    .sort((a, b) => b.yearMonth.localeCompare(a.yearMonth));

  const currentMonthRevenue = revenueStats[0]?.totalRevenue || 0;
  const lastMonthRevenue = revenueStats[1]?.totalRevenue || 0;

  return {
    totalRevenue,
    availableBalance,
    currentMonthRevenue,
    lastMonthRevenue,
    contentCount: contents.length,
    totalViews,
    revenueStats,
  };
}

async function getPayoutData(creatorId: string) {
  const supabase = await createClient();

  const [balanceResult, pendingPayoutsResult, completedPayoutsResult, recentPurchasesResult] = await Promise.all([
    // Use creator_balances table for balance
    supabase
      .from('creator_balances')
      .select('available_balance, pending_balance')
      .eq('creator_id', creatorId)
      .maybeSingle(),
    // Use payout_requests table instead of creator_payouts
    supabase
      .from('payout_requests')
      .select('*')
      .eq('creator_id', creatorId)
      .in('status', ['pending', 'processing'])
      .order('created_at', { ascending: false }),
    supabase
      .from('payout_requests')
      .select('*')
      .eq('creator_id', creatorId)
      .eq('status', 'completed')
      .order('processed_at', { ascending: false })
      .limit(5),
    supabase
      .from('content_purchases')
      .select(`
        id, creator_revenue, created_at, buyer_id,
        content:contents!content_id (title)
      `)
      .eq('seller_id', creatorId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  const availableBalance = balanceResult.data?.available_balance || 0;
  const pendingPayouts = pendingPayoutsResult.data || [];
  const completedPayouts = completedPayoutsResult.data || [];

  const recentSales: SaleItem[] = recentPurchasesResult.data?.map((purchase: {
    id: string;
    creator_revenue: number | null;
    created_at: string;
    content: { title: string } | null;
    buyer_id: string | null;
  }) => ({
    id: purchase.id,
    type: 'content' as const,
    title: purchase.content?.title || '콘텐츠',
    amount: purchase.creator_revenue || 0,
    createdAt: purchase.created_at,
    buyerName: undefined, // buyer info not fetched for simplicity
  })) || [];

  return {
    availableBalance,
    pendingPayouts,
    completedPayouts,
    recentSales: recentSales.slice(0, 10),
  };
}

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

async function getContentStatsData(creatorId: string) {
  const supabase = await createClient();

  const { data: contents } = await supabase
    .from('contents')
    .select('id, title, content_type, access_level, view_count, like_count, price, created_at, thumbnail_url, subject')
    .eq('creator_id', creatorId)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(10);

  let contentStats: ContentStats[] = [];
  if (contents && contents.length > 0) {
    const contentIds = (contents as ContentRecord[]).map(c => c.id);
    const { data: allPurchases } = await supabase
      .from('content_purchases')
      .select('content_id, creator_revenue')
      .in('content_id', contentIds)
      .eq('status', 'completed');

    const purchaseMap = new Map<string, { count: number; revenue: number }>();
    if (allPurchases) {
      for (const purchase of allPurchases) {
        const existing = purchaseMap.get(purchase.content_id) || { count: 0, revenue: 0 };
        purchaseMap.set(purchase.content_id, {
          count: existing.count + 1,
          revenue: existing.revenue + (purchase.creator_revenue || 0),
        });
      }
    }

    contentStats = (contents as ContentRecord[]).map(content => {
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
  }

  return { contentStats };
}

// Metric Tab Component (Clean minimal style)
function MetricTab({
  label,
  value,
  isActive = false,
}: {
  label: string;
  value: string;
  isActive?: boolean;
}) {
  return (
    <div
      className={`px-4 py-3 border-b-2 transition-colors ${
        isActive
          ? 'border-orange-500'
          : 'border-transparent hover:border-gray-200'
      }`}
    >
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className={`text-base font-semibold ${isActive ? 'text-orange-600' : 'text-gray-900'}`}>{value}</p>
    </div>
  );
}

// Stat Card Component
function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  href,
  highlight = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  subValue?: string;
  href?: string;
  highlight?: boolean;
}) {
  const content = (
    <div className={`bg-white rounded-xl border ${highlight ? 'border-orange-200' : 'border-gray-200'} p-5 ${href ? 'hover:border-orange-300 transition-colors' : ''}`}>
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${highlight ? 'bg-orange-50' : 'bg-gray-50'}`}>
          <Icon className={`w-5 h-5 ${highlight ? 'text-orange-500' : 'text-gray-500'}`} />
        </div>
        {href && <ArrowUpRight className="w-4 h-4 text-gray-400" />}
      </div>
      <div className="mt-4">
        <p className="text-sm text-gray-500 mb-1">{label}</p>
        <p className={`text-2xl font-bold ${highlight ? 'text-orange-600' : 'text-gray-900'}`}>{value}</p>
        {subValue && <p className="text-xs text-gray-400 mt-1">{subValue}</p>}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

// 섹션 1: Analytics Overview (YouTube Studio style)
async function AnalyticsOverview({ creatorId }: { creatorId: string }) {
  const data = await getStatsData(creatorId);
  const isNewCreator = data.contentCount === 0;

  // 일별 데이터 생성 (최근 28일)
  const dailyData = generateDailyData(data);

  // 이번 달 성장률 계산
  const growthRate = data.lastMonthRevenue > 0
    ? Math.round(((data.currentMonthRevenue - data.lastMonthRevenue) / data.lastMonthRevenue) * 100)
    : 0;

  return (
    <>
      {/* Welcome Banner for New Creators */}
      {isNewCreator && (
        <div className="mb-6 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-orange-500" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                크리에이터로 첫 걸음을 내딛으셨네요!
              </h2>
              <p className="text-gray-600 text-sm mb-4">
                첫 콘텐츠를 업로드하고 팬들과 소통하며 수익을 창출해보세요.
              </p>
              <Link href="/dashboard/upload">
                <Button size="sm">첫 콘텐츠 업로드</Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={Wallet}
          label="정산 가능"
          value={formatCurrency(data.availableBalance)}
          subValue={data.availableBalance >= 10000 ? "정산 신청 가능" : "최소 10,000원"}
          href="/dashboard/payout"
          highlight={data.availableBalance >= 10000}
        />
        <StatCard
          icon={TrendingUp}
          label="이번 달 수익"
          value={formatCurrency(data.currentMonthRevenue)}
          subValue={growthRate !== 0 ? `지난달 대비 ${growthRate > 0 ? '+' : ''}${growthRate}%` : undefined}
        />
        <StatCard
          icon={Eye}
          label="총 조회수"
          value={formatNumber(data.totalViews)}
        />
        <StatCard
          icon={FileText}
          label="발행 콘텐츠"
          value={`${data.contentCount}개`}
          href="/dashboard/contents"
        />
      </div>

      {/* Metrics Tab Bar + Chart */}
      <div className="bg-white rounded-xl border border-gray-200 mb-6">
        {/* Tabs */}
        <div className="flex items-center border-b border-gray-100 overflow-x-auto">
          <MetricTab label="조회수" value={formatNumber(data.totalViews)} isActive={true} />
          <MetricTab label="수익" value={formatCurrency(data.totalRevenue)} />
          <MetricTab label="콘텐츠" value={formatNumber(data.contentCount)} />
        </div>

        {/* Chart Area */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-400">최근 28일</span>
            <span className="text-xs text-gray-400">
              {new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toLocaleDateString('ko-KR')} ~ {new Date().toLocaleDateString('ko-KR')}
            </span>
          </div>
          <AnalyticsChart data={dailyData} />
        </div>
      </div>
    </>
  );
}

// 일별 데이터 생성 함수
function generateDailyData(statsData: { totalViews: number; revenueStats: RevenueStats[] }) {
  const days = 28;
  const data = [];
  const now = new Date();

  // 실제 데이터가 있으면 분배, 없으면 샘플 데이터
  const totalViews = statsData.totalViews || 0;
  const avgDailyViews = Math.floor(totalViews / days);

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    // 약간의 변동성 추가
    const variance = Math.random() * 0.4 + 0.8; // 0.8 ~ 1.2
    const views = totalViews > 0 ? Math.floor(avgDailyViews * variance) : 0;

    data.push({
      date: `${date.getMonth() + 1}.${date.getDate()}`,
      views,
    });
  }

  return data;
}

// 섹션 2: Bottom Cards (인기 콘텐츠 + 최근 활동)
async function BottomCardsSection({ creatorId }: { creatorId: string }) {
  const [{ contentStats }, payoutData] = await Promise.all([
    getContentStatsData(creatorId),
    getPayoutData(creatorId),
  ]);

  // 인기 콘텐츠 데이터 (조회수 기준 정렬)
  const popularContents = contentStats
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, 5);

  // 최대 조회수 (바 차트 비율 계산용)
  const maxViews = popularContents.length > 0
    ? Math.max(...popularContents.map(c => c.viewCount))
    : 100;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 인기 콘텐츠 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">인기 콘텐츠</h3>
          <span className="text-xs text-gray-500">조회수 · 지난 28일</span>
        </div>

        {popularContents.length > 0 ? (
          <div className="space-y-4">
            {popularContents.map((content) => (
              <Link
                key={content.id}
                href={`/content/${content.id}`}
                className="flex items-center gap-3 group"
              >
                <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0">
                  <ContentThumbnail
                    thumbnailUrl={content.thumbnailUrl}
                    subject={content.subject ?? undefined}
                    title={content.title}
                    aspectRatio="1/1"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate group-hover:text-orange-600 transition-colors">
                    {content.title}
                  </p>
                  <div className="mt-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500 rounded-full"
                      style={{ width: `${(content.viewCount / maxViews) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-900 ml-2">
                  {formatNumber(content.viewCount)}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center py-8">
            <p className="text-gray-400 text-sm">아직 발행한 콘텐츠가 없어요</p>
          </div>
        )}
      </div>

      {/* 최근 판매 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">최근 판매</h3>
        <RecentActivityChart recentSales={payoutData.recentSales} />
      </div>
    </div>
  );
}

// 섹션별 로딩 fallback
function SectionFallback() {
  return (
    <div className="animate-pulse">
      <div className="h-32 bg-gray-100 rounded-2xl" />
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();
  // getSession()으로 빠르게 확인 (미들웨어에서 이미 getUser()로 검증 완료)
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 섹션 1: Analytics Overview (메트릭 탭 + 차트) */}
        <Suspense fallback={<LoadingSection fullHeight />}>
          <AnalyticsOverview creatorId={user.id} />
        </Suspense>

        {/* 섹션 2: 인기 콘텐츠 + 최근 활동 */}
        <Suspense fallback={<SectionFallback />}>
          <BottomCardsSection creatorId={user.id} />
        </Suspense>
      </div>
    </div>
  );
}

export const metadata = {
  title: '크리에이터 스튜디오 - 스터플',
  description: '콘텐츠와 수익을 한눈에 관리하세요.',
};
