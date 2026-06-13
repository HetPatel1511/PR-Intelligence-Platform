import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

/**
 * Refetches the dashboard's data (metrics, pull requests, engineers) for a
 * repository from the backend — a fast refresh of what's displayed, without the
 * heavier GitHub sync. `isRefreshing` stays true until the refetches settle.
 */
export function useRefreshDashboard(repositoryId: string) {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    if (!repositoryId) return;
    setIsRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['metrics', repositoryId] }),
        queryClient.invalidateQueries({ queryKey: ['pullRequests', repositoryId] }),
        queryClient.invalidateQueries({ queryKey: ['engineers', repositoryId] }),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient, repositoryId]);

  return { refresh, isRefreshing };
}
