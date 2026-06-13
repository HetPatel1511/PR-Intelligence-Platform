import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { usePullRequests } from '../../hooks/usePullRequests';
import type { ListPullRequestsParams } from '../../api/pullRequests.api';
import type { PullRequestStatus, PullRequestSummary } from '../../types/api';
import { formatDate, formatNumber } from '../../utils/format';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { Card } from '../../components/ui/Card';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { Pagination } from '../../components/ui/Pagination';
import { PersonInline } from '../../components/ui/PersonInline';
import { StatusBadge } from '../../components/ui/StatusBadge';

type StatusFilter = 'ALL' | PullRequestStatus;

type SortValue = 'newest' | 'oldest' | 'updated' | 'merged';
const SORTS: Record<SortValue, Pick<ListPullRequestsParams, 'sortBy' | 'sortOrder'>> = {
  newest: { sortBy: 'createdAt', sortOrder: 'desc' },
  oldest: { sortBy: 'createdAt', sortOrder: 'asc' },
  updated: { sortBy: 'updatedAt', sortOrder: 'desc' },
  merged: { sortBy: 'mergedAt', sortOrder: 'desc' },
};

const selectClass =
  'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';

export default function PullRequestListPage() {
  const { repositoryId = '' } = useParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState<StatusFilter>('ALL');
  const [sort, setSort] = useState<SortValue>('newest');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, isError, error, refetch, isFetching } = usePullRequests(repositoryId, {
    page,
    pageSize: 15,
    status: status === 'ALL' ? undefined : status,
    search: search || undefined,
    ...SORTS[sort],
  });

  const columns: Array<Column<PullRequestSummary>> = [
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
    { key: 'author', header: 'Author', render: (pr) => <PersonInline person={pr.author} /> },
    {
      key: 'reviewers',
      header: 'Reviews',
      className: 'text-slate-600',
      render: (pr) => formatNumber(pr.counts.reviews),
    },
    {
      key: 'comments',
      header: 'Comments',
      className: 'text-slate-600',
      render: (pr) => formatNumber(pr.commentCount),
    },
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
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by title…"
          className={`${selectClass} min-w-[200px] flex-1`}
        />
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as StatusFilter);
            setPage(1);
          }}
          className={selectClass}
        >
          <option value="ALL">All statuses</option>
          <option value="OPEN">Open</option>
          <option value="MERGED">Merged</option>
          <option value="CLOSED">Closed</option>
        </select>
        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value as SortValue);
            setPage(1);
          }}
          className={selectClass}
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="updated">Recently updated</option>
          <option value="merged">Recently merged</option>
        </select>
      </div>

      <Card>
        {isLoading ? (
          <LoadingState label="Loading pull requests…" />
        ) : isError || !data ? (
          <ErrorState error={error} onRetry={() => void refetch()} />
        ) : data.data.length === 0 ? (
          <EmptyState
            title="No pull requests found"
            description="Adjust your filters, or run a sync to import PR data."
          />
        ) : (
          <div className={isFetching ? 'opacity-60 transition-opacity' : undefined}>
            <DataTable
              columns={columns}
              rows={data.data}
              rowKey={(pr) => pr.id}
              onRowClick={(pr) => navigate(`/repositories/${repositoryId}/pull-requests/${pr.id}`)}
            />
            <Pagination meta={data.pagination} onPageChange={setPage} />
          </div>
        )}
      </Card>
    </div>
  );
}
