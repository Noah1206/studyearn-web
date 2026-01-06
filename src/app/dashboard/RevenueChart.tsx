'use client';

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface RevenueChartProps {
  data: {
    yearMonth: string;
    totalRevenue: number;
  }[];
}

// 최근 6개월 샘플 데이터 생성
function generateSampleData() {
  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      month: `${date.getMonth() + 1}월`,
      revenue: 0,
    });
  }
  return months;
}

export function RevenueChart({ data }: RevenueChartProps) {
  const hasData = data && data.length > 0;

  // 최근 6개월 데이터를 시간순으로 정렬
  const chartData = hasData
    ? data
        .slice(0, 6)
        .reverse()
        .map((item) => ({
          month: `${parseInt(item.yearMonth.split('-')[1])}월`,
          revenue: item.totalRevenue,
        }))
    : generateSampleData();

  const formatYAxis = (value: number) => {
    if (value >= 10000) {
      return `${(value / 10000).toFixed(0)}만`;
    }
    return value.toLocaleString();
  };

  const formatTooltip = (value: number | string | Array<number | string> | undefined) => {
    if (value === undefined) return '';
    if (typeof value === 'number') {
      return `${value.toLocaleString()}원`;
    }
    return String(value);
  };

  return (
    <div className="h-[200px] w-full relative">
      {!hasData && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/80">
          <div className="text-center">
            <p className="text-gray-500 text-sm">아직 수익 데이터가 없어요</p>
            <p className="text-gray-400 text-xs mt-1">첫 수익이 발생하면 그래프가 표시됩니다</p>
          </div>
        </div>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6b7280', fontSize: 12 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickFormatter={formatYAxis}
            width={45}
          />
          <Tooltip
            formatter={formatTooltip}
            labelFormatter={(label) => `${label} 수익`}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#f97316"
            strokeWidth={2}
            fill="url(#revenueGradient)"
            dot={{ fill: '#f97316', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: '#f97316' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
