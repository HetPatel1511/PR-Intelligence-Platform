import { useQuery } from '@tanstack/react-query';

import { fetchEngineer, fetchRepositoryEngineers } from '../api/engineers.api';
import { queryKeys } from '../lib/queryKeys';

export function useRepositoryEngineers(repositoryId: string) {
  return useQuery({
    queryKey: queryKeys.engineers(repositoryId),
    queryFn: () => fetchRepositoryEngineers(repositoryId),
    enabled: Boolean(repositoryId),
  });
}

export function useEngineer(id: string) {
  return useQuery({
    queryKey: queryKeys.engineer(id),
    queryFn: () => fetchEngineer(id),
    enabled: Boolean(id),
  });
}
