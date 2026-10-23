import { syncApi } from '../services/syncApi';
import { deviceRepository } from '../db/repositories/deviceRepository';
import { entitlementRepository } from '../db/repositories/entitlementRepository';
import { syncMetaRepository } from '../db/repositories/syncMetaRepository';
import { useShopStore } from '../store/shopStore';
import { useSyncStore } from '../store/syncStore';
import { useCoinsStore } from '../store/coinsStore';
import { useAuthStore } from '../store/authStore';
import { registerCurrentToken } from '../services/fcmService';
import { applyPullPage } from './pull';
import { pushAllPending, pushPendingCoinUsage } from './push';
import { queryClient } from '../services/queryClient';

const sinceKey = (shopId) => `lastSyncSince:${shopId}`;

async function ensureDeviceRegistered() {
  const device = deviceRepository.getOrCreate();
  // Registration is shop-scoped on the server. Repeating the upsert is safe
  // and covers switching to a shop this install has never synced before.
  await syncApi.registerDevice({ deviceId: device.deviceId, deviceName: 'AsaanKhata device', platform: 'android' });
  deviceRepository.markRegistered({ platform: 'android' });
  registerCurrentToken().catch(() => {});
  return device.deviceId;
}

async function pullAll(deviceId, shopId) {
  const key = sinceKey(shopId);
  let since = syncMetaRepository.get(key) || undefined;
  let hasMore = true;
  while (hasMore) {
    const page = await syncApi.pull({ since, deviceId });
    if (!page.nextSince || (page.hasMore && page.nextSince === since)) {
      throw new Error('Sync pull did not advance its cursor');
    }
    applyPullPage(page);
    // Persisted after every page, not just at the end — crash-safe, and
    // never derived from the device's own clock (server-issued watermark).
    syncMetaRepository.set(key, page.nextSince);
    since = page.nextSince;
    hasMore = page.hasMore;
  }
}

// The single entry point for all sync triggers (foreground, reconnect,
// interval, manual "Sync Now") — see src/sync/triggers.js.
export async function runSync() {
  if (!useAuthStore.getState().accessToken) return;
  const { activeShopId } = useShopStore.getState();
  const entitlement = entitlementRepository.get();
  const unlockExpiresAt = useCoinsStore.getState().syncUnlockExpiresAt;
  const hasSyncAccess = entitlement?.cloudEnabled || (unlockExpiresAt && Date.parse(unlockExpiresAt) > Date.now());
  const syncStore = useSyncStore.getState();

  // Coin-usage reconciliation runs for every tier, even when cloud sync is
  // locked — unlike everything below this line, it is NOT gated by
  // cloudEnabled/sync-quota, because a free-tier user must always be able to
  // true up their ad-coin balance once they're back online. It's a no-op
  // (and never throws) when there's nothing pending or no connectivity.
  await pushPendingCoinUsage();

  // FREE_TRIAL/LIFETIME tenants never call /sync/* at all — no needless
  // 403s, and offline-only tiers generate zero sync network traffic.
  if (!activeShopId || !hasSyncAccess) return;
  if (syncStore.isSyncing) return;

  syncStore.syncStarted();
  syncStore.setShopStatus(activeShopId, 'syncing');
  try {
    const deviceId = await ensureDeviceRegistered();
    await pullAll(deviceId, activeShopId);
    await pushAllPending(activeShopId, deviceId);
    deviceRepository.markSynced();
    syncStore.syncFinished(new Date().toISOString());
    syncStore.setShopStatus(activeShopId, 'synced');
  } catch (err) {
    syncStore.syncFailed(err.message);
    syncStore.setShopStatus(activeShopId, 'error');
  } finally {
    // Pull and reconciliation write directly to SQLite, including when a
    // later push fails. Refresh visible data from the committed local rows.
    for (const key of ['categories', 'products', 'customers', 'bills', 'expenses', 'stockTransactions', 'salesReport', 'dashboardStats']) {
      queryClient.invalidateQueries({ queryKey: [key, activeShopId] });
    }
    for (const key of ['bill', 'customer', 'product']) {
      queryClient.invalidateQueries({ queryKey: [key] });
    }
  }
}
