import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  FileText,
  Eye,
  Heart,
  Sparkles,
  BookOpen,
  Video,
  Mic,
  Image as ImageIcon,
  CheckCircle2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, LoadingSection } from '@/components/ui';
import { ContentThumbnail } from '@/components/content';
import { PayoutCard } from './PayoutCard';
import { RevenueChart } from './RevenueChart';

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
      .select('total_earned')
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

// Minimal Stat Card Component - Toss Style
function StatCard({
  title,
  value,
  subValue,
  trend,
  trendValue,
  href,
}: {
  title: string;
  value: string;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  href?: string;
}) {
  const content = (
    <div className={`bg-white rounded-2xl p-6 shadow-sm ${href ? 'hover:shadow-md hover:scale-[1.01] transition-all duration-200 cursor-pointer' : 'transition-shadow duration-200 hover:shadow-md'}`}>
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

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
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
        <div className="mb-6 bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl shadow-sm p-6 animate-fade-in">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-white/80 rounded-xl flex items-center justify-center flex-shrink-0">
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
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="animate-slide-up" style={{ animationDelay: '0ms', animationFillMode: 'both' }}>
          <StatCard
            title="총 수익"
            value={formatCurrency(data.totalRevenue)}
            subValue="누적 수익"
          />
        </div>
        <div className="animate-slide-up" style={{ animationDelay: '50ms', animationFillMode: 'both' }}>
          <StatCard
            title="이번 달 수익"
            value={formatCurrency(data.currentMonthRevenue)}
            trend={isPositiveChange ? 'up' : 'down'}
            trendValue={`${isPositiveChange ? '+' : ''}${revenueChange}%`}
          />
        </div>
        <div className="animate-slide-up" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
          <StatCard
            title="발행 콘텐츠"
            value={formatNumber(data.contentCount)}
            subValue={`총 ${formatNumber(data.totalViews)} 조회`}
            href="/dashboard/contents"
          />
        </div>
      </div>

    </>
  );
}

// 섹션 2: Revenue Chart + Payout Card
async function RevenuePayoutSection({ creatorId }: { creatorId: string }) {
  const [statsData, payoutData] = await Promise.all([
    getStatsData(creatorId),
    getPayoutData(creatorId),
  ]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 animate-fade-in">
      {/* Revenue Chart - Left */}
      <Card className="lg:col-span-2 border-0 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col">
        <CardHeader className="p-6 pb-4">
          <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wide">월별 수익 추이</CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6 flex-1">
          <RevenueChart data={statsData.revenueStats} />
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
    <div className="grid grid-cols-1 gap-6 mb-6 animate-fade-in">
      <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col">
        <CardHeader className="p-6 pb-4">
          <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wide">콘텐츠 성과</CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6 flex-1">
          {contentStats.length > 0 ? (
            <div className="space-y-3">
              {contentStats.slice(0, 5).map((content: ContentStats) => {
                return (
                  <Link
                    key={content.id}
                    href={`/content/${content.id}`}
                    className="flex items-center gap-4 p-4 bg-gray-50/50 rounded-xl hover:bg-gray-100 hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                      <ContentThumbnail
                        thumbnailUrl={content.thumbnailUrl}
                        subject={content.subject ?? undefined}
                        title={content.title}
                        aspectRatio="1/1"
                      />
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
                        {content.price > 0 ? formatCurrency(content.price) : '무료'}
                      </p>
                      {content.purchaseCount > 0 && (
                        <p className="text-sm text-green-600">
                          수익 {formatCurrency(content.revenue)} · {content.purchaseCount}건
                        </p>
                      )}
                      {content.purchaseCount === 0 && content.price > 0 && (
                        <p className="text-sm text-gray-400">
                          아직 판매 없음
                        </p>
                      )}
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
      <Card className="lg:col-span-3 border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader className="p-6 pb-4">
          <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wide">최근 정산</CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {completedPayouts.slice(0, 3).map((payout: PayoutInfo) => (
              <div key={payout.id} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-xl hover:bg-gray-100 transition-colors duration-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(payout.amount)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDate(payout.processed_at || payout.created_at)}
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
