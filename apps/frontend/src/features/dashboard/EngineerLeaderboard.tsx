import { useNavigate } from 'react-router-dom';

import { useRepositoryEngineers } from '../../hooks/useEngineers';
import type { EngineerWithMetrics } from '../../types/api';
import { displayName, formatHours, formatNumber } from '../../utils/format';
import { HorizontalBarChart, type BarDatum } from '../../components/charts/HorizontalBarChart';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { Card, CardHeader } from '../../components/ui/Card';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { PersonInline } from '../../components/ui/PersonInline';

export function EngineerLeaderboard({ repositoryId }: { repositoryId: string }) {
  const navigate = useNavigate();
  const { data, isLoading, isError, error, refetch } = useRepositoryEngineers(repositoryId);

  const engineers = [...(data ?? [])].sort(
    (a, b) => (b.metrics?.totalPullRequestsOpened ?? 0) - (a.metrics?.totalPullRequestsOpened ?? 0),
  );

  const chartData: BarDatum[] = engineers
    .slice(0, 6)
    .map((eng) => ({ name: displayName(eng), value: eng.metrics?.totalPullRequestsOpened ?? 0 }));

  const columns: Array<Column<EngineerWithMetrics>> = [
    { key: 'engineer', header: 'Engineer', render: (eng) => <PersonInline person={eng} /> },
    {
      key: 'opened',
      header: 'PRs',
      render: (eng) => formatNumber(eng.metrics?.totalPullRequestsOpened),
    },
    {
      key: 'merged',
      header: 'Merged',
      render: (eng) => formatNumber(eng.metrics?.pullRequestsMerged),
    },
    {
      key: 'reviews',
      header: 'Reviews',
      render: (eng) => formatNumber(eng.metrics?.reviewsCompleted),
    },
    {
      key: 'avgMerge',
      header: 'Avg merge',
      render: (eng) => formatHours(eng.metrics?.averageMergeTimeHours),
    },
    {
      key: 'code',
      header: 'Code',
      render: (eng) => (
        <span className="whitespace-nowrap">
          <span className="text-emerald-600">+{formatNumber(eng.metrics?.totalCodeAdded)}</span>{' '}
          <span className="text-rose-600">−{formatNumber(eng.metrics?.totalCodeRemoved)}</span>
        </span>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader title="Engineer leaderboard" />
      {isLoading ? (
        <LoadingState />
      ) : isError || !data ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : engineers.length === 0 ? (
        <EmptyState
          title="No engineer activity yet"
          description="Run a sync to compute engineer metrics."
        />
      ) : (
        <div className="grid gap-4 p-5 lg:grid-cols-2 lg:gap-6">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
              Pull requests opened
            </p>
            <HorizontalBarChart data={chartData} />
          </div>
          <div className="-mx-5 lg:mx-0">
            <DataTable
              columns={columns}
              rows={engineers}
              rowKey={(eng) => eng.id}
              onRowClick={(eng) => navigate(`/repositories/${repositoryId}/engineers/${eng.id}`)}
            />
          </div>
        </div>
      )}
    </Card>
  );
}
