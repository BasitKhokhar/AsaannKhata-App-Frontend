import { syncApi } from '../services/syncApi';
import { shopsApi } from '../services/shopsApi';
import { deviceRepository } from '../db/repositories/deviceRepository';
import { shopRepository } from '../db/repositories/shopRepository';
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

async function ensureDeviceRegistered(shopId) {
  const device = deviceRepository.getOrCreate();
  // Registration is shop-scoped on the server, even though the UUID belongs
  // to this installation. Register it for each shop before pull and push.
  await syncApi.registerDevice({ shopId, deviceId: device.deviceId, deviceName: 'AsaanKhata device', platform: 'android' });
  deviceRepository.markRegistered({ platform: 'android' });
  if (String(useShopStore.getState().activeShopId) === String(shopId)) registerCurrentToken().catch(() => {});
  return device.deviceId;
}

async function pullAll(deviceId, shopId) {
  const key = sinceKey(shopId);
  let since = syncMetaRepository.get(key) || undefined;
  let hasMore = true;
  while (hasMore) {
    const page = await syncApi.pull({ shopId, since, deviceId });
    if (!page.nextSince || (page.hasMore && page.nextSince === since)) {
      throw new Error('Sync pull did not advance its cursor');
    }
    applyPullPage(page, shopId);
    // Persist the server cursor after each applied page so retries resume.
    syncMetaRepository.set(key, page.nextSince);
    since = page.nextSince;
    hasMore = page.hasMore;
  }
}

function invalidateShopQueries(shopId) {
  for (const key of ['categories', 'products', 'customers', 'bills', 'expenses', 'stockTransactions', 'salesReport', 'dashboardStats']) {
    queryClient.invalidateQueries({ queryKey: [key, shopId] });
  }
}

// All sync triggers use this entry point. The active shop is only a UI
// selection; every shop owned by the signed-in admin must be reconciled.
export async function runSync() {
  const { accessToken, adminId } = useAuthStore.getState();
  if (!accessToken || !adminId) return;
  const syncStore = useSyncStore.getState();
  if (syncStore.isSyncing) return;
  syncStore.syncStarted();

  try {
    // Account-level coin usage is reconciled even for offline-only plans.
    await pushPendingCoinUsage();

    const entitlement = entitlementRepository.get();
    const unlockExpiresAt = useCoinsStore.getState().syncUnlockExpiresAt;
    const hasSyncAccess = entitlement?.cloudEnabled || (unlockExpiresAt && Date.parse(unlockExpiresAt) > Date.now());
    if (!hasSyncAccess) {
      syncStore.syncFinished(syncStore.lastSyncAt);
      return;
    }

    // The server is authoritative for which shops this admin owns. A cached
    // shop from a previous account must never be used to send pending rows.
    const shops = await shopsApi.list();
    if (String(useAuthStore.getState().adminId) !== String(adminId)) throw new Error('Account changed during sync');
    shopRepository.upsertMany(shops);
    queryClient.invalidateQueries({ queryKey: ['shops', adminId] });

    const activeShopId = useShopStore.getState().activeShopId;
    const ordered = [...shops].sort((a, b) =>
      Number(String(b.id) === String(activeShopId)) - Number(String(a.id) === String(activeShopId))
    );
    const failures = [];
    for (const shop of ordered) {
      if (String(useAuthStore.getState().adminId) !== String(adminId)) throw new Error('Account changed during sync');
      const shopId = String(shop.id);
      syncStore.setShopStatus(shopId, 'syncing');
      try {
        const deviceId = await ensureDeviceRegistered(shopId);
        await pullAll(deviceId, shopId);
        await pushAllPending(shopId, deviceId);
        syncStore.setShopStatus(shopId, 'synced');
      } catch (err) {
        failures.push(`${shop.name || shopId}: ${err.message}`);
        syncStore.setShopStatus(shopId, 'error');
      } finally {
        invalidateShopQueries(shopId);
      }
    }

    if (failures.length) throw new Error(failures.join('; '));
    deviceRepository.markSynced();
    syncStore.syncFinished(new Date().toISOString());
  } catch (err) {
    syncStore.syncFailed(err.message);
  } finally {
    for (const key of ['bill', 'customer', 'product']) {
      queryClient.invalidateQueries({ queryKey: [key] });
    }
  }
}
