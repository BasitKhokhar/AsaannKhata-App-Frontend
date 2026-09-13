import { apiClient } from './apiClient';

// Axios wrapper for the ads + reward-coins economy backend — mirrors the
// shape of subscriptionsApi/syncApi. Endpoints are unauthenticated-shop-scope
// (no X-Device-Id needed, unlike src/services/syncApi.js's push/pull calls)
// since a coin balance belongs to the account, not a device or shop.
export const adsApi = {
  getConfig: () => apiClient.get('/ads/config').then((r) => r.data),
  reportAdReward: () => apiClient.post('/ads/reward', {}).then((r) => r.data),
  unlockSync: () => apiClient.post('/ads/sync/unlock', {}).then((r) => r.data),
  syncCoinUsage: (operations) => apiClient.post('/ads/coin-usage/sync', { operations }).then((r) => r.data),
};
