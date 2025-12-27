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
import { Button, Card, CardContent, Badge } from '@/components/ui';

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

// Mock Insights
const mockInsights: Insight[] = [
  {
    id: '1',
    type: 'success',
    title: '조회수가 지난 주 대비 32% 증가했어요!',
    description: '최근 업로드한 "효과적인 학습법" 콘텐츠가 인기를 끌고 있습니다.',
    metric: '+32%',
    priority: 1,
  },
  {
    id: '2',
    type: 'opportunity',
    title: '콘텐츠 판매를 늘릴 수 있어요',
    description: '조회수 대비 구매 전환율이 낮습니다. 콘텐츠 설명을 보강해보세요.',
    action: { label: '콘텐츠 관리', href: '/dashboard/contents' },
    priority: 2,
  },
  {
    id: '3',
    type: 'tip',
    title: '오후 7-9시에 게시하면 효과적이에요',
    description: '구독자들의 활동 시간을 분석한 결과, 저녁 시간대 게시 시 참여율이 40% 높습니다.',
    priority: 3,
  },
  {
    id: '4',
    type: 'warning',
    title: '이번 주 콘텐츠 업로드가 없어요',
    description: '꾸준한 업로드가 구독자 유지에 중요합니다. 새 콘텐츠를 계획해보세요.',
    action: { label: '콘텐츠 업로드', href: '/dashboard/upload' },
    priority: 4,
  },
];

// Mock Goals
const mockGoals: Goal[] = [
  {
    id: '1',
    title: '월간 구독자 100명 달성',
    current: 78,
    target: 100,
    unit: '명',
    deadline: '2024-01-31',
  },
  {
    id: '2',
    title: '월 수익 100만원 달성',
    current: 650000,
    target: 1000000,
    unit: '원',
    deadline: '2024-01-31',
  },
  {
    id: '3',
    title: '평균 조회수 1,000회',
    current: 720,
    target: 1000,
    unit: '회',
  },
];

// Mock Recommendations
const mockRecommendations: Recommendation[] = [
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

export default function InsightsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [activeGoalTab, setActiveGoalTab] = useState<'active' | 'completed'>('active');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // In production, fetch from analytics engine
      await new Promise((resolve) => setTimeout(resolve, 500));
      setInsights(mockInsights);
      setGoals(mockGoals);
      setRecommendations(mockRecommendations);
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
        <Loader2 className="w-8 h-8 animate-spin text-gray-900" />
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
                      <span className="font-semibold text-gray-900">1,234</span>
                      <span className="text-xs text-green-600 flex items-center">
                        <TrendingUp className="w-3 h-3 mr-0.5" />
                        +12%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">신규 구독자</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">+8</span>
                      <span className="text-xs text-green-600 flex items-center">
                        <TrendingUp className="w-3 h-3 mr-0.5" />
                        +33%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">수익</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{formatCurrency(125000)}</span>
                      <span className="text-xs text-red-600 flex items-center">
                        <TrendingDown className="w-3 h-3 mr-0.5" />
                        -5%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">참여율</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">8.5%</span>
                      <span className="text-xs text-green-600 flex items-center">
                        <TrendingUp className="w-3 h-3 mr-0.5" />
                        +2.1%
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
                  <div className="space-y-3">
                    {[
                      { title: '효과적인 학습 방법 10가지', views: 523, likes: 45 },
                      { title: '집중력 높이는 비법', views: 412, likes: 38 },
                      { title: '시간 관리 노하우', views: 287, likes: 22 },
                    ].map((content, i) => (
                      <div
                        key={i}
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
                      </div>
                    ))}
                  </div>
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
