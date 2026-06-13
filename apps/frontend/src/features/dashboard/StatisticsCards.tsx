import { useDashboardSummary } from '../../hooks/useMetrics';
import { formatHours, formatNumber, formatPercent } from '../../utils/format';
import { ErrorState } from '../../components/feedback/ErrorState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { StatCard } from '../../components/ui/StatCard';

export function StatisticsCards({ repositoryId }: { repositoryId: string }) {
  const { data, isLoading, isError, error, refetch } = useDashboardSummary(repositoryId);

  if (isLoading) return <LoadingState />;
  if (isError || !data) return <ErrorState error={error} onRetry={() => void refetch()} />;

  const { totals, averages } = data;

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard
        label="Pull Requests"
        value={formatNumber(totals.pullRequests)}
        hint={`${totals.open} open · ${totals.merged} merged`}
      />
      <StatCard label="Engineers" value={formatNumber(totals.engineers)} />
      <StatCard label="Avg Merge Time" value={formatHours(averages.mergeTimeHours)} />
      <StatCard
        label="Avg Time to First Review"
        value={formatHours(averages.timeToFirstReviewHours)}
        hint={`${formatPercent(averages.reviewParticipationRate)} review participation`}
      />
    </div>
  );
}
