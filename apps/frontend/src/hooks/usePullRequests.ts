import { keepPreviousData, useQuery } from '@tanstack/react-query';

import {
  fetchPullRequest,
  fetchPullRequests,
  type ListPullRequestsParams,
} from '../api/pullRequests.api';
import { queryKeys } from '../lib/queryKeys';

export function usePullRequests(repositoryId: string, params: ListPullRequestsParams = {}) {
  return useQuery({
    queryKey: queryKeys.pullRequests(repositoryId, params),
    queryFn: () => fetchPullRequests(repositoryId, params),
    enabled: Boolean(repositoryId),
    placeholderData: keepPreviousData, // smooth page/filter transitions
  });
}

export function usePullRequest(id: string) {
  return useQuery({
    queryKey: queryKeys.pullRequest(id),
    queryFn: () => fetchPullRequest(id),
    enabled: Boolean(id),
  });
}
