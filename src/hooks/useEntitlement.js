import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { subscriptionsApi } from '../services/subscriptionsApi';
import { entitlementRepository } from '../db/repositories/entitlementRepository';

// Entitlement is always readable instantly from the local cache (critical
// for the offline-first guarantee); this hook opportunistically refreshes
// it from the server when reachable and keeps the cache in sync.
export function useEntitlement() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['entitlement'],
    queryFn: async () => {
      try {
        const remote = await subscriptionsApi.me();
        return entitlementRepository.save(remote);
      } catch (err) {
        return entitlementRepository.get();
      }
    },
    initialData: () => entitlementRepository.get(),
    staleTime: 60_000,
    refetchOnMount: 'always',
    refetchOnReconnect: true,
    refetchInterval: 5 * 60_000,
    refetchIntervalInBackground: false,
  });

  // Switch the visible entitlement at the exact local expiry time even when
  // the app remains open. The next query refresh then confirms the server's
  // authoritative status and any renewal.
  useEffect(() => {
    const expiry = query.data?.expiryDate ? new Date(query.data.expiryDate).getTime() : NaN;
    if (!Number.isFinite(expiry) || expiry <= Date.now()) return undefined;
    const timer = setTimeout(() => {
      queryClient.setQueryData(['entitlement'], entitlementRepository.get());
      queryClient.invalidateQueries({ queryKey: ['entitlement'] });
    }, Math.max(0, expiry - Date.now() + 50));
    return () => clearTimeout(timer);
  }, [query.data?.expiryDate, queryClient]);

  return query;
}

export async function refreshEntitlement(queryClient) {
  const remote = await subscriptionsApi.me();
  const resolved = entitlementRepository.save(remote);
  queryClient?.setQueryData(['entitlement'], resolved);
  return resolved;
}

// A completed store transaction is not a server entitlement. Reconcile via
// the authenticated backend before updating either the UI or offline cache.
export async function verifyRevenueCatEntitlement(queryClient) {
  const result = await subscriptionsApi.verify();
  if (!result?.entitlement) throw new Error('Subscription verification returned no entitlement');
  const resolved = entitlementRepository.save(result.entitlement);
  queryClient?.setQueryData(['entitlement'], resolved);
  return resolved;
}
