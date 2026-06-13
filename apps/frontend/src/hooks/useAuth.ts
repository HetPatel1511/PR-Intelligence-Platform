import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { fetchMe, logout } from '../api/auth.api';
import { queryKeys } from '../lib/queryKeys';

/** Current session. A failed request (401) means "not authenticated". */
export function useMe() {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: fetchMe,
    retry: false,
    staleTime: 5 * 60_000,
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear();
      window.location.assign('/login');
    },
  });
}
