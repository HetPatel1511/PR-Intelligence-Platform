import { useParams } from 'react-router-dom';

import { useRefreshDashboard } from '../../hooks/useRefreshDashboard';
import { Button } from '../../components/ui/Button';
import { StatisticsCards } from './StatisticsCards';
import { StatusBreakdownCard } from './StatusBreakdownCard';
import { RecentPullRequests } from './RecentPullRequests';
import { EngineerLeaderboard } from './EngineerLeaderboard';

/**
 * Repository dashboard: overview stats, status/code-volume charts, recent PRs,
 * and the engineer leaderboard. Each section owns its own data + states.
 */
export default function DashboardPage() {
  const { repositoryId = '' } = useParams();
  const { refresh, isRefreshing } = useRefreshDashboard(repositoryId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Overview</h2>
        <Button variant="secondary" onClick={() => void refresh()} loading={isRefreshing}>
          {isRefreshing ? 'Refreshing…' : 'Refresh'}
        </Button>
      </div>

      <StatisticsCards repositoryId={repositoryId} />

      <div className="grid gap-6 lg:grid-cols-2">
        <StatusBreakdownCard repositoryId={repositoryId} />
        <RecentPullRequests repositoryId={repositoryId} />
      </div>

      <EngineerLeaderboard repositoryId={repositoryId} />
    </div>
  );
}
