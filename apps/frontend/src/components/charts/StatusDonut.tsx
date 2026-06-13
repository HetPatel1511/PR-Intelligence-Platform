import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import { EmptyState } from '../feedback/EmptyState';

interface StatusDonutProps {
  open: number;
  merged: number;
  closed: number;
}

const COLORS = {
  Open: '#3b82f6',
  Merged: '#8b5cf6',
  Closed: '#94a3b8',
};

/** Donut breakdown of pull requests by status. */
export function StatusDonut({ open, merged, closed }: StatusDonutProps) {
  const data = [
    { name: 'Open', value: open },
    { name: 'Merged', value: merged },
    { name: 'Closed', value: closed },
  ].filter((slice) => slice.value > 0);

  if (data.length === 0) {
    return <EmptyState title="No pull requests yet" />;
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={58}
          outerRadius={84}
          paddingAngle={2}
        >
          {data.map((slice) => (
            <Cell key={slice.name} fill={COLORS[slice.name as keyof typeof COLORS]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend iconType="circle" />
      </PieChart>
    </ResponsiveContainer>
  );
}
