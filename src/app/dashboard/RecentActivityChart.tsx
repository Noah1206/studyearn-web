'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

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

// 최근 48시간 시간대별 데이터 생성
function generateHourlyData(sales: SaleItem[]) {
  const hours = 48;
  const data = [];
  const now = new Date();

  for (let i = hours - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setHours(date.getHours() - i);

    // 해당 시간대에 발생한 판매 수 계산
    const hourStart = new Date(date);
    hourStart.setMinutes(0, 0, 0);
    const hourEnd = new Date(hourStart);
    hourEnd.setHours(hourEnd.getHours() + 1);

    const count = sales.filter(sale => {
      const saleDate = new Date(sale.createdAt);
      return saleDate >= hourStart && saleDate < hourEnd;
    }).length;

    data.push({
      hour: i === 0 ? '지금' : i === 24 ? '어제' : '',
      count,
      isRecent: i < 24,
    });
  }

  return data;
}

export function RecentActivityChart({ recentSales }: RecentActivityChartProps) {
  const data = generateHourlyData(recentSales);
  const hasData = recentSales.length > 0;

  // 실시간 업데이트 인디케이터
  const now = new Date();
  const lastUpdate = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;

  return (
    <div className="space-y-4">
      {/* 실시간 인디케이터 */}
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
        <span className="text-xs text-gray-500">실시간 업데이트 중</span>
      </div>

      {/* 차트 */}
      <div className="h-[180px] w-full relative">
        {!hasData && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="text-center">
              <p className="text-gray-400 text-sm">아직 활동 데이터가 없어요</p>
            </div>
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 5, right: 5, left: -30, bottom: 5 }}
          >
            <XAxis
              dataKey="hour"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9ca3af', fontSize: 10 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              width={30}
            />
            <Tooltip
              cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
              contentStyle={{
                backgroundColor: '#1f2937',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 12px',
              }}
              labelStyle={{ color: '#9ca3af', fontSize: 12 }}
              itemStyle={{ color: '#fff', fontSize: 14 }}
              formatter={(value) => value !== undefined ? [`${value}건`, '활동'] : ['0건', '활동']}
            />
            <Bar dataKey="count" radius={[2, 2, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.isRecent ? '#3b82f6' : '#93c5fd'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 범례 */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 bg-blue-500 rounded-sm" />
          <span>48시간 전</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 bg-blue-300 rounded-sm" />
          <span>현재</span>
        </div>
      </div>

      {/* 인기 콘텐츠 요약 */}
      {recentSales.length > 0 && (
        <div className="pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-2">인기 동영상 · 48시간</p>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">
              1
            </div>
            <p className="text-sm text-gray-900 truncate flex-1">
              {recentSales[0]?.title || '콘텐츠'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
