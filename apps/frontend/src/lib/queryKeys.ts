import type { ListPullRequestsParams } from '../api/pullRequests.api';
import type { ListRepositoriesParams } from '../api/repositories.api';

/** Centralized query keys so invalidation stays consistent across hooks. */
export const queryKeys = {
  me: ['me'] as const,
  repositories: (params?: ListRepositoriesParams) => ['repositories', params ?? {}] as const,
  repository: (id: string) => ['repository', id] as const,
  pullRequests: (repositoryId: string, params?: ListPullRequestsParams) =>
    ['pullRequests', repositoryId, params ?? {}] as const,
  pullRequest: (id: string) => ['pullRequest', id] as const,
  engineers: (repositoryId: string) => ['engineers', repositoryId] as const,
  engineer: (id: string) => ['engineer', id] as const,
  metrics: (repositoryId: string) => ['metrics', repositoryId] as const,
  dashboardSummary: (repositoryId: string) => ['metrics', repositoryId, 'summary'] as const,
  pullRequestMetrics: (repositoryId: string) => ['metrics', repositoryId, 'pull-requests'] as const,
  engineerMetrics: (repositoryId: string) => ['metrics', repositoryId, 'engineers'] as const,
};
