'use client';

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface AnalyticsChartProps {
  data: {
    date: string;
    views: number;
  }[];
}

export function AnalyticsChart({ data }: AnalyticsChartProps) {
  const hasData = data && data.some(d => d.views > 0);

  const formatYAxis = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toString();
  };

  const formatTooltip = (value: number | string | Array<number | string> | undefined) => {
    if (value === undefined) return '';
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    return String(value);
  };

  // Y축 도메인 계산
  const maxViews = Math.max(...data.map(d => d.views), 10);
  const yDomain = [0, Math.ceil(maxViews * 1.2)];

  return (
    <div className="h-[200px] w-full relative">
      {!hasData && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <p className="text-gray-400 text-sm">아직 조회 데이터가 없어요</p>
        </div>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
        >
          <defs>
            <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#f97316" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            dy={10}
            interval="preserveStartEnd"
            tickFormatter={(value, index) => {
              // 첫번째, 중간, 마지막만 표시
              if (index === 0 || index === data.length - 1 || index === Math.floor(data.length / 2)) {
                return value;
              }
              return '';
            }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            tickFormatter={formatYAxis}
            width={40}
            domain={yDomain}
          />
          <Tooltip
            formatter={formatTooltip}
            labelFormatter={(label) => `${label}`}
            contentStyle={{
              backgroundColor: '#1f2937',
              border: 'none',
              borderRadius: '6px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              padding: '8px 12px',
            }}
            labelStyle={{ color: '#9ca3af', fontSize: 12, marginBottom: 4 }}
            itemStyle={{ color: '#fff', fontSize: 14, fontWeight: 600 }}
          />
          <Area
            type="monotone"
            dataKey="views"
            stroke="#f97316"
            strokeWidth={2}
            fill="url(#viewsGradient)"
            dot={false}
            activeDot={{ r: 4, fill: '#f97316', strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
