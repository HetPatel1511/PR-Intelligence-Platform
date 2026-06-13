import { api } from '../lib/api';
import type { DashboardSummary, EngineerMetrics, PullRequestMetrics } from '../types/api';

export async function fetchDashboardSummary(repositoryId: string): Promise<DashboardSummary> {
  const { data } = await api.get<{ data: DashboardSummary }>(
    `/repositories/${repositoryId}/metrics/summary`,
  );
  return data.data;
}

export async function fetchPullRequestMetrics(repositoryId: string): Promise<PullRequestMetrics[]> {
  const { data } = await api.get<{ data: PullRequestMetrics[] }>(
    `/repositories/${repositoryId}/metrics/pull-requests`,
  );
  return data.data;
}

export async function fetchEngineerMetrics(repositoryId: string): Promise<EngineerMetrics[]> {
  const { data } = await api.get<{ data: EngineerMetrics[] }>(
    `/repositories/${repositoryId}/metrics/engineers`,
  );
  return data.data;
}
