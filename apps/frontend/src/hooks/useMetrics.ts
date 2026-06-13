import { useQuery } from '@tanstack/react-query';

import {
  fetchDashboardSummary,
  fetchEngineerMetrics,
  fetchPullRequestMetrics,
} from '../api/metrics.api';
import { queryKeys } from '../lib/queryKeys';

export function useDashboardSummary(repositoryId: string) {
  return useQuery({
    queryKey: queryKeys.dashboardSummary(repositoryId),
    queryFn: () => fetchDashboardSummary(repositoryId),
    enabled: Boolean(repositoryId),
  });
}

export function usePullRequestMetrics(repositoryId: string) {
  return useQuery({
    queryKey: queryKeys.pullRequestMetrics(repositoryId),
    queryFn: () => fetchPullRequestMetrics(repositoryId),
    enabled: Boolean(repositoryId),
  });
}

export function useEngineerMetrics(repositoryId: string) {
  return useQuery({
    queryKey: queryKeys.engineerMetrics(repositoryId),
    queryFn: () => fetchEngineerMetrics(repositoryId),
    enabled: Boolean(repositoryId),
  });
}
