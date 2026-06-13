import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { EmptyState } from '../feedback/EmptyState';

export interface BarDatum {
  name: string;
  value: number;
}

interface HorizontalBarChartProps {
  data: BarDatum[];
  color?: string;
  emptyLabel?: string;
}

/** Horizontal bar chart for ranked categories (e.g. engineer leaderboard). */
export function HorizontalBarChart({
  data,
  color = '#6366f1',
  emptyLabel = 'No data yet',
}: HorizontalBarChartProps) {
  if (data.length === 0) {
    return <EmptyState title={emptyLabel} />;
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 38)}>
      <BarChart layout="vertical" data={data} margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          width={110}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12, fill: '#475569' }}
        />
        <Tooltip cursor={{ fill: '#f1f5f9' }} />
        <Bar dataKey="value" fill={color} radius={[0, 4, 4, 0]} barSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}
