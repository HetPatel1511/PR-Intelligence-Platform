import { cn } from '../../utils/cn';
import { formatNumber } from '../../utils/format';

interface CodeVolumeProps {
  additions: number;
  deletions: number;
  /** Defaults to additions + deletions. */
  churn?: number;
  className?: string;
}

/** Colored additions / deletions / churn callouts. */
export function CodeVolume({ additions, deletions, churn, className }: CodeVolumeProps) {
  const totalChurn = churn ?? additions + deletions;

  return (
    <div className={cn('grid grid-cols-3 gap-2 text-center', className)}>
      <Metric label="Additions" display={`+${formatNumber(additions)}`} tone="text-emerald-600" />
      <Metric label="Deletions" display={`−${formatNumber(deletions)}`} tone="text-rose-600" />
      <Metric label="Churn" display={formatNumber(totalChurn)} tone="text-indigo-600" />
    </div>
  );
}

function Metric({ label, display, tone }: { label: string; display: string; tone: string }) {
  return (
    <div>
      <p className={cn('text-xl font-semibold', tone)}>{display}</p>
      <p className="mt-0.5 text-xs text-slate-400">{label}</p>
    </div>
  );
}
