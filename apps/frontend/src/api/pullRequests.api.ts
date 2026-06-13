import { api } from '../lib/api';
import type {
  Paginated,
  PullRequestDetail,
  PullRequestStatus,
  PullRequestSummary,
} from '../types/api';

export interface ListPullRequestsParams {
  page?: number;
  pageSize?: number;
  status?: PullRequestStatus;
  authorId?: string;
  search?: string;
  sortBy?: 'number' | 'createdAt' | 'mergedAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export async function fetchPullRequests(
  repositoryId: string,
  params: ListPullRequestsParams = {},
): Promise<Paginated<PullRequestSummary>> {
  const { data } = await api.get<Paginated<PullRequestSummary>>(
    `/repositories/${repositoryId}/pull-requests`,
    { params },
  );
  return data;
}

export async function fetchPullRequest(id: string): Promise<PullRequestDetail> {
  const { data } = await api.get<{ data: PullRequestDetail }>(`/pull-requests/${id}`);
  return data.data;
}
