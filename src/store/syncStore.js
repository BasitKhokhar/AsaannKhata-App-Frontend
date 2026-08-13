import { create } from 'zustand';

// Live sync engine state — read by the Sync Status screen and any small
// "syncing…" indicators elsewhere. Not persisted; recomputed each run.
export const useSyncStore = create((set) => ({
  isSyncing: false,
  lastSyncAt: null,
  lastError: null,
  pendingCount: 0,
  perShopStatus: {}, // { [shopId]: 'synced' | 'syncing' | 'queued' | 'error' }

  syncStarted: () => set({ isSyncing: true, lastError: null }),
  syncFinished: (lastSyncAt) => set({ isSyncing: false, lastSyncAt }),
  syncFailed: (lastError) => set({ isSyncing: false, lastError }),
  setPendingCount: (pendingCount) => set({ pendingCount }),
  setShopStatus: (shopId, status) =>
    set((s) => ({ perShopStatus: { ...s.perShopStatus, [shopId]: status } })),
}));
