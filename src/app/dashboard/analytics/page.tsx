'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Eye,
  Heart,
  MessageCircle,
  Users,
  DollarSign,
  Calendar,
  ChevronDown,
  BarChart3,
  PieChart,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  FileText,
  Video,
  Mic,
  Image as ImageIcon,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, formatNumber, cn } from '@/lib/utils';
import { Button, Card, CardContent, Badge } from '@/components/ui';

// Time Period Options
const TIME_PERIODS = [
  { value: '7d', label: '최근 7일' },
  { value: '30d', label: '최근 30일' },
  { value: '90d', label: '최근 90일' },
  { value: 'all', label: '전체' },
];

// Mock data for charts (실제 구현시 Supabase에서 조회)
const generateMockChartData = (days: number) => {
  const data = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toISOString().split('T')[0],
      views: Math.floor(Math.random() * 500) + 100,
      revenue: Math.floor(Math.random() * 50000) + 10000,
      subscribers: Math.floor(Math.random() * 10) + 1,
    });
  }
  return data;
};

interface AnalyticsData {
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalSubscribers: number;
  totalRevenue: number;
  viewsChange: number;
  likesChange: number;
  subscribersChange: number;
  revenueChange: number;
  topContents: Array<{
    id: string;
    title: string;
    content_type: string;
    views: number;
    likes: number;
    revenue: number;
  }>;
  contentTypeDistribution: Record<string, number>;
  revenueBySource: {
    subscriptions: number;
    contentSales: number;
    tips: number;
  };
}

export default function AnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('30d');
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [chartData, setChartData] = useState<Array<{ date: string; views: number; revenue: number; subscribers: number }>>([]);

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    const supabase = createClient();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get revenue stats
      const { data: revenueStats } = await supabase
        .from('creator_revenue_stats')
        .select('*')
        .eq('creator_id', user.id)
        .single();

      // Get contents with stats
      const { data: contents } = await supabase
        .from('contents')
        .select('id, title, content_type, view_count, like_count, comment_count')
        .eq('creator_id', user.id)
        .eq('is_published', true)
        .order('view_count', { ascending: false })
        .limit(5);

      // Get subscriber count
      const { count: subscriberCount } = await supabase
        .from('creator_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', user.id)
        .eq('status', 'active');

      // Calculate totals
      const { data: allContents } = await supabase
        .from('contents')
        .select('view_count, like_count, comment_count, content_type')
        .eq('creator_id', user.id);

      const totalViews = allContents?.reduce((sum: number, c: { view_count: number | null }) => sum + (c.view_count || 0), 0) || 0;
      const totalLikes = allContents?.reduce((sum: number, c: { like_count: number | null }) => sum + (c.like_count || 0), 0) || 0;
      const totalComments = allContents?.reduce((sum: number, c: { comment_count: number | null }) => sum + (c.comment_count || 0), 0) || 0;

      // Content type distribution
      const contentTypeDistribution: Record<string, number> = {};
      allContents?.forEach((c: { content_type: string }) => {
        contentTypeDistribution[c.content_type] = (contentTypeDistribution[c.content_type] || 0) + 1;
      });

      // Mock revenue by source (실제로는 payments 테이블에서 계산)
      const totalRevenue = revenueStats?.total_revenue || 0;
      const revenueBySource = {
        subscriptions: Math.floor(totalRevenue * 0.6),
        contentSales: Math.floor(totalRevenue * 0.35),
        tips: Math.floor(totalRevenue * 0.05),
      };

      // Get top contents with revenue (simplified)
      type ContentItem = {
        id: string;
        title: string;
        content_type: string;
        view_count: number | null;
        like_count: number | null;
        comment_count: number | null;
      };
      const topContents = (contents || []).map((c: ContentItem) => ({
        ...c,
        views: c.view_count,
        likes: c.like_count,
        revenue: Math.floor(Math.random() * 100000), // Mock data
      }));

      setAnalytics({
        totalViews,
        totalLikes,
        totalComments,
        totalSubscribers: subscriberCount || 0,
        totalRevenue,
        viewsChange: Math.random() * 40 - 10, // Mock: -10% to +30%
        likesChange: Math.random() * 40 - 10,
        subscribersChange: Math.random() * 30,
        revenueChange: Math.random() * 50 - 10,
        topContents,
        contentTypeDistribution,
        revenueBySource,
      });

      // Generate chart data
      const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
      setChartData(generateMockChartData(days));
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return Video;
      case 'audio': return Mic;
      case 'image': return ImageIcon;
      default: return FileText;
    }
  };

  const StatCard = ({
    title,
    value,
    change,
    icon: Icon,
    format = 'number',
  }: {
    title: string;
    value: number;
    change: number;
    icon: React.ElementType;
    format?: 'number' | 'currency';
  }) => {
    const isPositive = change >= 0;
    const displayValue = format === 'currency' ? formatCurrency(value) : formatNumber(value);

    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">{title}</p>
              <p className="text-2xl font-bold text-gray-900">{displayValue}</p>
              <div className={cn(
                'flex items-center gap-1 mt-2 text-sm',
                isPositive ? 'text-green-600' : 'text-red-600'
              )}>
                {isPositive ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <ArrowDownRight className="w-4 h-4" />
                )}
                <span>{Math.abs(change).toFixed(1)}%</span>
                <span className="text-gray-400">vs 이전 기간</span>
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl">
              <Icon className="w-6 h-6 text-gray-900" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Simple bar chart component
  const SimpleBarChart = ({ data, dataKey, color }: { data: typeof chartData; dataKey: 'views' | 'revenue'; color: string }) => {
    const maxValue = Math.max(...data.map((d) => d[dataKey]));
    const displayData = data.slice(-14); // Show last 14 points

    return (
      <div className="flex items-end gap-1 h-32">
        {displayData.map((d, i) => (
          <div
            key={i}
            className="flex-1 rounded-t transition-all hover:opacity-80"
            style={{
              height: `${(d[dataKey] / maxValue) * 100}%`,
              backgroundColor: color,
              minHeight: '4px',
            }}
            title={`${d.date}: ${dataKey === 'revenue' ? formatCurrency(d[dataKey]) : formatNumber(d[dataKey])}`}
          />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-900" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">분석</h1>
                <p className="text-gray-500 text-sm mt-1">채널 성과를 확인하세요</p>
              </div>
            </div>

            {/* Period Selector */}
            <div className="relative">
              <Button
                variant="outline"
                onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
                className="gap-2"
              >
                <Calendar className="w-4 h-4" />
                {TIME_PERIODS.find((p) => p.value === period)?.label}
                <ChevronDown className="w-4 h-4" />
              </Button>
              {showPeriodDropdown && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-10">
                  {TIME_PERIODS.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => {
                        setPeriod(p.value);
                        setShowPeriodDropdown(false);
                      }}
                      className={cn(
                        'w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors',
                        period === p.value ? 'text-gray-900 font-medium' : 'text-gray-700'
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="총 조회수"
            value={analytics?.totalViews || 0}
            change={analytics?.viewsChange || 0}
            icon={Eye}
          />
          <StatCard
            title="총 좋아요"
            value={analytics?.totalLikes || 0}
            change={analytics?.likesChange || 0}
            icon={Heart}
          />
          <StatCard
            title="구독자"
            value={analytics?.totalSubscribers || 0}
            change={analytics?.subscribersChange || 0}
            icon={Users}
          />
          <StatCard
            title="총 수익"
            value={analytics?.totalRevenue || 0}
            change={analytics?.revenueChange || 0}
            icon={DollarSign}
            format="currency"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Views Chart */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">조회수 추이</h3>
                  <p className="text-sm text-gray-500">최근 {period === '7d' ? '7일' : period === '30d' ? '30일' : '90일'}</p>
                </div>
                <Activity className="w-5 h-5 text-gray-400" />
              </div>
              <SimpleBarChart data={chartData} dataKey="views" color="#3B82F6" />
              <div className="flex justify-between mt-2 text-xs text-gray-400">
                <span>{chartData[0]?.date}</span>
                <span>{chartData[chartData.length - 1]?.date}</span>
              </div>
            </CardContent>
          </Card>

          {/* Revenue Chart */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">수익 추이</h3>
                  <p className="text-sm text-gray-500">최근 {period === '7d' ? '7일' : period === '30d' ? '30일' : '90일'}</p>
                </div>
                <TrendingUp className="w-5 h-5 text-gray-400" />
              </div>
              <SimpleBarChart data={chartData} dataKey="revenue" color="#10B981" />
              <div className="flex justify-between mt-2 text-xs text-gray-400">
                <span>{chartData[0]?.date}</span>
                <span>{chartData[chartData.length - 1]?.date}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Breakdown & Content Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue by Source */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-gray-900">수익 구성</h3>
                <PieChart className="w-5 h-5 text-gray-400" />
              </div>
              <div className="space-y-4">
                {[
                  { label: '구독 수익', value: analytics?.revenueBySource.subscriptions || 0, color: 'bg-blue-500' },
                  { label: '콘텐츠 판매', value: analytics?.revenueBySource.contentSales || 0, color: 'bg-green-500' },
                  { label: '후원/팁', value: analytics?.revenueBySource.tips || 0, color: 'bg-purple-500' },
                ].map((item) => {
                  const total = analytics?.totalRevenue || 1;
                  const percentage = (item.value / total) * 100;
                  return (
                    <div key={item.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{item.label}</span>
                        <span className="font-medium text-gray-900">{formatCurrency(item.value)}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={cn('h-full rounded-full', item.color)}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Content Type Distribution */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-gray-900">콘텐츠 유형</h3>
                <BarChart3 className="w-5 h-5 text-gray-400" />
              </div>
              <div className="space-y-4">
                {Object.entries(analytics?.contentTypeDistribution || {}).map(([type, count]) => {
                  const total = Object.values(analytics?.contentTypeDistribution || {}).reduce((a: number, b: number) => a + b, 0) || 1;
                  const percentage = (count / total) * 100;
                  const labels: Record<string, string> = {
                    video: '동영상',
                    audio: '오디오',
                    image: '이미지',
                    document: '문서',
                    post: '포스트',
                  };
                  const colors: Record<string, string> = {
                    video: 'bg-red-500',
                    audio: 'bg-yellow-500',
                    image: 'bg-pink-500',
                    document: 'bg-indigo-500',
                    post: 'bg-gray-500',
                  };
                  return (
                    <div key={type}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{labels[type] || type}</span>
                        <span className="font-medium text-gray-900">{count}개</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={cn('h-full rounded-full', colors[type] || 'bg-gray-400')}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                {Object.keys(analytics?.contentTypeDistribution || {}).length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-4">콘텐츠가 없습니다</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Contents */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-gray-900">인기 콘텐츠</h3>
              <Link href="/dashboard/contents" className="text-sm text-gray-900 hover:text-gray-700">
                전체보기
              </Link>
            </div>
            {(analytics?.topContents?.length || 0) > 0 ? (
              <div className="space-y-4">
                {analytics?.topContents.map((content, index) => {
                  const Icon = getContentTypeIcon(content.content_type);
                  return (
                    <div
                      key={content.id}
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-8 h-8 flex items-center justify-center text-lg font-bold text-gray-400">
                        {index + 1}
                      </div>
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <Icon className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{content.title}</h4>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {formatNumber(content.views)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3" />
                            {formatNumber(content.likes)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatCurrency(content.revenue)}</p>
                        <p className="text-xs text-gray-500">수익</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">아직 콘텐츠가 없습니다</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
