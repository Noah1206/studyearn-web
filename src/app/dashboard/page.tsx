import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  CreditCard,
  Eye,
  Heart,
  Plus,
  Sparkles,
  BookOpen,
  Video,
  Mic,
  Image as ImageIcon,
  ChevronRight,
  CheckCircle2,
  BarChart3,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, LoadingSection } from '@/components/ui';
import { PayoutCard } from './PayoutCard';

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
  revenue: number;
  createdAt: string;
}

interface PayoutInfo {
  id: string;
  amount: number;
  status: string;
  requested_at: string;
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
  const startMonth = `${sixMonthsAgo.getFullYear()}-${String(sixMonthsAgo.getMonth() + 1).padStart(2, '0')}`;

  const [revenueStatsResult, contentsCountResult] = await Promise.all([
    supabase
      .from('creator_revenue_stats')
      .select('*')
      .eq('creator_id', creatorId)
      .gte('year_month', startMonth)
      .order('year_month', { ascending: false }),
    supabase
      .from('contents')
      .select('id, view_count')
      .eq('creator_id', creatorId)
      .eq('is_published', true),
  ]);

  const revenueStats = revenueStatsResult.data || [];
  const contents = contentsCountResult.data || [];
  const totalRevenue = revenueStats.reduce((sum: number, stat: { total_revenue: number | null }) => sum + (stat.total_revenue || 0), 0);
  const totalViews = contents.reduce((sum: number, c: { view_count: number }) => sum + c.view_count, 0);
  const currentMonthRevenue = revenueStats[0]?.total_revenue || 0;
  const lastMonthRevenue = revenueStats[1]?.total_revenue || 0;

  return {
    totalRevenue,
    currentMonthRevenue,
    lastMonthRevenue,
    contentCount: contents.length,
    totalViews,
    revenueStats: revenueStats.map((stat: { year_month: string; total_revenue: number; subscription_revenue: number; content_revenue: number }) => ({
      yearMonth: stat.year_month,
      totalRevenue: stat.total_revenue,
      subscriptionRevenue: stat.subscription_revenue,
      contentRevenue: stat.content_revenue,
    })),
  };
}

async function getPayoutData(creatorId: string) {
  const supabase = await createClient();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  const startMonth = `${sixMonthsAgo.getFullYear()}-${String(sixMonthsAgo.getMonth() + 1).padStart(2, '0')}`;

  const [revenueStatsResult, pendingPayoutsResult, completedPayoutsResult, recentPurchasesResult] = await Promise.all([
    supabase
      .from('creator_revenue_stats')
      .select('total_revenue')
      .eq('creator_id', creatorId)
      .gte('year_month', startMonth),
    supabase
      .from('creator_payouts')
      .select('*')
      .eq('creator_id', creatorId)
      .in('status', ['pending', 'processing'])
      .order('requested_at', { ascending: false }),
    supabase
      .from('creator_payouts')
      .select('*')
      .eq('creator_id', creatorId)
      .eq('status', 'completed')
      .order('processed_at', { ascending: false })
      .limit(5),
    supabase
      .from('content_purchases')
      .select(`
        id, creator_revenue, created_at,
        content:contents!content_id (title),
        buyer:profiles!user_id (display_name)
      `)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  const totalRevenue = revenueStatsResult.data?.reduce((sum: number, stat: { total_revenue: number | null }) => sum + (stat.total_revenue || 0), 0) || 0;
  const pendingPayouts = pendingPayoutsResult.data || [];
  const completedPayouts = completedPayoutsResult.data || [];
  const totalPaidOut = completedPayouts.reduce((sum: number, p: { amount: number | null }) => sum + (p.amount || 0), 0);
  const totalPending = pendingPayouts.reduce((sum: number, p: { amount: number | null }) => sum + (p.amount || 0), 0);
  const availableBalance = totalRevenue - totalPaidOut - totalPending;

  const recentSales: SaleItem[] = recentPurchasesResult.data?.map((purchase: {
    id: string;
    creator_revenue: number | null;
    created_at: string;
    content: { title: string } | null;
    buyer: { display_name: string | null } | null;
  }) => ({
    id: purchase.id,
    type: 'content' as const,
    title: purchase.content?.title || '콘텐츠',
    amount: purchase.creator_revenue || 0,
    createdAt: purchase.created_at,
    buyerName: purchase.buyer?.display_name || undefined,
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
  created_at: string;
}

async function getContentStatsData(creatorId: string) {
  const supabase = await createClient();

  const { data: contents } = await supabase
    .from('contents')
    .select('id, title, content_type, access_level, view_count, like_count, created_at')
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
        revenue: purchaseInfo.revenue,
        createdAt: content.created_at,
      };
    });
  }

  return { contentStats };
}

// Minimal Stat Card Component - Toss Style
function StatCard({
  title,
  value,
  subValue,
  trend,
  trendValue,
}: {
  title: string;
  value: string;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100">
      <p className="text-gray-500 text-sm font-medium">{title}</p>
      <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
      {trend && trendValue && (
        <div className={`flex items-center gap-1 mt-2 text-sm font-medium ${
          trend === 'up' ? 'text-orange-500' : trend === 'down' ? 'text-red-500' : 'text-gray-400'
        }`}>
          {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : trend === 'down' ? <TrendingDown className="w-4 h-4" /> : null}
          {trendValue}
        </div>
      )}
      {subValue && <p className="text-gray-400 text-sm mt-2">{subValue}</p>}
    </div>
  );
}

// Quick Action Button
function QuickAction({
  icon: Icon,
  label,
  href,
  disabled,
}: {
  icon: React.ElementType;
  label: string;
  href: string;
  disabled?: boolean;
}) {
  const content = (
    <div className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border transition-all ${
      disabled
        ? 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-50'
        : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm cursor-pointer'
    }`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
        disabled ? 'bg-gray-100' : 'bg-gray-100'
      }`}>
        <Icon className={`w-6 h-6 ${disabled ? 'text-gray-300' : 'text-gray-600'}`} />
      </div>
      <span className={`text-sm font-medium ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
        {label}
      </span>
    </div>
  );

  if (disabled) return content;

  return <Link href={href}>{content}</Link>;
}

// Empty State Component
function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-3">
        <Icon className="w-6 h-6 text-gray-400" />
      </div>
      <h3 className="text-gray-900 font-semibold mb-1">{title}</h3>
      <p className="text-gray-500 text-sm text-center max-w-xs mb-4">{description}</p>
      {action && (
        <Link href={action.href}>
          <Button size="sm" variant="outline">{action.label}</Button>
        </Link>
      )}
    </div>
  );
}

// Content Type Icon
function getContentTypeIcon(type: string) {
  switch (type) {
    case 'video': return Video;
    case 'audio': return Mic;
    case 'image': return ImageIcon;
    case 'document': return BookOpen;
    default: return FileText;
  }
}

const accessLevelLabels: Record<string, string> = {
  public: '공개',
  subscribers: '구독자 전용',
  tier: '티어 전용',
  paid: '유료',
};

// 섹션 1: Stats Grid + Quick Actions (가장 빠르게 로드되어야 할 핵심 섹션)
async function StatsSection({ creatorId }: { creatorId: string }) {
  const data = await getStatsData(creatorId);

  const revenueChange = data.lastMonthRevenue > 0
    ? ((data.currentMonthRevenue - data.lastMonthRevenue) / data.lastMonthRevenue * 100).toFixed(0)
    : '0';
  const isPositiveChange = data.currentMonthRevenue >= data.lastMonthRevenue;
  const isNewCreator = data.contentCount === 0;

  return (
    <>
      {/* Welcome Banner for New Creators */}
      {isNewCreator && (
        <div className="mb-6 bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-orange-500" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-900 mb-1">
                크리에이터로 첫 걸음을 내딛으셨네요!
              </h2>
              <p className="text-gray-500 text-sm mb-4">
                첫 콘텐츠를 업로드하고 팬들과 소통하며 수익을 창출해보세요.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link href="/dashboard/upload">
                  <Button size="sm">첫 콘텐츠 업로드</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
        <StatCard
          title="총 수익"
          value={formatCurrency(data.totalRevenue)}
          subValue="누적 수익"
        />
        <StatCard
          title="이번 달 수익"
          value={formatCurrency(data.currentMonthRevenue)}
          trend={isPositiveChange ? 'up' : 'down'}
          trendValue={`${isPositiveChange ? '+' : ''}${revenueChange}%`}
        />
        <StatCard
          title="발행 콘텐츠"
          value={formatNumber(data.contentCount)}
          subValue={`총 ${formatNumber(data.totalViews)} 조회`}
        />
      </div>

      {/* Quick Actions (정산 신청 버튼 활성화는 별도 섹션에서) */}
      <div className="mb-8">
        <h2 className="text-base font-semibold text-gray-900 mb-4">빠른 작업</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <QuickAction icon={Plus} label="콘텐츠 업로드" href="/dashboard/upload" />
          <QuickAction icon={BarChart3} label="상세 분석" href="/dashboard/analytics" />
          <Suspense fallback={<QuickAction icon={CreditCard} label="정산 신청" href="/dashboard/payout" disabled />}>
            <PayoutButtonSection creatorId={creatorId} />
          </Suspense>
        </div>
      </div>
    </>
  );
}

// 정산 버튼 활성화 상태 (별도 스트리밍)
async function PayoutButtonSection({ creatorId }: { creatorId: string }) {
  const data = await getPayoutData(creatorId);
  return (
    <QuickAction
      icon={CreditCard}
      label="정산 신청"
      href="/dashboard/payout"
      disabled={data.availableBalance < 10000}
    />
  );
}

// 섹션 2: Revenue Chart + Payout Card
async function RevenuePayoutSection({ creatorId }: { creatorId: string }) {
  const [statsData, payoutData] = await Promise.all([
    getStatsData(creatorId),
    getPayoutData(creatorId),
  ]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      {/* Revenue Chart - Left */}
      <Card className="lg:col-span-2 border-gray-100 shadow-none flex flex-col">
        <CardHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">월별 수익 추이</CardTitle>
            <Link href="/dashboard/analytics" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-0.5">
              자세히 보기
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6 flex-1">
          {statsData.revenueStats.length > 0 ? (
            <div className="space-y-3">
              {statsData.revenueStats.slice(0, 6).reverse().map((stat: RevenueStats, index: number) => {
                const maxRevenue = Math.max(...statsData.revenueStats.map((s: RevenueStats) => s.totalRevenue));
                const percentage = maxRevenue > 0 ? (stat.totalRevenue / maxRevenue) * 100 : 0;
                const isCurrentMonth = index === statsData.revenueStats.slice(0, 6).length - 1;

                return (
                  <div key={stat.yearMonth} className="flex items-center gap-3">
                    <div className="w-10 text-sm text-gray-500 font-medium">
                      {stat.yearMonth.split('-')[1]}월
                    </div>
                    <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden relative">
                      <div
                        className={`h-full rounded-lg transition-all duration-500 ${
                          isCurrentMonth ? 'bg-orange-500' : 'bg-gray-300'
                        }`}
                        style={{ width: `${Math.max(percentage, 2)}%` }}
                      />
                    </div>
                    <div className="w-24 text-right text-sm font-semibold text-gray-900">
                      {formatCurrency(stat.totalRevenue)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={BarChart3}
              title="아직 수익 데이터가 없어요"
              description="첫 수익이 발생하면 여기에 월별 추이가 표시됩니다"
            />
          )}
        </CardContent>
      </Card>

      {/* Payout Card - Right */}
      <div className="flex flex-col">
        <PayoutCard
          availableBalance={payoutData.availableBalance}
          recentSales={payoutData.recentSales}
          pendingAmount={payoutData.pendingPayouts.reduce((sum: number, p: PayoutInfo) => sum + p.amount, 0)}
          className="flex-1"
        />
      </div>
    </div>
  );
}

// 섹션 3: Content Performance
async function ContentPerformanceSection({ creatorId }: { creatorId: string }) {
  const { contentStats } = await getContentStatsData(creatorId);

  return (
    <div className="grid grid-cols-1 gap-6 mb-6">
      <Card className="border-gray-100 shadow-none flex flex-col">
        <CardHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">콘텐츠 성과</CardTitle>
            <Link href="/dashboard/contents" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-0.5">
              전체 보기
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6 flex-1">
          {contentStats.length > 0 ? (
            <div className="space-y-3">
              {contentStats.slice(0, 5).map((content: ContentStats) => {
                const ContentIcon = getContentTypeIcon(content.contentType);
                return (
                  <Link
                    key={content.id}
                    href={`/content/${content.id}`}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0 border border-gray-100">
                      <ContentIcon className="w-6 h-6 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">
                        {content.title}
                      </h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {formatNumber(content.viewCount)}
                        </span>
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          {formatNumber(content.likeCount)}
                        </span>
                        <Badge variant="outline">
                          {accessLevelLabels[content.accessLevel]}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">
                        {formatCurrency(content.revenue)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {content.purchaseCount}건
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={FileText}
              title="아직 발행한 콘텐츠가 없어요"
              description="첫 콘텐츠를 업로드하고 팬들과 소통을 시작하세요"
              action={{ label: "콘텐츠 업로드", href: "/dashboard/upload" }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// 섹션 4: Recent Payouts
async function RecentPayoutsSection({ creatorId }: { creatorId: string }) {
  const { completedPayouts } = await getPayoutData(creatorId);

  if (completedPayouts.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-3 border-gray-100 shadow-none">
        <CardHeader className="p-6 pb-4">
          <CardTitle className="text-base font-semibold">최근 정산</CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {completedPayouts.slice(0, 3).map((payout: PayoutInfo) => (
              <div key={payout.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(payout.amount)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDate(payout.processed_at || payout.requested_at)}
                    </p>
                  </div>
                </div>
                <Badge variant="success">완료</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
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
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirectTo=/dashboard');
  }

  const { data: creatorCheck } = await supabase
    .from('creator_settings')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!creatorCheck) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 py-6">
        {/* 섹션 1: Stats + Quick Actions - 최우선 로드 */}
        <Suspense fallback={<LoadingSection fullHeight />}>
          <StatsSection creatorId={user.id} />
        </Suspense>

        {/* 섹션 2: Revenue Chart + Payout Card */}
        <Suspense fallback={<SectionFallback />}>
          <RevenuePayoutSection creatorId={user.id} />
        </Suspense>

        {/* 섹션 3: Content Performance */}
        <Suspense fallback={<SectionFallback />}>
          <ContentPerformanceSection creatorId={user.id} />
        </Suspense>

        {/* 섹션 4: Recent Payouts */}
        <Suspense fallback={null}>
          <RecentPayoutsSection creatorId={user.id} />
        </Suspense>
      </div>
    </div>
  );
}

export const metadata = {
  title: '크리에이터 스튜디오 - 스터플',
  description: '콘텐츠와 수익을 한눈에 관리하세요.',
};
