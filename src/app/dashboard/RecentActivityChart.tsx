'use client';

import { formatCurrency } from '@/lib/utils';

interface SaleItem {
  id: string;
  type: 'content';
  title: string;
  amount: number;
  createdAt: string;
  buyerName?: string;
}

interface RecentActivityChartProps {
  recentSales: SaleItem[];
}

// 시간 포맷팅 (상대 시간)
function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;
  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

export function RecentActivityChart({ recentSales }: RecentActivityChartProps) {
  const hasData = recentSales.length > 0;

  return (
    <div className="space-y-3">
      {hasData ? (
        <>
          {recentSales.slice(0, 5).map((sale) => (
            <div
              key={sale.id}
              className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-900 truncate">{sale.title}</p>
                <p className="text-xs text-gray-400">{formatRelativeTime(sale.createdAt)}</p>
              </div>
              <span className="text-sm font-medium text-green-600 ml-3">
                +{formatCurrency(sale.amount)}
              </span>
            </div>
          ))}
        </>
      ) : (
        <div className="flex items-center justify-center py-8">
          <p className="text-gray-400 text-sm">아직 판매 내역이 없어요</p>
        </div>
      )}
    </div>
  );
}
