import { syncReceiptProfile } from './receiptProfiles';
import { syncApi } from '../services/syncApi';
import { shopsApi } from '../services/shopsApi';
import { deviceRepository } from '../db/repositories/deviceRepository';
import { shopRepository } from '../db/repositories/shopRepository';
import { syncMetaRepository } from '../db/repositories/syncMetaRepository';
import { useShopStore } from '../store/shopStore';
import { useSyncStore } from '../store/syncStore';
import { useAuthStore } from '../store/authStore';
import { registerCurrentToken } from '../services/fcmService';
import { applyPullPage, cachePulledProductImages } from './pull';
import { pushAllPending, pushPendingCoinUsage } from './push';
import { queryClient } from '../services/queryClient';
import { entitlementRepository } from '../db/repositories/entitlementRepository';
import { hasSyncEntitlement, isFreeEntitlement } from '../utils/entitlements';
import { useCoinsStore } from '../store/coinsStore';

const sinceKey = (shopId) => `lastSyncSince:${shopId}`;

async function ensureDeviceRegistered(shopId, replaceExisting) {
  const device = deviceRepository.getOrCreate();
  // Registration is shop-scoped on the server, even though the UUID belongs
  // to this installation. Register it for each shop before pull and push.
  await syncApi.registerDevice({
    shopId,
    deviceId: device.deviceId,
    deviceName: 'AsaanKhata device',
    platform: 'android',
    replaceExisting,
  });
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
    await cachePulledProductImages(page.products, shopId);
    // Persist the server cursor after each applied page so retries resume.
    syncMetaRepository.set(key, page.nextSince);
    since = page.nextSince;
    hasMore = page.hasMore;
  }
}

function invalidateShopQueries(shopId) {
  for (const key of ['receiptProfile', 'categories', 'products', 'customers', 'bills', 'expenses', 'stockTransactions', 'salesReport', 'dashboardStats']) {
    queryClient.invalidateQueries({ queryKey: [key, shopId] });
  }
}

// All sync triggers use this entry point. The active shop is only a UI
// selection; every shop owned by the signed-in admin must be reconciled.
function syncFailure(error) {
  const response = error?.response?.data;
  const responseError = typeof response?.error === 'string' ? response.error : null;
  return {
    code: response?.code || responseError || error?.code || 'SYNC_FAILED',
    message: response?.message || responseError || error?.message || 'Cloud sync failed',
  };
}

export async function runSync({ replaceExistingDevices = false } = {}) {
  const { accessToken, adminId } = useAuthStore.getState();
  if (!accessToken || !adminId) return { ok: false, code: 'NOT_AUTHENTICATED', message: 'Sign in to sync' };
  const syncStore = useSyncStore.getState();
  if (syncStore.isSyncing) return { ok: false, code: 'SYNC_IN_PROGRESS', message: 'Cloud sync is already running' };
  syncStore.syncStarted();

  try {
    // Account-level coin usage is reconciled even for offline-only plans.
    await pushPendingCoinUsage();

    // Lifetime Offline remains local-only. Free accounts can sync during the
    // short server unlock opened by manual sync; background triggers quietly
    // skip outside that window instead of producing an expected 402 error.
    const entitlement = entitlementRepository.get();
    if (!hasSyncEntitlement(entitlement)) {
      syncStore.syncFinished(syncStore.lastSyncAt);
      return { ok: true, skipped: true };
    }
    const syncUnlockExpiresAt = useCoinsStore.getState().syncUnlockExpiresAt;
    if (isFreeEntitlement(entitlement) && (!syncUnlockExpiresAt || Date.parse(syncUnlockExpiresAt) <= Date.now())) {
      syncStore.syncFinished(syncStore.lastSyncAt);
      return { ok: true, skipped: true, reason: 'SYNC_UNLOCK_REQUIRED' };
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
        const deviceId = await ensureDeviceRegistered(shopId, replaceExistingDevices);
        await pullAll(deviceId, shopId);
        const profileResult = await syncReceiptProfile(shopId, deviceId);
        await pushAllPending(shopId, deviceId);
        if (profileResult?.conflict) throw new Error('receipt.conflict');
        syncStore.setShopStatus(shopId, 'synced');
      } catch (err) {
        const failure = syncFailure(err);
        failures.push({ shop: shop.name || shopId, ...failure });
        syncStore.setShopStatus(shopId, 'error');
      } finally {
        invalidateShopQueries(shopId);
      }
    }

    if (failures.length) {
      const error = new Error(failures.map((failure) => `${failure.shop}: ${failure.message}`).join('; '));
      error.code = failures.some((failure) => failure.code === 'DEVICE_LIMIT_REACHED')
        ? 'DEVICE_LIMIT_REACHED'
        : failures[0].code;
      throw error;
    }
    deviceRepository.markSynced();
    const syncedAt = new Date().toISOString();
    syncStore.syncFinished(syncedAt);
    return { ok: true, syncedAt };
  } catch (err) {
    const failure = syncFailure(err);
    syncStore.syncFailed(failure.message);
    return { ok: false, ...failure };
  } finally {
    for (const key of ['bill', 'customer', 'product']) {
      queryClient.invalidateQueries({ queryKey: [key] });
    }

    const finalEntitlement = entitlementRepository.get();
    if (isFreeEntitlement(finalEntitlement)) {
      const coinState = useCoinsStore.getState();
      if (typeof coinState.refresh === 'function') {
        await coinState.refresh().catch(() => {});
      }
    }
  }
}
