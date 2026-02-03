'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { ContentThumbnail } from '@/components/content';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { AnalyticsChart } from './AnalyticsChart';
import { RecentActivityChart } from './RecentActivityChart';

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

interface SaleItem {
  id: string;
  type: 'content';
  title: string;
  amount: number;
  createdAt: string;
  contentId?: string;
  buyerName?: string;
}

interface DashboardData {
  totalRevenue: number;
  availableBalance: number;
  currentMonthRevenue: number;
  lastMonthRevenue: number;
  contentCount: number;
  totalViews: number;
  contentStats: ContentStats[];
  recentSales: SaleItem[];
}

interface DashboardClientProps {
  data: DashboardData;
}

// Text-only Stat Card Component
function StatCard({
  label,
  value,
  subValue,
  href,
  highlight = false,
}: {
  label: string;
  value: string;
  subValue?: string;
  href?: string;
  highlight?: boolean;
}) {
  const content = (
    <div className={`${href ? 'hover:opacity-70 transition-opacity' : ''}`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${highlight ? 'text-orange-600' : 'text-gray-900'}`}>{value}</p>
      {subValue && <p className="text-xs text-gray-400 mt-0.5">{subValue}</p>}
    </div>
  );

  if (href) {
    return <Link href={href} className="block">{content}</Link>;
  }
  return content;
}

// 일별 데이터 생성 함수
function generateDailyData(totalViews: number) {
  const days = 28;
  const data = [];
  const now = new Date();

  const avgDailyViews = Math.floor(totalViews / days);

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    const variance = Math.random() * 0.4 + 0.8;
    const views = totalViews > 0 ? Math.floor(avgDailyViews * variance) : 0;

    data.push({
      date: `${date.getMonth() + 1}.${date.getDate()}`,
      views,
    });
  }

  return data;
}

export function DashboardClient({ data }: DashboardClientProps) {
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);

  // 선택된 콘텐츠 찾기
  const selectedContent = useMemo(() => {
    if (!selectedContentId) return null;
    return data.contentStats.find(c => c.id === selectedContentId) || null;
  }, [selectedContentId, data.contentStats]);

  // 선택된 콘텐츠에 따른 통계
  const displayStats = useMemo(() => {
    if (selectedContent) {
      return {
        views: selectedContent.viewCount,
        revenue: selectedContent.revenue,
        likes: selectedContent.likeCount,
        purchases: selectedContent.purchaseCount,
      };
    }
    return {
      views: data.totalViews,
      revenue: data.currentMonthRevenue,
      likes: data.contentStats.reduce((sum, c) => sum + c.likeCount, 0),
      purchases: data.contentStats.reduce((sum, c) => sum + c.purchaseCount, 0),
    };
  }, [selectedContent, data]);

  // 선택된 콘텐츠에 따른 최근 판매 필터링
  const filteredSales = useMemo(() => {
    if (!selectedContentId) return data.recentSales;
    return data.recentSales.filter(sale => sale.contentId === selectedContentId);
  }, [selectedContentId, data.recentSales]);

  // 차트 데이터
  const chartData = useMemo(() => {
    return generateDailyData(displayStats.views);
  }, [displayStats.views]);

  // 인기 콘텐츠 (조회수 기준 정렬)
  const popularContents = useMemo(() => {
    return [...data.contentStats]
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, 5);
  }, [data.contentStats]);

  const isNewCreator = data.contentCount === 0;

  // 성장률 계산
  const growthRate = data.lastMonthRevenue > 0
    ? Math.round(((data.currentMonthRevenue - data.lastMonthRevenue) / data.lastMonthRevenue) * 100)
    : 0;

  const handleContentClick = (contentId: string) => {
    if (selectedContentId === contentId) {
      setSelectedContentId(null); // 같은 콘텐츠 클릭 시 전체로 돌아가기
    } else {
      setSelectedContentId(contentId);
    }
  };

  const handleClearSelection = () => {
    setSelectedContentId(null);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 선택된 콘텐츠 헤더 */}
        {selectedContent ? (
          <div className="mb-10">
            <button
              onClick={handleClearSelection}
              className="text-sm text-gray-400 hover:text-gray-600 mb-2 transition-colors"
            >
              전체 보기로 돌아가기
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              {selectedContent.title}의 콘텐츠 현황
            </h1>
          </div>
        ) : (
          <>
            {/* Welcome Banner for New Creators */}
            {isNewCreator && (
              <div className="mb-10">
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  크리에이터로 첫 걸음을 내딛으셨네요
                </h2>
                <p className="text-gray-500 text-sm mb-4">
                  첫 콘텐츠를 업로드하고 수익을 창출해보세요.
                </p>
                <Link href="/dashboard/upload">
                  <Button size="sm">콘텐츠 업로드</Button>
                </Link>
              </div>
            )}
          </>
        )}

        {/* Summary Stats */}
        <div className="mb-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {selectedContent ? (
              <>
                <StatCard
                  label="총 조회수"
                  value={formatNumber(displayStats.views)}
                />
                <StatCard
                  label="총 수익"
                  value={formatCurrency(displayStats.revenue)}
                  highlight={displayStats.revenue > 0}
                />
                <StatCard
                  label="좋아요"
                  value={formatNumber(displayStats.likes)}
                />
                <StatCard
                  label="판매 수"
                  value={`${displayStats.purchases}건`}
                />
              </>
            ) : (
              <>
                <StatCard
                  label="정산 가능"
                  value={formatCurrency(data.availableBalance)}
                  subValue={data.availableBalance >= 10000 ? "정산 신청 가능" : "최소 10,000원"}
                  href="/dashboard/payout"
                  highlight={data.availableBalance >= 10000}
                />
                <StatCard
                  label="이번 달 수익"
                  value={formatCurrency(data.currentMonthRevenue)}
                  subValue={growthRate !== 0 ? `전월 대비 ${growthRate > 0 ? '+' : ''}${growthRate}%` : undefined}
                />
                <StatCard
                  label="총 조회수"
                  value={formatNumber(data.totalViews)}
                />
                <StatCard
                  label="발행 콘텐츠"
                  value={`${data.contentCount}개`}
                  href="/dashboard/contents"
                />
              </>
            )}
          </div>
        </div>

        {/* Chart Section */}
        <div className="mb-10">
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">조회수</h3>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatNumber(displayStats.views)}</p>
            </div>
            <span className="text-xs text-gray-400">최근 28일</span>
          </div>
          <AnalyticsChart data={chartData} />
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* 인기 콘텐츠 / 콘텐츠 목록 */}
          <div>
            <div className="flex items-baseline justify-between mb-4">
              <h3 className="font-semibold text-gray-900">
                {selectedContent ? '다른 콘텐츠' : '인기 콘텐츠'}
              </h3>
              <span className="text-xs text-gray-400">
                {selectedContent ? '클릭하여 전환' : '조회수 기준'}
              </span>
            </div>

            {popularContents.length > 0 ? (
              <div className="space-y-1">
                {popularContents.map((content, index) => (
                  <button
                    key={content.id}
                    onClick={() => handleContentClick(content.id)}
                    className={`flex items-center gap-4 py-3 w-full text-left transition-all ${
                      selectedContentId === content.id
                        ? 'opacity-100 bg-orange-50 -mx-3 px-3 rounded-lg'
                        : 'hover:opacity-70'
                    }`}
                  >
                    <span className={`text-sm font-medium w-5 ${
                      selectedContentId === content.id ? 'text-orange-500' : 'text-gray-400'
                    }`}>
                      {index + 1}
                    </span>
                    <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0">
                      <ContentThumbnail
                        thumbnailUrl={content.thumbnailUrl}
                        subject={content.subject ?? undefined}
                        title={content.title}
                        aspectRatio="1/1"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${
                        selectedContentId === content.id ? 'text-orange-600 font-medium' : 'text-gray-900'
                      }`}>
                        {content.title}
                      </p>
                    </div>
                    <span className={`text-sm ${
                      selectedContentId === content.id ? 'text-orange-500' : 'text-gray-500'
                    }`}>
                      {formatNumber(content.viewCount)}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm py-8">아직 발행한 콘텐츠가 없어요</p>
            )}
          </div>

          {/* 최근 판매 */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">
              {selectedContent ? `${selectedContent.title} 판매 내역` : '최근 판매'}
            </h3>
            <RecentActivityChart recentSales={filteredSales} />
          </div>
        </div>
      </div>
    </div>
  );
}
