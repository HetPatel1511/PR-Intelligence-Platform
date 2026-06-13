import { api } from '../lib/api';
import type { Paginated, Repository, SyncResult } from '../types/api';

export interface ListRepositoriesParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: 'fullName' | 'lastSyncedAt' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export async function fetchRepositories(
  params: ListRepositoriesParams = {},
): Promise<Paginated<Repository>> {
  const { data } = await api.get<Paginated<Repository>>('/repositories', { params });
  return data;
}

export async function fetchRepository(id: string): Promise<Repository> {
  const { data } = await api.get<{ data: Repository }>(`/repositories/${id}`);
  return data.data;
}

/** Refresh the connected repository list from GitHub. */
export async function syncRepositories(): Promise<Repository[]> {
  const { data } = await api.post<{ data: Repository[] }>('/repositories/sync');
  return data.data;
}

/** Trigger a historical pull-request sync for one repository. */
export async function syncRepositoryPullRequests(id: string): Promise<SyncResult> {
  const { data } = await api.post<{ data: SyncResult }>(`/repositories/${id}/sync`);
  return data.data;
}
