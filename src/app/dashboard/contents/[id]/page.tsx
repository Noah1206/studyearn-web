import { Suspense } from 'react';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Eye,
  Heart,
  MessageCircle,
  Download,
  Share2,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Calendar,
  Clock,
  ExternalLink,
  MoreVertical,
  BarChart3,
  Video,
  Mic,
  FileText,
  BookOpen,
  Image as ImageIcon,
  Play,
  Pause,
  ChevronRight,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { formatCurrency, formatNumber, formatDate, formatRelativeTime } from '@/lib/utils';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, LoadingSection } from '@/components/ui';
import type { Content } from '@/types/database';

export const dynamic = 'force-dynamic';

interface ContentDetailPageProps {
  params: Promise<{ id: string }>;
}

// 콘텐츠 타입 아이콘
function getContentTypeIcon(type: string) {
  switch (type) {
    case 'video': return Video;
    case 'audio': return Mic;
    case 'image': return ImageIcon;
    case 'document': return BookOpen;
    default: return FileText;
  }
}

// 콘텐츠 타입 라벨
const contentTypeLabels: Record<string, string> = {
  video: '동영상',
  audio: '오디오',
  image: '이미지',
  document: '문서',
  post: '포스트',
  live: '라이브',
};

// 접근 레벨 설정
const accessLevelConfig: Record<string, { label: string; color: string }> = {
  public: { label: '공개', color: 'bg-green-100 text-green-700' },
  subscribers: { label: '구독자 전용', color: 'bg-orange-100 text-orange-700' },
  tier: { label: '티어 전용', color: 'bg-purple-100 text-purple-700' },
  paid: { label: '유료', color: 'bg-orange-100 text-orange-700' },
};

interface ContentStats {
  viewCount: number;
  likeCount: number;
  commentCount: number;
  downloadCount: number;
  purchaseCount: number;
  revenue: number;
  avgWatchTime: number;
  completionRate: number;
}

interface DailyStats {
  date: string;
  views: number;
  likes: number;
  purchases: number;
  revenue: number;
}

async function getContentDetail(contentId: string, userId: string) {
  const supabase = await createClient();

  // 콘텐츠 정보
  const { data: content, error } = await supabase
    .from('contents')
    .select('*')
    .eq('id', contentId)
    .eq('creator_id', userId)
    .maybeSingle();

  if (error || !content) return null;

  // 구매/조회 통계
  const { data: purchases } = await supabase
    .from('content_purchases')
    .select('*')
    .eq('content_id', contentId)
    .eq('status', 'completed');

  const { data: likes } = await supabase
    .from('content_likes')
    .select('*')
    .eq('content_id', contentId);

  // 일별 통계 (최근 30일)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Note: content_views table doesn't exist, using downloads as proxy for engagement
  const { data: dailyViews } = await supabase
    .from('content_downloads')
    .select('downloaded_at')
    .eq('content_id', contentId)
    .gte('downloaded_at', thirtyDaysAgo.toISOString());

  // 통계 계산
  const stats: ContentStats = {
    viewCount: content.view_count || 0,
    likeCount: likes?.length || 0,
    commentCount: content.comment_count || 0,
    downloadCount: content.download_count || 0,
    purchaseCount: purchases?.length || 0,
    revenue: purchases?.reduce((sum: number, p: any) => sum + (p.creator_revenue || 0), 0) || 0,
    avgWatchTime: 0,
    completionRate: 0,
  };

  // 일별 데이터 가공
  const dailyStats = generateDailyStats(dailyViews || [], purchases || []);

  return { content, stats, dailyStats };
}

function generateDailyStats(views: any[], purchases: any[]): DailyStats[] {
  const days = 14;
  const result: DailyStats[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const dayViews = views.filter(v =>
      v.viewed_at?.startsWith(dateStr)
    ).length;

    const dayPurchases = purchases.filter(p =>
      p.purchased_at?.startsWith(dateStr)
    );

    result.push({
      date: dateStr,
      views: dayViews,
      likes: 0,
      purchases: dayPurchases.length,
      revenue: dayPurchases.reduce((sum, p) => sum + (p.creator_revenue || 0), 0),
    });
  }

  return result;
}

// 통계 카드 컴포넌트
function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  trend,
  trendValue
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}) {
  return (
    <Card variant="outlined">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <Icon className="w-5 h-5 text-gray-600" />
          </div>
          {trend && trendValue && (
            <div className={`flex items-center gap-1 text-xs font-medium ${
              trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500'
            }`}>
              {trend === 'up' ? <TrendingUp size={14} /> : trend === 'down' ? <TrendingDown size={14} /> : null}
              {trendValue}
            </div>
          )}
        </div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
        {subValue && (
          <p className="text-xs text-gray-400 mt-1">{subValue}</p>
        )}
      </CardContent>
    </Card>
  );
}

// 간단한 차트 컴포넌트
function SimpleChart({ data, dataKey }: { data: DailyStats[]; dataKey: keyof DailyStats }) {
  const maxValue = Math.max(...data.map(d => Number(d[dataKey]) || 0), 1);

  return (
    <div className="flex items-end gap-1 h-20">
      {data.map((item, index) => {
        const value = Number(item[dataKey]) || 0;
        const height = (value / maxValue) * 100;
        return (
          <div
            key={index}
            className="flex-1 bg-violet-100 hover:bg-violet-200 rounded-t transition-colors group relative"
            style={{ height: `${Math.max(height, 4)}%` }}
          >
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block">
              <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                {formatNumber(value)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

async function ContentDetailContent({ contentId }: { contentId: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const data = await getContentDetail(contentId, user.id);

  if (!data) {
    notFound();
  }

  const { content, stats, dailyStats } = data;
  const ContentIcon = getContentTypeIcon(content.content_type);
  const accessConfig = accessLevelConfig[content.access_level] || accessLevelConfig.public;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          {/* 썸네일 */}
          <div className="w-24 h-24 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
            {content.thumbnail_url ? (
              <img
                src={content.thumbnail_url}
                alt={content.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <ContentIcon className="w-10 h-10 text-gray-400" />
            )}
          </div>

          {/* 정보 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge className={accessConfig.color}>{accessConfig.label}</Badge>
              <Badge variant="secondary">
                {contentTypeLabels[content.content_type] || content.content_type}
              </Badge>
              {!content.is_published && (
                <Badge className="bg-yellow-100 text-yellow-700">초안</Badge>
              )}
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-1 line-clamp-2">
              {content.title}
            </h1>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar size={14} />
                {formatDate(content.created_at)}
              </span>
              {content.price && (
                <span className="flex items-center gap-1">
                  <DollarSign size={14} />
                  {formatCurrency(content.price)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex items-center gap-2">
          <Link href={`/content/${content.id}`} target="_blank">
            <Button variant="outline" size="sm">
              <ExternalLink size={16} className="mr-1" />
              미리보기
            </Button>
          </Link>
          <Link href={`/dashboard/contents/${content.id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit size={16} className="mr-1" />
              수정
            </Button>
          </Link>
          <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50">
            <Trash2 size={16} />
          </Button>
        </div>
      </div>

      {/* 주요 통계 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Eye}
          label="조회수"
          value={formatNumber(stats.viewCount)}
          trend="up"
          trendValue="+12%"
        />
        <StatCard
          icon={Heart}
          label="좋아요"
          value={formatNumber(stats.likeCount)}
          subValue={`${((stats.likeCount / Math.max(stats.viewCount, 1)) * 100).toFixed(1)}% 전환율`}
        />
        <StatCard
          icon={Users}
          label="구매"
          value={formatNumber(stats.purchaseCount)}
          trend="up"
          trendValue="+5건"
        />
        <StatCard
          icon={DollarSign}
          label="수익"
          value={formatCurrency(stats.revenue)}
          subValue="수수료 제외"
        />
      </div>

      {/* 차트 섹션 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* 조회수 추이 */}
        <Card variant="outlined">
          <CardHeader>
            <CardTitle className="text-base">조회수 추이 (14일)</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleChart data={dailyStats} dataKey="views" />
            <div className="flex justify-between mt-2 text-xs text-gray-400">
              <span>{formatDate(dailyStats[0]?.date)}</span>
              <span>{formatDate(dailyStats[dailyStats.length - 1]?.date)}</span>
            </div>
          </CardContent>
        </Card>

        {/* 수익 추이 */}
        <Card variant="outlined">
          <CardHeader>
            <CardTitle className="text-base">수익 추이 (14일)</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleChart data={dailyStats} dataKey="revenue" />
            <div className="flex justify-between mt-2 text-xs text-gray-400">
              <span>{formatDate(dailyStats[0]?.date)}</span>
              <span>{formatDate(dailyStats[dailyStats.length - 1]?.date)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 콘텐츠 상세 정보 */}
      <Card variant="outlined">
        <CardHeader>
          <CardTitle className="text-base">콘텐츠 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {content.description && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">설명</h4>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {content.description}
                </p>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">콘텐츠 타입</h4>
                <p className="text-sm text-gray-600">
                  {contentTypeLabels[content.content_type] || content.content_type}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">접근 레벨</h4>
                <p className="text-sm text-gray-600">{accessConfig.label}</p>
              </div>
              {content.price && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">가격</h4>
                  <p className="text-sm text-gray-600">{formatCurrency(content.price)}</p>
                </div>
              )}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">생성일</h4>
                <p className="text-sm text-gray-600">{formatDate(content.created_at)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">최종 수정</h4>
                <p className="text-sm text-gray-600">{formatRelativeTime(content.updated_at)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">상태</h4>
                <p className="text-sm text-gray-600">
                  {content.is_published ? '게시됨' : '초안'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 최근 구매자 */}
      <Card variant="outlined">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">최근 구매자</CardTitle>
          <Link href={`/dashboard/contents/${content.id}/purchases`}>
            <Button variant="ghost" size="sm">
              전체보기
              <ChevronRight size={16} />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {stats.purchaseCount > 0 ? (
            <div className="text-sm text-gray-500">
              총 {formatNumber(stats.purchaseCount)}명이 구매했습니다.
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">아직 구매자가 없습니다</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default async function ContentDetailPage({ params }: ContentDetailPageProps) {
  const { id } = await params;

  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-14 flex items-center gap-4">
            <Link
              href="/dashboard/contents"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={20} />
              <span className="text-sm font-medium">콘텐츠 관리</span>
            </Link>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<LoadingSection fullHeight />}>
          <ContentDetailContent contentId={id} />
        </Suspense>
      </main>
    </div>
  );
}
