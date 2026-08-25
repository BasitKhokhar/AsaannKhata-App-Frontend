import { useQuery } from '@tanstack/react-query';
import { syncApi } from '../services/syncApi';

// GET /sync/status returns ONLY an aggregate: { cloudEnabled, maxDevices,
// activeDeviceCount, tier, serverTime }. There is no per-device list
// endpoint (no device names/platforms/last-seen) — do not build UI that
// implies otherwise.
export function useSyncStatus() {
  return useQuery({
    queryKey: ['syncStatus'],
    queryFn: syncApi.status,
    staleTime: 30_000,
  });
}
