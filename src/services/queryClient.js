import { QueryClient } from '@tanstack/react-query';

// Shared by the provider and the sync engine, which runs outside React.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});
