import { Link, useParams } from 'react-router-dom';

import { usePullRequest } from '../../hooks/usePullRequests';
import type { FileItem } from '../../types/api';
import {
  displayName,
  formatDateTime,
  formatHours,
  formatNumber,
  formatPercent,
} from '../../utils/format';
import { ErrorState } from '../../components/feedback/ErrorState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { Card, CardHeader } from '../../components/ui/Card';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { PersonInline } from '../../components/ui/PersonInline';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';

export default function PullRequestDetailsPage() {
  const { repositoryId = '', pullRequestId = '' } = useParams();
  const { data: pr, isLoading, isError, error, refetch } = usePullRequest(pullRequestId);

  if (isLoading) return <LoadingState label="Loading pull request…" />;
  if (isError || !pr) return <ErrorState error={error} onRetry={() => void refetch()} />;

  const { metrics } = pr;

  const fileColumns: Array<Column<FileItem>> = [
    {
      key: 'filename',
      header: 'File',
      render: (file) => <span className="font-mono text-xs text-slate-700">{file.filename}</span>,
    },
    { key: 'status', header: 'Status', className: 'text-slate-500', render: (file) => file.status },
    {
      key: 'changes',
      header: 'Changes',
      render: (file) => (
        <span className="whitespace-nowrap">
          <span className="text-emerald-600">+{formatNumber(file.additions)}</span>{' '}
          <span className="text-rose-600">−{formatNumber(file.deletions)}</span>
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link
          to={`/repositories/${repositoryId}/pull-requests`}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          ← Back to pull requests
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold text-slate-900">{pr.title}</h1>
          <StatusBadge status={pr.status} />
        </div>
        <p className="mt-1 text-sm text-slate-500">
          #{pr.number} · opened {formatDateTime(pr.createdAt)}
          {pr.mergedAt ? ` · merged ${formatDateTime(pr.mergedAt)}` : ''} · by{' '}
          {pr.author ? displayName(pr.author) : 'unknown'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Merge Time" value={formatHours(metrics.mergeTimeHours)} />
        <StatCard
          label="Time to First Review"
          value={formatHours(metrics.timeToFirstReviewHours)}
        />
        <StatCard label="Review Turnaround" value={formatHours(metrics.reviewTurnaroundHours)} />
        <StatCard label="Reviewers" value={formatNumber(metrics.reviewerCount)} />
        <StatCard label="Comments" value={formatNumber(metrics.commentCount)} />
        <StatCard label="Files Changed" value={formatNumber(metrics.filesChanged)} />
        <StatCard
          label="Code Churn"
          value={formatNumber(metrics.codeChurn)}
          hint={`+${formatNumber(metrics.linesAdded)} / −${formatNumber(metrics.linesDeleted)}`}
        />
        <StatCard
          label="Review Participation"
          value={formatPercent(metrics.reviewParticipationRate)}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title={`Reviews (${pr.reviews.length})`} />
          {pr.reviews.length === 0 ? (
            <p className="px-5 py-6 text-sm text-slate-500">No reviews recorded.</p>
          ) : (
            <ul className="divide-y divide-slate-50">
              {pr.reviews.map((review) => (
                <li key={review.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <PersonInline person={review.reviewer} />
                  <span className="text-right">
                    <span className="block font-medium text-slate-700">{review.state}</span>
                    <span className="text-xs text-slate-400">
                      {formatDateTime(review.submittedAt)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title={`Commits (${pr.commits.length})`} />
          {pr.commits.length === 0 ? (
            <p className="px-5 py-6 text-sm text-slate-500">No commits recorded.</p>
          ) : (
            <ul className="divide-y divide-slate-50">
              {pr.commits.map((commit) => (
                <li key={commit.id} className="px-5 py-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-400">
                      {commit.sha.slice(0, 7)}
                    </span>
                    <span className="truncate text-slate-700">{commit.message.split('\n')[0]}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader title={`Files changed (${pr.files.length})`} />
        {pr.files.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-500">No file changes recorded.</p>
        ) : (
          <DataTable columns={fileColumns} rows={pr.files} rowKey={(file) => file.filename} />
        )}
      </Card>
    </div>
  );
}
