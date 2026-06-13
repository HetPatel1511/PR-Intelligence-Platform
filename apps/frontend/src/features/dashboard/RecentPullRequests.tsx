import { Link, useNavigate } from 'react-router-dom';

import { usePullRequests } from '../../hooks/usePullRequests';
import type { PullRequestSummary } from '../../types/api';
import { formatDate } from '../../utils/format';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { Card, CardHeader } from '../../components/ui/Card';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { PersonInline } from '../../components/ui/PersonInline';
import { StatusBadge } from '../../components/ui/StatusBadge';

export function RecentPullRequests({ repositoryId }: { repositoryId: string }) {
  const navigate = useNavigate();
  const { data, isLoading, isError, error, refetch } = usePullRequests(repositoryId, {
    pageSize: 5,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const columns: Array<Column<PullRequestSummary>> = [
    {
      key: 'title',
      header: 'Pull request',
      render: (pr) => (
        <div className="max-w-xs">
          <p className="truncate font-medium text-slate-900">{pr.title}</p>
          <p className="text-xs text-slate-400">#{pr.number}</p>
        </div>
      ),
    },
    { key: 'status', header: 'Status', render: (pr) => <StatusBadge status={pr.status} /> },
    { key: 'author', header: 'Author', render: (pr) => <PersonInline person={pr.author} /> },
    {
      key: 'created',
      header: 'Created',
      className: 'text-slate-500',
      render: (pr) => formatDate(pr.createdAt),
    },
  ];

  return (
    <Card>
      <CardHeader
        title="Recent pull requests"
        action={
          <Link
            to={`/repositories/${repositoryId}/pull-requests`}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            View all
          </Link>
        }
      />
      {isLoading ? (
        <LoadingState />
      ) : isError || !data ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : data.data.length === 0 ? (
        <EmptyState title="No pull requests yet" description="Run a sync to pull in PR data." />
      ) : (
        <DataTable
          columns={columns}
          rows={data.data}
          rowKey={(pr) => pr.id}
          onRowClick={(pr) => navigate(`/repositories/${repositoryId}/pull-requests/${pr.id}`)}
        />
      )}
    </Card>
  );
}
