import { NavLink, Outlet, useParams } from 'react-router-dom';

import { useRepository, useSyncRepositoryPullRequests } from '../../hooks/useRepositories';
import { getApiErrorMessage } from '../../lib/api';
import { cn } from '../../utils/cn';
import { formatDateTime } from '../../utils/format';
import { ErrorState } from '../feedback/ErrorState';
import { LoadingState } from '../feedback/LoadingState';
import { Button } from '../ui/Button';

const tabClass = ({ isActive }: { isActive: boolean }): string =>
  cn(
    'border-b-2 px-1 pb-2.5 text-sm font-medium transition-colors',
    isActive
      ? 'border-indigo-600 text-indigo-600'
      : 'border-transparent text-slate-500 hover:text-slate-700',
  );

/** Repo-scoped shell: header (name, sync) + tabs, shared by all repo pages. */
export function RepositoryLayout() {
  const { repositoryId = '' } = useParams();
  const repoQuery = useRepository(repositoryId);
  const sync = useSyncRepositoryPullRequests(repositoryId);

  if (repoQuery.isLoading) return <LoadingState />;
  if (repoQuery.isError || !repoQuery.data) {
    return <ErrorState error={repoQuery.error} onRetry={() => void repoQuery.refetch()} />;
  }

  const repo = repoQuery.data;

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-slate-900">{repo.fullName}</h1>
            {repo.isPrivate && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                Private
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {repo.lastSyncedAt
              ? `Last synced ${formatDateTime(repo.lastSyncedAt)}`
              : 'Not synced yet'}
          </p>
        </div>

        <div className="flex flex-col items-start gap-1 sm:items-end">
          <Button onClick={() => sync.mutate()} loading={sync.isPending}>
            {sync.isPending ? 'Syncing…' : 'Sync now'}
          </Button>
          {sync.isSuccess && (
            <p className="text-xs text-slate-500">
              Synced {sync.data.synced}/{sync.data.totalPullRequests} PRs
              {sync.data.failures.length > 0 ? `, ${sync.data.failures.length} failed` : ''}
            </p>
          )}
          {sync.isError && (
            <p className="text-xs text-rose-600">{getApiErrorMessage(sync.error)}</p>
          )}
        </div>
      </div>

      <nav className="mt-5 flex gap-6 border-b border-slate-200">
        <NavLink end to={`/repositories/${repositoryId}`} className={tabClass}>
          Dashboard
        </NavLink>
        <NavLink to={`/repositories/${repositoryId}/pull-requests`} className={tabClass}>
          Pull Requests
        </NavLink>
      </nav>

      <div className="mt-6">
        <Outlet />
      </div>
    </div>
  );
}
