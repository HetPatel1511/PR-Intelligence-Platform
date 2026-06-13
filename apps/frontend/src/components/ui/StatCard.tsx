import type { ReactNode } from 'react';

import { Card } from './Card';

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
}

/** Compact statistic tile for the dashboard. */
export function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <Card className="p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </Card>
  );
}
