import { useMutation } from '@tanstack/react-query';
import { authApi } from '../services/authApi';
import { subscriptionsApi } from '../services/subscriptionsApi';
import { useAuthStore } from '../store/authStore';
import { useShopStore } from '../store/shopStore';
import * as secureSession from '../services/secureSession';
import { shopRepository } from '../db/repositories/shopRepository';
import { entitlementRepository } from '../db/repositories/entitlementRepository';
import { loginRevenueCat } from '../services/revenueCat';
import { setAnalyticsUserId } from '../services/analyticsService';
import { useCoinsStore } from '../store/coinsStore';

// Shared by both login and register success paths: persist the session,
// cache shops/entitlement locally so the app has them offline, and hand off
// to RevenueCat so app_user_id == backend adminId (see services/revenueCat.js).
async function establishSession(data) {
  await useCoinsStore.persist.rehydrate();
  entitlementRepository.clear();
  useCoinsStore.getState().setOwner(data.adminId);
  useAuthStore.getState().setSession(data);
  await secureSession.saveSession(data);
  setAnalyticsUserId(data.adminId);

  if (data.shops?.length) {
    shopRepository.upsertMany(data.shops);
    const { activeShopId, setActiveShopId } = useShopStore.getState();
    const stillOwned = data.shops.some((s) => String(s.id) === String(activeShopId));
    if (!activeShopId || !stillOwned) {
      setActiveShopId(String(data.shops[0].id));
    }
  } else {
    useShopStore.getState().setActiveShopId(null);
  }

  if (data.entitlement) {
    entitlementRepository.save(data.entitlement);
  }

  try {
    await loginRevenueCat(data.adminId);
  } catch (err) {
    // Non-fatal — RevenueCat may not be configured yet (placeholder keys).
    // The app must keep working fully offline-first regardless.
    // Dev-only log: avoid printing auth/purchase-related error details in production builds.
    if (__DEV__) console.warn('RevenueCat logIn failed:', err.message);
  }
}

export function useLoginMutation() {
  return useMutation({
    mutationFn: (payload) => authApi.login(payload),
    onSuccess: establishSession,
  });
}

export function useRegisterMutation() {
  return useMutation({
    mutationFn: (payload) => authApi.register(payload),
    onSuccess: async (data) => {
      await establishSession(data);

      // POST /auth/admin/register returns a single `shop`, not `shops`/
      // `entitlement` like login does — fetch entitlement fresh and cache
      // the newly created shop the same way login caches its shop list.
      if (data.shop) {
        shopRepository.upsertMany([data.shop]);
        useShopStore.getState().setActiveShopId(String(data.shop.id));
      }
      try {
        const entitlement = await subscriptionsApi.me();
        entitlementRepository.save(entitlement);
      } catch (err) {
        // Dev-only log: avoid printing account/entitlement error details in production builds.
        if (__DEV__) console.warn('Failed to fetch entitlement after register:', err.message);
      }
    },
  });
}
