import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { adsApi } from '../services/adsApi';

const MAX_REWARDED_ADS_PER_DAY = 10;

// Local cache of GET /ads/config plus this device's own rewarded-ad pacing
// counters — persisted so the coin balance and "Daily usage" numbers are
// readable instantly offline (same offline-first guarantee as
// entitlementCache/src/db/repositories/entitlementRepository.js). Only the
// refresh/earn/spend actions themselves need connectivity.
export const useCoinsStore = create(
  persist(
    (set, get) => ({
      ownerAdminId: null,
      adCoins: 0,
      adsWatchedToday: 0,
      adsRemainingToday: 0,
      maxRewardAdsPerDay: 0,
      syncCoinCost: 0,
      freeDailyRecordLimit: 0,
      billCoinCost: 1,
      billsUsedToday: 0,
      syncUnlockExpiresAt: null,
      rewardAdCoinValue: 0,
      cloudEnabled: false,

      setOwner: (adminId) => set((state) => {
        if (String(state.ownerAdminId) === String(adminId)) return {};
        return {
          ownerAdminId: adminId,
          adCoins: 0,
          adsWatchedToday: 0,
          adsRemainingToday: 0,
          maxRewardAdsPerDay: 0,
          syncCoinCost: 0,
          freeDailyRecordLimit: 0,
          billCoinCost: 1,
          billsUsedToday: 0,
          syncUnlockExpiresAt: null,
          rewardAdCoinValue: 0,
          cloudEnabled: false,
          consecutiveRewardedAds: 0,
          rewardedCooldownUntil: null,
          lastInterstitialShownAt: 0,
        };
      }),

      // Local-only anti-farming pacing (never sent to/read from the
      // backend) — see showRewardedAd()'s batch cooldown in adsService.js.
      consecutiveRewardedAds: 0,
      rewardedCooldownUntil: null,
      lastInterstitialShownAt: 0,

      // Pulls the authoritative snapshot from the server. Call on Dashboard
      // mount/focus and after EarnCoins actions; safe to call while offline —
      // callers should let the request fail and keep showing cached values.
      refresh: async () => {
        const config = await adsApi.getConfig();
        const watchedToday = Math.max(0, config.adsWatchedToday ?? 0);
        const serverDailyCap = Math.max(0, config.maxRewardAdsPerDay ?? MAX_REWARDED_ADS_PER_DAY);
        const dailyCap = Math.min(MAX_REWARDED_ADS_PER_DAY, serverDailyCap);
        set({
          adCoins: config.adCoins ?? 0,
          adsWatchedToday: watchedToday,
          adsRemainingToday: Math.min(config.adsRemainingToday ?? 0, Math.max(0, dailyCap - watchedToday)),
          maxRewardAdsPerDay: dailyCap,
          syncCoinCost: config.syncCoinCost ?? 0,
          freeDailyRecordLimit: config.freeDailyRecordLimit ?? 0,
          billCoinCost: config.billCoinCost ?? get().billCoinCost,
          billsUsedToday: config.billsUsedToday ?? 0,
          syncUnlockExpiresAt: config.syncUnlockExpiresAt ?? null,
          rewardAdCoinValue: config.rewardAdCoinValue ?? 0,
          cloudEnabled: !!config.cloudEnabled,
        });
        return config;
      },

      // Merges the response from POST /ads/reward — the only place adCoins
      // is allowed to increase, and only ever called after the SDK's real
      // EARNED_REWARD event (see adsService.showRewardedAd — never award
      // coins client-side without that round trip).
      applyRewardResult: (payload) =>
        set((state) => {
          const watchedToday = payload.adsWatchedToday ?? state.adsWatchedToday;
          return {
            adCoins: payload.adCoins ?? state.adCoins,
            adsWatchedToday: watchedToday,
            adsRemainingToday: Math.min(
              payload.adsRemainingToday ?? state.adsRemainingToday,
              Math.max(0, Math.min(MAX_REWARDED_ADS_PER_DAY, state.maxRewardAdsPerDay || MAX_REWARDED_ADS_PER_DAY) - watchedToday)
            ),
          };
        }),

      // Merges the response from POST /ads/sync/unlock.
      applyUnlockResult: (payload) =>
        set({
          adCoins: payload.adCoins ?? get().adCoins,
          syncUnlockExpiresAt: payload.syncUnlockExpiresAt ?? get().syncUnlockExpiresAt,
        }),

      // Optimistic local decrement for a bill created OFFLINE on the free
      // tier — see useCreateBill in src/hooks/useBills.js. Reconciled with
      // the server's authoritative balance by pushPendingCoinUsage() once
      // connectivity returns (src/sync/push.js).
      spendCoinsOptimistic: (amount) =>
        set((s) => ({
          adCoins: Math.max(0, s.adCoins - amount),
          billsUsedToday: s.billsUsedToday + 1,
        })),

      recordFreeBillOptimistic: () => set((state) => ({ billsUsedToday: state.billsUsedToday + 1 })),

      setRewardedPacing: (patch) => set(patch),
      setLastInterstitialShownAt: (timestamp) => set({ lastInterstitialShownAt: timestamp }),
    }),
    {
      name: 'asaankhata-coins',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
