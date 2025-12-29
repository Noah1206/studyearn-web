'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Lightbulb,
  TrendingUp,
  TrendingDown,
  Target,
  Users,
  Clock,
  Calendar,
  BarChart3,
  Zap,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Star,
  Award,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, formatNumber, cn } from '@/lib/utils';
import { Button, Card, CardContent, Badge, Spinner } from '@/components/ui';

// Insight Types
type InsightType = 'success' | 'opportunity' | 'warning' | 'tip';

interface Insight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  metric?: string;
  action?: {
    label: string;
    href: string;
  };
  priority: number;
}

interface Goal {
  id: string;
  title: string;
  current: number;
  target: number;
  unit: string;
  deadline?: string;
}

interface Recommendation {
  id: string;
  category: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
}

// Insight Config
const insightTypeConfig: Record<InsightType, { color: string; icon: React.ElementType; bg: string }> = {
  success: { color: 'text-green-600', icon: CheckCircle2, bg: 'bg-green-100' },
  opportunity: { color: 'text-blue-600', icon: Sparkles, bg: 'bg-blue-100' },
  warning: { color: 'text-yellow-600', icon: AlertTriangle, bg: 'bg-yellow-100' },
  tip: { color: 'text-purple-600', icon: Lightbulb, bg: 'bg-purple-100' },
};

// Default Recommendations (these are general best practices)
const defaultRecommendations: Recommendation[] = [
  {
    id: '1',
    category: '콘텐츠',
    title: '시리즈 콘텐츠 제작',
    description: '연결된 콘텐츠 시리즈를 만들면 구독 전환율이 평균 2배 높아집니다.',
    impact: 'high',
    effort: 'medium',
  },
  {
    id: '2',
    category: '마케팅',
    title: '소셜 미디어 연동',
    description: 'Instagram, YouTube 등 외부 채널에서 트래픽을 유도해보세요.',
    impact: 'high',
    effort: 'low',
  },
  {
    id: '3',
    category: '수익화',
    title: '프리미엄 티어 추가',
    description: '고가 티어를 추가하면 상위 10% 팬의 ARPU를 2배 이상 높일 수 있습니다.',
    impact: 'medium',
    effort: 'low',
  },
  {
    id: '4',
    category: '참여',
    title: '주간 라이브 진행',
    description: '정기 라이브는 커뮤니티 참여도와 충성도를 크게 높입니다.',
    impact: 'high',
    effort: 'high',
  },
];

interface WeeklyStats {
  views: number;
  viewsChange: number;
  newSubscribers: number;
  subscribersChange: number;
  revenue: number;
  revenueChange: number;
  engagementRate: number;
  engagementChange: number;
}

interface TopContent {
  id: string;
  title: string;
  views: number;
  likes: number;
}

export default function InsightsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null);
  const [topContents, setTopContents] = useState<TopContent[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const supabase = createClient();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Date calculations
      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const twoWeeksAgo = new Date(today);
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const monthAgo = new Date(today);
      monthAgo.setDate(monthAgo.getDate() - 30);

      // Get all contents for this creator
      const { data: allContents } = await supabase
        .from('contents')
        .select('id, title, view_count, like_count, created_at')
        .eq('creator_id', user.id);

      type ContentItem = { id: string; title: string; view_count: number | null; like_count: number | null; created_at: string };
      const contentIds = allContents?.map((c: ContentItem) => c.id) || [];

      // Calculate weekly views
      let weeklyViews = 0;
      let prevWeekViews = 0;
      if (contentIds.length > 0) {
        const { count: currentWeekViews } = await supabase
          .from('content_views')
          .select('*', { count: 'exact', head: true })
          .in('content_id', contentIds)
          .gte('viewed_at', weekAgo.toISOString());
        weeklyViews = currentWeekViews || 0;

        const { count: lastWeekViews } = await supabase
          .from('content_views')
          .select('*', { count: 'exact', head: true })
          .in('content_id', contentIds)
          .gte('viewed_at', twoWeeksAgo.toISOString())
          .lt('viewed_at', weekAgo.toISOString());
        prevWeekViews = lastWeekViews || 0;
      }
      const viewsChange = prevWeekViews > 0
        ? ((weeklyViews - prevWeekViews) / prevWeekViews) * 100
        : weeklyViews > 0 ? 100 : 0;

      // Calculate new subscribers this week
      const { count: newSubs } = await supabase
        .from('creator_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', user.id)
        .gte('created_at', weekAgo.toISOString());
      const { count: prevNewSubs } = await supabase
        .from('creator_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', user.id)
        .gte('created_at', twoWeeksAgo.toISOString())
        .lt('created_at', weekAgo.toISOString());
      const subscribersChange = (prevNewSubs || 0) > 0
        ? (((newSubs || 0) - (prevNewSubs || 0)) / (prevNewSubs || 1)) * 100
        : (newSubs || 0) > 0 ? 100 : 0;

      // Calculate weekly revenue
      const { data: weeklyPurchases } = await supabase
        .from('purchases')
        .select('amount')
        .eq('seller_id', user.id)
        .eq('status', 'completed')
        .gte('created_at', weekAgo.toISOString());
      const { data: prevWeekPurchases } = await supabase
        .from('purchases')
        .select('amount')
        .eq('seller_id', user.id)
        .eq('status', 'completed')
        .gte('created_at', twoWeeksAgo.toISOString())
        .lt('created_at', weekAgo.toISOString());

      type PurchaseItem = { amount: number | null };
      const weeklyRevenue = weeklyPurchases?.reduce((sum: number, p: PurchaseItem) => sum + (p.amount || 0), 0) || 0;
      const prevWeekRevenue = prevWeekPurchases?.reduce((sum: number, p: PurchaseItem) => sum + (p.amount || 0), 0) || 0;
      const revenueChange = prevWeekRevenue > 0
        ? ((weeklyRevenue - prevWeekRevenue) / prevWeekRevenue) * 100
        : weeklyRevenue > 0 ? 100 : 0;

      // Calculate engagement rate (likes / views)
      let weeklyLikes = 0;
      if (contentIds.length > 0) {
        const { count: likes } = await supabase
          .from('content_likes')
          .select('*', { count: 'exact', head: true })
          .in('content_id', contentIds)
          .gte('created_at', weekAgo.toISOString());
        weeklyLikes = likes || 0;
      }
      const engagementRate = weeklyViews > 0 ? (weeklyLikes / weeklyViews) * 100 : 0;

      // Set weekly stats
      setWeeklyStats({
        views: weeklyViews,
        viewsChange,
        newSubscribers: newSubs || 0,
        subscribersChange,
        revenue: weeklyRevenue,
        revenueChange,
        engagementRate,
        engagementChange: 0, // Would need previous week data
      });

      // Get top performing contents
      const { data: topContentsData } = await supabase
        .from('contents')
        .select('id, title, view_count, like_count')
        .eq('creator_id', user.id)
        .eq('is_published', true)
        .order('view_count', { ascending: false })
        .limit(3);

      type TopContentData = { id: string; title: string; view_count: number | null; like_count: number | null };
      setTopContents(
        (topContentsData || []).map((c: TopContentData) => ({
          id: c.id,
          title: c.title,
          views: c.view_count || 0,
          likes: c.like_count || 0,
        }))
      );

      // Generate dynamic insights based on real data
      const generatedInsights: Insight[] = [];

      // Views insight
      if (viewsChange > 20) {
        generatedInsights.push({
          id: 'views-up',
          type: 'success',
          title: `조회수가 지난 주 대비 ${Math.round(viewsChange)}% 증가했어요!`,
          description: '좋은 성과입니다. 이 추세를 유지해보세요.',
          metric: `+${Math.round(viewsChange)}%`,
          priority: 1,
        });
      } else if (viewsChange < -20) {
        generatedInsights.push({
          id: 'views-down',
          type: 'warning',
          title: `조회수가 지난 주 대비 ${Math.abs(Math.round(viewsChange))}% 감소했어요`,
          description: '콘텐츠 홍보나 새로운 콘텐츠 업로드를 고려해보세요.',
          metric: `${Math.round(viewsChange)}%`,
          priority: 1,
        });
      }

      // Content upload insight
      const recentContent = allContents?.filter(
        (c: ContentItem) => new Date(c.created_at) >= weekAgo
      );
      if (!recentContent || recentContent.length === 0) {
        generatedInsights.push({
          id: 'no-content',
          type: 'warning',
          title: '이번 주 콘텐츠 업로드가 없어요',
          description: '꾸준한 업로드가 구독자 유지에 중요합니다. 새 콘텐츠를 계획해보세요.',
          action: { label: '콘텐츠 업로드', href: '/dashboard/upload' },
          priority: 2,
        });
      } else if (recentContent.length >= 3) {
        generatedInsights.push({
          id: 'active-creator',
          type: 'success',
          title: '이번 주 활발하게 활동하고 있어요!',
          description: `${recentContent.length}개의 콘텐츠를 업로드했습니다.`,
          metric: `${recentContent.length}개`,
          priority: 2,
        });
      }

      // Subscriber insight
      if ((newSubs || 0) > 0) {
        generatedInsights.push({
          id: 'new-subs',
          type: 'success',
          title: `이번 주 ${newSubs}명의 새 구독자가 생겼어요!`,
          description: '새 구독자들에게 환영 메시지를 보내보는 건 어떨까요?',
          metric: `+${newSubs}명`,
          priority: 3,
        });
      }

      // Revenue insight
      if (weeklyRevenue > 0 && revenueChange > 10) {
        generatedInsights.push({
          id: 'revenue-up',
          type: 'success',
          title: `수익이 ${Math.round(revenueChange)}% 증가했어요!`,
          description: formatCurrency(weeklyRevenue) + ' 수익을 달성했습니다.',
          metric: `+${Math.round(revenueChange)}%`,
          priority: 4,
        });
      }

      // Conversion opportunity
      const totalViews = allContents?.reduce((sum: number, c: ContentItem) => sum + (c.view_count || 0), 0) || 0;
      const { count: totalPurchases } = await supabase
        .from('purchases')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', user.id)
        .eq('status', 'completed');
      const conversionRate = totalViews > 0 ? ((totalPurchases || 0) / totalViews) * 100 : 0;

      if (totalViews > 100 && conversionRate < 1) {
        generatedInsights.push({
          id: 'conversion',
          type: 'opportunity',
          title: '콘텐츠 판매를 늘릴 수 있어요',
          description: '조회수 대비 구매 전환율이 낮습니다. 콘텐츠 설명을 보강해보세요.',
          action: { label: '콘텐츠 관리', href: '/dashboard/contents' },
          priority: 5,
        });
      }

      // Best time tip
      generatedInsights.push({
        id: 'best-time',
        type: 'tip',
        title: '오후 7-9시에 게시하면 효과적이에요',
        description: '일반적으로 저녁 시간대 게시 시 참여율이 높습니다.',
        priority: 10,
      });

      setInsights(generatedInsights.sort((a, b) => a.priority - b.priority));

      // Generate goals based on current performance
      const { count: totalSubs } = await supabase
        .from('creator_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', user.id)
        .eq('status', 'active');

      const { data: monthlyPurchases } = await supabase
        .from('purchases')
        .select('amount')
        .eq('seller_id', user.id)
        .eq('status', 'completed')
        .gte('created_at', monthAgo.toISOString());
      const monthlyRevenue = monthlyPurchases?.reduce((sum: number, p: PurchaseItem) => sum + (p.amount || 0), 0) || 0;

      const avgViewsPerContent = allContents && allContents.length > 0
        ? Math.round(allContents.reduce((sum: number, c: ContentItem) => sum + (c.view_count || 0), 0) / allContents.length)
        : 0;

      // Set dynamic goals
      const currentMonth = today.toISOString().slice(0, 7);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        .toISOString().split('T')[0];

      const dynamicGoals: Goal[] = [
        {
          id: 'subs-goal',
          title: '월간 구독자 100명 달성',
          current: totalSubs || 0,
          target: Math.max(100, Math.ceil((totalSubs || 0) * 1.2)),
          unit: '명',
          deadline: endOfMonth,
        },
        {
          id: 'revenue-goal',
          title: '월 수익 100만원 달성',
          current: monthlyRevenue,
          target: Math.max(1000000, Math.ceil(monthlyRevenue * 1.5)),
          unit: '원',
          deadline: endOfMonth,
        },
        {
          id: 'views-goal',
          title: '평균 조회수 1,000회',
          current: avgViewsPerContent,
          target: Math.max(1000, Math.ceil(avgViewsPerContent * 1.3)),
          unit: '회',
        },
      ];

      setGoals(dynamicGoals);
      setRecommendations(defaultRecommendations);
    } catch (error) {
      console.error('Failed to load insights:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-green-100 text-green-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'low':
        return 'bg-green-100 text-green-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-red-100 text-red-700';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">인사이트</h1>
              <p className="text-gray-500 text-sm mt-1">채널 성장을 위한 맞춤 제안</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column - Insights */}
          <div className="lg:col-span-2 space-y-8">
            {/* Key Insights */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                주요 인사이트
              </h2>
              <div className="space-y-4">
                {insights.map((insight) => {
                  const config = insightTypeConfig[insight.type];
                  const InsightIcon = config.icon;

                  return (
                    <Card key={insight.id} className="border-0 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          <div className={cn('p-2 rounded-lg flex-shrink-0', config.bg)}>
                            <InsightIcon className={cn('w-5 h-5', config.color)} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-semibold text-gray-900">{insight.title}</h3>
                                <p className="text-sm text-gray-500 mt-1">{insight.description}</p>
                              </div>
                              {insight.metric && (
                                <Badge
                                  variant="secondary"
                                  className={cn(
                                    'ml-4',
                                    insight.type === 'success'
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-gray-100 text-gray-700'
                                  )}
                                >
                                  {insight.metric}
                                </Badge>
                              )}
                            </div>
                            {insight.action && (
                              <Link href={insight.action.href}>
                                <Button variant="outline" size="sm" className="mt-3">
                                  {insight.action.label}
                                  <ArrowRight className="w-4 h-4 ml-1" />
                                </Button>
                              </Link>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Recommendations */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-500" />
                성장 추천
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {recommendations.map((rec) => (
                  <Card key={rec.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                          {rec.category}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">{rec.title}</h3>
                      <p className="text-sm text-gray-500 mb-4">{rec.description}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-400">효과</span>
                          <Badge variant="secondary" size="sm" className={getImpactColor(rec.impact)}>
                            {rec.impact === 'high' ? '높음' : rec.impact === 'medium' ? '중간' : '낮음'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-400">노력</span>
                          <Badge variant="secondary" size="sm" className={getEffortColor(rec.effort)}>
                            {rec.effort === 'low' ? '적음' : rec.effort === 'medium' ? '보통' : '많음'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar - Goals */}
          <div className="space-y-8">
            {/* Goals */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-500" />
                목표
              </h2>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="space-y-6">
                    {goals.map((goal) => {
                      const progress = Math.min((goal.current / goal.target) * 100, 100);
                      const isCompleted = progress >= 100;

                      return (
                        <div key={goal.id}>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900 text-sm">{goal.title}</h4>
                            {isCompleted && (
                              <CheckCircle2 className="w-5 h-5 text-green-500" />
                            )}
                          </div>
                          <div className="flex items-center gap-3 mb-2">
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  'h-full rounded-full transition-all',
                                  isCompleted ? 'bg-green-500' : 'bg-gray-500'
                                )}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-700">
                              {Math.round(progress)}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>
                              {goal.unit === '원'
                                ? formatCurrency(goal.current)
                                : formatNumber(goal.current)}
                              {' / '}
                              {goal.unit === '원'
                                ? formatCurrency(goal.target)
                                : `${formatNumber(goal.target)}${goal.unit}`}
                            </span>
                            {goal.deadline && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {goal.deadline}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <Button variant="outline" className="w-full mt-6">
                    새 목표 설정
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-green-500" />
                이번 주 요약
              </h2>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">조회수</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">
                        {formatNumber(weeklyStats?.views || 0)}
                      </span>
                      {weeklyStats && weeklyStats.viewsChange !== 0 && (
                        <span className={cn(
                          'text-xs flex items-center',
                          weeklyStats.viewsChange >= 0 ? 'text-green-600' : 'text-red-600'
                        )}>
                          {weeklyStats.viewsChange >= 0 ? (
                            <TrendingUp className="w-3 h-3 mr-0.5" />
                          ) : (
                            <TrendingDown className="w-3 h-3 mr-0.5" />
                          )}
                          {weeklyStats.viewsChange >= 0 ? '+' : ''}{Math.round(weeklyStats.viewsChange)}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">신규 구독자</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">
                        +{weeklyStats?.newSubscribers || 0}
                      </span>
                      {weeklyStats && weeklyStats.subscribersChange !== 0 && (
                        <span className={cn(
                          'text-xs flex items-center',
                          weeklyStats.subscribersChange >= 0 ? 'text-green-600' : 'text-red-600'
                        )}>
                          {weeklyStats.subscribersChange >= 0 ? (
                            <TrendingUp className="w-3 h-3 mr-0.5" />
                          ) : (
                            <TrendingDown className="w-3 h-3 mr-0.5" />
                          )}
                          {weeklyStats.subscribersChange >= 0 ? '+' : ''}{Math.round(weeklyStats.subscribersChange)}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">수익</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(weeklyStats?.revenue || 0)}
                      </span>
                      {weeklyStats && weeklyStats.revenueChange !== 0 && (
                        <span className={cn(
                          'text-xs flex items-center',
                          weeklyStats.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'
                        )}>
                          {weeklyStats.revenueChange >= 0 ? (
                            <TrendingUp className="w-3 h-3 mr-0.5" />
                          ) : (
                            <TrendingDown className="w-3 h-3 mr-0.5" />
                          )}
                          {weeklyStats.revenueChange >= 0 ? '+' : ''}{Math.round(weeklyStats.revenueChange)}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">참여율</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">
                        {(weeklyStats?.engagementRate || 0).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Best Performing */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                인기 콘텐츠
              </h2>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  {topContents.length > 0 ? (
                    <div className="space-y-3">
                      {topContents.map((content, i) => (
                        <Link
                          key={content.id}
                          href={`/content/${content.id}`}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-gray-400">
                            {i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {content.title}
                            </p>
                            <p className="text-xs text-gray-500">
                              조회 {formatNumber(content.views)} · 좋아요 {content.likes}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">
                      아직 콘텐츠가 없습니다
                    </p>
                  )}
                  <Link href="/dashboard/analytics">
                    <Button variant="ghost" className="w-full mt-3 text-sm">
                      더 보기
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
