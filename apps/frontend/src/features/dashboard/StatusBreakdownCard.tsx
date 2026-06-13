import { useDashboardSummary } from '../../hooks/useMetrics';
import { formatNumber } from '../../utils/format';
import { StatusDonut } from '../../components/charts/StatusDonut';
import { ErrorState } from '../../components/feedback/ErrorState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { Card, CardHeader } from '../../components/ui/Card';

export function StatusBreakdownCard({ repositoryId }: { repositoryId: string }) {
  const { data, isLoading, isError, error, refetch } = useDashboardSummary(repositoryId);

  return (
    <Card>
      <CardHeader title="Pull requests by status" />
      <div className="p-5">
        {isLoading ? (
          <LoadingState />
        ) : isError || !data ? (
          <ErrorState error={error} onRetry={() => void refetch()} />
        ) : (
          <>
            <StatusDonut
              open={data.totals.open}
              merged={data.totals.merged}
              closed={data.totals.closed}
            />
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-center">
              <CodeVolumeStat
                label="Additions"
                value={data.codeVolume.additions}
                className="text-emerald-600"
              />
              <CodeVolumeStat
                label="Deletions"
                value={data.codeVolume.deletions}
                className="text-rose-600"
              />
              <CodeVolumeStat
                label="Churn"
                value={data.codeVolume.churn}
                className="text-slate-700"
              />
            </div>
          </>
        )}
      </div>
    </Card>
  );
}

function CodeVolumeStat({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className: string;
}) {
  return (
    <div>
      <p className={`text-lg font-semibold ${className}`}>{formatNumber(value)}</p>
      <p className="text-xs text-slate-400">{label}</p>
    </div>
  );
}
