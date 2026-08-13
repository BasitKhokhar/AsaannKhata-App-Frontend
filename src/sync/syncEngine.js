import { syncApi } from '../services/syncApi';
import { deviceRepository } from '../db/repositories/deviceRepository';
import { entitlementRepository } from '../db/repositories/entitlementRepository';
import { syncMetaRepository } from '../db/repositories/syncMetaRepository';
import { useShopStore } from '../store/shopStore';
import { useSyncStore } from '../store/syncStore';
import { applyPullPage } from './pull';
import { pushAllPending } from './push';

const SINCE_KEY = 'lastSyncSince';

async function ensureDeviceRegistered(maxDevices) {
  const device = deviceRepository.getOrCreate();
  if (device.registered) return device.deviceId;

  await syncApi.registerDevice({ deviceId: device.deviceId, deviceName: 'AsaanKhata device', platform: 'android' });
  deviceRepository.markRegistered({ platform: 'android' });
  return device.deviceId;
}

async function pullAll(deviceId) {
  let since = syncMetaRepository.get(SINCE_KEY) || undefined;
  let hasMore = true;
  while (hasMore) {
    const page = await syncApi.pull({ since, deviceId });
    applyPullPage(page);
    // Persisted after every page, not just at the end — crash-safe, and
    // never derived from the device's own clock (server-issued watermark).
    syncMetaRepository.set(SINCE_KEY, page.nextSince);
    since = page.nextSince;
    hasMore = page.hasMore;
  }
}

// The single entry point for all sync triggers (foreground, reconnect,
// interval, manual "Sync Now") — see src/sync/triggers.js.
export async function runSync() {
  const { activeShopId } = useShopStore.getState();
  const entitlement = entitlementRepository.get();
  const syncStore = useSyncStore.getState();

  // FREE_TRIAL/LIFETIME tenants never call /sync/* at all — no needless
  // 403s, and offline-only tiers generate zero sync network traffic.
  if (!activeShopId || !entitlement?.cloudEnabled) return;
  if (syncStore.isSyncing) return;

  syncStore.syncStarted();
  syncStore.setShopStatus(activeShopId, 'syncing');
  try {
    const deviceId = await ensureDeviceRegistered(entitlement.maxDevices);
    await pullAll(deviceId);
    await pushAllPending(activeShopId, deviceId);
    deviceRepository.markSynced();
    syncStore.syncFinished(new Date().toISOString());
    syncStore.setShopStatus(activeShopId, 'synced');
  } catch (err) {
    syncStore.syncFailed(err.message);
    syncStore.setShopStatus(activeShopId, 'error');
  }
}
