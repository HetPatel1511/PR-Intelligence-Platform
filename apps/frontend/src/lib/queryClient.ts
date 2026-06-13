import { QueryClient } from '@tanstack/react-query';

/** Single TanStack Query client with sensible MVP defaults. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
