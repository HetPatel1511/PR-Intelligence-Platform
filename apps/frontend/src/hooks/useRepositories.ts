import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  fetchRepositories,
  fetchRepository,
  syncRepositories,
  syncRepositoryPullRequests,
  type ListRepositoriesParams,
} from '../api/repositories.api';
import { queryKeys } from '../lib/queryKeys';
import { recordSync } from '../lib/syncTimestamps';

export function useRepositories(params: ListRepositoriesParams = {}) {
  return useQuery({
    queryKey: queryKeys.repositories(params),
    queryFn: () => fetchRepositories(params),
  });
}

export function useRepository(id: string) {
  return useQuery({
    queryKey: queryKeys.repository(id),
    queryFn: () => fetchRepository(id),
    enabled: Boolean(id),
  });
}

/** Refresh the repo list from GitHub. */
export function useSyncRepositories() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: syncRepositories,
    onSuccess: () => {
      recordSync('repositories');
      queryClient.invalidateQueries({ queryKey: ['repositories'] });
    },
  });
}

/** Historical PR sync for one repo; refreshes all of its derived data. */
export function useSyncRepositoryPullRequests(repositoryId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => syncRepositoryPullRequests(repositoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pullRequests', repositoryId] });
      queryClient.invalidateQueries({ queryKey: ['engineers', repositoryId] });
      queryClient.invalidateQueries({ queryKey: ['metrics', repositoryId] });
      queryClient.invalidateQueries({ queryKey: queryKeys.repository(repositoryId) });
    },
  });
}
