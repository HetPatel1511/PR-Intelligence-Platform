import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useRepositories, useSyncRepositories } from '../../hooks/useRepositories';
import { useAutoSync } from '../../hooks/useAutoSync';
import { getApiErrorMessage } from '../../lib/api';
import { getLastSync } from '../../lib/syncTimestamps';
import { formatDateTime } from '../../utils/format';
import { PageHeader } from '../../components/layout/PageHeader';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Pagination } from '../../components/ui/Pagination';

export default function RepositorySelectionPage() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Debounce the search box so we don't refetch on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const reposQuery = useRepositories({ page, pageSize: 12, search: search || undefined });
  const sync = useSyncRepositories();

  // Refresh the repository list from GitHub when the page opens, but only if the
  // last refresh was over 5 minutes ago (same action as the button).
  useAutoSync(sync.mutate, { lastSyncedAt: getLastSync('repositories') });

  return (
    <div>
      <PageHeader
        title="Repositories"
        description="Select a repository to explore its pull-request insights."
        actions={
          <Button variant="secondary" onClick={() => sync.mutate()} loading={sync.isPending}>
            Refresh from GitHub
          </Button>
        }
      />

      {sync.isError && (
        <p className="mb-4 text-sm text-rose-600">{getApiErrorMessage(sync.error)}</p>
      )}

      <input
        type="search"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        placeholder="Search repositories…"
        className="mb-5 w-full max-w-sm rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />

      {reposQuery.isLoading ? (
        <LoadingState label="Loading repositories…" />
      ) : reposQuery.isError || !reposQuery.data ? (
        <ErrorState error={reposQuery.error} onRetry={() => void reposQuery.refetch()} />
      ) : reposQuery.data.data.length === 0 ? (
        <EmptyState
          title={search ? 'No repositories match your search' : 'No repositories connected yet'}
          description={
            search
              ? 'Try a different search term.'
              : 'Refresh from GitHub to import your repositories.'
          }
          action={
            !search && (
              <Button onClick={() => sync.mutate()} loading={sync.isPending}>
                Refresh from GitHub
              </Button>
            )
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reposQuery.data.data.map((repo) => (
              <button
                key={repo.id}
                onClick={() => navigate(`/repositories/${repo.id}`)}
                className="group rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-indigo-300 hover:shadow"
              >
                <div className="flex items-center justify-between">
                  <span className="truncate text-sm font-semibold text-slate-900">{repo.name}</span>
                  {repo.isPrivate && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                      Private
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-500">{repo.owner}</p>
                <p className="mt-3 text-xs text-slate-400">
                  {repo.lastSyncedAt
                    ? `Synced ${formatDateTime(repo.lastSyncedAt)}`
                    : 'Not synced yet'}
                </p>
              </button>
            ))}
          </div>

          <Card className="mt-5">
            <Pagination meta={reposQuery.data.pagination} onPageChange={setPage} />
          </Card>
        </>
      )}
    </div>
  );
}
