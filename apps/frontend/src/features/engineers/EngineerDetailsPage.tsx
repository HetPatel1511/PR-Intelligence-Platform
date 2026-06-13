import { Link, useNavigate, useParams } from 'react-router-dom';

import { useRepositoryEngineers } from '../../hooks/useEngineers';
import { usePullRequests } from '../../hooks/usePullRequests';
import type { PullRequestSummary } from '../../types/api';
import {
  displayName,
  formatDate,
  formatHours,
  formatNumber,
  formatPercent,
} from '../../utils/format';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { Avatar } from '../../components/ui/Avatar';
import { Card, CardHeader } from '../../components/ui/Card';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';

export default function EngineerDetailsPage() {
  const { repositoryId = '', engineerId = '' } = useParams();
  const navigate = useNavigate();

  const engineersQuery = useRepositoryEngineers(repositoryId);
  const prsQuery = usePullRequests(repositoryId, {
    authorId: engineerId,
    pageSize: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  if (engineersQuery.isLoading) return <LoadingState label="Loading engineer…" />;
  if (engineersQuery.isError || !engineersQuery.data) {
    return (
      <ErrorState error={engineersQuery.error} onRetry={() => void engineersQuery.refetch()} />
    );
  }

  const engineer = engineersQuery.data.find((eng) => eng.id === engineerId);
  if (!engineer) {
    return (
      <div className="space-y-4">
        <BackLink repositoryId={repositoryId} />
        <EmptyState
          title="Engineer not found"
          description="This engineer has no activity in this repository."
        />
      </div>
    );
  }

  const metrics = engineer.metrics;

  const prColumns: Array<Column<PullRequestSummary>> = [
    {
      key: 'title',
      header: 'Pull request',
      render: (pr) => (
        <div className="max-w-sm">
          <p className="truncate font-medium text-slate-900">{pr.title}</p>
          <p className="text-xs text-slate-400">#{pr.number}</p>
        </div>
      ),
    },
    { key: 'status', header: 'Status', render: (pr) => <StatusBadge status={pr.status} /> },
    {
      key: 'churn',
      header: 'Churn',
      render: (pr) => (
        <span className="whitespace-nowrap">
          <span className="text-emerald-600">+{formatNumber(pr.additions)}</span>{' '}
          <span className="text-rose-600">−{formatNumber(pr.deletions)}</span>
        </span>
      ),
    },
    {
      key: 'created',
      header: 'Created',
      className: 'text-slate-500',
      render: (pr) => formatDate(pr.createdAt),
    },
  ];

  return (
    <div className="space-y-6">
      <BackLink repositoryId={repositoryId} />

      <div className="flex items-center gap-4">
        <Avatar src={engineer.avatarUrl} alt={displayName(engineer)} size={56} />
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{displayName(engineer)}</h1>
          <a
            href={`https://github.com/${engineer.login}`}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-indigo-600 hover:text-indigo-700"
          >
            @{engineer.login}
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="PRs Opened" value={formatNumber(metrics?.totalPullRequestsOpened)} />
        <StatCard label="PRs Merged" value={formatNumber(metrics?.pullRequestsMerged)} />
        <StatCard label="Avg Merge Time" value={formatHours(metrics?.averageMergeTimeHours)} />
        <StatCard label="Avg Review Time" value={formatHours(metrics?.averageReviewTimeHours)} />
        <StatCard label="Reviews Completed" value={formatNumber(metrics?.reviewsCompleted)} />
        <StatCard
          label="Review Participation"
          value={formatPercent(metrics?.reviewParticipationRate)}
        />
        <StatCard label="Code Added" value={formatNumber(metrics?.totalCodeAdded)} />
        <StatCard label="Code Removed" value={formatNumber(metrics?.totalCodeRemoved)} />
      </div>

      <Card>
        <CardHeader title="Pull requests authored" />
        {prsQuery.isLoading ? (
          <LoadingState />
        ) : prsQuery.isError || !prsQuery.data ? (
          <ErrorState error={prsQuery.error} onRetry={() => void prsQuery.refetch()} />
        ) : prsQuery.data.data.length === 0 ? (
          <EmptyState title="No authored pull requests in this repository" />
        ) : (
          <DataTable
            columns={prColumns}
            rows={prsQuery.data.data}
            rowKey={(pr) => pr.id}
            onRowClick={(pr) => navigate(`/repositories/${repositoryId}/pull-requests/${pr.id}`)}
          />
        )}
      </Card>
    </div>
  );
}

function BackLink({ repositoryId }: { repositoryId: string }) {
  return (
    <Link
      to={`/repositories/${repositoryId}`}
      className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
    >
      ← Back to dashboard
    </Link>
  );
}
