import { apiClient } from './apiClient';

export const subscriptionsApi = {
  plans: () => apiClient.get('/subscriptions/plans').then((r) => r.data), // public
  me: () => apiClient.get('/subscriptions/me').then((r) => r.data),
  history: () => apiClient.get('/subscriptions/my-history').then((r) => r.data),
  // Reconciliation fallback — call after any RevenueCat purchase/restore in
  // case the server-to-server webhook hasn't landed yet.
  verify: () => apiClient.post('/subscriptions/verify').then((r) => r.data),
};
