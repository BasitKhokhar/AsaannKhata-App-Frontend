import { useQuery, useQueryClient } from '@tanstack/react-query';
import { subscriptionsApi } from '../services/subscriptionsApi';
import { entitlementRepository } from '../db/repositories/entitlementRepository';

// Entitlement is always readable instantly from the local cache (critical
// for the offline-first guarantee); this hook opportunistically refreshes
// it from the server when reachable and keeps the cache in sync.
export function useEntitlement() {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ['entitlement'],
    queryFn: async () => {
      try {
        const remote = await subscriptionsApi.me();
        entitlementRepository.save(remote);
        return remote;
      } catch (err) {
        return entitlementRepository.get();
      }
    },
    initialData: () => entitlementRepository.get(),
    staleTime: 60_000,
  });
}

export async function refreshEntitlement(queryClient) {
  const remote = await subscriptionsApi.me();
  entitlementRepository.save(remote);
  queryClient?.invalidateQueries({ queryKey: ['entitlement'] });
  return remote;
}
