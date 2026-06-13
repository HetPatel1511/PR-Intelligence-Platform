import { api } from '../lib/api';
import type { EngineerRef, EngineerWithMetrics } from '../types/api';

export async function fetchRepositoryEngineers(
  repositoryId: string,
): Promise<EngineerWithMetrics[]> {
  const { data } = await api.get<{ data: EngineerWithMetrics[] }>(
    `/repositories/${repositoryId}/engineers`,
  );
  return data.data;
}

export async function fetchEngineer(id: string): Promise<EngineerRef> {
  const { data } = await api.get<{ data: EngineerRef }>(`/engineers/${id}`);
  return data.data;
}
